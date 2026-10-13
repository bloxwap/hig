# Bloxwap Human Interface Guidelines

HIG **0.1.0 candidate**: a mobile-first, Bloxwap-owned contract for product, Pro, marketing and SDK docs. This is a review candidate, not a published or device-certified v1.

```sh
npm ci
npm run check
npm run smoke:ssr
npm run bundle -w hig-native-fixture
npm run dev
npm run start -w hig-native-fixture
```

Start with [principles](docs/foundations/principles.md), [architecture](docs/architecture/001-packages.md), [foundation rules](docs/foundations/platform.md), and [evidence](evidence/upstream-inventory.json). Cite a commit permalink plus the HIG version and chapter anchor; branch links are preview links, never immutable citations.

All generated values come from `packages/tokens/source.json`. Never edit generated files. Run `npm run generate` and commit the source and outputs together. Candidates remain blocked from publication until source audit and physical-device review are complete.
