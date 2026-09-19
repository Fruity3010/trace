// Protected by src/proxy.ts (ADMIN_PASSWORD).
import { NextResponse } from 'next/server';
import { resolveDispute } from '@/lib/engine';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (body?.decision !== 'upheld' && body?.decision !== 'removed') {
    return NextResponse.json({ error: 'decision must be "upheld" or "removed"' }, { status: 400 });
  }
  return resolveDispute(id, body.decision)
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ error: 'Dispute not found or already resolved' }, { status: 404 });
}
