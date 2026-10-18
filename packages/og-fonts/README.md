# @bloxwap/hig-og-fonts

The Latin TTF subset for build-time Open Graph renderers such as Satori and `next/og`: Bloxwap Sans Regular, SemiBold and Bold, and Bloxwap Mono Regular. Web pages continue to load WOFF2 from `@bloxwap/font`; React Native apps use `@bloxwap/hig-native-fonts`.

Import metadata from `@bloxwap/hig-og-fonts` or `@bloxwap/hig-og-fonts/manifest`, and resolve a face through `@bloxwap/hig-og-fonts/fonts/BloxwapSans.ttf`. Every face is copied from the canonical native font generator and keeps its SHA-256 hash. The packed package has a 1 MB ceiling, verified by the independent OG consumer smoke.

Run `npm run generate:fonts` before packing this workspace. The upstream fonts and their accompanying OFL license come from pinned `@bloxwap/font@0.1.2`.
