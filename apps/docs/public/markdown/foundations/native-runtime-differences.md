# Native runtime differences · HIG 0.1.0

Follow-ups #86–#89 and #92–#94 distinguish implementation checks from physical-device certification in #55. The supported packed consumers remain React Native 0.81.5 / Expo 54 and React Native 0.83.10 / Expo 55. Historical simulator/emulator captures remain in `evidence/native-sim/`; their results are not overwritten by software tests.

## Android locale direction

RN 0.83's `I18nManager.isRTL` can report false for an Arabic app locale. The regression is [upstream #54938](https://github.com/react/react-native/issues/54938), introduced by [#53417](https://github.com/react/react-native/pull/53417) and fixed by [#57635](https://github.com/react/react-native/pull/57635), with older-Android handling in [#58723](https://github.com/react/react-native/pull/58723).

HIG defaults direction to `I18nManager.isRTL`. Hosts that support RTL pass `direction={localeDirection(getLocales()[0])}`, using `localeDirection` from `@bloxwap/hig-native/provider` and their localization adapter (for example Expo Localization). This handles an Arabic per-app locale even when RN's OS diagnostic still reports false. Hosts that disallow RTL leave direction unset. Formatting locale remains independent, with `en-US` as the default. The Android `os-arabic` harness asserts the explicit host direction. Historical local fallback measurements predate the merged public API.

## Slider action labels

RN 0.83 exposes an empty accessibility action label when the host omits it. HIG supplies `messages.increase` and `messages.decrease` for both actions, with English Increase/Decrease defaults and host translation overrides. Disabled adjustments remain rejected. Automated labels and state checks do not establish what a person hears through TalkBack; physical reference flows remain in #55.

## iOS Dynamic Type audit

The historical RN 0.81.5 / Expo 54 run recorded 68 TextInput Dynamic Type heuristic findings. The RN 0.83.10 / Expo 55 run recorded none, while the large-text captures and text-field counts matched. The note in `evidence/native-sim/native-sim.json` applies to RN 0.81.5 only.

Source comparison of the release tags establishes that `RCTUITextField.mm` is byte-identical and the Fabric text-input view has no new UIFontMetrics/scaling behavior. The font utility changed to honor default font handlers in [React Native #53755](https://github.com/react/react-native/pull/53755). That refactor has not been isolated as the cause of the audit change. We therefore do not claim a UIFontMetrics fix or a physical accessibility pass. Root-cause attribution for #88 and device VoiceOver/largest-size checks remain open.

## Audio completion diagnostics

Expo Audio 1.1's Android playback status derives `didJustFinish` from the player's ended state. Both the playback-state listener and status polling can report that state. The SDK 54 captures show two completion callbacks after one recorded `play:tick`; SDK 55 shows one. A completion callback is not an extra play.

Only the gallery recorder listens to `playbackStatusUpdate`. The HIG adapter dispatches preloaded players without waiting for or replaying completion events. `tests/native-verification.test.ts` injects two completion callbacks and asserts exactly one backend `play()` call while preserving both raw diagnostic events. No runtime completion de-duplication is needed unless the adapter later depends on completion. Dispatch timing and audible latency remain distinct; speaker, silent-mode and interruption observations remain in #55.

## Native text and color follow-ups

Native Button uses HIG Text for both its label and localized busy suffix, preserving font registration, script spacing and scale caps. Its busy accessible name includes the visible label, with explicit host labels taking precedence. Mixed ReactNode status titles concatenate visible text without inserting extra spaces.

`HIGProvider colorSpace='display-p3'` selects the canonical P3 table on iOS. Android and web resolve to sRGB. Native controls and host-drawn views read the resolved table through `useColors()`; nested providers inherit the selected space. These are channel-selection and semantic tests, not comparisons of physical displays.
