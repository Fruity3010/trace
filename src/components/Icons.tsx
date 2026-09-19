// Inline stroke icons: no icon library, nothing to download.
import type { SVGProps } from 'react';

const P = {
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zm9 3-4.35-4.35',
  file: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h4',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  shield: 'M12 3 4 6v6c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V6z',
  shieldCheck: 'M12 3 4 6v6c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V6zM8.5 12l2.5 2.5 4.5-5',
  alert: 'M12 3 2 20h20zM12 10v4M12 17h.01',
  octagon: 'M8 3h8l5 5v8l-5 5H8l-5-5V8zM12 8v5M12 16h.01',
  check: 'M5 12.5 10 17l9-10',
  chevronRight: 'm9 5 7 7-7 7',
  chevronDown: 'm6 9 6 6 6-6',
  back: 'M15 5 8 12l7 7',
  mic: 'M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 18v3',
  pen: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
  lock: 'M6 11h12v10H6zM8.5 11V7.5a3.5 3.5 0 0 1 7 0V11',
  image: 'M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M15 9h.01',
  doc: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5',
  phone: 'M8 3h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM11 18h2',
  code: 'm8 8-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14',
  bank: 'M3 10 12 4l9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18',
  chat: 'M4 5h16v11H9l-5 4z',
  whatsapp: 'M3.5 20.5 4.9 16.3A8.5 8.5 0 1 1 7.8 19.2zM9.2 8.2c-.4 3 3.6 7 6.6 6.6l.9-1.6-2.1-1.1-.9.9c-1-.4-2.3-1.7-2.7-2.7l.9-.9-1.1-2.1z',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-5.5-3.5-9s1-6.5 3.5-9',
  spark: 'M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6',
  play: 'M7 4v16l13-8z',
  x: 'M6 6l12 12M18 6 6 18',
  send: 'M4 12 20 4l-6 16-3-7z',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  users: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14c2 .8 3.5 3 3.5 6',
  paperclip: 'M20 11.5 12 19.5a5 5 0 0 1-7-7L13.5 4a3.3 3.3 0 0 1 4.7 4.7L10 17a1.7 1.7 0 0 1-2.4-2.4L15 7.2',
  download: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7.5h.01',
} as const;

export type IconName = keyof typeof P;

export function Icon({ name, size = 20, ...rest }: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
      <path d={P[name]} />
    </svg>
  );
}
