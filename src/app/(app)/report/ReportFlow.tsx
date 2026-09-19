'use client';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { BankOptions } from '@/components/BankOptions';
import { Icon, IconName } from '@/components/Icons';
import { btn, page, TopBar } from '@/components/ui';
import { VoiceButton } from '@/components/VoiceButton';
import { deviceId, useLocal, usePrefs } from '@/lib/store';
import { CATEGORIES, Classification, findBank, LANGUAGES, MyReport } from '@/lib/shared';
import { Tracker } from '../reports/Tracker';

const EVIDENCE: { label: string; icon: IconName; accept: string }[] = [
  { label: 'Screenshot', icon: 'phone', accept: 'image/*' },
  { label: 'Image', icon: 'image', accept: 'image/*' },
  { label: 'Document', icon: 'doc', accept: '.pdf,.doc,.docx,.txt' },
  { label: 'Voice note', icon: 'mic', accept: 'audio/*' },
];
const MAX_FILES = 4;
const MAX_BYTES = 5 * 1024 * 1024;

export function ReportFlow({ initialAccount, initialBank }: { initialAccount: string; initialBank: string }) {
  const [prefs, setPrefs] = usePrefs();
  const [draft, setDraft] = useLocal('trace.draft', '');
  const [step, setStep] = useState<'write' | 'review' | 'done'>('write');
  const [bank, setBank] = useState<string>(findBank(initialBank) ?? '');
  const [account, setAccount] = useState(initialAccount.replace(/\D/g, '').slice(0, 10));
  const [editAccount, setEditAccount] = useState(!initialAccount);
  const [result, setResult] = useState<{ classification: Classification; token: string; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<{ file: File; kind: string }[]>([]);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [submitted, setSubmitted] = useState<MyReport | null>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pendingKind = useRef('');

  const anonymous = prefs.anonymous;
  const speech = LANGUAGES.find((l) => l.code === prefs.lang)?.speech ?? 'en-NG';

  async function understand() {
    setBusy(true);
    setError(null);
    try {
      const text = draft.trim();
      const res = await fetch('/api/ai/classify', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text }) });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (!account && data.classification.accountNumber) setAccount(data.classification.accountNumber);
      setResult({ ...data, text: text.slice(0, 4000) });
      setStep('review');
      window.scrollTo({ top: 0 });
    } catch {
      setError("Couldn't reach TRACE. Your draft is saved on this device — try again when you're connected.");
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    if (!result) return;
    if (account.length !== 10) return setError('Enter the 10-digit account number you paid.');
    setBusy(true);
    setError(null);
    const form = new FormData();
    form.set('text', result.text);
    form.set('classification', JSON.stringify(result.classification));
    form.set('token', result.token);
    form.set('accountNumber', account);
    form.set('bank', bank);
    form.set('anonymous', String(anonymous));
    if (!anonymous) { form.set('name', name); form.set('contact', contact); }
    for (const f of files) { form.append('evidence', f.file); form.append('kind', f.kind); }
    try {
      const res = await fetch('/api/reports', { method: 'POST', headers: { 'x-trace-device': deviceId() }, body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDraft('');
      setSubmitted(data);
      setStep('done');
      window.scrollTo({ top: 0 });
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "Couldn't submit. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  function addFile(f: File | undefined) {
    if (!f) return;
    if (f.size > MAX_BYTES) return setError(`${f.name} is larger than 5 MB.`);
    setError(null);
    setFiles((xs) => [...xs, { file: f, kind: pendingKind.current }].slice(0, MAX_FILES));
  }

  /* ── Done ── */
  if (step === 'done' && submitted) {
    const counted = submitted.status === 'added';
    return (
      <div className={`${page.narrow} animate-rise pt-10 text-center`}>
        <div className={`mx-auto grid size-20 place-items-center rounded-full text-paper ${counted ? 'bg-low' : 'bg-medium'}`}>
          <Icon name={counted ? 'check' : 'info'} size={40} strokeWidth={3} />
        </div>
        <h1 className="mt-6 font-serif text-[40px] font-medium leading-none">{counted ? 'Report filed' : 'Report received'}</h1>
        <p className="mx-auto mt-2 max-w-[34ch] text-ink-2">
          {counted ? 'Your report helps other people make more informed decisions.' : submitted.statusReason}
        </p>
        <p className="mt-6 inline-block border-y-4 border-double border-ink px-5 py-2 font-mono text-[24px] font-medium tracking-[0.14em]">{submitted.id}</p>

        <div className="mt-6 card p-5 text-left">
          <p className="eyebrow mb-4 border-b border-ink pb-2">Track this report</p>
          <Tracker status={submitted.status} />
        </div>
        {anonymous && <p className="mt-4 flex items-center justify-center gap-1.5 text-[13px] text-ink-3"><Icon name="lock" size={14} /> Submitted anonymously</p>}

        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <Link href="/reports" className={btn.primary}>View my reports</Link>
          <Link href={`/account/${submitted.accountNumber}${submitted.bank ? `?bank=${encodeURIComponent(submitted.bank)}` : ''}`} className={btn.secondary}>View account</Link>
        </div>
      </div>
    );
  }

  /* ── Review ── */
  if (step === 'review' && result) {
    const c = result.classification;
    return (
      <div className={`${page.mid} animate-rise`}>
        <TopBar title="Review report" right={<span className="text-[13px] font-semibold text-ink-3">2 of 2</span>} back={null} />
        <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
          <div>
            <p className="eyebrow">We understood this as</p>
            <section className="card mt-2 border-l-4 !border-l-ink p-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-serif text-[24px] font-medium">{CATEGORIES[c.category]}</span>
                <span className="eyebrow">· {c.severity} severity</span>
              </div>
              <p className="mt-3 font-serif text-[19px] italic leading-snug">&ldquo;{c.summary}&rdquo;</p>
              {c.keyFacts.length > 0 && (
                <ul className="mt-4 grid gap-1.5 border-t border-line pt-3 text-[14px] text-ink-2">
                  {c.keyFacts.map((f) => <li key={f} className="flex gap-2"><span className="text-ink-4">—</span>{f}</li>)}
                </ul>
              )}
              {c.language !== 'English' && (
                <p className="mt-3 flex items-center gap-1 text-[12px] text-ink-3"><Icon name="globe" size={13} /> Translated from {c.language}</p>
              )}
            </section>

            {c.needsClarification && c.clarifyingQuestion && (
              <div className="mt-3 flex gap-3 rounded-3xl bg-medium-wash p-4 text-[14px]">
                <Icon name="info" className="shrink-0 text-medium" />
                <div><p className="font-bold">One question</p><p className="text-ink-2">{c.clarifyingQuestion}</p><p className="mt-1 text-ink-3">Tap Edit to add this, or the report won&apos;t count yet.</p></div>
              </div>
            )}

            <div className="mt-3 grid grid-cols-[1fr_1.2fr] gap-2">
              <select aria-label="Bank" value={bank} onChange={(e) => setBank(e.target.value)} className="card-sm h-13 w-full min-w-0 px-3 text-[15px] font-semibold outline-none focus:ring-4 focus:ring-brand/15">
                <BankOptions placeholder="Bank" />
              </select>
              <input aria-label="Account number" value={account} onChange={(e) => setAccount(e.target.value.replace(/\D/g, '').slice(0, 10))} inputMode="numeric" placeholder="Account number"
                className="card-sm h-13 w-full min-w-0 px-3 font-mono outline-none focus:ring-4 focus:ring-brand/15 text-[16px] font-bold tracking-wider placeholder:font-sans placeholder:font-medium placeholder:tracking-normal" />
            </div>
          </div>

          <div>
            <h2 className="eyebrow border-b border-ink pb-2">Evidence · optional</h2>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {EVIDENCE.map((e) => (
                <button key={e.label} type="button" disabled={files.length >= MAX_FILES}
                  onClick={() => { pendingKind.current = e.label; if (fileRef.current) { fileRef.current.accept = e.accept; fileRef.current.click(); } }}
                  className="flex min-h-20 flex-col items-center justify-center gap-1.5 card-sm text-[12px] font-semibold hover:border-ink-4 disabled:opacity-40">
                  <Icon name={e.icon} size={20} /> {e.label}
                </button>
              ))}
            </div>
            <input ref={fileRef} type="file" hidden onChange={(ev) => { addFile(ev.target.files?.[0]); ev.target.value = ''; }} />
            {files.length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-2">
                {files.map((f, i) => (
                  <li key={i} className="inline-flex items-center gap-1.5 rounded-md border border-ink py-1 pl-3 pr-1 text-[13px] font-medium">
                    <Icon name="paperclip" size={13} /> <span className="max-w-[16ch] truncate">{f.file.name}</span>
                    <button type="button" aria-label={`Remove ${f.file.name}`} onClick={() => setFiles((xs) => xs.filter((_, j) => j !== i))} className="grid size-7 place-items-center rounded-full hover:bg-paper/60"><Icon name="x" size={13} /></button>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-1.5 text-[12px] text-ink-3">Up to 4 files, 5 MB each. Evidence is private and never shown publicly.</p>

            <label className="mt-5 flex min-h-16 cursor-pointer items-center gap-3 card p-4">
              <Icon name="lock" size={19} className="text-ink-2" />
              <span className="flex-1"><span className="block font-bold">Report anonymously</span><span className="text-[13px] text-ink-3">Your name will not be displayed publicly.</span></span>
              <input type="checkbox" role="switch" checked={anonymous} onChange={(e) => setPrefs((p) => ({ ...p, anonymous: e.target.checked }))} className="size-6 accent-brand" />
            </label>
            {!anonymous && (
              <div className="mt-2 grid gap-2 card p-4">
                <p className="text-[13px] text-ink-3">Optional, so TRACE can follow up. Stored separately from the report and never shown publicly.</p>
                <input aria-label="Your name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" maxLength={120} className="h-12 rounded-xl border border-line bg-paper px-3" />
                <input aria-label="Phone or email" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Phone or email" maxLength={120} className="h-12 rounded-xl border border-line bg-paper px-3" />
              </div>
            )}

            {error && <p role="alert" className="mt-4 rounded-2xl bg-high-wash p-3 text-[14px] text-high">{error}</p>}

            <p className="mt-6 font-serif text-[22px] font-medium">Is this correct?</p>
            <div className="mt-3 grid gap-2">
              <button type="button" onClick={submit} disabled={busy || account.length !== 10} className={btn.primary}>
                {busy ? 'Submitting…' : <><Icon name="check" size={20} strokeWidth={2.6} /> Yes, submit report</>}
              </button>
              <button type="button" onClick={() => setStep('write')} className={btn.secondary}><Icon name="pen" size={18} /> Edit</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Write ── */
  return (
    <div className={`${page.narrow} animate-rise`}>
      <TopBar back={initialAccount ? `/account/${initialAccount}${initialBank ? `?bank=${encodeURIComponent(initialBank)}` : ''}` : '/'}
        right={<span className="text-[13px] font-semibold text-ink-3">1 of 2</span>} />

      {editAccount ? (
        <div className="grid grid-cols-[1fr_1.2fr] gap-2">
          <select aria-label="Bank" value={bank} onChange={(e) => setBank(e.target.value)} className="card-sm h-13 w-full min-w-0 px-3 text-[15px] font-semibold outline-none focus:ring-4 focus:ring-brand/15">
            <BankOptions placeholder="Bank" />
          </select>
          <input aria-label="Account number you paid" value={account} onChange={(e) => setAccount(e.target.value.replace(/\D/g, '').slice(0, 10))}
            inputMode="numeric" placeholder="Account you paid" className="card-sm h-13 w-full min-w-0 px-3 font-mono outline-none focus:ring-4 focus:ring-brand/15 text-[16px] font-bold tracking-wider placeholder:font-sans placeholder:font-medium placeholder:tracking-normal" />
        </div>
      ) : (
        <div className="flex items-center gap-3 card-sm p-3.5">
          <Icon name="bank" className="text-ink-3" />
          <p className="font-mono font-bold">{account}<span className="font-sans text-[14px] font-semibold text-ink-3"> · {bank || 'Bank'}</span></p>
          <button type="button" onClick={() => setEditAccount(true)} className="ml-auto min-h-10 px-2 text-[13px] font-medium text-brand underline underline-offset-4">Change</button>
        </div>
      )}

      <h1 className="mt-8 font-serif text-[44px] font-medium leading-none">What happened?</h1>
      <p className="mt-1 text-ink-3">In your own words, in any language.</p>

      <div className="mt-5 flex gap-2">
        <button type="button" onClick={() => textRef.current?.focus()} className="card-sm flex min-h-13 flex-1 items-center justify-center gap-2 !rounded-2xl text-[15px] font-bold hover:bg-paper">
          <Icon name="pen" size={18} /> Type
        </button>
        <VoiceButton lang={speech} onTranscript={(t) => setDraft((d) => (d ? `${d} ${t}` : t))} />
      </div>

      <textarea ref={textRef} value={draft} onChange={(e) => setDraft(e.target.value)} rows={6} maxLength={4000}
        aria-label="Describe what happened" placeholder="e.g. I paid this person for an iPhone and they blocked me after receiving the money."
        className="card mt-3 w-full resize-none p-4 text-[16px] leading-relaxed outline-none placeholder:text-ink-4 focus:ring-4 focus:ring-brand/15" />

      <div className="mt-2 flex items-center gap-2 overflow-x-auto pb-1" role="group" aria-label="Voice input language">
        <Icon name="mic" size={15} className="shrink-0 text-ink-3" />
        {LANGUAGES.map((l) => (
          <button key={l.code} type="button" aria-pressed={prefs.lang === l.code} onClick={() => setPrefs((p) => ({ ...p, lang: l.code }))}
            className={`min-h-9 shrink-0 rounded-md px-3 text-[13px] font-semibold ${prefs.lang === l.code ? 'bg-ink text-raised' : 'border border-line text-ink-2 hover:border-ink'}`}>
            {l.label}
          </button>
        ))}
      </div>

      {error && <p role="alert" className="mt-3 rounded-2xl bg-medium-wash p-3 text-[14px] text-ink-2">{error}</p>}

      <button type="button" onClick={understand} disabled={draft.trim().length < 8 || busy} className={`${btn.primary} mt-4`}>
        {busy ? <><span className="size-4 animate-spin rounded-full border-2 border-paper/30 border-t-paper" /> Understanding your report…</> : <>Continue <Icon name="chevronRight" size={18} /></>}
      </button>
      <p className="mt-3 flex items-center justify-center gap-1.5 text-[12px] text-ink-3"><Icon name="lock" size={13} /> Drafts are saved on this device.</p>
    </div>
  );
}
