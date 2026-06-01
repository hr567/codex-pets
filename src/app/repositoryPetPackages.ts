import blackmiManifestValue from '../../blackmi/pet.json';
import blackmiManifestUrl from '../../blackmi/pet.json?url';
import blackmiSpritesheetUrl from '../../blackmi/spritesheet.webp?url';
import mangoManifestValue from '../../mango/pet.json';
import mangoManifestUrl from '../../mango/pet.json?url';
import mangoSpritesheetUrl from '../../mango/spritesheet.webp?url';
import miaomiaoManifestValue from '../../miaomiao/pet.json';
import miaomiaoManifestUrl from '../../miaomiao/pet.json?url';
import miaomiaoSpritesheetUrl from '../../miaomiao/spritesheet.webp?url';
import renneManifestValue from '../../renne/pet.json';
import renneManifestUrl from '../../renne/pet.json?url';
import renneSpritesheetUrl from '../../renne/spritesheet.webp?url';

import { createBundledPetPackage } from '../adapters/browser/petPackageLoader';
import type { BundledPetPackageDescriptor } from '../adapters/browser/petPackageLoader';

export type RepositoryPetKey = 'renne' | 'blackmi' | 'miaomiao' | 'mango';

export interface RepositoryPetPackage {
  readonly key: RepositoryPetKey;
  readonly descriptor: BundledPetPackageDescriptor;
}

export const REPOSITORY_PET_PACKAGES = [
  {
    key: 'renne',
    descriptor: createBundledPetPackage(
      renneManifestValue,
      renneManifestUrl,
      renneSpritesheetUrl,
    ),
  },
  {
    key: 'blackmi',
    descriptor: createBundledPetPackage(
      blackmiManifestValue,
      blackmiManifestUrl,
      blackmiSpritesheetUrl,
    ),
  },
  {
    key: 'miaomiao',
    descriptor: createBundledPetPackage(
      miaomiaoManifestValue,
      miaomiaoManifestUrl,
      miaomiaoSpritesheetUrl,
    ),
  },
  {
    key: 'mango',
    descriptor: createBundledPetPackage(
      mangoManifestValue,
      mangoManifestUrl,
      mangoSpritesheetUrl,
    ),
  },
] as const satisfies readonly RepositoryPetPackage[];

export const DEFAULT_REPOSITORY_PET = REPOSITORY_PET_PACKAGES[0];
