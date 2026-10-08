// @vitest-environment jsdom

import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type {
  BundledPetPackageDescriptor,
  LoadedPetPackage,
} from '../../src/lib/packageLoader';
import { parsePetManifest } from '../../src/lib/manifest';
import {
  usePetPackage,
} from '../../src/hooks/usePetPackage';
import type {
  PetPackageLoaders,
} from '../../src/hooks/usePetPackage';

interface Deferred<T> {
  readonly promise: Promise<T>;
  readonly resolve: (value: T) => void;
}

function createDeferred<T>(): Deferred<T> {
  let resolvePromise: ((value: T) => void) | undefined;
  const promise = new Promise<T>((resolve) => {
    resolvePromise = resolve;
  });
  return {
    promise,
    resolve(value) {
      if (!resolvePromise) throw new Error('Deferred promise was not initialized.');
      resolvePromise(value);
    },
  };
}

function createBundledDescriptor(id = 'bundled-pet'): BundledPetPackageDescriptor {
  return {
    source: 'bundled',
    manifest: parsePetManifest({
      id,
      displayName: id,
      spriteVersionNumber: 2,
      spritesheetPath: 'spritesheet.webp',
    }),
    manifestUrl: id + '-manifest',
    spritesheetUrl: id + '-spritesheet',
    spritesheetFileName: 'spritesheet.webp',
  };
}

