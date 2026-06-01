import { useCallback, useEffect, useReducer, useRef } from 'react';

import type { PlaybackSpeed } from '../../app/preferences';
import {
  getAnimationState,
  getAnimationStates,
  getDefaultAnimationState,
  getFrameDurationMs,
} from '../../domain/pet/spriteFormat';
import type {
  AnimationState,
  AnimationStateId,
  NonEmptyAnimationStates,
  SpriteVersionNumber,
} from '../../domain/pet/spriteFormat';
import {
  animationPlaybackReducer,
  createAnimationPlaybackState,
  getRenderableActiveFrame,
} from './animationPlaybackState';

const BACKGROUND_GAP_MS = 1000;

export interface AnimationPlaybackController {
  readonly animationStates: NonEmptyAnimationStates;
  readonly activeState: AnimationState;
  readonly activeFrame: number;
  readonly isPlaying: boolean;
  readonly selectState: (stateId: AnimationStateId) => void;
  readonly togglePlaying: () => void;
}

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
}: UseAnimationPlaybackOptions): AnimationPlaybackController {
  const [state, dispatch] = useReducer(
    animationPlaybackReducer,
    undefined,
    createAnimationPlaybackState,
  );
  const animationStates = getAnimationStates(version);
  const activeState = getAnimationState(version, state.activeStateId)
    ?? getDefaultAnimationState(version);
  const activeFrame = getRenderableActiveFrame(state, activeState);
  const activeFrameRef = useRef(0);

  useEffect(() => {
    activeFrameRef.current = 0;
    dispatch({
      type: 'reset',
      stateId: getDefaultAnimationState(version).id,
    });
  }, [resetKey, version]);

  useEffect(() => {
    if (!isAssetReady || !state.isPlaying) return undefined;

    let animationFrameId = 0;
    let lastTick = performance.now();
    let elapsedInFrameMs = 0;
    let currentFrame = activeFrameRef.current;

    const animate = (now: number) => {
      const elapsed = now - lastTick;
      lastTick = now;
      if (elapsed > BACKGROUND_GAP_MS) {
        animationFrameId = requestAnimationFrame(animate);
        return;
      }

      elapsedInFrameMs += Math.max(0, elapsed) * playbackSpeed;
      let frameChanged = false;
      let frameDurationMs = getFrameDurationMs(activeState, currentFrame);

      while (elapsedInFrameMs >= frameDurationMs) {
        elapsedInFrameMs -= frameDurationMs;
        currentFrame = (currentFrame + 1) % activeState.frames;
        frameDurationMs = getFrameDurationMs(activeState, currentFrame);
        frameChanged = true;
      }

      if (frameChanged) {
        activeFrameRef.current = currentFrame;
        dispatch({ type: 'set-frame', frame: currentFrame });
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [activeState, isAssetReady, playbackSpeed, resetKey, state.isPlaying, version]);

  const selectState = useCallback((stateId: AnimationStateId) => {
    if (!getAnimationState(version, stateId)) return;
    activeFrameRef.current = 0;
    dispatch({ type: 'select-state', stateId });
  }, [version]);

  const togglePlaying = useCallback(() => {
    dispatch({ type: 'toggle' });
  }, []);

  return {
    animationStates,
    activeState,
    activeFrame,
    isPlaying: state.isPlaying,
    selectState,
    togglePlaying,
  };
}
