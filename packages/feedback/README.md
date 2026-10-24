# @bloxwap/hig-feedback

Version 0.1.1. Root contract imports no React, DOM, RN, audio or device API. Use independent web/native entries and opt in to each channel. Successful API invocation never certifies physical output. See docs/feedback for timing, storage, capability and device verification.

`createWebSoundAdapter` passes a per-adapter abort signal to SFX. The signal-aware engine cancels that root's active voices while other roots and host-owned playback continue. The shared default engine remains reference-counted.

`createBrowserHapticAdapter` retains its no-import browser fallback and optional `{vibrate}` backend. Hosts using the imperative Haptic API can inject `{canTriggerHaptic, triggerHaptic}`. Capability is probed at request time; iOS imperative output remains unavailable and observation remains false. Browser vibration cancellation is document-wide.
