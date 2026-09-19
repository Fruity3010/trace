// The TRACE intelligence engine. Web, partner API and WhatsApp all call this;
// no channel computes risk on its own. Scores, counts, thresholds, duplicate
// handling and report acceptance are deterministic application code — the AI
// only supplies the wording and category of a report.
import { createHmac, randomInt } from 'node:crypto';
import { db, secret } from './db';
import {
  ago, Bank, CATEGORIES, Category, Channel, Classification, DAY, daysAgo, Factor, findBank, Intelligence,
  MyReport, ReportStatus, riskFor,
} from './shared';

type ReportRow = {
  id: string; account_number: string; bank: string | null; category: Category; severity: string; summary: string;
  tags: string; evidence_count: number; reporter: string; status: ReportStatus; status_reason: string | null;
  sample: number; created_at: string; region: string | null;
};

const LIMITS = { perReporterPerDay: 5, duplicateWindowDays: 30 };

/** One-way reporter key. Raw device IDs and phone numbers are never stored. */
export function reporterKey(kind: 'device' | 'phone' | 'ip', raw: string): string {
  return createHmac('sha256', secret()).update(`${kind}:${raw.trim()}`).digest('hex').slice(0, 32);
}

const since = (days: number) => new Date(Date.now() - days * DAY).toISOString();

function words(s: string) {
  return new Set(s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((w) => w.length > 3));
}

/** Reports whose summary shares at least half its words with another report on the same account. */
function similarCount(rows: ReportRow[]): number {
  // ponytail: O(n²) Jaccard over one account's reports; fine below a few hundred reports per account.
  const sets = rows.map((r) => words(r.summary));
  return sets.filter((a, i) => sets.some((b, j) => {
    if (i === j || !a.size || !b.size) return false;
    let inter = 0;
    for (const w of a) if (b.has(w)) inter++;
    return inter / (a.size + b.size - inter) >= 0.5;
  })).length;
}

