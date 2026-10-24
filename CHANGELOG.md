# Changelog

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
