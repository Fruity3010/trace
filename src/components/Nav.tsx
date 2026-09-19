'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon, IconName } from './Icons';

type Item = { href: string; label: string; icon: IconName; match: RegExp };

const MAIN: Item[] = [
  { href: '/', label: 'Home', icon: 'home', match: /^\/$/ },
  { href: '/check', label: 'Check', icon: 'search', match: /^\/(check|account)/ },
  { href: '/reports', label: 'Reports', icon: 'file', match: /^\/reports?(\/|$)/ },
  { href: '/profile', label: 'Profile', icon: 'user', match: /^\/profile/ },
];

const BUSINESS: Item[] = [
  { href: '/developers', label: 'TRACE API', icon: 'code', match: /^\/developers/ },
  { href: '/intel', label: 'Intelligence', icon: 'chart', match: /^\/intel/ },
];

/** Mobile: bottom tab bar. Desktop (lg+): an index column down the left edge. */
export function Nav() {
  const path = usePathname();
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-line bg-paper px-6 py-7 lg:flex">
        <Link href="/" className="font-mono text-[17px] font-bold tracking-[0.22em]">TRACE</Link>
        <p className="mt-1 font-serif text-[14px] italic text-ink-3">check before you trust</p>
        <nav aria-label="Main" className="mt-10">
          <p className="eyebrow mb-2">Contents</p>
          <ul className="border-t border-ink">
            {MAIN.map((i, n) => <SideLink key={i.href} item={i} n={n + 1} active={i.match.test(path)} />)}
          </ul>
        </nav>
        <nav aria-label="Business" className="mt-8">
          <p className="eyebrow mb-2">For business</p>
          <ul className="border-t border-ink">
            {BUSINESS.map((i, n) => <SideLink key={i.href} item={i} n={MAIN.length + n + 1} active={i.match.test(path)} />)}
          </ul>
        </nav>
        <div className="mt-auto border-t border-ink pt-4">
          <p className="font-serif text-[18px] font-medium leading-snug">Paid someone and lost money?</p>
          <Link href="/help" className="mt-2 inline-flex items-center gap-1 text-[14px] font-semibold text-brand underline decoration-1 underline-offset-4">
            Get help now <Icon name="chevronRight" size={14} />
          </Link>
        </div>
      </aside>

      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 border-t border-ink bg-raised pb-[env(safe-area-inset-bottom)] lg:hidden">
        <ul className="mx-auto grid max-w-xl grid-cols-4">
          {MAIN.map((t) => {
            const active = t.match.test(path);
            return (
              <li key={t.href}>
                <Link href={t.href} aria-current={active ? 'page' : undefined}
                  className={`relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium ${active ? 'text-ink' : 'text-ink-3'}`}>
                  {active && <span aria-hidden className="absolute inset-x-6 top-0 h-[3px] bg-ink" />}
                  <Icon name={t.icon} size={21} strokeWidth={active ? 2.2 : 1.7} />
                  {t.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}

function SideLink({ item, n, active }: { item: Item; n: number; active: boolean }) {
  return (
    <li className="border-b border-line">
      <Link href={item.href} aria-current={active ? 'page' : undefined}
        className={`flex min-h-11 items-center gap-3 text-[15px] transition ${active ? 'font-semibold text-ink' : 'text-ink-2 hover:text-ink'}`}>
        <span className="w-5 font-mono text-[11px] text-ink-4">{String(n).padStart(2, '0')}</span>
        {item.label}
        {active && <span aria-hidden className="ml-auto size-1.5 rounded-full bg-ink" />}
      </Link>
    </li>
  );
}
