import { Icon } from '@/components/Icons';
import { botLink } from '@/lib/shared';

/** Always-there way into the WhatsApp bot. Sits above the phone tab bar; bottom-right on desktop. */
export function WhatsAppButton() {
  const href = botLink();
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label="Chat with TRACE on WhatsApp"
      className="fixed right-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-40 flex h-12 items-center gap-2 rounded-full bg-brand px-3.5 text-vault hover:bg-brand-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink lg:right-8 lg:bottom-8 lg:px-5">
      <Icon name="whatsapp" size={22} />
      <span className="hidden text-[15px] font-semibold lg:inline">Chat on WhatsApp</span>
    </a>
  );
}
