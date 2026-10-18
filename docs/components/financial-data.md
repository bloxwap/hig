# Financial data · HIG 0.1.0

Readable numbers, metrics, lists, and tables for host-provided financial data.

Includes `NumberReadout`, `AnimatedNumberReadout`, `Usd`, `Percent`, `Metric`, `Stat`, `Row`, and `List`. `Table` is web-only; native uses labeled lists.

Issue #19. Entry: `data`. Import platform entries from `@bloxwap/hig-react/data` or `@bloxwap/hig-native/data` according to applicability below. Import `@bloxwap/hig-react/css` once on web; tokens CSS is a separate explicit import.

## API and anatomy

| Component | Key props and behavior |
| --- | --- |
| Readouts | `value` accepts a number, `null`, or `undefined`. Locale comes from the provider; `options`, `stale`, and `label` control presentation. |
| `List` | `items`, `keyFor`, `render`, `empty`, `label`, `loading`, `error`, `onRetry`, and `onLoadMore`. |
| `Table` (web) | `caption`, `rows`, `columns`, and `keyFor`; optional host sorting callbacks. Column `align` accepts logical `start`, `center`, or `end`. `rowProps(row, index)` forwards row highlights, styles, data/ARIA attributes and events. `captionHidden`, `stickyHeader`, `loading`, and `state` support dense product tables. |

Loading keeps existing rows visible, suppresses a misleading empty message, and disables pagination and retry until ready. Error text remains visible with an optional host retry action. Native lists use FlatList virtualization; stable host keys preserve identity during live updates.

Native readouts, including `Usd`, `Percent`, and `AnimatedNumberReadout`, accept `tone="text" | "positive" | "negative" | "muted"`, `testID`, and a constrained typography `style`. The style accepts `fontFamily`, `fontSize`, `fontWeight`, `lineHeight`, `letterSpacing`, and `textAlign`, including registered styles and arrays. The tone resolves through the provider palette; it is explicit rather than inferred from the sign. Colour and tabular numeric glyphs stay controlled by the readout. Font scale follows HIG Text and the provider; `maxFontSizeMultiplier` can override its cap.

For a branded 20 px equity pill, use `<NumberReadout value={equity} label="Equity" testID="equity" style={{fontFamily:'BloxwapMonoSemiBold',fontSize:20,lineHeight:28}} />` with a registered host font. For signed PnL, add `tone={pnl < 0 ? 'negative' : 'positive'}` and `options={{signDisplay:'always'}}`. The same props on `AnimatedNumberReadout` style and identify the final text reading; opacity motion stays on its wrapper.

Native readouts also accept `formattedValue` for a host's existing static display format, such as `<NumberReadout value={90} formattedValue="01:30" label="Time remaining" />`. The host owns this opaque display text and its localization; never parse it for submission or calculations. A finite numeric `value` is still required: `null`, `undefined`, `NaN`, and infinities display the canonical unknown dash even if text is supplied. An empty string falls back to the usual locale and `options` formatting. Stale text, the accessible label, semantic tone, and tabular typography still apply to the resulting reading. Existing moving digit reels need an explicit motion decision before switching to a static readout.

Web tables keep a visible caption and ordinary headers by default. Set `captionHidden` when a visible section already names the table: the caption remains its accessible name. `stickyHeader` pins header cells within a bounded scroll region; give the region a height through `style` or `className`. `tableClassName` styles the table itself. Sorting still belongs to the host, and sort buttons retain native keyboard activation and `aria-sort`.

```tsx
<Table caption='Positions' captionHidden stickyHeader style={{maxHeight:320}}
  rows={positions} keyFor={row=>row.id}
  rowProps={row=>({className:row.current?'current-market':undefined,'aria-current':row.current?'true':undefined})}
  columns={[
    {key:'market',label:'Market',render:row=>row.symbol},
    {key:'balance',label:'Balance',align:'end',render:row=><NumberReadout value={row.balance}/>},
  ]}
  loading={refreshing}
  state={error?<div role='alert'>{error}<button type='button' onClick={retry}>Retry</button></div>:undefined}/>
```

The `state` slot is content for one cell spanning all columns; it can contain an empty explanation, loading skeleton, or error and retry UI. Pass content rather than `tr`/`td` elements. Existing data rows remain visible. Without a custom state, `loading` exposes the provider's `loading` message and `aria-busy`; an empty, idle table shows `noRows`. `state={null}` suppresses that fallback. Give custom errors an alert role and custom loading content a status role when an announcement is appropriate. `rowProps` cannot replace the row's native role or HIG's cells with `children`/HTML. Row callbacks do not add a selection keyboard model; use native controls inside cells for actions.

## When to use and examples

Do: show — for unknown and 0 for zero; mark stale. Don’t: turn a formatted number into order quantity or announce every live tick. Locale display, USD vs USDC, signed PnL and compact notation follow the [localization guide](../foundations/localization.md). Vocabulary follows the [glossary](../foundations/glossary.md).

## States, interaction and accessibility

Readouts are static and tabular, respecting reduced motion. Percent uses percent points (5 is 5%), with localized percent placement/digits and a single native text readout. Intl options control precision/trailing zeros/sign; percent style is enforced. Unknown/nonfinite values stay —. DOM table caption/column headers/aria-sort and scroll region; RN FlatList labeled-row alternative with stable keys.

State review: rest; keyboard focus/hover (DOM); accepted press and release/cancel; selected/checked where applicable; disabled; busy; inline error/recovery; empty/loading; long translations/large text; reduced motion; sound and haptics disabled. No host action occurs on mere focus. Disabled/busy targets suppress accepted activation. Core has no required feedback backend; the optional provider callback follows the action, honors cancellation and isolates errors.

## Platform mapping and limits

Numbers are display-only IEEE numeric inputs, no decimal arithmetic or hidden parser. Exact financial strings remain host-owned. No heavy DataTable engine; optional virtualization/sorting belongs to host. Native list device performance pending.

## Validation and citation

See `tests/components.dom.test.tsx`, `tests/pro-data.dom.test.tsx`, `tests/pro-data-typecheck.tsx`, `tests/native/components.test.cjs`, consumer fixtures and milestone evidence. Physical hardware, assistive-technology and baseline product comparisons are unperformed unless linked explicitly. Cite HIG 0.1.0 with this chapter anchor and a commit permalink, not a mutable preview branch. Preserve business behavior behind a host rollback flag during adoption.

## Optional number motion

`AnimatedNumberReadout` lives in the separate `animated-number` entry on both platforms. It fades the final localized reading on a deliberate value change, using Web Animations or the RN native opacity driver. It never interpolates financial values or adds a live region. Reduced motion, unknown values and changes less than 250 ms apart use the static final reading; pending motion is canceled on replacement/unmount. No animation engine is imported by the ordinary `data` entry. Example: `import {AnimatedNumberReadout} from '@bloxwap/hig-react/animated-number'` (or `hig-native/animated-number`), then `<AnimatedNumberReadout value={price} label="Price" options={{style:'currency',currency:'USD'}} />`. The same gallery manifest contains runnable examples for both renderers.
