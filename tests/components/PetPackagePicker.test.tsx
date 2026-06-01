// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@stylexjs/stylex', () => ({
  create: <T,>(styles: T) => styles,
  props: () => ({}),
}));

import {
  createBundledPetPackage,
} from '../../src/adapters/browser/petPackageLoader';
import type {
  BundledPetPackageDescriptor,
  PetPackageDescriptor,
} from '../../src/adapters/browser/petPackageLoader';
import type {
  RepositoryPetPackage,
} from '../../src/app/repositoryPetPackages';
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
      image={null}
      error=""
      isBusy={isBusy}
      repositoryPets={REPOSITORY_PETS}
      onFilesSelected={onFilesSelected}
      onRepositoryPetSelect={onRepositoryPetSelect}
    />,
  );
}

beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  HTMLElement.prototype.showPopover = vi.fn(function (this: HTMLElement) {
    this.setAttribute('popover-open', '');
  });
  HTMLElement.prototype.hidePopover = vi.fn(function (this: HTMLElement) {
    this.removeAttribute('popover-open');
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('PetPackagePicker', () => {
  it('shows all repository pets and selects a descriptor', () => {
    const onRepositoryPetSelect = vi.fn();
    renderPicker({ onRepositoryPetSelect });

    const selector = screen.getByRole('combobox', { name: 'Repository pet' });
    expect(selector.textContent).toContain('Renne');
    expect(screen.getByText('Repository pet', { selector: 'span' })).toBeTruthy();

    fireEvent.click(selector);
    const options = screen.getAllByRole('option', { hidden: true });
    expect(options.map((option) => option.textContent)).toEqual([
      'Renne',
      '黑米',
      '淼淼',
      '芒狗',
    ]);
    fireEvent.click(screen.getByRole('option', { name: '黑米', hidden: true }));

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
    expect(screen.getAllByText('Local package')).toHaveLength(2);
    expect(screen.queryByText('Use Renne example')).toBeNull();
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

  it('keeps file and folder selection available', () => {
    const onFilesSelected = vi.fn(() => Promise.resolve());
    renderPicker({ onFilesSelected });
    const manifest = new File(['{}'], 'pet.json', { type: 'application/json' });
    const spritesheet = new File(['image'], 'spritesheet.webp', {
      type: 'image/webp',
    });

    fireEvent.change(screen.getByTestId('pet-files-input'), {
      target: { files: [manifest, spritesheet] },
    });
    expect(onFilesSelected).toHaveBeenNthCalledWith(1, [manifest, spritesheet]);

    const folderInput = screen.getByTestId('pet-folder-input');
    expect(folderInput.hasAttribute('webkitdirectory')).toBe(true);
    expect(folderInput.hasAttribute('directory')).toBe(true);
    fireEvent.change(folderInput, { target: { files: [manifest, spritesheet] } });
    expect(onFilesSelected).toHaveBeenNthCalledWith(2, [manifest, spritesheet]);
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