function countBy(xs: string[]): [string, number][] {
  const m = new Map<string, number>();
  for (const x of xs) m.set(x, (m.get(x) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

function score(rows: ReportRow[]) {
  const perReporter = new Map<string, number>();
  for (const r of rows) perReporter.set(r.reporter, (perReporter.get(r.reporter) ?? 0) + 1);
  const unique = perReporter.size;
  // A single reporter contributes at most two reports to volume.
  const counted = [...perReporter.values()].reduce((s, c) => s + Math.min(c, 2), 0);
  const evidence = rows.filter((r) => r.evidence_count > 0).length;
  const similar = similarCount(rows);
  const top = countBy(rows.map((r) => r.category))[0]?.[1] ?? 0;
  const share = rows.length ? top / rows.length : 0;
  const pattern = unique >= 3 && share >= 0.6 ? 'strong' : unique >= 2 && share >= 0.4 ? 'moderate' : 'none';
  const last = rows.length ? Math.min(...rows.map((r) => daysAgo(r.created_at))) : Infinity;
  const s = (x: number, one: string, many = `${one}s`) => `${x} ${x === 1 ? one : many}`;

  const factors: Factor[] = [
    { key: 'volume', label: 'Report volume', detail: s(rows.length, 'community report'), points: Math.min(counted, 20) * 1.5, max: 30 },
    { key: 'reporters', label: 'Unique reporters', detail: s(unique, 'unique reporter'), points: Math.min((unique * 4) / 3, 20), max: 20 },
    { key: 'evidence', label: 'Supporting evidence', detail: `${s(evidence, 'report')} include supporting evidence`, points: Math.min(evidence, 10) * 1.5, max: 15 },
    { key: 'pattern', label: 'Pattern corroboration', detail: pattern === 'none' ? 'No corroborated pattern' : `${pattern === 'strong' ? 'Strong' : 'Moderate'} pattern across independent reporters`, points: pattern === 'strong' ? 15 : pattern === 'moderate' ? 8 : 0, max: 15 },
    { key: 'recency', label: 'Recency', detail: last <= 7 ? 'Recent activity detected' : last <= 30 ? 'Activity in the last 30 days' : rows.length ? 'No recent activity' : 'No activity', points: last <= 7 ? 10 : last <= 30 ? 6 : last <= 90 ? 3 : 0, max: 10 },
    { key: 'consistency', label: 'Report consistency', detail: `${s(similar, 'report')} contain similar descriptions`, points: Math.min(similar, 10), max: 10 },
  ];
  let total = Math.round(factors.reduce((sum, f) => sum + f.points, 0));
  // Corroboration rule: one person alone can never raise an account above LOW,
  // and two people alone never to HIGH.
  if (unique < 2) total = Math.min(total, 29);
  else if (unique < 3) total = Math.min(total, 69);
  return { score: Math.min(100, total), factors, unique, evidence, similar };
}

function accountRows(number: string, bank: Bank | null): ReportRow[] {
  return (bank
    ? db().prepare("SELECT * FROM reports WHERE account_number = ? AND status = 'added' AND (bank = ? OR bank IS NULL)").all(number, bank)
    : db().prepare("SELECT * FROM reports WHERE account_number = ? AND status = 'added'").all(number)) as ReportRow[];
}

const COPY = {
  HIGH: 'This account has a high-risk signal based on available reports.',
  MEDIUM: 'Some reports have been associated with this account.',
  LOW: 'No significant reports found.',
};

function intelligence(number: string, bank: Bank | null, rows: ReportRow[]): Intelligence {
  const s = score(rows);
  const risk = riskFor(s.score);
  const cats = countBy(rows.map((r) => r.category));
  const tags = countBy(rows.flatMap((r) => JSON.parse(r.tags) as string[]));
  const dates = rows.map((r) => r.created_at).sort();
  const last = dates.at(-1) ?? null;
  const topCat = cats[0] ? CATEGORIES[cats[0][0] as Category] : '';

  return {
    bank: bank ?? findBank(rows.find((r) => r.bank)?.bank),
    accountNumber: number,
    risk,
    score: s.score,
    reports: rows.length,
    uniqueReporters: s.unique,
    evidenceCount: s.evidence,
    similarDescriptions: s.similar,
    categories: cats.map(([c]) => c as Category),
    patterns: [...cats.map(([c, count]) => ({ label: CATEGORIES[c as Category], count })), ...tags.map(([label, count]) => ({ label, count }))]
      .sort((a, b) => b.count - a.count).slice(0, 4),
    firstReported: dates[0] ?? null,
    lastReported: last,
    lastReportedAgo: last ? ago(last) : null,
    recommendation: risk === 'HIGH' ? 'WARN' : risk === 'MEDIUM' ? 'CAUTION' : 'NONE',
    headline: COPY[risk],
    explanation: risk === 'HIGH'
      ? `Multiple independent reports are associated with this account. Several reports describe similar ${topCat.toLowerCase().replace(/ (fraud|scam|service)$/, '')}-related payment issues.`
      : risk === 'MEDIUM'
        ? 'Review the information before sending money.'
        : rows.length
          ? `${rows.length} report${rows.length === 1 ? '' : 's'} found — not enough independent reports for a risk signal. Always verify before you pay.`
          : 'This does not guarantee the recipient is legitimate. Always verify before you pay.',
    factors: s.factors,
    disclaimer: 'TRACE provides a risk signal based on community reports. A report is not proof that an account owner committed fraud.',
    disputed: !!db().prepare("SELECT 1 FROM disputes WHERE account_number = ? AND status = 'open'").get(number),
    sampleData: rows.some((r) => r.sample === 1),
    checkedAt: new Date().toISOString(),
  };
}

/** The same intelligence as checkAccount, without counting it as a check (for re-rendering a case). */
export function peekAccount(bank: Bank | null, number: string): Intelligence {
  return intelligence(number, bank, accountRows(number, bank));
}

export function checkAccount(bank: Bank | null, number: string, channel: Channel): Intelligence {
  const result = intelligence(number, bank, accountRows(number, bank));
  db().prepare('INSERT INTO checks (account_number, channel, risk, created_at) VALUES (?, ?, ?, ?)')
    .run(number, channel, result.risk, result.checkedAt);
  return result;
}

/* ───────────────────────── Reports ───────────────────────── */

const toMine = (r: ReportRow): MyReport => ({
  id: r.id, createdAt: r.created_at, bank: r.bank, accountNumber: r.account_number, category: r.category,
  summary: r.summary, status: r.status, statusReason: r.status_reason, evidenceCount: r.evidence_count,
});

function newId(): string {
  for (;;) {
    const id = `TR-${randomInt(100000, 1000000)}`;
    if (!db().prepare('SELECT 1 FROM reports WHERE id = ?').get(id)) return id;
  }
}

export function submitReport(input: {
  accountNumber: string; bank: Bank | null; classification: Classification; reporter: string; channel: Channel;
  contact?: { name: string | null; contact: string | null } | null; hasMedia?: boolean;
}): MyReport {
  const { accountNumber, bank, classification: c, reporter } = input;
  const d = db();

  // Automated trust checks, in order. Only 'added' reports count toward risk.
  let status: ReportStatus = 'added';
  let reason: string | null = null;
  const today = (d.prepare('SELECT COUNT(*) AS n FROM reports WHERE reporter = ? AND created_at >= ?').get(reporter, since(1)) as { n: number }).n;
  if (today >= LIMITS.perReporterPerDay) {
    status = 'limited';
    reason = `Daily limit of ${LIMITS.perReporterPerDay} reports reached. Try again tomorrow.`;
  } else if (d.prepare("SELECT 1 FROM reports WHERE reporter = ? AND account_number = ? AND status = 'added' AND created_at >= ?").get(reporter, accountNumber, since(LIMITS.duplicateWindowDays))) {
    status = 'duplicate';
    reason = 'You already reported this account recently. Each person counts once.';
  } else if (c.needsClarification || (c.category === 'other' && !c.accountRelated)) {
    status = 'needs_detail';
    reason = c.clarifyingQuestion ?? 'We could not identify a payment or scam in this report. Add more detail and report again.';
  }

  const id = newId();
  d.prepare(`INSERT INTO reports
    (id, account_number, bank, category, severity, summary, tags, language, evidence_count, reporter, channel, status, status_reason, source, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(id, accountNumber, bank, c.category, c.severity, c.summary, JSON.stringify(c.tags), c.language, input.hasMedia ? 1 : 0,
      reporter, input.channel, status, reason, c.source, new Date().toISOString());
  if (input.contact && (input.contact.name || input.contact.contact)) {
    d.prepare('INSERT INTO reporter_contacts VALUES (?, ?, ?)').run(id, input.contact.name, input.contact.contact);
  }
  return toMine(d.prepare('SELECT * FROM reports WHERE id = ?').get(id) as ReportRow);
}

export function addEvidence(reportId: string, e: { id: string; kind: string; fileName: string; mime: string; size: number; storedAs: string }) {
  const d = db();
  d.prepare('INSERT INTO evidence VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(e.id, reportId, e.kind, e.fileName, e.mime, e.size, e.storedAs, new Date().toISOString());
  d.prepare('UPDATE reports SET evidence_count = (SELECT COUNT(*) FROM evidence WHERE report_id = ?) WHERE id = ?').run(reportId, reportId);
}

export function reportsFor(reporter: string): MyReport[] {
  return (db().prepare('SELECT * FROM reports WHERE reporter = ? ORDER BY created_at DESC LIMIT 100').all(reporter) as ReportRow[]).map(toMine);
}

/* ───────────────────────── Disputes ───────────────────────── */

export function createDispute(input: { accountNumber: string; bank: Bank | null; reason: string; contact: string | null }) {
  const id = `DS-${randomInt(100000, 1000000)}`;
  db().prepare('INSERT INTO disputes (id, account_number, bank, reason, contact, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, input.accountNumber, input.bank, input.reason, input.contact, new Date().toISOString());
  return id;
}

export function openDisputes() {
  const rows = db().prepare("SELECT * FROM disputes WHERE status = 'open' ORDER BY created_at DESC LIMIT 50").all() as {
    id: string; account_number: string; bank: Bank | null; reason: string; contact: string | null; created_at: string;
  }[];
  return rows.map((r) => ({ ...r, intel: intelligence(r.account_number, r.bank, accountRows(r.account_number, r.bank)) }));
}

/** Staff decision. 'removed' takes the account's reports out of intelligence; 'upheld' keeps them. */
export function resolveDispute(id: string, decision: 'upheld' | 'removed'): boolean {
  const d = db();
  const dispute = d.prepare("SELECT account_number FROM disputes WHERE id = ? AND status = 'open'").get(id) as { account_number: string } | undefined;
  if (!dispute) return false;
  d.exec('BEGIN');
  d.prepare("UPDATE disputes SET status = 'resolved', resolution = ?, resolved_at = ? WHERE id = ?").run(decision, new Date().toISOString(), id);
  if (decision === 'removed') {
    d.prepare("UPDATE reports SET status = 'removed', status_reason = 'Removed after review of a dispute by the account holder.' WHERE account_number = ? AND status = 'added'")
      .run(dispute.account_number);
  }
  d.exec('COMMIT');
  return true;
}

/* ───────────────────────── Dashboard ───────────────────────── */

const count = (sql: string, ...args: string[]) => (db().prepare(sql).get(...args) as { n: number }).n;

export function activity() {
  return {
    reportsToday: count("SELECT COUNT(*) AS n FROM reports WHERE status = 'added' AND created_at >= ?", since(1)),
    flaggedByMultiple: count(`SELECT COUNT(*) AS n FROM (SELECT account_number FROM reports WHERE status = 'added' AND created_at >= ?
      GROUP BY account_number HAVING COUNT(DISTINCT reporter) >= 2)`, since(7)),
  };
}

export function dashboard() {
  const d = db();
  const byCat = (from: number, to: number) => new Map((d.prepare(
    "SELECT category AS c, COUNT(*) AS n FROM reports WHERE status = 'added' AND created_at >= ? AND created_at < ? GROUP BY category",
  ).all(since(from), since(to)) as { c: string; n: number }[]).map((r) => [r.c, r.n]));
  const cur = byCat(30, 0);
  const prev = byCat(60, 30);

  // ponytail: scores every reported account per dashboard load; cache or store scores once accounts reach the tens of thousands.
  const scored = (d.prepare("SELECT DISTINCT account_number AS a FROM reports WHERE status = 'added'").all() as { a: string }[])
    .map((x) => intelligence(x.a, null, accountRows(x.a, null)));

  return {
    accountsChecked: count('SELECT COUNT(DISTINCT account_number) AS n FROM checks'),
    checksTotal: count('SELECT COUNT(*) AS n FROM checks'),
    reportsReceived: count('SELECT COUNT(*) AS n FROM reports'),
    highRisk: scored.filter((x) => x.risk === 'HIGH').length,
    reportsThisWeek: count('SELECT COUNT(*) AS n FROM reports WHERE created_at >= ?', since(7)),
    filtered: d.prepare("SELECT status, COUNT(*) AS n FROM reports WHERE status != 'added' GROUP BY status").all() as { status: ReportStatus; n: number }[],
    sampleReports: count('SELECT COUNT(*) AS n FROM reports WHERE sample = 1'),
    emerging: [...cur.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([c, n]) => ({ category: c as Category, label: CATEGORIES[c as Category], count: n, previous: prev.get(c) ?? 0 })),
    trending: scored.sort((x, y) => y.score - x.score || y.reports - x.reports).slice(0, 10),
    regions: d.prepare("SELECT region, COUNT(*) AS count FROM reports WHERE status = 'added' AND region IS NOT NULL AND created_at >= ? GROUP BY region ORDER BY count DESC")
      .all(since(30)) as { region: string; count: number }[],
    disputes: openDisputes(),
  };
}

/** Recent report clusters for AI pattern detection. Counts come from here, not the model. */
export function clusters(limit = 3) {
  const rows = db().prepare("SELECT category, summary, tags FROM reports WHERE status = 'added' AND created_at >= ?").all(since(60)) as
    Pick<ReportRow, 'category' | 'summary' | 'tags'>[];
  return countBy(rows.map((r) => r.category)).slice(0, limit).map(([c, n]) => {
    const rs = rows.filter((r) => r.category === c);
    return {
      category: c as Category,
      label: CATEGORIES[c as Category],
      count: n,
      topTags: countBy(rs.flatMap((r) => JSON.parse(r.tags) as string[])).slice(0, 3).map(([t]) => t),
      samples: [...new Set(rs.map((r) => r.summary))].slice(0, 8),
    };
  });
}
