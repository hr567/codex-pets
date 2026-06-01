import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

import type { PreferenceDefinition } from '../app/preferences';

type JsonPrimitive = boolean | number | string | null;
type JsonValue = JsonPrimitive | readonly JsonValue[] | { readonly [key: string]: JsonValue };

export function useStoredPreference<T extends JsonValue>(
  preference: PreferenceDefinition<T>,
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState(() => {
    try {
      const storedValue = window.localStorage.getItem(preference.key);
      if (storedValue === null) return preference.fallback;

      const stored: unknown = JSON.parse(storedValue);
      return preference.isValid(stored) ? stored : preference.fallback;
    } catch {
      return preference.fallback;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(preference.key, JSON.stringify(value));
    } catch {
      // Preferences are optional; keep the in-memory value when storage is unavailable.
    }
  }, [preference.key, value]);

  return [value, setValue];
}
