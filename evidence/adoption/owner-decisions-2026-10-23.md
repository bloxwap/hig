# Owner decisions for HIG v1 · 2026-10-23

[HIG #57](https://github.com/bloxwap/hig/issues/57) has no approving comments at
this snapshot. These decisions remain open. The pre-1.0 release exception in
[#141](https://github.com/bloxwap/hig/pull/141) permits package availability
through 2027-01-15 and explicitly leaves v1 acceptance open.

| Decision | Reviewable evidence | What an owner must record |
| --- | --- | --- |
| Named maintainers and exceptions | [Adoption matrix](../../planning/adoption.json): 15 repository rows, product/SDK surfaces, role-based owners and dated exceptions. | A named maintainer accepting each applicable row and retained exception. |
| Visual parity (#13/#26) | [Combined rollout](https://github.com/bloxwap/monorepo/pull/4619), [native controls](https://github.com/bloxwap/monorepo/pull/4620), [host actions](https://github.com/bloxwap/monorepo/pull/4629); consumer screenshot/OG evidence linked in the matrix. | Accept the recorded action, surface and recipe differences, or identify surfaces requiring correction. Evidence describes its recorded build, not every later production revision. |
| Density and layout (#8) | Compact Pro evidence in [#4608](https://github.com/bloxwap/monorepo/pull/4608), incorporated by #4619; comfortable native controls and default/large-text layouts in #4620. | Accept compact Pro and comfortable app mappings, minimum targets and recorded large-text limitations. |
| List/number baselines and motion (#19) | [Combined rollout cost evidence](https://github.com/bloxwap/monorepo/blob/main/docs/hig/pilots/combined-rollout.md); historical number parity and static/reel decisions in the matrix. | Accept product baselines and motion choices. Demo tests and JavaScript dispatch measurements do not establish production rendering performance. |
| Router restoration (#17) | Merged navigation, Escape/back/focus and deep-link browser flows linked from #4619 and the per-surface evidence. | Accept behavior in the owning host routers; identify any authenticated/wallet scenario still requiring observation. |
| Production source and bundle cost (#31) | Equal-toolchain #4619 delta versus its main baseline: app +12,044 B JS/+844 B CSS gzip; Pro +8,259/+1,382 B; marketing Worker +915 B/HTML +922 B. Native gzip9 +19,568 B iOS/+15,725 B Android for that integration. [TapTrade #223](https://github.com/bloxwap/taptradetv/pull/223): host emitted fonts +12,790,016 B, historical cold English responses +527,552 B. | Approve these scoped costs or set reduction targets. These are incremental historical measurements, not current production budget approval. |
| Inventory applicability (#2) | [2026-10-15 inventory](../../planning/org-inventory-2026-10-15.json), adoption rows for product/SDK/marketing and repositories without UI. | Accept recorded inclusion/exclusion decisions or identify missing surfaces. The inventory is a dated visibility snapshot. |
| Non-English glossary (#46) | [Canonical glossary](../../docs/foundations/glossary.json) and [locale status](../../docs/foundations/glossary.md). Only en-US is approved; es, fr, ko, ko-KR, zh-CN and zh-Hans remain `todo`. | Complete term translations and a named native-speaker reviewer for each promoted locale. Product catalogs are not HIG approval; de-DE/ar-EG are formatting fixtures. |

An acceptance record may approve a specific item or preserve a scoped exception
with named approver, evidence link, reason and review date. This document makes
none of those decisions. Retain rollback renderers and prior artifacts until
owning-product acceptance and the retirement window are complete (#110).

Two earlier questions are resolved: physical acceptance has the dated
[owner attestation](https://github.com/bloxwap/hig/pull/131), and Tapsiren cyan
identity is supported by the owner-directed
[marketing change](https://github.com/bloxwap/tapsiren/pull/422).
