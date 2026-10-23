# CI runners · HIG 0.1.0

GitHub Actions jobs run on self-hosted Apple silicon Mac minis, except for the `prerequisites` and `publish` jobs in `publish.yml`:

```yaml
runs-on: [self-hosted, macOS, ARM64]
```

Only those two trusted-publishing jobs use GitHub-hosted `ubuntu-24.04`. All other jobs remain self-hosted and do not call `apt`, `sudo`, or Playwright `--with-deps`. Scratch directories use `$RUNNER_TEMP`. Jobs that run npm/Python/Playwright export `TMPDIR=$RUNNER_TEMP` through `GITHUB_ENV` (the `runner` context is not available in workflow or job `env`).

## Required on every Mac mini

- macOS on Apple silicon, with the Actions runner registered using the labels `self-hosted`, `macOS`, and `ARM64`
- Git
- Python 3.10+ with the standard-library `venv` module (`fonttools` 4.61.1 requires `>=3.10`). GitHub's `actions/setup-python` macOS builds mkdir `/Users/runner/hostedtoolcache` and fail on these minis (`Permission denied`). CI therefore installs relocatable CPython 3.12 into `$RUNNER_TEMP` with a pinned `uv` 0.13.1 binary (`scripts/ci-setup-python.sh`). The login-shell Python does not have to be 3.12. Cache misses create `$RUNNER_TEMP/hig-fonttools` and install `fonttools[woff]==4.61.1` and `brotli==1.2.0` there; they do not write to system site-packages
- Network access to npm, GitHub, and Playwright browser downloads
- Homebrew `gnu-tar` on **every** mini so `gtar` is on the runner service `PATH` or at `$(brew --prefix)/opt/gnu-tar/bin`. `actions/upload-pages-artifact` invokes `gtar` on macOS (`--hard-dereference` is a GNU option). Install with `brew install gnu-tar`. One machine having it is not enough.
- Disk for npm caches, Playwright browsers at `~/Library/Caches/ms-playwright`, packed-consumer trees under `$RUNNER_TEMP`, and generated font faces

Node 24.22.1 is installed per self-hosted job by `actions/setup-node`. It does not need to be the login-shell default. On the minis, `setup-node` must not set `cache: npm` (and must not rely on v5+ automatic npm caching): the minis already keep `~/.npm` on disk, and GitHub's cache store has saved 1.1–1.3 GB archives at about 1 MB/s, producing 27-minute `Post setup-node` tails. Quality and docs jobs cache generated native/OG font faces (~4 MB). The publication job uses no Actions caches and generates fonts every time with `bash scripts/ci-generate-fonts.sh`.

## Playwright

Mac mini jobs that need browsers run `npx playwright install chromium webkit` with no `--with-deps`. Browsers stay on disk at `~/Library/Caches/ms-playwright` across jobs on a mini; do not save that folder with `actions/cache` (it stalls 11+ minutes because the directory is shared). Chromium and WebKit must launch headless as the runner user. Playwright Firefox is not installed or launched.

## Visual baselines

Catalog Button/Field/Input states and Slider focus captures live under `tests/visual-baselines/<process.platform>/` (`linux` or `darwin`). Geometry changes still fail; pixel changes still fail above 2% after a 24-channel-value antialias tolerance. Missing Darwin images fail closed: review the uploaded capture and commit it with `HIG_UPDATE_VISUALS=1`. Do not copy a Linux baseline or raise the thresholds to hide an OS difference.

## Not required for these workflows

The `native` job exports Android and iOS Metro bundles (`smoke:packed-native` for RN 0.81.5 / Expo 54 and RN 0.83.10 / Expo 55). It does not boot simulators. Xcode, an iOS Simulator runtime, JDK 17, and the Android SDK are only for local `scripts/native-sim/` gallery runs, which these workflows do not execute.

## Jobs

### HIG candidate quality and dry-run artifacts (`quality.yml`)

| Job | Role |
| --- | --- |
| `paths-filter` | Same PR path filter as before; docs-only PRs skip the heavy jobs |
| `quality` | `check`, examples, quality gates, SSR and packed smokes, Playwright packed-next/css, release dry-run. Review artifacts upload only when the job fails; `publish.yml` rebuilds instead of downloading them |
| `native` | Packed native Metro export for both supported RN/Expo profiles |
| `browser` | Chromium and WebKit browser, visual, and hydration gates. Captures upload only when the job fails |
| `candidate` | Aggregator so the required check reports on docs-only PRs |

### Documentation (`docs.yml`)

| Job | Role |
| --- | --- |
| `build` | Static docs build and typecheck. GitHub Pages artifact only on `main` (same condition as deploy); pull requests still build and validate |
| `deploy` | GitHub Pages deploy from `main` |

### Registry publication (`publish.yml`)

The `prerequisites` and `publish` jobs are the only GitHub-hosted runner exceptions. [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/) requires a supported hosted runner and npm CLI >=11.5.1. Both jobs use `ubuntu-24.04`; publishing uses Node 24.22.1 and explicitly installs the repository's pinned npm@11.6.1 globally on the ephemeral runner. It uses pinned `actions/setup-python` with Python 3.12 and the portable `ci-generate-fonts.sh` venv, plus `npx playwright install --with-deps chromium` for registry consumers.

A published GitHub release with a `v*` tag or a manual dispatch with an existing tag starts the workflow. `prerequisites` requires configured reviewers on `npm-release` and a successful `quality.yml` run for the resolved tag commit, including when dispatch runs from another branch. `publish` waits for the `npm-release` environment approval, checks out `refs/tags/<tag>` without persisted credentials, checks that its SHA still matches the prerequisite result, and re-runs the release gates. It publishes verified tarballs with OIDC and `--provenance`, without a long-lived npm token. Registry checks verify every tarball hash and require source-linked provenance for packages published by this run; already published versions are skipped for resumability.

Before the next release, an npm owner must configure a Trusted Publisher on each of the eight `@bloxwap/hig-*` packages: repository `bloxwap/hig`, workflow `publish.yml`, environment `npm-release`. A repository maintainer must configure required reviewers on that GitHub environment. See the [release policy](governance/release.md) for the package list and approval requirements.
