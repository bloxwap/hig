# Release candidates, semver and rollback · HIG 0.1.0

Issue #32. This task's automation is **dry-run only**. It never invokes npm publication, GitHub release or git tag creation. Unsupported flags fail before artifact creation. No npm credentials are requested or used.

```sh
npm ci
npm run check
npm run examples:check
npm run quality
npm run generate:fonts   # Python with fonttools[woff]==4.61.1 and brotli==1.2.0
npm run smoke:packed
npm run smoke:packed-og
npm run smoke:packed-native
npm run smoke:packed-next
npm run smoke:packed-css
npm run release:dry-run -- --channel candidate
npm run release:dry-run -- --channel stable-simulation
```

Candidate mode stages `0.1.0-candidate.sha<commit>` package metadata and matching internal dependency versions. Stable-simulation stages the coordinated source version. Runtime contract/docs source version and source commit are recorded explicitly; neither source files nor git refs are version-mutated by the dry run. Both produce local tarballs, checked export/types/CSS/assets/files/dependency manifests, hashes, changelog, copied docs artifact and provenance report. `npm pack --ignore-scripts` packs already validated outputs, never publishes. Physical claims remain pending in every report.

The release dry run, `npm run quality`, `smoke:packed-native` and `smoke:packed-og` first check that the generated TTF faces exist and match their manifests (#98). If any face is missing or stale, they stop before building anything. The message names `npm run generate:fonts` and its Python pins and lists the affected files, instead of failing with a raw `ENOENT`. `packedSizes` in the report records the packed and unpacked bytes and the font-file counts of `@bloxwap/hig-tokens` (no fonts), `@bloxwap/hig-native-fonts` and `@bloxwap/hig-og-fonts`. The dry run fails if any other package contains a font binary, or if `@bloxwap/hig-og-fonts` reaches 1,000,000 B packed (#99). `smoke:packed-og` builds the documented `app/og/route.tsx` handler with Turbopack (the Next 16 default) and with `--webpack`. It serves each build with `next start`, and also as moved standalone output. Every face's SHA-256 has to match, so a loader that bundles only one face fails here.

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
