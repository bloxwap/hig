# Charts · HIG 0.1.0

Web price charts with text summaries and native readout alternatives.

Includes web-only `PriceChart` and `chartTheme`. Native uses readouts, lists, and text summaries.

Issues #20 and #96. Package: `@bloxwap/hig-chart`. Import `PriceChart` and `chartTheme` from `@bloxwap/hig-chart` for the DOM canvas integration only. Native consumers use `@bloxwap/hig-native/data` for summary/readout/list alternatives. Import `@bloxwap/hig-react/css` once on web; tokens CSS is a separate explicit import.

```sh
npm install @bloxwap/hig-chart @bloxwap/hig-react @bloxwap/chart@^0.3.0
```

`@bloxwap/hig-chart` has three required peers: `react`, `@bloxwap/hig-react` (its `HIGProvider` supplies the localized fallback) and `@bloxwap/chart` `^0.3.0`. Its dependencies are `@bloxwap/hig-tokens` and `@bloxwap/hig-contracts`. `@bloxwap/hig-react` itself declares no `@bloxwap/chart` peer and has no `./chart` entry.

## API and anatomy

| Component | Key props and behavior |
| --- | --- |
| `PriceChart` | `data`, required `summary`, `height`, and chart SDK props. |
| `chartTheme` | Token-based colors in sRGB for canvas compatibility. |

## When to use and examples

Do: provide host-generated price/trend summary and lazy-load chart on demand. Don’t: play effects on ticks or present web canvas as RN.

## States, interaction and accessibility

@bloxwap/chart/react loads only on PriceChart render, in Suspense. Token theme covers surface/text/border/grid/crosshair/up/down/fonts; engine owns gestures and cleanup.

State review: rest; keyboard focus/hover (DOM); accepted press and release/cancel; selected/checked where applicable; disabled; busy; inline error/recovery; empty/loading; long translations/large text; reduced motion; sound and haptics disabled. No host action occurs on mere focus. Disabled/busy targets suppress accepted activation. Core has no required feedback backend; the optional provider callback follows the action, honors cancellation and isolates errors.

## Moved from `@bloxwap/hig-react/chart` (#96)

Until #96 the adapter was the `./chart` entry of `@bloxwap/hig-react`, which declared `@bloxwap/chart` as an optional peer. npm 11.6 drops a workspace copy of `@bloxwap/chart` from a lockfile regenerated from scratch without `legacy-peer-deps` whenever an installed package declares it as an optional peer. bloxwap/chart hit this: its `packages/chart` workspace disappeared and `apps/docs` lost `@bloxwap/chart`. Repacking hig-react without that peer kept the link. A required peer on a separate package does not trigger it, so the adapter moved to `@bloxwap/hig-chart` and the peer is required there. `npm run smoke:packed-chart-workspace` builds a chart-shaped workspace and regenerates its lockfile from scratch with strict peers, under both the ambient npm and the pinned npm 11.6.1. It fails if the link is lost (see the release chapter).

Migration: replace `@bloxwap/hig-react/chart` with `@bloxwap/hig-chart` in imports and add `@bloxwap/hig-chart` next to `@bloxwap/hig-react`. `PriceChart` props and `chartTheme` values are unchanged.

```diff
-import {PriceChart, chartTheme} from '@bloxwap/hig-react/chart';
+import {PriceChart, chartTheme} from '@bloxwap/hig-chart';
```

Consumers: an org-wide GitHub code search (default branches) on 2026-10-16 found no import of `@bloxwap/hig-react/chart` outside this repository. bloxwap/chart, sfx and haptic import only other hig-react entries, and chart builds its own theme from `@bloxwap/hig-tokens`. The candidate was never published. The release chapter normally keeps a deprecated export working for a minor release, but that is skipped here: there are no consumers to migrate, and a working shim would need the optional peer that causes the bug. Hosts that only use other hig-react entries change nothing. bloxwap/chart can drop the `legacy-peer-deps` regeneration note in `vendor/bloxwap-hig/README.md` at its next HIG refresh.

## Platform mapping and limits

RN canvas is unsupported in this candidate. Use NumberReadout/List plus host summaries. A native chart engine/WebView bridge needs a separate supported target and device lifecycle review, rather than an invented integration.

## Validation and citation

See `tests/components.dom.test.tsx`, `tests/native/components.test.cjs`, consumer fixtures and milestone evidence. Physical hardware, assistive-technology and baseline product comparisons are unperformed unless linked explicitly. Cite HIG 0.1.0 with this chapter anchor and a commit permalink, not a mutable preview branch. Preserve business behavior behind a host rollback flag during adoption.
