# Charts

Live price charts for web and React Native, with web outcome charts and accessible text summaries.

Includes cross-platform `AltimeterChart` and web-only `OutcomeChart`, with their default `bitcoinPrice` and `championsLeagueWinner` feeds. The entry also exports the `PriceChart` candle adapter and `chartTheme`, which are no longer in the catalog. Native renders the altimeter with SVG and offers text alternatives for the other charts.

Issues #20 and #96. Entry: `@bloxwap/hig/chart`. Import `AltimeterChart` and `OutcomeChart` from `@bloxwap/hig/chart` for the DOM canvas only. On React Native, import `AltimeterChart` from `@bloxwap/hig/native/chart` and install the Expo-compatible version of `react-native-svg`. The native chart accepts the same price, feed, position, targets and DEGEN props and exposes the reading and target prices to accessibility services. It pauses rendering and disconnects its live feed while the app is in the background. Import `@bloxwap/hig/react/css` once on web; tokens CSS is a separate explicit import.

```sh
npm install @bloxwap/hig @bloxwap/chart@^0.5.0
```

`@bloxwap/hig/chart` needs `react` and `@bloxwap/chart` `^0.3.0 || ^0.4.0 || ^0.5.0` (0.5.0 is the tested baseline), and uses `HIGProvider` from `@bloxwap/hig/react/provider` for the localized fallback. `@bloxwap/chart` is the only required peer of `@bloxwap/hig`; no other entry imports it, and there is no `./react/chart` entry.

Pass `position={{side:'long', breakEvenPrice:100, pnl:24.68, capsule:'pnl'}}` for an open position. The trail shades to the supplied break-even price. Above break-even is profitable for a long and below it is profitable for a short. The capsule uses the sign of the host’s actual net P&L independently. Zero is neutral. Omit `capsule` to show the mark price, use `'pnl'` for the signed amount, or supply `{returnRatio:0.02468}` for a signed percentage. The ladder always shows prices.

Uncontrolled AltimeterChart and OutcomeChart expire data after 30 seconds without a valid update and display the localized stale marker until the next update. Built-in feeds reconnect after 30 seconds of silence and report connection loss through the optional second callback, onStale. Cleanup invalidates late callbacks from replaced feeds. Controlled data freshness remains the host's responsibility. Outcome IDs are deduplicated in first-seen order.

## API and anatomy

| Component | Key props and behavior |
| --- | --- |
| `AltimeterChart` | Required `summary`; `price` (host-owned, `null` while unknown) or `feed`; `height` (default 320); `priceOptions`; optional `position`, `targets`, `targetLabelInsets`, `degen` (default false) and `onTargetCross`. |
| `AltimeterTarget` | `{id, price, label?, color?}`. A horizontal dotted level with an optional right-aligned text label and CSS color. |
| `bitcoinPrice` | The default `feed`: the Bitcoin mid price from Hyperliquid's public best-bid/offer WebSocket. |
| `OutcomeChart` | Required `summary`; `outcomes` (host-owned, `null` while unknown) or `feed`; `height` (default 360) and optional `targetLabelInsets`. |
| `championsLeagueWinner` | The default `feed`: the UEFA Champions League winner market on Hyperliquid's outcome markets. |
| `outcomeColors` | The ten default trail and capsule colors, in order. |
| `PriceChart` | `data`, required `summary`, `height`, and chart SDK props. Not in the catalog. |
| `chartTheme` | Token-based colors in sRGB for canvas compatibility. |

`AltimeterChart` is the Bloxwap app's live chart on its own:

- **Grid.** Plus marks on 50px tiles that flow left one tile (50px) per second.
- **Trail.** The price line. It flows left at the same 50px per second, fades toward the leading edge, and is sampled five times a second so it keeps moving on a quiet market.
- **Ladder.** Price ticks 44px apart, about one basis point of price each. The current price stays at the vertical center, so the ladder moves down as the price rises and up as it falls.
- **Current price.** A pill at the trail's tip. Each new price eases in over 300ms, and its changed digits roll through `AnimatedNumberReadout`. Updates arriving during a move continue from the current position and forward velocity, constrained to avoid overshooting the new price. Canvas fonts and ladder text widths are reused between frames; font loading and formatting changes invalidate the width cache.

