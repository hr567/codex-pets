import * as stylex from '@stylexjs/stylex';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import type { StatusDotVariant } from '@astryxdesign/core/StatusDot';

import type { ThemeMode } from '../app/preferences';
import { BrandMark } from './BrandMark';
import { ThemePicker } from './ThemePicker';

const styles = stylex.create({
  header: {
    minHeight: 72,
    display: 'flex',
    alignItems: 'center',
    gap: {
      default: 28,
      '@media (max-width: 760px)': 14,
    },
    paddingBlock: 12,
    paddingInline: {
      default: 36,
      '@media (max-width: 1200px)': 24,
      '@media (max-width: 640px)': 16,
    },
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: 'var(--color-border)',
    backgroundColor: 'var(--color-background-surface)',
  },
  identity: {
    minWidth: 0,
    display: 'flex',
    alignItems: 'center',
    gap: 20,
  },
  wordmark: {
    margin: 0,
    color: 'var(--color-text-primary)',
    fontSize: {
      default: 30,
      '@media (max-width: 640px)': 20,
    },
    fontWeight: 760,
    lineHeight: 1,
    letterSpacing: '-0.035em',
    whiteSpace: 'nowrap',
  },
  divider: {
    width: 1,
    height: 36,
    backgroundColor: 'var(--color-border-emphasized)',
    display: {
      default: 'block',
      '@media (max-width: 760px)': 'none',
    },
  },
  descriptor: {
    color: 'var(--color-text-secondary)',
    fontSize: 15,
    lineHeight: 1.3,
    whiteSpace: 'nowrap',
    display: {
      default: 'block',
      '@media (max-width: 760px)': 'none',
    },
  },
  actions: {
    marginLeft: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: {
      default: 28,
      '@media (max-width: 640px)': 12,
    },
  },
  status: {
    alignItems: 'center',
    gap: 10,
    color: 'var(--color-text-primary)',
    fontSize: {
      default: 14,
      '@media (max-width: 480px)': 12,
    },
    whiteSpace: 'nowrap',
    display: {
      default: 'flex',
      '@media (max-width: 640px)': 'none',
    },
  },
  visuallyHidden: {
    position: 'absolute',
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: 'hidden',
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    whiteSpace: 'nowrap',
    borderWidth: 0,
  },
});

export interface PreviewStatus {
  readonly label: string;
  readonly variant: StatusDotVariant;
}

interface AppHeaderProps {
  readonly status: PreviewStatus;
  readonly themeMode: ThemeMode;
  readonly onThemeChange: (themeMode: ThemeMode) => void;
}

export function AppHeader({ status, themeMode, onThemeChange }: AppHeaderProps) {
  return (
    <header {...stylex.props(styles.header)} data-app-header>
      <div {...stylex.props(styles.identity)}>
        <BrandMark />
        <h1 {...stylex.props(styles.wordmark)} data-app-header-wordmark>
          Codex Pet Preview
        </h1>
        <span {...stylex.props(styles.divider)} aria-hidden />
        <span {...stylex.props(styles.descriptor)} data-app-header-descriptor>
          Inspect local pet packages
        </span>
      </div>
      <div {...stylex.props(styles.actions)} data-app-header-actions>
        <div {...stylex.props(styles.status)} data-app-header-status aria-hidden>
          <StatusDot
            variant={status.variant}
            label={status.label}
            isPulsing={status.variant === 'accent'}
          />
          <span>{status.label}</span>
        </div>
        <span
          {...stylex.props(styles.visuallyHidden)}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {status.label}
        </span>
        <ThemePicker value={themeMode} onChange={onThemeChange} />
      </div>
    </header>
  );
}
