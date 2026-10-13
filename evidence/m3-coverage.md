# M3 review evidence · candidate 0.1.0

| Issue | Status | Delivered and remaining |
| --- | --- | --- |
| #21 | done | Platform-neutral semantic types and bounded controller committed before adapters, independent channels, policy/preferences, cancellation, duplicate/cooldown rules, outcome separation and exception-isolated lifecycle. |
| #22 | partial | Lazy SFX adapter, per-call volume, browser vibration adapter, physical-only @bloxwap/haptic target wrapper and accepted-action integration. iOS async haptics/per-root SFX voice cancellation unavailable upstream; physical-tap cancellation limitation documented. Chrome interactions tested; Firefox/WebKit matrix follows M5, physical observation remains blocked. |
| #23 | partial | Four SFX WAV cues, pinned export/provenance/level manifest, injectable Expo audio bridge, preload/cache/volume/concurrency/missing-asset/disposal and background hooks. Real independent native tarball/Metro consumer. Physical playback latency/silent-mode/interruption observations unavailable. |
| #24 | partial | Native selection/impact light-medium-heavy/outcome mapping via Expo facade, preferences/capability gating and rejected backend isolation. Physical iPhone/Android output/settings observation remains upstream haptic#9 and HIG device review. |
| #25 | partial | Versioned preset table, root/local preference controls, browser/AsyncStorage bridge and migration, live persistence, separate motion, no backlog and strict replay tests; visual plus sound/haptic recipes on both fixtures. Hardware certification not claimed. |
| #26 | partial | M2 visual trade/market/balance/docs recipes now compose accepted semantic events and explicit host outcomes; no business services. Upstream product visual comparison and device rollout remain blocked. |

Proof: `m3-check.txt` (build/lint/typecheck, 36 executed Vitest + 6 native Jest tests), `m3-packed.txt`, `m3-packed-native.txt` (both Metro platforms; 4 WAV assets), `m3-cues.txt` and `packages/feedback/assets/manifest.json`, `m3-browser.json`, mobile/Pro screenshots. Browser preference persistence and muted-before-opt-in behavior verified; no screenshot/API invocation is tactile proof.

Publication and remote PR opening remain blocked by Contents-write 403 unless environment credentials change; see repository write blocker. No merge, release, tag or publication.
