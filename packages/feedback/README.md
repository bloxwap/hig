# @bloxwap/hig-feedback

0.1.0 candidate. Root contract imports no React, DOM, RN, audio or device API. Use independent web/native entries and opt in to each channel. Successful API invocation never certifies physical output. See docs/feedback for timing, storage, capability and device verification.

`createWebSoundAdapter` passes a per-adapter abort signal to SFX. The merged signal-aware engine cancels that root's active voices; released SFX 0.1.0 ignores the extra option and still cancels only pending startup. The shared default engine remains reference-counted.

`createBrowserHapticAdapter` retains its no-import browser fallback and optional `{vibrate}` backend. Hosts using the merged imperative Haptic API can inject `{canTriggerHaptic, triggerHaptic}`. Those exports are absent from released Haptic 0.1.0. Capability is probed at request time; iOS imperative output remains unavailable and observation remains false. Browser vibration cancellation is document-wide.
