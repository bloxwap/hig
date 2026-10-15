# Financial data · HIG 0.1.0

Readable numbers, metrics, lists, and tables for host-provided financial data.

Includes `NumberReadout`, `AnimatedNumberReadout`, `Usd`, `Percent`, `Metric`, `Stat`, `Row`, and `List`. `Table` is web-only; native uses labeled lists.

Issue #19. Entry: `data`. Import platform entries from `@bloxwap/hig-react/data` or `@bloxwap/hig-native/data` according to applicability below. Import `@bloxwap/hig-react/css` once on web; tokens CSS is a separate explicit import.

## API and anatomy

| Component | Key props and behavior |
| --- | --- |
| Readouts | `value` accepts a number, `null`, or `undefined`. Locale comes from the provider; `options`, `stale`, and `label` control presentation. |
| `List` | `items`, `keyFor`, `render`, `empty`, `label`, `loading`, `error`, `onRetry`, and `onLoadMore`. |
| `Table` | `caption`, `rows`, `columns`, and `keyFor`; optional host sorting callbacks. |

Loading keeps existing rows visible, suppresses a misleading empty message, and disables pagination and retry until ready. Error text remains visible with an optional host retry action. Native lists use FlatList virtualization; stable host keys preserve identity during live updates.

## When to use and examples

Do: show — for unknown and 0 for zero; mark stale. Don’t: turn a formatted number into order quantity or announce every live tick.

## States, interaction and accessibility

Readouts are static and tabular, respecting reduced motion. Percent uses percent points (5 is 5%), with localized percent placement/digits and a single native text readout. Intl options control precision/trailing zeros/sign; percent style is enforced. Unknown/nonfinite values stay —. DOM table caption/column headers/aria-sort and scroll region; RN FlatList labeled-row alternative with stable keys.

State review: rest; keyboard focus/hover (DOM); accepted press and release/cancel; selected/checked where applicable; disabled; busy; inline error/recovery; empty/loading; long translations/large text; reduced motion; sound and haptics disabled. No host action occurs on mere focus. Disabled/busy targets suppress accepted activation. Core has no required feedback backend; the optional provider callback follows the action, honors cancellation and isolates errors.

## Platform mapping and limits

Numbers are display-only IEEE numeric inputs, no decimal arithmetic or hidden parser. Exact financial strings remain host-owned. No heavy DataTable engine; optional virtualization/sorting belongs to host. Native list device performance pending.

## Validation and citation

See `tests/components.dom.test.tsx`, `tests/native/components.test.cjs`, consumer fixtures and milestone evidence. Physical hardware, assistive-technology and baseline product comparisons are unperformed unless linked explicitly. Cite HIG 0.1.0 with this chapter anchor and a commit permalink, not a mutable preview branch. Preserve business behavior behind a host rollback flag during adoption.

## Optional number motion

`AnimatedNumberReadout` lives in the separate `animated-number` entry on both platforms. It fades the final localized reading on a deliberate value change, using Web Animations or the RN native opacity driver. It never interpolates financial values or adds a live region. Reduced motion, unknown values and changes less than 250 ms apart use the static final reading; pending motion is canceled on replacement/unmount. No animation engine is imported by the ordinary `data` entry. Example: `import {AnimatedNumberReadout} from '@bloxwap/hig-react/animated-number'` (or `hig-native/animated-number`), then `<AnimatedNumberReadout value={price} label="Price" options={{style:'currency',currency:'USD'}} />`. The same gallery manifest contains runnable examples for both renderers.
