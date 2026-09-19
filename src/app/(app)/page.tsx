import { connection } from 'next/server';
import Link from 'next/link';
import { CheckForm } from '@/components/CheckForm';
import { Icon } from '@/components/Icons';
import { Brand, HowTraceWorks } from '@/components/ui';
import { activity } from '@/lib/engine';
import { botLink, n } from '@/lib/shared';

const STEPS = [
  ['Check', 'Enter the bank and account number, or send a screenshot.'],
  ['Understand', 'See the name on the account and what other people have reported.'],
  ['Decide', 'Pay with confidence, or walk away before the money leaves.'],
];

export default async function Home() {
  await connection();
  const a = activity();
  const whatsapp = botLink();
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="mx-auto w-full max-w-6xl animate-rise">
      <header className="flex h-16 items-center justify-between border-b border-ink lg:hidden">
        <Brand small />
      </header>

      {/* Masthead */}
      <div className="flex items-center justify-between border-b border-line py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3 lg:border-t lg:border-t-ink">
        <span>Account intelligence · Nigeria</span>
        <span className="hidden sm:inline">{today}</span>
      </div>

      <section className="grid gap-10 border-b border-ink py-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16 lg:py-16">
        <div>
          <h1 className="font-serif text-[52px] font-medium leading-[0.95] lg:text-[84px]">
            Check before<br />you <em className="italic">trust.</em>
          </h1>
          <p className="mt-6 max-w-[34ch] text-[18px] leading-relaxed text-ink-2">
            See what others have reported about a bank account — and whose name is on it — before you send money.
          </p>

          <Link href="/check" className="mt-8 flex min-h-14 items-center justify-between rounded-md bg-ink px-5 text-[16px] font-semibold text-raised lg:hidden">
            Check an account <Icon name="chevronRight" size={18} />
          </Link>
          <div className="mt-4 flex flex-wrap gap-x-6">
            <Link href="/report" className="inline-flex min-h-11 items-center gap-1.5 text-[15px] font-medium text-ink underline decoration-1 underline-offset-4">
              Report suspicious activity
            </Link>
            <Link href="/help" className="inline-flex min-h-11 items-center gap-1.5 text-[15px] font-semibold text-ink underline decoration-1 underline-offset-4">
              Already sent money? Get help <Icon name="chevronRight" size={15} />
            </Link>
          </div>

          <dl className="mt-10 grid grid-cols-2 border-t border-ink sm:grid-cols-4">
            {[
              [a.accountsChecked, 'accounts checked'],
              [a.reportsReceived, 'reports received'],
              [a.highRisk, 'high-risk accounts'],
              [a.reportsThisWeek, 'reports this week'],
            ].map(([v, l], i) => (
              <div key={l} className={`border-line py-4 pr-4 ${i % 2 === 0 ? 'border-r' : 'pl-4'} sm:border-r sm:pl-4 sm:first:pl-0 sm:last:border-r-0`}>
                <dd className="tnum font-serif text-[36px] font-medium leading-none lg:text-[40px]">{n(v as number)}</dd>
                <dt className="mt-2 text-[13px] leading-snug text-ink-3">{l}</dt>
              </div>
            ))}
          </dl>
        </div>

        {/* Desktop: the check form is on the page, set like a printed form. */}
        <div className="hidden lg:block">
          <div className="card p-8">
            <div className="mb-7 flex items-baseline justify-between border-b border-ink pb-3">
              <p className="font-serif text-[26px] font-medium">Account check</p>
              <p className="eyebrow">Form TR-1</p>
            </div>
            <CheckForm />
          </div>
        </div>
      </section>

      <section aria-label="How it works" className="grid border-b border-ink sm:grid-cols-3">
        {STEPS.map(([title, body], i) => (
          <div key={title} className="border-b border-line py-6 last:border-b-0 sm:border-b-0 sm:border-r sm:px-6 sm:first:pl-0 sm:last:border-r-0">
            <p className="font-mono text-[12px] text-ink-3">{String(i + 1).padStart(2, '0')}</p>
            <p className="mt-1 font-serif text-[24px] font-medium">{title}</p>
            <p className="mt-1 text-[15px] leading-relaxed text-ink-2">{body}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 py-8 lg:grid-cols-2">
        {whatsapp && (
          <a href={whatsapp} target="_blank" rel="noopener noreferrer"
            className="card flex min-h-16 items-center gap-4 px-5 hover:border-ink">
            <Icon name="chat" size={22} />
            <span><span className="block font-serif text-[19px] font-medium">Check on WhatsApp</span><span className="text-[14px] text-ink-3">No app needed. Check, report, or get help after a scam.</span></span>
            <Icon name="chevronRight" className="ml-auto text-ink-3" />
          </a>
        )}
        <HowTraceWorks />
      </section>

      <p className="pb-4 text-center font-serif text-[15px] italic text-ink-3">Every scam leaves a trace.</p>
    </div>
  );
}
