export const THEME_MODES = ['system', 'light', 'dark'] as const;
export const SCALES = [1, 2, 3] as const;
export const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const;
export const RENDERING_MODES = ['crisp', 'smooth'] as const;

export type ThemeMode = (typeof THEME_MODES)[number];
export type Scale = (typeof SCALES)[number];
export type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number];
export type RenderingMode = (typeof RENDERING_MODES)[number];

export interface PreferenceDefinition<T> {
  readonly key: string;
  readonly fallback: T;
  readonly isValid: (value: unknown) => value is T;
}

function createValidator<const Value extends string | number>(
  values: readonly Value[],
): (value: unknown) => value is Value {
  return (value: unknown): value is Value => (
    values.some((candidate) => candidate === value)
  );
}

export const isThemeMode = createValidator(THEME_MODES);
export const isScale = createValidator(SCALES);
export const isPlaybackSpeed = createValidator(PLAYBACK_SPEEDS);
export const isRenderingMode = createValidator(RENDERING_MODES);

export const THEME_PREFERENCE = {
  key: 'codex-pet-preview-theme',
  fallback: 'system',
  isValid: isThemeMode,
} as const satisfies PreferenceDefinition<ThemeMode>;

export const PLAYBACK_SPEED_PREFERENCE = {
  key: 'codex-pet-preview-speed',
  fallback: 1,
  isValid: isPlaybackSpeed,
} as const satisfies PreferenceDefinition<PlaybackSpeed>;

export const SCALE_PREFERENCE = {
  key: 'codex-pet-preview-scale',
  fallback: 2,
  isValid: isScale,
} as const satisfies PreferenceDefinition<Scale>;

export const RENDERING_MODE_PREFERENCE = {
  key: 'codex-pet-preview-rendering',
  fallback: 'crisp',
  isValid: isRenderingMode,
} as const satisfies PreferenceDefinition<RenderingMode>;
