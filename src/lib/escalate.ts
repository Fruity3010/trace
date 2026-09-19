// The first hour: what to do after the money has already gone.
//
// Deterministic, like engine.ts. Nothing here is decided by a model — the steps,
// the wording of the call script and the complaint text are fixed code, because
// this is advice someone acts on while panicking. AI is allowed to translate the
// output (ai.ts), never to choose it.
//
// The lever this is built around: a victim cannot freeze anything themselves.
// Their own bank has to ask the beneficiary's bank to put a PND (Post No Debit)
// on the receiving account. So the first action is always a phone call to their
// own bank, saying words that make that happen, and coming away with a complaint
// reference — which is what every later escalation depends on.
import { randomInt } from 'node:crypto';
import { db, inDemo } from './db';
import { peekAccount } from './engine';
import helpData from './help.json';
import { Bank, DAY, formatDate, n } from './shared';

export type Contact = { phone: string | null; email: string | null; whatsapp: string | null; source: string; verifiedOn: string };
type RawContact = { phone: string | null; email: string | null; whatsapp: string | null; source: string | null; verifiedOn: string | null };

/**
 * A bank's fraud desk, or null when we have not verified one.
 *
 * Unverified is deliberately indistinguishable from missing: sending someone who
 * has just been defrauded to an unchecked phone number is how they get defrauded
 * a second time. Callers fall back to CARD_ADVICE.
 */
export function helpFor(bank: Bank | null): Contact | null {
  if (!bank) return null;
  // Demo only: a visibly fake contact, never dialable, so the pitch shows the full step.
  if (inDemo()) {
    const slug = bank.toLowerCase().replace(/[^a-z0-9]+/g, '');
    return { phone: '0700 000 DEMO', email: `fraud-desk@${slug}.demo`, whatsapp: null, source: 'demo', verifiedOn: new Date().toISOString() };
  }
  const c = (helpData.banks as Record<string, RawContact>)[bank];
  if (!c || !c.verifiedOn || !c.source) return null;
  if (!c.phone && !c.email && !c.whatsapp) return null;
  return { phone: c.phone, email: c.email, whatsapp: c.whatsapp, source: c.source, verifiedOn: c.verifiedOn };
}

export function institution(key: 'cbn' | 'police' | 'efcc') {
  const i = helpData.institutions[key];
  if (inDemo()) return { ...i, email: `consumer-protection@${key}.demo`, verified: true };
  const verified = Boolean(i.verifiedOn && (i.phone || i.email || i.form));
  return { ...i, verified };
}

export const CARD_ADVICE =
  'Use the customer care number printed on the back of your bank card, or the one inside your banking app. ' +
  'Do not use a number from a web search or from someone who messages you — fake helplines are a common second scam.';

/** Never-do list. Recovery scams target people who have just been scammed once. */
export const NEVER = [
  'Never pay anyone who promises to recover your money. That is a second scam.',
  'Never share your PIN, card details, OTP or BVN with anyone — your bank will never ask for them.',
  'Do not delete the transaction. Your bank needs the receipt and the reference.',
];

/* ───────────────────────── Timing ───────────────────────── */

export type Urgency = { tier: 'golden' | 'same_day' | 'days' | 'late'; headline: string; detail: string };

/** How hard to push, from how long ago the money left. The window matters more than anything else here. */
export function urgency(sentAt: string): Urgency {
  const elapsed = Date.now() - Date.parse(sentAt);
  if (elapsed < 60 * 60_000) {
    return { tier: 'golden', headline: 'Call your bank right now.', detail: 'The money may still be sitting in the account you sent it to. This is the best chance to stop it.' };
  }
  if (elapsed < DAY) {
    return { tier: 'same_day', headline: 'Call your bank now — today still counts.', detail: 'Some of the money may still be there. A freeze can stop the rest from being withdrawn.' };
  }
  if (elapsed < 3 * DAY) {
    return { tier: 'days', headline: 'Call your bank today.', detail: 'The money has probably moved, but the account can still be frozen and your complaint starts the bank\'s clock.' };
  }
  return { tier: 'late', headline: 'It is still worth reporting.', detail: 'Recovery is less likely now, but your complaint adds to the case against this account and helps the next person.' };
}

