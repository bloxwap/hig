# Issue #70 acceptance evidence

Reviewed on 2026-10-23. HIG has adopted the released upstream APIs and its native
dispatch measurements satisfy the 16 ms budget on both supported consumer
profiles. [The closeout record](closeout-2026-10-23.json) identifies the source,
exact evidence hashes, installed upstream versions and fresh test results.

SFX's [per-play cancellation API](https://github.com/bloxwap/sfx/pull/51) and
Haptic's [capability/imperative API](https://github.com/bloxwap/haptic/pull/30)
are merged and published. HIG uses adapter-local abort signals and offers the
canonical Haptic backend injection. The current lock installs SFX 0.2.1 and
Haptic 0.3.0; integration tests exercise those actual packages.

The native adapter preloads and reuses players, then reaches `player.play()`
synchronously without waiting for configure or seek bridge round trips. Its
source is unchanged since the [dispatch fix](https://github.com/bloxwap/hig/pull/73).

| Recorded runtime | iOS Simulator p95 | Android emulator p95 |
| --- | ---: | ---: |
| RN 0.81.5 / Expo 54 | 5.2 ms | 9.8 ms |
| RN 0.83.10 / Expo 55 | 2.3 ms | 5.7 ms |

These are the 2026-10-15 gallery measurements for candidate
`0.1.0-candidate.shab4fb82c1`. The [runtime summary](../../native-sim/rn-0.83/summary.json)
records the iPhone 16 Pro / iOS 26.5 Simulator and Android 15 API 35 emulator
environment. Each raw feedback record is linked and hashed in the closeout
record. The measurements cover JavaScript dispatch to the native player; they
do not measure the time until sound reaches a speaker.

Fresh verification on 2026-10-23 passed all 25 tests in
`feedback-adapters.test.ts`, `feedback-upstream.test.ts` and
`native-verification.test.ts`. This includes 400 native cues with simulated
60 ms configuration and 40 ms seek delays, synchronous dispatch and p95 below
16 ms, plus upstream cancellation isolation and capability handling.

iOS imperative haptics remain unavailable, including during transient
activation; HIG reports this correctly. A supported upstream mechanism remains
tracked in [haptic#27](https://github.com/bloxwap/haptic/issues/27) and physical
certification in [haptic#9](https://github.com/bloxwap/haptic/issues/9).
No physical sound, haptics or acoustic latency is newly observed here. HIG's
separate [owner attestation](../../physical/owner-attestation-2026-10-19.md)
remains an attestation rather than a recorded device run.
