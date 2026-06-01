import { describe, expect, it } from 'vitest';

import {
  normalizeSpritesheetPath,
  parsePetManifest,
} from '../../src/domain/pet/manifest';

const VALID_MANIFEST = {
  id: 'renne',
  displayName: 'Renne',
  description: 'A test pet.',
  spriteVersionNumber: 2,
  spritesheetPath: 'spritesheet.webp',
} as const;

describe('parsePetManifest', () => {
  it('returns only validated domain fields', () => {
    const manifest = parsePetManifest({ ...VALID_MANIFEST, untrusted: '<script>' });

    expect(manifest).toEqual(VALID_MANIFEST);
    expect('untrusted' in manifest).toBe(false);
  });

  it('defaults only a missing sprite version to v1', () => {
    const withoutVersion = {
      id: VALID_MANIFEST.id,
      displayName: VALID_MANIFEST.displayName,
      description: VALID_MANIFEST.description,
      spritesheetPath: VALID_MANIFEST.spritesheetPath,
    };
    expect(parsePetManifest(withoutVersion).spriteVersionNumber).toBe(1);
  });

  it.each([null, 0, 3, '2', {}])(
    'rejects an explicitly invalid sprite version: %o',
    (spriteVersionNumber) => {
      expect(() => parsePetManifest({ ...VALID_MANIFEST, spriteVersionNumber })).toThrow(
        'spriteVersionNumber',
      );
    },
  );

  it('rejects a non-string description instead of silently coercing it', () => {
    expect(() => parsePetManifest({ ...VALID_MANIFEST, description: 42 })).toThrow(
      'description',
    );
  });
});

describe('normalizeSpritesheetPath', () => {
  it('normalizes a safe Windows-style relative path', () => {
    expect(normalizeSpritesheetPath('.\\art\\spritesheet.webp')).toBe(
      'art/spritesheet.webp',
    );
  });

  it.each([
    '',
    '/spritesheet.webp',
    '../spritesheet.webp',
    'art/../spritesheet.webp',
    'art//spritesheet.webp',
    'https://example.com/spritesheet.webp',
    'spritesheet.webp?raw',
    'spritesheet.webp#frame',
  ])('rejects an unsafe path: %s', (path) => {
    expect(() => normalizeSpritesheetPath(path)).toThrow(
      'safe relative file path',
    );
  });
});
