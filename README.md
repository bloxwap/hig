# Bloxwap Human Interface Guidelines

HIG **0.1.0 candidate**: a mobile-first, Bloxwap-owned contract for product, Pro, marketing and SDK docs. This is a review candidate, not a published or device-certified v1.

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

## Candidate validation

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

The root `typescript` package stays on 6.0.3 for typescript-eslint and the scripts that use its JS API; TypeScript 7 is installed as the `typescript-7` alias for the fallbacks, and the docs app keeps `typescript` because `next typegen` requires it.

HIG aliases come from `packages/tokens/source.json`; authored source palette and provenance are pinned in `packages/tokens/upstream-palette.json`. Never edit generated files. Run `npm run generate` and commit the source and outputs together. Candidates remain blocked from publication until owning-product adoption, release authorization and physical-device review are complete. Current implementation and remaining owner/device/upstream tasks are tracked in [roadmap follow-ups](planning/roadmap-followups.md). Native font generation is documented in [source reconciliation](docs/foundations/source-reconciliation.md).
