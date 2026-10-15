# Candidate platform support · 0.1.0

| Area | DOM | RN | Evidence |
| --- | --- | --- | --- |
| Actions, surfaces, text, fields | Semantic DOM elements | Pressable/View/Text/TextInput | behavior tests, Vite/SSR/Metro |
| Native text scaling and script tracking | Browser zoom; no cap | `Text`/`Heading`/`NumberReadout` `maxFontSizeMultiplier` (prop or HIGProvider default); Korean/Chinese runs at companion spacing via `script` and `letterSpacingByScript` | native Jest (#67); iOS AX5 and Android 200% gallery captures pending |
| Native colour roles | CSS severity/data attributes | `Switch` `tone`, `Alert` `severity`/`tone` take token roles only; raw colours fall back | native Jest (#67) |
| Selection/range | Built-in input/select | OS Switch/community Slider, radio/check Pressables, Modal chooser; Android Slider adds `ACTION_SET_PROGRESS` through the autolinked `HIGAdjustableView` (plain View without native linking) | contract tests; module compiled in a headless Android release build (#71); emulator set-progress run pending |
| Dialog/sheet/menu | Radix scoped primitives | Modal and explicit close/back; optional Gorhom GestureSheet entry | DOM nested focus/Escape; mocked native focus/back/detents plus separate packed Android/iOS gesture entry |
| Tooltip/popover | Radix hover/focus/anchored | persistent HelpText/modal | no RN hover claim |
| Navigation/search | href/callback adapters | host route/back callbacks | tab/search/disclosure contracts |
| Financial lists/table | semantic table/list | FlatList labeled rows | formatting and contract tests |
| Chart | optional lazy @bloxwap/chart canvas | numeric/list summary only | typed theme; physical gesture evidence pending |
| Brand mark | individual SVG renderer/asset | optional react-native-svg | pinned geometry; device comparison pending |
| Fonts | pinned Sans/Mono asset URLs | hash-pinned static faces, typed manifest, explicit weight registration and host script fallback | Expo-web loading/byte/hash gates; no physical native-font certification |

SSR: client components retain use-client boundaries in emitted JS. Importing a button needs React/tokens/contracts only at runtime. CSS is explicitly imported. Native API never imports DOM, Web Audio or chart. Native target size remains comfortable even when host density is compact; Pro density is a DOM exception, not a reason to shrink phone targets.

Optional peer packages: chart only for chart entry; community Slider for native selection entry; react-native-svg for native brand entry. Gorhom/Reanimated/Worklets/Gesture Handler are isolated behind the optional gesture-sheet entry; base imports do not load them. No root barrel loads every component. DOM overlays are one scoped family entry and carry Radix MIT attribution. ESM is supported; CommonJS consumer support is not claimed.
