import { useCallback, useEffect, useRef, useState } from 'react';

import {
  loadBundledPetPackage,
  loadUploadedPetPackage,
} from '../lib/packageLoader';
import type {
  BundledPetPackageDescriptor,
  LoadedPetPackage,
  PetPackageDescriptor,
} from '../lib/packageLoader';

export interface PetPackageState {
  readonly preview:
    | { readonly status: 'loading'; readonly petPackage: PetPackageDescriptor }
    | { readonly status: 'ready'; readonly petPackage: LoadedPetPackage }
    | {
        readonly status: 'error';
        readonly petPackage: PetPackageDescriptor;
        readonly message: string;
      };
  readonly upload:
    | { readonly status: 'idle' | 'validating' }
    | { readonly status: 'error'; readonly message: string };
}

export interface PetPackageLoaders {
  readonly loadBundled: typeof loadBundledPetPackage;
  readonly loadUploaded: typeof loadUploadedPetPackage;
}

const BROWSER_LOADERS: PetPackageLoaders = {
  loadBundled: loadBundledPetPackage,
  loadUploaded: loadUploadedPetPackage,
};

export function usePetPackage(
  initialPetPackage: BundledPetPackageDescriptor,
  loaders: PetPackageLoaders = BROWSER_LOADERS,
) {
  const [state, setState] = useState<PetPackageState>(() => ({
    preview: { status: 'loading', petPackage: initialPetPackage },
    upload: { status: 'idle' },
  }));
  const requestRef = useRef<AbortController | null>(null);
  const activePackageRef = useRef<LoadedPetPackage | null>(null);

  const loadPackage = useCallback(async (
    source: BundledPetPackageDescriptor | readonly File[],
  ) => {
    const repositoryPet = 'manifest' in source ? source : undefined;
    requestRef.current?.abort();
    const request = new AbortController();
    requestRef.current = request;

    if (repositoryPet) {
      activePackageRef.current?.dispose();
      activePackageRef.current = null;
      setState({
        preview: { status: 'loading', petPackage: repositoryPet },
        upload: { status: 'idle' },
      });
    } else {
      setState((current) => ({ ...current, upload: { status: 'validating' } }));
    }

    try {
      const petPackage = await ('manifest' in source
        ? loaders.loadBundled(source, request.signal)
        : loaders.loadUploaded(source, request.signal));
      if (requestRef.current !== request) {
        petPackage.dispose();
        return;
      }

      activePackageRef.current?.dispose();
      activePackageRef.current = petPackage;
      requestRef.current = null;
      setState({
        preview: { status: 'ready', petPackage },
        upload: { status: 'idle' },
      });
    } catch (error) {
      if (requestRef.current !== request) return;
      requestRef.current = null;
      const message = error instanceof Error ? error.message : repositoryPet
        ? 'The repository sprite sheet could not be loaded.'
        : 'This Codex Pet package could not be opened.';
      setState((current) => ({
        preview: repositoryPet || current.preview.status === 'loading'
          ? {
              status: 'error',
              petPackage: repositoryPet ?? current.preview.petPackage,
              message,
            }
          : current.preview,
        upload: repositoryPet ? { status: 'idle' } : { status: 'error', message },
      }));
    }
  }, [loaders]);

  const selectRepositoryPet = useCallback((
    petPackageDescriptor: BundledPetPackageDescriptor,
  ) => {
    void loadPackage(petPackageDescriptor);
  }, [loadPackage]);

  const selectFiles = useCallback((files: readonly File[]) => loadPackage(files), [loadPackage]);

  useEffect(() => {
    // Reset the preview while synchronizing a changed package or loader with its external image resource.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadPackage(initialPetPackage);
    return () => {
      requestRef.current?.abort();
      requestRef.current = null;
      activePackageRef.current?.dispose();
      activePackageRef.current = null;
    };
  }, [initialPetPackage, loadPackage]);

  return {
    state,
    selectFiles,
    selectRepositoryPet,
  };
}
