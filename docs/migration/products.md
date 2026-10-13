# App, Pro and marketing pilots (#33)

Owner: product monorepo/application maintainers, assignment pending. Exception review: 2026-11-13. Source access and actual migration/build validation remain required. User forbids pushes to owning repos.

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

Rollback: keep the previous artifact lockfile and original UI behind a host feature flag. Revert the pilot switch/lockfile; keep raw settings/business data unchanged. Do not remove legacy files until the pilot is certified. This kit itself does not claim any origin migrated.
