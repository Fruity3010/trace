'use client';
// "The first hour" on the web. The wording, order and advice all come from
// escalate.ts through /api/cases, the same code the WhatsApp flow uses: call the
// bank first (only it can get a PND), then put it in writing, then the reference,
// then escalation. This file only lays it out.
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BankOptions } from '@/components/BankOptions';
import { Icon } from '@/components/Icons';
import { btn, Line, page, Rule, TopBar } from '@/components/ui';
import type { CaseView } from '@/lib/escalate';
import { formatDate, n } from '@/lib/shared';
import { deviceId } from '@/lib/store';

const field = 'card-sm h-13 w-full min-w-0 px-3 text-[15px] outline-none focus:ring-4 focus:ring-brand/15';
const WHEN = [
  { key: 'hour', label: 'Less than an hour ago' },
  { key: 'today', label: 'Earlier today' },
  { key: 'date', label: 'Another day' },
] as const;

async function api(path: string, body?: object): Promise<CaseView | null> {
  const res = await fetch(path, {
    method: body ? 'POST' : 'GET',
    headers: { 'content-type': 'application/json', 'x-trace-device': deviceId() },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error ?? 'Something went wrong. Please try again.');
  return data;
}

export function HelpFlow() {
  const [view, setView] = useState<CaseView | null>(null);
  const [loading, setLoading] = useState(true);
  const [fresh, setFresh] = useState(false);

  useEffect(() => {
    api('/api/cases').then(setView).catch(() => setView(null)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className={page.mid}><TopBar title="Get help" /><p className="mt-10 text-ink-3">Loading…</p></div>;
  if (view && !fresh && view.status !== 'resolved') return <CaseScreen view={view} setView={setView} onNew={() => setFresh(true)} />;
  return <Intake onOpen={(v) => { setView(v); setFresh(false); }} />;
}

/* ───────────── Intake ───────────── */

function Intake({ onOpen }: { onOpen: (v: CaseView) => void }) {
  const [when, setWhen] = useState<(typeof WHEN)[number]['key'] | ''>('');
  const [date, setDate] = useState('');
  const [account, setAccount] = useState('');
  const [bank, setBank] = useState('');
  const [amount, setAmount] = useState('');
  const [victimBank, setVictimBank] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const ready = (when === 'hour' || when === 'today' || (when === 'date' && date)) && account.length === 10 && bank && victimBank;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready) return;
    const sentAt = when === 'hour' ? new Date(Date.now() - 30 * 60_000)
      : when === 'today' ? new Date(Date.now() - 6 * 3_600_000)
      : new Date(`${date}T12:00:00`);
    setBusy(true); setError('');
    try {
      onOpen((await api('/api/cases', { sentAt: sentAt.toISOString(), accountNumber: account, bank, victimBank, amount: amount || null }))!);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`${page.mid} animate-rise`}>
      <TopBar title="Get help" />
      <h1 className="font-serif text-[34px] font-semibold leading-tight lg:text-[44px]">Sent money and something is wrong?</h1>
      <p className="mt-2 max-w-lg text-[16px] text-ink-2">Move fast. Only <em>your</em> bank can ask for the money to be frozen, and the first hours matter most. Three questions, then we tell you exactly what to say.</p>

      <form onSubmit={submit} className="mt-8 grid gap-7">
        <fieldset>
          <Rule n="01">When did you send it?</Rule>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {WHEN.map((w) => (
              <button key={w.key} type="button" onClick={() => setWhen(w.key)} aria-pressed={when === w.key}
                className={`card-sm min-h-12 px-3 text-[15px] font-semibold ${when === w.key ? '!border-ink bg-ink text-paper' : 'hover:border-ink-4'}`}>
                {w.label}
              </button>
            ))}
          </div>
          {when === 'date' && (
            <input type="date" aria-label="Date you sent the money" value={date} max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDate(e.target.value)} className={`${field} mt-2 font-mono`} />
          )}
        </fieldset>

        <fieldset>
          <Rule n="02">Where did the money go?</Rule>
          <div className="mt-3 grid grid-cols-[1fr_1.2fr] gap-2">
            <select aria-label="Their bank" value={bank} onChange={(e) => setBank(e.target.value)} className={`${field} font-semibold`}>
              <BankOptions placeholder="Their bank" />
            </select>
            <input aria-label="Account number you sent to" value={account} inputMode="numeric" placeholder="Account number"
              onChange={(e) => setAccount(e.target.value.replace(/\D/g, '').slice(0, 10))}
              className={`${field} font-mono text-[16px] font-bold tracking-wider placeholder:font-sans placeholder:font-medium placeholder:tracking-normal`} />
          </div>
        </fieldset>

        <fieldset>
          <Rule n="03">How much, and from which bank?</Rule>
          <div className="mt-3 grid grid-cols-[1fr_1.2fr] gap-2">
            <input aria-label="Amount in naira (optional)" value={amount} inputMode="numeric" placeholder="₦ amount (optional)"
              onChange={(e) => setAmount(e.target.value.replace(/\D/g, '').slice(0, 11))} className={`${field} font-mono`} />
            <select aria-label="Your bank" value={victimBank} onChange={(e) => setVictimBank(e.target.value)} className={`${field} font-semibold`}>
              <BankOptions placeholder="Your bank (you sent from)" />
            </select>
          </div>
        </fieldset>

        {error && <p role="alert" className="text-[14px] font-semibold text-high">{error}</p>}
        <button type="submit" disabled={!ready || busy} className={btn.primary}>
          {busy ? 'Opening your case…' : <>Tell me what to do <Icon name="chevronRight" size={18} /></>}
        </button>
        <p className="-mt-3 text-center text-[13px] text-ink-3">Prefer WhatsApp? Send <strong className="font-mono">HELP ME</strong> to TRACE.</p>
      </form>
    </div>
  );
}

/* ───────────── The case ───────────── */

function CaseScreen({ view: v, setView, onNew }: { view: CaseView; setView: (v: CaseView | null) => void; onNew: () => void }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const act = async (body: object) => {
    setBusy(true); setError('');
    try { setView(await api(`/api/cases/${v.id}`, body)); } catch (err) { setError((err as Error).message); } finally { setBusy(false); }
  };
  const called = v.status !== 'open';
  const later = v.next.step === 'wait' || v.next.step === 'escalate';

  return (
    <div className={`${page.mid} animate-rise`}>
      <TopBar title={`Case ${v.id}`} right={<button type="button" onClick={onNew} className="text-[13px] font-semibold text-brand underline underline-offset-4">New case</button>} />

      <section className="card p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-mono text-[26px] font-bold tracking-wider">{v.accountNumber}</p>
          <span className="eyebrow">{v.status}</span>
        </div>
        <div className="mt-3 grid gap-1">
          <Line label="Their bank">{v.bank ?? '—'}</Line>
          <Line label="Sent">{v.amount ? `₦${n(v.amount)}` : 'Amount not given'} · {formatDate(v.sentAt)}</Line>
          <Line label="From">{v.victimBank ?? '—'}</Line>
          {v.priorReporters > 0 && <Line label="Already reported by"><span className="text-high">{n(v.priorReporters)} {v.priorReporters === 1 ? 'person' : 'people'}</span></Line>}
        </div>
      </section>

      {error && <p role="alert" className="mt-4 text-[14px] font-semibold text-high">{error}</p>}

      <Step n="01" title="Call your bank" done={called}>
        <p className="font-serif text-[22px] font-semibold leading-snug">{v.urgency.headline}</p>
        <p className="mt-1 text-ink-2">{v.urgency.detail}</p>
        {v.desk?.phone ? (
          <a href={`tel:${v.desk.phone.replace(/[^\d+]/g, '')}`} className={`${btn.primary} mt-4`}>
            <Icon name="phone" size={18} /> Call {v.victimBank}: {v.desk.phone}
          </a>
        ) : (
          <p className="mt-4 flex gap-3 rounded-md border border-line p-4 text-[14px] text-ink-2"><Icon name="phone" className="shrink-0 text-ink" />{v.cardAdvice}</p>
        )}
        <p className="eyebrow mt-5">Say exactly this</p>
        <Letter text={v.script.join('\n')} italic />
        <p className="mt-3 flex gap-2 text-[14px] font-semibold text-medium"><Icon name="alert" size={17} className="shrink-0" />{v.referenceNudge}</p>
        {!called && <button type="button" disabled={busy} onClick={() => act({ action: 'filed' })} className={`${btn.secondary} mt-4`}>I have called my bank</button>}
      </Step>

      {called && (
        <Step n="02" title="Put it in writing">
          <p className="text-ink-2">This is your proof that you told them, and when. Send it to your bank the same day.</p>
          <Letter text={v.complaint} copy />
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {v.desk?.email && <a className={btn.secondary} href={`mailto:${v.desk.email}?subject=${encodeURIComponent(`Fraud complaint — ${v.id}`)}&body=${encodeURIComponent(v.complaint)}`}><Icon name="send" size={17} /> Email {v.victimBank}</a>}
            {v.desk?.whatsapp && <a className={btn.secondary} target="_blank" rel="noopener noreferrer" href={`https://wa.me/${v.desk.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(v.complaint)}`}><Icon name="whatsapp" size={17} /> WhatsApp {v.victimBank}</a>}
          </div>
          {!v.desk?.email && !v.desk?.whatsapp && <p className="mt-3 text-[14px] text-ink-3">Send it through your banking app, by email, or hand it in at your branch. Get the address from your banking app, not from a web search.</p>}
        </Step>
      )}

      {called && (
        <Step n="03" title="Warn the next person" done={v.reportFiled}>
          {v.reportFiled
            ? <p className="text-ink-2">Your report is on this account now. Others checking it will see it; you are never named. <Link href="/reports" className="text-brand underline underline-offset-4">Your reports</Link></p>
            : <Story busy={busy} onSubmit={(text) => act({ action: 'story', text })} />}
        </Step>
      )}

      {called && (
        <Step n="04" title="Your complaint reference" done={!!v.reference}>
          {v.reference
            ? <p className="text-ink-2">Reference <strong className="font-mono text-ink">{v.reference}</strong> is saved. Your complaint is on record with a date.</p>
            : <Reference busy={busy} onSubmit={(reference) => act({ action: 'reference', reference })} />}
        </Step>
      )}

      {/* 'call' and 'reference' are steps 01 and 04 above; only what comes after gets its own step. */}
      {later && (
        <Step n="05" title={v.next.title}>
          {v.next.body.map((b) => <p key={b} className="text-ink-2">{b}</p>)}
          {v.cbnLetter && (
            <>
              <Letter text={v.cbnLetter} copy />
              <Contact a={v.authorities.find((x) => x.key === 'cbn')!} fallback="Get their contact from cbn.gov.ng — the official site only." />
            </>
          )}
        </Step>
      )}

      <Step n={!called ? '02' : later ? '06' : '05'} title="Report the crime">
        <p className="text-ink-2">Alongside your bank, not instead of it. They will ask for your bank&apos;s complaint reference, so get that first.</p>
        <ul className="mt-3 grid gap-3">
          {v.authorities.filter((a) => a.key !== 'cbn').map((a) => (
            <li key={a.key} className="rounded-md border border-line p-4">
              <p className="font-semibold">{a.label}</p>
              <p className="text-[14px] text-ink-2">{a.role}</p>
              <Contact a={a} fallback="We haven't verified a contact for them yet. Use their official website only — never a number or link someone sends you." />
            </li>
          ))}
        </ul>
      </Step>

      <section className="mt-8 rounded-md border border-high/40 bg-high-wash p-5">
        <p className="eyebrow !text-high">Remember</p>
        <ul className="mt-2 grid gap-2 text-[15px]">
          {v.never.map((x) => <li key={x} className="flex gap-2"><Icon name="octagon" size={17} className="mt-0.5 shrink-0 text-high" />{x}</li>)}
        </ul>
      </section>

      {called && (
        <button type="button" disabled={busy} onClick={() => act({ action: 'resolved' })} className={`${btn.secondary} mt-6`}>
          <Icon name="check" size={18} /> My bank has resolved this — close the case
        </button>
      )}
    </div>
  );
}

function Step({ n: num, title, done, children }: { n: string; title: string; done?: boolean; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <Rule n={num}>{title}{done && <span className="ml-auto flex items-center gap-1 !text-low"><Icon name="check" size={14} /> Done</span>}</Rule>
      <div className="mt-3">{children}</div>
    </section>
  );
}

/** Text the person reads out or sends, exactly as written. */
function Letter({ text, copy, italic }: { text: string; copy?: boolean; italic?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-3 rounded-md border border-line bg-vault">
      <pre className={`whitespace-pre-wrap p-4 font-sans text-[15px] leading-relaxed ${italic ? 'italic' : ''}`}>{text}</pre>
      {copy && (
        <button type="button" onClick={() => navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); })}
          className="flex min-h-11 w-full items-center justify-center gap-2 border-t border-line text-[14px] font-semibold hover:bg-ink/5">
          <Icon name={copied ? 'check' : 'doc'} size={16} /> {copied ? 'Copied' : 'Copy'}
        </button>
      )}
    </div>
  );
}

