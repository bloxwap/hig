# Selection controls · HIG 0.1.0

Controls for choosing options, changing preferences, and adjusting values.

Includes `Checkbox`, `RadioGroup`, `Switch`, `SegmentedControl`, `Select`, and `Slider`. See the navigation guide for `Tabs`.

Issue #15. Entry: `selection`. Import platform entries from `@bloxwap/hig-react/selection` or `@bloxwap/hig-native/selection` according to applicability below. Import `@bloxwap/hig-react/css` once on web; tokens CSS is a separate explicit import.

## API and anatomy

| Control | Key props and behavior |
| --- | --- |
| Checkbox and switch | `checked`, `defaultChecked`, and `onCheckedChange`. Native `Switch` also takes `tone`, a token role (`action` default, `positive`, `negative`, `warning`, `info`, `buy`, `sell`) for the on track; raw colours are not accepted and fall back to `action`. On Android the thumb uses the `text` token, so the app theme accent never shows. |
| Choice controls | `value`, `defaultValue`, and `onValueChange`. Options have `value`, `label`, and optional `disabled`. Native options also accept `description` (a second line) and `lang` (the label's BCP-47 language). |
| `Slider` | `min`, `max`, `step`, and `value`; a visible `label` is required. The DOM keyboard focus ring is drawn inside the 48px range box, so it never paints over the label or the next control at comfortable or compact density. Native increment/decrement actions use HIGProvider `messages.increase`/`messages.decrease`. |

## When to use and examples

Do: control selection from accepted host state. Don’t: emit a success cue on every render or repeated slider value.

Native language pickers can keep the native name and a translated description in one radio row:

```tsx
<HIGProvider locale='en-US' fontFamiliesByScript={{
  latin: {400: 'BloxwapSansRegular'},
  ko: {400: 'BloxwapSansKRRegular'},
  zh: {400: 'BloxwapSansSCRegular'},
}}>
  <RadioGroup label='Language' value={language} onValueChange={setLanguage} options={[
    {value: 'ko', label: '한국어', description: 'Korean', lang: 'ko-KR'},
    {value: 'zh', label: '简体中文', description: 'Chinese', lang: 'zh-Hans'},
  ]}/>
</HIGProvider>
```

Register each face before passing its name. `Text` chooses `fontFamiliesByScript` by the label's glyphs, independently of the app locale; `lang` supplies `accessibilityLanguage` and resolves shared CJK punctuation. Descriptions use the app language. A script map selects the requested static weight, or its nearest registered weight; the existing `fontFamilies`/`fontFamily` remain the fallback. Explicit text `script` and style `fontFamily` override detection and registered family selection respectively. Native radios expose the label, supporting description as an accessibility hint, checked/disabled state and the explicit `activate` accessibility action; disabled rows reject both touch and accessibility activation. Per-option language is passed to React Native's `accessibilityLanguage`; pronunciation support depends on the platform and installed voices.

## States, interaction and accessibility

Native HTML controls retain browser keyboard and selection semantics. RN Switch renders the OS track inside one labeled 48dp switch row (the row is the accessibility element and touch target); checkbox/radio use labeled Pressables with checked state. RN slider uses the optional community backend for the visual track and touch drag; a plain 48dp adjustable View owns the label, value and increment/decrement actions (5% steps) on iOS and Android because the backend's iOS Fabric view ignores accessibility increments and its Android SeekBar node measures 18dp. On Android the wrapper is the package's autolinked `HIGAdjustableView`, which also lists `ACTION_SET_PROGRESS` for Voice Access and Switch Access: a requested value snaps to `step`, clamps to `min`/`max`, updates the control once and is rejected while disabled. React Native's own `accessibilityActions` cannot express set-progress (custom names get synthetic ids and the progress argument is dropped). Without native linking (Expo Go) the wrapper is a plain View and set-progress is absent. The backend's native track height (18dp Android, 40pt iOS) still bounds direct touch drag; hosts needing a larger drag area should pad around the control. Select opens labeled native Modal choices and returns focus to its trigger.

State review: rest; keyboard focus/hover (DOM); accepted press and release/cancel; selected/checked where applicable; disabled; busy; inline error/recovery; empty/loading; long translations/large text; reduced motion; sound and haptics disabled. No host action occurs on mere focus. Disabled/busy targets suppress accepted activation. Core has no required feedback backend; the optional provider callback follows the action, honors cancellation and isolates errors.

## Platform mapping and limits

SegmentedControl is single-choice radio semantics, not navigation. Native picker alternative is deliberate. Accessibility increment/decrement, set-progress and disabled rejection are verified on the iOS Simulator and Android emulator (`evidence/native-sim/`); tactile drag feel and haptic rate remain physical-device work; backend is an optional native peer.

## Validation and citation

See `tests/components.dom.test.tsx`, `tests/native/components.test.cjs`, `tests/native/language-options.test.cjs`, consumer fixtures and milestone evidence. Physical hardware, assistive-technology and baseline product comparisons are unperformed unless linked explicitly. Cite HIG 0.1.0 with this chapter anchor and a commit permalink, not a mutable preview branch. Preserve business behavior behind a host rollback flag during adoption.

`SwitchRow` from `@bloxwap/hig-native/switch` (also `selection`) wraps an existing host row in one switch target. It takes the same required `label`, `checked` / `defaultChecked`, `disabled` and `onCheckedChange` contract as `Switch`, plus required noninteractive `children` and root Pressable props. Keep the visible label, description and track noninteractive: the root owns activation and hides the content from accessibility to avoid duplicate targets. Put the description in `accessibilityHint`. Root `style` supports pressed callbacks; `accessibilityState` preserves `busy` while HIG owns checked/disabled state. Disable the row explicitly during pending requests; busy alone is descriptive. The Expo web row supports Space, Enter and pointer activation. Importing ordinary `Switch` does not include this optional anatomy.
