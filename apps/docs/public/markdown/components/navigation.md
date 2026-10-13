# Tabs, Accordion, Pagination, Navigation, Search; DOM Breadcrumb; RN BackButton/BottomNavigation · HIG 0.1.0

Issue #17. Entry: `navigation`. Import platform entries from `@bloxwap/hig-react/navigation` or `@bloxwap/hig-native/navigation` according to applicability below. Import `@bloxwap/hig-react/css` once on web; tokens CSS is a separate explicit import.

## API and anatomy

Tabs label/items/value/defaultValue/onValueChange. Items include content and disabled. Navigation takes DOM hrefs or RN host callbacks. Search takes query/results/loading/error; no bundled search index/router.

## When to use and examples

Do: expose current location and keep deep-link ownership with host. Don’t: replace native back with a browser history dependency.

## States, interaction and accessibility

Tabs use selected states and one active panel; DOM Arrow/Home/End keys, RTL-aware arrow mapping. Accordion uses details/summary on DOM and expanded Pressable on RN. Search results are visible action lists; keyboard shortcuts belong to host.

State review: rest; keyboard focus/hover (DOM); accepted press and release/cancel; selected/checked where applicable; disabled; busy; inline error/recovery; empty/loading; long translations/large text; reduced motion; sound and haptics disabled. No host action occurs on mere focus. Disabled/busy targets suppress accepted activation. Core has no required feedback backend; the optional provider callback follows the action, honors cancellation and isolates errors.

## Platform mapping and limits

Breadcrumb is DOM-specific; native host routes plus BackButton are supported alternatives. No fuzzy-search engine, command palette shortcut hijacking or native hardware-keyboard certification.

## Validation and citation

See `tests/components.dom.test.tsx`, `tests/native/components.test.cjs`, consumer fixtures and milestone evidence. Physical hardware, assistive-technology and baseline product comparisons are unperformed unless linked explicitly. Cite HIG 0.1.0 with this chapter anchor and a commit permalink, not a mutable preview branch. Preserve business behavior behind a host rollback flag during adoption.
