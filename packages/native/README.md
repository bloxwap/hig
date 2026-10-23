# @bloxwap/hig-native

Candidate 0.1.0. Import individual entries; see docs/components for platform and accessibility contracts.

Set a brand accent with `<HIGProvider primaryColor='#ff0000'>` from
`@bloxwap/hig-native/provider`. It accepts opaque sRGB hex (`#RGB` or `#RRGGBB`),
sets action/focus colours, and selects black or white text on primary fills.
Omit it to keep Bloxwap green. Nested providers inherit the accent, and `useColors()`
returns the resolved roles. With `colorSpace='display-p3'` on iOS, HIG converts
the sRGB input to P3 channels. Status, buy/sell colours, and the Bloxwap mark retain
their defaults. See [the colour guide](../../docs/foundations/platform.md#primary-brand-colour).
