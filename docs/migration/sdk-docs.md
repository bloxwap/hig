# Five SDK documentation pilots (#34)

Owner: each SDK repository's docs maintainers (named assignment in #57). Preserve each interactive SDK demo and its host APIs; HIG replaces shared presentation only. Status on 2026-10-15: all five sites consume vendored HIG packages. Each was merged after independent verification: [hyperliquid#180](https://github.com/bloxwap/hyperliquid/pull/180), [chart#53](https://github.com/bloxwap/chart/pull/53), [font#11](https://github.com/bloxwap/font/pull/11), [sfx#50](https://github.com/bloxwap/sfx/pull/50) and [haptic#26](https://github.com/bloxwap/haptic/pull/26), all on `0.1.0-candidate.sha7c67a07c`. Chart, SFX and Haptic then moved to `0.1.0-candidate.sha872906a9` in [chart#56](https://github.com/bloxwap/chart/pull/56), [sfx#52](https://github.com/bloxwap/sfx/pull/52) and [haptic#28](https://github.com/bloxwap/haptic/pull/28). That refresh removed the workarounds for #63 (`legacy-peer-deps` and nested Radix trees; the overlay-free recipe entries are used instead), #65 (font bridges) and #66 (chart's generated role file). Hyperliquid and Font stay on `7c67a07c` until their next refresh. Measurements and residual exceptions are in each PR's evidence folder and in `planning/adoption.json`.

| Repository | Shared presentation | Distinctive feature to preserve | Remaining owner validation |
| --- | --- | --- | --- |
| hyperliquid | Font/tokens, shell/nav/search, code/install/copy/callout/forms/states | Market playground and live SDK request handling | Production/static export, query/deep links, market demo errors/loading, copy/search/mobile keyboard |
| chart | Same shell/controls plus HIG chart theme | Chart preview, drawings/controls, pan/zoom/crosshair and WASM/worker paths | Canvas/text summary, gesture responsiveness, base assets, chart-specific demos remain optional |
| font | Type roles, common controls/geometry and code windows | Type tester, glyph coverage, variable axes and locale companions | Font licensing/provenance, subsets/bytes, scripts/RTL/large text and tester functionality |
| sfx | Controls/presets/settings/docs states | Sound board and recipe editor/export | Trusted audio unlock, mute/volume, edited recipes, native WAV command docs and cleanup |
| haptic | Common controls and explicit capability labels | Physical-target/platform demo and certification references | Physical iOS/Android/VoiceOver evidence remains upstream haptic#9; no API-call-as-tactile-proof claims |

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

## Follow-up package upgrades

Chart, SFX, agent-cli and tapsiren should replace the full `@bloxwap/hig-native-fonts` build dependency with `@bloxwap/hig-og-fonts` for their OG/Satori renderers. Update each TTF resolver to `@bloxwap/hig-og-fonts/fonts/<face>.ttf`, use its manifest for hash checks, and remove the unused native-font tarball after a clean OG render. Sans 400/600/700 and Mono 400 retain their canonical bytes. Runtime native apps continue using the full native package.

Chart keeps `@bloxwap/chart` as a direct workspace dependency. HIG's chart adapter is still individually imported, but the shared renderer no longer declares an optional chart peer. Regenerate the lockfile with normal strict peer resolution; no `legacy-peer-deps` workaround is needed. Verify the workspace symlink after a clean install.