- **Targets (optional).** Horizontal dotted lines at host-supplied prices, spanning the full chart width from leading to trailing edge, with optional colored text labels aligned at the chart's trailing edge. The current-price pill covers labels where they overlap. Labels have no capsule: a line below the current price has its label just above it, and a line above the current price has its label just below it. Labels follow their lines on the same frame, without a second position tween. Only the above/below offset animates over 260ms, reversing from its current offset when needed. Collision and edge constraints apply after that offset, so labels move aside only to make room for another label or stay inside the chart. Reduced motion switches sides instantly. When a target leaves the visible price range, its line disappears and its price/title label pins to the top or bottom edge. Labels stack in price order, making room for nearby visible labels; they return to their lines as those targets re-enter the chart. Target values also remain available to assistive technology.
- **DEGEN (optional).** A brief shake of the current-price pill and bright, glowing particles fanning mostly in the direction of travel, with a smaller spray in the opposite direction when the displayed price reaches or crosses a target in either direction. It defaults to off.

```tsx
import {AltimeterChart} from '@bloxwap/hig/chart';

// Reference default: live Bitcoin.
<AltimeterChart summary='Live Bitcoin price from Hyperliquid.'/>

// Product: the host owns the price.
<AltimeterChart summary='Ether mark price.' price={mark}/>

// Product targets: the host supplies prices, labels and colors.
<AltimeterChart summary='Ether mark price and position targets.' price={mark}
 targets={[
  {id:'tp',price:takeProfit,label:'Take Profit',color:'var(--hig-buy)'},
  {id:'entry',price:entry,label:'Entry',color:'#6b9fff'},
  {id:'sl',price:stopLoss,label:'Stop Loss',color:'var(--hig-sell)'},
  {id:'liq',price:liquidation,label:'Liquidation',color:'#ed63b3'},
 ]}
 degen
/>
```

A `feed` is `(onPrice) => stop`: call `onPrice` with each new price and return a function that stops the source. It runs only while `price` is omitted. Keep its identity stable (define it outside the component or memoize it), because a new function resubscribes.

Targets use stable, unique IDs and finite positive prices. Pass a new array when a target changes. Invalid targets and duplicate IDs after the first valid occurrence are ignored. Each label shows its title on the left and the formatted target price on the right, for example `Take Profit $100.02`. Titles capitalize each word; prices use the provider's locale and `priceOptions`. Omit `label` for just a dotted line; omit `color` to use the primary accent. Colors accept CSS variables and must remain legible against the chart background. The chart does not place or execute orders.

Use `targetLabelInsets={{top:48, bottom:72}}` on either chart to reserve room for controls over the plot. Each value measures from the plot edge to the outer edge of the label, in CSS pixels on web or layout points on native. Altimeter target text defaults to 8 on each edge. Outcome capsules default to 0. Lines, ticks, and price scaling keep their original coordinates. Outcome connectors follow the displaced capsules.

`degen` responds to the eased, visible price crossing a target, including an exact touch, once per arrival. Initial prices, new or edited target prices, missing data, feed replacement and resuming after a frame gap longer than two seconds re-arm detection without replaying old crossings. Targets crossed in the same frame share one burst using the last crossed target's color. Bursts have a 600ms cooldown with no queue, a 260ms pill shake and a 520ms particle fade. Web bursts use the Web Animations API; unsupported browsers retain the chart and targets. Turning DEGEN off or enabling reduced motion cancels an active effect. `onTargetCross(target, direction)` is called with each burst, with the target the price crossed and `up` or `down`, so a host can add its own sound or haptic; it follows the same cooldown and is silent with DEGEN off or under reduced motion. The catalog's **targets** state includes a DEGEN switch and price controls to preview crossings.

