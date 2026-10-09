import { useEffect, useRef } from 'react';
import { Banner } from '@cloudflare/kumo/components/banner';
import { LayerCard } from '@cloudflare/kumo/components/layer-card';
import { Radio } from '@cloudflare/kumo/components/radio';
import { Text } from '@cloudflare/kumo/components/text';

import type { PlaybackSpeed, RenderingMode, Scale } from '../lib/preferences';
import { drawSpriteFrame } from '../lib/canvas';
import { FRAME_HEIGHT, FRAME_WIDTH, getFrameSource } from '../lib/sprite';
import type { PetPackageState } from '../hooks/usePetPackage';
import { useAnimationPlayback } from '../hooks/useAnimationPlayback';

interface PetStageProps {
  readonly preview: PetPackageState['preview'];
  readonly playbackSpeed: PlaybackSpeed;
  readonly scale: Scale;
  readonly renderingMode: RenderingMode;
}

export function PetStage({ preview, playbackSpeed, scale, renderingMode }: PetStageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { manifest, manifestUrl } = preview.petPackage;
  const image = preview.status === 'ready' ? preview.petPackage.image : null;
  const { animationStates, activeState, activeFrame, selectState } =
    useAnimationPlayback({
      version: manifest.spriteVersionNumber,
      playbackSpeed,
      isAssetReady: preview.status === 'ready',
      resetKey: manifestUrl,
    });

  useEffect(() => {
    if (canvasRef.current) {
      drawSpriteFrame(canvasRef.current, image, getFrameSource(activeState, activeFrame), {
        imageSmoothingEnabled: renderingMode === 'smooth',
      });
    }
  }, [activeFrame, activeState, image, renderingMode, scale]);

  return (
    <section aria-label={`${manifest.displayName} animation preview`}>
      <LayerCard>
        <LayerCard.Secondary>
          <div className="flex w-full flex-wrap items-center justify-between gap-2">
            <Text as="h2" variant="heading">{manifest.displayName}</Text>
            <Text variant="secondary">{activeState.label} · {activeState.frames} frames</Text>
          </div>
        </LayerCard.Secondary>
        <LayerCard.Primary>
          <div className="space-y-6 p-4">
            <div className="grid min-h-96 place-items-center" aria-busy={preview.status === 'loading'}>
              {preview.status === 'error' ? (
                <Banner variant="error" title="Preview unavailable" description={preview.message} />
              ) : preview.status === 'loading' ? (
                <Text role="status">Loading {manifest.displayName}…</Text>
              ) : (
                <canvas
                  ref={canvasRef}
                  width={FRAME_WIDTH * scale}
                  height={FRAME_HEIGHT * scale}
                  className={renderingMode === 'crisp'
                    ? 'h-auto max-w-full [image-rendering:pixelated]' : 'h-auto max-w-full'}
                  role="img"
                  aria-label={`${manifest.displayName}, ${activeState.label} animation preview`}
                >
                  Animated preview of {manifest.displayName}.
                </canvas>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <Text variant="secondary">{playbackSpeed}× Codex timing</Text>
              <Text aria-label="Animation frame">{activeFrame + 1} / {activeState.frames}</Text>
            </div>
            <Radio.Group
              legend="Animation"
              value={activeState.id}
              onValueChange={(value) => {
                const nextState = animationStates.find((state) => state.id === value);
                if (nextState) selectState(nextState.id);
              }}
            >
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {animationStates.map((state) => (
                  <Radio.Item key={state.id} value={state.id} label={state.label} />
                ))}
              </div>
            </Radio.Group>
          </div>
        </LayerCard.Primary>
      </LayerCard>
    </section>
  );
}
