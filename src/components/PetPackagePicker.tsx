import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, DragEvent, RefObject } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Button } from '@astryxdesign/core/Button';
import { Icon } from '@astryxdesign/core/Icon';
import { Selector } from '@astryxdesign/core/Selector';
import { FolderOpen, Upload } from 'lucide-react';

import { drawSpriteFrame } from '../adapters/browser/canvasRenderer';
import type {
  BundledPetPackageDescriptor,
  PetPackageDescriptor,
  PetPackageSource,
} from '../adapters/browser/petPackageLoader';
import type { RepositoryPetPackage } from '../app/repositoryPetPackages';
import { FRAME_HEIGHT, FRAME_WIDTH } from '../domain/pet/spriteFormat';

const SOURCE_LABELS = {
  bundled: 'Repository pet',
  local: 'Local package',
} satisfies Record<PetPackageSource, string>;

const DIRECTORY_INPUT_PROPS = {
  webkitdirectory: '',
  directory: '',
} as const;

const styles = stylex.create({
  dropZone: {
    display: 'grid',
    gridTemplateColumns: '64px minmax(0, 1fr)',
    gap: 16,
    padding: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: {
      default: 'var(--color-border-emphasized)',
      ':hover': 'var(--color-accent)',
    },
    borderRadius: 'var(--radius-element)',
    backgroundColor: 'var(--color-background-muted)',
    transitionProperty: 'border-color, background-color',
    transitionDuration: 'var(--duration-fast)',
  },
  dropZoneActive: {
    borderColor: 'var(--color-accent)',
    backgroundColor: 'var(--color-accent-muted)',
  },
  repositoryPicker: {
    gridColumn: '1 / -1',
    marginBottom: 2,
  },
  thumbnail: {
    width: 64,
    height: 70,
    display: 'grid',
    placeItems: 'center',
    overflow: 'hidden',
    borderRadius: 10,
    backgroundColor: 'var(--pet-preview-checker-b)',
    backgroundImage: 'linear-gradient(45deg, var(--pet-preview-checker-a) 25%, transparent 25%), linear-gradient(-45deg, var(--pet-preview-checker-a) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, var(--pet-preview-checker-a) 75%), linear-gradient(-45deg, transparent 75%, var(--pet-preview-checker-a) 75%)',
    backgroundPosition: '0 0, 0 6px, 6px -6px, -6px 0',
    backgroundSize: '12px 12px',
  },
  thumbnailCanvas: {
    width: 58,
    height: 'auto',
    display: 'block',
    imageRendering: 'pixelated',
  },
  details: {
    minWidth: 0,
  },
  identity: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  petName: {
    margin: 0,
    color: 'var(--color-text-primary)',
    fontSize: 18,
    fontWeight: 720,
    lineHeight: 1.2,
  },
  source: {
    paddingBlock: 4,
    paddingInline: 8,
    borderRadius: 999,
    color: 'var(--color-text-accent)',
    fontSize: 12,
    fontWeight: 650,
    lineHeight: 1.2,
    backgroundColor: 'var(--color-accent-muted)',
  },
  description: {
    marginBlock: 7,
    color: 'var(--color-text-secondary)',
    fontSize: 13,
    lineHeight: 1.45,
    display: '-webkit-box',
    overflow: 'hidden',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: 2,
  },
  actions: {
    display: 'grid',
    gridTemplateColumns: {
      default: 'repeat(2, minmax(0, 1fr))',
      '@media (max-width: 420px)': '1fr',
    },
    gap: 10,
    marginTop: 12,
  },
  action: {
    width: '100%',
    minHeight: 44,
  },
  openFilesAction: {
    color: 'var(--color-text-accent)',
    backgroundColor: {
      default: 'var(--color-accent-muted)',
      ':hover': 'var(--color-accent-muted)',
    },
    boxShadow: 'inset 0 0 0 1px var(--color-accent)',
  },
  helper: {
    gridColumn: '1 / -1',
    margin: 0,
    color: 'var(--color-text-secondary)',
    fontSize: 12,
    lineHeight: 1.5,
  },
  error: {
    gridColumn: '1 / -1',
    margin: 0,
    padding: 10,
    borderRadius: 8,
    color: 'var(--color-text-primary)',
    fontSize: 12,
    lineHeight: 1.45,
    backgroundColor: 'light-dark(#fff0ef, #371d20)',
  },
});

interface PetThumbnailProps {
  image: HTMLImageElement | null;
  name: string;
}

function PetThumbnail({ image, name }: PetThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawSpriteFrame(canvas, image);
  }, [image]);

  return (
    <div {...stylex.props(styles.thumbnail)}>
      <canvas
        ref={canvasRef}
        width={FRAME_WIDTH}
        height={FRAME_HEIGHT}
        {...stylex.props(styles.thumbnailCanvas)}
        role={image ? 'img' : undefined}
        aria-label={image ? `${name} package thumbnail` : undefined}
        aria-hidden={image ? undefined : true}
      />
    </div>
  );
}

