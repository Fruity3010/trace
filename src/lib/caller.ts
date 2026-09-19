import { reporterKey } from './engine';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Hashed identity of a web caller: their device ID, or their IP when there isn't one. */
export function webCaller(req: Request): { key: string; device: boolean } {
  const id = req.headers.get('x-trace-device') ?? '';
  if (UUID.test(id)) return { key: reporterKey('device', id), device: true };
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
  return { key: reporterKey('ip', ip), device: false };
}

/** Hashed device id only — for things that belong to one device (reports, cases). Null without one. */
export function deviceKey(req: Request): string | null {
  const id = req.headers.get('x-trace-device') ?? '';
  return UUID.test(id) ? reporterKey('device', id) : null;
}
