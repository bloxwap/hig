# Release candidates, semver and rollback · HIG 0.1.2

Issue #32. The local release automation is **dry-run only**. It never invokes npm publication, GitHub release or git tag creation. Unsupported flags fail before artifact creation. The dry run does not request or use npm credentials; registry publication is confined to the maintainer-controlled workflow described below.

```sh
npm ci
npm run check
npm run examples:check
npm run quality
npm run generate:fonts   # Python with fonttools[woff]==4.61.1 and brotli==1.2.1
npm run smoke:packed
npm run smoke:packed-og
npm run smoke:packed-native
npm run smoke:packed-next
npm run smoke:packed-css
npm run smoke:packed-boundaries
npm run smoke:packed-chart-workspace
npm run release:dry-run -- --channel candidate
npm run release:dry-run -- --channel stable-simulation
```

Candidate mode stages `<version>-candidate.sha<commit>` package metadata and matching internal dependency versions. Stable-simulation stages the coordinated source version. Runtime contract/docs source version and source commit are recorded explicitly; neither source files nor git refs are version-mutated by the dry run. Each dry run rebuilds packages and docs before staging so ignored output cannot retain an older API. Both produce local tarballs, checked export/types/CSS/assets/files/dependency manifests, hashes, changelog, copied docs artifact and provenance report. `npm pack --ignore-scripts` packs already validated outputs, never publishes. Physical claims remain pending in every report.

