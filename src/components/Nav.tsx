'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon, IconName } from './Icons';
import { Brand } from './ui';

type Item = { href: string; label: string; icon: IconName; match: RegExp };

// Phone tab bar. My reports lives under Profile on phones.
const MAIN: (Item & { tone?: 'report' })[] = [
  { href: '/', label: 'Home', icon: 'home', match: /^\/$/ },
  { href: '/check', label: 'Check', icon: 'search', match: /^\/(check|account)/ },
  { href: '/report', label: 'Report', icon: 'alert', match: /^\/report$/, tone: 'report' },
  { href: '/help', label: 'Get help', icon: 'phone', match: /^\/help/ },
  { href: '/profile', label: 'Profile', icon: 'user', match: /^\/(profile|reports)/ },
];

const TOP: Item[] = [
  { href: '/', label: 'Home', icon: 'home', match: /^\/$/ },
  { href: '/reports', label: 'My reports', icon: 'file', match: /^\/reports(\/|$)/ },
  { href: '/help', label: 'Get help', icon: 'phone', match: /^\/help/ },
  { href: '/developers', label: 'For businesses', icon: 'code', match: /^\/developers/ },
  { href: '/profile', label: 'Profile', icon: 'user', match: /^\/profile/ },
];

/** Mobile: bottom tab bar. Desktop (lg+): a top bar. */
export function Nav() {
  const path = usePathname();
  return (
    <>
      <header className="sticky top-0 z-30 hidden border-b border-line bg-paper/95 lg:block">
        <div className="mx-auto flex h-18 max-w-[calc(72rem+5rem)] items-center gap-8 px-10">
          <Link href="/" aria-label="TRACE home" className="shrink-0 [&>span>span:last-child]:hidden xl:[&>span>span:last-child]:inline"><Brand /></Link>
          <nav aria-label="Main" className="flex flex-1 items-center gap-6">
            {TOP.map((i) => {
              const active = i.match.test(path);
              return (
                <Link key={i.href} href={i.href} aria-current={active ? 'page' : undefined}
                  className={`whitespace-nowrap text-[14px] font-medium transition ${active ? 'text-brand' : 'text-ink-2 hover:text-ink'}`}>
                  {i.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex shrink-0 gap-2">
            <Link href="/check" className="inline-flex h-11 items-center rounded-md bg-brand px-5 text-[14px] font-bold text-vault hover:bg-brand-ink">
              Check an account
            </Link>
            <Link href="/report" className="inline-flex h-11 items-center gap-1.5 rounded-md border-2 border-high px-4 text-[14px] font-bold text-high hover:bg-high-wash">
              <Icon name="alert" size={16} /> Report an account
            </Link>
          </div>
        </div>
      </header>

      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 border-t border-ink bg-raised pb-[env(safe-area-inset-bottom)] lg:hidden">
        <ul className="mx-auto grid max-w-xl grid-cols-5">
          {MAIN.map((t) => {
            const active = t.match.test(path);
            return (
              <li key={t.href}>
                <Link href={t.href} aria-current={active ? 'page' : undefined}
                  className={`relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium ${t.tone ? 'text-high' : active ? 'text-brand' : 'text-ink-3'}`}>
                  {active && <span aria-hidden className={`absolute inset-x-4 top-0 h-[3px] rounded-b ${t.tone ? 'bg-high' : 'bg-brand'}`} />}
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

