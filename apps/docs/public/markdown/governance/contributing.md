# Contribution, ownership and admission · HIG 0.1.0

Issue #36. This chapter sets out how HIG stays the one maintained design system for Bloxwap. It covers who owns what, how changes are reviewed, how components enter and leave the catalog, which platforms are supported, and how a product can justify an exception. Release, semver and deprecation rules are in the release chapter. Setting up and upgrading a repository is covered in the new-repository chapter.

## Canonical ownership

| Area | Canonical owner | Others may |
| --- | --- | --- |
| Semantic tokens (colour roles, space, radius, type, motion, density), native colour spaces, contrast pairs | `bloxwap/hig` → `@bloxwap/hig-tokens` | Map roles to host variables with `var()`. They may not redefine literal values. |
| Component contracts, DOM and React Native renderers, recipes, the semantic feedback contract | `bloxwap/hig` → `@bloxwap/hig-contracts`, `-react`, `-native`, `-feedback` | Compose components and override layout in context. They may not fork a primitive's paint or geometry. |
| Font sources, families and web loaders | `bloxwap/font` → `@bloxwap/font` | HIG generates pinned native faces from Font releases. Consumers install fonts and never commit binaries. |
| Sound recipes and the Web Audio engine | `bloxwap/sfx` | HIG owns the cue mapping and preferences, and exports approved WAV cues for native. |
| Haptic presets and the web engine | `bloxwap/haptic` | HIG owns the RN adapter and the capability matrix. |
| Chart engine | `bloxwap/chart` | HIG owns chart theming and the accessible non-canvas alternative. |
| Product business logic, routing and data | The owning product repository | HIG components never import wallet, network or trading code. |
| Brand marks | `bloxwap/hig` brand component (pinned from the Font SVG) | Use the component. Exact mark fills need a dated exception. |

The organization adoption matrix (`planning/adoption.json`) records the owner, applicability, HIG version, merged PRs, status and dated exceptions for each repository and product surface.

## Contribution and review criteria

Every HIG pull request must:

1. **Link its issue** (`Part of #N` or `Closes #N`) and state its intent, the states it affects and its platform mapping.
2. **Change source and generated artifacts together**, then run `npm ci && npm run check` (build, lint, generation drift, typecheck, web and native tests). Also run the smokes relevant to the change: `smoke:ssr`, `smoke:packed`, `smoke:packed-native`, `smoke:packed-boundaries`, `smoke:packed-examples`, `examples:check` and `quality`.
3. **Cover behaviour on both renderers**, or record the platform decision and its supported alternative. Include accessible names, roles and states, keyboard and focus, native back, large text and RTL, and muted operation (sound and haptics off) without losing essential feedback.
4. **Label evidence precisely**: automated, browser, iOS Simulator, Android emulator or physical device. A mock, simulator or emulator never proves physical sound, haptics, VoiceOver or display output.
5. **List the checks that were not run**, upstream gaps, rollout and rollback. Breaking changes follow the release chapter.
6. **Pass the scoped anti-drift check** (`node scripts/drift.mjs`, run by `npm run quality` and tests). New exceptions follow the exception policy below.

A maintainer reviews against the same list. A PR that only updates screenshots or baselines must say why the visual change is intended.

## Component admission

A component or recipe enters the catalog only when all of the following hold:

- It is used repeatedly in at least two Bloxwap surfaces, or one product surface plus an SDK docs site, and the inventory (`planning/catalog.json`) cites that usage.
- It has a minimal API that composes existing primitives, with no wallet, network or trading dependencies and no unrelated imports. The per-entry export and boundary smokes enforce this.
- It has a React DOM renderer and either a React Native renderer or a documented native alternative, and the platform matrix is updated.
- It has a complete state matrix: focus, pressed, busy/disabled, error, empty, long text, large text, reduced motion, and feedback disabled where relevant. It also has catalog examples that typecheck in the packed consumers.
- It is documented: a usage chapter, an API reference, accessibility notes and a migration note for each fork it replaces.

