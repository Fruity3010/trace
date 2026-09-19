import { NextResponse } from 'next/server';
import { createDispute } from '@/lib/engine';
import { findBank, normalizeAccount } from '@/lib/shared';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const accountNumber = normalizeAccount(body?.accountNumber);
  const reason = typeof body?.reason === 'string' ? body.reason.trim().slice(0, 1000) : '';
  if (!accountNumber) return NextResponse.json({ error: 'Enter a 10-digit account number' }, { status: 400 });
  if (reason.length < 10) return NextResponse.json({ error: 'Tell us briefly why the reports are wrong' }, { status: 400 });
  const contact = typeof body?.contact === 'string' ? body.contact.trim().slice(0, 120) || null : null;
  const id = createDispute({ accountNumber, bank: findBank(body?.bank), reason, contact });
  return NextResponse.json({ id }, { status: 201 });
}
