import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'TRACE 2.0 — Check before you trust',
    short_name: 'TRACE',
    description: 'Check a bank account before you send money.',
    start_url: '/',
    display: 'standalone',
    background_color: '#07120d',
    theme_color: '#07120d',
    icons: [
      { src: '/icons/192', sizes: '192x192', type: 'image/png' },
      { src: '/icons/512', sizes: '512x512', type: 'image/png' },
      { src: '/icons/512', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Check an account', url: '/check' },
      { name: 'Report an account', url: '/report' },
    ],
  };
}
