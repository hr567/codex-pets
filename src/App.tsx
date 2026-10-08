import { useEffect } from 'react';
import { LinkButton } from '@cloudflare/kumo/components/button';
import { LayerCard } from '@cloudflare/kumo/components/layer-card';
import { Link } from '@cloudflare/kumo/components/link';
import { Select } from '@cloudflare/kumo/components/select';
import { Text } from '@cloudflare/kumo/components/text';

import { PetPackagePicker } from './components/PetPackagePicker';
import { PetStage } from './components/PetStage';
import { usePetPackage } from './hooks/usePetPackage';
import { useStoredPreference } from './hooks/useStoredPreference';
import { FRAME_HEIGHT, FRAME_WIDTH, getExpectedAtlas } from './lib/sprite';
import {
  PLAYBACK_SPEEDS, PLAYBACK_SPEED_PREFERENCE, RENDERING_MODE_PREFERENCE,
  SCALES, SCALE_PREFERENCE, THEME_PREFERENCE,
  isPlaybackSpeed, isRenderingMode, isScale, isThemeMode,
} from './lib/preferences';
import { DEFAULT_REPOSITORY_PET, REPOSITORY_PET_PACKAGES } from './lib/repositoryPets';

export function App() {
  const [theme, setTheme] = useStoredPreference(THEME_PREFERENCE);
  const [speed, setSpeed] = useStoredPreference(PLAYBACK_SPEED_PREFERENCE);
  const [scale, setScale] = useStoredPreference(SCALE_PREFERENCE);
  const [rendering, setRendering] = useStoredPreference(RENDERING_MODE_PREFERENCE);
  const { state: { preview, upload }, selectFiles, selectRepositoryPet } =
    usePetPackage(DEFAULT_REPOSITORY_PET.descriptor);
  const petPackage = preview.petPackage;
  const { manifest } = petPackage;
  const atlas = getExpectedAtlas(manifest.spriteVersionNumber);
  const isBusy = preview.status === 'loading' || upload.status === 'validating';

  useEffect(() => {
    document.title = `${manifest.displayName} · Codex Pet Preview`;
  }, [manifest.displayName]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const updateTheme = () => {
      document.documentElement.dataset.mode = theme === 'system'
        ? (media.matches ? 'dark' : 'light') : theme;
    };
    updateTheme();
    media.addEventListener('change', updateTheme);
    return () => { media.removeEventListener('change', updateTheme); };
  }, [theme]);

  return (
    <div className="isolate min-h-dvh bg-kumo-base text-kumo-default">
      <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <Text as="h1" variant="heading" size="lg">Codex Pet Preview</Text>
            <Text as="p" variant="secondary">Preview every animation in your pet package.</Text>
          </div>
          <Select
            aria-label="Theme"
            value={theme}
            items={{ system: 'System theme', light: 'Light theme', dark: 'Dark theme' }}
            onValueChange={(value) => { if (isThemeMode(value)) setTheme(value); }}
          />
        </header>

        <main className="grid items-start gap-6 lg:grid-cols-3">
          <div className="min-w-0 lg:col-span-2">
            <PetStage preview={preview} playbackSpeed={speed} scale={scale} renderingMode={rendering} />
          </div>
          <aside className="min-w-0 space-y-6" aria-label="Preview controls">
            <LayerCard className="space-y-4 p-4">
              <Text as="h2" variant="heading">Pet package</Text>
              <PetPackagePicker
                petPackage={petPackage}
                error={upload.status === 'error' ? upload.message : ''}
                isBusy={isBusy}
                repositoryPets={REPOSITORY_PET_PACKAGES}
                onFilesSelected={selectFiles}
                onRepositoryPetSelect={selectRepositoryPet}
              />
            </LayerCard>

            <LayerCard className="space-y-4 p-4">
              <Text as="h2" variant="heading">Playback settings</Text>
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Playback speed"
                  value={speed}
                  items={PLAYBACK_SPEEDS.map((value) => ({ value, label: `${String(value)}×` }))}
                  onValueChange={(value) => { if (isPlaybackSpeed(value)) setSpeed(value); }}
                />
                <Select
                  label="Scale"
                  value={scale}
                  items={SCALES.map((value) => ({ value, label: `${String(value)}×` }))}
                  onValueChange={(value) => { if (isScale(value)) setScale(value); }}
                />
              </div>
              <Select
                label="Rendering"
                value={rendering}
                items={{ crisp: 'Crisp', smooth: 'Smooth' }}
                onValueChange={(value) => { if (isRenderingMode(value)) setRendering(value); }}
              />
            </LayerCard>

            <LayerCard className="space-y-4 p-4">
              <Text as="h2" variant="heading">Package details</Text>
              <dl className="grid grid-cols-2 gap-2">
                {[
                  ['Pet ID', manifest.id],
                  ['Frame size', `${String(FRAME_WIDTH)} × ${String(FRAME_HEIGHT)}`],
                  ['Atlas size', `${String(atlas.width)} × ${String(atlas.height)}`],
                  ['Grid', `${String(atlas.columns)} × ${String(atlas.rows)}`],
                  ['Version', `v${String(manifest.spriteVersionNumber)}`],
                ].map(([label, value]) => (
                  <div key={label} className="contents">
                    <Text as="dt" variant="secondary">{label}</Text>
                    <Text as="dd">{value}</Text>
                  </div>
                ))}
              </dl>
              <div className="flex flex-wrap items-center gap-4">
                <LinkButton href={petPackage.spritesheetUrl} download={petPackage.spritesheetFileName}>
                  Download spritesheet
                </LinkButton>
                <Link href={petPackage.manifestUrl} target="_blank" rel="noopener noreferrer">pet.json</Link>
              </div>
            </LayerCard>
          </aside>
        </main>
      </div>
    </div>
  );
}
