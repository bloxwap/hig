# Fields & inputs

Labeled inputs for text, search, and amounts, with visible help and validation.

Includes `Field`, `Label`, `Input`, `TextArea`, `SearchInput`, and `TradeEntry`.

Issue #14. Entry: `field`. Import platform entries from `@bloxwap/hig/react/field` or `@bloxwap/hig/native/field` according to applicability below. Import `@bloxwap/hig/react/css` once on web; tokens CSS is a separate explicit import.

Field owns its control ID, required state, and error associations; put one Input or TextArea in each Field. Child descriptions are merged with the Field description. SearchInput forwards callback-ref cleanup on detach.

## API and anatomy

| Component | Key props and behavior |
| --- | --- |
| `Field` | `label`, `id` (web), `description`, `error`, `required`, and `disabled`. `descriptionTone='positive'` draws the description as a success line in the positive role, such as a name that is available, and announces it when it changes while shown (web: a polite live region; Android: a polite live region; iOS: an explicit announcement). The words carry the meaning; the colour repeats it. |
| `SearchInput` | `Input` props plus `trailing` (host content inside the field's trailing edge, such as a filter button) and `onClear` (a clear button on the trailing edge while the controlled `value` is not empty; it calls `onClear` and returns focus to the field). The clear button is named by `clearLabel` or HIGProvider `messages.clearSearch` (“Clear search”), is 44 units on web (takes the `'icon-button'` press decoration) and 44dp reaching 48dp through `hitSlop` on native. It is disabled with the input, including inside a disabled `Field`. With either prop the text stops 48 units short of the trailing edge, whether or not the clear button is shown, so typed text never reflows; wider trailing content sets the input's end padding itself. On web the browser's own search cancel button is hidden then. |
| `Input`, `TextArea` | Platform input props and forwarded refs. `Input` also takes `prefix`: host text on the leading edge inside the field, before what is typed, such as `@` for a handle or `$` for an amount. It is drawn muted, is not part of the value, and the text starts just after it (web: the capsule moves to a `span.hig-input-affix` that carries the fill, the focus ring and the invalid stroke, with `span.hig-input-prefix` in flow before the input; native: the prefix is measured and the input's start padding grows to clear it, test ID `<testID>-prefix`). It is announced as the start of the field's description: web puts the prefix's `id` first in `aria-describedby`, before the help and error; native leads the accessibility hint with it (`@. Letters and digits.`), unless the host passes its own `aria-describedby` or `accessibilityHint`. Without `prefix` the input is unchanged. |
| Amounts | No dedicated component. Use `Input` with `type='text' inputMode='decimal'` on web or `keyboardType='decimal-pad'` on native; `value` stays a raw string. |
| `TradeEntry` | Raw `amount`, `onAmountChange`, `onConfirm`, `available`, `busy`, and `error`; opens review before submission. Trade confirm remains host-controlled. Imported from the blocks entry (`@bloxwap/hig/react/blocks`, `@bloxwap/hig/native/blocks`). |

## When to use and examples

Do: label Amount (BTC), describe available funds, keep 0,001 unchanged until host validates locale. Don’t: placeholder-only labels, Number(raw) on every keystroke, or strip IME text.

## States, interaction and accessibility

Single-line inputs are pills as tall as a button on web (44 units on touch density, 36 compact) and 48dp on native, with no resting stroke: the fill is `surface` on the page and `nested` inside a Surface, Dialog or sheet, so the field always reads against its container. Focus draws a neutral ring and invalid inputs take a negative ring. TextArea keeps a rounded rectangle. SearchInput insets a magnifying glass on the leading edge; its text starts 42 units in. DOM label/id plus help/error aria-describedby; invalid state is explicit. Field required propagates to Input/TextArea for browser required semantics and form validation; explicit input props can override required. A disabled Field keeps its controls disabled even if a child requests otherwise. Native amount keyboardType and search returnKeyType remain host-overridable defaults for locale/negative-entry and submit flows. RN visible label plus accessibilityLabel/Hint; errors stay visible and live. Secure input and autofill remain host-controlled native props.

State review: rest; keyboard focus/hover (DOM); accepted press and release/cancel; selected/checked where applicable; disabled; busy; inline error/recovery; empty/loading; long translations/large text; reduced motion; sound and haptics disabled. No host action occurs on mere focus. Disabled/busy targets suppress accepted activation. Core has no required feedback backend; the optional provider callback follows the action, honors cancellation and isolates errors.

## Platform mapping and limits

RN decimal-pad has locale/platform differences; no implicit money parser. Host owns safe area and keyboard avoidance: on Android 15 edge-to-edge (Expo 54) the window no longer resizes for the IME, so wrap scrollable forms in `KeyboardAvoidingView behavior='padding'` on Android and use `automaticallyAdjustKeyboardInsets` on the iOS ScrollView, as the native gallery does. iOS Simulator and Android emulator runs show the decimal pad and the focused field kept above the keyboard (`evidence/native-sim/`); physical IME composition and hardware-keyboard behavior remain device observations.

## Validation and citation

See `tests/components.dom.test.tsx`, `tests/native/components.test.cjs`, consumer fixtures and milestone evidence. Physical hardware, assistive-technology and baseline product comparisons are unperformed unless linked explicitly. Cite HIG 0.1.0 with this chapter anchor and a commit permalink, not a mutable preview branch. Preserve business behavior behind a host rollback flag during adoption.
