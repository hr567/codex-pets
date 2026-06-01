import type { ComponentProps } from 'react';
import * as stylex from '@stylexjs/stylex';

import { PetPackagePicker } from './PetPackagePicker';
import { AnimationStatePicker } from './inspector/AnimationStatePicker';
import { PackageDetails } from './inspector/PackageDetails';
import { PlaybackSettings } from './inspector/PlaybackSettings';

const styles = stylex.create({
  panel: {
    minWidth: 0,
    paddingBlock: {
      default: 36,
      '@media (max-width: 1200px)': 24,
      '@media (max-width: 960px)': 24,
      '@media (max-width: 640px)': 20,
    },
    paddingInline: {
      default: 32,
      '@media (max-width: 1200px)': 24,
      '@media (max-width: 640px)': 16,
    },
    borderLeftWidth: {
      default: 1,
      '@media (max-width: 960px)': 0,
    },
    borderTopWidth: {
      default: 0,
      '@media (max-width: 960px)': 1,
    },
    borderStyle: 'solid',
    borderColor: 'var(--color-border)',
    backgroundColor: 'var(--color-background-surface)',
    maxHeight: {
      default: 'calc(100dvh - 72px)',
      '@media (max-width: 960px)': 'none',
    },
    overflowY: {
      default: 'auto',
      '@media (max-width: 960px)': 'visible',
    },
  },
  section: {
    paddingBlock: 28,
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: 'var(--color-border)',
  },
  firstSection: {
    paddingTop: 4,
  },
  lastSection: {
    paddingBottom: 0,
    borderBottomWidth: 0,
  },
  heading: {
    margin: 0,
    marginBottom: 20,
    color: 'var(--color-text-primary)',
    fontSize: 14,
    fontWeight: 720,
    lineHeight: 1.2,
    letterSpacing: '0.025em',
    textTransform: 'uppercase',
  },
});

interface InspectorProps {
  readonly packageModel: ComponentProps<typeof PetPackagePicker>;
  readonly animationModel: ComponentProps<typeof AnimationStatePicker>;
  readonly playbackModel: Omit<ComponentProps<typeof PlaybackSettings>, 'petPackage'>;
}

export function Inspector({
  packageModel,
  animationModel,
  playbackModel,
}: InspectorProps) {
  return (
    <aside {...stylex.props(styles.panel)} aria-label="Preview controls">
      <section {...stylex.props(styles.section, styles.firstSection)}>
        <h2 {...stylex.props(styles.heading)}>Pet package</h2>
        <PetPackagePicker {...packageModel} />
      </section>

      <section {...stylex.props(styles.section)}>
        <h2 {...stylex.props(styles.heading)}>Animation</h2>
        <AnimationStatePicker {...animationModel} />
      </section>

      <section {...stylex.props(styles.section)} aria-label="Playback settings">
        <PlaybackSettings {...playbackModel} petPackage={packageModel.petPackage} />
      </section>

      <section {...stylex.props(styles.section, styles.lastSection)}>
        <h2 {...stylex.props(styles.heading)}>Package details</h2>
        <PackageDetails petPackage={packageModel.petPackage} />
      </section>
    </aside>
  );
}
