# Native application pilot (#35)

Owner: Joe Blau (accepted in #57). Status on 2026-10-15: [monorepo#4540](https://github.com/bloxwap/monorepo/pull/4540) migrates the app's settings, entry, logout, sound card and demo number to HIG `0.1.0-candidate.shac32771dc`, with one HIG feedback controller and 15 duplicate fonts removed. It loads the faces from `@bloxwap/hig-native-fonts` (#64) and passes translated `messages` (#62). It also drops the local Switch, Alert and Text workarounds (#67), and passes `direction` to `HIGProvider` on Android (#86). It was verified on the iOS Simulator and Android emulator and merged as `2f636e8fe` on 2026-10-16. Physical-device certification retains the dated owner-attested exception in #55. Subsequent native rollout and registry adoption are merged in monorepo#4620/#4629/#4737. Merged [monorepo#4826](https://github.com/bloxwap/monorepo/pull/4826) adopts HIG 0.1.2 on RN 0.88 / Expo 58 and removes the temporary ref cast, closing #4776.

Workarounds the app can drop at its next candidate refresh (a candidate built from `74f4f6a` or later; tracked in #115):

- **Busy Button name (#94):** delete the `HigActionButton` wrapper's `higButtonAccessibilityLabel`. Button now sets the name itself: `{label} · {busy}` on iOS and `{label}` on Android, where React Native adds its own busy word, so Korean no longer reads `처리 중` twice.
- **Display P3 (#93):** set `colorSpace='display-p3'` on the root `HIGProvider` and drop the local `nativeColors.iosDisplayP3` lookup for the Button fill (see [Native colour space](#native-colour-space-93)).
- **Button text (#92):** the label and busy suffix now follow the provider `maxFontSizeMultiplier` and use the 600 face. Re-capture the large-text and fr/ko screens.
- **Direction (#86):** `localeDirection` from `@bloxwap/hig-native/provider` can replace the app's own direction lookup. HIG is certified on React Native 0.83.10 / Expo SDK 55 (#68). No tactile, audible or VoiceOver observation is claimed.

Pilot: font registration → dp/sRGB token mapping → amount/selection/review sheet → visible async outcome → independent feedback settings. The Expo gallery proves candidate packaging and contract examples, not the owning app's native build.

Checklist:
- [ ] Record actual RN/Expo/Metro/autolinking versions, source commit, old ui-native/token/font/audio wrappers, screenshots and native bundle/assets/latency baseline.
- [ ] Register the pinned static TTF faces from `@bloxwap/hig-native-fonts` and its typed `fontManifest`; register before setting family. Do not treat WOFF2 or an invented native family as success.
- [ ] Map dp and legacy NativeWind rem roots explicitly. Keep Dynamic Type, 48 targets, logical RTL layout, safe areas, keyboard avoidance, native back and labelled fields/errors.
- [ ] On RN 0.83, pass `HIGProvider direction={localeDirection(getLocales()[0])}` if the app supports RTL: an Android per-app Arabic or Hebrew locale does not reach `I18nManager.isRTL` ([localization](../foundations/localization.md#native-direction-from-the-host-locale), #86).
- [ ] Preview native import codemods, using individual switch/checkbox/range entries; wire optional SVG/Slider/Expo audio/haptic peers only where used. Retain platform-specific descriptions and host callbacks.
- [ ] Preserve raw financial strings, order/network logic, stable list identity and quiet live numbers. Use labelled list/readout native chart alternative unless a real supported native engine is reviewed.
- [ ] Read old sound/haptic settings with a host migration adapter before writing v1 key. Keep explicit false choices, volume and motion independent; handle corrupt/missing storage conservatively.
- [ ] Hook AppState/interruption/background and dispose cached players/listeners. Test muted channels, missing assets, backend rejection, repeated values, busy/disabled, canceled scroll/drag and unsupported hardware.
- [ ] Build the real app for iOS and Android. Observe large text, long translations, Arabic/Hebrew RTL, VoiceOver/TalkBack, orientation, keyboard/sheets, reduced motion and every feedback combination on devices.
- [ ] Record actual device/OS/settings and audible/tactile output, latency, silent-mode/interruption/background behavior. Reuse upstream haptic#9 review; simulator/mocks remain API evidence only.
- [ ] Remove duplicated source/assets/backend wrappers after device builds confirm references and autolinking are gone; quantify before/after sizes with equal toolchain/data.
- [ ] Link owning rollout PR and remaining version/exception work into the matrix.

## Native fonts moved out of hig-tokens

Issue #64. Up to `0.1.0-candidate.sha7c67a07c`, `@bloxwap/hig-tokens` shipped the 15 static TTFs under `@bloxwap/hig-tokens/fonts/*`. Web-only consumers never served them, but they made up most of the tarball. They now live in `@bloxwap/hig-native-fonts`. The bytes, file names, registration keys and SHA-256 hashes are unchanged.

| Before | After |
| --- | --- |
| `require('@bloxwap/hig-tokens/fonts/BloxwapSans.ttf')` | `require('@bloxwap/hig-native-fonts/fonts/BloxwapSans.ttf')` |
| `@bloxwap/hig-tokens/fonts/manifest.json` | `@bloxwap/hig-native-fonts/manifest`, or the typed `fontManifest` export |
| `@bloxwap/hig-tokens/fonts/OFL.txt` | `@bloxwap/hig-native-fonts/fonts/OFL.txt` |

- **Expo / React Native:** add the `bloxwap-hig-native-fonts-*.tgz` tarball next to tokens, contracts and native (with a matching `overrides` entry when vendoring), then replace the import prefix. `nativeFont(fontManifest, 'BloxwapSans', 600)` from `@bloxwap/hig-contracts` returns the registration key. Hashes you already pinned stay valid.
- **Satori / OG images in web repositories:** these also read static TTFs (bloxwap/chart's OG card is one). Install `@bloxwap/hig-native-fonts` as a build-time dependency for that script only, or read the TTF from `@bloxwap/font` if it ships one. Never copy the faces into the repository.
- **Web-only hosts:** remove nothing. They keep loading fonts from `@bloxwap/font`, and their tokens tarball shrinks. `npm run release:dry-run` fails if any web or shared tarball contains `.ttf`, `.otf` or `.woff*` files, and it records the packed sizes in `packedSizes` in the release report.
- **Coordination:** monorepo#4540 (merged) already loads the faces from `@bloxwap/hig-native-fonts`.

## Native colour space (#93)

Up to `0.1.0-candidate.shaac27cf7`, HIG native components always painted `nativeSrgb` hex values. On an iOS host whose React Native default colour space is Display P3, those values were read as P3 channels, so the Switch track, Alert accent, Text, Surface and the other components painted warning, negative and info more saturated than the token. HIG now selects one of its own tables through the provider:

```tsx
// iOS hosts whose app delegate returns .displayP3 from defaultColorSpace() (bloxwap/monorepo apps/mobile/plugins/with-ios-display-p3.js).
<HIGProvider colorSpace='display-p3'>{app}</HIGProvider>
```

- **Display P3 hosts** set `colorSpace='display-p3'` on the root `HIGProvider`. iOS then paints `nativeColors.iosDisplayP3`, and Android and web keep `nativeSrgb`, so the prop can be set unconditionally. Nested providers inherit it.
- **Host-drawn colour** next to HIG components: drop local `nativeColors.iosDisplayP3` lookups and per-platform selection and read `useColors()` from `@bloxwap/hig-native/provider`. Delete wrappers that only existed to pass a P3 colour into Button `style`.
- **sRGB hosts** change nothing. The default is `srgb` and renders the same values as before.
- Raw colours are still not accepted. `colorSpace` takes only `'srgb'` or `'display-p3'`, and any other value falls back to sRGB.

Rollback: host feature flag restores old renderer/backends and previous lockfile. Persisted business data and feedback choices retain old-compatible fields during staged rollout; avoid one-way preference deletion. Keep old static assets until both physical platforms pass.
