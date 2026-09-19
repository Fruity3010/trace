import Link from 'next/link';
import { Icon } from '@/components/Icons';
import { page, RiskBadge } from '@/components/ui';
import { dashboard } from '@/lib/engine';
import { responsiveness } from '@/lib/escalate';
import { ago, n } from '@/lib/shared';
import { DisputeQueue } from './DisputeQueue';
import { PatternDetector } from './PatternDetector';

export const dynamic = 'force-dynamic';

export default function IntelPage() {
  const d = dashboard();
  const maxEmerging = Math.max(...d.emerging.map((e) => e.count));
  const maxRegion = Math.max(...d.regions.map((r) => r.count));

  return (
    <div className={`${page.wide} animate-rise pt-4 lg:pt-6`}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1 text-[12px] font-bold text-paper"><Icon name="lock" size={13} /> Internal · review team</p>
          <h1 className="mt-3 font-serif text-[44px] font-medium leading-none">Intelligence</h1>
        </div>
        <p className="text-[13px] text-ink-3">Reporter identities are not shown in this view.{d.sampleReports > 0 && ` Includes ${n(d.sampleReports)} sample reports.`}</p>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { l: 'Accounts checked', v: d.accountsChecked, icon: 'search' as const },
          { l: 'Reports received', v: d.reportsReceived, icon: 'file' as const },
          { l: 'High-risk accounts', v: d.highRisk, icon: 'octagon' as const },
          { l: 'Reports this week', v: d.reportsThisWeek, icon: 'clock' as const },
        ].map((s) => (
          <div key={s.l} className="card p-5">
            <dt className="flex items-center gap-2 text-[13px] font-semibold text-ink-3"><Icon name={s.icon} size={16} /> {s.l}</dt>
            <dd className="tnum mt-2 font-serif text-[40px] font-medium leading-none">{n(s.v)}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <DisputeQueue disputes={d.disputes.map((x) => ({ id: x.id, accountNumber: x.account_number, bank: x.bank, reason: x.reason, contact: x.contact, createdAt: x.created_at, risk: x.intel.risk, reports: x.intel.reports, uniqueReporters: x.intel.uniqueReporters }))} />
        <section className="card p-5">
          <h2 className="font-bold">Automated filtering</h2>
          <p className="mt-1 text-[13px] text-ink-3">Reports that did not count toward risk scores.</p>
          <dl className="mt-4 grid grid-cols-2 gap-3">
            {([['duplicate', 'Duplicates'], ['limited', 'Rate limited'], ['needs_detail', 'Needs detail'], ['removed', 'Removed by dispute']] as const).map(([k, l]) => (
              <div key={k} className="rounded-2xl bg-paper p-3">
                <dt className="text-[12px] font-semibold text-ink-3">{l}</dt>
                <dd className="tnum font-serif text-[28px] font-medium">{n(d.filtered.find((f) => f.status === k)?.n ?? 0)}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <section className="card p-5">
          <h2 className="font-bold">Emerging patterns <span className="font-normal text-ink-3">· last 30 days</span></h2>
          <ul className="mt-4 grid gap-4">
            {d.emerging.map((e) => {
              const delta = e.previous ? Math.round(((e.count - e.previous) / e.previous) * 100) : 100;
              return (
                <li key={e.category}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-semibold">{e.label}</span>
                    <span className="tnum text-[14px]"><strong>{e.count}</strong> reports <span className={`ml-1 text-[12px] font-bold ${delta > 0 ? 'text-high' : 'text-low'}`}>{delta > 0 ? '▲' : '▼'} {Math.abs(delta)}%</span></span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-line-2"><div className="h-full rounded-full bg-ink" style={{ width: `${(e.count / maxEmerging) * 100}%` }} /></div>
                </li>
              );
            })}
          </ul>

          <h2 className="mt-8 font-bold">Scam activity by region <span className="font-normal text-ink-3">· anonymised</span></h2>
          <ul className="mt-3 grid gap-2">
            {d.regions.map((r) => (
              <li key={r.region} className="grid grid-cols-[110px_1fr_40px] items-center gap-3 text-[14px]">
                <span className="font-semibold">{r.region}</span>
                <span className="h-2 overflow-hidden rounded-full bg-line-2"><span className="block h-full rounded-full bg-brand" style={{ width: `${(r.count / maxRegion) * 100}%` }} /></span>
                <span className="tnum text-right text-ink-3">{r.count}</span>
              </li>
            ))}
          </ul>
        </section>

        <PatternDetector />
      </div>

      <BankResponse />

      <section className="mt-4 card p-5">
        <h2 className="font-bold">Trending accounts</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-[14px]">
            <thead className="text-[12px] uppercase tracking-wider text-ink-3">
              <tr><th className="py-2 font-semibold">Account</th><th className="font-semibold">Risk</th><th className="font-semibold">Score</th><th className="font-semibold">Reports</th><th className="font-semibold">Top pattern</th><th className="font-semibold">Last reported</th></tr>
            </thead>
            <tbody>
              {d.trending.map((t) => (
                <tr key={t.accountNumber} className="border-t border-line-2">
                  <td className="py-3"><Link href={`/account/${t.accountNumber}?bank=${encodeURIComponent(t.bank ?? '')}`} className="font-mono font-bold hover:underline">{t.accountNumber}</Link><span className="block text-[12px] text-ink-3">{t.bank}</span></td>
                  <td><RiskBadge risk={t.risk} /></td>
                  <td className="tnum font-semibold">{t.score}</td>
                  <td className="tnum">{t.reports} <span className="text-ink-3">/ {t.uniqueReporters} people</span></td>
                  <td>{t.patterns[0]?.label}</td>
                  <td className="text-ink-2">{t.lastReported && ago(t.lastReported)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

/**
 * Which banks answer their customers when fraud is reported. Built from complaint
 * references people send back to TRACE, so it measures the bank's own acknowledgement,
 * not our opinion of it. Empty until real cases exist — never seeded with samples.
 */
function BankResponse() {
  const rows = responsiveness();
  return (
    <section className="mt-4 card p-5">
      <h2 className="font-bold">Bank response to fraud complaints</h2>
      <p className="mt-1 text-[13px] text-ink-3">
        From complaint references people reported back after contacting their bank. A low acknowledgement rate means customers are not getting a reference number.
      </p>
      {rows.length === 0 ? (
        <p className="mt-4 text-[14px] text-ink-2">No cases yet. This fills as people escalate through TRACE.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-[14px]">
            <thead className="text-[12px] uppercase tracking-wider text-ink-3">
              <tr><th className="py-2 font-semibold">Bank</th><th className="font-semibold">Cases</th><th className="font-semibold">Acknowledged</th><th className="font-semibold">Resolved</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.bank} className="border-t border-line-2">
                  <td className="py-3 font-semibold">{r.bank}</td>
                  <td className="tnum">{n(r.cases)}</td>
                  <td className="tnum">{n(r.acknowledged)} <span className="text-ink-3">/ {Math.round((r.acknowledged / r.cases) * 100)}%</span></td>
                  <td className="tnum">{n(r.resolved)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
