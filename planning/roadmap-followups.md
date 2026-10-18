# Roadmap follow-ups · 2026-10-16

The live GitHub audit found 32 of the original 35 tasks closed. Original tasks #33, #35 and #36 remain open for owning-product rollout and approval. The v1 roadmap (#1) also retains physical certification (#55), registry publication (#56), named-owner approval (#57), and upstream feedback dependencies (#70).

This branch addresses HIG-owned software follow-ups. An implementation here is not an issue closure, production deployment, native-speaker approval, or physical-device observation.

| Issue | Implementation | Validation / remaining acceptance |
| --- | --- | --- |
| #86 | Native provider uses app-locale script direction when Android falsely reports LTR; explicit direction wins. Linked upstream #54938, #57635 and #58723. | Native tests and RN 0.83 Android Arabic-app-locale assertion pass: OS RTL false, HIG direction RTL. |
| #87 | Native Slider supplies localizable Increase/Decrease accessibility action labels. | Native semantic/disabled-action tests and Android action-tree checks pass with Increase/Decrease labels; physical TalkBack remains #55. |
| #88 | Historical Xcode audit note is scoped to RN 0.81.5; the runtime-differences guide records zero findings on RN 0.83.10. | Tagged source comparison rules out a new RCTUITextField UIFontMetrics implementation. Attribution of the changed heuristic remains unconfirmed; device VoiceOver remains #55. |
| #89 | Documented that SDK 54 completion callbacks do not dispatch another play; raw recorder events remain visible. | Injected duplicate completion events produce exactly one backend play; historical SDK 54/55 logs distinguish callbacks from dispatch. Audible latency remains #55. |
| #92 | Both native Button runs use HIG Text with registered weights, script spacing and provider/prop scale caps. | Native typography tests pass. iOS default/AX5 captures and frame measurements verify the cap reduces busy-button height; wrapping remains allowed. |
| #93 | Provider `colorSpace` selects canonical sRGB/P3 tables for all native color consumers and inherits through nested roots. | Native table-selection, control, field and alert tests pass. Physical panel comparisons remain #55. |
| #94 | Busy native Button derives a visible accessible name; explicit host labels and empty suffix overrides are preserved. | English/French/Korean/Arabic and empty-suffix tests pass. Android exposes `Review order · Working, busy`; iOS exposes the action name, busy value and disabled trait. |
| #95 | Component CSS scopes box sizing, focus, table, range and severity rules. Global box sizing/focus defaults move to opt-in `css/base`. | Browser before/after computed-style isolation check passes; migration/import instructions updated. |
| #96 | Shared React renderer drops the optional chart peer; hosts install the adapter's chart dependency directly. | Clean packed workspace retains its chart symlink through a fresh strict-peer lockfile and `npm ci`; Button SSR passes. |
| #97 | Tabs update the active panel's tab stop before paint; asynchronous content remains observed. | Parent-layout-effect regression test, existing keyboard tests and SSR smoke pass. |
| #98 | Shared font preflight supplies pinned generator/Python setup instructions before quality, release or packing. Release/quality/browser evidence records source provenance. | Missing-font fixture and actual missing-file CLI checks pass; quality and current seven-package candidate dry run pass. Historical native snapshots retain their original scope. |
| #99 | New `@bloxwap/hig-og-fonts` ships four Latin TTFs with canonical hashes. | Independent `next/og` PNG render passes; tarball is 667,891 bytes (under 1 MB). SDK upgrade instructions updated. |
| #102 | Plain ReactNode text concatenates first and normalizes whitespace once. | Native mixed-title announcement test passes. |

## Remaining owner and environment work

| Task | Current evidence / prerequisite |
| --- | --- |
| #33 / #35 | Monorepo PRs #4522, #4523, #4525 and #4540 are still open. Required owner signoff/merge is not inferred from automated checks. Consumers need the next coordinated candidate before dropping the #92–#94 workarounds. |
| #36 / #57 | Named owners, parity/bundle baselines and native-speaker approvals remain explicit approval tasks. Role names in the adoption matrix are not replaced with invented people. |
| #55 | Physical tactile, audible, real-panel, real-input and VoiceOver/TalkBack observations remain unperformed here. Simulator/emulator work is recorded separately. |
| #56 | A guarded manual publishing workflow, artifact verifier and registry consumer checks are prepared. E401/registry E404 are verified; trusted-publisher configuration, required environment reviewers and the first registry version remain maintainer actions. No workflow was dispatched and nothing was published. |
| #70 | Released SFX and Haptic versions are both 0.1.0; SFX PR #51 remains open. Per-root cancellation cannot be adopted before the upstream API ships. Existing simulator/emulator dispatch measurements are within the 16 ms budget; physical output remains #55. |
| #100 | TapTrade.tv's remaining route/host migration needs the product accent decision. The owner decision is pending in this task; dated exceptions remain until an owning migration is verified and merged. |
| #101 | Tapsiren's mark/favicon recolor or approved cyan exception needs the product brand decision. The owner decision is pending in this task. |

Native runtime details and source links: `docs/foundations/native-runtime-differences.md`. No remote issue state, product approval, release, tag or publication is changed by this status file.

## Verification evidence

- `npm run check` passes: build, lint, types, 127 web tests and 65 native tests. All 212 copyable state examples typecheck; quality budgets and SSR pass. Consolidated results are in `evidence/roadmap-followups/verification.json`.
- Chromium and WebKit acceptance checks pass, including keyboard flows, slider-ring geometry, 200% text and axe. Bundled Firefox cannot launch on this macOS host (sandbox-extension permission and software-framebuffer errors, including a second launch probe). Its prior report is explicitly historical with the recording commit; Firefox CI remains required.
- Native runtime and accessibility observations: `evidence/roadmap-followups/native/summary.json`, with the selected iOS/Android trees and actual app captures beside it. These are simulator/emulator observations only.
- Independent packed web/SSR, Next production hydration/font loading, and RN 0.81/Expo 54 plus RN 0.83/Expo 55 Metro exports pass. The two native profiles also export the optional gesture-sheet entry.
- CSS isolation, strict chart-workspace installation, and the four-face OG rendering smokes pass. Release workflow YAML passes `actionlint`; artifact-verifier tests reject missing gates, expired/invalid approvals, source/package changes and tampered bytes. Registry execution remains unperformed.
- The full docs catalog renders all 102 example states plus two focused Slider captures with no axe violations or runtime errors. Four historical screenshot comparisons fail on this macOS host. A same-browser comparison of HEAD and branch component CSS is pixel-identical for all four (`evidence/roadmap-followups/visual-comparison.json`); HEAD also fails the historical baselines. Existing baselines and tolerances are retained for the Linux CI check.

Local candidate provenance reports `sourceTreeDirty: true`: this is an uncommitted review branch. It is not an immutable release or a published package version.

Local font preparation preserved the pre-existing untracked `packages/tokens/assets/fonts/` directory, byte-for-byte, at `.validation-tmp/roadmap/legacy-token-fonts/`. The obsolete copy cannot stay in the web tokens package after the native-font split. Generated native and OG fonts now use their own packages.
