// Constants, types and formatters safe to import on client and server.

import bankData from './banks.json';

// Snapshot of Paystack's Nigerian bank list (names + codes). Refresh with scripts/refresh-banks.sh.
type BankEntry = { name: string; code: string; official?: string };
const BANK_LIST = bankData.banks as BankEntry[];
export const BANKS: readonly string[] = BANK_LIST.map((b) => b.name);
export const POPULAR_BANKS: readonly string[] = bankData.popular.map((code) => BANK_LIST.find((b) => b.code === code)!.name);
/** A bank's display name, always one of BANKS. */
export type Bank = string;

const BANK_ALIASES: Record<string, string> = {
  gtb: 'GTBank', gtco: 'GTBank', 'guaranty trust': 'GTBank', 'gt bank': 'GTBank', access: 'Access Bank',
  firstbank: 'First Bank', 'first bank of nigeria': 'First Bank', fbn: 'First Bank', zenith: 'Zenith Bank',
  wema: 'Wema Bank', alat: 'ALAT by Wema', fidelity: 'Fidelity Bank', sterling: 'Sterling Bank', union: 'Union Bank',
  stanbic: 'Stanbic IBTC', 'united bank for africa': 'UBA', opay: 'OPay', paycom: 'OPay', moniepoint: 'Moniepoint',
  palmpay: 'PalmPay', 'palm pay': 'PalmPay', kuda: 'Kuda', 'kuda bank': 'Kuda', polaris: 'Polaris Bank',
  providus: 'Providus Bank', keystone: 'Keystone Bank', fairmoney: 'FairMoney', 'fair money': 'FairMoney', ecobank: 'Ecobank',
};

const BY_KEY = new Map<string, string>();
for (const b of BANK_LIST) {
  BY_KEY.set(b.name.toLowerCase(), b.name);
  if (b.official) BY_KEY.set(b.official.toLowerCase(), b.name);
}
for (const [alias, name] of Object.entries(BANK_ALIASES)) BY_KEY.set(alias, name);

export function findBank(input: unknown): Bank | null {
  if (typeof input !== 'string') return null;
  return BY_KEY.get(input.trim().toLowerCase().replace(/\s+/g, ' ')) ?? null;
}

export function bankCode(bank: Bank): string | null {
  return BANK_LIST.find((b) => b.name === bank)?.code ?? null;
}

/** NUBAN account numbers are exactly 10 digits. */
export function normalizeAccount(input: unknown): string | null {
  if (typeof input !== 'string' && typeof input !== 'number') return null;
  const digits = String(input).replace(/[\s-]/g, '');
  return /^\d{10}$/.test(digits) ? digits : null;
}

export const CATEGORIES = {
  marketplace_fraud: 'Marketplace fraud',
  fake_online_store: 'Fake online store',
  investment_fraud: 'Investment fraud',
  fake_delivery: 'Fake delivery service',
  impersonation: 'Impersonation',
  loan_scam: 'Loan scam',
  job_scam: 'Job offer scam',
  romance_scam: 'Romance scam',
  other: 'Other',
} as const;
export type Category = keyof typeof CATEGORIES;
export const CATEGORY_KEYS = Object.keys(CATEGORIES) as Category[];

/** Fixed vocabulary so patterns can be counted. The AI picks from this list; it cannot invent tags. */
export const TAGS = [
  'Payment not fulfilled', 'Account became unresponsive', 'Blocked after payment', 'Requested extra fees',
  'Withdrawals blocked', 'Store page removed', 'Impersonated a trusted party', 'Fake payment proof',
] as const;
export type Tag = (typeof TAGS)[number];

export type Risk = 'LOW' | 'MEDIUM' | 'HIGH';
export type Recommendation = 'NONE' | 'CAUTION' | 'WARN';

export function riskFor(score: number): Risk {
  return score >= 70 ? 'HIGH' : score >= 30 ? 'MEDIUM' : 'LOW';
}

export type Factor = { key: string; label: string; detail: string; points: number; max: number };

export type Intelligence = {
  bank: Bank | null;
  accountNumber: string;
  risk: Risk;
  score: number;
  reports: number;
  uniqueReporters: number;
  evidenceCount: number;
  similarDescriptions: number;
  categories: Category[];
  patterns: { label: string; count: number }[];
  firstReported: string | null;
  lastReported: string | null;
  lastReportedAgo: string | null;
  recommendation: Recommendation;
  headline: string;
  explanation: string;
  factors: Factor[];
  disclaimer: string;
  disputed: boolean;
  sampleData: boolean;
  checkedAt: string;
};

/**
 * Name enquiry via Paystack. Returned to the person checking only: never
 * stored, never in reports, the dashboard or the partner API.
 */
export type Verification =
  | { status: 'verified'; accountName: string }
  | { status: 'not_found' }
  | { status: 'unavailable'; reason: 'no_bank' | 'rate_limited' | 'error' | 'disabled' | 'sample' };

export type Channel = 'web' | 'whatsapp' | 'api';

/**
 * added        counted in intelligence
 * duplicate    same reporter already reported this account in the last 30 days
 * limited      reporter exceeded the daily report limit
 * needs_detail classifier could not identify a scam or payment
 * removed      removed after an upheld dispute
 */
export type ReportStatus = 'added' | 'duplicate' | 'limited' | 'needs_detail' | 'removed';

export type MyReport = {
  id: string;
  createdAt: string;
  bank: string | null;
  accountNumber: string;
  category: Category;
  summary: string;
  status: ReportStatus;
  statusReason: string | null;
  evidenceCount: number;
};

export type Classification = {
  category: Category;
  severity: 'low' | 'medium' | 'high';
  summary: string;
  tags: Tag[];
  keyFacts: string[];
  accountRelated: boolean;
  accountNumber: string | null;
  needsClarification: boolean;
  clarifyingQuestion: string | null;
  language: string;
  source: 'gemini' | 'offline';
};

export const LANGUAGES = [
  { code: 'en', label: 'English', speech: 'en-NG' },
  { code: 'yo', label: 'Yorùbá', speech: 'yo-NG' },
  { code: 'ha', label: 'Hausa', speech: 'ha-NG' },
  { code: 'ig', label: 'Igbo', speech: 'ig-NG' },
  { code: 'pcm', label: 'Pidgin', speech: 'en-NG' },
] as const;
export type Lang = (typeof LANGUAGES)[number]['code'];

export const DAY = 86_400_000;

export function daysAgo(isoDate: string): number {
  return Math.max(0, Math.floor((Date.now() - Date.parse(isoDate)) / DAY));
}

export function ago(isoDate: string): string {
  const d = daysAgo(isoDate);
  if (d === 0) return 'today';
  if (d === 1) return 'yesterday';
  if (d < 30) return `${d} days ago`;
  const m = Math.round(d / 30);
  return m === 1 ? '1 month ago' : `${m} months ago`;
}

export function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

export const n = (x: number) => x.toLocaleString('en-NG');

/**
 * wa.me link that opens a chat with the TRACE WhatsApp bot, or null when no number is set.
 * NEXT_PUBLIC_TRACE_WHATSAPP_TEXT pre-fills the first message: on Twilio's sandbox it
 * must be the "join <code>" phrase, since the bot can't reply until someone has joined.
 */
export function botLink(): string | null {
  const number = process.env.NEXT_PUBLIC_TRACE_WHATSAPP_NUMBER?.replace(/\D/g, '');
  if (!number) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(process.env.NEXT_PUBLIC_TRACE_WHATSAPP_TEXT || 'Hi')}`;
}
