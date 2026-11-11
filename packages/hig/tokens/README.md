# @bloxwap/hig/tokens

Version 0.4.0, an entry of `@bloxwap/hig`. See the HIG architecture and platform limitations before adoption.

`resolvePrimaryColor('#ff0000')` resolves a custom brand's `action`, `focus`, and
`onAction` roles. Input is opaque sRGB hex (`#RGB` or `#RRGGBB`); the foreground
is black or white, whichever gives more contrast. An optional second argument,
`'display-p3'`, converts the accent into native P3 channel hex. React and native
hosts normally set `HIGProvider primaryColor` instead.

## Source validation and React density

`npm run generate` rejects colours without a non-empty `srgb` or `oklch`, density modes with keys that differ from `comfortable`, and motion/space values that are not positive finite numbers. Reduced-motion CSS still overrides generated durations to zero.

React CSS keeps pixel-based `--hig-control` and `--hig-gap` values for existing layout behavior; `tests/token-source.test.ts` compares both density modes directly with `source.json` so token changes require matching CSS updates.

React buttons intentionally retain the existing 44px comfortable minimum (`--hig-button`), a smaller web button geometry than the 48px `density.comfortable.target` used for general control targets. This preserves existing layouts; the target token does not describe every web button's rendered hit area. Compact buttons and targets are both 36px. These are minimum dimensions and content can make a button larger.