## Component removal

1. Inventory every consumer with org-wide code search and the adoption matrix.
2. Deprecate the component in a minor release. Name the replacement, provide a codemod or checklist, and keep the export working for at least one minor release and 30 days.
3. Open removal PRs in each consuming repository, or record dated exceptions for them.
4. Remove the component in the next major release and record the change in the changelog and the matrix.

## Platform support policy

| Platform | Supported (tested in CI or recorded evidence) | Notes |
| --- | --- | --- |
| React DOM | React 19.2; Vite, SSR and Next 16.4 (webpack) packed consumers; Chromium, Firefox and WebKit | Other bundler or Next versions need checks in the host |
| React Native | RN 0.81.5 with Expo 54 and React 19.1.0; RN 0.83.10 with Expo 55 and React 19.2.0 (#68); Metro; packed Android/iOS exports in CI for both; iOS Simulator (iOS 26.5) and Android emulator (API 35) gallery runs for both | RN 0.82 and 0.84+ are not supported. On RN 0.83 Android a per-app RTL locale does not reach `I18nManager.isRTL`, so RTL hosts pass `direction={localeDirection(getLocales()[0])}` ([localization](../foundations/localization.md#native-direction-from-the-host-locale), #86). Physical devices are pending (#55) |
| Tokens only | Plain CSS, Tailwind through host config, typed tokens | No React, RN or audio peers |
| Feedback | Web: `@bloxwap/sfx` and `@bloxwap/haptic`. Native: Expo audio and haptics adapters | Essential outcomes must never depend on sound or haptics |

Support only changes in a minor or major release. Each change updates `docs/architecture/platform-matrix.md`, the packed smokes and this table together.

## Justified product exceptions

A product may differ from HIG only through a recorded exception. Silent forks are not allowed.

- **Scope:** an exact path or folder prefix, and a single anti-drift rule (`obsolete-import`, `copied-palette`, `copied-token-definition`, `copied-primitive-css` or `copied-font-binary`).
- **Required fields:** `owner` (an accountable role or person), `reason` (the user or product need, or the rollback dependency) and `expires` (`YYYY-MM-DD`, at most 180 days ahead).
- **Where:** HIG's own exceptions go in `planning/drift-exceptions.json`. An adopting repository keeps its exceptions in its own `hig-drift.json`. The adoption matrix links to them.
- **Review:** the check fails on expired exceptions and on exceptions without an owner or reason, and warns about unused ones. Renewing an exception needs a new reason and owner approval. Repeated exceptions for the same need are a signal to propose a HIG change through the admission criteria.

Intentional density differences, such as compact Pro versus the comfortable touch app, are HIG density modes. They are not exceptions.

## Scoped anti-drift checks

`scripts/drift.mjs` has no dependencies and checks only files tracked in git under the configured `paths`. Paths listed under `canonical` are exempt from the copy rules.

| Rule | Fails when |
| --- | --- |
| `obsolete-import` | Code imports a retired fork (`@workspace/tokens`, `@workspace/ui`, `@workspace/ui-native`, plus repository-specific `obsoleteImports`) or a copied `vendor/hig/` or `styles/hig/` folder |
| `copied-palette` | Code hard-codes the Bloxwap brand hexes owned by `@bloxwap/hig-tokens` |
| `copied-token-definition` | A stylesheet assigns a literal value to a `--hig-*` token. Remapping one role to another with `var()` is allowed |
| `copied-primitive-css` | A bare `.hig-*` selector sets the primitive's paint or geometry (background, border, radius or min-height). Contextual layout overrides are allowed |
| `copied-font-binary` | A `.ttf`, `.otf` or `.woff*` file is committed outside a canonical font owner |

Generation drift (stale tokens, brand or glossary outputs) is checked separately by `scripts/check-drift.mjs` in `npm run lint`.
