# HIG delivery follow-ups · 2026-10-27

The original 35 tasks (#2–#36) are closed. This record reconciles remaining work
against GitHub and consumer default branches. Merge commits, publication
evidence and the current dependency snapshot are in
[`evidence/adoption/`](../evidence/adoption/state-2026-10-27.json).
Earlier snapshots and validation reports keep their original commit, toolchain and scope.

The current coordinated source is **0.1.1**, released on GitHub from
[`6f4dd060`](https://github.com/bloxwap/hig/commit/6f4dd060e0985be644d255154aa7a0277cdde27f).
The [release](https://github.com/bloxwap/hig/releases/tag/v0.1.1) links the tagged
source; its [publication workflow](https://github.com/bloxwap/hig/actions/runs/40067359944)
records npm publication, tarball verification and registry-consumer results.
The token-published 0.1.0 and 0.1.1 records are retained as history; 0.1.1 is
immutable, and consumer versions continue to describe actual installations.

| Issue | Delivered | Remaining acceptance |
| --- | --- | --- |
| #56 | Eight HIG packages published as 0.1.0 from `bdf8d070`. [Release](https://github.com/bloxwap/hig/releases/tag/v0.1.0) and [publish run](https://github.com/bloxwap/hig/actions/runs/39970447895) passed tag/package/hash verification and registry web, SSR, Next and both native consumers. Nine consumer registry migrations are merged. [HIG #147](https://github.com/bloxwap/hig/pull/147) merged on 2026-10-27 as `2f0a277f2af63f5de9dac7fb0ced62000f2cfea1`; future releases use OIDC/provenance with a transitional `NPM_TOKEN` fallback. | TapTrade #253 is the only open registry migration and needs refresh onto current main and current gates. npm trusted publisher setup and a real OIDC release remain unverified; token-published 0.1.0/0.1.1 history is unchanged. |
| #115 | Closed. Native busy-name, type scaling, P3 and locale-direction adoption is on monorepo main. Chart, SFX, agent-cli, Tapsiren and TapTrade refreshes are merged. Their OG-font, peer and CSS workarounds are retired in the matrix. | Software acceptance is complete. Merged PRs and native simulator/emulator evidence are listed in `planning/adoption.json` → `consumerRefreshAcceptance`. Registry migration remains #56. |
| #110 | [monorepo #4619](https://github.com/bloxwap/monorepo/pull/4619), [#4620](https://github.com/bloxwap/monorepo/pull/4620) and [#4629](https://github.com/bloxwap/monorepo/pull/4629) integrated web/native surfaces, ordinary native controls and host actions. Drafts #4607–#4618 are closed and incorporated by these integrations. [monorepo #4598](https://github.com/bloxwap/monorepo/pull/4598) removed committed marketing fonts. | Product owner decisions and real wallet-session acceptance remain. Retained app/Pro/native legacy renderers and rollback paths still require accepted retirement; the existing exception expires 2027-01-15 and is not renewed here. |
| #101 | Closed. [Tapsiren #422](https://github.com/bloxwap/tapsiren/pull/422) records Joe's requested restoration of `#00f0ff` cyan and confirms the SVG/favicon already use it. | Product identity is approved separately from HIG's default accent; the pending colour-decision exception is retired. |
| #70 | Closed through [HIG #148](https://github.com/bloxwap/hig/pull/148). Released SFX cancellation and optional Haptic injection are adopted; recorded iOS/Android dispatch p95 is 2.3–9.8 ms across both supported native profiles, below 16 ms. | Physical output remains separate from API dispatch; unsupported imperative iOS output is tracked upstream. |
| #55 | Closed by the dated owner attestation in [HIG #131](https://github.com/bloxwap/hig/pull/131). | No new physical observation is claimed. Contradictory device evidence voids the affected exception; upstream haptic#9 remains separate. |
| #57 | Source comparisons, migrations, bundle measurements and browser/native evidence are available. See the [owner review package](../evidence/adoption/owner-decisions-2026-10-23.md). | No owner approvals are recorded. Named-owner decisions and native-speaker approval remain; release authorization, merges and automated tests do not supply them. |
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
| TapTrade | [#253](https://github.com/bloxwap/taptradetv/pull/253) | Open. [#254](https://github.com/bloxwap/taptradetv/pull/254) merged current security fixes on 2026-10-26 as `729290acc60ce2e74834cf382c9e8cce6edcde6f` and retired the legacy audit. Refresh #253 onto current main and reassess it with current gates; main remains on its candidate. |
| Monorepo | [#4737](https://github.com/bloxwap/monorepo/pull/4737) | Merged exact 0.1.0 on 2026-10-26 as `8db4a59208116e0c87c2b7f61c4aafdb7bef6ce5`; required joeblau signoff succeeded. The 61-pass/1-skip evidence belongs to `d572d695455464da46d4964d3a2f08104cef50a4`. Final head `363576b3c44fb5db9815736f6b3bd93a16bafe61` has 53 successful, 8 failed and 1 skipped check runs. |

[monorepo #4776](https://github.com/bloxwap/monorepo/issues/4776) is the open RN 0.88
support follow-up for peer ranges, typings and eventual `higFocusRef()` removal.
It requires a new coordinated HIG release because 0.1.1 is immutable; it does not
decide v1 scope.

App-flows Chromium/WebKit execution and bounded browser cleanup landed through
monorepo #4619/#4629. Three-run acceptance evidence remains in
`docs/hig/evidence/app-flows/issue-124/` there. Process rotation is a resilience
mitigation; the original intermittent stall was not reproduced locally and is
not assigned a confirmed root cause. HIG [#143](https://github.com/bloxwap/hig/pull/143)
was closed after its work was incorporated by merged
[#149](https://github.com/bloxwap/hig/pull/149).

Pre-1.0 exceptions in `planning/release-blockers.json` remain supported by
[PR #141](https://github.com/bloxwap/hig/pull/141) through 2027-01-15. They permit
package availability while preserving v1 parity and rollout requirements.
No new owner approval is inferred from a successful build or merge.
