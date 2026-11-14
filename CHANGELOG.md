# Changelog

## Unreleased

Design review pass over all 65 catalog components (web and native). HIG now separates layers with fill and space, not strokes.

- No resting strokes. Surface, Card, inputs, Select, Dialog, Sheet, Menu, Popover, Table and EmptyState lose their border. Control wells (inputs, segmented track, Badge, Avatar) take `surface` on the page and step to `nested` inside a surface or overlay; focus and invalid states keep a ring. Web keeps a transparent 1px border in the box, so sizes are unchanged and forced-colors still draws an edge.
- New colour role `overlay` (`#111111`, `--hig-overlay`): Dialog, AlertDialog, Sheet and GestureSheet panels use it, darker than a card, with a deeper shadow.
- Sheet handle: the GestureSheet drag handle is the action colour, so it follows `primaryColor`. Web draws it 100 × 6px with a soft glow in the same colour; native paints the indicator in `action`. Hosts can delete their own green handle styles.
- Form spacing rule in the platform guide: controls sit 8 apart in both directions, the bottom action row sits 16 below the content above it, and list rows that lead with an avatar are concentric capsules 8 apart.
- Web text fields are 44px high on touch density (36 compact), the same as buttons, down from 48. SearchInput text starts 42px in, down from 46.
- Button and IconButton: busy shows a leading spinner (in place of the icon on IconButton). The busy text is no longer drawn; it stays in the accessible name.
- SegmentedControl is inverted (dark track, lighter selected segment) and 44px high on touch density, 36px compact. Switch: the off track is dark grey.
- SearchInput and Search inset a magnifying glass on the leading edge. Web wraps the input in `span.hig-search-input`; the ref, class and props still reach the input. `SearchInput` defaults to `type="search"` and a host-supplied `type` now wins, so a host can keep a plain text field (no Safari search chrome) inside the HIG anatomy.
- Toast notices are single-row capsules: severity symbol, message, optional action, close symbol. The Dismiss wording moves to the close button's accessible name. Web markup changes from Alert sections to `.hig-toast-item`.
- New web entry `@bloxwap/hig/react/toast` (`Toaster`, `toast()`, `dismissToast()`) raises the capsule through Sonner; `sonner ^2.0.0` is a new optional peer. While a `Toaster` is mounted, `InstallCommand` reports its copy result as a toast; without one it shows the result inline as before. Only the toast entry loads Sonner.
- EmptyState is a centred stack under a default symbol. Web gains `illustration` (as on native) and `description` becomes optional.
- Accordion: outline chevron on the trailing edge that turns as the panel opens; the panel height eases where the browser can interpolate to `auto`. The whole header row is the target.
- Skeleton pulses, and StatusIndicator emits a ring in its status colour for `online` and `stale`. Both stop under reduced motion. Skeleton now fills its container width.
- Separator is a 2px line with rounded ends. Table separates sections with space and type weight instead of rules.
- Native: `useFills()` and `Raised` from `@bloxwap/hig/native/provider` expose the same page/raised fills for host-drawn controls; Button, IconButton and Tabs are 44dp with hit slop keeping a 48dp target; icons are drawn from plain Views, so `react-native-svg` stays optional. `InstallCommand` shows its copy result as a transient toast capsule (4s).
- New recipe `SwapPanel` (`@bloxwap/hig/react/recipes/swap-panel`, also in the `recipes` aggregates on web and native): send, swap and bridge in one panel, modelled on the swap product. From and To cards with a flip control, an amount in dollars or token units with a conversion capsule, token pickers (search, chain filter, Hot section) and settings (denomination, slippage, fee breakdown) pushed as views inside the panel, an on-screen keypad, a receive view, and a `oneWay` mode that shows a down arrow instead of the flip control. `SwapSheet` (`@bloxwap/hig/react/recipes/swap-sheet`, `@bloxwap/hig/native/swap-sheet`) presents it in a gesture sheet, with the views pushing inside that one sheet. Fully host-driven: the host supplies tokens, balances, prices, the quote and the wallet, and executes on `onSubmit(action)`. Adds 43 `swap*` message keys. The docs stylesheet budget rises from 125,000 to 150,000 bytes for the new component styles.
- `SwapAmountCard` (web, from `@bloxwap/hig/react/recipes/swap-panel`): the swap From card on its own, for a host that enters a single amount such as a position size. `SwapPill` and `SwapKeypad` are exported from the same entry.
- New `Filter` in the selection entries (web and native): one row of filter capsules that scrolls sideways, single choice, with a check that draws into the chosen capsule's circle. The swap token picker uses it for chains.
- Floating lists (Select, Menu, Popover, Tooltip) present with a short fade and settle. The Switch track eases with the thumb, and the switch keeps its 150ms slide under reduced motion so turning Motion off still animates. The native Switch on web draws the HIG capsule instead of react-native-web's Material switch. The native Switch bundle budget rises from 2,200 to 2,400 bytes gzipped for it.
- New `VerticalAddress` (data entries) and `WalletAddress` (`@bloxwap/hig/react/wallet-address`, `@bloxwap/hig/native/wallet-address`) for Ethereum-style and Solana addresses: a Cuer QR code beside the address in fixed-width rows with the leading row and last four characters emphasised, and a Tap to copy hint when the host passes `onCopy`. `cuer` is a new optional peer. The SwapPanel receive view uses `VerticalAddress`; its two address message keys are now the shared `copyAddress` and `addressCopied`, with new `tapToCopy` and `qrCode`.
- Examples: the IconButton example passes `busy`, and the Tooltip example confirms its copy with a toast.

