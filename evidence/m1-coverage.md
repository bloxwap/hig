# M1 review evidence · candidate 0.1.0

| Issue | Status | Delivered and remaining |
| --- | --- | --- |
| #1 | partial | Stacked execution plan and evidence policy; later milestones and real adoption remain. |
| #2 | partial | Commit-pinned six-repo audit, exact duplicate groups and asset baselines, catalog and active-repo matrix. Monorepo returns 404; app/Pro live origins unavailable; product screenshots and representative production bundle baselines blocked. |
| #3 | done | Practical product/docs/marketing principles with paired do/don't examples, state and precision rules. Product examples are recipes, not invented live behavior. |
| #4 | done | ADR with ownership, acyclic package graph, explicit supported candidate toolchain and migration/deprecation boundaries. |
| #5 | partial | Reproducible npm workspace, real Expo/RN peer workspace, SSR, packed consumer, web/Metro builds. Physical iOS/Android execution and Next hydration await later gates/device access. |
| #6 | partial | One typed token source; CSS/P3/sRGB/native outputs, alias/alpha tests and contrast report. Monorepo authored OKLCH source and physical P3 comparison unavailable. |
| #7 | partial | Published @bloxwap/font 0.1.2 web integration, role scale and typed manifest stub. Upstream publishes no native manifest/static TTF npm export; native registration/device typography blocked. |
| #8 | partial | Token-backed density/unit/layout rules, touch targets and safe-area/keyboard guidance. Product extraction and device layout observations pending. |
| #9 | partial | Motion tokens, interruption/cancellation and reduced-motion rules; native animation/device gesture certification pending. |
| #10 | partial | Versioned WCAG 2.2 AA/native checklist and exception process. Physical VoiceOver/TalkBack observations unavailable. |
| #11 | partial | Approved exact SVG with pinned provenance and single-asset export; RN renderer follows in M2. OG/favicon derivatives and visual device comparison pending. |

Commands and proof: `m1-check.txt` (build/lint/typecheck, 6 executed tests), `m1-ssr.txt`, `m1-packed.txt`, `m1-metro.txt`, `contrast.json`, `baseline.json`, `upstream-inventory.json`, `font.json`. Candidate artifacts are local tarballs only; publication remains prohibited. System Node 20 is superseded in npm scripts by pinned local Node 22.22.0; contributors/CI should use Node 22.22+.
