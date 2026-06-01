import { useCallback, useEffect, useReducer, useRef } from 'react';

import {
  loadBundledPetPackage,
  loadUploadedPetPackage,
} from '../../adapters/browser/petPackageLoader';
import type {
  BundledPetPackageDescriptor,
  LoadedPetPackage,
} from '../../adapters/browser/petPackageLoader';
import {
  createInitialPetPackageState,
  petPackageReducer,
} from './petPackageState';
import type { PetPackageState } from './petPackageState';

export interface PetPackageController {
  readonly state: PetPackageState;
  readonly selectFiles: (files: readonly File[]) => Promise<void>;
  readonly selectRepositoryPet: (petPackage: BundledPetPackageDescriptor) => void;
}

export interface PetPackageLoaders {
  readonly loadBundled: typeof loadBundledPetPackage;
  readonly loadUploaded: typeof loadUploadedPetPackage;
}

const BROWSER_LOADERS: PetPackageLoaders = {
  loadBundled: loadBundledPetPackage,
  loadUploaded: loadUploadedPetPackage,
};

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function usePetPackageController(
  initialPetPackage: BundledPetPackageDescriptor,
  loaders: PetPackageLoaders = BROWSER_LOADERS,
): PetPackageController {
  const [state, dispatch] = useReducer(
    petPackageReducer,
    initialPetPackage,
    createInitialPetPackageState,
  );
  const requestRef = useRef<AbortController | null>(null);
  const activePackageRef = useRef<LoadedPetPackage | null>(null);

  const beginRequest = useCallback(() => {
    requestRef.current?.abort();
    const request = new AbortController();
    requestRef.current = request;
    return request;
  }, []);

  const commitPackage = useCallback((
    petPackage: LoadedPetPackage,
    request: AbortController,
  ) => {
    if (requestRef.current !== request) {
      petPackage.dispose();
      return;
    }

    const previousPackage = activePackageRef.current;
    activePackageRef.current = petPackage;
    requestRef.current = null;
    dispatch({ type: 'package-ready', petPackage });
    previousPackage?.dispose();
  }, []);

  const loadRepositoryPet = useCallback(async (
    petPackageDescriptor: BundledPetPackageDescriptor,
  ) => {
    const request = beginRequest();
    activePackageRef.current?.dispose();
    activePackageRef.current = null;
    dispatch({ type: 'preview-loading', petPackage: petPackageDescriptor });

    try {
      const petPackage = await loaders.loadBundled(petPackageDescriptor, request.signal);
      commitPackage(petPackage, request);
    } catch (error) {
      if (requestRef.current !== request) return;
      requestRef.current = null;
      dispatch({
        type: 'preview-failed',
        petPackage: petPackageDescriptor,
        message: getErrorMessage(error, 'The repository sprite sheet could not be loaded.'),
      });
    }
  }, [beginRequest, commitPackage, loaders]);

  const selectRepositoryPet = useCallback((
    petPackageDescriptor: BundledPetPackageDescriptor,
  ) => {
    void loadRepositoryPet(petPackageDescriptor);
  }, [loadRepositoryPet]);

  const selectFiles = useCallback(async (files: readonly File[]) => {
    const request = beginRequest();
    dispatch({ type: 'upload-started' });

    try {
      const petPackage = await loaders.loadUploaded(files, request.signal);
      commitPackage(petPackage, request);
    } catch (error) {
      if (requestRef.current !== request) return;
      requestRef.current = null;
      dispatch({
        type: 'upload-failed',
        message: getErrorMessage(error, 'This Codex Pet package could not be opened.'),
      });
    }
  }, [beginRequest, commitPackage, loaders]);

  useEffect(() => {
    void loadRepositoryPet(initialPetPackage);
    return () => {
      requestRef.current?.abort();
      requestRef.current = null;
      activePackageRef.current?.dispose();
      activePackageRef.current = null;
    };
  }, [initialPetPackage, loadRepositoryPet]);

  return {
    state,
    selectFiles,
    selectRepositoryPet,
  };
}
