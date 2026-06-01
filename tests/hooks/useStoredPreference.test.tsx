// @vitest-environment jsdom

import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { PreferenceDefinition } from '../../src/app/preferences';
import { useStoredPreference } from '../../src/hooks/useStoredPreference';

type TestTheme = 'light' | 'dark';

const TEST_PREFERENCE = {
  key: 'test-theme',
  fallback: 'light',
  isValid: (value: unknown): value is TestTheme => value === 'light' || value === 'dark',
} as const satisfies PreferenceDefinition<TestTheme>;

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear() {
      values.clear();
    },
    getItem(key) {
      return values.get(key) ?? null;
    },
    key(index) {
      return Array.from(values.keys())[index] ?? null;
    },
    removeItem(key) {
      values.delete(key);
    },
    setItem(key, value) {
      values.set(key, value);
    },
  };
}

describe('useStoredPreference', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: createMemoryStorage(),
    });
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('loads a validated stored value', () => {
    window.localStorage.setItem(TEST_PREFERENCE.key, JSON.stringify('dark'));
    const { result } = renderHook(() => useStoredPreference(TEST_PREFERENCE));

    expect(result.current[0]).toBe('dark');
  });

  it('falls back when stored JSON fails validation', () => {
    window.localStorage.setItem(TEST_PREFERENCE.key, JSON.stringify('sepia'));
    const { result } = renderHook(() => useStoredPreference(TEST_PREFERENCE));

    expect(result.current[0]).toBe('light');
  });

  it('persists updates', () => {
    const { result } = renderHook(() => useStoredPreference(TEST_PREFERENCE));

    act(() => {
      result.current[1]('dark');
    });

    expect(window.localStorage.getItem(TEST_PREFERENCE.key)).toBe(JSON.stringify('dark'));
  });

  it('keeps the in-memory value when storage writes are unavailable', () => {
    vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new DOMException('Storage disabled', 'SecurityError');
    });
    const { result } = renderHook(() => useStoredPreference(TEST_PREFERENCE));

    act(() => {
      result.current[1]('dark');
    });

    expect(result.current[0]).toBe('dark');
  });
});
