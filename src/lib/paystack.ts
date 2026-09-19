// Account-name enquiry through Paystack's Resolve Account Number endpoint.
// Names are personal data: they are cached in memory for a few minutes to
// avoid repeat calls, never written to the database, and each caller is
// rate-limited so the endpoint can't be used to harvest names.
import { rateLimit } from './db';
import { Bank, bankCode, Verification } from './shared';

const TIMEOUT_MS = 6000;
const CACHE_MS = 10 * 60_000;
export const LOOKUP_LIMIT = { perHour: 20 };

const cache = new Map<string, { at: number; result: Verification }>();

/** `caller` is an already-hashed device, phone or IP key — never a raw identifier. */
export async function resolveAccount(accountNumber: string, bank: Bank | null, caller: string): Promise<Verification> {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) return { status: 'unavailable', reason: 'disabled' };
  const code = bank && bankCode(bank);
  if (!code) return { status: 'unavailable', reason: 'no_bank' };

  // Limit before the cache, so cached names can't be read without limit either.
  if (!rateLimit('name_lookup', caller, LOOKUP_LIMIT.perHour)) return { status: 'unavailable', reason: 'rate_limited' };
  const cacheKey = `${code}:${accountNumber}`;
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.result;

  let result: Verification;
  try {
    const res = await fetch(
      `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${encodeURIComponent(code)}`,
      { headers: { authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(TIMEOUT_MS), cache: 'no-store' },
    );
    const body = await res.json().catch(() => null);
    const name = typeof body?.data?.account_name === 'string' ? body.data.account_name.trim() : '';
    if (res.ok && body?.status && name) result = { status: 'verified', accountName: name.slice(0, 120) };
    // Paystack answers 422 when the number doesn't resolve at that bank.
    else if (res.status === 422 || res.status === 400) result = { status: 'not_found' };
    else return { status: 'unavailable', reason: 'error' }; // 401/429/5xx: don't cache, don't mislead
  } catch {
    return { status: 'unavailable', reason: 'error' };
  }

  cache.set(cacheKey, { at: Date.now(), result });
  if (cache.size > 5000) cache.delete(cache.keys().next().value!);
  return result;
}
