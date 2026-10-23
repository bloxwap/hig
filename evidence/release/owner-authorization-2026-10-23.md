# HIG 0.1.0 publication authorization (2026-10-23)

Approval record: [PR #141](https://github.com/bloxwap/hig/pull/141).
Approver: repository owner `joeblau`, directing this agent session.
Review by: 2027-01-15.

The owner requested the custom primary-colour provider, explicitly invoked
`b:cpr` (create a branch, commit, open a PR, watch and fix CI, merge, and clean up),
then requested:

> and relase a new version of teh HIG provider taht we can customize

This authorizes merging the reviewed implementation and publishing the first
coordinated npm release, 0.1.0, including all eight HIG packages required by the
existing release verifier. No HIG registry version existed at the time of the
request. The organization `NPM_TOKEN` secret is available to all organization
repositories; its value is never read or recorded here.

This is a pre-1.0 package-availability release. The owner-directed publication
is the scoped release exception for the remaining v1 source-parity and
owning-product rollout gates, through the review date above. It does not claim
that the pending owner assignments, product baselines, wallet sessions, native
speaker approvals or remaining consumer migrations in #57 and #110 were
performed by this release. Those follow-ups remain open. Consumers retain
their previous lockfiles and vendored artifacts for rollback.

Physical-device and font-rasterization exceptions are independently supported
by the existing [2026-10-19 owner attestation](../physical/owner-attestation-2026-10-19.md)
and [merged PR #131](https://github.com/bloxwap/hig/pull/131). They are owner
attestations, not new recorded device observations. Any contradictory physical
result voids the relevant exception and requires a linked failure issue.

Publication still requires successful code, consumer, browser and artifact
checks. The tagged source, coordinated versions, complete package set and
SHA-256 hashes must pass `scripts/verify-release.mjs`. Publishing uses the
reviewed GitHub workflow and is followed by independent registry-consumer
checks; this authorization does not bypass those checks.
