import { NextResponse } from 'next/server';
import { classifyReport, signClassification } from '@/lib/ai';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const text = typeof body?.text === 'string' ? body.text.trim().slice(0, 4000) : '';
  if (!text) return NextResponse.json({ error: 'Report text is required' }, { status: 400 });
  const classification = await classifyReport(text);
  return NextResponse.json({ classification, token: signClassification(text, classification) });
}
