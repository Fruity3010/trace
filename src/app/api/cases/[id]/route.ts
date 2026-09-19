// Moving a web case up the ladder: called the bank, got a reference, told us what
// happened (which becomes the report), or closed it. Only the device that opened
// the case can touch it.
import { NextResponse } from 'next/server';
import { classifyReport } from '@/lib/ai';
import { submitReport } from '@/lib/engine';
import { attachReference, caseView, getCase, linkReport, markFiled, markResolved } from '@/lib/escalate';
import { Bank } from '@/lib/shared';
import { deviceKey as device } from '@/lib/caller';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const reporter = device(req);
  const c = getCase(id);
  // Someone else's case looks exactly like a missing one.
  if (!reporter || !c || c.reporter !== reporter) return NextResponse.json({ error: 'Case not found' }, { status: 404 });
  const body = await req.json().catch(() => null);

  switch (body?.action) {
    case 'filed':
      markFiled(id);
      break;
    case 'reference': {
      const ref = String(body.reference ?? '').trim();
      if (!ref || ref.length > 60) return NextResponse.json({ error: 'Enter the complaint reference your bank gave you' }, { status: 400 });
      attachReference(id, ref);
      break;
    }
    case 'story': {
      if (c.report_id) return NextResponse.json({ error: 'You have already told us what happened on this case' }, { status: 409 });
      const text = String(body.text ?? '').trim().slice(0, 4000);
      if (text.length < 10) return NextResponse.json({ error: 'Tell us in a sentence or two what happened' }, { status: 400 });
      const r = submitReport({
        accountNumber: c.account_number, bank: c.bank as Bank | null, classification: await classifyReport(text),
        reporter, channel: 'web', hasMedia: false,
      });
      linkReport(id, r.id);
      break;
    }
    case 'resolved':
      markResolved(id);
      break;
    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }
  return NextResponse.json(caseView(getCase(id)!));
}
