# Installation and citation · HIG 0.1.0

These are review candidates, not published npm packages. Use local dry-run tarballs or CI artifact downloads; do not assume `@bloxwap/hig-*` is available on the registry. Published-style imports in examples are tested against packed candidates. Version references identify a candidate until release gates are complete.

## React / Vite

Run `npm ci && npm run build && npm run smoke:packed`. The smoke script installs tarballs into an independent temporary consumer and builds the fixture. For a host app install tokens, contracts and React tarballs plus React/DOM 19.2. Import `@bloxwap/hig-tokens/css` and `@bloxwap/hig-react/css` once; import individual components such as `@bloxwap/hig-react/button`. Pin @bloxwap/font 0.1.2 and choose only the required families/scripts using asset URL @font-face rules named `'Bloxwap Sans'` and `'Bloxwap Mono'`; HIG controls read `--hig-font-sans`/`--hig-font-mono`, which fall back to those literal families. The included fixture has Sans and Mono only, and its browser smoke checks that `.hig-button` and `.hig-number` render loaded Bloxwap faces. Never copy font binaries or component folders.

## SSR and Next client boundaries

Run `npm run smoke:ssr`, `npm run build:next` and `npm run smoke:packed-next`. Token/formatting imports and button/provider SSR are deterministic. Components with hooks carry `use client` in their emitted modules. In Next, import HIG CSS in the app layout and put interactive example state in a client component; keep wallet/network logic with the host. Next's published Bloxwap font loaders remain owned upstream.

Fonts in Next: put the `@bloxwap/font` loader variables on `<html>`, for example `<html className={`${BloxwapSans.variable} ${BloxwapMono.variable}`}>`. The loaders register hashed family names, so HIG never matches a literal `'Bloxwap Sans'` there. Instead `--hig-font-sans` and `--hig-font-mono` in `@bloxwap/hig-tokens/css` resolve `var(--font-bloxwap-sans)` and `var(--font-bloxwap-mono)` first and fall back to the literal families. No bridge CSS is needed. If a host keeps its own variable names, override the roles on `:root` after importing the tokens CSS: `:root { --hig-font-sans: var(--my-sans), 'Bloxwap Sans', system-ui, sans-serif; }`. The variables must be defined on `<html>` (not `<body>`), because the roles resolve on `:root`. `npm run smoke:packed-next` serves the packed consumer and checks, in Chromium, that `.hig-button` and `.hig-number` compute to a loaded Bloxwap face (`document.fonts.check` plus the `FontFace` status). Next 16.4.0 (webpack), React 19.2 and the published Bloxwap Sans Next loader are verified in the dedicated production fixture; other Next versions require host checks. Verify hydration, stable IDs and StrictMode before adopting a host version.

## Expo / React Native

Run `npm run smoke:packed-native` after packed artifacts are built, or `npm run start -w hig-native-fixture` for the device gallery. Matrix: React 19.1, RN 0.81.5, Expo 54, Metro as locked. Native consumers install tokens/contracts/native tarballs; optional feedback installs its tarball and explicit Expo backend peers. Slider and SVG peers are only needed by their family entries. Import `@bloxwap/hig-native/button`, not the DOM renderer. Dynamic Type remains enabled; native targets stay 48. Keyboard/safe-area/back behavior belongs to the native host and its supported OS.

Install Expo native peers with `npx expo install` (for example `expo-asset ~12.0.13` and `expo-constants ~18.0.14` alongside `expo-font`/`expo-audio`). Expo 54 autolinking links the copy resolved from the app root; a hoisted SDK 57 `expo-asset` pulled by `expo-audio`'s `*` peer compiles away and the app fails at launch with `Cannot find native module 'ExpoAsset'` (observed on the iOS Simulator). `verifyExpoNativeModules` in `scripts/native-compatibility.mjs` guards the fixture and packed consumer. `HIGProvider` follows the OS layout direction (`I18nManager.isRTL`) unless `direction` is passed.

`@bloxwap/hig-native` ships one small Android library (`android/`, `com.bloxwap.hig.HIGPackage`) that React Native and Expo autolinking pick up in development and release builds (`npx expo prebuild`, `npx expo run:android`). It adds Android set-progress to `Slider`; nothing else depends on it, and in Expo Go the Slider falls back to increment/decrement only. iOS needs no native code.