/* ───────────────────────── What to say ───────────────────────── */

export type CaseFacts = {
  accountNumber: string;      // where the money went
  bank: Bank | null;          // beneficiary bank
  victimBank: Bank | null;    // the bank the victim sent from
  amount: number | null;
  sentAt: string;
  reports?: number;           // existing TRACE reports on the beneficiary account
  reporters?: number;
};

const money = (a: number | null) => (a ? `₦${n(a)}` : 'the money');

/**
 * The sentence to read down the phone. Deliberately blunt and free of jargon the
 * caller has to understand — they only have to say it.
 */
export function callScript(f: CaseFacts): string[] {
  const lines = [
    'I am a victim of fraud.',
    `I transferred ${money(f.amount)} from my account on ${formatDate(f.sentAt)} to account number ${f.accountNumber}${f.bank ? ` at ${f.bank}` : ''}.`,
    'Please place a PND on the beneficiary account and open a fraud dispute.',
    'Please give me my complaint reference number.',
  ];
  if ((f.reports ?? 0) > 0) {
    lines.splice(2, 0, `That account has already been reported by ${f.reporters ?? 0} other ${f.reporters === 1 ? 'person' : 'people'}.`);
  }
  return lines;
}

/** Why the last line matters, in one sentence, because people hang up without it. */
export const REFERENCE_NUDGE = 'Do not hang up without the complaint reference number. Everything after this depends on it.';

export function writtenComplaint(f: CaseFacts, caseId: string): string {
  return [
    'FRAUD COMPLAINT — REQUEST FOR PND ON BENEFICIARY ACCOUNT',
    '',
    'I am a victim of fraud and I am formally reporting an unauthorised/fraudulently induced transfer.',
    '',
    `Amount: ${money(f.amount)}`,
    `Date sent: ${formatDate(f.sentAt)}`,
    `Beneficiary account: ${f.accountNumber}${f.bank ? ` (${f.bank})` : ''}`,
    '',
    'I request that you:',
    '1. Contact the beneficiary bank to place a PND on the beneficiary account.',
    '2. Open a fraud dispute on my account.',
    '3. Provide me with a complaint reference number.',
    '',
    ...((f.reports ?? 0) > 0
      ? [`Note: this beneficiary account has been reported independently by ${f.reporters ?? 0} other ${f.reporters === 1 ? 'person' : 'people'} for suspected fraud.`, '']
      : []),
    `TRACE case: ${caseId}`,
    '',
    'Please confirm receipt of this complaint.',
  ].join('\n');
}

export function cbnEscalation(c: CaseRow): string {
  return [
    'ESCALATION — UNRESOLVED BANK FRAUD COMPLAINT',
    '',
    `I reported a fraudulent transfer to ${c.victim_bank ?? 'my bank'} on ${formatDate(c.filed_at ?? c.created_at)}.`,
    c.reference ? `Their complaint reference is ${c.reference}.` : 'They did not provide me with a complaint reference.',
    `It has been ${Math.floor((Date.now() - Date.parse(c.filed_at ?? c.created_at)) / DAY)} days and the complaint is unresolved.`,
    '',
    `Amount: ${money(c.amount)}`,
    `Date of transfer: ${formatDate(c.sent_at)}`,
    `Beneficiary account: ${c.account_number}${c.bank ? ` (${c.bank})` : ''}`,
    '',
    'I request that this complaint be reviewed.',
    '',
    `TRACE case: ${c.id}`,
  ].join('\n');
}

/* ───────────────────────── Deep links ───────────────────────── */

/** One tap, message already written — an older person should never meet a blank compose box. */
export const waLink = (phone: string, body: string) => `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(body)}`;
export const mailLink = (email: string, subject: string, body: string) =>
  `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
export const telLink = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`;

/* ───────────────────────── Cases ───────────────────────── */

export type CaseStatus = 'open' | 'filed' | 'acknowledged' | 'resolved' | 'stalled';

