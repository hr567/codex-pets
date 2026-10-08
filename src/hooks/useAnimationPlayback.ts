import { useEffect, useRef, useState } from 'react';

import type { PlaybackSpeed } from '../lib/preferences';
import {
  getAnimationState,
  getAnimationStates,
  getDefaultAnimationState,
  getFrameDurationMs,
} from '../lib/sprite';
import type {
  AnimationStateId,
  SpriteVersionNumber,
} from '../lib/sprite';

const BACKGROUND_GAP_MS = 1000;

interface UseAnimationPlaybackOptions {
  readonly version: SpriteVersionNumber;
  readonly playbackSpeed: PlaybackSpeed;
  readonly isAssetReady: boolean;
  readonly resetKey: string;
}

export function useAnimationPlayback({
  version,
  playbackSpeed,
  isAssetReady,
  resetKey,
}: UseAnimationPlaybackOptions) {
  const initialState = {
    resetKey,
    version,
    activeStateId: getDefaultAnimationState(version).id,
    frame: 0,
  };
  const [state, setState] = useState(initialState);
  if (state.resetKey !== resetKey || state.version !== version) setState(initialState);

  const animationStates = getAnimationStates(version);
  const activeState = getAnimationState(version, state.activeStateId)
    ?? getDefaultAnimationState(version);
  const activeFrame = activeState.id === state.activeStateId && state.frame < activeState.frames
    ? state.frame : 0;
  const clock = useRef({ frame: 0, elapsed: 0, lastTick: 0 });

  useEffect(() => {
    clock.current = { frame: 0, elapsed: 0, lastTick: performance.now() };
  }, [resetKey, version]);

  useEffect(() => {
    if (!isAssetReady) return undefined;

    let animationFrameId = 0;
    clock.current.lastTick = performance.now();
    clock.current.elapsed = 0;

    const animate = (now: number) => {
      const timing = clock.current;
      const elapsed = now - timing.lastTick;
      timing.lastTick = now;
      if (elapsed > BACKGROUND_GAP_MS) {
        animationFrameId = requestAnimationFrame(animate);
        return;
      }

      timing.elapsed += Math.max(0, elapsed) * playbackSpeed;
      const previousFrame = timing.frame;
      let frameDurationMs = getFrameDurationMs(activeState, timing.frame);

      while (timing.elapsed >= frameDurationMs) {
        timing.elapsed -= frameDurationMs;
        timing.frame = (timing.frame + 1) % activeState.frames;
        frameDurationMs = getFrameDurationMs(activeState, timing.frame);
      }

      const frame = timing.frame;
      if (frame !== previousFrame) setState((current) => ({ ...current, frame }));
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [activeState, isAssetReady, playbackSpeed, resetKey, version]);

  function selectState(stateId: AnimationStateId) {
    if (!getAnimationState(version, stateId)) return;
    clock.current = { frame: 0, elapsed: 0, lastTick: performance.now() };
    setState((current) => ({ ...current, activeStateId: stateId, frame: 0 }));
  }

  return {
    animationStates,
    activeState,
    activeFrame,
    selectState,
  };
}