The release dry run, `npm run quality`, `smoke:packed-native` and `smoke:packed-og` first check that the generated TTF faces exist and match their manifests (#98). If any face is missing or stale, they stop before building anything. The message names `npm run generate:fonts` and its Python pins and lists the affected files, instead of failing with a raw `ENOENT`. `packedSizes` in the report records the packed and unpacked bytes and the font-file counts of `@bloxwap/hig-tokens` (no fonts), `@bloxwap/hig-native-fonts` and `@bloxwap/hig-og-fonts`. The dry run fails if any other package contains a font binary, or if `@bloxwap/hig-og-fonts` reaches 1,000,000 B packed (#99). `smoke:packed-og` builds the documented `app/og/route.tsx` handler with Turbopack (the Next 16 default) and with `--webpack`. It serves each build with `next start`, and also as moved standalone output. Every face's SHA-256 has to match, so a loader that bundles only one face fails here.

The chart adapter ships as its own artifact, `@bloxwap/hig-chart` (#96). The dry run fails unless `@bloxwap/hig-chart` declares `@bloxwap/chart` as a required peer and no other artifact names `@bloxwap/chart` in dependencies or peers. The result is recorded in `chartAdapter` in the report. `npm run quality` applies the same rule to the source manifests and to every built `dist` file. `smoke:packed-boundaries` checks that the packed hig-react manifest has no `./chart` entry and no `@bloxwap/chart` peer, and that `PriceChart` renders on the server with its required peer installed. `smoke:packed-chart-workspace` builds a host shaped like bloxwap/chart: an npm workspace whose `packages/chart` provides `@bloxwap/chart` 0.3.0, plus `apps/docs`, which depends on it and on the packed hig-react, hig-chart, tokens and contracts through `file:` specs. The smoke deletes `package-lock.json` and `node_modules` and installs with `legacy-peer-deps=false` and `strict-peer-deps=true`. It then asserts four things. The lockfile keeps `packages/chart` and the `node_modules/@bloxwap/chart` link. `npm ls` is clean. Node and esbuild resolve `@bloxwap/chart` (including hig-chart's lazy `@bloxwap/chart/react`) from the app into the workspace. The host's `HIGProvider` messages reach `PriceChart`. It repeats the checks after `npm ci` and requires a second `npm install` to leave the lockfile byte-identical. Every scenario runs twice: once with the ambient npm (in CI, the npm bundled with Node 24.22.1) and once with the npm pinned in `packageManager` (11.6.1, the version chart reported), which is installed into a scratch prefix. A control run repacks hig-react with the old optional peer and records in `evidence/packed-chart-workspace-smoke.json` whether each npm still drops the workspace.

CI checks out PR source, installs locked peers, executes web/native/SSR/Metro/example/visual/accessibility/budget gates and uploads review artifacts. A provenance record identifies source commit, package/contract/docs versions and hashes; it is not an npm registry provenance attestation or a release. Artifact inspection checks exports, licenses, optional peers and only approved assets. No example app implementation is included in runtime packages.

Publication gates are tracked in `planning/release-blockers.json`. The owner
explicitly authorized the first coordinated npm publication, including the
customizable primary-colour provider, on 2026-10-23; see
[the release authorization](../../evidence/release/owner-authorization-2026-10-23.md)
and [PR #141](https://github.com/bloxwap/hig/pull/141).

Releases 0.1.0 and 0.1.1 used an organization token. Release 0.1.2 uses npm trusted publishing; subsequent workflow executions have no token fallback. Released SFX/Haptic 0.2.0 backends satisfy their setup gates. Physical-device and native-font acceptance use the
existing dated owner attestation from PR #131. Source-parity and named adoption decisions are accepted in #57. Owning-product
rollout and six non-English glossary entries retain scoped exceptions through
2027-01-15; real wallet acceptance and rollback retirement remain open in #110.
These exceptions do not turn unobserved product or physical checks into passes.
The immutable-tag, package-set, tarball-hash and CI checks still apply.

Semver:

- **Major:** breaking changes to token meaning or appearance, typography scale, layout, accessibility or action behaviour, or semantic feedback mapping.
- **Minor:** compatible additions.
- **Patch:** verified fixes.

Deprecation names the alternative, a migration codemod or checklist, and the owning consumers from `planning/adoption.json`. A deprecated export keeps working for at least one minor release and 30 days, and is removed only in the next major release after consumer PRs are merged or have dated exceptions (see the contribution chapter). Keep code/examples/API/citations at the same source commit; separate package prerelease identifiers are explicit in artifact metadata.

Rollback for an owning pilot: keep the previous package artifacts and lockfile, disable the host feature flag, restore prior renderer/backend imports and rebuild. Keep saved feedback/business data backward-compatible; never erase prior choices. Remove old assets only after production and physical-device proof. A future published rollback would require separate release authorization and package provenance; this task performs none.

## Maintainer-controlled registry publication (#56)

The local dry-run command remains unable to publish, create tags, or create releases. The separate `publish.yml` workflow has two GitHub-hosted `ubuntu-24.04` jobs, `prerequisites` and `publish`, as the explicit exception to the self-hosted runner policy. Publishing a GitHub release with a `v*` tag triggers it; maintainers can also dispatch it manually with the existing tag as both the workflow ref and input, for example `gh workflow run publish.yml --ref v0.1.2 -f tag=v0.1.2`. It validates the tag and checks out `refs/tags/<tag>` so every gate runs against that tag commit. Before publication, `prerequisites` fails unless the `npm-release` environment has required reviewers and `quality.yml` succeeded for this exact tag commit. Manual dispatch rejects a branch ref because the OIDC provenance source must identify the release tag, then resolves that tag SHA. The `publish` job needs both the unchanged self-hosted `security` release scan and these prerequisites, waits for `npm-release` environment approval, and verifies that the checked-out tag still matches the approved SHA. Checkout does not persist credentials.

The workflow re-runs `npm run check`, `npm run quality`, the stable-simulation release dry run, and `node scripts/verify-release.mjs` in that order. The tag, source commit and coordinated version must match; the complete eight-package set and every tarball hash must match. Every gate in `planning/release-blockers.json` must be `cleared`, `satisfied`, or have a valid `approved-exception` with a named approver, approval link and unexpired review date. Expired or undocumented exceptions and uncommitted source changes fail. It never creates the tag or GitHub release for the maintainer.

An npm owner must configure a **Trusted Publisher for each of the eight packages**: `@bloxwap/hig-contracts`, `@bloxwap/hig-tokens`, `@bloxwap/hig-feedback`, `@bloxwap/hig-react`, `@bloxwap/hig-native`, `@bloxwap/hig-chart`, `@bloxwap/hig-native-fonts`, and `@bloxwap/hig-og-fonts`. Every entry must specify repository **bloxwap/hig**, workflow **publish.yml**, and environment **npm-release**. The GitHub `npm-release` environment is configured with `joeblau` as required reviewer; all eight npm settings were configured and read back using authenticated owner access on 2026-10-27. Changing this workflow alone does not configure npm. The token-published [0.1.0](https://github.com/bloxwap/hig/releases/tag/v0.1.0) and [0.1.1](https://github.com/bloxwap/hig/releases/tag/v0.1.1) releases predate this migration; their exact source commits are the recorded legacy exceptions below.

Publication uses `contents: read`, `id-token: write`, OIDC trusted publishing and `npm publish --provenance`. The transitional `NPM_TOKEN` fallback is removed. Release 0.1.2's registry metadata identifies GitHub Actions and each package's configured `trustedPublisher` ID; signed provenance is verified separately. Provenance alone does not identify the authentication method. The shared organization secret is not deleted because other repositories use it; this workflow no longer references it. The ephemeral hosted runner uses Node 24.22.1 and explicitly installs npm@11.6.1 (the repository's `packageManager` pin), satisfying the [npm trusted-publishing CLI minimum of 11.5.1](https://docs.npmjs.com/trusted-publishers/). Python 3.12 comes from pinned `actions/setup-python`; `ci-generate-fonts.sh` installs pinned fonttools and brotli into a temporary venv. Playwright installs Chromium with `--with-deps` on Ubuntu. The shared minis retain their existing setup policy.

Only after those gates does the workflow publish the exact verified tarballs in dependency order. Already published versions are logged and skipped so an interrupted run can resume. Successful publishes are recorded in `artifacts/published-packages.txt`; the workflow passes this file as `HIG_PROVENANCE_PACKAGES_FILE` to `smoke:registry`. Registry smoke always checks every tarball's SHA-256 against the verified artifact, checks the SLSA statement's exact source commit, workflow, tag, package and SHA-512 digest, and runs `npm audit signatures` to verify the registry signatures and provenance bundles. Provenance remains required when an interrupted publication resumes and skips existing packages, and when the smoke runs without a publish manifest. The only legacy exemptions are token-published 0.1.0 at source `bdf8d07014fea5e69ea51a061b82707661a9d701` and 0.1.1 at source `6f4dd060e0985be644d255154aa7a0277cdde27f`; a supplied missing or invalid manifest fails closed. The manifest is uploaded with the verification artifacts.

Registry smoke then runs independent web/SSR, Next hydration/font, and all three supported native Metro/Expo profiles against registry versions.

Newly published exact versions can briefly return npm metadata `E404` while registry visibility catches up. That lookup retries at most thirty-one times, ten seconds apart (five minutes of bounded visibility retries), with a 15-second limit per npm command. Other npm errors, malformed metadata, unavailable tarballs, hash mismatches and consumer failures still fail normally. An exhausted metadata-visibility retry requires investigation; once the version is visible, rerun the unchanged release tag. A published package defect requires a corrected new version. Automation never unpublishes or overwrites a registry version, and a skipped version with different bytes still fails the registry hash check.
