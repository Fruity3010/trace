import { BANKS, POPULAR_BANKS } from '@/lib/shared';

/** <option>s for a native bank <select>: popular banks first, then all ~280 alphabetically. */
export function BankOptions({ placeholder = 'Choose a bank' }: { placeholder?: string }) {
  return (
    <>
      <option value="" disabled>{placeholder}</option>
      <optgroup label="Popular">
        {POPULAR_BANKS.map((b) => <option key={`p-${b}`} value={b} className="text-ink">{b}</option>)}
      </optgroup>
      <optgroup label="All banks">
        {BANKS.map((b) => <option key={b} value={b} className="text-ink">{b}</option>)}
      </optgroup>
    </>
  );
}
