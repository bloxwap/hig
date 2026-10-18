# Navigation · HIG 0.1.0

Tabs, disclosure, search, and navigation that keep the current location clear.

Includes `Tabs`, `Accordion`, `Pagination`, `Navigation`, and `Search`. `Breadcrumb` is web-only; native alternatives include `BackButton` and `BottomNavigation`.

Issue #17. Entry: `navigation`. Import platform entries from `@bloxwap/hig-react/navigation` or `@bloxwap/hig-native/navigation` according to applicability below. Import `@bloxwap/hig-react/css` once on web; tokens CSS is a separate explicit import.

## API and anatomy

| Component | Key props and behavior |
| --- | --- |
| `Tabs` | `label`, `items`, `value`, `defaultValue`, and `onValueChange`. Items include panel content and optional `disabled`. |
| `Navigation` | Web links use `href`; native destinations use host callbacks. |
| `Search` | `query`, `results`, `loading`, and `error`. The host supplies the search index and router. |

## When to use and examples

Do: expose current location and keep deep-link ownership with host. Don’t: replace native back with a browser history dependency.

## States, interaction and accessibility

Tabs use selected states and one active panel; DOM Arrow/Home/End keys, RTL-aware arrow mapping. Only the selected tab is in the Tab order. The active DOM panel is a tab stop only when its first content is not focusable. When the panel starts with a focusable element, such as the `InstallCommand` `pre`, that element is the single stop after the tab list. Panels that start with text keep `tabIndex=0` so their content stays reachable. Server and hydration markup render every panel with `tabIndex=0`; on the client a layout effect corrects the shown panel before paint, in the same commit that shows it, so a panel that starts with a focusable element is never an extra stop after a tab switch. Accordion uses details/summary on DOM and expanded Pressable on RN. Search results are visible action lists; keyboard shortcuts belong to host.

State review: rest; keyboard focus/hover (DOM); accepted press and release/cancel; selected/checked where applicable; disabled; busy; inline error/recovery; empty/loading; long translations/large text; reduced motion; sound and haptics disabled. No host action occurs on mere focus. Disabled/busy targets suppress accepted activation. Core has no required feedback backend; the optional provider callback follows the action, honors cancellation and isolates errors.

## Platform mapping and limits

Breadcrumb is DOM-specific; native host routes plus BackButton are supported alternatives. No fuzzy-search engine, command palette shortcut hijacking or native hardware-keyboard certification.

## Validation and citation

See `tests/components.dom.test.tsx`, `tests/native/components.test.cjs`, consumer fixtures and milestone evidence. Physical hardware, assistive-technology and baseline product comparisons are unperformed unless linked explicitly. Cite HIG 0.1.0 with this chapter anchor and a commit permalink, not a mutable preview branch. Preserve business behavior behind a host rollback flag during adoption.
