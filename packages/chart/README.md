# @bloxwap/hig-chart

Candidate 0.1.0. The HIG adapter for [`@bloxwap/chart`](https://github.com/bloxwap/chart): `PriceChart` (a
`<figure>` with a required text `summary`, lazy-loading `@bloxwap/chart/react` inside `Suspense`) and
`chartTheme` (HIG token colors in sRGB for the canvas). Web only; React Native uses labeled readouts and lists
from `@bloxwap/hig-native/data`.

```sh
npm install @bloxwap/hig-chart @bloxwap/hig-react @bloxwap/chart@^0.3.0
```

```tsx
import {PriceChart, chartTheme} from '@bloxwap/hig-chart';
```

Peers: `react`, `@bloxwap/hig-react` (for `HIGProvider` messages) and `@bloxwap/chart` `^0.3.0`. All three
are required peers. `@bloxwap/chart` is deliberately not an optional peer: npm 11 drops a workspace copy of
`@bloxwap/chart` from a lockfile regenerated from scratch when an installed package declares it as an optional
peer (bloxwap/hig#96).

Moved from `@bloxwap/hig-react/chart` in bloxwap/hig#96; `@bloxwap/hig-react` no longer has a `./chart` entry
or any `@bloxwap/chart` peer. Replace `@bloxwap/hig-react/chart` with `@bloxwap/hig-chart` in imports; the
exports and props are unchanged.
