# Changelog

## Unreleased

- Accept `@bloxwap/chart` 0.4.0: the required peer is now `^0.3.0 || ^0.4.0`, and HIG develops, smoke-tests and documents against 0.4.0. Chart 0.4.0 only adds indicator APIs, so `PriceChart` and `chartTheme` are unchanged.
- Pin `@bloxwap/font` 0.1.4. Its web CSS now loads unicode-range subsets, so pages download only the scripts they render. The variable sources behind `@bloxwap/hig/native-fonts` and `@bloxwap/hig/og-fonts` are byte-identical to 0.1.2, so the generated TTFs and their SHA-256 hashes are unchanged; only the manifests' source version changes.
- The docs site now installs `@bloxwap/haptic` 0.3.0 and `@bloxwap/sfx` 0.2.1, inside HIG's supported peer ranges, instead of the older 0.1.0 builds.

## 0.2.0

- Publish HIG as one npm package, `@bloxwap/hig`, replacing the eight `@bloxwap/hig-*` packages. Each former package is now a subpath entry: `@bloxwap/hig-react/button` becomes `@bloxwap/hig/react/button`, `@bloxwap/hig-tokens/css` becomes `@bloxwap/hig/tokens/css`, and so on. Entry names and exports are unchanged.
- Every renderer, device and overlay peer is optional; `@bloxwap/chart` `^0.3.0` remains the one required peer (#96).
- The release dry run, verifier and publish workflow handle exactly one tarball. Font-binary, OG-font budget and chart-boundary gates now check paths inside it.
- The `@bloxwap/hig-*` 0.1 packages are deprecated on npm and point to `@bloxwap/hig`.

## 0.1.1

- Update the supported Node toolchain and locked dependencies, including PostCSS and Brotli security fixes.
- Keep release artifacts, generated documentation and consumer smoke checks aligned with the coordinated package version.
- Isolate preview server ports and stop browser checks when their own server exits, fixing collisions between concurrent CI jobs.
- Run WebKit keyboard checks with process-scoped macOS keyboard navigation, preserving the same strict focus and visual assertions across runner preferences.
- Refresh adoption records for merged consumer migrations and the first successful npm publication.
- Preserve the existing pre-1.0 owner exceptions for product acceptance and physical-device observations.

## 0.1.0

- Initial coordinated release of contracts, tokens, native fonts, OG fonts, feedback, React, chart and React Native packages.
- Configure a brand accent with `HIGProvider primaryColor` on web and native. Nested providers inherit it, overlays and chart crosshair labels follow it, and primary fills receive contrasting black or white labels.
- Preserve Bloxwap green by default and keep status, buy/sell, and approved brand-mark colours independent of the custom primary accent. Native Display P3 hosts convert custom sRGB accents.
- Adopt pink negative/sell and neon-yellow warning roles, with severity-based callout strokes and glows on web and native.
- Includes interface guidelines, accessibility and consumer validation, and release artifact verification.
- Registry publication remains subject to maintainer approval and the release gates in `planning/release-blockers.json`.
