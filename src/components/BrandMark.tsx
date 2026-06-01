import * as stylex from '@stylexjs/stylex';

const styles = stylex.create({
  root: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 12px)',
    gridTemplateRows: 'repeat(2, 12px)',
    gap: 3,
    flexShrink: 0,
    color: 'var(--color-accent)',
  },
  petal: {
    width: 12,
    height: 12,
    backgroundColor: 'currentColor',
  },
  topLeft: {
    borderRadius: '8px 3px 3px 3px',
  },
  topRight: {
    borderRadius: '3px 8px 3px 3px',
  },
  bottomLeft: {
    borderRadius: '3px 3px 3px 8px',
  },
  bottomRight: {
    borderRadius: '3px 3px 8px 3px',
  },
});

interface BrandMarkProps {
  size?: 'default' | 'small';
  decorative?: boolean;
}

export function BrandMark({ size = 'default', decorative = false }: BrandMarkProps) {
  const scale = size === 'small' ? 0.58 : 1;

  return (
    <span
      {...stylex.props(styles.root)}
      style={{ transform: `scale(${String(scale)})`, transformOrigin: 'center' }}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : 'Codex Pet Preview mark'}
      role={decorative ? undefined : 'img'}
    >
      <span {...stylex.props(styles.petal, styles.topLeft)} />
      <span {...stylex.props(styles.petal, styles.topRight)} />
      <span {...stylex.props(styles.petal, styles.bottomLeft)} />
      <span {...stylex.props(styles.petal, styles.bottomRight)} />
    </span>
  );
}
