# CI runners

GitHub Actions jobs run on self-hosted Apple silicon Mac minis, except for the `publish` job in `publish.yml` and `linux-visual` in `quality.yml`:

```yaml
runs-on: [self-hosted, macOS, ARM64]
```

The trusted-publishing job uses GitHub-hosted `ubuntu-24.04`; Linux visual verification uses GitHub-hosted `ubuntu-latest` with Chromium and `--with-deps`. All other jobs remain self-hosted and do not call `apt`, `sudo`, or Playwright `--with-deps`. Scratch directories use `$RUNNER_TEMP`. Jobs that run npm/Python/Playwright export `TMPDIR=$RUNNER_TEMP` through `GITHUB_ENV` (the `runner` context is not available in workflow or job `env`).

## Required on every Mac mini

- macOS on Apple silicon, with the Actions runner registered using the labels `self-hosted`, `macOS`, and `ARM64`
- Git
- Python 3.10+ with the standard-library `venv` module (`fonttools` 4.61.1 requires `>=3.10`). GitHub's `actions/setup-python` macOS builds mkdir `/Users/runner/hostedtoolcache` and fail on these minis (`Permission denied`). CI therefore installs relocatable CPython 3.12 into `$RUNNER_TEMP` with a pinned `uv` 0.13.1 binary (`scripts/ci-setup-python.sh`). The login-shell Python does not have to be 3.12. Cache misses create `$RUNNER_TEMP/hig-fonttools` and install `fonttools[woff]==4.61.1` and `brotli==1.2.1` there; they do not write to system site-packages
- Network access to npm, GitHub, and Playwright browser downloads
- Homebrew `gnu-tar` on **every** mini so `gtar` is on the runner service `PATH` or at `$(brew --prefix)/opt/gnu-tar/bin`. `actions/upload-pages-artifact` invokes `gtar` on macOS (`--hard-dereference` is a GNU option). Install with `brew install gnu-tar`. One machine having it is not enough.
- Disk for npm caches, Playwright browsers at `~/Library/Caches/ms-playwright`, packed-consumer trees under `$RUNNER_TEMP`, and generated font faces

Node 24.22.1 is installed per self-hosted job by `actions/setup-node`. It does not need to be the login-shell default. On the minis, `setup-node` must not set `cache: npm` (and must not rely on v5+ automatic npm caching): the minis already keep `~/.npm` on disk, and GitHub's cache store has saved 1.1–1.3 GB archives at about 1 MB/s, producing 27-minute `Post setup-node` tails. Quality jobs reuse generated native/OG font faces (~4 MB) from an on-disk cache on each mini (`scripts/ci-native-fonts.sh`, under `~/Library/Caches/bloxwap-hig/native-fonts`), not from `actions/cache`. The publication job uses no Actions caches and generates fonts every time with `bash scripts/ci-generate-fonts.sh`.

## Playwright

Mac mini jobs that need browsers run `npx playwright install chromium webkit` with no `--with-deps`. Browsers stay on disk at `~/Library/Caches/ms-playwright` across jobs on a mini; do not save that folder with `actions/cache` (it stalls 11+ minutes because the directory is shared). Chromium and WebKit must launch headless as the runner user. Playwright Firefox is not installed or launched.

## Visual baselines

Catalog Button/Field/Input states and Slider focus captures live under `tests/visual-baselines/<process.platform>/` (`linux` or `darwin`). Geometry changes still fail; pixel changes still fail above 2% after a 24-channel-value antialias tolerance. Missing Darwin images fail closed: review the uploaded capture and commit it with `HIG_UPDATE_VISUALS=1`. Do not copy a Linux baseline or raise the thresholds to hide an OS difference.

## Not required for these workflows

The `native` job exports Android and iOS Metro bundles (`smoke:packed-native` for RN 0.81.5 / Expo 54 and RN 0.83.10 / Expo 55, and RN 0.88.1 / Expo 58). It does not boot simulators. Xcode, an iOS Simulator runtime, JDK 17, and the Android SDK are only for local `scripts/native-sim/` gallery runs, which these workflows do not execute.

## Jobs

