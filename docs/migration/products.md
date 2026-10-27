# App, Pro and marketing pilots (#33)

Owner: Joe Blau, accepted in [HIG #57](https://github.com/bloxwap/hig/issues/57). The initial pilot and follow-ups are merged; the combined rollout is [monorepo#4619](https://github.com/bloxwap/monorepo/pull/4619), and [#4826](https://github.com/bloxwap/monorepo/pull/4826) upgrades the registry consumers to HIG 0.1.2 with the compact Pro stats geometry preserved. Marketing font cleanup is merged in [#4598](https://github.com/bloxwap/monorepo/pull/4598). `planning/adoption.json` records the current versions, rollback flags and remaining real wallet acceptance under HIG #110. The checklist below preserves the adoption procedure.

| Surface | Pilot and HIG mapping | Preserve | Owner work remaining |
| --- | --- | --- | --- |
| bloxwap.app | Amount/field, review action, sheet/confirmation, account/feedback settings; comfortable 48 targets | Raw amount/precision, wallet/network logic, busy protection, sheet descriptions, saved preferences and physical iOS tap eligibility | Audit actual primitives/brand OKLCH, review import preview, migrate a host-flagged pilot, validate production/mobile/keyboard/feedback screenshots |
| bloxwap.pro | Compact nav/order entry, market rows, numbers/table and optional chart | Keyboard order, desktop density, sort/precision, chart pan/zoom/crosshair, live updates remain quiet | Confirm legacy variants, wire host router and chart theme, compare dense before/after captures and per-component/representative bundles |
| bloxwap.com | Hero/CTA/features, typography and plain CSS/tokens where appropriate | Marketing content/links, metadata, static hosting and responsive CTA access | Replace copied CSS/fonts only after consumers removed; build public site and compare representative pages/asset bytes |

Checklist:
- [ ] Pin HIG candidate artifacts/contract version and record source commit/baseline screenshots, CSS/font/duplicate/bundle bytes.
- [ ] Run import-only codemod preview; inspect every diff. Do map brand→primary and danger→destructive after intent review; don't blindly map sell to danger or apply shadcn variants unchanged.
- [ ] Preserve existing raw financial/business state; host validation still owns parsing and submission. No request on focus/open.
- [ ] Wire explicit CSS/fonts/provider, comfortable app versus compact Pro, labelled fields and confirmation title/description.
- [ ] Bridge legacy feedback preferences explicitly; never replace saved false choices with new enabled defaults. Physical tick must be pre-approved; async iOS outcomes can be silent.
- [ ] Build the owning production app; verify keyboard, mobile, long labels, 200% text, RTL, stale/offline/error, muted channels and busy protection.
- [ ] Compare before/after at the same viewport/data/toolchain; record measured source/asset/bundle delta without guessed improvements.
- [ ] Remove old copies/dependencies only after reference search and build/device proof. Link owning PR and residual surface work in adoption matrix.

## Partial adoption: scoped component CSS and the opt-in base (#95)

`@bloxwap/hig-react/css` now styles HIG components only, so a product can load it on the routes it migrates and leave the rest of the site alone. Next.js keeps a route's stylesheet after a client navigation. Before #95 the file also set page-wide rules (`* { box-sizing }`, a global `:focus-visible` ring, `table`/`th`/`td` and `input[type=range]` defaults), and these reached routes that never imported HIG. Those rules are now the opt-in entry `@bloxwap/hig-react/css/base` (see [installation](../installation.md#component-css-and-the-opt-in-base)).

- **Whole-page adopters** (bloxwap.app, bloxwap.pro, docs sites): add `import '@bloxwap/hig-react/css/base'` before `@bloxwap/hig-react/css` to keep the current look of plain tables, ranges and focus rings. HIG components need no change.
- **Partial adopters**: import only `@bloxwap/hig-react/css` in the HIG routes, and delete any host reset that undid the old global rules. taptradetv loads HIG only on `/sponsors` ([taptradetv#188](https://github.com/bloxwap/taptradetv/pull/188), #59). The registry refresh in [taptradetv#253](https://github.com/bloxwap/taptradetv/pull/253) includes #95 and removes the obsolete `th, td` reset in `apps/web/app/sponsors/sponsors-hig.css`. The `/schedule` calendar then keeps its own cell styles after a navigation from `/sponsors`, and non-HIG routes keep the host's focus ring.
- Before removing a reset, verify with a client navigation from a HIG route to a non-HIG route in a production build. Compare the computed styles of tables, ranges and focus rings, not only screenshots.

Rollback: keep the previous artifact lockfile and original UI behind a host feature flag. Revert the pilot switch/lockfile; keep raw settings/business data unchanged. Do not remove legacy files until the pilot is certified. The adoption matrix, not this kit, records which surfaces are migrated.
