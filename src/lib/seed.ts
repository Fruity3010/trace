// Sample dataset, inserted once on first run with `sample = 1` so it can be
// told apart from real reports and removed with `npm run db:clear-sample`.
// Dates are relative to the moment of seeding. All accounts are synthetic.
import type { DatabaseSync } from 'node:sqlite';
import type { Category } from './shared';

const SUMMARIES: Record<Category, string[]> = {
  marketplace_fraud: [
    'Payment was made for an iPhone via Instagram and the recipient became unresponsive after receiving payment.',
    'Payment was made for a phone and the item was not delivered.',
    'Payment was made for a laptop listed on a marketplace and the recipient stopped responding.',
    'A seller on Instagram requested a transfer and blocked the reporter after payment.',
    'A deposit was paid for a PS5 and the seller became unreachable.',
    'Full payment was requested upfront for a used iPhone and the seller disappeared.',
  ],
  fake_online_store: [
    'An order was paid for through an online store and nothing arrived; the store page was removed.',
    'An online boutique accepted payment for an order and stopped responding.',
  ],
  investment_fraud: [
    'Money was sent for an investment promising monthly returns and withdrawals were blocked.',
    'A release fee was requested before an investment payout that never came.',
    'An investment group accepted funds and removed the reporter from the group chat.',
  ],
  fake_delivery: [
    'A clearance fee was requested for a parcel the reporter never ordered.',
    'A waybill fee was paid and the goods were never shipped.',
  ],
  impersonation: [
    'The reporter was asked to move money to a "secure" account by someone claiming to be bank customer care.',
    'Someone posing as a relative on WhatsApp requested an urgent transfer.',
  ],
  loan_scam: ['A processing fee was requested before a loan would be released, and the loan was not provided.'],
  job_scam: ['A training fee was requested as a condition of a job offer.'],
  romance_scam: ['Money was requested within an online relationship and contact was later cut.'],
  other: ['A payment was made for a service that was not provided.'],
};

const TAGS: Record<Category, string[]> = {
  marketplace_fraud: ['Payment not fulfilled', 'Account became unresponsive'],
  fake_online_store: ['Payment not fulfilled', 'Store page removed'],
  investment_fraud: ['Withdrawals blocked', 'Requested extra fees'],
  fake_delivery: ['Requested extra fees'],
  impersonation: ['Impersonated a trusted party'],
  loan_scam: ['Requested extra fees'],
  job_scam: ['Requested extra fees'],
  romance_scam: ['Account became unresponsive'],
  other: ['Payment not fulfilled'],
};

const REGIONS = ['Lagos', 'Lagos', 'Lagos', 'Lagos', 'Abuja', 'Abuja', 'Abuja', 'Ibadan', 'Ibadan', 'Port Harcourt', 'Port Harcourt', 'Kano', 'Enugu', 'Benin City'];

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Row = { account: string; bank: string; category: Category; tags: string[]; summary: string; evidence: number; reporter: string; region: string; daysAgo: number };

export function seedSample(d: DatabaseSync) {
  const rand = mulberry32(2026);
  const pick = <T,>(xs: readonly T[]) => xs[Math.floor(rand() * xs.length)];
  const rows: Row[] = [];

  // Well-known sample accounts, handy for trying the product.
  for (let i = 0; i < 23; i++) {
    const category: Category = i < 18 ? 'marketplace_fraud' : i < 21 ? 'fake_online_store' : 'fake_delivery';
    rows.push({
      account: '0123456789', bank: 'GTBank', category,
      tags: [...(i % 2 === 0 ? ['Payment not fulfilled'] : []), ...(i < 9 ? ['Account became unresponsive'] : [])],
      summary: SUMMARIES[category][i % SUMMARIES[category].length], evidence: i % 3 === 0 ? 1 : 0,
      reporter: `a${i < 19 ? i : i - 19}`, region: REGIONS[i % REGIONS.length], daysAgo: 2 + Math.round((i * 58) / 22),
    });
  }
  for (let i = 0; i < 5; i++) {
    const category: Category = i < 3 ? 'fake_online_store' : 'marketplace_fraud';
    rows.push({ account: '1234567890', bank: 'Kuda', category, tags: [TAGS[category][0]], summary: SUMMARIES[category][i % SUMMARIES[category].length], evidence: i < 2 ? 1 : 0, reporter: `b${i}`, region: pick(REGIONS), daysAgo: 12 + i * 9 });
  }
  for (let i = 0; i < 16; i++) {
    rows.push({ account: '8123456780', bank: 'OPay', category: 'investment_fraud', tags: [TAGS.investment_fraud[i % 2]], summary: SUMMARIES.investment_fraud[i % 3], evidence: i % 2 === 0 ? 1 : 0, reporter: `d${i % 14}`, region: pick(REGIONS), daysAgo: 1 + i * 3 });
  }

  const weighted: Category[] = [
    ...Array(8).fill('marketplace_fraud'), ...Array(5).fill('investment_fraud'), ...Array(3).fill('fake_delivery'),
    ...Array(3).fill('fake_online_store'), ...Array(2).fill('impersonation'), 'loan_scam', 'job_scam', 'romance_scam',
  ];
  const banks = ['GTBank', 'OPay', 'Moniepoint', 'PalmPay', 'Kuda', 'Access Bank', 'UBA', 'Zenith Bank', 'First Bank', 'Wema Bank'];
  for (let a = 0; a < 200; a++) {
    const tier = rand();
    const count = tier < 0.35 ? Math.floor(rand() * 2) : tier < 0.8 ? 2 + Math.floor(rand() * 8) : 10 + Math.floor(rand() * 16);
    const main = pick(weighted);
    const reporters = Math.max(1, Math.round(count * (0.6 + rand() * 0.4)));
    const newest = Math.floor(rand() * (count > 8 ? 6 : 45));
    const bank = pick(banks);
    const account = `30${String(10_000_000 + a * 48_611).padStart(8, '0')}`;
    for (let i = 0; i < count; i++) {
      const category = rand() < 0.75 ? main : pick(weighted);
      rows.push({
        account, bank, category, tags: rand() < 0.7 ? [pick(TAGS[category])] : [],
        summary: pick(SUMMARIES[category]), evidence: rand() < 0.35 ? 1 : 0,
        reporter: `s${a}-${i % reporters}`, region: pick(REGIONS), daysAgo: newest + Math.floor(i * (1 + rand() * 3)),
      });
    }
  }

  const insert = d.prepare(`INSERT INTO reports
    (id, account_number, bank, category, severity, summary, tags, evidence_count, reporter, channel, region, status, sample, created_at)
    VALUES (?, ?, ?, ?, 'medium', ?, ?, ?, ?, 'sample', ?, 'added', 1, ?)`);
  const now = Date.now();
  rows.forEach((r, i) => {
    // Spread through the day so "today" and "this week" look like real traffic.
    const at = new Date(now - r.daysAgo * 86_400_000 - Math.floor(rand() * 36_000_000)).toISOString();
    insert.run(`SMP-${String(i).padStart(5, '0')}`, r.account, r.bank, r.category, r.summary, JSON.stringify(r.tags), r.evidence, `sample:${r.reporter}`, r.region, at);
  });
}