### HIG candidate quality and dry-run artifacts (`quality.yml`)

| Job | Role |
| --- | --- |
| `paths-filter` | Same PR path filter as before; docs-only PRs skip the heavy jobs |
| `compiler` | Compiler selection, TypeScript fallback and emit parity |
| `quality (task)` | 14 independent lanes: static checks, web tests, native tests, ten packed-consumer checks, and release dry-run verification |
| `native (profile)` | Separate packed native Metro exports for RN 0.81 / Expo 54, RN 0.83 / Expo 55, and RN 0.88 / Expo 58 |
| `browser (gate)` | 18 separate suites covering Chromium, WebKit, components, Expo, docs, catalog and Next hydration; each starts only its required previews |
| `linux-visual` | Linux Chromium baseline comparison |
| `candidate` | Required aggregate check; waits for every matrix lane and fails if any lane fails or is unexpectedly skipped |

The matrices use `fail-fast: false` so failures do not cancel other diagnostic results. They have no `max-parallel` cap: GitHub schedules as many lanes as the available runners allow. Each lane has its own checkout, `$RUNNER_TEMP`, build outputs, tarballs and uniquely named failure artifacts. Browser preview ports are allocated dynamically. Package builds precede their consumers within each lane; release dry-run and artifact verification remain ordered. Local `run-browser-gates.mjs` runs all suites by default; `HIG_BROWSER_GATE` selects one, and invalid selectors fail closed.

More lanes only run simultaneously when the fleet has free runner capacity. Register each additional runner service with a distinct installation/work directory; do not share a checkout or temp directory. Heavy native exports and browser processes still compete for a mini's CPU and memory, so size the runner fleet accordingly. Workflow concurrency cancels superseded PR runs while keeping unrelated PRs independent. Publication and deployment retain their security, approval and artifact dependencies.

### Documentation (`docs.yml`)

| Job | Role |
| --- | --- |
| `build` | Static docs build and typecheck. GitHub Pages artifact only on `main` (same condition as deploy); pull requests still build and validate |
| `deploy` | GitHub Pages deploy from `main` |

### Registry publication (`publish.yml`)

The `publish` job runs on GitHub-hosted `ubuntu-24.04`, as required by [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/). It installs the pinned npm@11.6.1, checks out the release tag, downloads the prepared tarball, verifies its report digest and every package hash, then publishes with OIDC and `--provenance`. It does not rebuild packages or run consumer tests.

All heavy release work uses the self-hosted Macs. After the exact-tag quality prerequisite succeeds, three `validation` lanes (static/quality checks, web tests, and native tests) run alongside `prepare`, which builds and verifies the stable artifact. The security scan runs independently. `publish` waits for all of them and the `npm-release` environment approval. The prepared report's SHA-256 is passed as a job output and checked after download, before the existing source/version/package-set/tarball verification. Artifacts are named per run and attempt, so retries use their producing job's exact artifact.

After publication, five `registry` lanes run concurrently: web/SSR, Next hydration, and RN 0.81, 0.83 and 0.88. Every lane verifies registry tarball hashes, provenance and npm signatures before testing its consumer. They retain bounded registry-visibility retries, never suppress failures, and upload separate evidence. No matrix concurrency cap is set; runner availability limits scheduling. The release setup action installs npm in a unique `$RUNNER_TEMP` prefix, so concurrent runner services do not replace a shared npm executable.

A published GitHub release or a manual dispatch must use the existing release tag as its ref. The prerequisites still require configured `npm-release` reviewers and a successful quality run for the exact source commit. Only the hosted publication job has `id-token: write`; validation, preparation and registry jobs have read-only repository permissions. No token fallback or approval bypass is provided.

All eight `@bloxwap/hig-*` Trusted Publishers are configured for repository `bloxwap/hig`, workflow `publish.yml`, environment `npm-release`. The 0.1.2 publication records npm's GitHub Actions trusted-publisher identity for each package, separately from its signed provenance. No workflow step references the organization publishing token. The shared organization secret remains available to other repositories. Required environment reviewers and exact-source quality gates remain mandatory. See the [release policy](governance/release.md) and `evidence/release/registry-0.1.2/` for verification.
