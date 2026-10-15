# Optional adapters and installation · HIG 0.1.0

Issues #22–#24. Base imports do not load adapters. Individual `web-sound`, `browser-haptic`, `web-haptic`, `native` and `react` entries preserve dependency boundaries. The composite `web` entry needs the Haptic package; sound-only consumers should import `web-sound`.

## Web sound

Install `@bloxwap/hig-feedback@0.1.0 @bloxwap/sfx@0.1.0`. `createWebSoundAdapter()` loads SFX only for enabled requests after an accepted interaction. It calls the documented unlock/play APIs, passes per-call volume and uses the same presets as native. New requests replace pending startup, so delayed loading does not create a backlog. It avoids upstream global enabled/volume stores because HIG preferences are root-scoped. `@bloxwap/sfx/react` owns global preference helpers; using those alongside HIG would create competing preference owners.

The upstream engine is shared and does not expose per-root voice handles. HIG reference-counts its users and disposes the engine after its last default adapter. Muting/cancellation prevents pending playback; it cannot surgically stop an already-running voice for one root. A host that also owns the upstream global engine should inject/own the lifecycle rather than use the default HIG lifecycle. Full per-root active-voice cancellation is an explicit upstream API gap, not a claimed capability. Upstream [sfx#51](https://github.com/bloxwap/sfx/pull/51) adds a per-play `AbortSignal`; HIG adopts it only once it ships in a released `@bloxwap/sfx` (tracked in #70).

## Browser and physical-tap haptics

`createBrowserHapticAdapter()` maps accepted semantic events to browser vibration when `navigator.vibrate` exists. Device intensity/pattern quality varies and may be suppressed. iOS WebKit without vibration cannot provide imperative async outcome feedback; the adapter reports unavailable and remains silent.

For approved iOS physical action targets, install `@bloxwap/haptic@0.1.0` and wrap a single ref-capable HIG button in `HapticFeedbackTarget eligible`. The wrapper uses upstream `HapticTarget`, preserves the target/handler/ref, enables only the physical-tap route and disables debug audio/helper switch visibility. Thus browser vibration comes from the semantic adapter and is not duplicated by the wrapper. HIG preferences still gate the wrapper.

**Do** pre-approve the target with `eligible` after disabled/busy/policy checks. **Don't** wrap an action whose eligibility is decided only by an async click callback, or promise a programmable iOS success/error pattern. The OS physical tick occurs before delegated handlers; a later preventDefault cannot retract that tick. That cancellation limitation, physical-tap intensity limits and device/VoiceOver checks remain upstream [haptic#9](https://github.com/bloxwap/haptic/issues/9) / [haptic#7](https://github.com/bloxwap/haptic/issues/7). The missing imperative iOS API for semantic controllers is [haptic#27](https://github.com/bloxwap/haptic/issues/27) (tracked in #70). No wrapper is required for basic actions.

## Native audio

Install the feedback package plus `expo-audio` (`~1.1.1` on Expo SDK 54, `~55.0.18` on SDK 55) only in the native host setup. `expoAudioBackend(Audio)` supplies a thin playback bridge; `createNativeSoundAdapter(backend, assets)` accepts Metro asset ids. The Expo gallery imports only the four committed WAV cues. Configure ambient/silent-mode behavior with `playsInSilentMode:false`, no background playback and `doNotMix` interruption mode. Host AppState calls `setBackground`; backgrounding pauses cached players. Call `preload()` at startup: it configures the audio session and caches players once. After that, `play()` dispatches synchronously, with no awaited bridge round trip before `player.play()`. It stops only the previous cue, issues `seekTo(0)` without awaiting it (native players apply calls in order) and plays. A cue requested before preload settles waits for it, and only the newest such request plays. Concurrency is limited to one active cue, volume/mute are honored, missing cues are silent, and disposal pauses/removes every cached player.

Regenerate with `npm run generate:cues`. `assets/manifest.json` pins package/recipe/export flags, 48kHz mono PCM16, durations, peaks/RMS, bytes and reviewed hashes. Noise recipes vary; do not assert regenerated WAV bytes are deterministic. Inspect duration/envelope/level tolerances and review the actual artifact hashes. Offline generation dependencies are dev-only; Metro never imports them or browser synthesis.

## Native haptics

Install `expo-haptics` (`~15.0.7` on Expo SDK 54, `~55.0.18` on SDK 55) in the native host. `expoHapticBackend(Haptics)` bridges selection, impact light/medium/heavy and notification success/warning/error. `createNativeHapticAdapter` reports API availability separately from observation. Unsupported hardware, backgrounding, preferences and failed backend calls are no-ops that do not change primary actions. Android notification/impact approximation and OS suppression must be observed on devices before support is certified.

## Simulated lifecycle regression evidence

The Linux tests inject native player and haptic backends. Pending configure/seek requests are superseded by the newest request; cancellation, backgrounding, zero volume and disposal stop pending playback. Failed configuration can retry. Explicit impact intent reaches the native backend even for an otherwise silent press preset. Pause/remove failures cannot prevent other cached players from being released. A dispatch test drives 400 cues through `FeedbackController` with simulated slow bridge calls (configure 60 ms, seek 40 ms). It asserts that every cue reaches `player.play()` inside `emit()` and that p95 stays under one 16 ms frame. The native gallery stamps each emit and logs `dispatch`/`p95` on every play for simulator and emulator runs. These tests establish dispatch/lifecycle behavior, not observed sound, tactile output, acoustic latency (#55) or OS audio-session behavior.

Menu disclosure and dismissal are intentionally silent. Web/native Menu commits emit a single selection intent after the host handler; a host can cancel that effect with the selection event's `preventDefault()`. Native accordion disclosure emits one silent disclosure intent rather than duplicate activation/selection effects. The Linux three-engine fixture also checks switch, range, menu selection and canceled menu actions with injected adapters.
