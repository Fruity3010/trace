import type { Metadata, Viewport } from 'next';
import { Caveat, IBM_Plex_Mono, Plus_Jakarta_Sans } from 'next/font/google';
import { ServiceWorker } from '@/components/ServiceWorker';
import './globals.css';

// One geometric family for headlines and body; --font-serif is a historical name for the headline weight.
const sans = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-sans', display: 'swap', weight: ['400', '500', '600', '700', '800'] });
const serif = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-serif', display: 'swap', weight: ['600', '700', '800'] });
const hand = Caveat({ subsets: ['latin'], variable: '--font-hand', display: 'swap', weight: ['600'] });
const mono = IBM_Plex_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap', weight: ['400', '500', '700'] });

export const metadata: Metadata = {
  title: 'TRACE 2.0 — Check before you trust',
  description: 'See what others have reported about a bank account before you send money.',
  applicationName: 'TRACE',
  icons: { apple: '/icons/180' },
  appleWebApp: { capable: true, title: 'TRACE', statusBarStyle: 'default' },
};

export const viewport: Viewport = {
  themeColor: '#07120d',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${mono.variable} ${hand.variable}`}>
      <body className="min-h-dvh antialiased">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-ink focus:px-3 focus:py-2 focus:text-paper">
          Skip to content
        </a>
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
