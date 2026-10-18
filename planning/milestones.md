# Execution and known blockers · updated 2026-10-16

M1 foundations → M2 renderers and visual recipes → M3 semantic feedback and recipe composition → M4 docs and examples → M5 quality, dry-run artifacts and migration kits. One stacked branch/PR each; no merge, release, tag or publication.

#26 depends on #25 despite milestone order: M2 owns visual recipes; M3 completes optional feedback. #1 remains partial until all required acceptance checks are established. #2–#5 are M1 work, not independent milestone trackers.

The initial access and native-font blockers are historical: authenticated repository reads/writes and owning migration PRs now exist, and native fonts have their own generated package. Of the original 35 tasks, 32 are closed; #33, #35 and #36 remain open for rollout and owner approval. Follow current work in [roadmap-followups.md](roadmap-followups.md).

Current external prerequisites are physical-device certification (#55), registry credentials/release approval (#56), named owners and product/translation approval (#57), unreleased upstream feedback APIs (#70), required signoff on the four open monorepo migration PRs, and product brand choices (#100/#101). Passing software gates never substitutes for these. No baseline size improvement is claimed without a comparable consumer build.
