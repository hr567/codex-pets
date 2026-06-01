import { describe, expect, it } from 'vitest';

import {
  DEFAULT_REPOSITORY_PET,
  REPOSITORY_PET_PACKAGES,
} from '../../src/app/repositoryPetPackages';

describe('repositoryPetPackages', () => {
  it('registers the four repository folders once and in display order', () => {
    const keys = REPOSITORY_PET_PACKAGES.map(({ key }) => key);

    expect(keys).toEqual(['renne', 'blackmi', 'miaomiao', 'mango']);
    expect(new Set(keys).size).toBe(REPOSITORY_PET_PACKAGES.length);
  });

  it('uses Renne as the default repository pet', () => {
    expect(DEFAULT_REPOSITORY_PET).toBe(REPOSITORY_PET_PACKAGES[0]);
    expect(DEFAULT_REPOSITORY_PET.key).toBe('renne');
    expect(DEFAULT_REPOSITORY_PET.descriptor.manifest.id).toBe('renne');
  });

  it('keeps repository folder keys separate from manifest identities', () => {
    expect(REPOSITORY_PET_PACKAGES.map(({ descriptor }) => descriptor.manifest.id)).toEqual([
      'renne',
      'blackmi',
      'miaomiao',
      'mangguo',
    ]);
    expect(REPOSITORY_PET_PACKAGES[3]).toMatchObject({
      key: 'mango',
      descriptor: {
        source: 'bundled',
        spritesheetFileName: 'spritesheet.webp',
        manifest: { id: 'mangguo', displayName: '芒狗' },
      },
    });
  });

  it('keeps each manifest and sprite sheet URL distinct', () => {
    const manifestUrls = REPOSITORY_PET_PACKAGES.map(({ descriptor }) => (
      descriptor.manifestUrl
    ));
    const spritesheetUrls = REPOSITORY_PET_PACKAGES.map(({ descriptor }) => (
      descriptor.spritesheetUrl
    ));

    expect(new Set(manifestUrls).size).toBe(REPOSITORY_PET_PACKAGES.length);
    expect(new Set(spritesheetUrls).size).toBe(REPOSITORY_PET_PACKAGES.length);
  });
});
