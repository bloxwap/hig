# Field, Label, Input, TextArea, AmountInput, SearchInput · HIG 0.1.0

Issue #14. Entry: `field`. Import platform entries from `@bloxwap/hig-react/field` or `@bloxwap/hig-native/field` according to applicability below. Import `@bloxwap/hig-react/css` once on web; tokens CSS is a separate explicit import.

## API and anatomy

Field label, id (DOM), description, error, required, disabled; Input/TextArea expose native platform props and refs. AmountInput is text/decimal mode; value stays raw string.

## When to use and examples

Do: label Amount (BTC), describe available funds, keep 0,001 unchanged until host validates locale. Don’t: placeholder-only labels, Number(raw) on every keystroke, or strip IME text.

## States, interaction and accessibility

DOM label/id plus help/error aria-describedby; invalid state is explicit. RN visible label plus accessibilityLabel/Hint; errors stay visible and live. Secure input and autofill remain host-controlled native props.

State review: rest; keyboard focus/hover (DOM); accepted press and release/cancel; selected/checked where applicable; disabled; busy; inline error/recovery; empty/loading; long translations/large text; reduced motion; sound and haptics disabled. No host action occurs on mere focus. Disabled/busy targets suppress accepted activation. Core has no required feedback backend; the optional provider callback follows the action, honors cancellation and isolates errors.

## Platform mapping and limits

RN decimal-pad has locale/platform differences; no implicit money parser. Host owns safe area and keyboard avoidance. IME/device input observations remain pending.

## Validation and citation

See `tests/components.dom.test.tsx`, `tests/native/components.test.cjs`, consumer fixtures and milestone evidence. Physical hardware, assistive-technology and baseline product comparisons are unperformed unless linked explicitly. Cite HIG 0.1.0 with this chapter anchor and a commit permalink, not a mutable preview branch. Preserve business behavior behind a host rollback flag during adoption.
