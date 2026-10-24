# @bloxwap/hig-react

Version 0.1.1. Import individual entries; see docs/components for platform and accessibility contracts.

Set a brand accent with `<HIGProvider primaryColor='#ff0000'>` from
`@bloxwap/hig-react/provider`. It accepts opaque sRGB hex (`#RGB` or `#RRGGBB`),
sets action/focus colours, and selects black or white text on primary fills.
Omit it to keep Bloxwap green. Nested providers inherit the accent.
Status and buy/sell colours stay independent. See [the colour guide](../../docs/foundations/platform.md#primary-brand-colour).
