// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createBundledPetPackage,
} from '../../src/lib/packageLoader';
import type {
  BundledPetPackageDescriptor,
  PetPackageDescriptor,
} from '../../src/lib/packageLoader';
import type {
  RepositoryPetPackage,
} from '../../src/lib/repositoryPets';
import {
  PetPackagePicker,
} from '../../src/components/PetPackagePicker';

const REPOSITORY_PETS = [
  createRepositoryPet('renne', 'Renne'),
  createRepositoryPet('blackmi', '黑米'),
  createRepositoryPet('miaomiao', '淼淼'),
  createRepositoryPet('mango', '芒狗', 'mangguo'),
] as const satisfies readonly RepositoryPetPackage[];

function createRepositoryPet(
  key: RepositoryPetPackage['key'],
  displayName: string,
  id: string = key,
): RepositoryPetPackage {
  return {
    key,
    descriptor: createBundledPetPackage(
      {
        id,
        displayName,
        spriteVersionNumber: 2,
        spritesheetPath: 'spritesheet.webp',
      },
      `${key}/pet.json`,
      `${key}/spritesheet.webp`,
    ),
  };
}

function createLocalPackage(): PetPackageDescriptor {
  const bundled = createBundledPetPackage(
    {
      id: 'local-pet',
      displayName: 'My local pet',
      spriteVersionNumber: 2,
      spritesheetPath: 'spritesheet.webp',
    },
    'blob:manifest',
    'blob:spritesheet',
  );
  return { ...bundled, source: 'local' };
}

interface RenderPickerOptions {
  readonly petPackage?: PetPackageDescriptor;
  readonly isBusy?: boolean;
  readonly onFilesSelected?: (files: readonly File[]) => Promise<void>;
  readonly onRepositoryPetSelect?: (
    petPackage: BundledPetPackageDescriptor,
  ) => void;
}

function renderPicker({
  petPackage = REPOSITORY_PETS[0].descriptor,
  isBusy = false,
  onFilesSelected = vi.fn(() => Promise.resolve()),
  onRepositoryPetSelect = vi.fn(),
}: RenderPickerOptions = {}) {
  return render(
    <PetPackagePicker
      petPackage={petPackage}
      error=""
      isBusy={isBusy}
      repositoryPets={REPOSITORY_PETS}
      onFilesSelected={onFilesSelected}
      onRepositoryPetSelect={onRepositoryPetSelect}
    />,
  );
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('PetPackagePicker', () => {
  it('shows all repository pets and selects a descriptor', async () => {
    const onRepositoryPetSelect = vi.fn();
    renderPicker({ onRepositoryPetSelect });

    const selector = screen.getByRole('combobox', { name: 'Repository pet' });
    expect(selector.textContent).toContain('Renne');
    fireEvent.click(selector);
    const options = await screen.findAllByRole('option');
    expect(options.map((option) => option.textContent)).toEqual([
      'Renne',
      '黑米',
      '淼淼',
      '芒狗',
    ]);
    const selectedOption = screen.getByRole('option', { name: '黑米' });
    fireEvent.pointerDown(selectedOption, { pointerType: 'mouse', button: 0 });
    fireEvent.click(selectedOption);

    expect(onRepositoryPetSelect).toHaveBeenCalledTimes(1);
    expect(onRepositoryPetSelect).toHaveBeenCalledWith(
      REPOSITORY_PETS[1].descriptor,
    );
  });

  it('shows a local package as an unselected repository placeholder', () => {
    renderPicker({
      petPackage: createLocalPackage(),
    });

    const selector = screen.getByRole('combobox', { name: 'Repository pet' });
    expect(selector.textContent).toContain('Local package');
    expect(screen.getByText('My local pet')).toBeTruthy();
  });

  it('disables package controls and ignores drops while busy', () => {
    const onFilesSelected = vi.fn(() => Promise.resolve());
    renderPicker({ isBusy: true, onFilesSelected });

    const selector = screen.getByRole('combobox', { name: 'Repository pet' });
    expect(selector.hasAttribute('disabled')).toBe(true);
    expect(screen.getByRole('button', {
      name: 'Open pet.json and sprite sheet',
    })).toHaveProperty('disabled', true);
    expect(screen.getByRole('button', {
      name: 'Choose a Codex Pet folder',
    })).toHaveProperty('disabled', true);

    fireEvent.drop(screen.getByTestId('pet-package-drop-zone'), {
      dataTransfer: { files: [new File(['{}'], 'pet.json')] },
    });
    expect(onFilesSelected).not.toHaveBeenCalled();
  });

  it('opens file and folder inputs and permits selecting the same files again', () => {
    const onFilesSelected = vi.fn(() => Promise.resolve());
    renderPicker({ onFilesSelected });
    const manifest = new File(['{}'], 'pet.json', { type: 'application/json' });
    const spritesheet = new File(['image'], 'spritesheet.webp', {
      type: 'image/webp',
    });

    const filesInput = screen.getByTestId<HTMLInputElement>('pet-files-input');
    const resetFileSelection = vi.spyOn(filesInput, 'value', 'set');
    const openFileInput = vi.spyOn(filesInput, 'click');
    fireEvent.click(screen.getByRole('button', { name: 'Open pet.json and sprite sheet' }));
    expect(openFileInput).toHaveBeenCalledOnce();
    fireEvent.change(filesInput, {
      target: { files: [manifest, spritesheet] },
    });
    expect(onFilesSelected).toHaveBeenNthCalledWith(1, [manifest, spritesheet]);
    expect(resetFileSelection).toHaveBeenCalledWith('');
    fireEvent.change(filesInput, {
      target: { files: [manifest, spritesheet] },
    });
    expect(onFilesSelected).toHaveBeenNthCalledWith(2, [manifest, spritesheet]);
    expect(resetFileSelection).toHaveBeenCalledTimes(2);

    const folderInput = screen.getByTestId('pet-folder-input');
    const openFolderInput = vi.spyOn(folderInput, 'click');
    fireEvent.click(screen.getByRole('button', { name: 'Choose a Codex Pet folder' }));
    expect(openFolderInput).toHaveBeenCalledOnce();
    expect(folderInput.hasAttribute('webkitdirectory')).toBe(true);
    expect(folderInput.hasAttribute('directory')).toBe(true);
    fireEvent.change(folderInput, { target: { files: [manifest, spritesheet] } });
    expect(onFilesSelected).toHaveBeenNthCalledWith(3, [manifest, spritesheet]);
  });

  it('passes dropped files to the package loader', () => {
    const onFilesSelected = vi.fn(() => Promise.resolve());
    renderPicker({ onFilesSelected });
    const manifest = new File(['{}'], 'pet.json', { type: 'application/json' });
    const spritesheet = new File(['image'], 'spritesheet.webp', {
      type: 'image/webp',
    });

    fireEvent.drop(screen.getByTestId('pet-package-drop-zone'), {
      dataTransfer: { files: [manifest, spritesheet] },
    });

    expect(onFilesSelected).toHaveBeenCalledOnce();
    expect(onFilesSelected).toHaveBeenCalledWith([manifest, spritesheet]);
  });
});
