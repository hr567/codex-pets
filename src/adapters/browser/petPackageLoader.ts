import { parsePetManifest } from '../../domain/pet/manifest';
import type { PetManifest } from '../../domain/pet/manifest';
import { assertAtlasDimensions } from '../../domain/pet/spriteFormat';

const MAX_MANIFEST_BYTES = 256 * 1024;
const MAX_SPRITESHEET_BYTES = 32 * 1024 * 1024;
const SUPPORTED_IMAGE_EXTENSIONS: ReadonlySet<string> = new Set(['png', 'webp']);

export type PetPackageSource = 'bundled' | 'local';

export interface PetPackageDescriptor {
  readonly source: PetPackageSource;
  readonly manifest: PetManifest;
  readonly manifestUrl: string;
  readonly spritesheetUrl: string;
  readonly spritesheetFileName: string;
}

export type BundledPetPackageDescriptor = PetPackageDescriptor & {
  readonly source: 'bundled';
};

export interface LoadedPetPackage extends PetPackageDescriptor {
  readonly image: HTMLImageElement;
  readonly dispose: () => void;
}

function getSelectedPath(file: File): string {
  return (file.webkitRelativePath || file.name).replaceAll('\\', '/').replace(/^\/+/, '');
}

function getBaseName(path: string): string {
  return path.split('/').at(-1) ?? path;
}

function getExtension(path: string): string | undefined {
  return getBaseName(path).split('.').at(-1)?.toLowerCase();
}

function findManifestFile(files: readonly File[]): File {
  const namedManifests = files.filter((file) => file.name.toLowerCase() === 'pet.json');
  if (namedManifests.length > 1) {
    throw new Error('More than one pet.json was selected. Choose one Codex Pet package at a time.');
  }

  const namedManifest = namedManifests[0];
  if (namedManifest) return namedManifest;

  const jsonFiles = files.filter((file) => file.name.toLowerCase().endsWith('.json'));
  const jsonFile = jsonFiles.length === 1 ? jsonFiles[0] : undefined;
  if (jsonFile) return jsonFile;

  throw new Error('pet.json was not found. Select it together with its sprite sheet.');
}

function findSpritesheetFile(
  files: readonly File[],
  manifestFile: File,
  spritesheetPath: string,
): File {
  const manifestPath = getSelectedPath(manifestFile);
  const manifestDirectory = manifestPath.includes('/')
    ? manifestPath.slice(0, manifestPath.lastIndexOf('/'))
    : '';
  const expectedPath = manifestDirectory ? `${manifestDirectory}/${spritesheetPath}` : spritesheetPath;
  const exactMatches = files.filter((file) => getSelectedPath(file) === expectedPath);
  const exactMatch = exactMatches.length === 1 ? exactMatches[0] : undefined;
  if (exactMatch) return exactMatch;
  if (exactMatches.length > 1) {
    throw new Error('The package contains duplicate sprite sheet paths.');
  }

  const expectedName = getBaseName(spritesheetPath).toLowerCase();
  const basenameMatches = files.filter((file) => file.name.toLowerCase() === expectedName);
  const basenameMatch = basenameMatches.length === 1 ? basenameMatches[0] : undefined;
  if (basenameMatch) return basenameMatch;

  throw new Error(`The sprite sheet referenced by pet.json (${spritesheetPath}) is missing.`);
}

function createAbortError(): DOMException {
  return new DOMException('The pet package load was cancelled.', 'AbortError');
}

function throwIfAborted(signal: AbortSignal): void {
  if (signal.aborted) throw createAbortError();
}

function revokeObjectUrls(objectUrls: readonly string[]): void {
  objectUrls.forEach((url) => {
    URL.revokeObjectURL(url);
  });
}

