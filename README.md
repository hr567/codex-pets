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

Use Node.js 22 (22.22.2+), 24 (24.15.0+), or 26+, and pnpm 12.10.1 (recorded in
`package.json`'s `packageManager` and `engines.pnpm` fields).

```powershell
pnpm install --frozen-lockfile
pnpm run dev --host 127.0.0.1
```

Create and inspect the production build with:

```powershell
pnpm run check
pnpm run build
pnpm run preview --host 127.0.0.1
```

`pnpm run check` runs the project-reference TypeScript build and type-aware ESLint.

GitHub Pages CI and deployment are defined in `.github/workflows/pages.yml`. Pull
requests targeting `main` run the full quality gate and production build; pushes
to `main` additionally deploy the verified artifact. In **Settings → Pages**, set
**Source** to **GitHub Actions** once for the repository.

## Update dependencies

Run this locally to upgrade every direct dependency and development dependency
to its current stable `latest` release, including new major versions:

```powershell
pnpm update
pnpm run check
pnpm run build
pnpm audit
```

Dependencies track the registry's `latest` tags. pnpm preserves those declarations
and refreshes `pnpm-lock.yaml`, including transitive dependencies within their
parents' supported ranges. `minimumReleaseAge: 0` allows newly published releases
to be selected immediately. Review and commit the updated lockfile after the
checks pass; a new major release can require code changes. Ordinary installs and
CI use `pnpm install --frozen-lockfile` to reproduce the committed versions.

TypeScript uses Microsoft's [side-by-side configuration](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#running-side-by-side-with-typescript-6-0):
`@typescript/native` follows `typescript@latest` and supplies the TypeScript 7
`tsc` compiler, while `typescript` follows `@typescript/typescript6@latest` to
provide the compiler API required by type-aware ESLint. Both aliases update with
the same `pnpm update` command. The pnpm executable itself remains pinned by
`packageManager` and `engines.pnpm` and is updated separately.

`pmOnFail: ignore` keeps the lockfile in the single-document format supported by
GitHub's dependency graph while its [pnpm 12 parsing issue](https://github.com/dependabot/dependabot-core/issues/15904)
remains open. CI selects pnpm through `packageManager`, and `engines.pnpm` checks
the local executable version without adding a package-manager lockfile document.

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
  `spritesheet.webp` files used by the page.
- `src/` contains the React preview, package loader, repository Pet registry,
  and Kumo components. Kumo provides all component styles; Tailwind utilities
  arrange the page and preserve crisp canvas scaling. `src/index.css` contains the official library imports
  and source directive, with no custom CSS rules or theme overrides.
- `.github/workflows/pages.yml` checks and publishes the preview from `main`.

pnpm and `pnpm-lock.yaml` are the supported install and CI path. Local build
output can be regenerated with `pnpm run build`.

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

Browser code and Node configuration use separate TypeScript projects:
`tsconfig.app.json` and `tsconfig.node.json`.