## 0.3.0

- Every JS export now has a `default` condition beside `import`. Jest/jest-expo, `require()` and Metro's CommonJS resolution can import HIG entries instead of failing with `ERR_PACKAGE_PATH_NOT_EXPORTED`.
- `@bloxwap/hig/react/css` is touch-safe. Every `:hover` rule now sits behind `(hover: hover) and (pointer: fine)`, so taps no longer leave buttons dimmed or ghost buttons filled. Hosts can delete their sticky-hover overrides, and `tests/touch-css.test.ts` keeps the gate in place. HIG controls also get no tap highlight, `touch-action: manipulation`, no long-press selection, `:active` press feedback, 16px text fields on touch, overscroll containment, and safe-area padding on edge sheets and dialogs.
- Native market-direction colours: `useColors()` adds `up` and `down` (defaulting to `buy`/`sell`), `HIGProvider marketColors` overrides them and is inherited, and `NumberReadout`, `Usd`, `Percent` and `AnimatedNumberReadout` accept `tone="up" | "down"`. New types: `HIGMarketColors`, `HIGMarketColorRole` and `HIGTableColorRole`. `colorTable()` and `useBrandColors()` now return the table roles only. This replaces the mobile app's local patch of 0.2.0.
- Native `AnimatedNumberReadout` hides its underlying reading with clear white (`#ffffff00`) instead of `transparent`. Android Fabric reads `0x00000000` as unset and drew that reading in black under the reels.
- Motion: web button presses ease over 160ms on the standard curve instead of snapping. `AnimatedNumberReadout` uses the standard HIG curve (`tokens.easing.standard`) on web and native. Native digit reels mount 20 rows instead of 30, a third less to render per animated place.
- Native test consumers track Expo SDK 58.0.23, which expects `react-native-safe-area-context ~5.11.1`, and the peer range now accepts it.
- Accept `@bloxwap/chart` 0.4.0: the required peer is now `^0.3.0 || ^0.4.0`, and HIG develops, smoke-tests and documents against 0.4.0. Chart 0.4.0 only adds indicator APIs, so `PriceChart` and `chartTheme` are unchanged.
- Pin `@bloxwap/font` 0.1.4. Its web CSS now loads unicode-range subsets, so pages download only the scripts they render. The variable sources behind `@bloxwap/hig/native-fonts` and `@bloxwap/hig/og-fonts` are byte-identical to 0.1.2, so the generated TTFs and their SHA-256 hashes are unchanged; only the manifests' source version changes.
- The docs site now installs `@bloxwap/haptic` 0.3.0 and `@bloxwap/sfx` 0.2.1, inside HIG's supported peer ranges, instead of the older 0.1.0 builds.

## 0.2.0

- Publish HIG as one npm package, `@bloxwap/hig`, replacing the eight `@bloxwap/hig-*` packages. Each former package is now a subpath entry: `@bloxwap/hig-react/button` becomes `@bloxwap/hig/react/button`, `@bloxwap/hig-tokens/css` becomes `@bloxwap/hig/tokens/css`, and so on. Entry names and exports are unchanged.
- Every renderer, device and overlay peer is optional; `@bloxwap/chart` `^0.3.0` remains the one required peer (#96).
- The release dry run, verifier and publish workflow handle exactly one tarball. Font-binary, OG-font budget and chart-boundary gates now check paths inside it.
- The `@bloxwap/hig-*` 0.1 packages are deprecated on npm and point to `@bloxwap/hig`.

## 0.1.1

- Update the supported Node toolchain and locked dependencies, including PostCSS and Brotli security fixes.
- Keep release artifacts, generated documentation and consumer smoke checks aligned with the coordinated package version.
- Isolate preview server ports and stop browser checks when their own server exits, fixing collisions between concurrent CI jobs.
- Run WebKit keyboard checks with process-scoped macOS keyboard navigation, preserving the same strict focus and visual assertions across runner preferences.
- Refresh adoption records for merged consumer migrations and the first successful npm publication.
- Preserve the existing pre-1.0 owner exceptions for product acceptance and physical-device observations.

## 0.1.0

- Initial coordinated release of contracts, tokens, native fonts, OG fonts, feedback, React, chart and React Native packages.
- Configure a brand accent with `HIGProvider primaryColor` on web and native. Nested providers inherit it, overlays and chart crosshair labels follow it, and primary fills receive contrasting black or white labels.
- Preserve Bloxwap green by default and keep status, buy/sell, and approved brand-mark colours independent of the custom primary accent. Native Display P3 hosts convert custom sRGB accents.
- Adopt pink negative/sell and neon-yellow warning roles, with severity-based callout strokes and glows on web and native.
- Includes interface guidelines, accessibility and consumer validation, and release artifact verification.
- Registry publication remains subject to maintainer approval and the release gates in `planning/release-blockers.json`.
