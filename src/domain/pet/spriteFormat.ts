export const FRAME_WIDTH = 192;
export const FRAME_HEIGHT = 208;

const LOOK_DIRECTIONS = [
  '000',
  '022.5',
  '045',
  '067.5',
  '090',
  '112.5',
  '135',
  '157.5',
  '180',
  '202.5',
  '225',
  '247.5',
  '270',
  '292.5',
  '315',
  '337.5',
] as const;

const SUPPORTED_SPRITE_VERSIONS = [1, 2] as const;

export type SpriteVersionNumber = (typeof SUPPORTED_SPRITE_VERSIONS)[number];

interface AnimationStateBase {
  readonly id: string;
  readonly label: string;
  readonly frames: number;
  readonly frameDurationsMs: readonly number[];
}

interface RowAnimationState extends AnimationStateBase {
  readonly layout: 'row';
  readonly row: number;
}

interface GridAnimationState extends AnimationStateBase {
  readonly layout: 'grid';
  readonly startRow: number;
  readonly columns: number;
}

type AnimationStateDefinition = RowAnimationState | GridAnimationState;
type NonEmptyAnimationStateDefinitions = readonly [
  AnimationStateDefinition,
  ...AnimationStateDefinition[],
];

function rowAnimation<
  const Id extends string,
  const Durations extends readonly number[],
>(
  id: Id,
  label: string,
  row: number,
  frameDurationsMs: Durations,
) {
  return {
    id,
    label,
    layout: 'row' as const,
    row,
    frames: frameDurationsMs.length,
    frameDurationsMs,
  };
}

const STANDARD_ANIMATION_STATES = [
  rowAnimation('idle', 'Idle', 0, [280, 110, 110, 140, 140, 320]),
  rowAnimation(
    'running-right',
    'Run right',
    1,
    [120, 120, 120, 120, 120, 120, 120, 220],
  ),
  rowAnimation(
    'running-left',
    'Run left',
    2,
    [120, 120, 120, 120, 120, 120, 120, 220],
  ),
  rowAnimation('waving', 'Waving', 3, [140, 140, 140, 280]),
  rowAnimation('jumping', 'Jumping', 4, [140, 140, 140, 140, 280]),
  rowAnimation('failed', 'Failed', 5, [140, 140, 140, 140, 140, 140, 140, 240]),
  rowAnimation('waiting', 'Waiting', 6, [150, 150, 150, 150, 150, 260]),
  rowAnimation('running', 'Working', 7, [120, 120, 120, 120, 120, 220]),
  rowAnimation('review', 'Review', 8, [150, 150, 150, 150, 150, 280]),
] as const satisfies NonEmptyAnimationStateDefinitions;

const ANIMATION_STATES = [
  ...STANDARD_ANIMATION_STATES,
  {
    id: 'look',
    label: 'Look 360°',
    layout: 'grid',
    startRow: 9,
    columns: 8,
    frames: LOOK_DIRECTIONS.length,
    frameDurationsMs: LOOK_DIRECTIONS.map(() => 160),
  },
] as const satisfies NonEmptyAnimationStateDefinitions;

export type AnimationState = (typeof ANIMATION_STATES)[number];
export type AnimationStateId = (typeof ANIMATION_STATES)[number]['id'];
export type NonEmptyAnimationStates = readonly [AnimationState, ...AnimationState[]];

export interface AtlasSpec {
  readonly columns: number;
  readonly rows: number;
  readonly width: number;
  readonly height: number;
}

interface SpriteFormat {
  readonly version: SpriteVersionNumber;
  readonly atlas: AtlasSpec;
  readonly animationStates: NonEmptyAnimationStates;
}

const SPRITE_FORMATS = {
  1: {
    version: 1,
    atlas: {
      columns: 8,
      rows: 9,
      width: FRAME_WIDTH * 8,
      height: FRAME_HEIGHT * 9,
    },
    animationStates: STANDARD_ANIMATION_STATES,
  },
  2: {
    version: 2,
    atlas: {
      columns: 8,
      rows: 11,
      width: FRAME_WIDTH * 8,
      height: FRAME_HEIGHT * 11,
    },
    animationStates: ANIMATION_STATES,
  },
} as const satisfies Record<SpriteVersionNumber, SpriteFormat>;

export interface FrameSource {
  readonly column: number;
  readonly row: number;
}

export interface ImageDimensions {
  readonly width: number;
  readonly height: number;
}

export function isSpriteVersionNumber(value: unknown): value is SpriteVersionNumber {
  return SUPPORTED_SPRITE_VERSIONS.some((version) => version === value);
}

export function getAnimationStates(version: SpriteVersionNumber): NonEmptyAnimationStates {
  return SPRITE_FORMATS[version].animationStates;
}

export function getDefaultAnimationState(version: SpriteVersionNumber): AnimationState {
  return getAnimationStates(version)[0];
}

export function getAnimationState(
  version: SpriteVersionNumber,
  stateId: string,
): AnimationState | undefined {
  return getAnimationStates(version).find((state) => state.id === stateId);
}

function assertFrameInRange(state: AnimationState, frame: number): void {
  if (!Number.isInteger(frame) || frame < 0 || frame >= state.frames) {
    throw new RangeError(`Frame ${String(frame)} is outside the ${state.id} animation.`);
  }
}

export function getFrameSource(state: AnimationState, frame: number): FrameSource {
  assertFrameInRange(state, frame);

  if (state.layout === 'row') {
    return { column: frame, row: state.row };
  }

  return {
    column: frame % state.columns,
    row: state.startRow + Math.floor(frame / state.columns),
  };
}

export function getFrameDurationMs(state: AnimationState, frame: number): number {
  assertFrameInRange(state, frame);

  const duration = state.frameDurationsMs[frame];
  if (duration === undefined) {
    throw new Error(`The ${state.id} animation is missing a duration for frame ${String(frame)}.`);
  }

  return duration;
}

export function getExpectedAtlas(version: SpriteVersionNumber): AtlasSpec {
  return SPRITE_FORMATS[version].atlas;
}

export function assertAtlasDimensions(
  actual: ImageDimensions,
  version: SpriteVersionNumber,
): AtlasSpec {
  const expected = getExpectedAtlas(version);
  if (actual.width === expected.width && actual.height === expected.height) {
    return expected;
  }

  const detectedVersion = SUPPORTED_SPRITE_VERSIONS.find((candidate) => {
    const candidateAtlas = getExpectedAtlas(candidate);
    return candidateAtlas.width === actual.width && candidateAtlas.height === actual.height;
  });

  if (detectedVersion === 2 && version === 1) {
    throw new Error('This atlas looks like v2. Add “spriteVersionNumber”: 2 to pet.json.');
  }

  if (detectedVersion === 1 && version === 2) {
    throw new Error('This is a 9-row atlas. A v2 Codex Pet requires the complete 11-row atlas.');
  }

  throw new Error(
    `The sprite sheet is ${String(actual.width)} × ${String(actual.height)}; `
      + `v${String(version)} requires ${String(expected.width)} × ${String(expected.height)}.`,
  );
}
