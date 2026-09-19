'use client';
import { useState } from 'react';
import Link from 'next/link';
import { BankOptions } from '@/components/BankOptions';
import { Icon } from '@/components/Icons';
import { page, RISK, TopBar } from '@/components/ui';
import { CATEGORIES, Intelligence, n } from '@/lib/shared';

// Integration example. A real bank calls /v1/check-account from its own server with its API key;
// this page calls the first-party endpoint so no key is exposed in the browser.
// Name enquiry is the bank's own system and is not part of TRACE, which never returns names.

type Stage = 'form' | 'checking' | 'warning' | 'cancelled' | 'sent';

const LIGHT = {
  '--color-ink': '#1b1813', '--color-ink-2': '#48423a', '--color-ink-3': '#756d61', '--color-ink-4': '#a39a8c',
  '--color-paper': '#efeae0', '--color-raised': '#faf8f3', '--color-line': '#d8d0c0', '--color-line-2': '#e6dfd2',
  '--color-high': '#b2261b', '--color-high-wash': '#f4dfd9', '--color-medium': '#94600a', '--color-medium-wash': '#f1e5cc',
  '--color-low': '#2d6a3e', '--color-low-wash': '#dde9dc', '--color-brand': '#1f3f8a', '--color-brand-wash': '#e3e7f0',
  colorScheme: 'light',
} as React.CSSProperties;

