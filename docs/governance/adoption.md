# Organization adoption and governance (#36)

The active-repository matrix is `planning/adoption.json`, refreshed on 2026-10-15 against `planning/org-inventory-2026-10-15.json`: the 15 repositories visible to `gh repo list bloxwap`, none archived. The 2026-10-13 inventory is kept for history. Each row records:

- applicability
- owner (Joe Blau, `joeblau`, accepts the recorded rows and exceptions in the [2026-10-27 decision record](../../evidence/adoption/owner-approval-2026-10-27.md))
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
| SDK docs migrated | hyperliquid, chart, font, sfx, haptic | Merged and verified (#34). Chart, SFX and Haptic moved to candidate `872906a9` in [chart#56](https://github.com/bloxwap/chart/pull/56), [sfx#52](https://github.com/bloxwap/sfx/pull/52) and [haptic#28](https://github.com/bloxwap/haptic/pull/28). Those PRs dropped the `legacy-peer-deps` setting, the nested Radix trees, the font bridges and the generated role file (#63, #65, #66). Hyperliquid and Font stay on `7c67a07c` |
| Product | monorepo | Pilot merged in #4515. #4522, #4523 and #4525 (#33) and #4540 (#35) are approved and green, and wait on the required human `signoff`. #4540 was refreshed onto candidate `c32771dc` and drops the #62, #64 and #67 workarounds |
| Docs site migrated | agent-cli (#58) | [agent-cli#47](https://github.com/bloxwap/agent-cli/pull/47) and [#48](https://github.com/bloxwap/agent-cli/pull/48) merged on candidate `872906a9`. The scoped drift check passes with no dated exceptions |
| Product, partly migrated | taptradetv (#59) | Every app is classified: web is product UI, host is a broadcast/capture surface, and auction, contest, deck, capture and stream have no HIG runtime. In [taptradetv#188](https://github.com/bloxwap/taptradetv/pull/188), the `/sponsors` auction moved to HIG with a rollback flag. The rest of web and host have dated exceptions tracked in #100 |
| Public pages migrated | tapsiren (#60), bloxwap.github.io (#61) | [tapsiren#399](https://github.com/bloxwap/tapsiren/pull/399) is merged and deployed to tapsiren.com; its mark and favicon colour is tracked in #101. [bloxwap.github.io#26](https://github.com/bloxwap/bloxwap.github.io/pull/26) uses only `--hig-*` roles in `styles.css`. Its package copies are committed because Pages has no build step (dated exceptions) |
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
