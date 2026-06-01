import type {
  LoadedPetPackage,
  PetPackageDescriptor,
} from '../../adapters/browser/petPackageLoader';

export type PreviewState =
  | { readonly status: 'loading'; readonly petPackage: PetPackageDescriptor }
  | { readonly status: 'ready'; readonly petPackage: LoadedPetPackage }
  | {
      readonly status: 'error';
      readonly petPackage: PetPackageDescriptor;
      readonly message: string;
    };

export type UploadState =
  | { readonly status: 'idle' }
  | { readonly status: 'validating' }
  | { readonly status: 'error'; readonly message: string };

export interface PetPackageState {
  readonly preview: PreviewState;
  readonly upload: UploadState;
}

export type PetPackageAction =
  | { readonly type: 'preview-loading'; readonly petPackage: PetPackageDescriptor }
  | { readonly type: 'package-ready'; readonly petPackage: LoadedPetPackage }
  | {
      readonly type: 'preview-failed';
      readonly petPackage: PetPackageDescriptor;
      readonly message: string;
    }
  | { readonly type: 'upload-started' }
  | { readonly type: 'upload-failed'; readonly message: string };

export function createInitialPetPackageState(
  petPackage: PetPackageDescriptor,
): PetPackageState {
  return {
    preview: { status: 'loading', petPackage },
    upload: { status: 'idle' },
  };
}

export function petPackageReducer(
  state: PetPackageState,
  action: PetPackageAction,
): PetPackageState {
  switch (action.type) {
    case 'preview-loading':
      return {
        preview: { status: 'loading', petPackage: action.petPackage },
        upload: { status: 'idle' },
      };
    case 'package-ready':
      return {
        preview: { status: 'ready', petPackage: action.petPackage },
        upload: { status: 'idle' },
      };
    case 'preview-failed':
      return {
        preview: {
          status: 'error',
          petPackage: action.petPackage,
          message: action.message,
        },
        upload: { status: 'idle' },
      };
    case 'upload-started':
      return { ...state, upload: { status: 'validating' } };
    case 'upload-failed':
      return {
        preview: state.preview.status === 'loading'
          ? {
              status: 'error',
              petPackage: state.preview.petPackage,
              message: action.message,
            }
          : state.preview,
        upload: { status: 'error', message: action.message },
      };
  }
}
