# Dialog, AlertDialog, Sheet, Menu; DOM Popover/Tooltip; RN HelpText · HIG 0.1.0

Issue #16. Entry: `overlay`. Import platform entries from `@bloxwap/hig-react/overlay` or `@bloxwap/hig-native/overlay` according to applicability below. Import `@bloxwap/hig-react/css` once on web; tokens CSS is a separate explicit import.

## API and anatomy

Dialog controlled open/onOpenChange, title, description, children; DOM trigger is a ref-capable single element. Menu label and {label,disabled,onSelect} items.

## When to use and examples

Do: repeat the order amount and give an explicit cancel action. Don’t: hide essential terms in hover help or execute confirm on open.

## States, interaction and accessibility

DOM Radix focus scopes restore trigger focus, trap modal focus, handle Escape and scroll locks. AlertDialog blocks outside-click dismissal. Menus use roving keyboard focus. Native Modal owns back and keyboard avoidance with scrollable content.

State review: rest; keyboard focus/hover (DOM); accepted press and release/cancel; selected/checked where applicable; disabled; busy; inline error/recovery; empty/loading; long translations/large text; reduced motion; sound and haptics disabled. No host action occurs on mere focus. Disabled/busy targets suppress accepted activation. Core has no required feedback backend; the optional provider callback follows the action, honors cancellation and isolates errors.

## Platform mapping and limits

Sheet currently uses accessible modal layout, no gesture-detent certification. RN focus restoration/VoiceOver nesting needs host/device validation. Native help is persistent text; no hover tooltip or anchored popover claim.

## Validation and citation

See `tests/components.dom.test.tsx`, `tests/native/components.test.cjs`, consumer fixtures and milestone evidence. Physical hardware, assistive-technology and baseline product comparisons are unperformed unless linked explicitly. Cite HIG 0.1.0 with this chapter anchor and a commit permalink, not a mutable preview branch. Preserve business behavior behind a host rollback flag during adoption.
