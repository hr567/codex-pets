import type { AnimationState, AnimationStateId } from '../../domain/pet/spriteFormat';

export interface AnimationPlaybackState {
  readonly activeStateId: AnimationStateId;
  readonly activeFrame: number;
  readonly isPlaying: boolean;
}

export type AnimationPlaybackAction =
  | {
      readonly type: 'reset';
      readonly stateId: AnimationStateId;
    }
  | { readonly type: 'select-state'; readonly stateId: AnimationStateId }
  | { readonly type: 'set-frame'; readonly frame: number }
  | { readonly type: 'toggle' };

export function createAnimationPlaybackState(): AnimationPlaybackState {
  return {
    activeStateId: 'idle',
    activeFrame: 0,
    isPlaying: true,
  };
}

export function getRenderableActiveFrame(
  state: AnimationPlaybackState,
  activeState: AnimationState,
): number {
  const isCurrentState = state.activeStateId === activeState.id;
  const isFrameInRange = state.activeFrame >= 0 && state.activeFrame < activeState.frames;
  return isCurrentState && isFrameInRange ? state.activeFrame : 0;
}

export function animationPlaybackReducer(
  state: AnimationPlaybackState,
  action: AnimationPlaybackAction,
): AnimationPlaybackState {
  switch (action.type) {
    case 'reset':
      return {
        activeStateId: action.stateId,
        activeFrame: 0,
        isPlaying: true,
      };
    case 'select-state':
      return { ...state, activeStateId: action.stateId, activeFrame: 0 };
    case 'set-frame':
      return { ...state, activeFrame: action.frame };
    case 'toggle':
      return { ...state, isPlaying: !state.isPlaying };
  }
}