export type CaseRow = {
  id: string; account_number: string; bank: string | null; victim_bank: string | null;
  amount: number | null; sent_at: string; reporter: string; report_id: string | null;
  reference: string | null; status: CaseStatus; filed_at: string | null; responded_at: string | null;
  outcome: string | null; created_at: string;
};

export function openCase(f: CaseFacts & { reporter: string; reportId?: string | null }): CaseRow {
  const id = `TC-${randomInt(100000, 1000000)}`;
  db().prepare(`INSERT INTO cases
    (id, account_number, bank, victim_bank, amount, sent_at, reporter, report_id, reference, status, filed_at, responded_at, outcome, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, 'open', NULL, NULL, NULL, ?)`)
    .run(id, f.accountNumber, f.bank, f.victimBank, f.amount, f.sentAt, f.reporter, f.reportId ?? null, new Date().toISOString());
  return getCase(id)!;
}

export function getCase(id: string): CaseRow | null {
  return (db().prepare('SELECT * FROM cases WHERE id = ?').get(id) as CaseRow | undefined) ?? null;
}

/** The caller's most recent case, for WhatsApp STATUS. */
export function latestCase(reporter: string): CaseRow | null {
  return (db().prepare('SELECT * FROM cases WHERE reporter = ? ORDER BY created_at DESC LIMIT 1').get(reporter) as CaseRow | undefined) ?? null;
}

export function markFiled(id: string): void {
  db().prepare("UPDATE cases SET status = 'filed', filed_at = COALESCE(filed_at, ?) WHERE id = ? AND status = 'open'")
    .run(new Date().toISOString(), id);
}

/**
 * The bank gave the victim a complaint reference. This is the strongest signal in
 * the system: an institution has acknowledged the complaint under the victim's own
 * name, which is a far higher bar than typing into a form. It counts as evidence on
 * the linked report, feeding the existing evidence weight — no scoring change needed.
 */
export function attachReference(id: string, reference: string): CaseRow | null {
  const c = getCase(id);
  if (!c) return null;
  const now = new Date().toISOString();
  db().prepare("UPDATE cases SET reference = ?, status = 'acknowledged', filed_at = COALESCE(filed_at, ?), responded_at = COALESCE(responded_at, ?) WHERE id = ?")
    .run(reference.slice(0, 60), now, now, id);
  if (c.report_id && !c.reference) {
    db().prepare('UPDATE reports SET evidence_count = evidence_count + 1 WHERE id = ?').run(c.report_id);
  }
  return getCase(id);
}

/**
 * Demo only: move a case's dates back 15 days, as if the bank had sat on it since.
 * The normal rules then reach the CBN step, and the letter's dates and day count agree.
 */
export function demoFastForward(c: CaseRow): CaseRow {
  if (!inDemo() || !c.filed_at || isStalled(c)) return c;
  const back = (t: string | null) => (t ? new Date(Date.parse(t) - 15 * DAY).toISOString() : null);
  db().prepare('UPDATE cases SET sent_at = ?, filed_at = ?, responded_at = ?, created_at = ? WHERE id = ?')
    .run(back(c.sent_at), back(c.filed_at), back(c.responded_at), back(c.created_at), c.id);
  return getCase(c.id) ?? c;
}

/** Has the bank run out of road? Falls back to "they stopped responding" when we have no verified CBN window. */
export function isStalled(c: CaseRow): boolean {
  if (c.status === 'resolved') return false;
  const days = helpData.turnaroundWorkingDays;
  if (!c.filed_at) return false;
  const elapsed = Math.floor((Date.now() - Date.parse(c.filed_at)) / DAY);
  return elapsed >= (days ?? 14);
}

export type NextStep = { step: 'call' | 'write' | 'reference' | 'wait' | 'escalate' | 'done'; title: string; body: string[] };

