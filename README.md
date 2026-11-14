# Bloxwap Human Interface Guidelines

HIG **0.4.0** (`@bloxwap/hig`): a mobile-first, Bloxwap-owned contract for product, Pro, marketing and SDK docs. It ships as one npm package, with a subpath export for each surface (`@bloxwap/hig/tokens`, `@bloxwap/hig/react/button`, `@bloxwap/hig/native/provider`, `@bloxwap/hig/chart` and so on). Product acceptance and physical-device limitations remain documented in the release gates.

The current GitHub release is [v0.4.0](https://github.com/bloxwap/hig/releases/tag/v0.4.0). npm `latest` is still **0.2.0**: 0.3.0 and 0.4.0 are tagged here and have not been published. Published docs: [bloxwap.github.io/hig](https://bloxwap.github.io/hig/).

## Install

`npm install @bloxwap/hig` resolves to 0.2.0 until 0.4.0 is published. The same command installs the current release after that publish. Pin `@bloxwap/hig@0.4.0` only once that version is on npm.

`@bloxwap/chart` is the one required peer (`^0.3.0 || ^0.4.0` in this release; `^0.3.0` on the published 0.2.0). Every renderer, device, and overlay peer is optional. Install a peer only for the entry you import. The [installation guide](docs/installation.md) and the [package README](packages/hig/README.md) list the entries and peers.

```sh
npm install @bloxwap/hig @bloxwap/chart
```

## Use

Import only the entries you use. Nothing loads from a root barrel.

```tsx
import '@bloxwap/hig/tokens/css';
import '@bloxwap/hig/react/css';
import {HIGProvider} from '@bloxwap/hig/react/provider';
import {Button} from '@bloxwap/hig/react/button';

export function Save() {
  return (
    <HIGProvider>
      <Button onClick={() => console.log('Saved')}>Save</Button>
    </HIGProvider>
  );
}
```

| Entry | Use |
| --- | --- |
| `@bloxwap/hig/tokens`, `@bloxwap/hig/tokens/css` | Semantic tokens and the role CSS |
| `@bloxwap/hig/contracts` | Platform-neutral types, formatting, and messages |
| `@bloxwap/hig/react/<component>`, `@bloxwap/hig/react/css` | Web components and their scoped CSS |
| `@bloxwap/hig/native/<component>` | React Native components |
| `@bloxwap/hig/chart` | `PriceChart` and `chartTheme` for `@bloxwap/chart` |
| `@bloxwap/hig/feedback` | Optional sound and haptic feedback |
| `@bloxwap/hig/native-fonts` | Static TTFs for React Native and Expo |
| `@bloxwap/hig/og-fonts` | Satori and `next/og` faces |

`HIGProvider` accepts an opaque sRGB `primaryColor` (`#RGB` or `#RRGGBB`). Omit it to keep Bloxwap green. `density`, `locale`, and `direction` are set on the same provider.

## Local documentation

Install the workspace with `npm ci`, then run `bun docs:dev` (or `npm run docs:dev`).
Turbo prepares the packages and generated guides, then opens the docs task in its
terminal UI at [localhost:3905](http://localhost:3905). Press `Ctrl+C` to stop;
use `bun docs:dev --ui=stream` for plain logs. `bun docs:check`, `bun docs:build`,
and `bun docs:preview` provide the matching docs commands. The static build and
preview retain `/hig`; `NEXT_PUBLIC_BASE_PATH` overrides either mode explicitly.

The [published documentation](https://bloxwap.github.io/hig/) updates automatically
after pushes to `main`. The Documentation workflow builds and checks the static
site, then deploys it to GitHub Pages. Pull requests build without deploying.

## Validation

```sh
npm ci
npm run check
python3 -m pip install "fonttools[woff]==4.61.1" "brotli==1.2.1"
npm run generate:fonts
npm run smoke:ssr
npm run bundle -w hig-native-fixture
npm run bundle:web -w hig-native-fixture
npm run dev
npm run start -w hig-native-fixture
```

Start with [principles](docs/foundations/principles.md), [architecture](docs/architecture/001-packages.md), [foundation rules](docs/foundations/platform.md), and [evidence](evidence/upstream-inventory.json). Cite a commit permalink plus the HIG version and chapter anchor; branch links are preview links, never immutable citations.

## Compiler (tsrs)

Type checking (`typecheck`, `docs:check`, `examples:check`), the package build (`scripts/build.mjs`) and the docs build use [`tsrs`](https://github.com/oxc-project/tsrs) `0.18.0-ts7.1.0-dev.20260929`, a Rust port of the TypeScript 7 compiler. Its `.js`/`.d.ts` output is byte-identical to `tsc` 7.0.2. The docs app runs `next typegen && tsrs --noEmit` before `next build` and sets `typescript.ignoreBuildErrors`, so tsrs is the only type gate and type errors (including route-handler types from `.next/types/validator.ts`) still fail the build.

tsrs ships binaries for macOS on Apple silicon and Linux (x64/arm64) only. On Windows or an Intel Mac, use the TypeScript 7 fallbacks (`scripts/build.mjs`, `scripts/build-docs.mjs` and `examples:check` also pick them automatically on those platforms):

```sh
npm run build:tsc       # package + docs build with tsc 7.0.2
npm run typecheck:tsc   # root and docs type check with tsc 7.0.2
npm run docs:check:tsc  # docs prepare + type check with tsc 7.0.2
```

The root `typescript` package stays on 6.0.3 for the scripts that use its JS API; TypeScript 7 is installed as the `typescript-7` alias for the fallbacks, and the docs app keeps `typescript` because `next typegen` requires it.

HIG aliases come from `packages/hig/tokens/source.json`; authored source palette and provenance are pinned in `packages/hig/tokens/upstream-palette.json`. Never edit generated files. Run `npm run generate` and commit the source and outputs together. Publication uses the maintainer-approved workflow and the dated release gates in `planning/release-blockers.json`. Current implementation and remaining owner/device/upstream tasks are tracked in [roadmap follow-ups](planning/roadmap-followups.md). Native font generation is documented in [source reconciliation](docs/foundations/source-reconciliation.md).
