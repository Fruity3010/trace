// "The first hour" on the web: open a case after the money has gone, or fetch the
// caller's latest one. Same engine and wording as the WhatsApp flow (escalate.ts).
// Cases belong to the hashed device id, like reports, so only the person who opened
// a case can see it.
import { NextResponse } from 'next/server';
import { db, rateLimit } from '@/lib/db';
import { deviceKey as device } from '@/lib/caller';
import { caseView, latestCase, openCase } from '@/lib/escalate';
import { DAY, findBank, normalizeAccount } from '@/lib/shared';

export async function GET(req: Request) {
  const reporter = device(req);
  if (!reporter) return NextResponse.json({ error: 'Missing device id' }, { status: 400 });
  const c = latestCase(reporter);
  return NextResponse.json(c ? caseView(c) : null);
}

export async function POST(req: Request) {
  const reporter = device(req);
  if (!reporter) return NextResponse.json({ error: 'Missing device id' }, { status: 400 });
  const body = await req.json().catch(() => null);

  const accountNumber = normalizeAccount(body?.accountNumber);
  if (!accountNumber) return NextResponse.json({ error: 'Enter the 10-digit account number you sent money to' }, { status: 400 });
  const bank = findBank(body?.bank);
  if (!bank) return NextResponse.json({ error: 'Choose the bank you sent money to' }, { status: 400 });
  const victimBank = findBank(body?.victimBank);
  if (!victimBank) return NextResponse.json({ error: 'Choose the bank you sent money from' }, { status: 400 });
  const sent = Date.parse(String(body?.sentAt ?? ''));
  if (!Number.isFinite(sent) || sent > Date.now() + 5 * 60_000 || sent < Date.now() - 366 * 86_400_000) {
    return NextResponse.json({ error: 'Choose when you sent the money' }, { status: 400 });
  }
  const amount = body?.amount == null || body.amount === '' ? null : Math.round(Number(body.amount));
  if (amount !== null && !(amount > 0 && amount < 1e11)) return NextResponse.json({ error: 'Enter the amount in naira, or leave it blank' }, { status: 400 });

  if (!rateLimit('case', reporter, 5)) return NextResponse.json({ error: 'Too many cases this hour. Please try again later.' }, { status: 429 });
  const prior = db().prepare("SELECT id FROM reports WHERE reporter = ? AND account_number = ? AND status = 'added' AND created_at >= ? ORDER BY created_at DESC LIMIT 1")
    .get(reporter, accountNumber, new Date(Date.now() - 30 * DAY).toISOString()) as { id: string } | undefined;
  const c = openCase({ accountNumber, bank, victimBank, amount, sentAt: new Date(sent).toISOString(), reporter, reportId: prior?.id });
  return NextResponse.json(caseView(c));
}
