# Organization adoption and governance (#36)

The active-repository matrix is `planning/adoption.json`, refreshed on 2026-10-15 against `planning/org-inventory-2026-10-15.json`: the 15 repositories visible to `gh repo list bloxwap`, none archived. The 2026-10-13 inventory is kept for history. Each row records:

- applicability
- owner (a maintainer role until #57 records named owners)
- HIG version
- merged and open PRs
- validation
- status
- remaining work
- dated exceptions, each with scope, reason, owner, an expiry no more than 180 days ahead, and a tracking issue

`tests/docs.test.ts` fails when a visible repository has no row or when a row is missing these fields. Product surfaces (bloxwap.app, bloxwap.pro, bloxwap.com, the React Native app) and the five SDK docs sites have their own rows under `surfaces`.

## Status · 2026-10-15

| Group | Repositories | State |
| --- | --- | --- |
| Canonical | hig | Source of truth. npm publication is #56 and physical-device certification is #55 |
| SDK docs migrated | hyperliquid, chart, font, sfx, haptic | Merged and verified on HIG `0.1.0-candidate.sha7c67a07c` (#34) |
| Product | monorepo | Pilot merged in #4515. #4522, #4523, #4525 (#33) and #4540 (#35) are approved and green but wait on the required human `signoff` |
| Newly found UI gaps | agent-cli (#58), taptradetv (#59), tapsiren (#60), bloxwap.github.io (#61) | Dated exceptions, each with a tracking issue |
| No HIG runtime | icons (asset source), dimension-adapters (no UI), .github (brand content), .github-private (no UI) | Decided; no dependency added |

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
