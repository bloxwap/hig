# Financial data

Readable numbers, metrics, lists, tables, and wallet addresses for host-provided financial data.

Includes `NumberReadout`, `AnimatedNumberReadout`, `Usd`, `Percent`, `Metric`, `Stat`, `Row`, `List`, `VerticalAddress`, `WalletAddress`, `QRCode`, `BarMark`, `BarPnl`, `AssetBalanceRow`, and `MarketRow`. `Table` is web-only; native uses labeled lists.

Issue #19. Entry: `data`. Import platform entries from `@bloxwap/hig/react/data` or `@bloxwap/hig/native/data` according to applicability below. Import `@bloxwap/hig/react/css` once on web; tokens CSS is a separate explicit import.

## API and anatomy

| Component | Key props and behavior |
| --- | --- |
| Readouts | `value` accepts a number, `null`, or `undefined`. Locale comes from the provider; `options`, `stale`, and `label` control presentation. |
| `VerticalAddress` | `address`, optional `kind` (`'ethereum'` or `'solana'`, inferred from a `0x` prefix) and `rowHeight`. The address in fixed-width monospace rows, always left to right: 6 characters per row for Ethereum-style addresses (42 characters make 7 rows) and 4 for Solana (44 make 11). The leading row and the trailing four characters, the ones people compare, are emphasised; the middle is dimmed. Assistive technology and copying get the plain address. |
| `WalletAddress` | `address`, `kind`, `qrValue`, `arena`, `size` (QR edge, default 196) and `onCopy`. A [Cuer](https://cuer.sh) QR code beside `VerticalAddress`, the column exactly as tall as the code. `qrValue` sets a payload other than the address, such as an EIP-681 or Solana Pay URI; `arena` puts an image in the centre. With `onCopy`, the host clipboard adapter, the whole component is one button that copies, shows “Tap to copy”, and raises “Address copied”; `announce={false}` leaves the notice to the host. `qr` draws the host's own code in place of Cuer's. Separate entry: `@bloxwap/hig/react/wallet-address` and `@bloxwap/hig/native/wallet-address`; without `cuer`, `wallet-address-core`, which on web draws HIG's own `QRCode`. |
| `QRCode` | `value`, `size` (default 196), `arena`, `errorCorrection`, `color`, `background`, `quietZone` (default 4), `label` and `decorative`. A QR code in the Cuer style, encoded by HIG with no package, drawn as one path. Separate entry: `@bloxwap/hig/react/qr-code` and `@bloxwap/hig/native/qr-code`. See [QRCode](#qrcode). |
| `List` | `items`, `keyFor`, `render`, `empty`, `label`, `loading`, `error`, `onRetry`, and `onLoadMore`. |
| `Table` (web) | `caption`, `rows`, `columns`, and `keyFor`; optional host sorting callbacks. Column `align` accepts logical `start`, `center`, or `end`. `rowProps(row, index)` forwards row highlights, styles, data/ARIA attributes and events. `captionHidden`, `stickyHeader`, `loading`, and `state` support dense product tables. |
| `MarketRow` | `symbol`, `name`, `price`, `change`, and `onSelect`; `priceOptions` controls Intl precision and currency/decimal presentation; `changeOptions` controls percent-point precision/signs. `mode='presentation'` lets a host option own selection, with optional `identity`, `icon`, `favorite`, and formatted `volume` slots. `price` and `change` are optional, and `detail`, `trailing`, `selected`, `disabled` and `active` serve a market picker (below). Web and native. Imported from the blocks entry (`@bloxwap/hig/react/blocks`, `@bloxwap/hig/native/blocks`). |

`WalletAddress` from the `wallet-address` entries needs the optional `cuer` peer (`>=0.0.3 <0.1.0`), and on native also `react-native-svg`; `VerticalAddress` needs neither and lives in the `data` entry. `WalletAddress` from `wallet-address-core` needs no peer on either platform. HIG never reads or writes the clipboard itself.

- **Host QR.** `qr` takes the host's own drawing of the code, laid out in the `size` square and named by the built-in “QR code” label (web: inside the `role="img"` wrapper, so keep the drawing `aria-hidden`; native: one image element). `qrValue` and `arena` are then unused and nothing is encoded. On both platforms `qr={null}` is the same as leaving it out: the Cuer code is drawn.
- **Without `cuer`.** `@bloxwap/hig/react/wallet-address-core` and `@bloxwap/hig/native/wallet-address-core` export the same `WalletAddress` (props `WalletAddressCoreProps`). They import neither `cuer` nor, on native, `react-native-svg`, so a host that does not install them (a Metro app that cannot reach a root `node_modules`, for example) still gets the address column, the copy button, its hint and the notice.
- **HIG's own code (Unreleased).** On web the core entry's `qr` is optional: left out or `null`, it draws [`QRCode`](#qrcode) of `qrValue` (the address by default) with `arena` in the centre, with no tile and no quiet zone, as the Cuer code is drawn. It takes `qrValue` and `arena` like the `wallet-address` entry, and the modules are the ones Cuer draws. On native the core entry must not load `react-native-svg`, so `qr` stays required there: pass `<QRCode value={address} size={size} quietZone={0} background='none' decorative/>` from `@bloxwap/hig/native/qr-code`, which needs `react-native-svg` and nothing else. The `wallet-address` entries are unchanged and still draw with `cuer`.
- **Notice.** `announce={false}` raises no “Address copied” after a copy: no toast or status text on web and no notice on native. Use it when the host confirms the copy with its own toast, so a screen reader does not hear it twice.
- **Press decoration (web).** The copy button draws the `HIGProvider pressDecoration` layer (`kind: 'row'`), so a host haptic reaches it like the other pressable rows.

```tsx
import {WalletAddress} from '@bloxwap/hig/react/wallet-address';

<WalletAddress address={account.address} onCopy={() => navigator.clipboard.writeText(account.address)}/>
<WalletAddress address={solanaAddress} qrValue={`solana:${solanaAddress}`} arena='/sol.png' size={160}/>
```

```tsx
// No QR package: HIG's own code on web, and the same code passed as `qr` on native.
import {WalletAddress} from '@bloxwap/hig/react/wallet-address-core';
<WalletAddress address={account.address} onCopy={copy}/>

import {WalletAddress} from '@bloxwap/hig/native/wallet-address-core';
import {QRCode} from '@bloxwap/hig/native/qr-code';
<WalletAddress address={account.address} onCopy={copy}
  qr={<QRCode value={account.address} quietZone={0} background='none' decorative/>}/>
```

Loading keeps existing rows visible, suppresses a misleading empty message, and disables pagination and retry until ready. Error text remains visible with an optional host retry action. Native lists use FlatList virtualization; stable host keys preserve identity during live updates.

Native readouts, including `Usd`, `Percent`, and `AnimatedNumberReadout`, accept `tone="text" | "positive" | "negative" | "warning" | "muted" | "faint" | "up" | "down"`, `testID`, and a constrained typography `style`. The style accepts `fontFamily`, `fontSize`, `fontWeight`, `lineHeight`, `letterSpacing`, and `textAlign`, including registered styles and arrays. The tone resolves through the provider palette; it is explicit rather than inferred from the sign. Colour and tabular numeric glyphs stay controlled by the readout. Font scale follows HIG Text and the provider; `maxFontSizeMultiplier` can override its cap.

For a branded 20 px equity pill, use `<NumberReadout value={equity} label="Equity" testID="equity" style={{fontFamily:'BloxwapMonoSemiBold',fontSize:20,lineHeight:28}} />` with a registered host font. For signed PnL, add `tone={pnl < 0 ? 'negative' : 'positive'}` and `options={{signDisplay:'always'}}`. The same props on `AnimatedNumberReadout` style and identify its single final accessible reading; per-place motion is decorative.

`NumberProps` on both platforms includes optional `prefix` and `suffix` display text around the canonical Intl-formatted value. The host owns the affixes and their localization. Do not use them to replace Intl currency, compact-notation, or sign formatting, and never parse the resulting display string back into a transaction value.

Native readouts also accept `formattedValue` for a host's existing static display format, such as `<NumberReadout value={90} formattedValue="01:30" label="Time remaining" />`. The host owns this opaque display text and its localization; never parse it for submission or calculations. A finite numeric `value` is still required: `null`, `undefined`, `NaN`, and infinities display the canonical unknown dash even if text is supplied. An empty string falls back to the usual locale and `options` formatting. Stale text, the accessible label, semantic tone, and tabular typography still apply to the resulting reading. `AnimatedNumberReadout` keeps opaque `formattedValue` output static rather than guessing how to split it into animated places, unless the host sets `animateFormatted`: each digit of the text (ASCII or the locale's own) then rolls in its place counted from the end and everything else stays as written. Web `AnimatedNumberReadout` takes the same `formattedValue` and `animateFormatted`. Blocks pass both for a figure's `formattedValue` (see the blocks chapter, live figures).

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

### QRCode

`QRCode` draws a QR code in the [Cuer](https://cuer.dev) style: a round dot for every dark module, rounded finder patterns in three corners, and an optional arena in the centre. HIG encodes the value itself, so the entry needs no QR package: `@bloxwap/hig/react/qr-code` has no peer beyond React, and `@bloxwap/hig/native/qr-code` needs only `react-native-svg`. The props are the same on both platforms.

```tsx
import {QRCode} from '@bloxwap/hig/react/qr-code';

<QRCode value={account.address}/>
<QRCode value={`solana:${address}?amount=1`} arena='/sol.png' size={220} label='Deposit address QR code'/>
<QRCode value={inviteLink} color='black' background='white'/>
```

- **Value.** `value` is any text: an address, a payment URI, a link. HIG picks the densest packing the whole value fits (digits, then the 45-character upper-case alphabet, then UTF-8 bytes) and the smallest symbol that holds it, from 21 to 177 modules a side. A value no QR code can hold (more than 2,953 bytes at low error correction, 1,273 at high) draws an empty square of `size` that is hidden from assistive technology; nothing throws while rendering.
- **Size.** `size` is the edge of the square, quiet zone included: CSS pixels on web, dp on native, default 196. The drawing is in module units, so a new size changes two attributes and encodes nothing. On web, host CSS on the element may resize it and the code scales.
- **Arena.** `arena` is drawn over the centre: an image URL (cropped to cover its box, with a one-module corner radius), or a node such as a token mark, laid out in the arena's box in CSS pixels or dp. The centre square is cleared of modules: a quarter of the side, made odd so it is centred on the centre module, with the arena half a module inside it. Cuer aligns its arena to the module grid half a module off centre; HIG centres it.
- **Error correction.** `errorCorrection` is `'low'`, `'medium'`, `'quartile'` or `'high'`. Left out, a code with an arena uses `high`, because the arena covers part of it, and a code without one uses `medium`. A level the host names is used as given, except that under an arena `low` and `medium` are raised to `quartile`: with the centre covered, codes at `quartile` and `high` decoded in every case tested, while some at `medium` and most at `low` did not.
- **Colour.** The modules take the `text` role and the tile behind them the `background` role: `var(--hig-text)` and `var(--hig-background)` on web, the provider's colour table on native, so both follow Display P3 where the provider paints it. `color` and `background` override them with any colour the platform accepts. `background='none'` draws no tile, for a code that sits on the host's own surface. HIG's theme is light text on a dark page, so the default is a light code on a dark tile. Current phone cameras generally read a reversed code; some older or dedicated scanners read only dark on light, so pass `color='black' background='white'` (or the host's own pair) where any scanner must read the code. Keep an override pair as far apart as the roles are: HIG does not check the contrast of host colours.
- **Quiet zone.** `quietZone` is the clear margin kept on every side, in modules, inside `size`. The default is 4, the margin the QR standard asks for; the tile covers it and its corners are rounded by half of it. Pass `0` only where the host keeps that margin itself, as `WalletAddress` does with its padding.
- **Accessibility.** The code is one image named by the built-in “QR code” message (`qrCode`), or by `label`. `decorative` hides it, for a host that names the code on an element of its own, as `WalletAddress` does. A QR code carries no text of its own: put the address or link beside it as text that can be read, selected and copied. Nothing animates, so reduced motion changes nothing; the code is never mirrored in a right-to-left layout, and no text is drawn, so large text changes nothing.
- **Performance.** The whole code is one path in one SVG: the dots and the three finder patterns (each a ring written as an outline with a hole, around a core). The value is encoded once per `value`, `errorCorrection` and arena, and the path is kept between renders; a new `size`, colour or quiet zone, or a parent render, recomputes nothing. Encoding a wallet address measured about 0.25 ms in Node on a development laptop; it has not been timed on a phone.
- **Platforms.** Web draws the image arena as an SVG `image` and a node arena in a `foreignObject`, and accepts SVG attributes (`className`, `style`, `data-*`). Native draws either arena as a view over the SVG, centred, and takes `testID` (also the prefix of `-code` and `-arena`) and a view `style`.
- **Shared model.** `@bloxwap/hig/contracts/qr` is the encoder and the geometry both renderers use: `encodeQR(value, {errorCorrection, version, mask, mode})` returns the modules, `qrGeometry(matrix, {arena})` the path and the cleared square, and `qrFrame(geometry, edge, quietZone)` the view box and the arena's box. It imports nothing, so a host can draw the same code elsewhere, on a server for example. The encoder covers versions 1 to 40 at all four levels and picks the mask as Cuer's encoder does, so the modules are the ones Cuer draws for the same value and level.
- **Limits.** One segment in one mode a code: no Kanji mode, no ECI header (bytes are UTF-8, which phone scanners assume), no structured append and no Micro QR. The look is fixed; there are no module-shape options.

### MarketRow

Web `MarketRow` keeps its name button and USD formatting by default. A command palette that already owns option selection uses presentation mode to avoid a second action and tab stop:

```tsx
<CommandItem onSelect={()=>openMarket(market.symbol)}>
  <MarketRow mode='presentation' symbol={market.symbol} name={market.name}
    price={market.price} priceOptions={{style:'decimal',maximumFractionDigits:8}}
    change={market.change} changeOptions={{minimumFractionDigits:2,maximumFractionDigits:2}}
    identity={<><strong>{market.symbol}</strong> {market.name}</>} icon={<MarketIcon symbol={market.symbol}/>}
    favorite={<FavoriteIndicator selected={market.favorite}/>}
    volume={<NumberReadout value={market.volume} options={{notation:'compact'}}/>}
    style={{gridTemplateColumns:'minmax(0,1fr) 12ch 8ch 10ch'}}/>
</CommandItem>
```

Native `MarketRow` has the same presentation mode, with `identity`, `icon`, `favorite`, `volume`, `priceOptions` and `changeOptions`; the host's own `Pressable` then owns the press.

A market picker uses the options below on both platforms. Without them the row renders exactly as before.

```tsx
<MarketRow ref={rowRef} symbol={m.symbol} name={m.name} icon={<MarketIcon symbol={m.symbol}/>} detail={t.maxLeverage(m.maxLeverage)}
  trailing={held&&<HeldPnl value={held.pnl}/>} selected={m.symbol===current} active={index===cursor} disabled={!m.tradable}
  data-testid={`market-${m.symbol}`} onPointerDown={()=>prime(m.symbol)} onSelect={()=>open(m.symbol)}/>
```

- **Optional figures.** Leave out `price` or `change` and that cell is not drawn, with no dash; `null` still reads as unknown. On web a presentation row whose cells differ from the default set flows into as many grid columns as it has (`data-flow`), so a host `gridTemplateColumns` still applies.
- **Detail.** `detail` is a muted second line under the name, such as the maximum leverage. In action mode it is part of the name button and read with it (native: `name (symbol), detail`, with the detail's text). Both platforms take text or host nodes; on native a string or number is drawn muted and an element is drawn as given.
- **Trailing.** `trailing` is host content after the figures, such as a held position's result or a heat mark.
- **States.** `selected` draws a check on the trailing edge and sets `aria-current="true"` on the name button (web) or `accessibilityState.selected` (native); in presentation mode they go on the row. `disabled` disables the name button and dims the other cells. `active` paints the row with the well fill, for the row under a host's keyboard cursor; HIG does not move it.
- **One line (Unreleased, a defect fix that changes rendering).** An action row is one line on both platforms: the identity (favourite, icon, then the name over its detail) holds the leading edge and shrinks, the figures, `trailing` content and check keep their width on the trailing edge, and the name and detail truncate with an ellipsis instead of wrapping. Before, the web row wrapped: in action mode the identity was not laid out, so the avatar stacked above the name and the trailing content dropped to a second band (rows measured 126px). The name button is a 44 unit target with no block padding, so a row is 56 units (58 on web, 60dp on native, with a detail line). Web measurements in Chromium and WebKit at 310 and 402 px: 56px without a detail line, 58.02px with one. On web this includes the plain row (name, price, change), whose name now truncates rather than wrapping the figures onto a second line. Native rows with host options no longer wrap either (`flexWrap: 'nowrap'`, 8dp vertical padding); the native plain row is unchanged. Catalog state `one-line`.
- **Pass-through.** On web the ref and every other attribute and handler (`data-*`, `id`, `onPointerDown`, `onMouseEnter`) reach the row's root `div`; pointer events from the name button bubble to it. On native the ref reaches the root view, `testID` names it (the button is `<testID>-select`) and `onPressIn` reaches the name button.

### AssetBalanceRow

`AssetBalanceRow` is one holding in a list: round artwork, the asset's `name` over its `symbol`, and on the trailing edge its dollar `value` over its `balance` in token units. It is the row `AccountBlock` is made of, and lives in its own entry: `@bloxwap/hig/react/asset-balance-row` and `@bloxwap/hig/native/asset-balance-row`.

```tsx
<AssetBalanceRow name="Hyperliquid" symbol="HYPE" value={759} balance={13.2} onSelect={open}/>
<AssetBalanceRow name="USD Coin" symbol="USDC" value={100.33}/>
```

- **Artwork.** `icon` is an image URL or a host element; without one the row shows the first letters of the symbol.
- **Amounts.** `value` is in dollars; `null` reads as unknown. `balance` is in token units, formatted with `balanceOptions` (at most six fraction digits by default). Omit `balance` to show the value alone, as for a dollar stablecoin.
- **Units headline.** `headline='units'` puts the units on the headline line in place of the value and draws no second line, for a holding the host has no dollar price for. It is read the same way: name, symbol, units. The default, `'value'`, is the value over the units.
- **Units suffix.** `unitsSuffix` is host text after the units figure, such as ` HYPE`, so `1.005` reads `1.005 HYPE`. It is drawn and read only when the units are known; unknown units stay the dash.
- **Tag.** `tag` is short muted host text under the figures, in the caption size, such as the ledger a holding sits in (Perp, Spot, Staked), so two rows of the same asset read apart. It is read after the figures.
- **Items to pick.** `amounts={false}` draws no figures at all, for a row that is only an item to choose, such as a deposit method or a chain. The row keeps its avatar, name and second line, and reads as name and symbol.
- **Trailing.** `trailing` is host content on the trailing edge after the figures, such as a status icon. In a pressable row it must not be interactive. It is read last: on web in place, on native as its text appended to the row's one label. `trailingLabel` replaces what is read for it on both platforms, for an icon or a figure whose visible text is not what should be heard.
- **Selected.** `selected` draws a check on the trailing edge, in the text colour as in `LanguageBlock`, for the source or destination in use. Web sets `aria-current="true"`; native sets `accessibilityState.selected`.
- **Disabled.** `disabled` keeps the well fill, turns the name, figures and check muted and the artwork to half strength, and ignores presses: a pressable row becomes a disabled button on web and a disabled `Pressable` on native, and a plain row reads as unavailable (on web a `role="group"` with `aria-disabled`, since a plain `div` cannot carry the state; `accessibilityState.disabled` on native).
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

- **Elements.** Each element is `{label, value}` plus optional `id`, `tone`, `color` and `detail`. `value` is in the host's own unit and only its share of the whole is drawn; negative and non-finite values count as nothing. `detail` is shown after the label in the legend: host-formatted text, or a live figure `{value, options, prefix, suffix}` for an amount that changes while the bar is shown, formatted with `options` (the provider's `numberFormat` applies) between `prefix` and `suffix`, with `null` read as unknown.
- **Live details.** On web a figure detail updates place by place through `AnimatedNumberReadout`. The native bar-mark entry still needs no peers, so on its own it draws a figure formatted, without movement; `TokenActionBlock` supplies a renderer that moves it place by place, and a host with the animated-number peers can do the same by wrapping its `BarMark` in `BarMarkFigureContext.Provider` with a function `(figure, {testID}) => <AnimatedNumberReadout …/>`. Either way the legend item reads the formatted amount.
- **Colour.** An element takes a `tone` role: `positive`, `info`, `warning`, `negative`, `muted` or `faint`. Without one, elements take those tones in that order and repeat. `color` is a host hex for a category outside the roles and wins over `tone`. Do not rely on colour alone: the legend always names each part.
- **Whole.** `total` is the whole the elements are parts of. When it is larger than their sum, the remainder stays empty track, as in margin used out of a limit. Without it the elements fill the bar.
- **Anatomy.** The bar is 24 units high with an 8-unit radius; segments are separated by a 2-unit gap and a non-zero segment is never thinner than 3 units. The layout follows the writing direction: the first element starts on the leading edge.
- **Card.** `surface={false}` draws no card: no surface fill, padding or radius, with the title row, bar and legend keeping their spacing. Use it for read-only data that sits directly on a screen, as `ManagePositionBlock` does; `BarPnl` has the same setting.
- **Size.** `size='small'` draws a 12-unit bar with a 6-unit radius for a secondary breakdown under a main one.
- **Legend.** A wrapping row of colour dots and labels under the bar. `legend={false}` hides it visually; the labels and shares stay available to assistive technology.
- **Accessibility.** The card is a group named by its title. The bar is decorative. Each legend item reads its label, its `detail`, and its share as a percent in the provider locale.
- **Motion.** On web, segments ease to a new share over the base duration and change at once under reduced motion. Native redraws without animation.
- **Limits.** One bar only. It has no axis, ticks, selection or tooltips; use `PriceChart` for series over time. With more than six elements the tones repeat, so group the smallest parts or pass `color`.

### BarPnl

`BarPnl` shows a position's profit or loss as one bar: the stretch between the entry and mark prices is filled in the result colour at half strength, a solid tick marks each price, and the liquidation, mark and entry prices read under the bar. It is available from `@bloxwap/hig/react/bar-pnl` and `@bloxwap/hig/native/bar-pnl`.

```tsx
import {BarPnl} from '@bloxwap/hig/react/bar-pnl';

<BarPnl title="BTC Long 10×" description="+$1,300.00"
  entry={64700} mark={66000} liquidation={58800}
  labels={{liquidation: 'Liquidation', mark: 'Mark', entry: 'Entry'}}/>
```

- **Prices.** `entry` is required. `mark` may be `null` while it is unknown: the bar then draws no profit or loss and the readout shows the unknown dash. `liquidation` is optional; without it the readouts are mark and entry alone.
- **Side.** `side` is `long` or `short`. Without it the position is `short` when the liquidation price is above entry and `long` otherwise.
- **Result.** A long is in profit when mark is above entry, a short when it is below. The stretch takes the market `up` role in profit and the `down` role at a loss, and the mark price takes the same role (the mark tick merges into the fill). The roles default to `buy` and `sell`, the same colours as `positive` and `negative`, and follow `HIGProvider marketColors` on either platform, like the trade history blocks; the entry tick and price stay `text`, and the liquidation tick and price are always `negative`. When mark equals entry nothing is tinted.
- **Scale.** With a liquidation price the bar runs from it to the same distance on the other side of entry, so entry sits in the middle and the liquidation tick sits on the edge. A mark beyond either end stretches the bar. Without a liquidation price the bar is centred on entry. Prices rise from the leading edge to the trailing edge, so the layout follows the writing direction.
- **Readouts.** The prices sit under the bar in price order, lowest first, each over its label. Mark and entry therefore trade places when the mark crosses the entry. `barPnlLayout({entry, mark, liquidation, side})` returns the same positions, order and result for a host-drawn bar.
- **Labels.** `labels` is host text for the three prices. HIG ships no trading terms of its own, so there is no default.
- **Compact prices.** `compact` shortens the three prices for a phone: no fraction at 1,000 and above (`$64,700`), at most two fraction digits from 1 (`$142.96`, `$3,520`), and four significant digits below 1 (`$0.4821`), with trailing zeros dropped. It keeps the currency and other `priceOptions`. `barPnlCompactOptions(value, priceOptions)` returns the same format for host text.
- **Fit.** `fit` scales the bar to the prices themselves, so the stretch from entry to mark fills it, with a liquidation price at one end when there is one. Use it for a finished trade; an open position keeps the default, which centres entry so the move reads against the room left.
- **Card.** `surface={false}` draws no card: no surface fill, padding or radius, for a bar that sits inside another card or directly on the page. The track then takes the page's raised fill so it stays visible.
- **Header.** `title` and `description` are optional and sit above the bar as in `BarMark`. `priceOptions` formats the three prices; the default is US dollars.
- **Accessibility.** The bar is decorative. Each readout reads its label and price. With a `title` the card is a group named by it.
- **Motion.** The prices update place by place through `AnimatedNumberReadout`, so the native entry needs the optional Reanimated and Worklets peers. On web the bar eases to a new price over the base duration and changes at once under reduced motion. Native redraws the bar without animation.

## When to use and examples

Do: show — for unknown and 0 for zero; mark stale. Don’t: turn a formatted number into order quantity or announce every live tick. Locale display, USD vs USDC, signed PnL and compact notation follow the [localization guide](../foundations/localization.md). Vocabulary follows the [glossary](../foundations/glossary.md).

## States, interaction and accessibility

`NumberReadout`, `Usd` and `Percent` are static and tabular. `AnimatedNumberReadout` keeps the same final reading while adding decorative per-place motion, with static reduced-motion and unsupported-layout fallbacks. On native every digit reel takes the widest digit's advance; where the face's digits are not tabular (Android ignores `tabular-nums` for faces without the feature), the reels are wider than the reading. The reel row is drawn in the readout's own flow (the composed sign, every static part, each reel at the widest digit's advance, and the affixes), so the readout is laid out from what it draws and is wider than the reading by that much; the reading leaves the flow while the reels show and stays, invisible, for assistive technology. Each reel clips only its own column, so no glyph is cut (Unreleased: before, the reels were an overlay on the reading, so a box kept the reading's width and the reels drew past it, as `+100.00%` did over ` on margin` on Android). Where the reading is as wide as the reels, as on iOS, nothing changes. Percent uses percent points (5 is 5%), with localized percent placement/digits and a single native text readout. Intl options control precision/trailing zeros/sign; percent style is enforced. Unknown/nonfinite values stay —. DOM table caption/column headers/aria-sort and scroll region; RN FlatList labeled-row alternative with stable keys.

State review: rest; keyboard focus/hover (DOM); accepted press and release/cancel; selected/checked where applicable; disabled; busy; inline error/recovery; empty/loading; long translations/large text; reduced motion; sound and haptics disabled. No host action occurs on mere focus. Disabled/busy targets suppress accepted activation. Core has no required feedback backend; the optional provider callback follows the action, honors cancellation and isolates errors.

## Platform mapping and limits

Numbers are display-only IEEE numeric inputs, no decimal arithmetic or hidden parser. Exact financial strings remain host-owned. No heavy DataTable engine; optional virtualization/sorting belongs to host. Native list device performance pending.

## Validation and citation

See `tests/qr-model.test.ts`, `tests/qr-code.dom.test.tsx`, `tests/native/qr-code.test.cjs`, `tests/animated-number-model.test.ts`, `tests/animated-number.dom.test.tsx`, `tests/data.dom.test.tsx`, `tests/native/animated-number.test.cjs`, `tests/native/readout-styles.test.cjs`, and `scripts/pro-data-browser-smoke.mjs`, plus consumer fixtures and milestone evidence. Chromium/WebKit checks cover real per-place motion, interrupted updates, Arabic RTL digits, canonical final output and reduced motion. Android RN 0.83 and iOS RN 0.88 simulator matrices in `evidence/native-number-flow/` verify localized final labels, rapid bursts, large text and static fallbacks. iOS Hermes did not apply `nu-arab` to an English locale tag in the runtime check, so localized reel coverage uses `ar-EG` in LTR instead. `QRCode`'s modules are compared with Cuer's encoder for every version, level and mask and decoded by a software reader as drawn (round dots, with and without the arena); it has not been scanned from a screen with a phone or a dedicated scanner. VoiceOver/TalkBack speech, physical devices, animation smoothness and exhaustive visual bidi review remain unclaimed. Cite HIG 0.1.0 with this chapter anchor and a commit permalink, not a mutable preview branch. Preserve business behavior behind a host rollback flag during adoption.

## Optional number motion

Number motion is optional for a readout on its own and required inside the swap card: `SwapPanelBlock`, `SwapAmountCard` and the pickers update every changing number through `AnimatedNumberReadout` (see the SwapPanelBlock live numbers rule in the blocks chapter).

`AnimatedNumberReadout` lives in the separate `animated-number` entry on both platforms. It moves changed numeric places rather than fading the whole reading or interpolating financial values. The final visible output remains the canonical `Intl.NumberFormat` result used by `NumberReadout`, including the host's `prefix`, `suffix`, locale, options and stale text. Localized digits, grouping and decimal marks, currency tokens, and scientific-notation tokens are preserved; motion never assumes ASCII digits or a decimal point.

The optional `trend` prop controls directional digit motion: `1` always moves upward, `-1` always moves downward, and `0` follows each changed digit’s own increase or decrease. A callback receives `(previousValue, newValue)` and returns one of those three values. When omitted, a finite numeric increase or decrease supplies the direction. This is a presentation hint, not a price signal or a replacement for an explicit semantic tone.

Updates are latest-value-wins: a newer value supersedes pending motion and settles on the newest final reading, including during rapid updates. Both platforms expose one accessible final reading rather than separate characters, and neither adds a live region or announces every tick. Pending visual motion is canceled on replacement and unmount.

Reduced motion and unknown/non-finite values use the static final reading. A platform that cannot safely measure or lay out individual places also uses the static result. Opaque `formattedValue` remains static unless `animateFormatted` is set. Unsafe mixed-bidi tokenization and unsupported native text layouts may likewise fall back to the intact static reading; this is not a claim of physical-device or RTL certification.

The native animated entry uses the optional Reanimated and Worklets peers. Install SDK-compatible versions when using that entry; the ordinary native `data` entry and static readouts import no animation engine. Example: `import {AnimatedNumberReadout} from '@bloxwap/hig/react/animated-number'` (or `hig-native/animated-number`), then `<AnimatedNumberReadout value={price} label="Price" trend={1} prefix="≈ " options={{style:'currency',currency:'USD'}} />`. The gallery manifest contains runnable examples for both renderers.
