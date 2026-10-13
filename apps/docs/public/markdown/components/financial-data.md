# NumberReadout, Usd, Percent, Metric/Stat, Row, List; DOM Table · HIG 0.1.0

Issue #19. Entry: `data`. Import platform entries from `@bloxwap/hig-react/data` or `@bloxwap/hig-native/data` according to applicability below. Import `@bloxwap/hig-react/css` once on web; tokens CSS is a separate explicit import.

## API and anatomy

Readout value:number|null|undefined, locale from provider, Intl options, stale, label. List items/keyFor/render/empty. Table caption/rows/columns/keyFor; optional host sorting callbacks.

## When to use and examples

Do: show — for unknown and 0 for zero; mark stale. Don’t: turn a formatted number into order quantity or announce every live tick.

## States, interaction and accessibility

Readouts are static and tabular, respecting reduced motion. Percent uses percent points (5 is 5%). DOM table caption/column headers/aria-sort and scroll region; RN FlatList labeled-row alternative with stable keys.

State review: rest; keyboard focus/hover (DOM); accepted press and release/cancel; selected/checked where applicable; disabled; busy; inline error/recovery; empty/loading; long translations/large text; reduced motion; sound and haptics disabled. No host action occurs on mere focus. Disabled/busy targets suppress accepted activation. Core has no required feedback backend; the optional provider callback follows the action, honors cancellation and isolates errors.

## Platform mapping and limits

Numbers are display-only IEEE numeric inputs, no decimal arithmetic or hidden parser. Exact financial strings remain host-owned. No heavy DataTable engine; optional virtualization/sorting belongs to host. Native list device performance pending.

## Validation and citation

See `tests/components.dom.test.tsx`, `tests/native/components.test.cjs`, consumer fixtures and milestone evidence. Physical hardware, assistive-technology and baseline product comparisons are unperformed unless linked explicitly. Cite HIG 0.1.0 with this chapter anchor and a commit permalink, not a mutable preview branch. Preserve business behavior behind a host rollback flag during adoption.
