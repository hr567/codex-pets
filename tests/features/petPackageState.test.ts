// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest';

import type {
  LoadedPetPackage,
  PetPackageDescriptor,
} from '../../src/adapters/browser/petPackageLoader';
import { parsePetManifest } from '../../src/domain/pet/manifest';
import {
  createInitialPetPackageState,
  petPackageReducer,
} from '../../src/features/pet-package/petPackageState';

function createDescriptor(source: 'bundled' | 'local' = 'bundled'): PetPackageDescriptor {
  return {
    source,
    manifest: parsePetManifest({
      id: source + '-pet',
      displayName: source === 'bundled' ? 'Bundled Pet' : 'Local Pet',
      spritesheetPath: 'spritesheet.webp',
      spriteVersionNumber: 2,
    }),
    manifestUrl: source + '-manifest-url',
    spritesheetUrl: source + '-spritesheet-url',
    spritesheetFileName: 'spritesheet.webp',
  };
}

function createLoadedPackage(source: 'bundled' | 'local' = 'local'): LoadedPetPackage {
  return {
    ...createDescriptor(source),
    image: new Image(),
    dispose: vi.fn(),
  };
}

describe('petPackageReducer', () => {
  it('starts in a valid loading state', () => {
    const descriptor = createDescriptor();
    expect(createInitialPetPackageState(descriptor)).toEqual({
      preview: { status: 'loading', petPackage: descriptor },
      upload: { status: 'idle' },
    });
  });

  it('keeps the current preview while an upload is validating', () => {
    const readyPackage = createLoadedPackage();
    const readyState = petPackageReducer(
      createInitialPetPackageState(createDescriptor()),
      { type: 'package-ready', petPackage: readyPackage },
    );
    const validatingState = petPackageReducer(readyState, { type: 'upload-started' });

    expect(validatingState.preview).toBe(readyState.preview);
    expect(validatingState.upload).toEqual({ status: 'validating' });
  });

  it('atomically commits a loaded package and clears upload errors', () => {
    const initialState = createInitialPetPackageState(createDescriptor());
    const failedUploadState = petPackageReducer(initialState, {
      type: 'upload-failed',
      message: 'Invalid package',
    });
    const loadedPackage = createLoadedPackage('local');
    const nextState = petPackageReducer(failedUploadState, {
      type: 'package-ready',
      petPackage: loadedPackage,
    });

    expect(nextState).toEqual({
      preview: { status: 'ready', petPackage: loadedPackage },
      upload: { status: 'idle' },
    });
  });

  it('stores preview failures only in the error variant', () => {
    const descriptor = createDescriptor();
    const nextState = petPackageReducer(
      createInitialPetPackageState(descriptor),
      { type: 'preview-failed', petPackage: descriptor, message: 'Decode failed' },
    );

    expect(nextState.preview).toEqual({
      status: 'error',
      petPackage: descriptor,
      message: 'Decode failed',
    });
  });
});