export interface PetPackagePickerProps {
  readonly petPackage: PetPackageDescriptor;
  readonly image: HTMLImageElement | null;
  readonly error: string;
  readonly isBusy: boolean;
  readonly repositoryPets: readonly RepositoryPetPackage[];
  readonly onFilesSelected: (files: readonly File[]) => Promise<void>;
  readonly onRepositoryPetSelect: (
    petPackage: BundledPetPackageDescriptor,
  ) => void;
}

export function PetPackagePicker({
  petPackage,
  image,
  error,
  isBusy,
  repositoryPets,
  onFilesSelected,
  onRepositoryPetSelect,
}: PetPackagePickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const openPicker = (ref: RefObject<HTMLInputElement | null>) => {
    if (!ref.current) return;
    ref.current.value = '';
    ref.current.click();
  };

  const submitFiles = (files: FileList | readonly File[]) => {
    const selectedFiles = Array.from(files);
    if (selectedFiles.length > 0) void onFilesSelected(selectedFiles);
  };

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    submitFiles(event.currentTarget.files ?? []);
    event.currentTarget.value = '';
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (isBusy) return;
    submitFiles(event.dataTransfer.files);
  };

  const description = petPackage.manifest.description
    || `${petPackage.manifest.displayName} is ready to preview.`;
  const repositoryPetOptions = repositoryPets.map(({ descriptor, key }) => ({
    label: descriptor.manifest.displayName,
    value: key,
  }));
  const selectedRepositoryPetKey = petPackage.source === 'bundled'
    ? repositoryPets.find(({ descriptor }) => (
        descriptor.manifestUrl === petPackage.manifestUrl
      ))?.key ?? null
    : null;

  return (
    <div
      {...stylex.props(styles.dropZone, isDragging && styles.dropZoneActive)}
      onDragEnter={(event) => {
        event.preventDefault();
        if (!isBusy) setIsDragging(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
      }}
      onDragLeave={(event) => {
        if (!(event.relatedTarget instanceof Node) || !event.currentTarget.contains(event.relatedTarget)) {
          setIsDragging(false);
        }
      }}
      onDrop={handleDrop}
      aria-busy={isBusy}
      data-testid="pet-package-drop-zone"
    >
      <div {...stylex.props(styles.repositoryPicker)}>
        <Selector
          label="Repository pet"
          options={repositoryPetOptions}
          {...(selectedRepositoryPetKey === null
            ? {}
            : { value: selectedRepositoryPetKey })}
          placeholder="Local package"
          onChange={(key) => {
            const repositoryPet = repositoryPets.find((candidate) => (
              candidate.key === key
            ));
            if (repositoryPet) onRepositoryPetSelect(repositoryPet.descriptor);
          }}
          isDisabled={isBusy}
          width="100%"
          data-testid="repository-pet-selector"
        />
      </div>

      <PetThumbnail image={image} name={petPackage.manifest.displayName} />
      <div {...stylex.props(styles.details)}>
        <div {...stylex.props(styles.identity)}>
          <h3 {...stylex.props(styles.petName)}>{petPackage.manifest.displayName}</h3>
          <span {...stylex.props(styles.source)}>{SOURCE_LABELS[petPackage.source]}</span>
        </div>
        <p {...stylex.props(styles.description)}>{description}</p>
        <div {...stylex.props(styles.actions)}>
          <Button
            label="Open pet.json and sprite sheet"
            variant="secondary"
            size="lg"
            icon={<Icon icon={Upload} size="md" />}
            onClick={() => {
              openPicker(fileInputRef);
            }}
            xstyle={[styles.action, styles.openFilesAction]}
            isDisabled={isBusy}
          >
            {isBusy ? 'Validating…' : 'Open files'}
          </Button>
          <Button
            label="Choose a Codex Pet folder"
            variant="secondary"
            size="lg"
            icon={<Icon icon={FolderOpen} size="md" />}
            onClick={() => {
              openPicker(folderInputRef);
            }}
            xstyle={styles.action}
            isDisabled={isBusy}
          >
            Choose folder
          </Button>
        </div>
      </div>

      <p {...stylex.props(styles.helper)}>
        Select pet.json and its sprite sheet. Files stay in this browser.
      </p>
      {error ? <p {...stylex.props(styles.error)} role="alert">{error}</p> : null}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".json,.png,.webp,application/json,image/png,image/webp"
        onChange={handleInput}
        hidden
        tabIndex={-1}
        data-testid="pet-files-input"
      />
      <input
        ref={folderInputRef}
        type="file"
        multiple
        {...DIRECTORY_INPUT_PROPS}
        onChange={handleInput}
        hidden
        tabIndex={-1}
        data-testid="pet-folder-input"
      />
    </div>
  );
}
