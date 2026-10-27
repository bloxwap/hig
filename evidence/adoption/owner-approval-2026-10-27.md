# HIG v1 owner decisions · 2026-10-27

Approver and accountable adoption owner: **Joe Blau (`joeblau`)**.
Tracking: [HIG #57](https://github.com/bloxwap/hig/issues/57).
Review package: [2026-10-23 owner decisions](owner-decisions-2026-10-23.md).

After receiving the issue-by-issue review of #1, #56, #57 and #110, including
the remaining approval requirements and the option of scoped locale exceptions,
the repository owner instructed the agent:

> fix and apprve everything tha tneeds to be approved

This record executes that instruction. It records owner authorization and
acceptance of the linked review package; it does not claim a new product test,
physical-device observation, wallet transaction, or native-speaker review.

| Decision | Approved scope |
| --- | --- |
| Adoption ownership | `joeblau` is accountable for all 15 repository rows, all product/SDK surface rows and their retained dated exceptions in `planning/adoption.json`. Repository maintainer roles remain the implementation contacts. |
| Inventory applicability (#2) | Accept the recorded UI, asset-only, content-only and no-UI decisions in the dated organization inventory. New repositories still require an applicability decision. |
| Visual parity (#13/#26) | Accept the actions, surfaces and recipes documented by the merged rollout and screenshot evidence in the review package. Any subsequently demonstrated regression requires correction. |
| Density/layout (#8) | Accept comfortable app/native and compact Pro mappings, the documented target sizes and recorded large-text limitations. |
| Lists, numbers and motion (#19) | Accept the recorded product baselines and static/reel choices. The existing evidence retains its original build and measurement scope; this approval is not a new production performance measurement. |
| Host navigation (#17) | Accept the recorded route, back, focus and deep-link behavior. Authenticated/wallet-session observations remain a separate execution requirement in #110. |
| Source/bundle costs (#31) | Accept the historical equal-toolchain deltas linked in the review package, including the native/Hermes and TapTrade font costs. Retirement must still publish new before/after measurements. |
| Non-English glossary (#46) | Approve the scoped exception below, preserving the English-only approved glossary until native-speaker review is available. |

## Scoped glossary exception

- Scope: `es`, `fr`, `ko`, `ko-KR`, `zh-CN`, `zh-Hans` HIG glossary approval.
- Owner/approver: `joeblau`.
- Review/expiry: **2027-01-15**; this does not extend the existing review date.
- Reason: native-speaker review has not been supplied. Only `en-US` is an
  approved HIG glossary locale. The six entries remain `todo`; no generated
  translation is promoted as native-speaker approved. Product translations and
  locale-formatting fixtures retain their separately documented status.
- Required follow-up: complete/review the terms with named native speakers
  before promoting any locale, or explicitly reassess the exception by expiry.

## Implementation and release authorization

The instruction authorizes the remaining fixes, normal review/merge flow,
consumer migration, and a new coordinated compatibility release after the
existing quality and artifact checks pass. Published 0.1.0 and 0.1.1 stay
immutable. npm authentication and verified trusted-publisher operation remain
technical prerequisites, not facts established by this approval.

Rollback retirement is authorized after the recorded product/session checks
and accepted rollback window are complete. This record alone does not close
#110 or the overall roadmap and does not report a real-wallet test as passed.
