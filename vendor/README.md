# Shared icon release candidate

`bloxwap-icons-0.1.0.tgz` is the installable `@bloxwap/icons` package built from
the matching `feat/shared-ui-icons` branch in the Bloxwap icons repository.
It is included so this migration can install before registry publication.

SHA-256: `45a7c508ab4f7c4595e2046f785a8c5fb64daed4136fc80d76942b7ee671c6d7`

Build a replacement in the icons repository with `node scripts/pack-ui-icons.mjs`.
When replacing an archive, refresh its installed package and lockfile integrity;
package managers can cache a local archive whose filename and version stay the same.
After publishing 0.1.0, replace the relative archive dependencies with the registry
version and regenerate lockfiles. Keep the archive until no manifest refers to it.
