# Native application pilot (#35)

Owner: bloxwap/monorepo maintainers (named assignment in #57). Status on 2026-10-15: [monorepo#4540](https://github.com/bloxwap/monorepo/pull/4540) migrates the app's settings, entry, logout, sound card and demo number to HIG `0.1.0-candidate.sha7c67a07c`, with one HIG feedback controller and 15 duplicate fonts removed. It was verified on the iOS Simulator and Android emulator, but it is not merged yet (it needs the required human `signoff`). Physical-device certification is tracked in #55 and React Native 0.83 certification in #68. No tactile, audible or VoiceOver observation is claimed.

Pilot: font registration → dp/sRGB token mapping → amount/selection/review sheet → visible async outcome → independent feedback settings. The Expo gallery proves candidate packaging and contract examples, not the owning app's native build.

Checklist:
- [ ] Record actual RN/Expo/Metro/autolinking versions, source commit, old ui-native/token/font/audio wrappers, screenshots and native bundle/assets/latency baseline.
- [ ] Obtain approved pinned static TTF faces and upstream manifest or supply reviewed typed FontManifest; register before setting family. Do not treat WOFF2 or an invented native family as success.
- [ ] Map dp and legacy NativeWind rem roots explicitly. Keep Dynamic Type, 48 targets, logical RTL layout, safe areas, keyboard avoidance, native back and labelled fields/errors.
- [ ] Preview native import codemods, using individual switch/checkbox/range entries; wire optional SVG/Slider/Expo audio/haptic peers only where used. Retain platform-specific descriptions and host callbacks.
- [ ] Preserve raw financial strings, order/network logic, stable list identity and quiet live numbers. Use labelled list/readout native chart alternative unless a real supported native engine is reviewed.
- [ ] Read old sound/haptic settings with a host migration adapter before writing v1 key. Keep explicit false choices, volume and motion independent; handle corrupt/missing storage conservatively.
- [ ] Hook AppState/interruption/background and dispose cached players/listeners. Test muted channels, missing assets, backend rejection, repeated values, busy/disabled, canceled scroll/drag and unsupported hardware.
- [ ] Build the real app for iOS and Android. Observe large text, long translations, Arabic/Hebrew RTL, VoiceOver/TalkBack, orientation, keyboard/sheets, reduced motion and every feedback combination on devices.
- [ ] Record actual device/OS/settings and audible/tactile output, latency, silent-mode/interruption/background behavior. Reuse upstream haptic#9 review; simulator/mocks remain API evidence only.
- [ ] Remove duplicated source/assets/backend wrappers after device builds confirm references and autolinking are gone; quantify before/after sizes with equal toolchain/data.
- [ ] Link owning rollout PR and remaining version/exception work into the matrix.

Rollback: host feature flag restores old renderer/backends and previous lockfile. Persisted business data and feedback choices retain old-compatible fields during staged rollout; avoid one-way preference deletion. Keep old static assets until both physical platforms pass.
