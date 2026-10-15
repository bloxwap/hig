# Actions & surfaces · HIG 0.1.0

Buttons, typography, and layout primitives for clear actions and related content.

Includes `Button`, `IconButton`, `Link`, `Text`, `Heading`, `Stack`, `Inline`, `Surface`, `Card`, and `Separator`.

Issue #13. Entry: `button / surface`. Import platform entries from `@bloxwap/hig-react/button` or `@bloxwap/hig-native/button` according to applicability below. Import `@bloxwap/hig-react/css` once on web; tokens CSS is a separate explicit import.

## API and anatomy

| Component | Key props and behavior |
| --- | --- |
| `Button`, `IconButton` | `children`, `intent`, `busy`, `disabled`, `fullWidth`, `suppressFeedback`, and forwarded ref. Web uses `onClick`; native uses `onPress`. |
| `Link` | Platform link behavior; host applications own routing. |
| `Text`, `Heading` | Platform text props. Native adds `maxFontSizeMultiplier` (font-scale cap for dense numeric readouts, also on `NumberReadout`; HIGProvider sets a default) and `script` (`latin`, `ko`, `zh`; detected from string children). Korean and Chinese runs use the companion face's own spacing (`scriptLetterSpacing`, 0em) instead of Latin tracking; HIGProvider `letterSpacingByScript` overrides it per script in em. |
| `Stack`, `Inline`, `Surface`, `Card` | Platform layout props. |

## When to use and examples

Use one primary review action. Do: busy protects host requests and displays Working. Don’t: use destructive red for every sell button.

## States, interaction and accessibility

DOM semantic button/anchor, forwarded focus, target min-height tied to density (web: 44px comfortable, 36px compact); RN target always at least 48. Multiline labels wrap; RN custom children render in a View with text nodes styled individually.

State review: rest; keyboard focus/hover (DOM); accepted press and release/cancel; selected/checked where applicable; disabled; busy; inline error/recovery; empty/loading; long translations/large text; reduced motion; sound and haptics disabled. No host action occurs on mere focus. Disabled/busy targets suppress accepted activation. Core has no required feedback backend; the optional provider callback follows the action, honors cancellation and isolates errors.

## Platform mapping and limits

RN external Link uses Linking; routes belong to host. Native fontFamily only after registration. Decorative SVG hidden; IconButton label is mandatory.

## Validation and citation

See `tests/components.dom.test.tsx`, `tests/native/components.test.cjs`, consumer fixtures and milestone evidence. Physical hardware, assistive-technology and baseline product comparisons are unperformed unless linked explicitly. Cite HIG 0.1.0 with this chapter anchor and a commit permalink, not a mutable preview branch. Preserve business behavior behind a host rollback flag during adoption.
