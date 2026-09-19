'use client';
import Link from 'next/link';
import { useState } from 'react';
import { BankOptions } from '@/components/BankOptions';
import { Icon } from '@/components/Icons';
import { page, RiskBadge } from '@/components/ui';
import { Intelligence } from '@/lib/shared';

const pick = (d: Intelligence) => ({
  risk: d.risk, score: d.score, reports: d.reports, uniqueReporters: d.uniqueReporters,
  categories: d.categories, lastReported: d.lastReported, recommendation: d.recommendation,
});

export default function DevelopersPage() {
  const [bank, setBank] = useState('GTBank');
  const [accountNumber, setAccount] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [res, setRes] = useState<{ status: number; ms: number; body: Intelligence & { error?: string } } | null>(null);
  const [full, setFull] = useState(false);
  const [loading, setLoading] = useState(false);

  async function send() {
    setLoading(true);
    const t = performance.now();
    const r = await fetch('/v1/check-account', { method: 'POST', headers: { 'content-type': 'application/json', ...(apiKey && { authorization: `Bearer ${apiKey}` }) }, body: JSON.stringify({ bank, accountNumber }) });
    setRes({ status: r.status, ms: Math.round(performance.now() - t), body: await r.json() });
    setLoading(false);
  }

  const body = res && (res.body.error || full ? res.body : pick(res.body));

  return (
    <div className={`${page.wide} animate-rise lg:pt-6`}>
      <div className="max-w-2xl pt-4 lg:pt-0">
        <p className="eyebrow inline-flex items-center gap-1.5"><Icon name="code" size={14} /> For banks, fintechs & marketplaces</p>
        <h1 className="mt-3 font-serif text-[52px] font-medium leading-none">TRACE API</h1>
        <p className="mt-2 text-[18px] text-ink-2">Give your customers a warning before money leaves their account.</p>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {/* Request */}
        <section className="card min-w-0 p-5">
          <h2 className="text-[12px] font-bold uppercase tracking-wider text-ink-3">Request</h2>
          <p className="mt-2 font-mono text-[15px] font-bold"><span className="rounded-md bg-low-wash px-1.5 py-0.5 text-low">POST</span> /v1/check-account</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <label className="grid min-w-0 gap-1 text-[13px] font-semibold">bank
              <select value={bank} onChange={(e) => setBank(e.target.value)} className="h-11 w-full min-w-0 rounded-xl border border-line bg-paper px-2 font-mono text-[14px]">
                <BankOptions />
              </select>
            </label>
            <label className="grid min-w-0 gap-1 text-[13px] font-semibold">accountNumber
              <input value={accountNumber} onChange={(e) => setAccount(e.target.value.replace(/\D/g, '').slice(0, 10))} inputMode="numeric"
                className="h-11 w-full min-w-0 rounded-xl border border-line bg-paper px-3 font-mono text-[14px]" />
            </label>
          </div>
          <label className="mt-2 grid gap-1 text-[13px] font-semibold">API key
            <input value={apiKey} onChange={(e) => setApiKey(e.target.value)} type="password" autoComplete="off" placeholder="Required when TRACE_API_KEYS is set"
              className="h-11 w-full min-w-0 rounded-xl border border-line bg-paper px-3 font-mono text-[14px]" />
          </label>
          <pre className="mt-4 overflow-x-auto rounded-2xl border border-line bg-vault p-4 font-mono text-[13px] leading-relaxed text-ink/85">{`curl -X POST https://<your-trace-host>/v1/check-account \\
  -H "Authorization: Bearer $TRACE_KEY" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify({ bank, accountNumber })}'`}</pre>
          <button type="button" onClick={send} disabled={loading || accountNumber.length !== 10} className="btn-glow mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl font-bold text-paper disabled:opacity-50 disabled:shadow-none">
            <Icon name="send" size={18} /> {loading ? 'Sending…' : 'Send request'}
          </button>
        </section>

        {/* Response */}
        <section className="card min-w-0 p-5">
          <div className="flex items-center gap-2">
            <h2 className="text-[12px] font-bold uppercase tracking-wider text-ink-3">Response</h2>
            {res && <span className={`rounded-md px-1.5 py-0.5 font-mono text-[12px] font-bold ${res.status === 200 ? 'bg-low-wash text-low' : 'bg-high-wash text-high'}`}>{res.status}</span>}
            {res && <span className="font-mono text-[12px] text-ink-3">{res.ms} ms</span>}
            {res && !res.body.error && <span className="ml-auto"><RiskBadge risk={res.body.risk} /></span>}
          </div>
          {body ? (
            <>
              <pre className="mt-3 max-h-[420px] overflow-auto rounded-2xl bg-ink p-4 font-mono text-[13px] leading-relaxed text-paper/70">{JSON.stringify(body, null, 2)}</pre>
              {!res.body.error && (
                <label className="mt-3 flex items-center gap-2 text-[13px] font-semibold text-ink-2">
                  <input type="checkbox" checked={full} onChange={(e) => setFull(e.target.checked)} className="size-4 accent-brand" /> Show full response (score factors, patterns, disclaimer)
                </label>
              )}
            </>
          ) : (
            <div className="mt-3 grid h-64 place-items-center rounded-2xl border border-dashed border-line text-[14px] text-ink-3">Send a request to see the live response</div>
          )}
        </section>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {[
          { r: 'WARN', t: 'HIGH · score 70–100', d: 'Interrupt the transfer with a clear warning. Customer decides.' },
          { r: 'CAUTION', t: 'MEDIUM · score 30–69', d: 'Show an inline notice before confirmation.' },
          { r: 'NONE', t: 'LOW · score 0–29', d: 'Proceed normally. No report ≠ guaranteed legitimate.' },
        ].map((x) => (
          <div key={x.r} className="card p-5">
            <p className="font-mono text-[14px] font-bold">recommendation: &quot;{x.r}&quot;</p>
            <p className="mt-1 text-[13px] font-semibold text-ink-3">{x.t}</p>
            <p className="mt-2 text-[14px] text-ink-2">{x.d}</p>
          </div>
        ))}
      </div>

      <section className="mt-4 flex flex-col items-start gap-4 rounded-3xl border border-line bg-vault p-6 text-ink md:flex-row md:items-center">
        <div className="flex-1">
          <p className="font-serif text-[24px] font-medium">One engine. Every channel.</p>
          <p className="mt-1 text-ink/60">The TRACE app, this API and the WhatsApp bot call the same intelligence engine. Scores are deterministic; AI never decides them. No reporter identities are returned.</p>
        </div>
        <Link href="/developers/example" className="inline-flex min-h-13 items-center gap-2 rounded-2xl bg-ink px-5 font-bold text-paper">
          <Icon name="bank" size={19} /> See an integration example
        </Link>
      </section>
    </div>
  );
}
