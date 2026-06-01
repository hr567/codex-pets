import * as stylex from '@stylexjs/stylex';

import type { PetPackageDescriptor } from '../../adapters/browser/petPackageLoader';
import {
  FRAME_HEIGHT,
  FRAME_WIDTH,
  getExpectedAtlas,
} from '../../domain/pet/spriteFormat';

const styles = stylex.create({
  metadata: {
    display: 'grid',
    gap: 0,
    margin: 0,
  },
  row: {
    display: 'grid',
    gridTemplateColumns: 'minmax(100px, 0.9fr) minmax(140px, 1.1fr)',
    gap: 18,
    paddingBlock: 12,
  },
  term: {
    color: 'var(--color-text-secondary)',
    fontSize: 14,
    lineHeight: 1.4,
  },
  value: {
    margin: 0,
    color: 'var(--color-text-primary)',
    fontSize: 14,
    lineHeight: 1.4,
    fontVariantNumeric: 'tabular-nums',
  },
});

interface PackageDetailsProps {
  readonly petPackage: PetPackageDescriptor;
}

export function PackageDetails({ petPackage }: PackageDetailsProps) {
  const { manifest } = petPackage;
  const atlas = getExpectedAtlas(manifest.spriteVersionNumber);
  const facts = [
    ['Pet ID', manifest.id],
    ['Frame size', String(FRAME_WIDTH) + ' × ' + String(FRAME_HEIGHT) + ' frame'],
    ['Atlas size', String(atlas.width) + ' × ' + String(atlas.height) + ' atlas'],
    ['Grid', String(atlas.columns) + ' × ' + String(atlas.rows) + ' grid'],
    ['Version', 'v' + String(manifest.spriteVersionNumber) + ' sprite'],
  ] as const;

  return (
    <dl {...stylex.props(styles.metadata)}>
      {facts.map(([term, value]) => (
        <div key={term} {...stylex.props(styles.row)}>
          <dt {...stylex.props(styles.term)}>{term}</dt>
          <dd {...stylex.props(styles.value)}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
