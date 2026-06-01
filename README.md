# Codex Pets

This repository contains four Codex Pet packages and a browser-only previewer built
with TypeScript, React, [Astryx](https://astryx.atmeta.com/), and
[StyleX](https://stylexjs.com/). Open the published preview at
<https://hr567.github.io/codex-pets/>.

The preview starts with Renne and lets you switch among every Pet stored in this
repository:

| Package directory | Preview label | Manifest ID |
| --- | --- | --- |
| `renne/` | Renne | `renne` |
| `blackmi/` | 黑米 | `blackmi` |
| `miaomiao/` | 淼淼 | `miaomiao` |
| `mango/` | 芒狗 | `mangguo` |

The directory key and manifest ID are intentionally separate, so the `mango/`
package keeps its existing `mangguo` identity.

## Run the preview

```powershell
npm ci
npm run dev -- --host 127.0.0.1
```

Create and inspect the production build with:

```powershell
npm run check
npm run build
npm run preview -- --host 127.0.0.1
```

`npm run check` runs the project-reference TypeScript build, type-aware ESLint,
and the Vitest suite.

GitHub Pages CI and deployment are defined in `.github/workflows/pages.yml`. Pull
requests targeting `main` run the full quality gate and production build; pushes
to `main` additionally deploy the verified artifact. In **Settings → Pages**, set
**Source** to **GitHub Actions** once for the repository.

## Preview repository and local Pets

Use the Pet selector to switch among Renne, 黑米, 淼淼, and 芒狗. Refreshes always
return to Renne; the selection is not stored in local storage or the URL.

Use **Open files** to select `pet.json` and the sprite sheet it references in one
file dialog, use **Choose folder** to select a complete Pet directory, or drag and
drop a package onto the picker. Uploaded files stay in the current browser tab and
are never sent to a server. After previewing a local package, choose any repository
Pet to switch back.

The preview validates packages, supports system/light/dark themes, provides
keyboard-friendly animation selection and adjustable playback, and automatically
starts playback after every successful load.

Supported contracts:

- v1 or a missing `spriteVersionNumber`: 1536 × 1872, 8 × 9 grid.
- v2 with `spriteVersionNumber: 2`: 1536 × 2288, 8 × 11 grid.

Every included package uses the v2 contract: an `8 × 11` transparent WebP atlas
with `192 × 208` cells, for a final size of `1536 × 2288`.

## Repository layout

- `renne/`, `blackmi/`, `miaomiao/`, and `mango/` each contain only `pet.json` and
  `spritesheet.webp` for that Pet.
- `src/` contains the generic React preview, package loader, repository Pet
  registry, Astryx integration, and StyleX styles.
- `tests/` covers manifest and atlas validation, state transitions, cancellation,
  uploads, resource cleanup, and package switching.
- `.github/workflows/pages.yml` checks and publishes the preview from `main`.

## Included animation states

- idle
- running-right
- running-left
- waving
- jumping
- failed
- waiting
- running
- review
- 16 clockwise look directions from `000` through `337.5`

## Source architecture

- `src/domain/pet/` is the browser-independent pet domain: sanitized manifests,
  sprite format contracts, animation layouts, frame coordinates, and atlas rules.
- `src/adapters/browser/` owns browser APIs such as image decoding, object URLs,
  canvas drawing, and downloads.
- `src/features/pet-package/` owns the package-loading state machine, cancellation,
  and resource lifecycle.
- `src/features/preview/` owns animation playback state and timing.
- `src/app/` is the composition root, repository Pet registry, application
  preferences, and document metadata.
- `src/components/` contains presentation components; Inspector subsections are
  split by responsibility.
- `tests/` covers domain validation, state reducers, storage fallback, upload URL
  cleanup, cancellation, and package replacement/unmount behavior.

Browser, Node configuration, and tests use separate TypeScript projects:
`tsconfig.app.json`, `tsconfig.node.json`, and `tsconfig.test.json`.
