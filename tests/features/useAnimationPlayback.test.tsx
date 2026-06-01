// @vitest-environment jsdom

import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAnimationPlayback } from '../../src/features/preview/useAnimationPlayback';

let animationFrames: Map<number, FrameRequestCallback>;
let nextAnimationFrameId: number;

function runNextAnimationFrame(now: number): void {
  const entry = animationFrames.entries().next();
  if (entry.done) {
    throw new Error('No animation frame is pending.');
  }

  const [animationFrameId, callback] = entry.value;
  animationFrames.delete(animationFrameId);
  act(() => {
    callback(now);
  });
}

beforeEach(() => {
  animationFrames = new Map();
  nextAnimationFrameId = 1;
  vi.spyOn(performance, 'now').mockReturnValue(0);
  vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
    const animationFrameId = nextAnimationFrameId;
    nextAnimationFrameId += 1;
    animationFrames.set(animationFrameId, callback);
    return animationFrameId;
  }));
  vi.stubGlobal('cancelAnimationFrame', vi.fn((animationFrameId: number) => {
    animationFrames.delete(animationFrameId);
  }));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('useAnimationPlayback', () => {
  it('starts advancing frames as soon as the sprite asset is ready', () => {
    const { result, rerender } = renderHook(
      ({ isAssetReady }: { readonly isAssetReady: boolean }) => useAnimationPlayback({
        version: 2,
        playbackSpeed: 1,
        isAssetReady,
        resetKey: 'bundled-pet',
      }),
      { initialProps: { isAssetReady: false } },
    );

    expect(result.current.isPlaying).toBe(true);
    expect(requestAnimationFrame).not.toHaveBeenCalled();

    rerender({ isAssetReady: true });

    expect(requestAnimationFrame).toHaveBeenCalledOnce();
    runNextAnimationFrame(279);
    expect(result.current.activeFrame).toBe(0);
    runNextAnimationFrame(280);
    expect(result.current.activeFrame).toBe(1);
  });

  it('honors the longer final-frame hold in Codex timing', () => {
    const { result } = renderHook(() => useAnimationPlayback({
      version: 2,
      playbackSpeed: 1,
      isAssetReady: true,
      resetKey: 'bundled-pet',
    }));

    act(() => {
      result.current.selectState('running-right');
    });

    runNextAnimationFrame(840);
    expect(result.current.activeFrame).toBe(7);

    runNextAnimationFrame(1059);
    expect(result.current.activeFrame).toBe(7);

    runNextAnimationFrame(1060);
    expect(result.current.activeFrame).toBe(0);
  });

  it('scales standard frame durations with the playback multiplier', () => {
    const { result } = renderHook(() => useAnimationPlayback({
      version: 2,
      playbackSpeed: 2,
      isAssetReady: true,
      resetKey: 'bundled-pet',
    }));

    runNextAnimationFrame(139);
    expect(result.current.activeFrame).toBe(0);

    runNextAnimationFrame(140);
    expect(result.current.activeFrame).toBe(1);
  });

  it('keeps a manual pause for the same package and resumes for a new package', async () => {
    const { result, rerender } = renderHook(
      ({
        isAssetReady,
        resetKey,
      }: {
        readonly isAssetReady: boolean;
        readonly resetKey: string;
      }) => useAnimationPlayback({
        version: 2,
        playbackSpeed: 1,
        isAssetReady,
        resetKey,
      }),
      {
        initialProps: {
          isAssetReady: true,
          resetKey: 'first-pet',
        },
      },
    );

    expect(requestAnimationFrame).toHaveBeenCalledOnce();
    act(() => {
      result.current.togglePlaying();
    });
    expect(result.current.isPlaying).toBe(false);
    expect(cancelAnimationFrame).toHaveBeenCalledOnce();
    expect(animationFrames.size).toBe(0);

    rerender({ isAssetReady: false, resetKey: 'first-pet' });
    rerender({ isAssetReady: true, resetKey: 'first-pet' });

    expect(result.current.isPlaying).toBe(false);
    expect(requestAnimationFrame).toHaveBeenCalledOnce();

    rerender({ isAssetReady: true, resetKey: 'second-pet' });

    await waitFor(() => {
      expect(result.current.isPlaying).toBe(true);
    });
    expect(requestAnimationFrame).toHaveBeenCalledTimes(2);

    runNextAnimationFrame(280);
    expect(result.current.activeFrame).toBe(1);
  });
});
