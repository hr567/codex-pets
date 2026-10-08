// @vitest-environment jsdom

import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAnimationPlayback } from '../../src/hooks/useAnimationPlayback';
import type { PlaybackSpeed } from '../../src/lib/preferences';
import {
  getAnimationStates,
  getFrameDurationMs,
  getFrameSource,
} from '../../src/lib/sprite';
import type { SpriteVersionNumber } from '../../src/lib/sprite';

let animationFrames: Map<number, FrameRequestCallback>;
let nextAnimationFrameId: number;
let nowMs: number;

function runNextAnimationFrame(now: number): void {
  const entry = animationFrames.entries().next();
  if (entry.done) {
    throw new Error('No animation frame is pending.');
  }

  const [animationFrameId, callback] = entry.value;
  animationFrames.delete(animationFrameId);
  nowMs = now;
  act(() => {
    callback(now);
  });
}

beforeEach(() => {
  animationFrames = new Map();
  nextAnimationFrameId = 1;
  nowMs = 0;
  vi.spyOn(performance, 'now').mockImplementation(() => nowMs);
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

    expect(result.current.activeFrame).toBe(0);
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

  it('automatically continues when the same package is ready again and resets for a new package', () => {
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
    runNextAnimationFrame(280);
    expect(result.current.activeFrame).toBe(1);

    rerender({ isAssetReady: false, resetKey: 'first-pet' });
    expect(cancelAnimationFrame).toHaveBeenCalledOnce();
    expect(animationFrames.size).toBe(0);

    rerender({ isAssetReady: true, resetKey: 'first-pet' });
    expect(animationFrames.size).toBe(1);
    expect(result.current.activeFrame).toBe(1);
    runNextAnimationFrame(390);
    expect(result.current.activeFrame).toBe(2);

    rerender({ isAssetReady: true, resetKey: 'second-pet' });
    expect(result.current.activeFrame).toBe(0);
    expect(animationFrames.size).toBe(1);
    runNextAnimationFrame(669);
    expect(result.current.activeFrame).toBe(0);
    runNextAnimationFrame(670);
    expect(result.current.activeFrame).toBe(1);
  });

  it.each([1, 2] as const)('plays every v%s action through its complete frame sequence', (version) => {
    const { result } = renderHook(() => useAnimationPlayback({
      version,
      playbackSpeed: 1,
      isAssetReady: true,
      resetKey: 'pet',
    }));
    expect(result.current.animationStates).toEqual(getAnimationStates(version));

    let now = 0;
    for (const animation of getAnimationStates(version)) {
      act(() => { result.current.selectState(animation.id); });
      expect(result.current.activeState.id).toBe(animation.id);
      expect(result.current.activeFrame).toBe(0);

      for (let frame = 0; frame < animation.frames; frame += 1) {
        now += getFrameDurationMs(animation, frame);
        runNextAnimationFrame(now - 1);
        expect(result.current.activeFrame).toBe(frame);
        runNextAnimationFrame(now);
        expect(result.current.activeFrame).toBe((frame + 1) % animation.frames);
      }
    }
  });

  it('restarts the current action with a complete first-frame hold', () => {
    const { result } = renderHook(() => useAnimationPlayback({
      version: 2,
      playbackSpeed: 1,
      isAssetReady: true,
      resetKey: 'pet',
    }));
    runNextAnimationFrame(390);
    expect(result.current.activeFrame).toBe(2);

    act(() => { result.current.selectState('idle'); });
    expect(result.current.activeFrame).toBe(0);
    runNextAnimationFrame(669);
    expect(result.current.activeFrame).toBe(0);
    runNextAnimationFrame(670);
    expect(result.current.activeFrame).toBe(1);
  });

  it('keeps playing and applies speed changes to the current frame', () => {
    const { result, rerender } = renderHook(
      ({ playbackSpeed }: { readonly playbackSpeed: PlaybackSpeed }) => useAnimationPlayback({
        version: 2,
        playbackSpeed,
        isAssetReady: true,
        resetKey: 'pet',
      }),
      { initialProps: { playbackSpeed: 1 as PlaybackSpeed } },
    );
    runNextAnimationFrame(280);
    expect(animationFrames.size).toBe(1);
    expect(result.current.activeFrame).toBe(1);

    rerender({ playbackSpeed: 2 });
    expect(animationFrames.size).toBe(1);
    runNextAnimationFrame(334);
    expect(result.current.activeFrame).toBe(1);
    runNextAnimationFrame(335);
    expect(result.current.activeFrame).toBe(2);

    rerender({ playbackSpeed: 0.5 });
    runNextAnimationFrame(554);
    expect(result.current.activeFrame).toBe(2);
    runNextAnimationFrame(555);
    expect(result.current.activeFrame).toBe(3);
  });

  it('resets a v2 look animation before a v1 package can render an invalid frame', () => {
    const { result, rerender } = renderHook(
      ({ version }: { readonly version: SpriteVersionNumber }) => {
        const playback = useAnimationPlayback({
          version,
          playbackSpeed: 1,
          isAssetReady: true,
          resetKey: 'pet',
        });
        // Rendering a frame outside this version's atlas would throw here.
        getFrameSource(playback.activeState, playback.activeFrame);
        return playback;
      },
      { initialProps: { version: 2 as SpriteVersionNumber } },
    );
    act(() => { result.current.selectState('look'); });
    runNextAnimationFrame(960);
    runNextAnimationFrame(1920);
    expect(result.current.activeFrame).toBe(12);

    rerender({ version: 1 });
    expect(result.current.activeState.id).toBe('idle');
    expect(result.current.activeFrame).toBe(0);
    expect(animationFrames.size).toBe(1);
    expect(result.current.animationStates).toHaveLength(9);

    act(() => { result.current.selectState('look'); });
    expect(result.current.activeState.id).toBe('idle');
    runNextAnimationFrame(2200);
    expect(result.current.activeFrame).toBe(1);
  });

  it('ignores a background gap and cancels the pending frame when unmounted', () => {
    const { result, unmount } = renderHook(() => useAnimationPlayback({
      version: 2,
      playbackSpeed: 1,
      isAssetReady: true,
      resetKey: 'pet',
    }));
    runNextAnimationFrame(279);
    runNextAnimationFrame(5000);
    expect(result.current.activeFrame).toBe(0);
    runNextAnimationFrame(5001);
    expect(result.current.activeFrame).toBe(1);

    unmount();
    expect(animationFrames.size).toBe(0);
  });
});
