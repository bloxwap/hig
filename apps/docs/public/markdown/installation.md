# Installation and citation · HIG 0.1.0

These are review candidates, not published npm packages. Use local dry-run tarballs or CI artifact downloads; do not assume `@bloxwap/hig-*` is available on the registry. Published-style imports in examples are tested against packed candidates. Version references identify a candidate until release gates are complete.

## React / Vite

Run `npm ci && npm run build && npm run smoke:packed`. The smoke script installs tarballs into an independent temporary consumer and builds the fixture. For a host app install tokens, contracts and React tarballs plus React/DOM 19.1. Import `@bloxwap/hig-tokens/css` and `@bloxwap/hig-react/css` once; import individual components such as `@bloxwap/hig-react/button`. Pin @bloxwap/font 0.1.2 and choose only the required families/scripts using asset URL @font-face rules. The included fixture has Sans and Mono only. Never copy font binaries or component folders.

## SSR and Next client boundaries

Run `npm run smoke:ssr`, `npm run build:next` and `npm run smoke:packed-next`. Token/formatting imports and button/provider SSR are deterministic. Components with hooks carry `use client` in their emitted modules. In Next, import HIG CSS in the app layout and put interactive example state in a client component; keep wallet/network logic with the host. Next's published Bloxwap font loaders remain owned upstream. Next 16.4.0 (webpack), React 19.1 and the published Bloxwap Sans Next loader are verified in the dedicated production fixture; other Next versions require host checks. Verify hydration, stable IDs and StrictMode before adopting a host version.

## Expo / React Native

Run `npm run smoke:packed-native` after packed artifacts are built, or `npm run start -w hig-native-fixture` for the device gallery. Matrix: React 19.1, RN 0.81.5, Expo 54, Metro as locked. Native consumers install tokens/contracts/native tarballs; optional feedback installs its tarball and explicit Expo backend peers. Slider and SVG peers are only needed by their family entries. Import `@bloxwap/hig-native/button`, not the DOM renderer. Dynamic Type remains enabled; native targets stay 48. Keyboard/safe-area/back behavior belongs to the native host and its supported OS.

WOFF2 is not a native font asset. Supply pinned approved static TTFs and a typed FontManifest; register them before setting the native provider fontFamily. Until upstream supplies the manifest/assets, the gallery explicitly uses the system fallback and does not claim Bloxwap native typography certification.

## Tokens only / plain CSS / Tailwind

Install the tokens tarball alone and import CSS variables or typed tokens. No React/RN/audio peer is required. Plain HTML uses semantic `--hig-*` roles. Tailwind may reference these values through host configuration; HIG does not require content scans or a shadcn registry. Native uses dp and explicit hex/channel maps; do not feed CSS functions or rename rem to dp. NativeWind integration remains unverified until the inaccessible monorepo rem-root mapping is audited.

## Optional chart, sound and haptics

Chart is DOM-only and lazy; install @bloxwap/chart 0.3.0 for that entry and supply a textual summary. Native uses labeled readouts/lists. Feedback install paths, preferences, iOS physical-tap limitations and Expo backends are in the feedback chapters. Keep essential outcome text available with both channels off.

## Stable citations and upgrades

Cite “Bloxwap HIG 0.1.0 candidate, chapter/anchor” plus an immutable GitHub commit permalink. Branch and docs preview links are mutable. Upgrade tokens, contracts, renderer, docs/examples and semantic cue mapping together; compare API behavior and adopt behind a rollback flag. Token appearance and accessibility behavior changes require semver review. No publication, release or tag is performed by this implementation.
