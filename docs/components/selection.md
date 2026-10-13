# Checkbox, RadioGroup, Switch, SegmentedControl, Select, Slider; Tabs in navigation · HIG 0.1.0

Issue #15. Entry: `selection`. Import platform entries from `@bloxwap/hig-react/selection` or `@bloxwap/hig-native/selection` according to applicability below. Import `@bloxwap/hig-react/css` once on web; tokens CSS is a separate explicit import.

## API and anatomy

checked/defaultChecked/onCheckedChange; value/defaultValue/onValueChange. Options are {value,label,disabled}. Slider min/max/step/value; label required.

## When to use and examples

Do: control selection from accepted host state. Don’t: emit a success cue on every render or repeated slider value.

## States, interaction and accessibility

Native HTML controls retain browser keyboard and selection semantics. RN Switch uses OS control; checkbox/radio use labeled Pressables with checked state. RN slider uses optional community backend; Select opens labeled native Modal choices.

State review: rest; keyboard focus/hover (DOM); accepted press and release/cancel; selected/checked where applicable; disabled; busy; inline error/recovery; empty/loading; long translations/large text; reduced motion; sound and haptics disabled. No host action occurs on mere focus. Disabled/busy targets suppress accepted activation. Core has no required feedback backend; the optional provider callback follows the action, honors cancellation and isolates errors.

## Platform mapping and limits

SegmentedControl is single-choice radio semantics, not navigation. Native picker alternative is deliberate. Slider drag cancellation/tactile rate evidence remains M3/device work; backend is an optional native peer.

## Validation and citation

See `tests/components.dom.test.tsx`, `tests/native/components.test.cjs`, consumer fixtures and milestone evidence. Physical hardware, assistive-technology and baseline product comparisons are unperformed unless linked explicitly. Cite HIG 0.1.0 with this chapter anchor and a commit permalink, not a mutable preview branch. Preserve business behavior behind a host rollback flag during adoption.
