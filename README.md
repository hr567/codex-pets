# Codex Pets

This repository contains four Codex Pet packages and a browser-only previewer built
with TypeScript, React, and [Cloudflare Kumo](https://github.com/cloudflare/kumo).
Open the published preview at
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
keyboard-friendly animation selection and adjustable playback speed. Actions
always play automatically once the sprite sheet is ready, including after
switching actions or packages.

Supported contracts:

- v1 or a missing `spriteVersionNumber`: 1536 × 1872, 8 × 9 grid.
- v2 with `spriteVersionNumber: 2`: 1536 × 2288, 8 × 11 grid.

Every included package uses the v2 contract: an `8 × 11` transparent WebP atlas
with `192 × 208` cells, for a final size of `1536 × 2288`.

## Repository layout

- `renne/`, `blackmi/`, `miaomiao/`, and `mango/` provide the `pet.json` and
  `spritesheet.webp` files used by the page. Existing `qa/` subdirectories retain
  historical text reports only.
- `src/` contains the React preview, package loader, repository Pet registry,
  and Kumo components. Kumo provides all component styles; Tailwind utilities
  arrange the page and preserve crisp canvas scaling. `src/index.css` contains the official library imports
  and source directive, with no custom CSS rules or theme overrides.
- `tests/` covers manifest and atlas validation, state transitions, cancellation,
  uploads, resource cleanup, and package switching.
- `output/pet-image-audit-20261008/`, when present locally, retains historical
  text reports, prompts, logs, and three QA helpers: `render_previews.py`,
  `encoding/audit_lossless.py`, and `encoding/refine_normalized.py`. These helpers
  are separate from the Vitest suite and require Pillow; the preview renderer
  also uses the bundled pet scripts. Run the lossless audit before the refinement
  helper to recreate its generated inputs.
- `.github/workflows/pages.yml` checks and publishes the preview from `main`.

Historical reports are preserved as written. Their references to comparison
images, GIFs, original-image backups, and intermediate candidates describe past
runs; those media files and one-off production scripts have been removed. The
current four sprite sheets remain the page's assets. npm and `package-lock.json`
are the supported install and CI path; local build output can be regenerated
with `npm run build`.

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

- `src/App.tsx` composes the page, settings, package details, and theme.
- `src/components/` contains only the package picker and animation stage.
- `src/hooks/` contains package loading, playback, and stored preferences.
  Loading and playback each keep their state in one hook, without separate
  reducers or controller layers. Animation ticks update only the stage.
- `src/lib/` contains manifest validation, sprite layouts and timing, canvas
  drawing, package loading, the repository Pet registry, and preference values.
- `tests/` mirrors these folders and covers validation, all animations, playback
  timing, storage fallback, uploads, cancellation, and resource cleanup.

Browser, Node configuration, and tests use separate TypeScript projects:
`tsconfig.app.json`, `tsconfig.node.json`, and `tsconfig.test.json`.
