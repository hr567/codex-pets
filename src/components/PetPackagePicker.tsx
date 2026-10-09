import { useRef } from 'react';
import type { ChangeEvent } from 'react';
import { Banner } from '@cloudflare/kumo/components/banner';
import { Button } from '@cloudflare/kumo/components/button';
import { Select } from '@cloudflare/kumo/components/select';
import { Text } from '@cloudflare/kumo/components/text';

import type { BundledPetPackageDescriptor, PetPackageDescriptor } from '../lib/packageLoader';
import type { RepositoryPetPackage } from '../lib/repositoryPets';

interface PetPackagePickerProps {
  readonly petPackage: PetPackageDescriptor;
  readonly error: string;
  readonly isBusy: boolean;
  readonly repositoryPets: readonly RepositoryPetPackage[];
  readonly onFilesSelected: (files: readonly File[]) => Promise<void>;
  readonly onRepositoryPetSelect: (petPackage: BundledPetPackageDescriptor) => void;
}

export function PetPackagePicker({
  petPackage, error, isBusy, repositoryPets, onFilesSelected, onRepositoryPetSelect,
}: PetPackagePickerProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const folderInput = useRef<HTMLInputElement>(null);
  const selectedKey = petPackage.source === 'bundled'
    ? repositoryPets.find(({ descriptor }) => descriptor.manifestUrl === petPackage.manifestUrl)?.key ?? null
    : null;
  const submitFiles = (files: FileList | null) => {
    if (!isBusy && files?.length) void onFilesSelected(Array.from(files));
  };
  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    submitFiles(event.currentTarget.files);
    event.currentTarget.value = '';
  };

  return (
    <div
      className="space-y-4"
      onDragOver={(event) => { event.preventDefault(); }}
      onDrop={(event) => {
        event.preventDefault();
        submitFiles(event.dataTransfer.files);
      }}
      aria-busy={isBusy}
      data-testid="pet-package-drop-zone"
    >
      <Select
        label="Repository pet"
        value={selectedKey}
        placeholder="Local package"
        items={Object.fromEntries(repositoryPets.map(({ key, descriptor }) => [key, descriptor.manifest.displayName]))}
        onValueChange={(key) => {
          const pet = repositoryPets.find((candidate) => candidate.key === key);
          if (pet) onRepositoryPetSelect(pet.descriptor);
        }}
        disabled={isBusy}
      />
      <Text as="p" variant="secondary">
        {petPackage.manifest.description || petPackage.manifest.displayName}
      </Text>
      <div className="flex flex-wrap gap-2">
        <Button
          aria-label="Open pet.json and sprite sheet"
          onClick={() => fileInput.current?.click()}
          disabled={isBusy}
        >Open files</Button>
        <Button
          aria-label="Choose a Codex Pet folder"
          onClick={() => folderInput.current?.click()}
          disabled={isBusy}
        >Choose folder</Button>
      </div>
      <Text as="p" size="sm" variant="secondary">
        Select or drop pet.json and its sprite sheet here. Files stay in this browser.
      </Text>
      {isBusy ? <Text role="status">Loading package…</Text> : null}
      {error ? <Banner variant="error" title="Could not open package" description={error} /> : null}
      <input
        ref={fileInput} type="file" multiple hidden
        accept=".json,.png,.webp,application/json,image/png,image/webp"
        onChange={handleInput} data-testid="pet-files-input"
      />
      <input
        ref={folderInput} type="file" multiple hidden
        {...{ webkitdirectory: '', directory: '' }}
        onChange={handleInput} data-testid="pet-folder-input"
      />
    </div>
  );
}