export default function BankDemo() {
  const [bank, setBank] = useState('GTBank');
  const [account, setAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [stage, setStage] = useState<Stage>('form');
  const [intel, setIntel] = useState<Intelligence | null>(null);
  const [showApi, setShowApi] = useState(false);

  const name = account.length === 10 ? 'RECIPIENT NAME (from bank)' : null;
  const naira = `₦${n(Number(amount || 0))}`;

  async function proceed() {
    setStage('checking');
    const [r] = await Promise.all([
      fetch('/api/check', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ bank, accountNumber: account }) })
        .then((x) => x.json() as Promise<Intelligence>).catch(() => null),
      new Promise((res) => setTimeout(res, 900)),
    ]);
    setIntel(r);
    // Fail open: if TRACE is unreachable the bank's normal flow continues.
    setStage(r && r.risk !== 'LOW' ? 'warning' : 'sent');
  }

  return (
    <div className={page.wide}>
    <TopBar back="/developers" title="Integration example" />
    <div className="grid items-start gap-8 lg:grid-cols-[400px_1fr]">
      {/* Phone: a light bank app, so it keeps a light palette inside the dark site. */}
      <div style={LIGHT} className="relative mx-auto w-full max-w-[400px] overflow-hidden rounded-md border-[10px] border-ink bg-[#f6f7fb] text-ink">
        <div className="flex items-center justify-between bg-[#0b3d2e] px-5 pb-4 pt-5 text-white">
          <span className="flex items-center gap-2 font-bold"><span className="grid size-7 place-items-center rounded-lg bg-white/15"><Icon name="bank" size={16} /></span> Nova Bank</span>
          <span className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-semibold">Example</span>
        </div>

        <div className="min-h-[600px] p-5">
          <h1 className="text-[22px] font-extrabold">Send money</h1>
          <div className="mt-3 rounded-2xl bg-white p-3.5 text-[13px]">
            <p className="text-ink-3">From</p>
            <p className="flex justify-between font-semibold"><span>Savings •••• 4410</span><span className="tnum">₦1,204,550.00</span></p>
          </div>

          <div className="mt-4 grid gap-3">
            <label className="grid gap-1 text-[13px] font-semibold text-ink-2">Recipient bank
              <select value={bank} onChange={(e) => setBank(e.target.value)} disabled={stage !== 'form'} className="h-12 w-full min-w-0 rounded-xl border border-line bg-white px-3 text-[15px] font-semibold text-ink">
                <BankOptions />
              </select>
            </label>
            <label className="grid gap-1 text-[13px] font-semibold text-ink-2">Account number
              <input value={account} onChange={(e) => setAccount(e.target.value.replace(/\D/g, '').slice(0, 10))} disabled={stage !== 'form'} inputMode="numeric"
                className="h-12 rounded-xl border border-line bg-white px-3 font-mono text-[17px] font-bold tracking-wider text-ink" />
            </label>
            {name && <p className="-mt-1 flex items-center gap-1.5 rounded-lg bg-[#e8f3ee] px-3 py-2 text-[13px] font-bold text-[#0b3d2e]"><Icon name="check" size={14} strokeWidth={3} /> {name}</p>}
            <label className="grid gap-1 text-[13px] font-semibold text-ink-2">Amount
              <span className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[20px] font-bold text-ink">₦</span>
                <input value={Number(amount || 0).toLocaleString('en-NG')} onChange={(e) => setAmount(e.target.value.replace(/\D/g, '').slice(0, 9))} disabled={stage !== 'form'} inputMode="numeric"
                  className="tnum h-14 w-full rounded-xl border border-line bg-white pl-8 pr-3 text-[24px] font-extrabold text-ink" />
              </span>
            </label>
            <label className="grid gap-1 text-[13px] font-semibold text-ink-2">Narration
              <input placeholder="What is this for?" disabled={stage !== 'form'} className="h-12 rounded-xl border border-line bg-white px-3 text-[15px] text-ink" />
            </label>
          </div>

          <button type="button" onClick={proceed} disabled={stage !== 'form' || !name || !Number(amount)}
            className="mt-5 inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#0b3d2e] text-[16px] font-bold text-white disabled:opacity-50">
            {stage === 'checking' ? <><span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Checking recipient…</> : 'Continue'}
          </button>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-ink-3"><Icon name="shieldCheck" size={13} /> Recipient checks powered by TRACE</p>
        </div>

        {/* Warning sheet */}
        {stage === 'warning' && intel && (
          <div className="absolute inset-0 z-10 flex items-end bg-ink/50" role="alertdialog" aria-modal="true" aria-labelledby="warn-title">
            <div className="w-full animate-sheet rounded-t-[28px] bg-white p-6">
              <div className={`mx-auto grid size-14 place-items-center rounded-full ${RISK[intel.risk].solid} text-white`}><Icon name={RISK[intel.risk].icon} size={28} strokeWidth={2.4} /></div>
              <h2 id="warn-title" className="mt-4 text-center text-[24px] font-extrabold">{intel.risk === 'HIGH' ? '🚨 Before you send' : 'Review before you send'}</h2>
              <p className="mt-1 text-center text-[15px] font-semibold leading-snug">
                {intel.risk === 'HIGH' ? 'TRACE has detected a high-risk signal for this account.' : 'TRACE has found some reports for this account.'}
              </p>
              <div className={`mt-4 grid grid-cols-2 gap-2 rounded-2xl ${RISK[intel.risk].bg} p-3 text-center`}>
                <p><span className="tnum block text-[22px] font-extrabold">{intel.reports}</span><span className="text-[12px] text-ink-2">reports</span></p>
                <p><span className="tnum block text-[22px] font-extrabold">{intel.uniqueReporters}</span><span className="text-[12px] text-ink-2">unique reporters</span></p>
              </div>
              {intel.categories[0] && <p className="mt-3 text-center text-[14px]"><span className="text-ink-3">Common pattern:</span> <strong>{CATEGORIES[intel.categories[0]]}</strong></p>}
              <p className="mt-1 text-center text-[12px] text-ink-3">Based on community reports. Not proof of wrongdoing.</p>
              <div className="mt-5 grid gap-2">
                <button type="button" autoFocus onClick={() => setStage('cancelled')} className="min-h-13 rounded-2xl bg-ink text-[16px] font-bold text-white">Cancel transfer</button>
                <button type="button" onClick={() => setStage('sent')} className="min-h-12 rounded-2xl text-[15px] font-semibold text-ink-2 hover:bg-paper">Continue anyway</button>
              </div>
            </div>
          </div>
        )}

        {(stage === 'cancelled' || stage === 'sent') && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white p-8 text-center animate-rise">
            <div className={`grid size-16 place-items-center rounded-full ${stage === 'sent' ? 'bg-[#0b3d2e]' : 'bg-ink'} text-white`}><Icon name={stage === 'sent' ? 'check' : 'shieldCheck'} size={30} strokeWidth={2.6} /></div>
            <h2 className="mt-5 text-[22px] font-extrabold">{stage === 'sent' ? 'Transfer simulated' : 'Transfer cancelled'}</h2>
            <p className="mt-2 text-[14px] text-ink-2">
              {stage === 'sent' ? `${naira} to ${name}. (Example only — no money moves.)` : 'Good call. Verify the recipient another way before paying.'}
            </p>
            {stage === 'sent' && intel?.risk === 'LOW' && <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-low-wash px-3 py-1 text-[12px] font-bold text-low"><Icon name="shieldCheck" size={13} /> Checked by TRACE · low risk signal</p>}
            <div className="mt-6 grid w-full gap-2">
              {stage === 'cancelled' && <Link href={`/report?account=${account}&bank=${encodeURIComponent(bank)}`} className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-ink font-bold text-white">Report this account</Link>}
              <button type="button" onClick={() => { setStage('form'); setIntel(null); }} className="min-h-12 rounded-2xl border border-line font-semibold">Start again</button>
            </div>
          </div>
        )}
      </div>

      {/* Explainer */}
      <div className="lg:pt-6">
        <p className="eyebrow">Bank integration example</p>
        <h2 className="mt-2 font-serif text-[40px] font-medium leading-tight">A warning at the moment it matters.</h2>
        <ol className="mt-5 grid gap-3 text-[15px]">
          {['Customer enters recipient and amount.', 'Bank calls TRACE on Continue — one API request.', 'HIGH or MEDIUM? Show a warning. The customer still decides.', 'LOW, or TRACE unreachable? Transfer continues normally.'].map((s, i) => (
            <li key={s} className="flex gap-3"><span className="w-6 shrink-0 font-mono text-[13px] leading-6 text-ink-4">{i + 1}</span><span className="pt-0.5">{s}</span></li>
          ))}
        </ol>
        <button type="button" onClick={() => setShowApi((v) => !v)} aria-expanded={showApi} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-raised px-4 text-[14px] font-bold">
          <Icon name="code" size={16} /> {showApi ? 'Hide' : 'Show'} API call
        </button>
        {showApi && (
          <pre className="mt-3 overflow-x-auto rounded-2xl bg-ink p-4 font-mono text-[12.5px] leading-relaxed text-[#e9e4d6]">
{`POST /v1/check-account
${JSON.stringify({ bank, accountNumber: account }, null, 2)}

${intel ? JSON.stringify({ risk: intel.risk, score: intel.score, reports: intel.reports, uniqueReporters: intel.uniqueReporters, categories: intel.categories, recommendation: intel.recommendation }, null, 2) : '// press Continue to call the API'}`}
          </pre>
        )}
        <p className="mt-6 text-[13px] text-ink-3">Nova Bank is fictional. Recipient names come from the bank&apos;s own name enquiry, never from TRACE.</p>
      </div>
    </div>
    </div>
  );
}