function Contact({ a, fallback }: { a: CaseView['authorities'][number]; fallback: string }) {
  if (!a.verified) return <p className="mt-2 text-[13px] text-ink-3">{fallback}</p>;
  return (
    <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[14px]">
      {a.phone && <a className="text-brand underline underline-offset-4" href={`tel:${a.phone.replace(/[^\d+]/g, '')}`}>{a.phone}</a>}
      {a.email && <a className="text-brand underline underline-offset-4" href={`mailto:${a.email}`}>{a.email}</a>}
      {a.form && <a className="text-brand underline underline-offset-4" href={a.form} target="_blank" rel="noopener noreferrer">Official form</a>}
    </p>
  );
}

function Story({ busy, onSubmit }: { busy: boolean; onSubmit: (text: string) => void }) {
  const [text, setText] = useState('');
  return (
    <>
      <p className="text-ink-2">In a sentence or two, in any language. It becomes a report on this account, so the next person is warned. You are never named.</p>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} placeholder="e.g. I paid for a phone on Instagram and they blocked me after the transfer."
        className="card-sm mt-3 w-full p-3 text-[15px] outline-none focus:ring-4 focus:ring-brand/15" />
      <button type="button" disabled={busy || text.trim().length < 10} onClick={() => onSubmit(text)} className={`${btn.secondary} mt-2`}>Add my report</button>
    </>
  );
}

function Reference({ busy, onSubmit }: { busy: boolean; onSubmit: (ref: string) => void }) {
  const [ref, setRef] = useState('');
  return (
    <>
      <p className="text-ink-2">Your bank should give you one on the call or by email. Every later step, including CBN, depends on it.</p>
      <div className="mt-3 flex gap-2">
        <input value={ref} onChange={(e) => setRef(e.target.value.slice(0, 60))} placeholder="e.g. CMP/2026/12345" aria-label="Complaint reference" className={`${field} font-mono`} />
        <button type="button" disabled={busy || !ref.trim()} onClick={() => onSubmit(ref.trim())} className="shrink-0 rounded-md bg-ink px-5 font-semibold text-paper disabled:bg-ink-4">Save</button>
      </div>
    </>
  );
}
