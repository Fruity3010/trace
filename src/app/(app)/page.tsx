import { connection } from 'next/server';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { CheckForm } from '@/components/CheckForm';
import { Icon, IconName } from '@/components/Icons';
import { Brand, HowTraceWorks, RISK } from '@/components/ui';
import { activity, peekAccount } from '@/lib/engine';
import { botLink, n } from '@/lib/shared';

const SAMPLE = '0123456789';

const STEPS: [IconName, string, string][] = [
  ['search', 'Enter the account number', 'Type the Nigerian bank account number you want to check, or send a screenshot.'],
  ['user', 'See the real name', 'We show the name on the account, so you know who you are really paying.'],
  ['shieldCheck', 'View reports & risk rating', 'See what other people have reported and a clear risk rating, with the reasons.'],
];

const FIRST_HOUR: [IconName, string, string][] = [
  ['phone', 'Call your bank', 'Use our script and know exactly what to say.'],
  ['lock', 'Request a PND', 'Ask for a Post No Debit freeze on the account.'],
  ['clock', 'Know the timeline', 'We track the bank’s deadline to respond.'],
  ['bank', 'Escalate if needed', 'If unresolved, we show you when and how to take it to the CBN.'],
];

export default async function Home() {
  await connection();
  const a = activity();
  const sample = peekAccount('GTBank', SAMPLE);
  const whatsapp = botLink();

  return (
    <div className="animate-rise">
      <header className="flex h-16 items-center lg:hidden">
        <Brand small />
      </header>

      {/* Hero */}
      <section className="relative mx-auto grid max-w-6xl gap-12 py-8 lg:grid-cols-[1.1fr_0.9fr] lg:py-16">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-brand/60 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-brand">
            <Icon name="shieldCheck" size={15} /> Information you can trust
          </p>
          <h1 className="mt-6 font-serif text-[48px] font-extrabold leading-[1.02] tracking-tight lg:text-[76px]">
            Check before<br />you <span className="text-brand">send.</span>
          </h1>
          <p className="mt-6 max-w-[46ch] text-[17px] leading-relaxed text-ink-2 lg:text-[19px]">
            TRACE lets you check a Nigerian bank account before you send money to it. See the account holder’s real name, public reports and a risk rating, so you can pay with confidence.
          </p>

          <div className="card mt-8 max-w-xl p-5 lg:p-6">
            <CheckForm />
          </div>
          <p className="mt-4 flex items-center gap-2 text-[14px] text-ink-3"><Icon name="lock" size={15} /> Secure. Private. Built for Nigerians.</p>
          <Link href="/help" className="mt-2 inline-flex min-h-11 items-center gap-1.5 text-[15px] font-semibold text-brand">
            Already sent money? Get help now <Icon name="chevronRight" size={15} />
          </Link>
        </div>

        <div className="relative hidden lg:block">
          <Hand className="absolute -left-20 top-4 -rotate-6 text-[34px]">Same account.<br />Different story.</Hand>
          <Phone data={sample} />
          <Hand className="absolute right-0 top-[440px] xl:-right-10 rotate-[-4deg] text-right text-[34px]">Check before<br />you trust.</Hand>
        </div>
      </section>

      {/* Live numbers */}
      <section aria-label="TRACE so far" className="theme-light -mx-5 px-5 lg:-mx-10 lg:px-10">
        <dl className="mx-auto grid max-w-6xl grid-cols-2 py-8 sm:grid-cols-4">
          {[
            [a.accountsChecked, 'accounts checked'],
            [a.reportsReceived, 'reports received'],
            [a.highRisk, 'high-risk accounts'],
            [a.reportsThisWeek, 'reports this week'],
          ].map(([v, l]) => (
            <div key={l} className="py-3 sm:border-l sm:border-line sm:px-6 sm:first:border-l-0 sm:first:pl-0">
              <dd className="tnum font-serif text-[34px] font-extrabold leading-none lg:text-[40px]">{n(v as number)}</dd>
              <dt className="mt-2 text-[13px] font-medium uppercase tracking-[0.08em] text-ink-3">{l}</dt>
            </div>
          ))}
        </dl>
      </section>

      {/* How it works + channels */}
      <section className="theme-light -mx-5 border-t border-line px-5 lg:-mx-10 lg:px-10">
        <div className="mx-auto max-w-6xl py-14">
          <div className="grid gap-10 lg:grid-cols-[1fr_2.2fr]">
            <div>
              <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-brand">How it works</p>
              <h2 className="mt-3 font-serif text-[36px] font-extrabold leading-[1.05] lg:text-[44px]">Get the facts<br />in seconds.</h2>
              <p className="mt-4 max-w-[38ch] text-[16px] leading-relaxed text-ink-2">TRACE pulls a verified name and community reports together to give you a clear picture before you send money.</p>
            </div>
            <ol className="grid gap-8 sm:grid-cols-3">
              {STEPS.map(([icon, title, body], i) => (
                <li key={title}>
                  <span className="grid size-14 place-items-center rounded-full bg-brand-wash text-brand"><Icon name={icon} size={24} /></span>
                  <p className="mt-4 text-[17px] font-bold">{i + 1}. {title}</p>
                  <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{body}</p>
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-14 grid gap-5 lg:grid-cols-3">
            <Channel icon="globe" title="Web App" body="Check any Nigerian bank account instantly on your phone or desktop." tint="bg-[#ecfbf1]">
              <Link href="/check" className={outline}>Try it now <Icon name="chevronRight" size={16} /></Link>
              <div aria-hidden className="mx-auto mt-6 w-[85%] rounded-t-lg border-[6px] border-b-0 border-[#1c2521] bg-[#07120d] p-4 text-[#eef5f0]">
                <p className="text-[10px] font-extrabold tracking-[0.08em]">TR<span className="text-[#4ade80]">Λ</span>CE</p>
                <p className="mt-3 text-[16px] font-extrabold leading-tight">Check before<br />you <span className="text-[#4ade80]">send.</span></p>
                <div className="mt-3 flex h-7 items-center justify-between rounded bg-white/10 pl-2 pr-1 text-[9px] text-white/50">0123456789<span className="rounded bg-[#4ade80] px-2 py-1 font-bold text-[#07120d]">Check</span></div>
              </div>
              <div aria-hidden className="mx-auto h-2 w-[95%] rounded-b-md bg-[#2a332f]" />
            </Channel>
            <Channel icon="whatsapp" title="WhatsApp Bot" body="Chat with TRACE on WhatsApp. Send text, screenshots or voice notes in five languages." tint="bg-[#eef7f1]">
              {whatsapp
                ? <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={outline}>Chat on WhatsApp <Icon name="chevronRight" size={16} /></a>
                : <p className="text-[14px] font-medium text-ink-3">WhatsApp number coming soon.</p>}
              <Hand className="mt-3 block text-[22px] text-ink-2">Text. Voice. Screenshot. Your language.</Hand>
            </Channel>
            <Channel icon="code" title="API for Banks & Fintechs" body="Put TRACE in your transfer flow and give your users an extra layer of protection." tint="bg-[#f2f1fb]">
              <Link href="/developers" className={outline}>View API docs <Icon name="chevronRight" size={16} /></Link>
              <pre className="mt-5 overflow-x-auto rounded-md bg-[#0b1611] p-4 font-mono text-[12px] leading-relaxed text-[#cfe3d7]">{`curl -X POST https://<host>/v1/check-account \\
  -H "Authorization: Bearer $TRACE_KEY" \\
  -d '{"bank":"GTBank","accountNumber":"${SAMPLE}"}'`}</pre>
            </Channel>
          </div>
        </div>
      </section>

      {/* After a scam */}
      <section className="mx-auto max-w-6xl py-14">
        <div className="grid gap-10 lg:grid-cols-[1fr_2.2fr]">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-brand">After a scam</p>
            <h2 className="mt-3 font-serif text-[32px] font-extrabold leading-[1.1] lg:text-[36px]">Scammed? You’re not alone. Here’s what to do in the <span className="text-brand">first hour.</span></h2>
            <p className="mt-4 text-[16px] leading-relaxed text-ink-2">TRACE guides you step by step, so you take the right action fast.</p>
            <Link href="/help" className="mt-6 inline-flex h-12 items-center gap-2 rounded-md bg-brand px-5 font-bold text-vault hover:bg-brand-ink">
              Get the guide <Icon name="chevronRight" size={16} />
            </Link>
          </div>
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FIRST_HOUR.map(([icon, title, body], i) => (
              <li key={title} className="card p-5">
                <span className="grid size-10 place-items-center rounded-full border border-line font-bold">{i + 1}</span>
                <Icon name={icon} size={24} className="mt-4 text-brand" />
                <p className="mt-3 font-bold">{title}</p>
                <p className="mt-1 text-[14px] leading-relaxed text-ink-3">{body}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-10 max-w-3xl"><HowTraceWorks /></div>
      </section>
    </div>
  );
}

const outline = 'inline-flex h-11 items-center gap-1.5 rounded-md border-2 border-brand px-4 text-[15px] font-bold text-brand hover:bg-brand-wash';

function Hand({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span aria-hidden className={`font-hand leading-[1.05] text-ink ${className}`}>{children}</span>;
}

function Channel({ icon, title, body, tint, children }: { icon: IconName; title: string; body: string; tint: string; children: ReactNode }) {
  return (
    <div className={`min-w-0 rounded-2xl border border-line p-6 ${tint}`}>
      <span className="grid size-11 place-items-center rounded-md bg-raised text-brand"><Icon name={icon} size={22} /></span>
      <h3 className="mt-4 text-[22px] font-extrabold">{title}</h3>
      <p className="mt-2 mb-5 text-[15px] leading-relaxed text-ink-2">{body}</p>
      {children}
    </div>
  );
}

/** A phone showing the real result for the sample account. No name: sample accounts never get a name lookup. */
function Phone({ data }: { data: ReturnType<typeof peekAccount> }) {
  const r = RISK[data.risk];
  return (
    <div className="mx-auto w-[330px] rounded-[48px] border-[12px] border-[#26312c] bg-vault p-4 pt-7 ring-1 ring-[#3a4842]">
      <p className="px-1 font-serif text-[24px] font-extrabold tracking-[0.08em]">TR<span className="text-brand">Λ</span>CE</p>
      <div className="mt-4 rounded-2xl border border-line bg-raised p-5">
        <p className="text-[13px] font-semibold text-ink-2">GTBank · sample account</p>
        <p className="tnum mt-1 font-mono text-[24px] font-bold tracking-wider">{data.accountNumber}</p>
        <p className={`mt-4 inline-flex items-center gap-2 rounded-full border-2 border-current px-4 py-1.5 text-[15px] font-extrabold tracking-wide ${r.bg} ${r.text}`}>
          <Icon name={r.icon} size={18} strokeWidth={2.8} /> {r.label.toUpperCase()}
        </p>
        <p className="mt-3 text-[15px] font-semibold leading-snug">{data.headline}</p>
        <dl className="mt-4 grid gap-3 border-t border-line pt-4 text-[15px]">
          {[
            ['Total reports', n(data.reports)],
            ['People reporting', n(data.uniqueReporters)],
            ['With evidence', n(data.evidenceCount)],
            ['Last reported', data.lastReportedAgo ?? '—'],
          ].map(([l, v]) => (
            <div key={l} className="flex justify-between"><dt className="font-medium text-ink-2">{l}</dt><dd className="font-extrabold">{v}</dd></div>
          ))}
        </dl>
        <Link href={`/account/${SAMPLE}?bank=GTBank`} className="mt-5 flex h-12 items-center justify-center gap-1.5 rounded-md bg-brand text-[15px] font-bold text-vault hover:bg-brand-ink">
          View details <Icon name="chevronRight" size={16} />
        </Link>
      </div>
    </div>
  );
}
