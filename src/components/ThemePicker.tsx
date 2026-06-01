import { useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Popover } from '@astryxdesign/core/Popover';
import {
  SegmentedControl,
  SegmentedControlItem,
} from '@astryxdesign/core/SegmentedControl';
import { Monitor, Moon, Sun } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { THEME_MODES, isThemeMode } from '../app/preferences';
import type { ThemeMode } from '../app/preferences';

const MODE_OPTIONS = {
  system: { label: 'System theme', glyph: Monitor },
  light: { label: 'Light theme', glyph: Sun },
  dark: { label: 'Dark theme', glyph: Moon },
} satisfies Record<ThemeMode, { readonly label: string; readonly glyph: LucideIcon }>;

const styles = stylex.create({
  desktop: {
    display: {
      default: 'block',
      '@media (max-width: 640px)': 'none',
    },
  },
  mobile: {
    display: {
      default: 'none',
      '@media (max-width: 640px)': 'block',
    },
  },
  picker: {
    minWidth: 160,
  },
  mobilePicker: {
    padding: 8,
  },
});

interface ThemePickerProps {
  value: ThemeMode;
  onChange: (value: ThemeMode) => void;
}

function ModeSegments({ value, onChange }: ThemePickerProps) {
  return (
    <SegmentedControl
      value={value}
      onChange={(nextValue) => {
        if (isThemeMode(nextValue)) onChange(nextValue);
      }}
      label="Color theme"
      size="lg"
      layout="fill"
      xstyle={styles.picker}
    >
      {THEME_MODES.map((optionValue) => {
        const { label, glyph } = MODE_OPTIONS[optionValue];
        return (
          <SegmentedControlItem
            key={optionValue}
            value={optionValue}
            label={label}
            isLabelHidden
            icon={<Icon icon={glyph} size="sm" />}
          />
        );
      })}
    </SegmentedControl>
  );
}

export function ThemePicker({ value, onChange }: ThemePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const active = MODE_OPTIONS[value];

  const handleMobileChange = (nextValue: ThemeMode) => {
    onChange(nextValue);
    setIsOpen(false);
  };

  return (
    <>
      <div {...stylex.props(styles.desktop)}>
        <ModeSegments value={value} onChange={onChange} />
      </div>
      <div {...stylex.props(styles.mobile)}>
        <Popover
          label="Choose color theme"
          placement="below"
          alignment="end"
          isOpen={isOpen}
          onOpenChange={setIsOpen}
          hasAutoFocus={false}
          width={184}
          content={
            <div {...stylex.props(styles.mobilePicker)}>
              <ModeSegments value={value} onChange={handleMobileChange} />
            </div>
          }
        >
          <IconButton
            label={`Theme: ${active.label}`}
            variant="secondary"
            size="lg"
            icon={<Icon icon={active.glyph} size="md" />}
          />
        </Popover>
      </div>
    </>
  );
}
