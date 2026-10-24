# Preferences, preview and device review · HIG 0.1.0

`FeedbackProvider` accepts a stable `createController(preferences)` factory and optional storage adapter. `useFeedback` exposes preferences, update, sink and controller. `FeedbackPreferencesControl` is a render-prop control so DOM and RN use their own shipped Switch/Slider instead of importing another platform. Use a stable factory; mount/replay creates fresh adapters and unmount disposes them. React StrictMode lifecycle is tested.

`jsonStorage` supports browser Storage or native AsyncStorage-shaped interfaces. It uses a versioned key; read legacy saved choices explicitly with a host adapter before writing the new key. `migratePreferences` preserves explicit false sound/haptic choices, legacy soundEnabled/hapticsEnabled, clamped volume and independent reducedMotion/motion. Corrupt/missing storage falls back to muted defaults. A delayed saved read cannot overwrite a newer user choice. Storage rejection leaves the live UI usable.

Web and native fixtures include real independent sound, haptics, volume and motion controls, entry/selection/success preview and visible state. The web fixture persists localStorage; the native gallery persists AsyncStorage. Both wire lifecycle background state. Sound and haptic preferences are never encoded in wallet/trade logic. Native gallery sound import/package/Metro success is automated evidence, not audible/tactile observation.

| Platform | Routing | Evidence and acceptance |
| --- | --- | --- |
| Desktop Chrome/Firefox/WebKit | Web Audio after gesture; vibration only when API exists | Automated interaction; no hardware assertion |
| iPhone Safari | optional pre-approved physical target; async haptic adapter unavailable | Owner-attested under #55; no recorded physical tap, VoiceOver or settings/OS observation |
| Android browser | browser vibration patterns when allowed | Owner-attested under #55; no recorded device output/intensity observation |
| Native iOS/Android | Expo audio and selection/impact/notification bridges | Owner-attested under #55; no recorded physical output, acoustic latency or interruption observation |
| Simulator / Jest mocks | API/contract behavior only | never tactile certification |

HIG's physical acceptance uses the [2026-10-19 owner attestation](https://github.com/bloxwap/hig/blob/main/evidence/physical/owner-attestation-2026-10-19.md), approved in [PR #131](https://github.com/bloxwap/hig/pull/131), with review due **2027-01-15**. This is a dated owner-approved exception for #55, not a recorded device run. A contradicting physical result voids the relevant exception. Upstream [haptic#9](https://github.com/bloxwap/haptic/issues/9) remains its own physical-certification tracker.

A recorded device acceptance run must include HIG/package versions, device, OS/browser, date, observer and actual observations: default/muted channels; each independent combination; volume/silent-mode; latency; interruptions; background/foreground; repeated/nested activation; cancelled scroll/drag; disabled/busy; slider repeated values; iOS preset limits; accessibility helper tab/VoiceOver order; visible recovery with feedback off. Attach video/measurements where useful. Reuse upstream haptic certification rather than declaring simulator passes as hardware proof. Owner: HIG and owning app/haptic maintainers; named assignments remain tracked in #57.
