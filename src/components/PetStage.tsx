import { useEffect, useRef } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Button } from '@astryxdesign/core/Button';
import { Icon } from '@astryxdesign/core/Icon';
import { Pause, Play } from 'lucide-react';

import type {
  PlaybackSpeed,
  RenderingMode,
  Scale,
} from '../app/preferences';
import { drawSpriteFrame } from '../adapters/browser/canvasRenderer';
import { FRAME_HEIGHT, FRAME_WIDTH, getFrameSource } from '../domain/pet/spriteFormat';
import type { AnimationState } from '../domain/pet/spriteFormat';
import { BrandMark } from './BrandMark';

const styles = stylex.create({
  panel: {
    minWidth: 0,
    padding: {
      default: 36,
      '@media (max-width: 1200px)': 24,
      '@media (max-width: 960px)': 18,
      '@media (max-width: 640px)': 12,
    },
    backgroundColor: 'var(--color-background-body)',
  },
  frame: {
    minHeight: {
      default: 'calc(100dvh - 144px)',
      '@media (max-width: 960px)': 'auto',
    },
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'var(--color-border)',
    borderRadius: 'var(--radius-container)',
    backgroundColor: 'var(--pet-preview-stage-frame)',
    boxShadow: 'var(--shadow-low)',
  },
  canvasStage: {
    position: 'relative',
    minHeight: {
      default: 560,
      '@media (max-height: 840px)': 460,
      '@media (max-width: 960px)': 520,
      '@media (max-width: 640px)': 390,
    },
    flexGrow: 1,
    display: 'grid',
    placeItems: 'center',
    margin: {
      default: 18,
      '@media (max-width: 640px)': 12,
    },
    overflow: 'auto',
    borderRadius: 12,
    backgroundColor: 'var(--pet-preview-checker-b)',
    backgroundImage: 'linear-gradient(45deg, var(--pet-preview-checker-a) 25%, transparent 25%), linear-gradient(-45deg, var(--pet-preview-checker-a) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, var(--pet-preview-checker-a) 75%), linear-gradient(-45deg, transparent 75%, var(--pet-preview-checker-a) 75%)',
    backgroundPosition: '0 0, 0 11px, 11px -11px, -11px 0',
    backgroundSize: '22px 22px',
  },
  motif: {
    position: 'absolute',
    color: 'var(--pet-preview-stage-motif)',
    opacity: 0.8,
    pointerEvents: 'none',
  },
  motifTopLeft: { top: 12, left: 12 },
  motifTopRight: { top: 12, right: 12 },
  motifBottomLeft: { bottom: 12, left: 12 },
  motifBottomRight: { right: 12, bottom: 12 },
  canvas: {
    display: 'block',
    maxWidth: 'none',
    height: 'auto',
    filter: 'var(--pet-preview-pet-shadow)',
  },
  canvasCrisp: {
    imageRendering: 'pixelated',
  },
  canvasSmooth: {
    imageRendering: 'auto',
  },
  loading: {
    position: 'absolute',
    inset: 0,
    display: 'grid',
    placeItems: 'center',
    padding: 24,
    color: 'var(--color-text-secondary)',
    fontSize: 14,
    textAlign: 'center',
    backgroundColor: 'var(--pet-preview-stage-surface)',
  },
  transport: {
    display: 'grid',
    gridTemplateColumns: {
      default: 'auto auto minmax(90px, 1fr) auto',
      '@media (max-width: 460px)': 'auto minmax(0, 1fr) auto',
    },
    alignItems: 'center',
    gap: {
      default: 24,
      '@media (max-width: 1200px)': 16,
      '@media (max-width: 640px)': 12,
    },
    minHeight: 78,
    paddingBlock: 12,
    paddingInline: {
      default: 18,
      '@media (max-width: 640px)': 12,
    },
    borderTopWidth: 1,
    borderTopStyle: 'solid',
    borderTopColor: 'var(--color-border)',
  },
  transportButton: {
    minHeight: 48,
    paddingInline: 18,
    color: '#ffffff',
    backgroundColor: {
      default: 'var(--pet-preview-cobalt)',
      ':hover': 'var(--pet-preview-cobalt-hover)',
      ':active': 'var(--pet-preview-cobalt-pressed)',
    },
  },
  currentState: {
    minWidth: 0,
    color: 'var(--color-text-primary)',
    fontSize: {
      default: 15,
      '@media (max-width: 520px)': 13,
    },
    fontWeight: 560,
    lineHeight: 1.25,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  progress: {
    position: 'relative',
    height: 4,
    overflow: 'hidden',
    borderRadius: 999,
    backgroundColor: 'var(--color-border-emphasized)',
  },
  progressFill: {
    height: '100%',
    borderRadius: 'inherit',
    backgroundColor: 'var(--color-accent)',
    transitionProperty: 'width',
    transitionDuration: 'var(--duration-fast)',
    transitionTimingFunction: 'var(--ease-standard)',
  },
  frameCount: {
    color: 'var(--color-text-primary)',
    fontSize: 14,
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap',
  },
  mobileHidden: {
    display: {
      default: 'block',
      '@media (max-width: 460px)': 'none',
    },
  },
});

interface PetStageBaseProps {
  readonly petName: string;
  readonly activeState: AnimationState;
  readonly activeFrame: number;
  readonly scale: Scale;
  readonly playbackSpeed: PlaybackSpeed;
  readonly renderingMode: RenderingMode;
  readonly isPlaying: boolean;
  readonly onTogglePlaying: () => void;
}

export type PetStageAsset = (
  | { readonly assetStatus: 'loading' }
  | { readonly assetStatus: 'ready'; readonly image: HTMLImageElement }
  | { readonly assetStatus: 'error'; readonly errorMessage: string }
);

type PetStageProps = PetStageBaseProps & PetStageAsset;

export function PetStage(props: PetStageProps) {
  const {
    petName,
    activeState,
    activeFrame,
    scale,
    playbackSpeed,
    renderingMode,
    isPlaying,
    onTogglePlaying,
  } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isReady = props.assetStatus === 'ready';
  const image = isReady ? props.image : null;

  useEffect(() => {
    if (!image || !canvasRef.current) {
      return;
    }

    const source = getFrameSource(activeState, activeFrame);
    drawSpriteFrame(canvasRef.current, image, source, {
      imageSmoothingEnabled: renderingMode === 'smooth',
    });
  }, [activeFrame, activeState, image, renderingMode]);

  const progress = ((activeFrame + 1) / activeState.frames) * 100;
  const statusText = props.assetStatus === 'error'
    ? props.errorMessage
    : `Loading ${petName}…`;

  return (
    <section {...stylex.props(styles.panel)} aria-label={`${petName} animation preview`}>
      <div {...stylex.props(styles.frame)}>
        <div {...stylex.props(styles.canvasStage)}>
          <span {...stylex.props(styles.motif, styles.motifTopLeft)}><BrandMark size="small" decorative /></span>
          <span {...stylex.props(styles.motif, styles.motifTopRight)}><BrandMark size="small" decorative /></span>
          <span {...stylex.props(styles.motif, styles.motifBottomLeft)}><BrandMark size="small" decorative /></span>
          <span {...stylex.props(styles.motif, styles.motifBottomRight)}><BrandMark size="small" decorative /></span>
          <canvas
            ref={canvasRef}
            width={FRAME_WIDTH}
            height={FRAME_HEIGHT}
            {...stylex.props(
              styles.canvas,
              renderingMode === 'crisp' ? styles.canvasCrisp : styles.canvasSmooth,
            )}
            style={{
              width: `min(100%, ${String(FRAME_WIDTH * scale)}px)`,
              height: 'auto',
            }}
            role={isReady ? 'img' : undefined}
            aria-label={
              isReady
                ? `${petName}, ${activeState.label} animation preview`
                : undefined
            }
            aria-hidden={isReady ? undefined : true}
          >
            Animated preview of {petName}.
          </canvas>
          {!isReady ? (
            <div
              {...stylex.props(styles.loading)}
              role={props.assetStatus === 'error' ? 'alert' : 'status'}
              aria-live={props.assetStatus === 'error' ? 'assertive' : 'polite'}
            >
              {statusText}
            </div>
          ) : null}
        </div>

        <div {...stylex.props(styles.transport)}>
          <Button
            label={isPlaying ? 'Pause animation' : 'Play animation'}
            variant="primary"
            size="lg"
            icon={<Icon icon={isPlaying ? Pause : Play} size="md" />}
            onClick={onTogglePlaying}
            xstyle={styles.transportButton}
            isDisabled={!isReady}
          >
            {isPlaying ? 'Pause' : 'Play'}
          </Button>
          <span {...stylex.props(styles.currentState)} aria-live="polite">
            {activeState.label} · {activeState.frames} frames · {playbackSpeed}× Codex timing
          </span>
          <div
            {...stylex.props(styles.progress, styles.mobileHidden)}
            role="progressbar"
            aria-label="Animation frame"
            aria-valuemin={1}
            aria-valuemax={activeState.frames}
            aria-valuenow={activeFrame + 1}
          >
            <div
              {...stylex.props(styles.progressFill)}
              style={{ width: `${String(progress)}%` }}
            />
          </div>
          <span {...stylex.props(styles.frameCount)}>
            {activeFrame + 1} / {activeState.frames}
          </span>
        </div>
      </div>
    </section>
  );
}
