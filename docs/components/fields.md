# Fields & inputs · HIG 0.1.0

Labeled inputs for text, search, and amounts, with visible help and validation.

Includes `Field`, `Label`, `Input`, `TextArea`, `AmountInput`, and `SearchInput`.

Issue #14. Entry: `field`. Import platform entries from `@bloxwap/hig-react/field` or `@bloxwap/hig-native/field` according to applicability below. Import `@bloxwap/hig-react/css` once on web; tokens CSS is a separate explicit import.

## API and anatomy

| Component | Key props and behavior |
| --- | --- |
| `Field` | `label`, `id` (web), `description`, `error`, `required`, and `disabled`. |
| `Input`, `TextArea` | Platform input props and forwarded refs. |
| `AmountInput` | Text input with decimal keyboard hints; `value` stays a raw string. |

## When to use and examples

Do: label Amount (BTC), describe available funds, keep 0,001 unchanged until host validates locale. Don’t: placeholder-only labels, Number(raw) on every keystroke, or strip IME text.

## States, interaction and accessibility

DOM label/id plus help/error aria-describedby; invalid state is explicit. Field required propagates to Input/TextArea for browser required semantics and form validation; explicit input props can override required. A disabled Field keeps its controls disabled even if a child requests otherwise. Native amount keyboardType and search returnKeyType remain host-overridable defaults for locale/negative-entry and submit flows. RN visible label plus accessibilityLabel/Hint; errors stay visible and live. Secure input and autofill remain host-controlled native props.

State review: rest; keyboard focus/hover (DOM); accepted press and release/cancel; selected/checked where applicable; disabled; busy; inline error/recovery; empty/loading; long translations/large text; reduced motion; sound and haptics disabled. No host action occurs on mere focus. Disabled/busy targets suppress accepted activation. Core has no required feedback backend; the optional provider callback follows the action, honors cancellation and isolates errors.

## Platform mapping and limits

RN decimal-pad has locale/platform differences; no implicit money parser. Host owns safe area and keyboard avoidance. IME/device input observations remain pending.

## Validation and citation

See `tests/components.dom.test.tsx`, `tests/native/components.test.cjs`, consumer fixtures and milestone evidence. Physical hardware, assistive-technology and baseline product comparisons are unperformed unless linked explicitly. Cite HIG 0.1.0 with this chapter anchor and a commit permalink, not a mutable preview branch. Preserve business behavior behind a host rollback flag during adoption.
