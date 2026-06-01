import { describe, expect, it } from 'vitest';

import {
  FRAME_HEIGHT,
  FRAME_WIDTH,
  assertAtlasDimensions,
  getAnimationState,
  getAnimationStates,
  getExpectedAtlas,
  getFrameSource,
} from '../../src/domain/pet/spriteFormat';

describe('sprite formats', () => {
  it('derives v1 and v2 atlas dimensions from the shared frame size', () => {
    expect(getExpectedAtlas(1)).toEqual({
      columns: 8,
      rows: 9,
      width: FRAME_WIDTH * 8,
      height: FRAME_HEIGHT * 9,
    });
    expect(getExpectedAtlas(2)).toEqual({
      columns: 8,
      rows: 11,
      width: FRAME_WIDTH * 8,
      height: FRAME_HEIGHT * 11,
    });
  });

  it('exposes look animation only for v2', () => {
    expect(getAnimationStates(1).some((state) => state.id === 'look')).toBe(false);
    expect(getAnimationStates(2).some((state) => state.id === 'look')).toBe(true);
  });

  it('uses the exact Codex v2 per-frame timings', () => {
    const expectedDurations = {
      idle: [280, 110, 110, 140, 140, 320],
      'running-right': [120, 120, 120, 120, 120, 120, 120, 220],
      'running-left': [120, 120, 120, 120, 120, 120, 120, 220],
      waving: [140, 140, 140, 280],
      jumping: [140, 140, 140, 140, 280],
      failed: [140, 140, 140, 140, 140, 140, 140, 240],
      waiting: [150, 150, 150, 150, 150, 260],
      running: [120, 120, 120, 120, 120, 220],
      review: [150, 150, 150, 150, 150, 280],
    } as const;

    for (const [stateId, durations] of Object.entries(expectedDurations)) {
      expect(getAnimationState(2, stateId)?.frameDurationsMs).toEqual(durations);
    }

    expect(getAnimationState(2, 'look')?.frameDurationsMs).toEqual(
      Array.from({ length: 16 }, () => 160),
    );
  });
});

describe('getFrameSource', () => {
  it('maps a standard row frame directly to its column', () => {
    const idle = getAnimationState(2, 'idle');
    expect(idle).toBeDefined();
    if (!idle) return;

    expect(getFrameSource(idle, 4)).toEqual({ column: 4, row: 0 });
  });

  it('maps the 16-frame look animation across two rows', () => {
    const look = getAnimationState(2, 'look');
    expect(look).toBeDefined();
    if (!look) return;

    expect(getFrameSource(look, 0)).toEqual({ column: 0, row: 9 });
    expect(getFrameSource(look, 8)).toEqual({ column: 0, row: 10 });
    expect(getFrameSource(look, 15)).toEqual({ column: 7, row: 10 });
  });

  it('rejects frames outside the state contract', () => {
    const idle = getAnimationState(2, 'idle');
    expect(idle).toBeDefined();
    if (!idle) return;

    expect(() => getFrameSource(idle, -1)).toThrow(RangeError);
    expect(() => getFrameSource(idle, idle.frames)).toThrow(RangeError);
  });
});

describe('assertAtlasDimensions', () => {
  it('returns the matching atlas specification', () => {
    expect(assertAtlasDimensions({ width: 1536, height: 2288 }, 2)).toEqual(
      getExpectedAtlas(2),
    );
  });

  it('explains a manifest version mismatch', () => {
    expect(() => assertAtlasDimensions({ width: 1536, height: 2288 }, 1)).toThrow(
      'looks like v2',
    );
    expect(() => assertAtlasDimensions({ width: 1536, height: 1872 }, 2)).toThrow(
      '9-row atlas',
    );
  });
});
