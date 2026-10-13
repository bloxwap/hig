# Organization adoption and governance (#36)

The active-repo matrix is `planning/adoption.json`, dated 2026-10-13. It includes empty/no-UI/tooling repositories as well as SDK docs and product targets. A role owner and expiry are explicit; personal/team assignment and owning PR URLs remain pending, never fabricated. Product monorepo is an explicit inaccessible external target, even though it is absent from the visible org repo list.

Every new repo chooses runtime, docs/marketing, brand/content-only or no-UI applicability. No-UI repos reference principles/content/brand rules without adding React/native/audio dependencies. Runtime repos use individual platform imports and CI package/behavior checks. SDK demos stay owned by their SDK. HIG owns token and component contracts; Font/SFX/Haptic/Chart own their engines/assets.

Review/admission requires actual repeated usage evidence, minimal API, both platform mapping or reasoned alternative, complete states, accessible labels/focus/back/large text, muted operation, tests/examples/docs and migration/rollback. Remove a component only after consumers are inventoried and a deprecation window is observed. New palette/primitive copies are blocked by scoped anti-drift checks with owner/reason/expiry exceptions.

Semver: token/type/geometry changes, action timing, accessible behavior and semantic cue maps are API changes. Breaking behavior requires a major; new compatible roles/exports a minor; verified fixes a patch. Deprecations retain old exports for a documented migration window and provide a codemod/checklist. Candidate artifacts and docs share commit provenance; stable publication stays gated by missing source audit/device/adoption evidence and is prohibited by this task.

Completion review: all 36 issues need an owning implementation/validation link or explicit blocker; catalog entries need docs/code/platform/test coverage; source/bundle deltas must be measured; all active rows must have owner, version, status, residuals and dated exceptions. This matrix cannot be called migrated until owning-repo changes and device checks exist.
