# Pinned upstream feedback implementations

These unmodified MIT sources exercise HIG adapters against the APIs merged by
[SFX #51](https://github.com/bloxwap/sfx/pull/51) and
[Haptic #30](https://github.com/bloxwap/haptic/pull/30).
[Provenance](provenance.json) pins source commits, Git blob IDs, SHA-256 values,
original paths and the released npm artifacts used for compatibility tests.
Exact licenses are retained in each source directory. `public-index.txt` records
the public exports without pulling unrelated React components into the fixture.

SFX tests use its own recording AudioContext fake. Haptic tests replace navigator,
document and vibration calls. Nothing produces audio or physical haptics.
The sources remain test-only and are excluded from every published HIG package.
They are not a candidate dependency upgrade or a claim that these APIs shipped in npm 0.1.0.
