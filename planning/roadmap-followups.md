# HIG delivery follow-ups · 2026-10-23

The original 35 tasks (#2–#36) are closed. This record reconciles remaining work
against GitHub and consumer default branches. Merge commits, publication
evidence and the initial dependency snapshot are in
[`evidence/adoption/`](../evidence/adoption/state-2026-10-23.json).
Historical validation reports keep their original commit, toolchain and scope.

| Issue | Delivered | Remaining acceptance |
| --- | --- | --- |
| #56 | Eight HIG packages published as 0.1.0 from `bdf8d070`. [Release](https://github.com/bloxwap/hig/releases/tag/v0.1.0) and [publish run](https://github.com/bloxwap/hig/actions/runs/39970447895) passed tag/package/hash verification and registry web, SSR, Next and both native consumers. Eight consumers have merged registry migrations, listed below. | TapTrade and monorepo registry migrations remain. The first release used the approved token workflow; npm OIDC provenance is tracked in [HIG #147](https://github.com/bloxwap/hig/pull/147), with the GitHub reviewer environment configured and npm owner setup still pending. |
| #115 | Native busy-name, type scaling, P3 and locale-direction adoption is on monorepo main. Chart, SFX, agent-cli, Tapsiren and TapTrade refreshes are merged. Their OG-font, peer and CSS workarounds are retired in the matrix. | Software acceptance is complete. Merged PRs and native simulator/emulator evidence are listed in `planning/adoption.json` → `consumerRefreshAcceptance`. Registry migration remains #56. |
| #110 | [monorepo #4619](https://github.com/bloxwap/monorepo/pull/4619), [#4620](https://github.com/bloxwap/monorepo/pull/4620) and [#4629](https://github.com/bloxwap/monorepo/pull/4629) integrated web/native surfaces, ordinary native controls and host actions. Drafts #4607–#4618 are closed and incorporated by these integrations. | Product owner decisions, real wallet-session acceptance and rollback retirement remain. The existing exception expires 2027-01-15; this reconciliation does not renew it or remove rollback support. |
| #101 | [Tapsiren #422](https://github.com/bloxwap/tapsiren/pull/422) records Joe's requested restoration of `#00f0ff` cyan and confirms the SVG/favicon already use it. | Product identity is approved separately from HIG's default accent; the pending colour-decision exception is retired. |
| #70 | Closed through [HIG #148](https://github.com/bloxwap/hig/pull/148). Released SFX cancellation and optional Haptic injection are adopted; recorded iOS/Android dispatch p95 is 2.3–9.8 ms across both supported native profiles, below 16 ms. | Physical output remains separate from API dispatch; unsupported imperative iOS output is tracked upstream. |
| #55 | Closed by the dated owner attestation in [HIG #131](https://github.com/bloxwap/hig/pull/131). | No new physical observation is claimed. Contradictory device evidence voids the affected exception; upstream haptic#9 remains separate. |
| #57 | Source comparisons, migrations, bundle measurements and browser/native evidence are available. See the [owner review package](../evidence/adoption/owner-decisions-2026-10-23.md). | Named-owner decisions and native-speaker approval remain; release authorization and automated tests do not supply them. |
| #1 | Original implementation, subsequent consumer APIs and first package publication are delivered. | Keep the roadmap open while #56, #57 and #110 acceptance remains. |

Hyperliquid [#183](https://github.com/bloxwap/hyperliquid/pull/183) merged the
Callout/OG-font refresh; Font [#15](https://github.com/bloxwap/font/pull/15)
declared canonical binary ownership. TapTrade
[#223](https://github.com/bloxwap/taptradetv/pull/223) incorporated drafts
#217/#219/#220 and completed web/host-token migration; its host font cost remains
an owner review item. Pages [#31](https://github.com/bloxwap/bloxwap.github.io/pull/31)
merged its checker fix, and [#36](https://github.com/bloxwap/bloxwap.github.io/pull/36)
merged registry adoption and CI asset generation, retiring all three copied-asset
exceptions and resolving Pages #25. Its [main deployment](https://github.com/bloxwap/bloxwap.github.io/actions/runs/40066052311)
succeeded; Pages now uses the workflow build type, and live provenance plus all
five generated asset hashes match the tested artifact.

| Consumer | Registry migration | State |
| --- | --- | --- |
| Chart | [#78](https://github.com/bloxwap/chart/pull/78) | Merged, exact 0.1.0. |
| SFX | [#80](https://github.com/bloxwap/sfx/pull/80) | Merged, exact 0.1.0. |
| agent-cli | [#68](https://github.com/bloxwap/agent-cli/pull/68) | Merged, exact 0.1.0. |
| Tapsiren | [#430](https://github.com/bloxwap/tapsiren/pull/430) | Merged, exact 0.1.0. |
| Hyperliquid | [#217](https://github.com/bloxwap/hyperliquid/pull/217) | Merged, exact 0.1.0. |
| Haptic | [#49](https://github.com/bloxwap/haptic/pull/49) | Merged, exact 0.1.0. |
| Pages | [#36](https://github.com/bloxwap/bloxwap.github.io/pull/36) | Merged, registry tokens and generated assets. |
| Font | [#39](https://github.com/bloxwap/font/pull/39) | Merged, exact 0.1.0; canonical source drift tooling remains independently pinned. |
| TapTrade | [#253](https://github.com/bloxwap/taptradetv/pull/253) | Software checks pass; required dependency audit fails on existing advisories, including Zod 3 with no compatible patched release. Main remains on its candidate. |
| Monorepo | [#4737](https://github.com/bloxwap/monorepo/pull/4737) | Draft; full validation, CI and required human signoff pending. Main retains the recorded web/native candidates. |

App-flows Chromium/WebKit execution and bounded browser cleanup landed through
monorepo #4619/#4629. Three-run acceptance evidence remains in
`docs/hig/evidence/app-flows/issue-124/` there. Process rotation is a resilience
mitigation; the original intermittent stall was not reproduced locally and is
not assigned a confirmed root cause.

Pre-1.0 exceptions in `planning/release-blockers.json` remain supported by
[PR #141](https://github.com/bloxwap/hig/pull/141) through 2027-01-15. They permit
package availability while preserving v1 parity and rollout requirements.
No new owner approval is inferred from a successful build or merge.
