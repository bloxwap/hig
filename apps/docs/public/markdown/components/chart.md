# Charts · HIG 0.1.0

Web price charts with text summaries and native readout alternatives.

Includes web-only `PriceChart` and `chartTheme`. Native uses readouts, lists, and text summaries.

Issue #20. Entry: `chart`. Import platform entries from `@bloxwap/hig-react/chart` for the DOM canvas integration only. Native consumers use `@bloxwap/hig-native/data` for summary/readout/list alternatives. Import `@bloxwap/hig-react/css` once on web; tokens CSS is a separate explicit import.

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

## Platform mapping and limits

RN canvas is unsupported in this candidate. Use NumberReadout/List plus host summaries. A native chart engine/WebView bridge needs a separate supported target and device lifecycle review, rather than an invented integration.

## Validation and citation

See `tests/components.dom.test.tsx`, `tests/native/components.test.cjs`, consumer fixtures and milestone evidence. Physical hardware, assistive-technology and baseline product comparisons are unperformed unless linked explicitly. Cite HIG 0.1.0 with this chapter anchor and a commit permalink, not a mutable preview branch. Preserve business behavior behind a host rollback flag during adoption.
