# @bloxwap/hig/native

Version 0.9.3, an entry of `@bloxwap/hig`. Import individual entries; see docs/components for platform and accessibility contracts.

UI symbols come from `@bloxwap/icons` (install `@bloxwap/icons@^0.1.0`). Native symbols also require the `expo-image` version for your Expo SDK.
Use `npx expo install expo-image`, then rebuild a development client so the native
module is linked. The adapter uses one image view with a local SVG source and
native tint; iOS renders the tinted image at the view size.

Native dialogs and gesture sheets use a background blur when the app links
`@react-native-community/blur@4.4.1`. Rebuild the native client after installing it.
Clients without the native view use the dimmed backdrop.

Set a brand accent with `<HIGProvider primaryColor='#ff0000'>` from
`@bloxwap/hig/native/provider`. It accepts opaque sRGB hex (`#RGB` or `#RRGGBB`),
sets action/focus colours, and selects black or white text on primary fills.
Omit it to keep Bloxwap green. Nested providers inherit the accent, and `useColors()`
returns the resolved roles. With `colorSpace='display-p3'` on iOS, HIG converts
the sRGB input to P3 channels. Status, buy/sell colours, and the Bloxwap mark retain
their defaults. See [the colour guide](../../../docs/foundations/platform.md#primary-brand-colour).

Market direction has its own roles. `useColors().up` and `.down` default to `buy` and
`sell`. `<HIGProvider marketColors={{up,down}}>` overrides either one for hosts whose
convention differs, and readouts paint them with `tone="up"` / `tone="down"`. See
[market direction colours](../../../docs/foundations/platform.md#market-direction-colours).
