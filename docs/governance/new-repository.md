# New repository setup and upgrades · HIG 0.1.0

Issue #36. These steps adopt HIG in a new or existing Bloxwap repository without copying component folders, palettes, fonts or feedback engines. The five SDK docs sites followed this path: bloxwap/hyperliquid#180, bloxwap/chart#53, bloxwap/font#11, bloxwap/sfx#50 and bloxwap/haptic#26.

## 1. Pick applicability

Add or update the repository's row in `planning/adoption.json` (a PR to bloxwap/hig) with one of these applicability values:

| Applicability | Install | Never add |
| --- | --- | --- |
| Product runtime UI (web) | `@bloxwap/hig-tokens`, `-contracts`, `-react`; `@bloxwap/font` | Copied component folders or token CSS |
| Product runtime UI (React Native) | `@bloxwap/hig-tokens`, `-contracts`, `-native`, `-native-fonts`; optional `-feedback` plus Expo peers | DOM renderer imports, font binaries outside the manifest |
| Docs or marketing site | `@bloxwap/hig-tokens`, `-react` (CSS and the controls in use); `@bloxwap/font` | A local `.btn` layer, a palette copy, `vendor/hig` |
| Brand or content only | Nothing at runtime; follow the principles, content and brand chapters | React, RN or audio dependencies |
| No UI | Nothing; README and content conventions only | Any HIG runtime dependency |

## 2. Install versioned packages

HIG is not on npm yet (#56). Until it is, consume the packed candidate:

```sh
git clone https://github.com/bloxwap/hig && cd hig && git checkout <commit>
npm ci && npm run generate:fonts && npm run build
npm run release:dry-run -- --channel candidate   # local tarballs only; no publish, tag or release
```

`generate:fonts` needs Python with `fonttools[woff]==4.61.1` and `brotli==1.2.0`. In the consuming repository:

- Copy only the needed `artifacts/release-candidate/bloxwap-hig-*.tgz` files into `vendor/bloxwap-hig/`.
- Record their SHA-256 hashes and the source commit in a README or `provenance.json`.
- Depend on them with `file:` dependencies, adding `overrides` so HIG's internal dependencies resolve to the same files.

Never copy `packages/*/src`, `dist` folders, `tokens.css`, palettes, fonts or feedback engines. When #56 publishes, swap the `file:` dependencies for registry versions and delete `vendor/bloxwap-hig/`.

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
  with: {repository: bloxwap/hig, ref: <same commit as the vendored tarballs>, path: .hig}
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

1. Read the changelog in the dry-run artifact, or the npm release once #56 is done, together with the semver section of the release chapter.
2. Upgrade tokens, contracts, renderer and feedback together. Never mix candidate commits. Recompute the vendored hashes.
3. Update the drift checkout `ref` to the same commit and run the check. Remove exceptions whose need has gone.
4. Re-run the validation in step 4 and update the matrix row's `higVersion` and PR links.
5. Roll back by reverting the upgrade PR, which restores the previous tarballs and lockfile. Product pilots also keep their host feature flag (for example `NEXT_PUBLIC_HIG_PILOT=0`).
