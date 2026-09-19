'use client';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { deviceId } from '@/lib/store';
import { BankOptions } from './BankOptions';
import { Icon } from './Icons';
import { btn } from './ui';

type Found = { accountNumber: string; bank: string | null };

// Form fields read like blanks on a printed form: label above, ink underline.
const field = 'h-14 w-full rounded-none border-0 border-b-2 border-ink bg-transparent px-0 outline-none transition focus:border-brand';

export function CheckForm() {
  const router = useRouter();
  const [bank, setBank] = useState('');
  const [number, setNumber] = useState('');
  const [reading, setReading] = useState(false);
  const [found, setFound] = useState<Found[] | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const valid = bank && number.length === 10;

  async function readImage(file: File | undefined) {
    if (!file) return;
    setReading(true);
    setFound(null);
    setNote(null);
    const form = new FormData();
    form.set('image', file);
    try {
      const res = await fetch('/api/extract', { method: 'POST', headers: { 'x-trace-device': deviceId() }, body: form });
      const data = await res.json();
      if (!res.ok) setNote(data.error);
      else if (!data.accounts.length) setNote('No account number found in that image. Type it instead.');
      else if (data.accounts.length === 1) pick(data.accounts[0], true);
      else setFound(data.accounts);
    } catch {
      setNote("Couldn't upload the image. Check your connection.");
    } finally {
      setReading(false);
    }
  }

  // Filled in, never auto-submitted: the user confirms what was read.
  function pick(f: Found, single = false) {
    setNumber(f.accountNumber);
    if (f.bank) setBank(f.bank);
    setFound(null);
    setNote(`${single ? 'Found' : 'Selected'} ${f.accountNumber}${f.bank ? ` · ${f.bank}` : ''}. Check the digits${f.bank ? '' : ', choose the bank'} and press Check account.`);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) router.push(`/account/${number}?bank=${encodeURIComponent(bank)}`);
      }}
      className="grid gap-6"
    >
      <label className="grid gap-1">
        <span className="eyebrow">01 · Bank</span>
        <span className="relative">
          <select value={bank} onChange={(e) => setBank(e.target.value)} required className={`${field} appearance-none pr-8 text-[18px] font-medium ${bank ? '' : 'text-ink-4'}`}>
            <BankOptions />
          </select>
          <Icon name="chevronDown" className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-ink-2" />
        </span>
      </label>
      <label className="grid gap-1">
        <span className="eyebrow flex justify-between">02 · Account number <span className="tnum" aria-live="polite">{number.length}/10</span></span>
        <input value={number} onChange={(e) => setNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
          inputMode="numeric" autoComplete="off" placeholder="0000000000"
          className={`${field} font-mono text-[26px] font-medium tracking-[0.18em] placeholder:text-ink-4/50`} />
      </label>

      <div className="-mt-2">
        <button type="button" onClick={() => fileRef.current?.click()} disabled={reading}
          className="inline-flex min-h-10 items-center gap-2 text-[14px] font-medium text-brand underline decoration-1 underline-offset-4 disabled:opacity-60">
          {reading
            ? <><span className="size-3.5 animate-spin rounded-full border-2 border-brand/30 border-t-brand" /> Reading screenshot…</>
            : <><Icon name="image" size={16} /> Or use a screenshot</>}
        </button>
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/heic" hidden
          onChange={(e) => { readImage(e.target.files?.[0]); e.target.value = ''; }} />

        {found && (
          <div className="mt-2 border-y border-ink py-2">
            <p className="eyebrow mb-1">Several accounts found — choose one</p>
            {found.map((f) => (
              <button key={f.accountNumber} type="button" onClick={() => pick(f)}
                className="flex min-h-11 w-full items-baseline border-b border-line-2 text-left last:border-0 hover:bg-ink/5">
                <span className="font-mono font-medium tracking-wider">{f.accountNumber}</span><span className="leader" /><span className="text-[14px] text-ink-3">{f.bank ?? 'bank not shown'}</span>
              </button>
            ))}
          </div>
        )}
        {note && <p aria-live="polite" className="mt-1 text-[13px] text-ink-2">{note}</p>}
      </div>

      <button type="submit" disabled={!valid} className={btn.primary}>
        Check account <Icon name="chevronRight" size={18} />
      </button>
    </form>
  );
}
