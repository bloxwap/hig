# Installation and citation · HIG 0.1.0

These are review candidates, not published npm packages. Use local dry-run tarballs or CI artifact downloads; do not assume `@bloxwap/hig-*` is available on the registry. Published-style imports in examples are tested against packed candidates. Version references identify a candidate until release gates are complete.

## React / Vite

Run `npm ci && npm run build && npm run smoke:packed`. The smoke script installs tarballs into an independent temporary consumer and builds the fixture. For a host app install tokens, contracts and React tarballs plus React/DOM 19.2. Import `@bloxwap/hig-tokens/css` and `@bloxwap/hig-react/css` once; import individual components such as `@bloxwap/hig-react/button`. Pin @bloxwap/font 0.1.2 and choose only the required families/scripts using asset URL @font-face rules named `'Bloxwap Sans'` and `'Bloxwap Mono'`; HIG controls read `--hig-font-sans`/`--hig-font-mono`, which fall back to those literal families. The included fixture has Sans and Mono only, and its browser smoke checks that `.hig-button` and `.hig-number` render loaded Bloxwap faces. Never copy font binaries or component folders.

### Component CSS and the opt-in base

`@bloxwap/hig-react/css` styles HIG components only. Every rule is scoped to a HIG class, for example `.hig-button`, `.hig-table` cells, `.hig-range` or `.hig-surface[data-severity]`. The box-sizing and focus ring rules use `:where()` on HIG classes, so they keep the specificity of a bare element rule and host CSS can still override them. Loading the file has no effect on plain `table`, `th`, `td`, `input[type=range]`, `[data-severity]` or the focus outline of a non-HIG element. Hosts that load HIG on some routes only can rely on this: Next.js keeps a route's stylesheet after a client navigation, and the scoped file then has no side effects on the other routes (#95).

The page-wide element defaults are a separate, opt-in entry, `@bloxwap/hig-react/css/base`:

| Rule | Effect |
| --- | --- |
| `* { box-sizing: border-box }` | Border-box sizing on every element |
| `:focus-visible` | The 2px `--hig-focus` ring with a 3px offset on every focusable element |
| `table`, `th`, `td` | Collapsed borders, full width, 12px cells with a `--hig-border` rule |
| `input[type='range']` | `--hig-action` accent, 48px minimum height, full width |

Import the base only when HIG owns the whole page, and import it before the component CSS:

```ts
import '@bloxwap/hig-tokens/css';
import '@bloxwap/hig-react/css/base'; // optional: page-wide element defaults
import '@bloxwap/hig-react/css';
```

These are the rules that `@bloxwap/hig-react/css` applied to the whole page before #95, so a host that adds the base sees no change. The HIG docs site and the web and Next fixtures import it. HIG components look the same with or without the base. `npm run smoke:packed-react-css` checks this. It installs the packed tokens, contracts and React tarballs into an empty consumer and renders Table, Slider, Button and Alert to static markup. Then, in Chromium, Firefox and WebKit, it compares three script-free pages: tokens only, tokens plus `@bloxwap/hig-react/css`, and tokens plus the base and the component CSS. The plain table, cells, range, box-sizing, `[data-severity]` and keyboard focus outline must compute the same with the component CSS as with tokens only. The base page must change them, which proves the check can see a leak. The components must compute the same with and without the base. `npm run smoke:packed-boundaries` also checks that both entries resolve through package exports in a bundler and that the component CSS has no selector outside HIG classes.

### Radix overlay peers and Fumadocs

The four Radix packages are optional peers with caret ranges: `@radix-ui/react-dialog ^1.1.15`, `@radix-ui/react-popover ^1.1.15`, `@radix-ui/react-dropdown-menu ^2.1.16` and `@radix-ui/react-tooltip ^1.2.8`. Install them only for `@bloxwap/hig-react/overlay`, `@bloxwap/hig-react/recipes` or `@bloxwap/hig-react/recipes/trade-entry` (dialog only). Hosts that already use Radix, such as Fumadocs, share their copy: `npm run smoke:packed-fumadocs` installs the packed React tarball next to fumadocs-ui 16.17.3 with strict peers and `npm ci`, asserts every `@radix-ui/*` package appears once, and renders the overlays on the resolved current releases. The workspace fixtures keep testing the lower bounds. Do not set `legacy-peer-deps` for HIG.

## SSR and Next client boundaries

Run `npm run smoke:ssr`, `npm run build:next` and `npm run smoke:packed-next`. Token/formatting imports and button/provider SSR are deterministic. Components with hooks carry `use client` in their emitted modules. In Next, import HIG CSS in the app layout (or in the route layouts that use HIG; the component CSS is scoped, see above) and put interactive example state in a client component; keep wallet/network logic with the host. Next's published Bloxwap font loaders remain owned upstream.

