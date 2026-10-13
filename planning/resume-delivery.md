# Resume remote delivery

All five local branches form one stack. The environment token rejects repository Contents writes with HTTP 403; `gh pr list` is empty and the remote has only main. No PR URL exists. Use a credential with Contents, Pull requests and Workflows write access for this repository, then deliver the already committed stack. Do not merge, publish, tag or create a release.

```sh
git push origin hig/m1-foundations hig/m2-components hig/m3-feedback hig/m4-docs hig/m5-release-adoption
gh pr create -R bloxwap/hig --base main --head hig/m1-foundations --title 'M1: HIG foundations, architecture and platform fixtures' --body-file planning/prs/m1.md
gh pr create -R bloxwap/hig --base hig/m1-foundations --head hig/m2-components --title 'M2: separate React and React Native components and recipes' --body-file planning/prs/m2.md
gh pr create -R bloxwap/hig --base hig/m2-components --head hig/m3-feedback --title 'M3: semantic feedback, optional sound and haptic adapters' --body-file planning/prs/m3.md
gh pr create -R bloxwap/hig --base hig/m3-feedback --head hig/m4-docs --title 'M4: HIG playground, versioned docs and example catalog' --body-file planning/prs/m4.md
gh pr create -R bloxwap/hig --base hig/m4-docs --head hig/m5-release-adoption --title 'M5: quality gates, dry-run artifacts and migration kits' --body-file planning/prs/m5.md
```

Record actual PR URLs in `planning/issue-coverage.json`/`.md` and each adoption row only after creation succeeds. All source/device/owning-repository limitations remain even when delivery becomes available. Reviewers can use per-milestone evidence and five saved PR body files locally now.
