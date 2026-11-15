# Financial data

Readable numbers, metrics, lists, tables, and wallet addresses for host-provided financial data.

Includes `NumberReadout`, `AnimatedNumberReadout`, `Usd`, `Percent`, `Metric`, `Stat`, `Row`, `List`, `VerticalAddress`, `WalletAddress`, `BarMark`, `BarPnl`, and `AssetBalanceRow`. `Table` is web-only; native uses labeled lists.

Issue #19. Entry: `data`. Import platform entries from `@bloxwap/hig/react/data` or `@bloxwap/hig/native/data` according to applicability below. Import `@bloxwap/hig/react/css` once on web; tokens CSS is a separate explicit import.

## API and anatomy

| Component | Key props and behavior |
| --- | --- |
| Readouts | `value` accepts a number, `null`, or `undefined`. Locale comes from the provider; `options`, `stale`, and `label` control presentation. |
| `VerticalAddress` | `address`, optional `kind` (`'ethereum'` or `'solana'`, inferred from a `0x` prefix) and `rowHeight`. The address in fixed-width monospace rows, always left to right: 6 characters per row for Ethereum-style addresses (42 characters make 7 rows) and 4 for Solana (44 make 11). The leading row and the trailing four characters, the ones people compare, are emphasised; the middle is dimmed. Assistive technology and copying get the plain address. |
| `WalletAddress` | `address`, `kind`, `qrValue`, `arena`, `size` (QR edge, default 196) and `onCopy`. A [Cuer](https://cuer.sh) QR code beside `VerticalAddress`, the column exactly as tall as the code. `qrValue` sets a payload other than the address, such as an EIP-681 or Solana Pay URI; `arena` puts an image in the centre. With `onCopy`, the host clipboard adapter, the whole component is one button that copies, shows “Tap to copy”, and raises “Address copied”. Separate entry: `@bloxwap/hig/react/wallet-address` and `@bloxwap/hig/native/wallet-address`. |
| `List` | `items`, `keyFor`, `render`, `empty`, `label`, `loading`, `error`, `onRetry`, and `onLoadMore`. |
| `Table` (web) | `caption`, `rows`, `columns`, and `keyFor`; optional host sorting callbacks. Column `align` accepts logical `start`, `center`, or `end`. `rowProps(row, index)` forwards row highlights, styles, data/ARIA attributes and events. `captionHidden`, `stickyHeader`, `loading`, and `state` support dense product tables. |

`WalletAddress` needs the optional `cuer` peer (`>=0.0.3 <0.1.0`), and on native also `react-native-svg`; `VerticalAddress` needs neither and lives in the `data` entry. HIG never reads or writes the clipboard itself.

```tsx
import {WalletAddress} from '@bloxwap/hig/react/wallet-address';

<WalletAddress address={account.address} onCopy={() => navigator.clipboard.writeText(account.address)}/>
<WalletAddress address={solanaAddress} qrValue={`solana:${solanaAddress}`} arena='/sol.png' size={160}/>
```

Loading keeps existing rows visible, suppresses a misleading empty message, and disables pagination and retry until ready. Error text remains visible with an optional host retry action. Native lists use FlatList virtualization; stable host keys preserve identity during live updates.

Native readouts, including `Usd`, `Percent`, and `AnimatedNumberReadout`, accept `tone="text" | "positive" | "negative" | "muted" | "up" | "down"`, `testID`, and a constrained typography `style`. The style accepts `fontFamily`, `fontSize`, `fontWeight`, `lineHeight`, `letterSpacing`, and `textAlign`, including registered styles and arrays. The tone resolves through the provider palette; it is explicit rather than inferred from the sign. Colour and tabular numeric glyphs stay controlled by the readout. Font scale follows HIG Text and the provider; `maxFontSizeMultiplier` can override its cap.

For a branded 20 px equity pill, use `<NumberReadout value={equity} label="Equity" testID="equity" style={{fontFamily:'BloxwapMonoSemiBold',fontSize:20,lineHeight:28}} />` with a registered host font. For signed PnL, add `tone={pnl < 0 ? 'negative' : 'positive'}` and `options={{signDisplay:'always'}}`. The same props on `AnimatedNumberReadout` style and identify its single final accessible reading; per-place motion is decorative.

`NumberProps` on both platforms includes optional `prefix` and `suffix` display text around the canonical Intl-formatted value. The host owns the affixes and their localization. Do not use them to replace Intl currency, compact-notation, or sign formatting, and never parse the resulting display string back into a transaction value.

Native readouts also accept `formattedValue` for a host's existing static display format, such as `<NumberReadout value={90} formattedValue="01:30" label="Time remaining" />`. The host owns this opaque display text and its localization; never parse it for submission or calculations. A finite numeric `value` is still required: `null`, `undefined`, `NaN`, and infinities display the canonical unknown dash even if text is supplied. An empty string falls back to the usual locale and `options` formatting. Stale text, the accessible label, semantic tone, and tabular typography still apply to the resulting reading. `AnimatedNumberReadout` keeps opaque `formattedValue` output static rather than guessing how to split it into animated places.

Web tables keep a visible caption and ordinary headers by default. Set `captionHidden` when a visible section already names the table: the caption remains its accessible name. `stickyHeader` pins header cells within a bounded scroll region; give the region a height through `style` or `className`. `tableClassName` styles the table itself. Sorting still belongs to the host, and sort buttons retain native keyboard activation and `aria-sort`.

```tsx
<Table caption='Positions' captionHidden stickyHeader style={{maxHeight:320}}
  rows={positions} keyFor={row=>row.id}
  rowProps={row=>({className:row.current?'current-market':undefined,'aria-current':row.current?'true':undefined})}
  columns={[
    {key:'market',label:'Market',render:row=>row.symbol},
    {key:'balance',label:'Balance',align:'end',render:row=><NumberReadout value={row.balance}/>},
  ]}
  loading={refreshing}
  state={error?<div role='alert'>{error}<button type='button' onClick={retry}>Retry</button></div>:undefined}/>
```

The `state` slot is content for one cell spanning all columns; it can contain an empty explanation, loading skeleton, or error and retry UI. Pass content rather than `tr`/`td` elements. Existing data rows remain visible. Without a custom state, `loading` exposes the provider's `loading` message and `aria-busy`; an empty, idle table shows `noRows`. `state={null}` suppresses that fallback. Give custom errors an alert role and custom loading content a status role when an announcement is appropriate. `rowProps` cannot replace the row's native role or HIG's cells with `children`/HTML. Row callbacks do not add a selection keyboard model; use native controls inside cells for actions.

### AssetBalanceRow

`AssetBalanceRow` is one holding in a list: round artwork, the asset's `name` over its `symbol`, and on the trailing edge its dollar `value` over its `balance` in token units. It is the row `AccountCard` is made of, and lives in its own entry: `@bloxwap/hig/react/asset-balance-row` and `@bloxwap/hig/native/asset-balance-row`.

```tsx
<AssetBalanceRow name="Hyperliquid" symbol="HYPE" value={759} balance={13.2} onSelect={open}/>
<AssetBalanceRow name="USD Coin" symbol="USDC" value={100.33}/>
```

- **Artwork.** `icon` is an image URL or a host element; without one the row shows the first letters of the symbol.
- **Amounts.** `value` is in dollars; `null` reads as unknown. `balance` is in token units, formatted with `balanceOptions` (at most six fraction digits by default). Omit `balance` to show the value alone, as for a dollar stablecoin.
- **Anatomy.** A capsule concentric with its 40-unit avatar: 8 units of padding, 56 units high, a 28-unit end radius, on the well fill. Rows in a list sit 8 units apart.
- **Interaction.** `onSelect` makes the whole row a button; without it the row is not interactive.
- **Live numbers.** Both figures update through `AnimatedNumberReadout`, so the native entry needs the optional Reanimated and Worklets peers.

### BarMark

`BarMark` is a one-dimensional stacked bar: a card with a `title`, an optional `description` on the trailing edge of the title row, one bar divided among its `elements`, and a legend naming each part. Use it for parts of a whole, such as a portfolio by asset, margin in use, or storage. It lives in its own entry on both platforms and needs no peers.

```tsx
import {BarMark} from '@bloxwap/hig/react/bar-mark';

<BarMark title="Portfolio" description="$12,480.00" elements={[
  {label: 'Bitcoin', value: 6200, detail: '$6,200'},
  {label: 'Ether', value: 3400, detail: '$3,400'},
  {label: 'USD Coin', value: 1250, detail: '$1,250'},
]}/>
```

- **Elements.** Each element is `{label, value}` plus optional `id`, `tone`, `color` and `detail`. `value` is in the host's own unit and only its share of the whole is drawn; negative and non-finite values count as nothing. `detail` is host-formatted text shown after the label in the legend.
- **Colour.** An element takes a `tone` role: `positive`, `info`, `warning`, `negative`, `muted` or `faint`. Without one, elements take those tones in that order and repeat. `color` is a host hex for a category outside the roles and wins over `tone`. Do not rely on colour alone: the legend always names each part.
- **Whole.** `total` is the whole the elements are parts of. When it is larger than their sum, the remainder stays empty track, as in margin used out of a limit. Without it the elements fill the bar.
- **Anatomy.** The bar is 24 units high with an 8-unit radius; segments are separated by a 2-unit gap and a non-zero segment is never thinner than 3 units. The layout follows the writing direction: the first element starts on the leading edge.
- **Card.** `surface={false}` draws no card: no surface fill, padding or radius, with the title row, bar and legend keeping their spacing. Use it for read-only data that sits directly on a screen, as `ManagePositionCard` does; `BarPnl` has the same setting.
- **Size.** `size='small'` draws a 12-unit bar with a 6-unit radius for a secondary breakdown under a main one.
- **Legend.** A wrapping row of colour dots and labels under the bar. `legend={false}` hides it visually; the labels and shares stay available to assistive technology.
- **Accessibility.** The card is a group named by its title. The bar is decorative. Each legend item reads its label, its `detail`, and its share as a percent in the provider locale.
- **Motion.** On web, segments ease to a new share over the base duration and change at once under reduced motion. Native redraws without animation.
- **Limits.** One bar only. It has no axis, ticks, selection or tooltips; use `PriceChart` for series over time. With more than six elements the tones repeat, so group the smallest parts or pass `color`.

### BarPnl

`BarPnl` shows a position's profit or loss as one bar: the stretch between the entry and mark prices is filled, a tick marks each price, and the liquidation, mark and entry prices read under the bar. It is available from `@bloxwap/hig/react/bar-pnl` and `@bloxwap/hig/native/bar-pnl`.

```tsx
import {BarPnl} from '@bloxwap/hig/react/bar-pnl';

<BarPnl title="BTC Long 10×" description="+$1,300.00"
  entry={64700} mark={66000} liquidation={58800}
  labels={{liquidation: 'Liquidation', mark: 'Mark', entry: 'Entry'}}/>
```

- **Prices.** `entry` is required. `mark` may be `null` while it is unknown: the bar then draws no profit or loss and the readout shows the unknown dash. `liquidation` is optional; without it the readouts are mark and entry alone.
- **Side.** `side` is `long` or `short`. Without it the position is `short` when the liquidation price is above entry and `long` otherwise.
- **Result.** A long is in profit when mark is above entry, a short when it is below. The stretch is a solid fill, not a tint: it, the mark tick and the mark price take `positive` in profit and `negative` at a loss; the entry tick and price stay `text`, and the liquidation tick and price are always `negative`. When mark equals entry nothing is tinted.
- **Scale.** With a liquidation price the bar runs from it to the same distance on the other side of entry, so entry sits in the middle and the liquidation tick sits on the edge. A mark beyond either end stretches the bar. Without a liquidation price the bar is centred on entry. Prices rise from the leading edge to the trailing edge, so the layout follows the writing direction.
- **Readouts.** The prices sit under the bar in price order, lowest first, each over its label. Mark and entry therefore trade places when the mark crosses the entry. `barPnlLayout({entry, mark, liquidation, side})` returns the same positions, order and result for a host-drawn bar.
- **Labels.** `labels` is host text for the three prices. HIG ships no trading terms of its own, so there is no default.
- **Compact prices.** `compact` shortens the three prices for a phone: no fraction at 1,000 and above (`$64,700`), at most two fraction digits from 1 (`$142.96`, `$3,520`), and four significant digits below 1 (`$0.4821`), with trailing zeros dropped. It keeps the currency and other `priceOptions`. `barPnlCompactOptions(value, priceOptions)` returns the same format for host text.
- **Card.** `surface={false}` draws no card: no surface fill, padding or radius, for a bar that sits inside another card or directly on the page. The track then takes the page's raised fill so it stays visible.
- **Header.** `title` and `description` are optional and sit above the bar as in `BarMark`. `priceOptions` formats the three prices; the default is US dollars.
- **Accessibility.** The bar is decorative. Each readout reads its label and price. With a `title` the card is a group named by it.
- **Motion.** The prices update place by place through `AnimatedNumberReadout`, so the native entry needs the optional Reanimated and Worklets peers. On web the bar eases to a new price over the base duration and changes at once under reduced motion. Native redraws the bar without animation.

## When to use and examples

Do: show — for unknown and 0 for zero; mark stale. Don’t: turn a formatted number into order quantity or announce every live tick. Locale display, USD vs USDC, signed PnL and compact notation follow the [localization guide](../foundations/localization.md). Vocabulary follows the [glossary](../foundations/glossary.md).

## States, interaction and accessibility

`NumberReadout`, `Usd` and `Percent` are static and tabular. `AnimatedNumberReadout` keeps the same final reading while adding decorative per-place motion, with static reduced-motion and unsupported-layout fallbacks. Percent uses percent points (5 is 5%), with localized percent placement/digits and a single native text readout. Intl options control precision/trailing zeros/sign; percent style is enforced. Unknown/nonfinite values stay —. DOM table caption/column headers/aria-sort and scroll region; RN FlatList labeled-row alternative with stable keys.

State review: rest; keyboard focus/hover (DOM); accepted press and release/cancel; selected/checked where applicable; disabled; busy; inline error/recovery; empty/loading; long translations/large text; reduced motion; sound and haptics disabled. No host action occurs on mere focus. Disabled/busy targets suppress accepted activation. Core has no required feedback backend; the optional provider callback follows the action, honors cancellation and isolates errors.

## Platform mapping and limits

Numbers are display-only IEEE numeric inputs, no decimal arithmetic or hidden parser. Exact financial strings remain host-owned. No heavy DataTable engine; optional virtualization/sorting belongs to host. Native list device performance pending.

## Validation and citation

See `tests/animated-number-model.test.ts`, `tests/animated-number.dom.test.tsx`, `tests/data.dom.test.tsx`, `tests/native/animated-number.test.cjs`, `tests/native/readout-styles.test.cjs`, and `scripts/pro-data-browser-smoke.mjs`, plus consumer fixtures and milestone evidence. Chromium/WebKit checks cover real per-place motion, interrupted updates, Arabic RTL digits, canonical final output and reduced motion. Android RN 0.83 and iOS RN 0.88 simulator matrices in `evidence/native-number-flow/` verify localized final labels, rapid bursts, large text and static fallbacks. iOS Hermes did not apply `nu-arab` to an English locale tag in the runtime check, so localized reel coverage uses `ar-EG` in LTR instead. VoiceOver/TalkBack speech, physical devices, animation smoothness and exhaustive visual bidi review remain unclaimed. Cite HIG 0.1.0 with this chapter anchor and a commit permalink, not a mutable preview branch. Preserve business behavior behind a host rollback flag during adoption.

## Optional number motion

Number motion is optional for a readout on its own and required inside the swap card: `SwapPanel`, `SwapAmountCard` and the pickers update every changing number through `AnimatedNumberReadout` (see the SwapPanel live numbers rule in the blocks chapter).

`AnimatedNumberReadout` lives in the separate `animated-number` entry on both platforms. It moves changed numeric places rather than fading the whole reading or interpolating financial values. The final visible output remains the canonical `Intl.NumberFormat` result used by `NumberReadout`, including the host's `prefix`, `suffix`, locale, options and stale text. Localized digits, grouping and decimal marks, currency tokens, and scientific-notation tokens are preserved; motion never assumes ASCII digits or a decimal point.

The optional `trend` prop controls directional digit motion: `1` always moves upward, `-1` always moves downward, and `0` follows each changed digit’s own increase or decrease. A callback receives `(previousValue, newValue)` and returns one of those three values. When omitted, a finite numeric increase or decrease supplies the direction. This is a presentation hint, not a price signal or a replacement for an explicit semantic tone.

Updates are latest-value-wins: a newer value supersedes pending motion and settles on the newest final reading, including during rapid updates. Both platforms expose one accessible final reading rather than separate characters, and neither adds a live region or announces every tick. Pending visual motion is canceled on replacement and unmount.

Reduced motion and unknown/non-finite values use the static final reading. A platform that cannot safely measure or lay out individual places also uses the static result. Native opaque `formattedValue` remains static. Unsafe mixed-bidi tokenization and unsupported native text layouts may likewise fall back to the intact static reading; this is not a claim of physical-device or RTL certification.

The native animated entry uses the optional Reanimated and Worklets peers. Install SDK-compatible versions when using that entry; the ordinary native `data` entry and static readouts import no animation engine. Example: `import {AnimatedNumberReadout} from '@bloxwap/hig/react/animated-number'` (or `hig-native/animated-number`), then `<AnimatedNumberReadout value={price} label="Price" trend={1} prefix="≈ " options={{style:'currency',currency:'USD'}} />`. The gallery manifest contains runnable examples for both renderers.