Simulator/emulator verification: `scripts/native-sim/` builds the packed candidate gallery as real Release apps and drives them with XCUITest (iOS Simulator) and UiAutomation instrumentation, uiautomator and TalkBack (Android emulator). Results and residual physical-hardware limits are in `evidence/native-sim/`.

WOFF2 is not a native font asset. `@bloxwap/hig-native-fonts` ships 15 static Bloxwap Sans/Mono (plus Korean and Simplified Chinese Sans) TTFs generated reproducibly from pinned Font 0.1.2 sources, with a typed `fontManifest` export and `@bloxwap/hig-native-fonts/manifest`. Install it alongside the tokens, contracts and native tarballs, then `require('@bloxwap/hig-native-fonts/fonts/BloxwapSans.ttf')` and register the faces with expo-font before setting the native provider fontFamily, as the gallery does. `@bloxwap/hig-tokens` no longer contains font binaries (#64); see [native font migration](migration/native.md#native-fonts-moved-out-of-hig-tokens). Rasterization on physical displays remains part of #55. New repositories follow `docs/governance/new-repository.md`.

## Tokens only / plain CSS / Tailwind

Install the tokens tarball alone and import CSS variables or typed tokens. No React/RN/audio peer is required. Plain HTML uses semantic `--hig-*` roles.

`@bloxwap/hig-tokens/css` defines every role a plain CSS host needs, so nobody has to read the manifest or generate role files:

| Roles | Example | Values |
| --- | --- | --- |
| Color | `--hig-surface`, `--hig-action` | sRGB, then OKLCH/P3 in `@supports` |
| Space | `--hig-space-md` | `xs`–`xxxl`, `section`, in rem |
| Font | `--hig-font-sans`, `--hig-font-mono` | `@bloxwap/font` Next variable, then literal family |
| Radius | `--hig-radius-md`, `--hig-radius-pill` | `sm` `md` `lg` `xl` in rem; `pill` 9999px |
| Type | `--hig-type-body-size`, `--hig-type-body-line-height`, `--hig-type-body-weight`, `--hig-type-body` | `caption` `label` `body` `title` `display`; the bare role is a `font` shorthand in Sans |
| Motion | `--hig-motion-duration-base`, `--hig-motion-easing-standard` | `fast` `base` `slow` ms; 0ms under `prefers-reduced-motion: reduce` or `[data-hig-motion='reduced']` |
| Density | `--hig-density-control`, `--hig-density-compact-gap` | `control` `target` `gap` per mode; the unprefixed roles follow `[data-hig-density='compact']` |

```css
@import '@bloxwap/hig-tokens/css';
.card { border-radius: var(--hig-radius-lg); padding: var(--hig-space-lg); font: var(--hig-type-body); }
.card h2 { font: var(--hig-type-title); }
.card button { min-height: var(--hig-density-control); transition: background var(--hig-motion-duration-fast) var(--hig-motion-easing-standard); }
``` Tailwind may reference these values through host configuration; HIG does not require content scans or a shadcn registry. Native uses dp and explicit hex/channel maps; do not feed CSS functions or rename rem to dp. The audited monorepo web/native rem roots are both 16; HIG supports StyleSheet rather than claiming a verified NativeWind consumer. See the source-reconciliation chapter for native font generation and registration.

## Optional chart, sound and haptics

Chart is DOM-only and lazy; install @bloxwap/chart 0.3.0 for that entry and supply a textual summary. Native uses labeled readouts/lists. Feedback install paths, preferences, iOS physical-tap limitations and Expo backends are in the feedback chapters. Keep essential outcome text available with both channels off.

## Stable citations and upgrades

Cite “Bloxwap HIG 0.1.0 candidate, chapter/anchor” plus an immutable GitHub commit permalink. Branch and docs preview links are mutable. Upgrade tokens, contracts, renderer, docs/examples and semantic cue mapping together; compare API behavior and adopt behind a rollback flag. Token appearance and accessibility behavior changes require semver review. No publication, release or tag is performed by this implementation.

The native fixture pins React **19.1.0**, matching the RN 0.81.5 renderer exactly. Web/Next/Fumadocs fixtures use React 19.2.0. Metro explicitly resolves every native `react`/`react/*` import to the native fixture's version so shared-workspace code cannot load web React. Quality and packed-native checks compare the installed version to RN's actual renderer guard; a successful Metro bundle alone does not prove runtime compatibility.
