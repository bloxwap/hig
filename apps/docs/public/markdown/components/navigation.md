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

Tabs use selected states and one active panel; DOM Arrow/Home/End keys, RTL-aware arrow mapping. On DOM the active panel is a tab stop only when its content does not start with a focusable element, so a panel that opens with an `InstallCommand` or `CodeWindow` (focusable `pre`) or a button adds no second, empty tab stop. Accordion uses details/summary on DOM and expanded Pressable on RN. Search results are visible action lists; keyboard shortcuts belong to host.

State review: rest; keyboard focus/hover (DOM); accepted press and release/cancel; selected/checked where applicable; disabled; busy; inline error/recovery; empty/loading; long translations/large text; reduced motion; sound and haptics disabled. No host action occurs on mere focus. Disabled/busy targets suppress accepted activation. Core has no required feedback backend; the optional provider callback follows the action, honors cancellation and isolates errors.

## Platform mapping and limits

Breadcrumb is DOM-specific; native host routes plus BackButton are supported alternatives. No fuzzy-search engine, command palette shortcut hijacking or native hardware-keyboard certification.

## Validation and citation

See `tests/components.dom.test.tsx`, `tests/native/components.test.cjs`, consumer fixtures and milestone evidence. Physical hardware, assistive-technology and baseline product comparisons are unperformed unless linked explicitly. Cite HIG 0.1.0 with this chapter anchor and a commit permalink, not a mutable preview branch. Preserve business behavior behind a host rollback flag during adoption.
