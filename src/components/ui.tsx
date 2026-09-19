import Link from 'next/link';
import type { ReactNode } from 'react';
import type { Risk } from '@/lib/shared';
import { Icon, IconName } from './Icons';

export const RISK: Record<Risk, { label: string; icon: IconName; text: string; bg: string; solid: string; ring: string; border: string }> = {
  HIGH: { label: 'High risk', icon: 'octagon', text: 'text-high', bg: 'bg-high-wash', solid: 'bg-high', ring: 'ring-high/30', border: 'border-high' },
  MEDIUM: { label: 'Medium risk', icon: 'alert', text: 'text-medium', bg: 'bg-medium-wash', solid: 'bg-medium', ring: 'ring-medium/30', border: 'border-medium' },
  LOW: { label: 'Low risk', icon: 'shieldCheck', text: 'text-low', bg: 'bg-low-wash', solid: 'bg-low', ring: 'ring-low/30', border: 'border-low' },
};

/** Risk is always colour + icon + text, never colour alone. */
export function RiskBadge({ risk, size = 'sm' }: { risk: Risk; size?: 'sm' | 'lg' }) {
  const r = RISK[risk];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-sm border font-mono font-bold uppercase tracking-[0.1em] ${r.border} ${r.text} ${
      size === 'lg' ? 'px-2.5 py-1 text-[13px]' : 'px-1.5 py-0.5 text-[10.5px]'}`}>
      <Icon name={r.icon} size={size === 'lg' ? 15 : 12} strokeWidth={2.5} />
      {size === 'lg' ? r.label : risk}
    </span>
  );
}

/** The verdict, stamped onto the report. */
export function Stamp({ risk, score }: { risk: Risk; score: number }) {
  const r = RISK[risk];
  return (
    <span className={`stamp animate-stamp ${r.text} text-[15px]`} aria-label={`${r.label}, score ${score} out of 100`}>
      <Icon name={r.icon} size={17} strokeWidth={2.6} />
      {risk} risk
      <span className="tnum border-l-2 border-current pl-2">{score}</span>
    </span>
  );
}

export function Brand({ small }: { small?: boolean }) {
  return (
    <span className="inline-flex items-baseline gap-2" aria-label="TRACE">
      <span className={`font-mono font-bold tracking-[0.22em] ${small ? 'text-[15px]' : 'text-[17px]'}`}>TRACE</span>
      <span className="font-serif text-[13px] italic text-ink-3">check before you trust</span>
    </span>
  );
}

export function TraceMark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="2.2" strokeDasharray="4 3" />
      <circle cx="12" cy="12" r="3" fill="currentColor" />
    </svg>
  );
}

/** Width of a page's content. Consumer flows stay narrow; data views use the full width. */
export const page = { narrow: 'mx-auto w-full max-w-xl', mid: 'mx-auto w-full max-w-3xl', wide: 'mx-auto w-full max-w-6xl' };

export function TopBar({ title, back = '/', right }: { title?: string; back?: string | null; right?: ReactNode }) {
  return (
    <div className="flex h-14 items-center gap-2 lg:h-12">
      {back !== null && (
        <Link href={back} aria-label="Back" className="-ml-2 grid size-11 place-items-center rounded-md hover:bg-ink/5">
          <Icon name="back" size={21} />
        </Link>
      )}
      {title && <h1 className="eyebrow !text-[12px] !text-ink-2">{title}</h1>}
      <div className="ml-auto">{right}</div>
    </div>
  );
}

/** Section heading in the report style: mono label over a rule. */
export function Rule({ children, n }: { children: ReactNode; n?: string }) {
  return (
    <h2 className="eyebrow flex items-center gap-3 border-b border-ink pb-2">
      {n && <span className="text-ink">{n}</span>}{children}
    </h2>
  );
}

/** Label ........ value */
export function Line({ label, children, className = '' }: { label: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={`flex items-baseline text-[15px] ${className}`}>
      <span className="shrink-0 text-ink-2">{label}</span><span aria-hidden className="leader" /><span className="min-w-0 text-right font-medium">{children}</span>
    </div>
  );
}

export const btn = {
  primary: 'inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-md bg-ink px-5 text-[15px] font-semibold tracking-wide text-raised transition hover:bg-ink-2 active:translate-y-px disabled:bg-ink-4 disabled:text-raised/80',
  brand: 'inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-md bg-ink px-5 text-[15px] font-semibold text-raised transition hover:bg-ink-2 disabled:opacity-40',
  secondary: 'inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-md border border-ink bg-transparent px-5 text-[15px] font-semibold text-ink transition hover:bg-ink/5 active:translate-y-px',
  danger: 'inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-md bg-high px-5 text-[15px] font-semibold text-paper transition',
};

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`card p-5 ${className}`}>{children}</div>;
}

export function HowTraceWorks({ open = false }: { open?: boolean }) {
  return (
    <details open={open} className="card">
      <summary className="flex min-h-14 items-center gap-3 px-5 py-4">
        <span className="font-serif text-[19px] font-medium">How TRACE works</span>
        <Icon name="chevronDown" className="chev ml-auto text-ink-3 transition" />
      </summary>
      <div className="space-y-4 border-t border-line-2 px-5 pb-5 pt-4 text-[14px] leading-relaxed text-ink-2">
        <p>TRACE combines reports, evidence, recency and recurring patterns to provide a risk signal. <strong className="text-ink">A report is not proof that an account owner committed fraud.</strong></p>
        <ol className="grid gap-2">
          {[
            'Community reports are signals, not automatic proof.',
            'Risk scores are informational and calculated by fixed rules, not AI.',
            'One person alone can never raise an account above low risk.',
            'Duplicate reports and report floods are filtered automatically.',
            'Account holders can dispute reports; disputes are reviewed by staff.',
            'Reporter identities are never shown on account pages.',
            'Always verify recipients independently.',
          ].map((t, i) => (
            <li key={t} className="flex gap-3"><span className="font-mono text-[12px] leading-6 text-ink-4">{String(i + 1).padStart(2, '0')}</span>{t}</li>
          ))}
        </ol>
      </div>
    </details>
  );
}
