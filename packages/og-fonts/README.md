# @bloxwap/hig-og-fonts

Version 0.1.1. Five static Latin Bloxwap Sans/Mono TTF faces for Open Graph card renderers: Satori, `next/og` `ImageResponse` and `@vercel/og`. Satori reads TTF/OTF but not WOFF2, and `@bloxwap/font` ships only WOFF2.

| Face | File | Weight |
| --- | --- | --- |
| Bloxwap Sans Regular | `fonts/BloxwapSans.ttf` | 400 |
| Bloxwap Sans Medium | `fonts/BloxwapSans-Medium.ttf` | 500 |
| Bloxwap Sans Bold | `fonts/BloxwapSans-Bold.ttf` | 700 |
| Bloxwap Sans Black | `fonts/BloxwapSans-Black.ttf` | 900 |
| Bloxwap Mono Medium | `fonts/BloxwapMono-Medium.ttf` | 500 |

These are the faces that the chart, sfx, agent-cli and tapsiren OG cards load. `npm run generate:fonts` copies them byte for byte from `@bloxwap/hig-native-fonts`, so every SHA-256 in `fontManifest.outputs` equals the matching native manifest entry. The packed tarball stays under 1 MB; the release dry run fails if it grows past that. If you need a weight that is not listed here, open an issue on bloxwap/hig. Do not vendor `@bloxwap/hig-native-fonts`.

Install it as a build-time dev dependency. Nothing in it is served to browsers.

```tsx
// Node runtime (next/og route handlers, static OG export scripts)
import {ImageResponse} from 'next/og';
import {loadOgFonts} from '@bloxwap/hig-og-fonts/node';

const fonts = await loadOgFonts(); // reads fonts/*.ttf and throws on any SHA-256 mismatch
export function GET() {
  return new ImageResponse(<div style={{fontFamily: 'Bloxwap Sans', fontWeight: 700}}>Bloxwap</div>, {width: 1200, height: 630, fonts});
}
```

This works in Next 16 route handlers with both the default Turbopack build and `next build --webpack`. Each face has its own literal `new URL('../fonts/<File>.ttf', import.meta.url)`, which Turbopack copies into `.next/server`. webpack reads the faces from this package's `fonts/` directory at the absolute path it had at build time. If a webpack `output: 'standalone'` build moves to another directory, add `serverExternalPackages: ['@bloxwap/hig-og-fonts']` to `next.config`.

`loadOgFonts(faces?)` returns `{name, data, weight, style}` objects, the shape Satori takes. `ogFonts` (from the package root) lists the same faces with their asset names and hashes, so you can pass a subset, for example `ogFonts.filter(f => f.weight >= 700)`. `readOgFont(asset)` reads and checks a single file.

Edge or Workers runtimes cannot read `node_modules` at request time. Copy `@bloxwap/hig-og-fonts/fonts/<asset>` into a build output at build time and check each file against `fontManifest.outputs[asset]` (also at `@bloxwap/hig-og-fonts/manifest`) before you write it. Keep that output gitignored.

OFL attribution for the faces ships in `fonts/OFL.txt`. The faces derive from `@bloxwap/font` 0.1.2, and `fontManifest.sources` records the SHA-256 of its variable WOFF2 sources.
