# @bloxwap/hig/chart

Version 0.9.2, an entry of `@bloxwap/hig`. `AltimeterChart` is the Bloxwap live chart on its
own: a plus grid and price trail that flow left at 50px per second, a price ladder centered on the current price,
and the current price at the trail's tip. Pass `price` or a `feed`; with neither it shows live Bitcoin through
`bitcoinPrice`. Optional `targets` (`AltimeterTarget`: `{id, price, label?, color?}`) add full-width horizontal dotted lines
and colored text labels at the chart's trailing edge that glide to the side of each line facing the current price.
Labels pass behind the current-price pill where they overlap. Streaming price updates retarget from the current position and forward velocity without overshoot; the canvas reuses its font and measured ladder widths between frames.
Each label shows its title on the left and formatted target price on the right, such as `Take Profit $100.02`.
Offscreen labels pin and stack at the top or bottom in price order while their lines stay hidden. Labels follow their lines on the same frame and move aside only for other labels or the chart edges. Only the above/below offset animates (260ms), reversing from its current offset; collision constraints apply afterward so labels stay separated throughout.
Set `degen` to shake the price pill and send glowing particles mostly in the direction of travel when its price crosses a target;
it defaults to off and respects reduced motion. `OutcomeChart` shows a question with two to ten
outcomes live, as one flowing trail each on a 0 to 100% ladder, ending in a stroked capsule with the label and chance; with no `outcomes` or `feed` it shows the
UEFA Champions League winner market through `championsLeagueWinner`. The entry is also the HIG adapter for [`@bloxwap/chart`](https://github.com/bloxwap/chart): `PriceChart` (a
`<figure>` with a required text `summary`, lazy-loading `@bloxwap/chart/react` inside `Suspense`) and
`chartTheme` (HIG token colors in sRGB for the canvas). React Native exposes the SVG altimeter at `@bloxwap/hig/native/chart`. Outcome and candle charts use labeled readouts and lists from `@bloxwap/hig/native/data` on native.

```sh
npm install @bloxwap/hig @bloxwap/chart@^0.5.0
```

```tsx
import {AltimeterChart, OutcomeChart, PriceChart, chartTheme} from '@bloxwap/hig/chart';
```

Needs `react` and `@bloxwap/chart` `^0.3.0 || ^0.4.0 || ^0.5.0` (0.5.0 is the tested baseline); `HIGProvider` from `@bloxwap/hig/react/provider` supplies the
loading messages. `@bloxwap/chart` is the one required peer of `@bloxwap/hig`, and deliberately not optional: npm 11 drops a workspace copy of
`@bloxwap/chart` from a lockfile regenerated from scratch when an installed package declares it as an optional
peer (bloxwap/hig#96).

Moved from `@bloxwap/hig/react/chart` in bloxwap/hig#96; there is no `./react/chart` entry, and no other entry
imports `@bloxwap/chart`. Replace `@bloxwap/hig/react/chart` with `@bloxwap/hig/chart` in imports; the
exports and props are unchanged.
