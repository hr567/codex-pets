import { describe, expect, it } from 'vitest';

import {
  PLAYBACK_SPEED_PREFERENCE,
  RENDERING_MODE_PREFERENCE,
  isPlaybackSpeed,
  isRenderingMode,
} from '../../src/app/preferences';

describe('preview preferences', () => {
  it('defaults to exact Codex timing and crisp rendering', () => {
    expect(PLAYBACK_SPEED_PREFERENCE.fallback).toBe(1);
    expect(RENDERING_MODE_PREFERENCE.fallback).toBe('crisp');
  });

  it('accepts only supported playback speeds and rendering modes', () => {
    expect(isPlaybackSpeed(0.5)).toBe(true);
    expect(isPlaybackSpeed(2)).toBe(true);
    expect(isPlaybackSpeed(1.1)).toBe(false);
    expect(isRenderingMode('crisp')).toBe(true);
    expect(isRenderingMode('smooth')).toBe(true);
    expect(isRenderingMode('pixelated')).toBe(false);
  });
});
