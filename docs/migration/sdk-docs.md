# Five SDK documentation pilots (#34)

Owner: Joe Blau (accepted in #57), with each SDK repository retaining implementation ownership. Preserve each interactive SDK demo and its host APIs; HIG replaces shared presentation only. As of 2026-10-27, all five docs sites install published HIG 0.1.0: [hyperliquid#217](https://github.com/bloxwap/hyperliquid/pull/217), [chart#78](https://github.com/bloxwap/chart/pull/78), [font#39](https://github.com/bloxwap/font/pull/39), [sfx#80](https://github.com/bloxwap/sfx/pull/80) and [haptic#49](https://github.com/bloxwap/haptic/pull/49). The earlier candidate refreshes removed the legacy peer installs, nested Radix trees, font bridges and generated role workaround. Exact source, validation, historical measurements and residual exceptions remain in the owning PRs and `planning/adoption.json`.

| Repository | Shared presentation | Distinctive feature to preserve | Remaining owner validation |
| --- | --- | --- | --- |
| hyperliquid | Font/tokens, shell/nav/search, code/install/copy/callout/forms/states | Market playground and live SDK request handling | Production/static export, query/deep links, market demo errors/loading, copy/search/mobile keyboard |
| chart | Same shell/controls plus HIG chart theme | Chart preview, drawings/controls, pan/zoom/crosshair and WASM/worker paths | Canvas/text summary, gesture responsiveness, base assets, chart-specific demos remain optional |
| font | Type roles, common controls/geometry and code windows | Type tester, glyph coverage, variable axes and locale companions | Font licensing/provenance, subsets/bytes, scripts/RTL/large text and tester functionality |
| sfx | Controls/presets/settings/docs states | Sound board and recipe editor/export | Trusted audio unlock, mute/volume, edited recipes, native WAV command docs and cleanup |
| haptic | Common controls and explicit capability labels | Physical-target/platform demo and certification references | Physical iOS/Android/VoiceOver evidence remains upstream haptic#9; no API-call-as-tactile-proof claims |

Docs sites that render Markdown tables or plain form controls relied on the page-wide rules that `@bloxwap/hig-react/css` set before #95. On a candidate that contains #95, add `@import '@bloxwap/hig-react/css/base';` before `@import '@bloxwap/hig-react/css';` to keep the same look, as the HIG docs site does. See [installation](../installation.md#component-css-and-the-opt-in-base).

Per-repo checklist:
- [ ] Pin source commit, HIG version and staged tarballs; capture before pages and duplicate CSS/primitive/font/audio/dependency/bundle baseline.
- [ ] Inventory each existing apps/docs shell, static base path, metadata, search/index adapter, CSS/Next font loader and copy/install control.
- [ ] Preview import mapping; preserve API props, router/search and SDK-specific business/demo logic. Plain HTML surfaces can use tokens/CSS alone.
- [ ] Migrate one shared shell/control page behind a rollback flag; preserve Fumadocs conventions or host equivalent and existing deep-link/base URLs.
- [ ] Execute that repo's production/static build and distinctive demo. Verify asset paths, keyboard/search/copy/mobile nav, loading/error/offline states, large text/RTL, and muted feedback.
- [ ] Compare equivalent screenshots and measured CSS/font/runtime bytes. Remove old files only after references are gone and tests pass.
- [ ] Update five separate adoption rows with owning PR URL, validated version, current gaps and rollback commit. Do not combine them into an unsupported “all migrated” claim.

Rollback: restore previous package lock/imports and shell flag per repo. Retain SDK demos and deep links. New shared HIG adoption must not change published SDK API examples.

## Compact source comparison

The October 14 review of the five local checkout revisions found the following
presentation baseline. These are source line counts, including product-specific
styles, comments and formatting; they are not an estimate of removable CSS.

| Site revision | Global CSS lines | Migration difference |
| --- | ---: | --- |
| [Hyperliquid 53159f1](https://github.com/bloxwap/hyperliquid/tree/53159f1/apps/docs) | 1,034 | Semantic color aliases and 160 ms interaction timing. |
| [Chart 8c71c71](https://github.com/bloxwap/chart/tree/8c71c71/apps/docs) | 440 | Nunito/Maple Mono remain; preserve chart previews. |
| [Font b406391](https://github.com/bloxwap/font/tree/b406391/apps/docs) | 703 | Hex neutrals, specimen typography and wrapping buttons. |
| [SFX 217eacb](https://github.com/bloxwap/sfx/tree/217eacb/apps/docs) | 509 | Preserve sound-board and playback behavior. |
| [Haptic b546223](https://github.com/bloxwap/haptic/tree/b546223/apps/docs) | 416 | Preserve platform capability and feedback demos. |

Hyperliquid, Chart and SFX have byte-identical 172-line token snapshots;
Haptic's declarations match with a different provenance comment. Chart, SFX
and Haptic also repeat the same button and search recipes. Use the existing
HIG token/component packages for shared behavior, and keep the written guide
compact with **rule → token or recipe → exception** rather than duplicating the
five implementations.

## OG card fonts: switch to `@bloxwap/hig-og-fonts` (#99)

Since #64, chart, sfx, agent-cli and tapsiren vendor the whole `@bloxwap/hig-native-fonts` tarball (4,420,375 B, 15 faces) as a build-time dev dependency, but their Satori/`next/og` cards read only two to four TTFs. Switch each repository at its next HIG candidate refresh:

| Repository | OG card file | Faces it reads | Change |
| --- | --- | --- | --- |
| chart | `apps/docs/lib/og-card.tsx` | Sans 700, 900 | Replace the `node_modules/@bloxwap/hig-native-fonts/fonts` path with `loadOgFonts(ogFonts.filter(f => f.weight >= 700))` |
| sfx | `apps/docs/lib/og-card.tsx` | Sans 700, 900 | Replace both `hig.resolve('@bloxwap/hig-native-fonts/fonts/…')` reads with the same `loadOgFonts` call |
| agent-cli | `apps/docs/lib/og-card.tsx` | Sans 700, 900 | Same as sfx |
| tapsiren | `workers/tapsiren/scripts/copy-og-fonts.mjs` | Sans 400, 500, 700; Mono 500 | Keep the build-time copy (the card runs on Workers). Resolve `@bloxwap/hig-og-fonts/manifest` and `@bloxwap/hig-og-fonts/fonts/<face>` instead of the native package; the SHA-256 values do not change |

In each repository:

1. Vendor `bloxwap-hig-og-fonts-<candidate>.tgz` from `artifacts/release-candidate/` (about 0.84 MB packed; the exact size is in `packedSizes.ogFonts` of that candidate's release report). Record its SHA-256 next to the other tarballs in `vendor/bloxwap-hig/`.
2. Replace the `@bloxwap/hig-native-fonts` dev dependency with `@bloxwap/hig-og-fonts`, regenerate the lockfile, and delete the native fonts tarball unless the repository also ships a React Native app.
3. Import the fonts from `@bloxwap/hig-og-fonts/node` (`loadOgFonts`, `readOgFont`). These check every SHA-256 against the package manifest. They work with the default Turbopack `next build` and with `next build --webpack`. If the docs app uses webpack with `output: 'standalone'` and the build moves, add `serverExternalPackages: ['@bloxwap/hig-og-fonts']`. Vendor a candidate that includes the per-face asset URL fix. Under Turbopack, an earlier `0.1.0` tarball returns 500 with `SHA-256 … does not match the manifest`. An edge host checks `fontManifest.outputs` itself, as tapsiren does. Font names (`'Bloxwap Sans'`, `'Bloxwap Mono'`) and weights stay the same.
4. Rebuild the OG cards and compare them with the previous images. The faces are byte-identical copies, so the cards should not change. Record the vendored-byte delta in the repository's adoption evidence and update its row in `planning/adoption.json`.

See [Open Graph card fonts](../installation.md#open-graph-card-fonts) for the full API and the edge-runtime path.

## Chart adapter: `@bloxwap/hig-chart` (#96)

`@bloxwap/hig-react` no longer has a `./chart` entry or an optional `@bloxwap/chart` peer. `PriceChart` and `chartTheme` moved unchanged to `@bloxwap/hig-chart`, which requires `@bloxwap/chart` `^0.3.0` as a peer. The optional peer made npm drop chart's `packages/chart` workspace when `package-lock.json` was regenerated from scratch without `legacy-peer-deps`. This reproduces on npm 10.9.9, 11.6.1, 11.21.1 and 12.2.0. A required peer does not trigger it.

| Repository | Uses `@bloxwap/hig-react/chart`? | Change at the next HIG refresh |
| --- | --- | --- |
| chart | No. The docs theme comes from `@bloxwap/hig-tokens` (`apps/docs/scripts/hig-tokens.mjs`) | Vendor the new hig-react tarball. Remove the `legacy-peer-deps` regeneration note from `vendor/bloxwap-hig/README.md`. A from-scratch `npm install` then keeps `@bloxwap/chart -> ./packages/chart`. Vendor `@bloxwap/hig-chart` only if the docs adopt `PriceChart` |
| sfx, haptic, hyperliquid, font | No | None beyond the usual tarball refresh |

A host that does import the entry changes one specifier and adds the package:

```diff
-import {PriceChart} from '@bloxwap/hig-react/chart';
+import {PriceChart} from '@bloxwap/hig-chart';
```

The candidate was never published, and a GitHub code search on 2026-10-16 found no consumer outside this repository, so no deprecated shim is kept (see [charts](../components/chart.md#moved-from-bloxwap-hig-react-chart-96)). `npm run smoke:packed-chart-workspace` reproduces chart's layout: an npm workspace whose `packages/chart` provides `@bloxwap/chart`, and an app that depends on the packed hig-react and hig-chart. It deletes the lockfile, reinstalls with strict peers and fails if the workspace link is lost.
