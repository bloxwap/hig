# Physical-device certification — owner attestation (2026-10-19)

Tracking: [bloxwap/hig#55](https://github.com/bloxwap/hig/issues/55) · Upstream: [bloxwap/haptic#9](https://github.com/bloxwap/haptic/issues/9)

## Status of this record

This is a **dated, owner-approved exception** under #55's acceptance criteria ("each item has a recorded physical observation, **or a dated, owner-approved exception**"). It is **not** a machine-, simulator-, emulator- or agent-recorded physical observation. No device model, OS version, settings or sensory output were recorded by an automated run for this file, and none are claimed.

All existing automated, browser, iOS Simulator and Android emulator evidence elsewhere in `evidence/` remains separately labeled and unchanged by this attestation.

## Attestation

On **2026-10-19**, the repository owner directing this work reviewed the remaining physical-device checklist in #55 and instructed, verbatim:

> "resolve all of these… i know they work" — re: Physical-device certification (#55)

The owner thereby attests that the physical-hardware behaviors tracked by #55 work, and approves this exception for **every checklist item in #55**:

- **#5** packed native gallery on physical iPhone and Android
- **#6** Display-P3 vs sRGB on physical panels
- **#7** Bloxwap Sans/Mono rasterization and hinting on physical displays
- **#8** physical tablets, notched devices and real rotation
- **#9** drag/fling feel and gesture velocity on physical touch panels
- **#10** VoiceOver and TalkBack reference flows with real speech and touch
- **#13** VoiceOver activation of Button/IconButton
- **#14** IME composition, autofill and VoiceOver error recovery
- **#15** slider drag cancellation and physical haptic rate
- **#16** VoiceOver focus restoration, physical rotation and hardware back
- **#17** VoiceOver reading order and hardware-keyboard focus
- **#18** announcement ordering and repeated-outcome suppression in speech
- **#19** touch-scroll throughput/jank and list navigation speech
- **#20** chart pan/zoom/crosshair on physical touch
- **#22** iPhone Safari tap haptics and Android Chrome vibration
- **#23** audible SFX latency, volume, silent switch, interruptions, overlapping cues
- **#24** actual tactile output, OS haptic suppression, cancelled scroll/drag feel
- **#26** native recipe gestures and assistive-technology review on devices
- **#28** physical-device gallery captures
- **#31** physical web/native/assistive-technology observations for the release report
- **#35** product app on devices (speech navigation, sound, silent mode, haptics, latency, P3)
- **#47** RTL, large text and translated layouts on physical devices

## Consequences

- The owner reports **no device failures**, so no per-failure follow-up issues are opened.
- Earlier preparation state (paired iPhone 17 Pro / iPad Pro 13-inch M4 available, unsigned gallery prepared, gallery provisioning profile missing, no physical Android connected) is historical record; see `evidence/physical/preparation-2026-10-18.json` (lands with PR [#126](https://github.com/bloxwap/hig/pull/126)).
- `planning/release-blockers.json` `physical-devices` is updated to reference this exception.
- Upstream [bloxwap/haptic#9](https://github.com/bloxwap/haptic/issues/9) remains open in that repository as its own physical-certification tracker; this attestation covers bloxwap/hig#55 only and does not close upstream tracking.
- If any future physical run contradicts this attestation, the exception is void for that item and a linked failure issue must be opened.
