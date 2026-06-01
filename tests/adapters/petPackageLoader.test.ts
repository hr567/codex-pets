// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  loadUploadedPetPackage,
} from '../../src/adapters/browser/petPackageLoader';

const MANIFEST_JSON = JSON.stringify({
  id: 'local-pet',
  displayName: 'Local Pet',
  spriteVersionNumber: 2,
  spritesheetPath: 'spritesheet.webp',
});

class SuccessfulImage {
  decoding = '';
  naturalWidth = 1536;
  naturalHeight = 2288;
  onerror: (() => void) | null = null;
  onload: (() => void) | null = null;

  set src(_value: string) {
    queueMicrotask(() => {
      this.onload?.();
    });
  }

  removeAttribute(name: string): void {
    if (name === 'src') this.onload = null;
  }
}

class PendingImage extends SuccessfulImage {
  override set src(value: string) {
    void value;
  }
}

function createFiles(): readonly File[] {
  const manifestFile = new File([MANIFEST_JSON], 'pet.json', {
    type: 'application/json',
  });
  Object.defineProperty(manifestFile, 'text', {
    value: () => Promise.resolve(MANIFEST_JSON),
  });
  const spritesheetFile = new File(['image bytes'], 'spritesheet.webp', {
    type: 'image/webp',
  });
  return [manifestFile, spritesheetFile];
}

describe('loadUploadedPetPackage', () => {
  const createObjectURL = vi.fn<(value: Blob) => string>();
  const revokeObjectURL = vi.fn<(url: string) => void>();

  beforeEach(() => {
    let nextUrl = 0;
    createObjectURL.mockImplementation(() => {
      nextUrl += 1;
      return 'blob:test-' + String(nextUrl);
    });
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });
    vi.stubGlobal('Image', SuccessfulImage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('creates sanitized URLs and releases each one exactly once', async () => {
    const petPackage = await loadUploadedPetPackage(
      createFiles(),
      new AbortController().signal,
    );

    expect(createObjectURL).toHaveBeenCalledTimes(2);
    expect(petPackage.manifest).toEqual({
      id: 'local-pet',
      displayName: 'Local Pet',
      description: '',
      spriteVersionNumber: 2,
      spritesheetPath: 'spritesheet.webp',
    });

    petPackage.dispose();
    petPackage.dispose();
    expect(revokeObjectURL).toHaveBeenCalledTimes(2);
  });

  it('aborts a pending image decode and revokes temporary URLs', async () => {
    vi.stubGlobal('Image', PendingImage);
    const request = new AbortController();
    const loadPromise = loadUploadedPetPackage(createFiles(), request.signal);

    await vi.waitFor(() => {
      expect(createObjectURL).toHaveBeenCalledTimes(2);
    });
    request.abort();

    await expect(loadPromise).rejects.toMatchObject({ name: 'AbortError' });
    expect(revokeObjectURL).toHaveBeenCalledTimes(2);
  });
});
