'use client';
import { useState } from 'react';
import { Icon } from '@/components/Icons';

type Pattern = { category: string; label: string; relatedReports: number; name: string; summary: string; characteristics: string[]; suggestedAction: string };

export function PatternDetector() {
  const [data, setData] = useState<{ source: string; patterns: Pattern[] } | null>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    setData(await fetch('/api/ai/patterns', { method: 'POST' }).then((r) => r.json()).catch(() => null));
    setLoading(false);
  }

  return (
    <section className="rounded-3xl border border-line bg-vault p-5 text-ink">
      <div className="flex flex-wrap items-center gap-3">
        <span className="grid size-10 place-items-center rounded-2xl bg-ink/10 text-ink/70"><Icon name="spark" /></span>
        <div className="flex-1">
          <h2 className="font-bold">AI pattern detection</h2>
          <p className="text-[13px] text-ink/55">Finds recurring patterns across reports. Does not assess guilt.</p>
        </div>
        <button type="button" onClick={run} disabled={loading} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-4 text-[14px] font-bold text-paper disabled:opacity-60">
          {loading ? <span className="size-4 animate-spin rounded-full border-2 border-ink/20 border-t-ink" /> : <Icon name="play" size={12} className="fill-current" />}
          {loading ? 'Analysing…' : data ? 'Run again' : 'Run detection'}
        </button>
      </div>

      {!data && !loading && <p className="mt-10 pb-8 text-center text-[14px] text-ink/45">Analyse the last 60 days of reports.</p>}

      {data && (
        <ul className="mt-5 grid gap-3">
          {data.patterns.map((p) => (
            <li key={p.category} className="animate-rise rounded-2xl bg-ink/[.06] p-4 ring-1 ring-ink/10">
              <p className="text-[12px] font-bold uppercase tracking-wider text-ink/70">Potential {p.label.toLowerCase()} pattern</p>
              <p className="mt-1 text-[17px] font-bold">{p.name}</p>
              <p className="mt-1 text-[15px] text-ink/80">{p.summary}</p>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {p.characteristics.map((c) => <li key={c} className="rounded-full bg-ink/10 px-2.5 py-1 text-[12px]">{c}</li>)}
              </ul>
              <p className="mt-3 flex gap-2 border-t border-ink/10 pt-3 text-[13px] text-ink/70"><Icon name="shieldCheck" size={16} className="mt-0.5 shrink-0 text-ink/70" /> {p.suggestedAction}</p>
            </li>
          ))}
          <li className="text-[12px] text-ink/40">Counts computed by TRACE · wording by {data.source === 'gemini' ? 'Gemini' : 'offline fallback'}</li>
        </ul>
      )}
    </section>
  );
}
