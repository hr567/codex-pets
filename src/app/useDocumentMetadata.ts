import { useEffect } from 'react';

import type { ThemeMode } from './preferences';

interface DocumentMetadataOptions {
  readonly petName: string;
  readonly themeMode: ThemeMode;
  readonly systemIsDark: boolean;
}

export function useDocumentMetadata({
  petName,
  themeMode,
  systemIsDark,
}: DocumentMetadataOptions): void {
  useEffect(() => {
    document.title = `${petName} · Codex Pet Preview`;
  }, [petName]);

  useEffect(() => {
    const resolvedMode = themeMode === 'system'
      ? (systemIsDark ? 'dark' : 'light')
      : themeMode;
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      'content',
      resolvedMode === 'dark' ? '#111112' : '#f8f4ed',
    );
  }, [systemIsDark, themeMode]);
}
