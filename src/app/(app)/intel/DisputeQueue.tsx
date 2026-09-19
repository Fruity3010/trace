'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Icon } from '@/components/Icons';
import { RiskBadge } from '@/components/ui';
import { ago, Risk } from '@/lib/shared';

type Dispute = { id: string; accountNumber: string; bank: string | null; reason: string; contact: string | null; createdAt: string; risk: Risk; reports: number; uniqueReporters: number };

/** The only human review in TRACE: account holders disputing reports. */
export function DisputeQueue({ disputes }: { disputes: Dispute[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function decide(id: string, decision: 'upheld' | 'removed') {
    setBusy(id);
    await fetch(`/api/admin/disputes/${id}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ decision }) });
    setBusy(null);
    router.refresh();
  }

  return (
    <section className="card p-5">
      <h2 className="font-bold">Open disputes <span className="tnum font-normal text-ink-3">· {disputes.length}</span></h2>
      {disputes.length === 0 && <p className="mt-6 pb-4 text-center text-[14px] text-ink-3">No open disputes.</p>}
      <ul className="mt-3 grid max-h-96 gap-3 overflow-y-auto">
        {disputes.map((d) => (
          <li key={d.id} className="rounded-2xl bg-paper p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono font-bold">{d.accountNumber}</span>
              <span className="text-[13px] text-ink-3">{d.bank}</span>
              <RiskBadge risk={d.risk} />
              <span className="ml-auto text-[12px] text-ink-3">{d.id} · {ago(d.createdAt)}</span>
            </div>
            <p className="mt-2 text-[14px] text-ink-2">&ldquo;{d.reason}&rdquo;</p>
            <p className="mt-1 text-[12px] text-ink-3">{d.reports} reports from {d.uniqueReporters} people{d.contact && ` · Contact: ${d.contact}`}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" disabled={busy === d.id} onClick={() => decide(d.id, 'upheld')} className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-ink px-4 text-[13px] font-bold text-paper disabled:opacity-50">
                <Icon name="check" size={14} /> Keep reports
              </button>
              <button type="button" disabled={busy === d.id} onClick={() => decide(d.id, 'removed')} className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-line bg-raised px-4 text-[13px] font-bold disabled:opacity-50">
                <Icon name="x" size={14} /> Remove reports
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
