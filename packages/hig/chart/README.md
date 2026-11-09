# @bloxwap/hig/chart

Version 0.3.0, an entry of `@bloxwap/hig`. The HIG adapter for [`@bloxwap/chart`](https://github.com/bloxwap/chart): `PriceChart` (a
`<figure>` with a required text `summary`, lazy-loading `@bloxwap/chart/react` inside `Suspense`) and
`chartTheme` (HIG token colors in sRGB for the canvas). Web only; React Native uses labeled readouts and lists
from `@bloxwap/hig/native/data`.

```sh
npm install @bloxwap/hig @bloxwap/chart@^0.4.0
```

```tsx
import {PriceChart, chartTheme} from '@bloxwap/hig/chart';
```

Needs `react` and `@bloxwap/chart` `^0.3.0 || ^0.4.0` (0.4.0 is the tested baseline); `HIGProvider` from `@bloxwap/hig/react/provider` supplies the
loading messages. `@bloxwap/chart` is the one required peer of `@bloxwap/hig`, and deliberately not optional: npm 11 drops a workspace copy of
`@bloxwap/chart` from a lockfile regenerated from scratch when an installed package declares it as an optional
peer (bloxwap/hig#96).

Moved from `@bloxwap/hig/react/chart` in bloxwap/hig#96; there is no `./react/chart` entry, and no other entry
imports `@bloxwap/chart`. Replace `@bloxwap/hig/react/chart` with `@bloxwap/hig/chart` in imports; the
exports and props are unchanged.
