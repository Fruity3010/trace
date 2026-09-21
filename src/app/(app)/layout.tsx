import { Nav } from '@/components/Nav';
import { WhatsAppButton } from '@/components/WhatsAppButton';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <main id="main" className="min-h-dvh px-5 pb-24 pt-[env(safe-area-inset-top)] lg:px-10 lg:pb-16 lg:pt-0">
        {children}
      </main>
      <WhatsAppButton />
    </>
  );
}
