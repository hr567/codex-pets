import { useRef } from 'react';
import type { KeyboardEvent } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Icon } from '@astryxdesign/core/Icon';
import { ToggleButton, ToggleButtonGroup } from '@astryxdesign/core/ToggleButton';

import type {
  AnimationStateId,
  NonEmptyAnimationStates,
} from '../../domain/pet/spriteFormat';

const styles = stylex.create({
  wrapper: {
    minWidth: 0,
  },
  grid: {
    width: '100%',
    flexWrap: 'wrap',
    gap: 10,
  },
  button: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: {
      default: 'calc((100% - 20px) / 3)',
      '@media (max-width: 640px)': 'calc((100% - 10px) / 2)',
    },
    maxWidth: {
      default: 'calc((100% - 20px) / 3)',
      '@media (max-width: 640px)': 'calc((100% - 10px) / 2)',
    },
    minWidth: 0,
    minHeight: 56,
    paddingInline: 10,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: {
      default: 'var(--color-border)',
      ':hover': 'var(--color-accent)',
    },
    borderRadius: 'var(--radius-element)',
    backgroundColor: {
      default: 'var(--color-background-surface)',
      ':hover': 'var(--color-accent-muted)',
    },
  },
  buttonActive: {
    borderColor: 'var(--color-accent)',
    color: 'var(--color-text-accent)',
    backgroundColor: 'var(--color-accent-muted)',
    boxShadow: 'var(--shadow-inset-selected)',
  },
});

interface AnimationStatePickerProps {
  readonly animationStates: NonEmptyAnimationStates;
  readonly activeStateId: AnimationStateId;
  readonly onStateChange: (stateId: AnimationStateId) => void;
}

function getNavigationDelta(key: string): -1 | 0 | 1 {
  if (key === 'ArrowRight' || key === 'ArrowDown') return 1;
  if (key === 'ArrowLeft' || key === 'ArrowUp') return -1;
  return 0;
}

export function AnimationStatePicker({
  animationStates,
  activeStateId,
  onStateChange,
}: AnimationStatePickerProps) {
  const buttonRefs = useRef(new Map<AnimationStateId, HTMLButtonElement>());

  const handleGridKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const delta = getNavigationDelta(event.key);
    if (delta === 0) return;

    event.preventDefault();
    const currentIndex = animationStates.findIndex((state) => state.id === activeStateId);
    const nextIndex = (currentIndex + delta + animationStates.length) % animationStates.length;
    const nextState = animationStates[nextIndex] ?? animationStates[0];
    onStateChange(nextState.id);
    requestAnimationFrame(() => buttonRefs.current.get(nextState.id)?.focus());
  };

  return (
    <div {...stylex.props(styles.wrapper)} onKeyDown={handleGridKeyDown}>
      <ToggleButtonGroup
        type="single"
        value={activeStateId}
        onChange={(value) => {
          const nextState = animationStates.find((state) => state.id === value);
          if (nextState) onStateChange(nextState.id);
        }}
        label="Animation state"
        size="lg"
        xstyle={styles.grid}
      >
        {animationStates.map((state) => (
          <ToggleButton
            key={state.id}
            ref={(element) => {
              if (element) buttonRefs.current.set(state.id, element);
              else buttonRefs.current.delete(state.id);
            }}
            value={state.id}
            label={state.label}
            pressedIcon={<Icon icon="check" size="sm" />}
            xstyle={[
              styles.button,
              state.id === activeStateId && styles.buttonActive,
            ]}
            data-animation-id={state.id}
          />
        ))}
      </ToggleButtonGroup>
    </div>
  );
}
