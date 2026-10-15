# Contributing

HIG is the one maintained Bloxwap design system. Read the governance chapters before opening a PR:

- `docs/governance/contributing.md`: canonical ownership, review criteria, component admission and removal, platform support policy, justified product exceptions and the anti-drift rules.
- `docs/governance/release.md`: release candidates, semver, deprecation and rollback.
- `docs/governance/new-repository.md`: adopting or upgrading HIG in another repository without copying component folders, palettes, fonts or feedback engines.
- `docs/governance/adoption.md` and `planning/adoption.json`: the organization adoption matrix.

Every PR:

1. Links its issue and explains intent, states, accessibility, platform mapping, migration and rollback.
2. Runs `npm ci && npm run check` (build, lint, generation drift, typecheck, web and native tests), plus the relevant smokes: `smoke:ssr`, `smoke:packed`, `smoke:packed-native`, `smoke:packed-boundaries`, `smoke:packed-examples`, `examples:check`, `quality`.
3. Updates source and generated artifacts together and keeps examples out of runtime packages.
4. Labels evidence as automated, browser, iOS Simulator, Android emulator or physical device. It never claims a mock or simulator proves physical sound, haptics, VoiceOver or display output.
5. Lists checks it did not run and any upstream gaps. Every drift exception it adds has an owner, a reason, an expiry no more than 180 days ahead, and a tracking issue.

Cite HIG with a version and an immutable commit permalink. Publication runs only through the guarded release process (#56). The dry run never publishes, tags or creates releases.
