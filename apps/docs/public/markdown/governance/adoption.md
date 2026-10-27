# Organization adoption and governance (#36)

The active-repository matrix is `planning/adoption.json`, refreshed on 2026-10-27 using the repository inventory in `planning/org-inventory-2026-10-15.json`: the 15 repositories visible to `gh repo list bloxwap`, none archived. The 2026-10-13 inventory is kept for history. Each row records:

- applicability
- owner (Joe Blau, `joeblau`, accepts the recorded rows and exceptions in the [2026-10-27 decision record](../../evidence/adoption/owner-approval-2026-10-27.md))
- HIG version
- merged and open PRs
- validation
- status
- remaining work
- dated exceptions, each with scope, reason, owner, an expiry no more than 180 days ahead, and a tracking issue

`tests/docs.test.ts` fails when a visible repository has no row or when a row is missing these fields. Product surfaces (bloxwap.app, bloxwap.pro, bloxwap.com, the React Native app) and the five SDK docs sites have their own rows under `surfaces`.

## Status · 2026-10-27

All 15 inventoried repositories have applicability decisions and named owner acceptance. All ten consumer repositories have merged their registry migrations; the exact versions, PRs and validation remain in the matrix.

| Group | Repositories | State |
| --- | --- | --- |
| Canonical | hig | Coordinated 0.1.2 release; RN 0.81, 0.83 and 0.88 packed-consumer profiles |
| SDK docs migrated | hyperliquid, chart, font, sfx, haptic | Published 0.1.0 registry packages; candidate archives and the previously tracked peer/font/role workarounds retired |
| Product | monorepo | Registry migration #4737 merged. Owner decisions accepted in HIG #57. Real wallet acceptance and rollback retirement remain #110 |
| Docs site migrated | agent-cli | Registry migration #68 merged; scoped drift checks retained |
| Product, partly migrated | taptradetv | Registry migration #253 merged and deployed. Sponsors and host retain their explicitly recorded applicability scopes; this does not claim every host primitive migrated |
| Public pages migrated | tapsiren, bloxwap.github.io | Registry migrations #430 and #36 merged. Pages builds the tested artifact; generated runtime assets are no longer committed |
| No HIG runtime | icons, dimension-adapters, .github, .github-private | Applicability accepted; no runtime dependency required |

Owner acceptance records product decisions and the six-locale glossary exception through 2027-01-15. Physical-device claims retain the separate dated owner attestation. Neither supplies new wallet, native-speaker or hardware observations. Historical audit snapshots retain their original dates; current status is in `planning/adoption.json`.

## Governance

- **Ownership, review, admission, removal, platform support and product exceptions:** see the contribution chapter (`docs/governance/contributing.md`).
- **Release, semver and deprecation:** see the release chapter (`docs/governance/release.md`).
- **Setting up and upgrading a repository** without copying component folders, palettes, fonts or feedback engines: see `docs/governance/new-repository.md`.
- **Anti-drift:** `scripts/drift.mjs` enforces it here and in adopting repositories with `--root` and a `hig-drift.json`.

## Completion review

- Every issue needs an owning implementation and validation link, or an explicit linked follow-up. See `planning/issue-coverage.md` for the per-issue state.
- Catalog entries need docs, code, platform and test coverage.
- Source and bundle deltas must be measured in the owning repository.
- A matrix row is "migrated" only when its owning PR is merged and its validation is linked. Open PRs are recorded as in progress, never as migrated.
- Physical hardware results are never inferred from simulator, emulator or browser evidence.
