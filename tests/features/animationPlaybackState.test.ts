import { describe, expect, it } from 'vitest';

import {
  animationPlaybackReducer,
  createAnimationPlaybackState,
  getRenderableActiveFrame,
} from '../../src/features/preview/animationPlaybackState';
import { getDefaultAnimationState } from '../../src/domain/pet/spriteFormat';

describe('animationPlaybackReducer', () => {
  it('starts the default animation in the playing state', () => {
    expect(createAnimationPlaybackState()).toEqual({
      activeStateId: 'idle',
      activeFrame: 0,
      isPlaying: true,
    });
  });

  it('resets the frame when selecting a state', () => {
    const state = {
      activeStateId: 'idle',
      activeFrame: 5,
      isPlaying: true,
    } as const;

    expect(
      animationPlaybackReducer(state, {
        type: 'select-state',
        stateId: 'running-right',
      }),
    ).toEqual({
      activeStateId: 'running-right',
      activeFrame: 0,
      isPlaying: true,
    });
  });

  it('commits the frame calculated by the animation loop', () => {
    const state = {
      activeStateId: 'running-right',
      activeFrame: 6,
      isPlaying: true,
    } as const;

    expect(
      animationPlaybackReducer(state, {
        type: 'set-frame',
        frame: 1,
      }).activeFrame,
    ).toBe(1);
  });

  it('resumes playback when a package is loaded', () => {
    const state = {
      activeStateId: 'look',
      activeFrame: 12,
      isPlaying: false,
    } as const;

    expect(
      animationPlaybackReducer(state, {
        type: 'reset',
        stateId: 'idle',
      }),
    ).toEqual({
      activeStateId: 'idle',
      activeFrame: 0,
      isPlaying: true,
    });
  });

  it('synchronously constrains a v2 look frame when switching to a v1 package', () => {
    const v2LookState = {
      activeStateId: 'look',
      activeFrame: 12,
      isPlaying: true,
    } as const;

    expect(
      getRenderableActiveFrame(v2LookState, getDefaultAnimationState(1)),
    ).toBe(0);
  });
});
