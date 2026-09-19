import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Mono, IBM_Plex_Sans, IBM_Plex_Sans_Condensed } from 'next/font/google';
import { ServiceWorker } from '@/components/ServiceWorker';
import './globals.css';

// Headlines: condensed, like the heading on an official notice. (The --font-serif name is historical.)
const serif = IBM_Plex_Sans_Condensed({ subsets: ['latin'], variable: '--font-serif', display: 'swap', weight: ['500', '600', '700'], style: ['normal', 'italic'] });
const sans = IBM_Plex_Sans({ subsets: ['latin'], variable: '--font-sans', display: 'swap', weight: ['400', '500', '600', '700'] });
const mono = IBM_Plex_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap', weight: ['400', '500', '700'] });

export const metadata: Metadata = {
  title: 'TRACE 2.0 — Check before you trust',
  description: 'See what others have reported about a bank account before you send money.',
  applicationName: 'TRACE',
  icons: { apple: '/icons/180' },
  appleWebApp: { capable: true, title: 'TRACE', statusBarStyle: 'default' },
};

export const viewport: Viewport = {
  themeColor: '#0a1322',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
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