function createLoadedPackage(
  source: 'bundled' | 'local',
  descriptor = createBundledDescriptor(),
): LoadedPetPackage {
  return {
    ...descriptor,
    source,
    manifestUrl: source === 'local' ? 'local-manifest' : descriptor.manifestUrl,
    spritesheetUrl: source === 'local' ? 'local-spritesheet' : descriptor.spritesheetUrl,
    image: new Image(),
    dispose: vi.fn(),
  };
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('usePetPackage', () => {
  it('aborts a pending request and disposes a late result on unmount', async () => {
    const deferred = createDeferred<LoadedPetPackage>();
    let requestSignal: AbortSignal | undefined;
    const loaders: PetPackageLoaders = {
      loadBundled: vi.fn((_petPackage: BundledPetPackageDescriptor, signal: AbortSignal) => {
        requestSignal = signal;
        return deferred.promise;
      }),
      loadUploaded: vi.fn(() => Promise.reject(new Error('Not used'))),
    };
    const latePackage = createLoadedPackage('bundled');
    const descriptor = createBundledDescriptor();
    const { unmount } = renderHook(() => (
      usePetPackage(descriptor, loaders)
    ));

    await waitFor(() => {
      expect(loaders.loadBundled).toHaveBeenCalledOnce();
    });
    unmount();
    expect(requestSignal?.aborted).toBe(true);

    deferred.resolve(latePackage);
    await waitFor(() => {
      expect(latePackage.dispose).toHaveBeenCalledOnce();
    });
  });

  it('disposes the previous package on replacement and the active package on unmount', async () => {
    const bundledPackage = createLoadedPackage('bundled');
    const localPackage = createLoadedPackage('local');
    const loaders: PetPackageLoaders = {
      loadBundled: vi.fn(() => Promise.resolve(bundledPackage)),
      loadUploaded: vi.fn(() => Promise.resolve(localPackage)),
    };
    const descriptor = createBundledDescriptor();
    const { result, unmount } = renderHook(() => (
      usePetPackage(descriptor, loaders)
    ));

    await waitFor(() => {
      expect(result.current.state.preview.status).toBe('ready');
    });
    await act(async () => {
      await result.current.selectFiles([]);
    });

    expect(bundledPackage.dispose).toHaveBeenCalledOnce();
    expect(localPackage.dispose).not.toHaveBeenCalled();
    unmount();
    expect(localPackage.dispose).toHaveBeenCalledOnce();
  });

  it('loads a selected repository pet and releases the previous package', async () => {
    const initialDescriptor = createBundledDescriptor('renne');
    const selectedDescriptor = createBundledDescriptor('blackmi');
    const initialPackage = createLoadedPackage('bundled', initialDescriptor);
    const selectedPackage = createLoadedPackage('bundled', selectedDescriptor);
    const loaders: PetPackageLoaders = {
      loadBundled: vi.fn()
        .mockResolvedValueOnce(initialPackage)
        .mockResolvedValueOnce(selectedPackage),
      loadUploaded: vi.fn(() => Promise.reject(new Error('Not used'))),
    };
    const { result, unmount } = renderHook(() => (
      usePetPackage(initialDescriptor, loaders)
    ));

    await waitFor(() => {
      expect(result.current.state.preview.status).toBe('ready');
    });
    act(() => {
      result.current.selectRepositoryPet(selectedDescriptor);
    });

    expect(result.current.state.preview).toEqual({
      status: 'loading',
      petPackage: selectedDescriptor,
    });
    expect(initialPackage.dispose).toHaveBeenCalledOnce();
    await waitFor(() => {
      expect(result.current.state.preview).toEqual({
        status: 'ready',
        petPackage: selectedPackage,
      });
    });
    expect(loaders.loadBundled).toHaveBeenLastCalledWith(
      selectedDescriptor,
      expect.anything(),
    );

    unmount();
    expect(selectedPackage.dispose).toHaveBeenCalledOnce();
  });

  it('aborts a superseded repository load and disposes its late result', async () => {
    const initialDescriptor = createBundledDescriptor('renne');
    const firstDescriptor = createBundledDescriptor('blackmi');
    const secondDescriptor = createBundledDescriptor('miaomiao');
    const initialPackage = createLoadedPackage('bundled', initialDescriptor);
    const firstDeferred = createDeferred<LoadedPetPackage>();
    const secondDeferred = createDeferred<LoadedPetPackage>();
    const latePackage = createLoadedPackage('bundled', firstDescriptor);
    const secondPackage = createLoadedPackage('bundled', secondDescriptor);
    const requestSignals: AbortSignal[] = [];
    const loaders: PetPackageLoaders = {
      loadBundled: vi.fn((
        descriptor: BundledPetPackageDescriptor,
        signal: AbortSignal,
      ) => {
        requestSignals.push(signal);
        if (descriptor === initialDescriptor) return Promise.resolve(initialPackage);
        if (descriptor === firstDescriptor) return firstDeferred.promise;
        return secondDeferred.promise;
      }),
      loadUploaded: vi.fn(() => Promise.reject(new Error('Not used'))),
    };
    const { result, unmount } = renderHook(() => (
      usePetPackage(initialDescriptor, loaders)
    ));

    await waitFor(() => {
      expect(result.current.state.preview.status).toBe('ready');
    });
    act(() => {
      result.current.selectRepositoryPet(firstDescriptor);
    });
    act(() => {
      result.current.selectRepositoryPet(secondDescriptor);
    });

    expect(requestSignals[1]?.aborted).toBe(true);
    firstDeferred.resolve(latePackage);
    await waitFor(() => {
      expect(latePackage.dispose).toHaveBeenCalledOnce();
    });

    secondDeferred.resolve(secondPackage);
    await waitFor(() => {
      expect(result.current.state.preview).toEqual({
        status: 'ready',
        petPackage: secondPackage,
      });
    });

    unmount();
  });

  it('allows the same repository pet to be retried after a load failure', async () => {
    const initialDescriptor = createBundledDescriptor('renne');
    const selectedDescriptor = createBundledDescriptor('mangguo');
    const initialPackage = createLoadedPackage('bundled', initialDescriptor);
    const retryPackage = createLoadedPackage('bundled', selectedDescriptor);
    const loaders: PetPackageLoaders = {
      loadBundled: vi.fn()
        .mockResolvedValueOnce(initialPackage)
        .mockRejectedValueOnce(new Error('Repository image failed'))
        .mockResolvedValueOnce(retryPackage),
      loadUploaded: vi.fn(() => Promise.reject(new Error('Not used'))),
    };
    const { result, unmount } = renderHook(() => (
      usePetPackage(initialDescriptor, loaders)
    ));

    await waitFor(() => {
      expect(result.current.state.preview.status).toBe('ready');
    });
    act(() => {
      result.current.selectRepositoryPet(selectedDescriptor);
    });
    await waitFor(() => {
      expect(result.current.state.preview).toEqual({
        status: 'error',
        petPackage: selectedDescriptor,
        message: 'Repository image failed',
      });
    });

    act(() => {
      result.current.selectRepositoryPet(selectedDescriptor);
    });
    await waitFor(() => {
      expect(result.current.state.preview).toEqual({
        status: 'ready',
        petPackage: retryPackage,
      });
    });
    expect(loaders.loadBundled).toHaveBeenCalledTimes(3);

    unmount();
  });

  it('keeps the preview through failed and pending uploads, then clears errors on success', async () => {
    const descriptor = createBundledDescriptor('renne');
    const bundledPackage = createLoadedPackage('bundled', descriptor);
    const localPackage = createLoadedPackage('local');
    const upload = createDeferred<LoadedPetPackage>();
    const loaders: PetPackageLoaders = {
      loadBundled: vi.fn(() => Promise.resolve(bundledPackage)),
      loadUploaded: vi.fn()
        .mockRejectedValueOnce(new Error('Invalid local package'))
        .mockReturnValueOnce(upload.promise),
    };
    const { result, unmount } = renderHook(() => (
      usePetPackage(descriptor, loaders)
    ));

    await waitFor(() => {
      expect(result.current.state.preview.status).toBe('ready');
    });
    await act(async () => {
      await result.current.selectFiles([]);
    });

    expect(result.current.state.preview).toEqual({
      status: 'ready',
      petPackage: bundledPackage,
    });
    expect(result.current.state.upload).toEqual({
      status: 'error',
      message: 'Invalid local package',
    });
    expect(bundledPackage.dispose).not.toHaveBeenCalled();

    let uploadRequest: Promise<void> | undefined;
    act(() => {
      uploadRequest = result.current.selectFiles([]);
    });
    expect(result.current.state.preview).toEqual({
      status: 'ready',
      petPackage: bundledPackage,
    });
    expect(result.current.state.upload).toEqual({ status: 'validating' });
    expect(bundledPackage.dispose).not.toHaveBeenCalled();

    await act(async () => {
      upload.resolve(localPackage);
      await uploadRequest;
    });
    expect(result.current.state).toEqual({
      preview: { status: 'ready', petPackage: localPackage },
      upload: { status: 'idle' },
    });
    expect(bundledPackage.dispose).toHaveBeenCalledOnce();

    unmount();
    expect(localPackage.dispose).toHaveBeenCalledOnce();
  });

  it('exits loading when a failed upload interrupts the initial repository request', async () => {
    const descriptor = createBundledDescriptor();
    const repositoryLoad = createDeferred<LoadedPetPackage>();
    const latePackage = createLoadedPackage('bundled', descriptor);
    let repositorySignal: AbortSignal | undefined;
    const loaders: PetPackageLoaders = {
      loadBundled: vi.fn((_descriptor: BundledPetPackageDescriptor, signal: AbortSignal) => {
        repositorySignal = signal;
        return repositoryLoad.promise;
      }),
      loadUploaded: vi.fn().mockRejectedValue(new Error('Invalid local package')),
    };
    const { result } = renderHook(() => usePetPackage(descriptor, loaders));

    await act(async () => {
      await result.current.selectFiles([]);
    });
    expect(repositorySignal?.aborted).toBe(true);
    expect(result.current.state).toEqual({
      preview: { status: 'error', petPackage: descriptor, message: 'Invalid local package' },
      upload: { status: 'error', message: 'Invalid local package' },
    });

    await act(async () => {
      repositoryLoad.resolve(latePackage);
      await repositoryLoad.promise;
    });
    expect(latePackage.dispose).toHaveBeenCalledOnce();
    expect(result.current.state.preview.status).toBe('error');
  });

  it('discards an uploaded package that finishes after a repository selection', async () => {
    const initialDescriptor = createBundledDescriptor('renne');
    const selectedDescriptor = createBundledDescriptor('blackmi');
    const initialPackage = createLoadedPackage('bundled', initialDescriptor);
    const selectedPackage = createLoadedPackage('bundled', selectedDescriptor);
    const localPackage = createLoadedPackage('local');
    const upload = createDeferred<LoadedPetPackage>();
    let uploadSignal: AbortSignal | undefined;
    const loaders: PetPackageLoaders = {
      loadBundled: vi.fn()
        .mockResolvedValueOnce(initialPackage)
        .mockResolvedValueOnce(selectedPackage),
      loadUploaded: vi.fn<PetPackageLoaders['loadUploaded']>((_files, signal) => {
        uploadSignal = signal;
        return upload.promise;
      }),
    };
    const { result } = renderHook(() => usePetPackage(initialDescriptor, loaders));
    await waitFor(() => {
      expect(result.current.state.preview.status).toBe('ready');
    });

    let uploadRequest: Promise<void> | undefined;
    act(() => {
      uploadRequest = result.current.selectFiles([]);
      result.current.selectRepositoryPet(selectedDescriptor);
    });
    expect(uploadSignal?.aborted).toBe(true);
    await waitFor(() => {
      expect(result.current.state.preview).toEqual({
        status: 'ready',
        petPackage: selectedPackage,
      });
    });

    await act(async () => {
      upload.resolve(localPackage);
      await uploadRequest;
    });
    expect(localPackage.dispose).toHaveBeenCalledOnce();
    expect(result.current.state).toEqual({
      preview: { status: 'ready', petPackage: selectedPackage },
      upload: { status: 'idle' },
    });
  });

  it('switches from an uploaded package back to a repository pet', async () => {
    const initialDescriptor = createBundledDescriptor('renne');
    const selectedDescriptor = createBundledDescriptor('miaomiao');
    const initialPackage = createLoadedPackage('bundled', initialDescriptor);
    const localPackage = createLoadedPackage('local');
    const selectedPackage = createLoadedPackage('bundled', selectedDescriptor);
    const loaders: PetPackageLoaders = {
      loadBundled: vi.fn()
        .mockResolvedValueOnce(initialPackage)
        .mockResolvedValueOnce(selectedPackage),
      loadUploaded: vi.fn(() => Promise.resolve(localPackage)),
    };
    const { result, unmount } = renderHook(() => (
      usePetPackage(initialDescriptor, loaders)
    ));

    await waitFor(() => {
      expect(result.current.state.preview.status).toBe('ready');
    });
    await act(async () => {
      await result.current.selectFiles([]);
    });
    expect(result.current.state.preview).toEqual({
      status: 'ready',
      petPackage: localPackage,
    });

    act(() => {
      result.current.selectRepositoryPet(selectedDescriptor);
    });
    expect(localPackage.dispose).toHaveBeenCalledOnce();
    await waitFor(() => {
      expect(result.current.state.preview).toEqual({
        status: 'ready',
        petPackage: selectedPackage,
      });
    });

    unmount();
  });
});
