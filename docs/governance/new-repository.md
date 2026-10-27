# New repository setup and upgrades · HIG 0.1.2

Issue #36. These steps adopt HIG in a new or existing Bloxwap repository without copying component folders, palettes, fonts or feedback engines. The five SDK docs sites followed this path: bloxwap/hyperliquid#180, bloxwap/chart#53, bloxwap/font#11, bloxwap/sfx#50 and bloxwap/haptic#26.

## 1. Pick applicability

Add or update the repository's row in `planning/adoption.json` (a PR to bloxwap/hig) with one of these applicability values:

| Applicability | Install | Never add |
| --- | --- | --- |
| Product runtime UI (web) | `@bloxwap/hig-tokens`, `-contracts`, `-react`; `@bloxwap/font`; `-chart` with `@bloxwap/chart` only for `PriceChart` (#96) | Copied component folders or token CSS |
| Product runtime UI (React Native) | `@bloxwap/hig-tokens`, `-contracts`, `-native`, `-native-fonts`; optional `-feedback` plus Expo peers | DOM renderer imports, font binaries outside the manifest |
| Docs or marketing site | `@bloxwap/hig-tokens`, `-react` (CSS and the controls in use); `@bloxwap/font`; `-og-fonts` as a build-time dev dependency for OG cards only | A local `.btn` layer, a palette copy, `vendor/hig`, `-native-fonts` for OG cards |
| Brand or content only | Nothing at runtime; follow the principles, content and brand chapters | React, RN or audio dependencies |
| No UI | Nothing; README and content conventions only | Any HIG runtime dependency |

## 2. Install versioned packages

Install the required packages at the same exact published version. For a web consumer:

```sh
npm install --save-exact @bloxwap/hig-contracts@0.1.2 @bloxwap/hig-tokens@0.1.2 @bloxwap/hig-react@0.1.2
```

Native consumers install `@bloxwap/hig-native` and `@bloxwap/hig-native-fonts` instead of the DOM renderer; add feedback only where needed and satisfy the supported profile's peers. Keep all HIG dependencies and overrides aligned. Commit the lockfile and record the release, source commit and exact registry integrity values in the owning evidence manifest.

Building candidates requires `npm run generate:fonts` with Python packages `fonttools[woff]==4.61.1` and `brotli==1.2.1`. Registry consumers use the packaged fonts without generating them.

For unpublished changes only, follow the [release dry-run procedure](release.md) and consume its exact packed candidate archives. Never copy `packages/*/src`, `dist` folders, token CSS, palettes, fonts or feedback engines. Replace candidate `file:` dependencies with registry versions and remove obsolete archives when adopting a published release. Retain provenance manifests and historical validation records.

Then follow the installation chapter for your platform: import `@bloxwap/hig-tokens/css` and `@bloxwap/hig-react/css` once (add `@bloxwap/hig-react/css/base` first only when HIG owns the whole page), use per-component imports, load fonts through `@bloxwap/font`, and on native register fonts from the HIG font manifest.

## 3. Add the scoped drift check to CI

Create `hig-drift.json` in the repository root:

```json
{
  "paths": ["apps/docs/app", "apps/docs/components", "apps/docs/lib", "apps/docs/styles"],
  "canonical": [],
  "obsoleteImports": [],
  "exceptions": []
}
```

Run the check from a pinned HIG checkout. The script uses only Node built-ins and needs no install:

```yaml
- uses: actions/checkout@v4
  with: {repository: bloxwap/hig, ref: <source commit of the installed release>, path: .hig}
- run: node .hig/scripts/drift.mjs --root . --config hig-drift.json
```

- **Scope:** only paths you have migrated. Widen `paths` as more surfaces move.
- **`canonical`:** use it only for assets the repository owns. For example, `bloxwap/font` owns its web font files.
- **Exceptions:** record any other exception with an owner, a reason and an expiry no more than 180 days ahead, following the contribution chapter's exception policy.

First run against current `main` heads on 2026-10-15, scanning `apps/docs` (automated, local):

- hyperliquid and haptic pass.
- sfx flags the brand-mark fill in `lib/og-card.tsx`. That needs an exception like HIG's own brand marks.
- chart flagged `styles/hig-roles.generated.css` (#66). [chart#56](https://github.com/bloxwap/chart/pull/56) deleted it.
- font flags its own font binaries, which belong under `canonical`.
- agent-cli flagged `vendor/hig/tokens.css`, its import, and committed TTFs (#58). [agent-cli#47](https://github.com/bloxwap/agent-cli/pull/47) removed them, and its drift check now passes with no exceptions.

## 4. Validate and record

- Build the site or app and run the repository's lint, typecheck, test and browser checks, plus keyboard, 390px mobile, large text and RTL checks.
- Measure CSS, JS and font bytes and the dependency count before and after.
- Link the merged PR, the HIG version and any dated exceptions in the matrix row.
- Label evidence as automated, browser, iOS Simulator, Android emulator or physical device.

## Upgrading HIG

1. Read the release changelog (or the dry-run changelog for an unpublished candidate), together with the semver section of the release chapter.
2. Upgrade tokens, contracts, renderer and feedback together. Never mix release versions or candidate commits. Verify the registry integrity values or candidate archive hashes.
3. Update the drift checkout `ref` to the same commit and run the check. Remove exceptions whose need has gone.
4. Re-run the validation in step 4 and update the matrix row's `higVersion` and PR links.
5. Roll back by reverting the upgrade PR, which restores the previous exact versions and lockfile. Product pilots also keep their host feature flag (for example `NEXT_PUBLIC_HIG_PILOT=0`).