The shake and dispersing particles take their visual cue from [Liveline](https://github.com/benjitaylor/liveline); here the trigger is a target crossing rather than momentum.

`OutcomeChart` shows one question with two to ten outcomes, live, in the same style as `AltimeterChart`:

- **Grid.** The same plus marks, flowing left at 50px per second behind everything else. Columns are 50px apart; there is one row per ladder tick.
- **Ladder.** Percent ticks labeled on the trailing edge as in `AltimeterChart`, with matching marks on the leading edge. It zooms to the range the chances occupy, plus a tenth on each side, on steps of 1, 2, 5 or 10 percent (four to twelve of them), so small moves are visible: clubs between 5% and 22% get a ladder from 2% to 24%. It holds still while chances move inside it and refits when one leaves it or they close in to a third of it. Chances far apart keep the whole 0 to 100%.
- **Trails.** One per outcome: its chance, where a share price of 24¢ sits at 24% on the ladder. Each flows left at 50px per second, fades toward the leading edge, is sampled five times a second, and eases to a new chance over 300ms.
- **Capsules.** One per outcome at the tip of its trail, on the trailing edge over the ladder's labels as `AltimeterChart`'s pill is, stroked in the outcome's color like `AltimeterChart`'s price pill, with the outcome's `label` on the left and its chance as a percentage to three decimals on the right, whose changed digits roll through `AnimatedNumberReadout`. Capsules whose chances are close move apart so none overlap (ten fit in the default height), and a short curve joins each to its trail.

It draws no positions, order entry or selection, and no price history: a trail starts flat and holds only what happened while the chart was on screen (twelve seconds across 600px). Outcomes past the tenth are dropped; group the smallest into one outcome first.

```tsx
import {OutcomeChart} from '@bloxwap/hig/chart';

// Reference default: the Champions League winner (six clubs and Other).
<OutcomeChart summary='UEFA Champions League winner on Hyperliquid.'/>

// Product: the host owns the outcomes.
<OutcomeChart summary='Next FOMC rate decision.' outcomes={[
 {id:'hold',label:'No change',price:.62},
 {id:'cut',label:'Cut',price:.35},
 {id:'hike',label:'Hike',price:.03},
]}/>
```

An outcome is `{id, label, price, color?}`. `price` is the price of one share in dollars, from 0 to 1, or `null` while unknown; pass a new array whenever a price changes. Colors default to `outcomeColors` in order. A `feed` is `(onOutcomes) => stop`, used only while `outcomes` is omitted.

`championsLeagueWinner` finds the open UEFA Champions League winner market that resolves first by name, the venue's most traded market, and follows the live order book of each listed club (the midpoint of the best bid and offer), reporting at most twice a second. Clubs appear under short codes, favorite first as of loading; the order then stays fixed so each keeps its color. `Other` is not traded on its own: it is one minus the listed clubs' prices, shown once every club has a price. The feed checks again every 15 minutes, so when a season settles and leaves the listing it moves to the next one without a reload.

## When to use and examples

Do: pass the product's own `price`, `outcomes` or `feed`, and write a `summary` that names the market and the source. Don’t: ship the default `bitcoinPrice` or `championsLeagueWinner` feeds in a product screen (they are reference feeds that call `api.hyperliquid.xyz`), play effects on ticks, or present the web charts as RN.

## States, interaction and accessibility

`AltimeterChart` is a `<figure>` whose caption is the `summary`. The canvas is hidden from assistive technology; the current price is real text, updated at most five times a second and never announced. Until the first price arrives (or while `price` is `null`) it shows the `loadingChart` message as a status over the moving grid. With reduced motion the grid holds still and prices snap without easing; the trail still advances, because it is the data. Frames stop while the tab is hidden, and the trail restarts flat afterward. Colors come from `useColors()`: the line and pill follow the primary accent, the ladder is `muted` and the grid is `nested`. Prices format as US dollars in the provider's locale unless `priceOptions` says otherwise. It has no pointer or keyboard interaction.

`OutcomeChart` is a `<figure>` whose caption is the `summary`. The canvas and ladder are hidden from assistive technology; the capsules are a real list, so every label and chance is text, never announced as it changes. With no outcomes it shows the `loadingChart` message as a status over the moving grid; an outcome with no price shows a dash and no trail, and waits stacked with the others at the bottom. When its first price arrives its capsule glides from the stack to its place over 500ms. With reduced motion the grid holds still, chances snap without easing and capsules take their places at once; the trails still advance. Frames stop while the tab is hidden, and the trails restart flat afterward. Capsule text is the outcome's color on the `background` color; a host `color` must keep 4.5:1 against it. Percentages format in the provider's locale: three decimals in the capsules, whole percents on the ladder. It has no pointer or keyboard interaction.

Both charts set their numbers in the mono face through `--hig-font-mono`, so they follow the font the page loaded (import `@bloxwap/hig/tokens/css`). The rolling digits need `@bloxwap/hig/react/css`; with reduced motion they change in place.

`PriceChart`: @bloxwap/chart/react loads only on PriceChart render, in Suspense. Token theme covers surface/text/border/grid/crosshair/up/down/fonts; engine owns gestures and cleanup.

State review: rest; keyboard focus/hover (DOM); accepted press and release/cancel; selected/checked where applicable; disabled; busy; inline error/recovery; empty/loading; long translations/large text; reduced motion; sound and haptics disabled. No host action occurs on mere focus. Disabled/busy targets suppress accepted activation. Core has no required feedback backend; the optional provider callback follows the action, honors cancellation and isolates errors.

## Moved from `@bloxwap/hig/react/chart` (#96)

Until #96 the adapter was the `./chart` entry of `@bloxwap/hig/react`, which declared `@bloxwap/chart` as an optional peer. npm 11.6 drops a workspace copy of `@bloxwap/chart` from a lockfile regenerated from scratch without `legacy-peer-deps` whenever an installed package declares it as an optional peer. bloxwap/chart hit this: its `packages/chart` workspace disappeared and `apps/docs` lost `@bloxwap/chart`. Repacking hig-react without that peer kept the link. A required peer does not trigger it, so the adapter moved to its own entry and `@bloxwap/chart` became a required peer. Since 0.2.0 that entry is `@bloxwap/hig/chart` inside the single `@bloxwap/hig` package, whose only required peer is still `@bloxwap/chart`. `npm run smoke:packed-chart-workspace` builds a chart-shaped workspace and regenerates its lockfile from scratch with strict peers, under both the ambient npm and the pinned npm 11.6.1. It fails if the link is lost (see the release chapter).

Migration: replace `@bloxwap/hig/react/chart` with `@bloxwap/hig/chart` in imports. `PriceChart` props and `chartTheme` values are unchanged.

```diff
-import {PriceChart, chartTheme} from '@bloxwap/hig/react/chart';
+import {PriceChart, chartTheme} from '@bloxwap/hig/chart';
```

Consumers: an org-wide GitHub code search (default branches) on 2026-10-16 found no import of `@bloxwap/hig/react/chart` outside this repository. bloxwap/chart, sfx and haptic import only other hig-react entries, and chart builds its own theme from `@bloxwap/hig/tokens`. The candidate was never published. The release chapter normally keeps a deprecated export working for a minor release, but that is skipped here: there are no consumers to migrate, and a working shim would need the optional peer that causes the bug. Hosts that only use other hig-react entries change nothing. bloxwap/chart can drop the `legacy-peer-deps` regeneration note in `vendor/bloxwap-hig/README.md` at its next HIG refresh.

## Platform mapping and limits

The altimeter defaults to Bloxwap green for gains and pink-red for losses. Web requests a Display P3 canvas and uses the sRGB palette when P3 colours are unsupported. React Native uses the Display P3 palette on iOS when the host renders in P3 and sets `HIGProvider colorSpace="display-p3"`. Android uses the sRGB equivalents.

The React Native altimeter uses `react-native-svg` on iOS and Android. Its renderer limits SVG updates to 30 Hz, keeps a bounded sample history, caches ladder labels, and uses the price sample cadence under reduced motion. Physical-device frame times are unmeasured. For outcome and candle charts, native consumers use labeled readouts or lists.

## Validation and citation

See `tests/native/altimeter-chart.test.cjs`, `tests/altimeter-chart.dom.test.tsx`, `tests/altimeter-model.test.ts`, `tests/outcome-chart.dom.test.tsx`, `tests/outcome-model.test.ts`, `tests/chart.dom.test.tsx`, `tests/components.dom.test.tsx`, `tests/native/components.test.cjs`, consumer fixtures and milestone evidence. Physical hardware, assistive-technology and baseline product comparisons are unperformed unless linked explicitly. Cite HIG 0.1.0 with this chapter anchor and a commit permalink, not a mutable preview branch. Preserve business behavior behind a host rollback flag during adoption.