/** Which rung of the ladder this case is on. Pure function of stored state. */
export function nextStep(c: CaseRow): NextStep {
  if (c.status === 'resolved') return { step: 'done', title: 'Case closed', body: ['You marked this case resolved.'] };
  if (c.status === 'open') {
    return { step: 'call', title: 'Call your bank', body: [urgency(c.sent_at).headline, REFERENCE_NUDGE] };
  }
  if (!c.reference) {
    return { step: 'reference', title: 'Get your complaint reference', body: ['Your bank must give you a complaint reference number.', 'Send it here once you have it — every later step needs it.'] };
  }
  if (isStalled(c)) {
    return { step: 'escalate', title: 'Escalate to CBN', body: [`Your bank has had this since ${formatDate(c.filed_at!)} and has not resolved it.`, 'Your escalation is ready, with the date and reference already in it.'] };
  }
  return { step: 'wait', title: 'Waiting on your bank', body: [`Filed ${formatDate(c.filed_at!)} · reference ${c.reference}`, 'If they stop responding, come back and TRACE will escalate it for you.'] };
}

export function markResolved(id: string): void {
  db().prepare("UPDATE cases SET status = 'resolved', outcome = COALESCE(outcome, 'resolved') WHERE id = ?").run(id);
}

export function linkReport(id: string, reportId: string): void {
  db().prepare('UPDATE cases SET report_id = ? WHERE id = ?').run(reportId, id);
}

/**
 * Everything the web case page shows, built from the same functions the WhatsApp
 * flow uses, so the two channels can't give different advice. Authority contacts
 * are only included once verified; unverified is indistinguishable from missing.
 */
export function caseView(c: CaseRow) {
  const bank = c.bank as Bank | null;
  const intel = peekAccount(bank, c.account_number);
  const f: CaseFacts = {
    accountNumber: c.account_number, bank, victimBank: c.victim_bank as Bank | null, amount: c.amount,
    sentAt: c.sent_at, reports: intel.reports, reporters: intel.uniqueReporters,
  };
  const next = nextStep(c);
  return {
    id: c.id, status: c.status, reference: c.reference, reportFiled: !!c.report_id,
    accountNumber: c.account_number, bank, victimBank: f.victimBank, amount: c.amount, sentAt: c.sent_at,
    priorReporters: intel.uniqueReporters,
    urgency: urgency(c.sent_at),
    desk: helpFor(f.victimBank),
    cardAdvice: CARD_ADVICE,
    script: callScript(f),
    referenceNudge: REFERENCE_NUDGE,
    complaint: writtenComplaint(f, c.id),
    next,
    cbnLetter: next.step === 'escalate' ? cbnEscalation(c) : null,
    authorities: (['cbn', 'police', 'efcc'] as const).map((key) => {
      // help.json types every blank contact as null; they are strings once filled in.
      const i = institution(key) as Omit<ReturnType<typeof institution>, 'phone' | 'email' | 'form' | 'source'> & { phone: string | null; email: string | null; form: string | null; source: string | null };
      return {
        key, label: i.label, role: i.role, verified: i.verified,
        phone: i.verified ? i.phone : null, email: i.verified ? i.email : null,
        form: i.verified ? i.form : null, source: i.verified ? i.source : null,
      };
    }),
    never: NEVER,
  };
}
export type CaseView = ReturnType<typeof caseView>;

/* ───────────────────────── Accountability ───────────────────────── */

/**
 * Per-bank fraud-complaint responsiveness. The aggregate no regulator publishes:
 * which banks acknowledge fraud complaints, and how fast.
 */
export function responsiveness() {
  return db().prepare(`
    SELECT victim_bank AS bank,
           COUNT(*) AS cases,
           SUM(CASE WHEN reference IS NOT NULL THEN 1 ELSE 0 END) AS acknowledged,
           SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) AS resolved
    FROM cases WHERE victim_bank IS NOT NULL
    GROUP BY victim_bank ORDER BY cases DESC`).all() as { bank: string; cases: number; acknowledged: number; resolved: number }[];
}

/** Filed complaints against one beneficiary account — a pattern no single victim could assemble. */
export function casesAgainst(accountNumber: string) {
  const rows = db().prepare("SELECT victim_bank, amount, filed_at FROM cases WHERE account_number = ? AND status != 'open'").all(accountNumber) as { victim_bank: string | null; amount: number | null; filed_at: string | null }[];
  return {
    complaints: rows.length,
    banks: new Set(rows.map((r) => r.victim_bank).filter(Boolean)).size,
    total: rows.reduce((s, r) => s + (r.amount ?? 0), 0),
  };
}
