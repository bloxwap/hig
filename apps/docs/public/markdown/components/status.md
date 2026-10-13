# Badge, Alert/Callout, Toast, Progress, Spinner, Skeleton, EmptyState, Avatar, StatusIndicator · HIG 0.1.0

Issue #18. Entry: `status`. Import platform entries from `@bloxwap/hig-react/status` or `@bloxwap/hig-native/status` according to applicability below. Import `@bloxwap/hig-react/css` once on web; tokens CSS is a separate explicit import.

## API and anatomy

Alert title/severity/action; Toast notices with stable id/message/severity/action, onDismiss. Progress label/value/max; EmptyState title/description/action.

## When to use and examples

Do: keep critical failure inline with Retry; use toast for copied acknowledgement. Don’t: dismiss critical text on a timer or rely on audio for success.

## States, interaction and accessibility

Notifications deduplicate ids, show at most 3, and stay until explicit dismissal. DOM status/alert regions and RN live regions preserve visible messages. Skeleton and spinner are static under candidate motion policy.

State review: rest; keyboard focus/hover (DOM); accepted press and release/cancel; selected/checked where applicable; disabled; busy; inline error/recovery; empty/loading; long translations/large text; reduced motion; sound and haptics disabled. No host action occurs on mere focus. Disabled/busy targets suppress accepted activation. Core has no required feedback backend; the optional provider callback follows the action, honors cancellation and isolates errors.

## Platform mapping and limits

Toast is an inline notification stack, no mandatory portal/timer backend. Host owns delivery ordering/persistence. VoiceOver/TalkBack observations are pending, automated role/state tests are not device evidence.

## Validation and citation

See `tests/components.dom.test.tsx`, `tests/native/components.test.cjs`, consumer fixtures and milestone evidence. Physical hardware, assistive-technology and baseline product comparisons are unperformed unless linked explicitly. Cite HIG 0.1.0 with this chapter anchor and a commit permalink, not a mutable preview branch. Preserve business behavior behind a host rollback flag during adoption.
