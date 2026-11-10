# Changelog

## Unreleased

- Verify Linux Chromium visual baselines on GitHub-hosted Ubuntu and enforce complete baseline inventories on both platforms (#185).
- CI checks committed docs and example artifacts after generation, including Markdown-only guide changes, so stale exports cannot pass after the build refreshes them (#172).
- Validate token source colours, density key sets and positive motion/spacing values before generation; enforce React density sizes against source tokens without changing rendering (#187).

## 0.3.0

- Every JS export now has a `default` condition beside `import`. Jest/jest-expo, `require()` and Metro's CommonJS resolution can import HIG entries instead of failing with `ERR_PACKAGE_PATH_NOT_EXPORTED`.
- `@bloxwap/hig/react/css` is touch-safe. Every `:hover` rule now sits behind `(hover: hover) and (pointer: fine)`, so taps no longer leave buttons dimmed or ghost buttons filled. Hosts can delete their sticky-hover overrides, and `tests/touch-css.test.ts` keeps the gate in place. HIG controls also get no tap highlight, `touch-action: manipulation`, no long-press selection, `:active` press feedback, 16px text fields on touch, overscroll containment, and safe-area padding on edge sheets and dialogs.
- Native market-direction colours: `useColors()` adds `up` and `down` (defaulting to `buy`/`sell`), `HIGProvider marketColors` overrides them and is inherited, and `NumberReadout`, `Usd`, `Percent` and `AnimatedNumberReadout` accept `tone="up" | "down"`. New types: `HIGMarketColors`, `HIGMarketColorRole` and `HIGTableColorRole`. `colorTable()` and `useBrandColors()` now return the table roles only. This replaces the mobile app's local patch of 0.2.0.
- Native `AnimatedNumberReadout` hides its underlying reading with clear white (`#ffffff00`) instead of `transparent`. Android Fabric reads `0x00000000` as unset and drew that reading in black under the reels.
- Motion: web button presses ease over 160ms on the standard curve instead of snapping. `AnimatedNumberReadout` uses the standard HIG curve (`tokens.easing.standard`) on web and native. Native digit reels mount 20 rows instead of 30, a third less to render per animated place.
- Native test consumers track Expo SDK 58.0.23, which expects `react-native-safe-area-context ~5.11.1`, and the peer range now accepts it.
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
