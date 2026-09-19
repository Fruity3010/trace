import { CheckForm } from '@/components/CheckForm';
import { page, TopBar } from '@/components/ui';

const FACTORS = [
  ['Name on the account', 'Confirmed with the bank, so you can spot a mismatch.'],
  ['Community reports', 'How many, and from how many different people.'],
  ['Patterns & evidence', 'Similar stories, screenshots and receipts.'],
  ['Recency', 'How recently the account was reported.'],
];

export default function CheckPage() {
  return (
    <div className={`${page.wide} animate-rise`}>
      <div className="lg:hidden"><TopBar /></div>
      <div className="grid gap-12 lg:grid-cols-[minmax(0,520px)_1fr] lg:gap-20 lg:pt-10">
        <div>
          <p className="eyebrow">Form TR-1 · Free</p>
          <h1 className="mt-2 font-serif text-[44px] font-medium leading-none lg:text-[56px]">Check an account</h1>
          <p className="mt-3 text-[17px] text-ink-2">Before you send money.</p>
          <div className="card mt-8 p-6 lg:p-8"><CheckForm /></div>
          <p className="mt-4 text-[13px] text-ink-3">We don&apos;t ask for your name, phone number or login details.</p>
        </div>

        <aside className="lg:pt-24">
          <p className="eyebrow border-b border-ink pb-2">What this check covers</p>
          <ol>
            {FACTORS.map(([t, d], i) => (
              <li key={t} className="flex gap-4 border-b border-line py-4">
                <span className="font-mono text-[12px] leading-7 text-ink-4">{String(i + 1).padStart(2, '0')}</span>
                <span><span className="block font-serif text-[20px] font-medium">{t}</span><span className="text-[14px] text-ink-2">{d}</span></span>
              </li>
            ))}
          </ol>
          <p className="mt-4 font-serif text-[16px] italic leading-relaxed text-ink-3">A report is a signal, not proof. TRACE never calls anyone a scammer.</p>
        </aside>
      </div>
    </div>
  );
}
