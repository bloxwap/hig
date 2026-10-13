# Quality, budgets and evidence · HIG 0.1.0

Issues #31–#32. `npm run check` executes DOM and native suites with test counts. Native module mocks demonstrate roles/state/callback/lifecycle contracts; real packed Expo/Metro consumers demonstrate platform resolution. Neither is physical output or assistive-technology certification.

Gates inspect actual generated package exports, platform imports, tokens/cue hashes, scoped anti-drift exceptions, packed consumer installs, every copyable example, SSR/hydration/StrictMode, docs static route/base paths, visual/browser states and measured gzip/assets. Negative tests deliberately introduce invalid exports, stale token output, budget regression, cross-platform imports and copied/obsolete tokens to prove failure paths.

Budgets are regression limits from the initial candidate measurements, not claims of production savings:

| Metric | Measured initial | Limit | Reason |
| --- | --- | --- | --- |
| Individual DOM Button gzip (React external) | 706 B | 850 B | ~20% API/behavior fix headroom, overlay/audio/chart excluded |
| Individual AmountInput gzip | 325 B | 400 B | Small labelled primitive, ~23% headroom |
| Native Switch gzip (React/RN external) | 1,383 B | 1,700 B | ~23% headroom, verifies no Slider/SVG/overlay/feedback imports |
| Platform-neutral feedback contract gzip | 962 B | 1,200 B | ~25% headroom without device engines |
| Docs JS gzip, all lazy chunks | 204,877 B | 240,000 B | ~17% headroom; includes chart/code examples, not initial-load-only |
| Docs CSS | 17,419 B | 22,000 B | ~26% headroom for responsive/documentation states |
| Sans + Mono assets | 592,796 B | 600,000 B | Pins two approved faces; new script/face requires explicit review |
| Native four-cue WAV assets | 103,618 B | 110,000 B | ~6% headroom; no full engine/catalog assets |

The actual build report is `evidence/quality-report.json`. Bundles use explicit external React/RN peers, so figures measure HIG runtime contribution, not total installed/Metro app size. Production app/Pro/native before/after deltas are blocked by inaccessible source/toolchains; do not invent a percentage improvement. Export/dependency graph reports and packed tests enforce separation, while owning migrations must measure complete apps with equal data/toolchain.

Exceptions require path/rule, owner, reason and expiry. Approved brand geometry is exempt from literal-palette detection until review; unrelated primitive/palette copies fail. New repositories should run scoped gates on migrated surfaces and keep dated residuals rather than blanket exemptions.

Physical release review remains pending: iPhone Safari, Android Chrome, native iOS and Android, VoiceOver/TalkBack, large text/RTL, color/font fidelity, actual SFX/haptic output/latency/settings/interruption/background behavior. Coordinate upstream haptic#9. Release artifacts cannot change those “pending” rows into passes.
