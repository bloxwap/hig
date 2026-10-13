# M2 review evidence · candidate 0.1.0

| Issue | Status | Delivered and remaining |
| --- | --- | --- |
| #12 | partial | Isolated platform providers, controlled/uncontrolled state, cancellation, refs and error-isolated optional callback; DOM/RN behavior tests, SSR and packed imports. Next hydration/StrictMode gates follow in M5; physical platform review pending. |
| #13 | partial | Actions/surfaces/text/layout, busy/disabled protection, intent/density, focus and 48-unit native targets, SVG composition. Font device registration and full audited product visual parity remain blocked as M1. |
| #14 | partial | Labeled fields with errors/hints, forwarded inputs, raw-string amount entry, textarea/search and optional platform input props. Physical IME/locale native keyboard observations pending. |
| #15 | partial | Browser semantic controls, RN Switch/Slider/checked Pressables/modal Select, controlled/uncontrolled rejection/repeated-value tests. Device drag/accessibility-adjustment review pending; rate-limited cues added in M3. |
| #16 | partial | Scoped Radix DOM dialog/alert/menu/popover/tooltip and native Modal/menu/help alternatives, Escape/focus restoration/native-back tests. Native detents/gesture cancellation and nested VoiceOver focus need owning host/device validation; not claimed implemented. |
| #17 | partial | RTL-aware DOM tabs, native selected tabs, disclosure, current-location nav, pagination/search, host-owned routing and native back. Physical translated/hardware-keyboard review pending; breadcrumb maps to native back/route context. |
| #18 | partial | Persistent deduplicated notifications, status/callout/progress/skeleton/empty/avatar with visible essential messages. Native announcement observations pending; no hidden timeout drops critical text. |
| #19 | partial | Shared locale display formatting, percent points, missing/stale/zero semantics, semantic table/optional host sorting and native FlatList alternative. No financial arithmetic or animated price-tick effects; device list performance and upstream baseline comparison pending. |
| #20 | partial | Typed token chart theme and optional lazy chart SDK wrapper with required summary. Native readout/list alternative is implemented; native chart engine/bridge and live product gesture verification blocked pending supported target/device access. |
| #26 | partial | Host-owned trade review, balance/market/activity, install/copy/code/marketing recipes and both fixture compositions. M3 completes feedback examples; approved product screenshot comparison blocked by inaccessible monorepo/origins. |

Proof: `m2-check.txt` (build/lint/typecheck, 17 Vitest + 6 executed native Jest tests); `m2-ssr.txt`; `m2-packed.txt`; `m2-packed-native.txt` (independent tarball consumer, real Expo peers and both Metro platforms); `m2-browser.json`/`m2-browser.txt`; mobile/Pro screenshots. Jest native tests inspect actual RN renderer trees with native-module mocks; they do not claim OS gesture or assistive-technology certification. ESM packaging is intentional; Jest resolves shared dist outputs for unit tests, while packed consumer checks exercise actual exports.

Remote PR creation currently blocked by token/integration Contents-write 403; see `planning/repository-write-blocker.md`. All M2 implementation is local and reviewable on the stacked branch until credentials change.
