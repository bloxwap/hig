# Preferences, preview and device review · HIG 0.1.0

`FeedbackProvider` accepts a stable `createController(preferences)` factory and optional storage adapter. `useFeedback` exposes preferences, update, sink and controller. `FeedbackPreferencesControl` is a render-prop control so DOM and RN use their own shipped Switch/Slider instead of importing another platform. Use a stable factory; mount/replay creates fresh adapters and unmount disposes them. React StrictMode lifecycle is tested.

`jsonStorage` supports browser Storage or native AsyncStorage-shaped interfaces. It uses a versioned key; read legacy saved choices explicitly with a host adapter before writing the new key. `migratePreferences` preserves explicit false sound/haptic choices, legacy soundEnabled/hapticsEnabled, clamped volume and independent reducedMotion/motion. Corrupt/missing storage falls back to muted defaults. A delayed saved read cannot overwrite a newer user choice. Storage rejection leaves the live UI usable.

Web and native fixtures include real independent sound, haptics, volume and motion controls, entry/selection/success preview and visible state. The web fixture persists localStorage; the native gallery persists AsyncStorage. Both wire lifecycle background state. Sound and haptic preferences are never encoded in wallet/trade logic. Native gallery sound import/package/Metro success is automated evidence, not audible/tactile observation.

| Platform | Routing | Claimed observation |
| --- | --- | --- |
| Desktop Chrome/Firefox/WebKit | Web Audio after gesture; vibration only when API exists | Automated interaction; no hardware assertion |
| iPhone Safari | optional pre-approved physical target; async haptic adapter unavailable | pending physical tap, VoiceOver, settings/OS review |
| Android browser | browser vibration patterns when allowed | pending device output/intensity |
| Native iOS/Android | Expo audio and selection/impact/notification bridges | pending physical output, latency and interruption review |
| Simulator / Jest mocks | API/contract behavior only | never tactile certification |

Device acceptance record must include HIG/package versions, device, OS/browser, date, observer and actual observations: default/muted channels; each independent combination; volume/silent-mode; latency; interruptions; background/foreground; repeated/nested activation; cancelled scroll/drag; disabled/busy; slider repeated values; iOS preset limits; accessibility helper tab/VoiceOver order; visible recovery with feedback off. Attach video/measurements where useful. Reuse upstream haptic certification rather than declaring simulator passes as hardware proof. Owner: HIG and owning app/haptic maintainers, assignment pending; exception expires 2026-11-13.
