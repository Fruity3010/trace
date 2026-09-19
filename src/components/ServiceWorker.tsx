'use client';
import { useEffect } from 'react';

export function ServiceWorker() {
  useEffect(() => {
    // Production only: a caching worker in dev serves stale bundles.
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);
  return null;
}
