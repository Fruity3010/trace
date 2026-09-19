'use client';
import Link from 'next/link';
import { Icon } from '@/components/Icons';
import { btn, page, TopBar } from '@/components/ui';
import { useMyReports } from '@/lib/store';
import { CATEGORIES, formatDate, ReportStatus } from '@/lib/shared';
import { Tracker } from './Tracker';

const LABEL: Record<ReportStatus, string> = {
  added: 'Added to intelligence', duplicate: 'Already reported', limited: 'Limit reached', needs_detail: 'Needs more detail', removed: 'Removed',
};

export default function ReportsPage() {
  const { reports, error } = useMyReports();
  return (
    <div className={`${page.wide} animate-rise`}>
      <div className="lg:hidden"><TopBar back={null} /></div>
      <div className="flex items-end justify-between lg:pt-6">
        <div>
          <h1 className="font-serif text-[38px] font-medium leading-none lg:text-[48px]">My reports</h1>
          <p className="mt-1 flex items-center gap-1.5 text-[13px] text-ink-3"><Icon name="lock" size={13} /> Linked to this device only</p>
        </div>
        <Link href="/report" className="inline-flex min-h-11 items-center gap-1.5 rounded-md bg-ink px-4 text-[14px] font-semibold text-raised">
          <Icon name="alert" size={16} /> New report
        </Link>
      </div>

      {error && <p role="alert" className="mt-6 rounded-2xl bg-medium-wash p-4 text-[14px]">Couldn&apos;t load your reports. Check your connection.</p>}
      {!reports && !error && <div className="mt-6 grid gap-3 lg:grid-cols-2">{[0, 1].map((i) => <div key={i} className="h-36 animate-pulse rounded-3xl bg-line-2" />)}</div>}
      {reports?.length === 0 && (
        <div className="mx-auto mt-14 max-w-sm text-center">
          <p className="font-serif text-[26px] font-medium">No reports yet</p>
          <p className="mt-1 text-ink-3">If you paid an account and something went wrong, reporting it warns the next person.</p>
          <Link href="/report" className={`${btn.primary} mt-5`}>Report an account</Link>
        </div>
      )}

      <ul className="mt-6 grid items-start gap-3 lg:grid-cols-2">
        {reports?.map((r) => (
          <li key={r.id}>
            <details className="card">
              <summary className="block p-5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[15px] font-medium tracking-wider">{r.id}</span>
                  <span className={`inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 font-mono text-[11px] font-medium uppercase tracking-wider ${r.status === 'added' ? 'border-low text-low' : 'border-medium text-medium'}`}>
                    <Icon name={r.status === 'added' ? 'check' : 'info'} size={13} strokeWidth={2.5} /> {LABEL[r.status]}
                  </span>
                </div>
                <p className="mt-2 font-serif text-[21px] font-medium">{CATEGORIES[r.category]}</p>
                <p className="mt-0.5 text-[14px] text-ink-3">
                  Account ending <span className="font-mono font-bold text-ink">{r.accountNumber.slice(-4)}</span>{r.bank && ` · ${r.bank}`} · {formatDate(r.createdAt)}
                </p>
                <div className="mt-4"><Tracker status={r.status} compact /></div>
              </summary>
              <div className="border-t border-line-2 px-5 pb-5 pt-4">
                <p className="text-[14px] italic text-ink-2">&ldquo;{r.summary}&rdquo;</p>
                <div className="mt-4"><Tracker status={r.status} /></div>
                {r.statusReason && <p className="mt-3 rounded-2xl bg-paper p-3 text-[13px] text-ink-2">{r.statusReason}</p>}
                <p className="mt-3 flex items-center gap-1 text-[12px] text-ink-3"><Icon name="paperclip" size={12} /> {r.evidenceCount} evidence file{r.evidenceCount === 1 ? '' : 's'}</p>
              </div>
            </details>
          </li>
        ))}
      </ul>
    </div>
  );
}
