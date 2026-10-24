# @bloxwap/hig-tokens

Version 0.1.1. See the HIG architecture and platform limitations before adoption.

`resolvePrimaryColor('#ff0000')` resolves a custom brand's `action`, `focus`, and
`onAction` roles. Input is opaque sRGB hex (`#RGB` or `#RRGGBB`); the foreground
is black or white, whichever gives more contrast. An optional second argument,
`'display-p3'`, converts the accent into native P3 channel hex. React and native
hosts normally set `HIGProvider primaryColor` instead.
