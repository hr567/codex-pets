import * as stylex from '@stylexjs/stylex';
import { Button } from '@astryxdesign/core/Button';
import { Icon } from '@astryxdesign/core/Icon';
import {
  SegmentedControl,
  SegmentedControlItem,
} from '@astryxdesign/core/SegmentedControl';
import { Slider } from '@astryxdesign/core/Slider';
import { Code2, ImageDown } from 'lucide-react';

import {
  RENDERING_MODES,
  isPlaybackSpeed,
  isRenderingMode,
  isScale,
} from '../../app/preferences';
import type {
  PlaybackSpeed,
  RenderingMode,
  Scale,
} from '../../app/preferences';
import { triggerDownload } from '../../adapters/browser/download';
import type { PetPackageDescriptor } from '../../adapters/browser/petPackageLoader';

const RENDERING_MODE_LABELS = {
  crisp: 'Crisp',
  smooth: 'Smooth',
} as const satisfies Record<RenderingMode, string>;

const styles = stylex.create({
  settings: {
    display: 'grid',
    gap: 24,
  },
  sliders: {
    display: 'grid',
    gridTemplateColumns: {
      default: 'repeat(2, minmax(0, 1fr))',
      '@media (max-width: 520px)': '1fr',
    },
    gap: 24,
  },
  rendering: {
    display: 'grid',
    gap: 10,
  },
  settingLabel: {
    color: 'var(--color-text-primary)',
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 1.25,
  },
  renderingControl: {
    width: '100%',
  },
  actions: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 12,
    marginTop: 28,
  },
  actionButton: {
    width: '100%',
    minHeight: 48,
  },
});

interface PlaybackSettingsProps {
  readonly playbackSpeed: PlaybackSpeed;
  readonly onPlaybackSpeedChange: (playbackSpeed: PlaybackSpeed) => void;
  readonly scale: Scale;
  readonly onScaleChange: (scale: Scale) => void;
  readonly renderingMode: RenderingMode;
  readonly onRenderingModeChange: (renderingMode: RenderingMode) => void;
  readonly petPackage: PetPackageDescriptor;
}

export function PlaybackSettings({
  playbackSpeed,
  onPlaybackSpeedChange,
  scale,
  onScaleChange,
  renderingMode,
  onRenderingModeChange,
  petPackage,
}: PlaybackSettingsProps) {
  return (
    <>
      <div {...stylex.props(styles.settings)}>
        <div {...stylex.props(styles.sliders)}>
          <Slider
            label="Playback speed"
            value={playbackSpeed}
            onChange={(value: number) => {
              if (isPlaybackSpeed(value)) onPlaybackSpeedChange(value);
            }}
            min={0.5}
            max={2}
            step={0.25}
            width="100%"
            valueDisplay="text"
            formatValue={(value) => String(value) + '×'}
          />
          <Slider
            label="Scale"
            value={scale}
            onChange={(value: number) => {
              if (isScale(value)) onScaleChange(value);
            }}
            min={1}
            max={3}
            step={1}
            width="100%"
            valueDisplay="text"
            formatValue={(value) => String(value) + '×'}
          />
        </div>
        <div {...stylex.props(styles.rendering)}>
          <span {...stylex.props(styles.settingLabel)}>Rendering</span>
          <SegmentedControl
            value={renderingMode}
            onChange={(value) => {
              if (isRenderingMode(value)) onRenderingModeChange(value);
            }}
            label="Preview rendering"
            size="lg"
            layout="fill"
            xstyle={styles.renderingControl}
          >
            {RENDERING_MODES.map((mode) => (
              <SegmentedControlItem
                key={mode}
                value={mode}
                label={RENDERING_MODE_LABELS[mode]}
              />
            ))}
          </SegmentedControl>
        </div>
      </div>
      <div {...stylex.props(styles.actions)}>
        <Button
          label="Download spritesheet"
          variant="secondary"
          size="lg"
          icon={<Icon icon={ImageDown} size="md" />}
          onClick={() => {
            triggerDownload(
              petPackage.spritesheetUrl,
              petPackage.spritesheetFileName,
            );
          }}
          xstyle={styles.actionButton}
        >
          Spritesheet
        </Button>
        <Button
          label="View pet.json"
          variant="secondary"
          size="lg"
          icon={<Icon icon={Code2} size="md" />}
          href={petPackage.manifestUrl}
          target="_blank"
          rel="noopener noreferrer"
          xstyle={styles.actionButton}
        >
          pet.json
        </Button>
      </div>
    </>
  );
}
