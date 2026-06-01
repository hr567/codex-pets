import * as stylex from '@stylexjs/stylex';
import { Theme } from '@astryxdesign/core/theme';
import { neutralTheme } from '@astryxdesign/theme-neutral/built';

import { AppHeader } from '../components/AppHeader';
import type { PreviewStatus } from '../components/AppHeader';
import { Inspector } from '../components/Inspector';
import { PetStage } from '../components/PetStage';
import type { PetStageAsset } from '../components/PetStage';
import type { PetPackageState } from '../features/pet-package/petPackageState';
import { usePetPackageController } from '../features/pet-package/usePetPackageController';
import { useAnimationPlayback } from '../features/preview/useAnimationPlayback';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useStoredPreference } from '../hooks/useStoredPreference';
import {
  PLAYBACK_SPEED_PREFERENCE,
  RENDERING_MODE_PREFERENCE,
  SCALE_PREFERENCE,
  THEME_PREFERENCE,
} from './preferences';
import {
  DEFAULT_REPOSITORY_PET,
  REPOSITORY_PET_PACKAGES,
} from './repositoryPetPackages';
import { useDocumentMetadata } from './useDocumentMetadata';

const styles = stylex.create({
  app: {
    minHeight: '100dvh',
    color: 'var(--color-text-primary)',
    backgroundColor: 'var(--color-background-body)',
  },
  workspace: {
    display: 'grid',
    gridTemplateColumns: {
      default: 'minmax(0, 1fr) clamp(440px, 40vw, 590px)',
      '@media (max-width: 960px)': '1fr',
    },
    minHeight: 'calc(100dvh - 72px)',
  },
});

function getPreviewStatus(state: PetPackageState): PreviewStatus {
  if (state.upload.status === 'validating') {
    return { label: 'Validating package', variant: 'accent' };
  }

  if (state.preview.status === 'ready') {
    return {
      label: state.preview.petPackage.manifest.displayName + ' ready',
      variant: 'success',
    };
  }

  if (state.preview.status === 'error') {
    return { label: 'Preview unavailable', variant: 'error' };
  }

  return {
    label: 'Loading ' + state.preview.petPackage.manifest.displayName,
    variant: 'accent',
  };
}

export function App() {
  const systemIsDark = useMediaQuery('(prefers-color-scheme: dark)');
  const [themeMode, setThemeMode] = useStoredPreference(THEME_PREFERENCE);
  const [playbackSpeed, setPlaybackSpeed] = useStoredPreference(
    PLAYBACK_SPEED_PREFERENCE,
  );
  const [scale, setScale] = useStoredPreference(SCALE_PREFERENCE);
  const [renderingMode, setRenderingMode] = useStoredPreference(
    RENDERING_MODE_PREFERENCE,
  );
  const petPackageController = usePetPackageController(
    DEFAULT_REPOSITORY_PET.descriptor,
  );
  const { preview, upload } = petPackageController.state;
  const petPackage = preview.petPackage;
  const playback = useAnimationPlayback({
    version: petPackage.manifest.spriteVersionNumber,
    playbackSpeed,
    isAssetReady: preview.status === 'ready',
    resetKey: petPackage.manifestUrl,
  });

  useDocumentMetadata({
    petName: petPackage.manifest.displayName,
    themeMode,
    systemIsDark,
  });

  const stageAsset: PetStageAsset = preview.status === 'ready'
    ? { assetStatus: 'ready', image: preview.petPackage.image }
    : preview.status === 'error'
      ? { assetStatus: 'error', errorMessage: preview.message }
      : { assetStatus: 'loading' };
  const image = preview.status === 'ready' ? preview.petPackage.image : null;
  const packageError = upload.status === 'error' ? upload.message : '';
  const isPackageBusy = upload.status === 'validating' || preview.status === 'loading';
  const status = getPreviewStatus(petPackageController.state);

  return (
    <Theme theme={neutralTheme} mode={themeMode}>
      <div {...stylex.props(styles.app)} data-theme={themeMode}>
        <AppHeader
          status={status}
          themeMode={themeMode}
          onThemeChange={setThemeMode}
        />

        <main {...stylex.props(styles.workspace)}>
          <PetStage
            {...stageAsset}
            petName={petPackage.manifest.displayName}
            activeState={playback.activeState}
            activeFrame={playback.activeFrame}
            scale={scale}
            playbackSpeed={playbackSpeed}
            renderingMode={renderingMode}
            isPlaying={playback.isPlaying}
            onTogglePlaying={playback.togglePlaying}
          />
          <Inspector
            packageModel={{
              petPackage,
              image,
              error: packageError,
              isBusy: isPackageBusy,
              repositoryPets: REPOSITORY_PET_PACKAGES,
              onFilesSelected: petPackageController.selectFiles,
              onRepositoryPetSelect: petPackageController.selectRepositoryPet,
            }}
            animationModel={{
              animationStates: playback.animationStates,
              activeStateId: playback.activeState.id,
              onStateChange: playback.selectState,
            }}
            playbackModel={{
              playbackSpeed,
              onPlaybackSpeedChange: setPlaybackSpeed,
              scale,
              onScaleChange: setScale,
              renderingMode,
              onRenderingModeChange: setRenderingMode,
            }}
          />
        </main>
      </div>
    </Theme>
  );
}
