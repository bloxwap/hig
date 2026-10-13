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
npm run release:dry-run -- --channel candidate
npm run release:dry-run -- --channel stable-simulation
```

Candidate mode stages `0.1.0-candidate.sha<commit>` package metadata and matching internal dependency versions. Stable-simulation stages the coordinated source version. Runtime contract/docs source version and source commit are recorded explicitly; neither source files nor git refs are version-mutated by the dry run. Both produce local tarballs, checked export/types/CSS/assets/files/dependency manifests, hashes, changelog, copied docs artifact and provenance report. `npm pack --ignore-scripts` packs already validated outputs, never publishes. Physical claims remain pending in every report.

CI checks out PR source, installs locked peers, executes web/native/SSR/Metro/example/visual/accessibility/budget gates and uploads review artifacts. A provenance record identifies source commit, package/contract/docs versions and hashes; it is not an npm registry provenance attestation or a release. Artifact inspection checks exports, licenses, optional peers and only approved assets. No example app implementation is included in runtime packages.

Publication gates remain blocked in `planning/release-blockers.json`: task policy, unavailable monorepo audit, native font metadata, physical devices/assistive technology, upstream feedback gaps and owning migrations. A dry run cannot turn these into passes. This task does not “publish v1” by renaming a candidate.

Semver: breaking token meaning/appearance, typography scale, layout, accessibility/action behavior or semantic feedback mapping is major; compatible additions are minor; verified fixes patch. Deprecation names the alternative, migration codemod/checklist, owning consumers and a documented review window. Keep code/examples/API/citations at the same source commit; separate package prerelease identifiers are explicit in artifact metadata.

Rollback for an owning pilot: keep the previous package artifacts and lockfile, disable the host feature flag, restore prior renderer/backend imports and rebuild. Keep saved feedback/business data backward-compatible; never erase prior choices. Remove old assets only after production and physical-device proof. A future published rollback would require separate release authorization and package provenance; this task performs none.
