'use client';
// Device-local preferences and drafts. Reports live on the server, linked to
// this device by a random ID that the server only ever stores as a keyed hash.
import { useCallback, useEffect, useState } from 'react';
import type { Lang, MyReport } from './shared';

export type Prefs = { lang: Lang; anonymous: boolean };

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function useLocal<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [ready, setReady] = useState(false);
  // localStorage is read after hydration so server and client first render match.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValue(read(key, initial));
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const set = useCallback((next: T | ((prev: T) => T)) => {
    setValue((prev) => {
      const v = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
      try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* storage blocked: keep in memory */ }
      return v;
    });
  }, [key]);
  return [value, set, ready] as const;
}

export const usePrefs = () => useLocal<Prefs>('trace.prefs', { lang: 'en', anonymous: true });

export function deviceId(): string {
  try {
    let id = localStorage.getItem('trace.device');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('trace.device', id);
    }
    return id;
  } catch {
    return crypto.randomUUID(); // storage blocked: reports can't be tracked on this device
  }
}

export function useMyReports() {
  const [reports, setReports] = useState<MyReport[] | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    fetch('/api/reports', { headers: { 'x-trace-device': deviceId() } })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setReports)
      .catch(() => setError(true));
  }, []);
  return { reports, error };
}