function loadImage(url: string, signal: AbortSignal): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(createAbortError());
      return;
    }

    const image = new Image();
    image.decoding = 'async';

    const cleanup = () => {
      image.onload = null;
      image.onerror = null;
      signal.removeEventListener('abort', handleAbort);
    };
    const handleAbort = () => {
      cleanup();
      image.removeAttribute('src');
      reject(createAbortError());
    };

    image.onload = () => {
      cleanup();
      resolve(image);
    };
    image.onerror = () => {
      cleanup();
      reject(new Error('The sprite sheet could not be decoded. Use a valid PNG or WebP image.'));
    };
    signal.addEventListener('abort', handleAbort, { once: true });
    image.src = url;
  });
}

function createDisposer(image: HTMLImageElement, objectUrls: readonly string[]): () => void {
  let isDisposed = false;
  return () => {
    if (isDisposed) return;
    isDisposed = true;
    image.removeAttribute('src');
    revokeObjectUrls(objectUrls);
  };
}

async function loadDescriptor(
  descriptor: PetPackageDescriptor,
  signal: AbortSignal,
  objectUrls: readonly string[],
): Promise<LoadedPetPackage> {
  const image = await loadImage(descriptor.spritesheetUrl, signal);
  try {
    assertAtlasDimensions(
      { width: image.naturalWidth, height: image.naturalHeight },
      descriptor.manifest.spriteVersionNumber,
    );
    throwIfAborted(signal);
  } catch (error) {
    image.removeAttribute('src');
    throw error;
  }

  return {
    ...descriptor,
    image,
    dispose: createDisposer(image, objectUrls),
  };
}

export function createBundledPetPackage(
  manifestValue: unknown,
  manifestUrl: string,
  spritesheetUrl: string,
): BundledPetPackageDescriptor {
  const manifest = parsePetManifest(manifestValue);
  return {
    source: 'bundled',
    manifest,
    manifestUrl,
    spritesheetUrl,
    spritesheetFileName: getBaseName(manifest.spritesheetPath),
  };
}

export function loadBundledPetPackage(
  descriptor: BundledPetPackageDescriptor,
  signal: AbortSignal,
): Promise<LoadedPetPackage> {
  return loadDescriptor(descriptor, signal, []);
}

export async function loadUploadedPetPackage(
  fileList: FileList | readonly File[] | null | undefined,
  signal: AbortSignal,
): Promise<LoadedPetPackage> {
  const files = fileList ? Array.from(fileList) : [];
  if (files.length === 0) {
    throw new Error('Choose pet.json and its sprite sheet to open a Codex Pet.');
  }

  throwIfAborted(signal);
  const manifestFile = findManifestFile(files);
  if (manifestFile.size > MAX_MANIFEST_BYTES) {
    throw new Error('pet.json is too large. The maximum supported size is 256 KB.');
  }

  let manifestValue: unknown;
  try {
    manifestValue = JSON.parse(await manifestFile.text());
  } catch {
    throw new Error('pet.json is not valid JSON.');
  }
  throwIfAborted(signal);

  const manifest = parsePetManifest(manifestValue);
  const spritesheetFile = findSpritesheetFile(files, manifestFile, manifest.spritesheetPath);
  const extension = getExtension(spritesheetFile.name);
  if (!extension || !SUPPORTED_IMAGE_EXTENSIONS.has(extension)) {
    throw new Error('The sprite sheet must be a PNG or WebP image.');
  }
  if (spritesheetFile.size > MAX_SPRITESHEET_BYTES) {
    throw new Error('The sprite sheet is too large. The maximum supported size is 32 MB.');
  }

  const manifestBlob = new Blob([JSON.stringify(manifest, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  const manifestUrl = URL.createObjectURL(manifestBlob);
  const spritesheetUrl = URL.createObjectURL(spritesheetFile);
  const objectUrls = [manifestUrl, spritesheetUrl] as const;
  const descriptor: PetPackageDescriptor = {
    source: 'local',
    manifest,
    manifestUrl,
    spritesheetUrl,
    spritesheetFileName: spritesheetFile.name,
  };

  try {
    return await loadDescriptor(descriptor, signal, objectUrls);
  } catch (error) {
    revokeObjectUrls(objectUrls);
    throw error;
  }
}
