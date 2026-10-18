# CI runners · HIG 0.1.0

Every GitHub Actions job in this repository runs on self-hosted Apple silicon Mac minis:

```yaml
runs-on: [self-hosted, macOS, ARM64]
```

There are no GitHub-hosted `ubuntu-24.04` jobs. Workflows do not call `apt`, `sudo`, or Playwright `--with-deps`. Scratch directories use `$RUNNER_TEMP`. Jobs that run npm/Python/Playwright export `TMPDIR=$RUNNER_TEMP` through `GITHUB_ENV` (the `runner` context is not available in workflow or job `env`).

## Required on every runner

- macOS on Apple silicon, with the Actions runner registered using the labels `self-hosted`, `macOS`, and `ARM64`
- Git
- Python 3.10+ with the standard-library `venv` module (`fonttools` 4.61.1 requires `>=3.10`). GitHub's `actions/setup-python` macOS builds mkdir `/Users/runner/hostedtoolcache` and fail on these minis (`Permission denied`). CI therefore installs relocatable CPython 3.12 into `$RUNNER_TEMP` with a pinned `uv` 0.13.1 binary (`scripts/ci-setup-python.sh`). The login-shell Python does not have to be 3.12. Cache misses create `$RUNNER_TEMP/hig-fonttools` and install `fonttools[woff]==4.61.1` and `brotli==1.2.0` there; they do not write to system site-packages
- Network access to npm, GitHub, and Playwright browser downloads
- Homebrew `gnu-tar` on **every** mini so `gtar` is on the runner service `PATH` or at `$(brew --prefix)/opt/gnu-tar/bin`. `actions/upload-pages-artifact` invokes `gtar` on macOS (`--hard-dereference` is a GNU option). Install with `brew install gnu-tar`. One machine having it is not enough.
- Disk for npm caches, Playwright browsers at `~/Library/Caches/ms-playwright`, packed-consumer trees under `$RUNNER_TEMP`, and generated font faces

Node 22.22.0 is installed per job by `actions/setup-node`. It does not need to be the login-shell default.

## Playwright

Jobs that need browsers run `npx playwright install chromium webkit` with no `--with-deps`. Browsers stay on disk at `~/Library/Caches/ms-playwright` across jobs on a mini; do not save that folder with `actions/cache` (it stalls 11+ minutes because the directory is shared). Chromium and WebKit must launch headless as the runner user. Playwright Firefox is not installed or launched.

## Visual baselines

Catalog Button/Field/Input states and Slider focus captures live under `tests/visual-baselines/<process.platform>/` (`linux` or `darwin`). Geometry changes still fail; pixel changes still fail above 2% after a 24-channel-value antialias tolerance. Missing Darwin images fail closed: review the uploaded capture and commit it with `HIG_UPDATE_VISUALS=1`. Do not copy a Linux baseline or raise the thresholds to hide an OS difference.

## Not required for these workflows

The `native` job exports Android and iOS Metro bundles (`smoke:packed-native` for RN 0.81.5 / Expo 54 and RN 0.83.10 / Expo 55). It does not boot simulators. Xcode, an iOS Simulator runtime, JDK 17, and the Android SDK are only for local `scripts/native-sim/` gallery runs, which these workflows do not execute.

## Jobs

### HIG candidate quality and dry-run artifacts (`quality.yml`)

| Job | Role |
| --- | --- |
| `paths-filter` | Same PR path filter as before; docs-only PRs skip the heavy jobs |
| `quality` | `check`, examples, quality gates, SSR and packed smokes, Playwright packed-next/css, release dry-run |
| `native` | Packed native Metro export for both supported RN/Expo profiles |
| `browser` | Chromium and WebKit browser, visual, and hydration gates |
| `candidate` | Aggregator so the required check reports on docs-only PRs |

### Documentation (`docs.yml`)

| Job | Role |
| --- | --- |
| `build` | Static docs build, typecheck, GitHub Pages artifact |
| `deploy` | GitHub Pages deploy from `main` |
