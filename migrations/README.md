# Migration kit · HIG 0.1.0 candidate

User scope: produce guides, codemods and checklists **inside hig**. No owning repository is pushed, modified, migrated or certified by this work. Candidates are local tarballs; no npm release exists. The referenced product monorepo is inaccessible (404). Review import maps against the actual consumer source before running a codemod.

`node codemods/imports.mjs --platform web consumer.tsx` previews approved named-import changes. `--write` is an owning maintainer action after review. The tool does not touch business logic, props, assets, storage or unknown imports. It reports legacy variants and API-review requirements. Unsupported/default/namespace/mixed imports remain unchanged. Test fixtures live in hig; no other repo is targeted.

Follow [product pilots](../docs/migration/products.md), [SDK docs pilots](../docs/migration/sdk-docs.md), [native pilots](../docs/migration/native.md) and [governance](../docs/governance/adoption.md). Record version, owner, dated exception, linked owning PR, build/visual/keyboard/touch/feedback proof, measured delta and rollback in `planning/adoption.json`. No surface is called migrated without owning-repo evidence.
