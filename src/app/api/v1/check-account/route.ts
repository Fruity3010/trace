import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { checkAccount } from '@/lib/engine';
import { BANKS, findBank, normalizeAccount } from '@/lib/shared';

/** Partner keys from TRACE_API_KEYS (comma-separated). Unset = open, for local development only. */
function authorised(req: Request): boolean {
  const keys = (process.env.TRACE_API_KEYS ?? '').split(',').map((k) => k.trim()).filter(Boolean);
  if (!keys.length) return process.env.NODE_ENV !== 'production';
  const got = Buffer.from((req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, ''));
  return keys.some((k) => Buffer.from(k).length === got.length && timingSafeEqual(Buffer.from(k), got));
}

export async function POST(req: Request) {
  if (!authorised(req)) return NextResponse.json({ error: 'Invalid or missing API key' }, { status: 401 });
  const body = await req.json().catch(() => null);
  const accountNumber = normalizeAccount(body?.accountNumber);
  if (!accountNumber) {
    return NextResponse.json({ error: 'accountNumber must be a 10-digit NUBAN account number' }, { status: 400 });
  }
  const bank = findBank(body?.bank);
  if (body?.bank !== undefined && !bank) {
    return NextResponse.json({ error: 'Unknown bank', supportedBanks: BANKS }, { status: 400 });
  }
  return NextResponse.json(checkAccount(bank, accountNumber, 'api'));
}