Fonts in Next: put the `@bloxwap/font` loader variables on `<html>`, for example `<html className={`${BloxwapSans.variable} ${BloxwapMono.variable}`}>`. The loaders register hashed family names, so HIG never matches a literal `'Bloxwap Sans'` there. Instead `--hig-font-sans` and `--hig-font-mono` in `@bloxwap/hig-tokens/css` resolve `var(--font-bloxwap-sans)` and `var(--font-bloxwap-mono)` first and fall back to the literal families. No bridge CSS is needed. If a host keeps its own variable names, override the roles on `:root` after importing the tokens CSS: `:root { --hig-font-sans: var(--my-sans), 'Bloxwap Sans', system-ui, sans-serif; }`. The variables must be defined on `<html>` (not `<body>`), because the roles resolve on `:root`. `npm run smoke:packed-next` serves the packed consumer and checks, in Chromium, that `.hig-button` and `.hig-number` compute to a loaded Bloxwap face (`document.fonts.check` plus the `FontFace` status). Next 16.4.0 (webpack), React 19.2 and the published Bloxwap Sans Next loader are verified in the dedicated production fixture; other Next versions require host checks. Verify hydration, stable IDs and StrictMode before adopting a host version.

## Open Graph card fonts

Satori, `next/og` `ImageResponse` and `@vercel/og` read TTF/OTF but not WOFF2, and `@bloxwap/font` ships only WOFF2. Docs and marketing sites that render OG cards install `@bloxwap/hig-og-fonts` as a build-time dev dependency. Do not use `@bloxwap/hig-native-fonts` for this (#99). The package holds five static Latin faces: Bloxwap Sans 400, 500, 700 and 900, and Bloxwap Mono 500. These are the faces the chart, sfx, agent-cli and tapsiren cards use. It packs to about 0.84 MB; the native fonts package is 4.4 MB. `npm run generate:fonts` copies the five faces byte for byte from `@bloxwap/hig-native-fonts`, so each SHA-256 in its manifest equals the native manifest entry. The release dry run records the packed size in `packedSizes.ogFonts` and fails at 1,000,000 B.

Node runtime (route handlers with `export const runtime = 'nodejs'`, or static OG export scripts):

```tsx
import {ImageResponse} from 'next/og';
import {loadOgFonts} from '@bloxwap/hig-og-fonts/node';

const fonts = await loadOgFonts(); // {name, data, weight, style}[]; throws if any TTF's SHA-256 differs from the manifest
export function GET() {
  return new ImageResponse(<div style={{display: 'flex', fontFamily: 'Bloxwap Sans', fontWeight: 700}}>Bloxwap</div>, {width: 1200, height: 630, fonts});
}
```

This works in a Next 16 route handler with the default Turbopack build and with `next build --webpack`. Turbopack copies the five faces into `.next/server`, so `output: 'standalone'` works even after you move it. webpack reads the faces from `node_modules/@bloxwap/hig-og-fonts/fonts` at the absolute path it had at build time. If a webpack standalone build runs from another directory, add `serverExternalPackages: ['@bloxwap/hig-og-fonts']` to `next.config`. Earlier 0.1.0 candidate builds made each face's path from a template URL, and under Turbopack every face read the same file. The route then failed with `BloxwapSans.ttf: SHA-256 f969fd1e… does not match the manifest`.

Pass a subset if you need fewer faces: `loadOgFonts(ogFonts.filter(f => f.weight >= 700))`, with `ogFonts` imported from `@bloxwap/hig-og-fonts`. Edge and Workers runtimes cannot read `node_modules` at request time. Copy `@bloxwap/hig-og-fonts/fonts/<asset>` into a gitignored build folder at build time. Before you write each file, check it against `fontManifest.outputs[asset]` (from the package root, or as JSON at `@bloxwap/hig-og-fonts/manifest`), as tapsiren's `copy-og-fonts.mjs` does. Plain Node ESM scripts outside Next import `next/og.js`, because `next` has no exports map. `npm run smoke:packed-og` installs the packed tarball next to `next@16.4.0` in a clean consumer. It hashes every exported TTF against both manifests and renders 1200×630 PNG cards through `ImageResponse`: each Sans weight must render differently, and none may match the default font. It also requires `readOgFont` to reject a tampered face. It then builds an `app/og/route.tsx` handler with the code above and checks it four ways: Turbopack and `--webpack`, each under `next start`; Turbopack `output: 'standalone'`; and webpack standalone with `serverExternalPackages`. Each standalone build is moved to another directory with the consumer's `node_modules` hidden. Every face must come back with its own SHA-256, and every card must match the plain Node render byte for byte. Results go to `evidence/packed-og-smoke.json`.

## Expo / React Native

Run `npm run smoke:packed-native` after packed artifacts are built, or `npm run start -w hig-native-fixture` for the device gallery. Matrix: RN 0.81.5 with Expo SDK 54 and React 19.1.0, and RN 0.83.10 with Expo SDK 55 and React 19.2.0 (#68), Metro as locked. `npm run smoke:packed-native -- --profile rn-0.83` installs the same fixture with the SDK 55 versions from `fixtures/native/profiles.json`; CI exports both consumers for Android and iOS. `@bloxwap/hig-native` declares `react-native` `^0.81.5 || ^0.83.10`, so RN 0.82 and 0.84+ are outside the tested range. Native consumers install tokens/contracts/native tarballs; optional feedback installs its tarball and explicit Expo backend peers. Slider and SVG peers are only needed by their family entries. Import `@bloxwap/hig-native/button`, not the DOM renderer. Dynamic Type remains enabled; native targets stay 48. Keyboard/safe-area/back behavior belongs to the native host and its supported OS.

Install Expo native peers with `npx expo install` (for example, on SDK 54, `expo-asset ~12.0.13` and `expo-constants ~18.0.14` alongside `expo-font`/`expo-audio`; on SDK 55, `expo-asset ~55.0.20` and `expo-constants ~55.0.17`). Expo 54 autolinking links the copy resolved from the app root; a hoisted SDK 57 `expo-asset` pulled by `expo-audio`'s `*` peer compiles away and the app fails at launch with `Cannot find native module 'ExpoAsset'` (observed on the iOS Simulator). `verifyExpoNativeModules` in `scripts/native-compatibility.mjs` guards the fixture and packed consumer. `HIGProvider` follows the OS layout direction (`I18nManager.isRTL`) unless `direction` is passed. On RN 0.83 Android, a per-app RTL locale (for example Arabic set in the system's app language settings) does not set `I18nManager.isRTL`, so pass `direction` explicitly there (#86).

`@bloxwap/hig-native` ships one small Android library (`android/`, `com.bloxwap.hig.HIGPackage`) that React Native and Expo autolinking pick up in development and release builds (`npx expo prebuild`, `npx expo run:android`). It adds Android set-progress to `Slider`; nothing else depends on it, and in Expo Go the Slider falls back to increment/decrement only. iOS needs no native code.

Simulator/emulator verification: `scripts/native-sim/` builds the packed candidate gallery as real Release apps and drives them with XCUITest (iOS Simulator) and UiAutomation instrumentation, uiautomator and TalkBack (Android emulator). `prepare-app.sh <app-dir> <udid> rn-0.83` builds the RN 0.83 / Expo 55 gallery, and `compare-runs.mjs` compares it with an RN 0.81.5 run of the same candidate. Results and residual physical-hardware limits are in `evidence/native-sim/` (RN 0.83: `evidence/native-sim/rn-0.83/`).

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
```

`npm run smoke:packed-css` proves this path. It installs only the packed `@bloxwap/hig-tokens` tarball into an empty consumer, links `@bloxwap/hig-tokens/css` from a script-free HTML page whose own stylesheet uses nothing but the roles, and checks the computed radius, type, motion and density values in Chromium, Firefox and WebKit, including 0ms durations under `prefers-reduced-motion: reduce` and `[data-hig-motion='reduced']` and the compact values under `[data-hig-density='compact']`. It fails if the page requests anything other than the HTML, its stylesheet and the token CSS, so the manifest is never read.

Tailwind may reference these values through host configuration; HIG does not require content scans or a shadcn registry. Native uses dp and explicit hex/channel maps; do not feed CSS functions or rename rem to dp. The audited monorepo web/native rem roots are both 16; HIG supports StyleSheet rather than claiming a verified NativeWind consumer. See the source-reconciliation chapter for native font generation and registration.

## Optional chart, sound and haptics

Chart is DOM-only and lazy; install @bloxwap/chart 0.3.0 for that entry and supply a textual summary. Native uses labeled readouts/lists. Feedback install paths, preferences, iOS physical-tap limitations and Expo backends are in the feedback chapters. Keep essential outcome text available with both channels off.

## Stable citations and upgrades

Cite “Bloxwap HIG 0.1.0 candidate, chapter/anchor” plus an immutable GitHub commit permalink. Branch and docs preview links are mutable. Upgrade tokens, contracts, renderer, docs/examples and semantic cue mapping together; compare API behavior and adopt behind a rollback flag. Token appearance and accessibility behavior changes require semver review. No publication, release or tag is performed by this implementation.

The native fixture pins React **19.1.0**, matching the RN 0.81.5 renderer exactly; the RN 0.83 profile pins **19.2.0**, matching the RN 0.83.10 renderer. Web/Next/Fumadocs fixtures use React 19.2.0. Metro explicitly resolves every native `react`/`react/*` import to the native fixture's version so shared-workspace code cannot load web React. Quality and packed-native checks compare the installed version to the version RN's Paper and Fabric renderers are built for (RN 0.83 no longer throws on a mismatch, so the check reads the renderer build itself); a successful Metro bundle alone does not prove runtime compatibility. The packed check also fails when a declared `@bloxwap/hig-native` or `@bloxwap/hig-feedback` peer range rejects a version the consumer installed.
