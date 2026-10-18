# Release candidates, semver and rollback · HIG 0.1.0

Issue #32. This task's automation is **dry-run only**. It never invokes npm publication, GitHub release or git tag creation. Unsupported flags fail before artifact creation. No npm credentials are requested or used.

```sh
npm ci
npm run check
npm run examples:check
npm run quality
npm run smoke:packed
npm run smoke:packed-native
npm run smoke:packed-next
npm run smoke:packed-css
npm run release:dry-run -- --channel candidate
npm run release:dry-run -- --channel stable-simulation
```

Candidate mode stages `0.1.0-candidate.sha<commit>` package metadata and matching internal dependency versions. Stable-simulation stages the coordinated source version. Runtime contract/docs source version and source commit are recorded explicitly; neither source files nor git refs are version-mutated by the dry run. Both produce local tarballs, checked export/types/CSS/assets/files/dependency manifests, hashes, changelog, copied docs artifact and provenance report. `npm pack --ignore-scripts` packs already validated outputs, never publishes. Physical claims remain pending in every report.

CI checks out PR source, installs locked peers, executes web/native/SSR/Metro/example/visual/accessibility/budget gates and uploads review artifacts. A provenance record identifies source commit, package/contract/docs versions and hashes; it is not an npm registry provenance attestation or a release. Artifact inspection checks exports, licenses, optional peers and only approved assets. No example app implementation is included in runtime packages.

Publication gates are tracked in `planning/release-blockers.json`:

- npm credentials are not configured on the release machine (#56).
- Physical devices and assistive technology (#55).
- Upstream feedback gaps (#70).
- Owning product migrations that are still open (#33, #35).

A dry run cannot turn these into passes, and renaming a candidate does not publish v1.

Semver:

- **Major:** breaking changes to token meaning or appearance, typography scale, layout, accessibility or action behaviour, or semantic feedback mapping.
- **Minor:** compatible additions.
- **Patch:** verified fixes.

Deprecation names the alternative, a migration codemod or checklist, and the owning consumers from `planning/adoption.json`. A deprecated export keeps working for at least one minor release and 30 days, and is removed only in the next major release after consumer PRs are merged or have dated exceptions (see the contribution chapter). Keep code/examples/API/citations at the same source commit; separate package prerelease identifiers are explicit in artifact metadata.

Rollback for an owning pilot: keep the previous package artifacts and lockfile, disable the host feature flag, restore prior renderer/backend imports and rebuild. Keep saved feedback/business data backward-compatible; never erase prior choices. Remove old assets only after production and physical-device proof. A future published rollback would require separate release authorization and package provenance; this task performs none.

## Maintainer-controlled registry publication (#56)

The local dry-run command remains unable to publish, create tags, or create releases. The separate `publish.yml` workflow is manual and accepts an existing version tag only. Before its publishing job can start, it requires configured reviewers on the `npm-release` GitHub environment and a successful candidate quality run for that exact commit. The environment then supplies the maintainer review gate.

The workflow rebuilds stable-simulation artifacts and runs `release:verify`: the tag, source commit and coordinated version must match; the complete seven-package set and every tarball hash must match; and all release blockers must be cleared or have a dated, named-owner approval link. Expired or undocumented exceptions fail. Uncommitted source changes fail. It never creates the tag or GitHub release for the maintainer.

An npm org owner must configure trusted publishing for each package name for `bloxwap/hig`, workflow `publish.yml`, environment `npm-release`, and approve the first registry version. The workflow pins npm 11.6.1 and Node 22.22.0, meeting [npm's trusted-publishing requirements](https://docs.npmjs.com/trusted-publishers/). Scope/name setup and any first-publish bootstrapping remain owner actions; no token is requested or stored by HIG tooling. Current local `npm whoami` returns E401 and `@bloxwap/hig-tokens` is not available from the public registry, so publication remains blocked.

Only after those gates does the workflow publish the exact verified tarballs with provenance. `smoke:registry` checks the registry tarball SHA-256 values and source-linked attestations, then runs independent web/SSR, Next hydration/font, and both native Metro/Expo consumers against registry versions. These registry checks have not been run successfully before publication. A failed post-publish check requires a maintainer response and a new version; automation never unpublishes or overwrites a registry version.
