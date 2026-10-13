# Button, IconButton, Link, Text, Heading, Stack, Inline, Surface/Card, Separator · HIG 0.1.0

Issue #13. Entry: `button / surface`. Import platform entries from `@bloxwap/hig-react/button` or `@bloxwap/hig-native/button` according to applicability below. Import `@bloxwap/hig-react/css` once on web; tokens CSS is a separate explicit import.

## API and anatomy

Button children, intent (primary/secondary/destructive/ghost), busy, disabled, fullWidth, suppressFeedback, forwarded ref. DOM onClick; RN onPress. Text/Heading accept platform text props. Stack/Inline/Surface accept platform layout props.

## When to use and examples

Use one primary review action. Do: busy protects host requests and displays Working. Don’t: use destructive red for every sell button.

## States, interaction and accessibility

DOM semantic button/anchor, forwarded focus, target min-height tied to density; RN target always at least 48. Multiline labels wrap; RN custom children render in a View with text nodes styled individually.

State review: rest; keyboard focus/hover (DOM); accepted press and release/cancel; selected/checked where applicable; disabled; busy; inline error/recovery; empty/loading; long translations/large text; reduced motion; sound and haptics disabled. No host action occurs on mere focus. Disabled/busy targets suppress accepted activation. Core has no required feedback backend; the optional provider callback follows the action, honors cancellation and isolates errors.

## Platform mapping and limits

RN external Link uses Linking; routes belong to host. Native fontFamily only after registration. Decorative SVG hidden; IconButton label is mandatory.

## Validation and citation

See `tests/components.dom.test.tsx`, `tests/native/components.test.cjs`, consumer fixtures and milestone evidence. Physical hardware, assistive-technology and baseline product comparisons are unperformed unless linked explicitly. Cite HIG 0.1.0 with this chapter anchor and a commit permalink, not a mutable preview branch. Preserve business behavior behind a host rollback flag during adoption.
