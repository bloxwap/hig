# @bloxwap/hig

The Bloxwap Human Interface Guidelines in one package: semantic tokens, platform-neutral contracts, React and
React Native components, the `@bloxwap/chart` adapter, optional sound and haptic feedback, and the native and
Open Graph font faces.

```sh
npm install @bloxwap/hig
```

Import only the entries you use. Nothing loads from a root barrel.

```ts
import '@bloxwap/hig/tokens/css';
import '@bloxwap/hig/react/css';
import {HIGProvider} from '@bloxwap/hig/react/provider';
import {Button} from '@bloxwap/hig/react/button';
```

| Entry | Contents |
| --- | --- |
| `@bloxwap/hig/tokens` | Tokens, `resolvePrimaryColor`, `./tokens/css`, `./tokens/manifest` ([README](tokens/README.md)) |
| `@bloxwap/hig/contracts` | Types, formatting, feedback, announcements and messages ([README](contracts/README.md)) |
| `@bloxwap/hig/react/*` | Web components, recipes, `./react/css` and `./react/css/base` ([README](react/README.md)) |
| `@bloxwap/hig/native/*` | React Native components ([README](native/README.md)) |
| `@bloxwap/hig/chart` | `PriceChart` and `chartTheme` for `@bloxwap/chart` ([README](chart/README.md)) |
| `@bloxwap/hig/feedback/*` | Opt-in web and native sound/haptic adapters ([README](feedback/README.md)) |
| `@bloxwap/hig/native-fonts` | Static TTFs for React Native and Expo ([README](native-fonts/README.md)) |
| `@bloxwap/hig/og-fonts` | Satori / `next/og` faces and the Node loader ([README](og-fonts/README.md)) |

## Peers

Every renderer, device and overlay peer is optional: install React DOM and Radix for web overlays, React Native
and its community modules for native, `vaul` for the web gesture sheet, and the Expo or Bloxwap audio/haptic
packages for feedback, only when you import those entries. `@bloxwap/chart` `^0.3.0 || ^0.4.0` is the one required peer;
an optional peer on it makes npm 11 drop a host's workspace `@bloxwap/chart` (bloxwap/hig#96).

## Moving from 0.1

HIG 0.1 published eight packages (`@bloxwap/hig-tokens`, `-contracts`, `-react`, `-native`, `-chart`,
`-feedback`, `-native-fonts`, `-og-fonts`). Replace them with `@bloxwap/hig` and change the hyphen after `hig`
to a slash in each import: `@bloxwap/hig-react/button` becomes `@bloxwap/hig/react/button`. Entry names and
exports are unchanged. In Next, list `'@bloxwap/hig'` in `transpilePackages` or `serverExternalPackages`.

MIT licensed. Font binaries are derived from `@bloxwap/font` (OFL-1.1).
