import { isSpriteVersionNumber } from './spriteFormat';
import type { SpriteVersionNumber } from './spriteFormat';

declare const safeRelativePathBrand: unique symbol;

export type SafeRelativePath = string & { readonly [safeRelativePathBrand]: true };

export interface PetManifest {
  readonly id: string;
  readonly displayName: string;
  readonly description: string;
  readonly spriteVersionNumber: SpriteVersionNumber;
  readonly spritesheetPath: SafeRelativePath;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`pet.json must include a non-empty “${field}” value.`);
  }

  return value.trim();
}

export function normalizeSpritesheetPath(value: string): SafeRelativePath {
  const normalized = value.trim().replaceAll('\\', '/').replace(/^\.\//, '');
  const segments = normalized.split('/');

  if (
    normalized.length === 0
    || normalized.startsWith('/')
    || /^[a-z][a-z\d+.-]*:/i.test(normalized)
    || normalized.includes('?')
    || normalized.includes('#')
    || segments.some((segment) => segment === '..' || segment.length === 0)
  ) {
    throw new Error('spritesheetPath must be a safe relative file path.');
  }

  return normalized as SafeRelativePath;
}

export function parsePetManifest(value: unknown): PetManifest {
  if (!isRecord(value)) {
    throw new Error('pet.json must contain a JSON object.');
  }

  const spriteVersionValue = value.spriteVersionNumber === undefined
    ? 1
    : value.spriteVersionNumber;
  if (!isSpriteVersionNumber(spriteVersionValue)) {
    throw new Error('pet.json “spriteVersionNumber” must be 1 or 2 when provided.');
  }

  if (value.description !== undefined && typeof value.description !== 'string') {
    throw new Error('pet.json “description” must be a string when provided.');
  }

  return {
    id: requireString(value.id, 'id'),
    displayName: requireString(value.displayName, 'displayName'),
    description: value.description?.trim() ?? '',
    spriteVersionNumber: spriteVersionValue,
    spritesheetPath: normalizeSpritesheetPath(
      requireString(value.spritesheetPath, 'spritesheetPath'),
    ),
  };
}
