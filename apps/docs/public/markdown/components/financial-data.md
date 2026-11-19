# Financial data

Readable numbers, metrics, lists, tables, and wallet addresses for host-provided financial data.

Includes `NumberReadout`, `NumberFlow`, `Usd`, `Percent`, `Metric`, `Stat`, `Row`, `List`, `VerticalAddress`, `WalletAddress`, `QRCode`, `BarMark`, `BarPnl`, `AssetBalanceRow`, and `MarketRow`. `Table` is web-only; native uses labeled lists.

Issue #19. Entry: `data`. Import platform entries from `@bloxwap/hig/react/data` or `@bloxwap/hig/native/data` according to applicability below. Import `@bloxwap/hig/react/css` once on web; tokens CSS is a separate explicit import.

## API and anatomy

| Component | Key props and behavior |
| --- | --- |
| Readouts | `value` accepts a number, `null`, or `undefined`. Locale comes from the provider; `options`, `stale`, and `label` control presentation. |
| `VerticalAddress` | `address`, optional `kind` (`'ethereum'` or `'solana'`, inferred from a `0x` prefix) and `rowHeight`. The address in fixed-width monospace rows, always left to right: 6 characters per row for Ethereum-style addresses (42 characters make 7 rows) and 4 for Solana (44 make 11). The leading row and the trailing four characters, the ones people compare, are emphasised; the middle is dimmed. Assistive technology and copying get the plain address. |
| `WalletAddress` | `address`, `kind`, `qrValue`, `arena`, `size` (QR edge, default 196) and `onCopy`. HIG's own [`QRCode`](#qrcode) beside `VerticalAddress`, the column exactly as tall as the code. `qrValue` sets a payload other than the address, such as an EIP-681 or Solana Pay URI; `arena` puts an image in the centre. With `onCopy`, the host clipboard adapter, the whole component is one button that copies, shows “Tap to copy”, and raises “Address copied”; `announce={false}` leaves the notice to the host. `qr` draws the host's own code in place of HIG's. Separate entry: `@bloxwap/hig/react/wallet-address` and `@bloxwap/hig/native/wallet-address`. No QR package is needed. |
| `QRCode` | `value`, `size` (default 196), `arena`, `errorCorrection`, `color`, `background`, `quietZone` (default 4), `label` and `decorative`. A QR code in the Cuer style, encoded by HIG with no package, drawn as one path. Separate entry: `@bloxwap/hig/react/qr-code` and `@bloxwap/hig/native/qr-code`. See [QRCode](#qrcode). |
| `List` | `items`, `keyFor`, `render`, `empty`, `label`, `loading`, `error`, `onRetry`, and `onLoadMore`. |
| `Table` (web) | `caption`, `rows`, `columns`, and `keyFor`; optional host sorting callbacks. Column `align` accepts logical `start`, `center`, or `end`. `rowProps(row, index)` forwards row highlights, styles, data/ARIA attributes and events. `captionHidden`, `stickyHeader`, `loading`, and `state` support dense product tables. |
| `MarketRow` | `symbol`, `name`, `price`, `change`, and `onSelect`; `priceOptions` controls Intl precision and currency/decimal presentation; `changeOptions` controls percent-point precision/signs. `mode='presentation'` lets a host option own selection, with optional `identity`, `icon`, `favorite`, and formatted `volume` slots. `price` and `change` are optional, and `detail`, `trailing`, `selected`, `disabled` and `active` serve a market picker (below). Web and native. Imported from the blocks entry (`@bloxwap/hig/react/blocks`, `@bloxwap/hig/native/blocks`). |

`WalletAddress` needs no QR package. On native the `wallet-address` entry needs `react-native-svg`, as `QRCode` does; `VerticalAddress` needs nothing and lives in the `data` entry. HIG never reads or writes the clipboard itself.

- **Host QR.** `qr` takes the host's own drawing of the code, laid out in the `size` square and named by the built-in “QR code” label (web: inside the `role="img"` wrapper, so keep the drawing `aria-hidden`; native: one image element). `qrValue` and `arena` are then unused and nothing is encoded. On both platforms `qr={null}` is the same as leaving it out: HIG's own code is drawn.
- **Without `react-native-svg` (native).** `@bloxwap/hig/native/wallet-address-core` exports the same `WalletAddress` with `qr` required (props `WalletAddressCoreProps`). It imports no SVG library, so a host that draws its own code still gets the address column, the copy button, its hint and the notice.
- **HIG's own code.** Left out or `null`, `qr` gives way to [`QRCode`](#qrcode) of `qrValue` (the address by default) with `arena` in the centre, with no tile and no quiet zone and in the component's text colour (`currentColor` on web, the text role on native). Through 0.9.3 the `wallet-address` entries drew this code with the `cuer` package, an optional peer that is gone; the modules are the same.
- **Notice.** `announce={false}` raises no “Address copied” after a copy: no toast or status text on web and no notice on native. Use it when the host confirms the copy with its own toast, so a screen reader does not hear it twice.
- **Press decoration (web).** The copy button draws the `HIGProvider pressDecoration` layer (`kind: 'row'`), so a host haptic reaches it like the other pressable rows.

```tsx
import {WalletAddress} from '@bloxwap/hig/react/wallet-address';

<WalletAddress address={account.address} onCopy={() => navigator.clipboard.writeText(account.address)}/>
<WalletAddress address={solanaAddress} qrValue={`solana:${solanaAddress}`} arena='/sol.png' size={160}/>
```

```tsx
// A native host that loads no SVG library elsewhere passes its own drawing as `qr`; here it is HIG's code.
import {WalletAddress} from '@bloxwap/hig/native/wallet-address-core';
import {QRCode} from '@bloxwap/hig/native/qr-code';
<WalletAddress address={account.address} onCopy={copy}
  qr={<QRCode value={account.address} quietZone={0} background='none' decorative/>}/>
```

Loading keeps existing rows visible, suppresses a misleading empty message, and disables pagination and retry until ready. Error text remains visible with an optional host retry action. Native lists use FlatList virtualization; stable host keys preserve identity during live updates.

Native readouts, including `Usd`, `Percent`, and `NumberFlow`, accept `tone="text" | "positive" | "negative" | "warning" | "muted" | "faint" | "up" | "down"`, `testID`, and a constrained typography `style`. The style accepts `fontFamily`, `fontSize`, `fontWeight`, `lineHeight`, `letterSpacing`, and `textAlign`, including registered styles and arrays. The tone resolves through the provider palette; it is explicit rather than inferred from the sign. Colour and tabular numeric glyphs stay controlled by the readout. Font scale follows HIG Text and the provider; `maxFontSizeMultiplier` can override its cap.

For a branded 20 px equity pill, use `<NumberReadout value={equity} label="Equity" testID="equity" style={{fontFamily:'BloxwapMonoSemiBold',fontSize:20,lineHeight:28}} />` with a registered host font. For signed PnL, add `tone={pnl < 0 ? 'negative' : 'positive'}` and `options={{signDisplay:'always'}}`. The same props on `NumberFlow` style and identify its single final accessible reading; per-place motion is decorative.

`NumberProps` on both platforms includes optional `prefix` and `suffix` display text around the canonical Intl-formatted value. The host owns the affixes and their localization. Do not use them to replace Intl currency, compact-notation, or sign formatting, and never parse the resulting display string back into a transaction value.

Native readouts also accept `formattedValue` for a host's existing static display format, such as `<NumberReadout value={90} formattedValue="01:30" label="Time remaining" />`. The host owns this opaque display text and its localization; never parse it for submission or calculations. A finite numeric `value` is still required: `null`, `undefined`, `NaN`, and infinities display the canonical unknown dash even if text is supplied. An empty string falls back to the usual locale and `options` formatting. Stale text, the accessible label, semantic tone, and tabular typography still apply to the resulting reading. `NumberFlow` keeps opaque `formattedValue` output static rather than guessing how to split it into animated places, unless the host sets `animateFormatted`: each digit of the text (ASCII or the locale's own) then rolls in its place counted from the end and everything else stays as written. Web `NumberFlow` takes the same `formattedValue` and `animateFormatted`. Blocks pass both for a figure's `formattedValue` (see the blocks chapter, live figures).

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
- **Size.** `size` is the edge of the square, quiet zone included: CSS pixels on web, dp on native, default 196. The drawing is in module units, so a new size encodes nothing. On web `size` sets `--hig-qr-code-size`, which the stylesheet reads as the element's width (the height follows, and the element never exceeds its container), so host CSS may resize it by setting `width` on the element: the drawing and the arena's box scale with it.
- **Arena.** `arena` is drawn over the centre: an image URL (cropped to cover its box, with a one-module corner radius), or a node such as a token mark, centred in the arena's box at its own size in CSS pixels or dp and clipped to the box. The centre square is cleared of modules: a quarter of the side, made odd so it is centred on the centre module, with the arena half a module inside it. Cuer aligns its arena to the module grid half a module off centre; HIG centres it. Keep the mark inside the box: anything drawn outside it would cover modules.
- **Error correction.** `errorCorrection` is `'low'`, `'medium'`, `'quartile'` or `'high'`. Left out, a code with an arena uses `high`, because the arena covers part of it, and a code without one uses `medium`. A level the host names is used as given, except that under an arena `low` and `medium` are raised to `quartile`: with the centre covered, codes at `quartile` and `high` decoded in every case tested, while some at `medium` and most at `low` did not.
- **Colour.** The modules take the `text` role and the tile behind them the `background` role: `var(--hig-text)` and `var(--hig-background)` on web, the provider's colour table on native, so both follow Display P3 where the provider paints it. `color` and `background` override them with any colour the platform accepts. `background='none'` draws no tile, for a code that sits on the host's own surface. HIG's theme is light text on a dark page, so the default is a light code on a dark tile. Current phone cameras generally read a reversed code; some older or dedicated scanners read only dark on light, so pass `color='black' background='white'` (or the host's own pair) where any scanner must read the code. Keep an override pair as far apart as the roles are: HIG does not check the contrast of host colours.
- **Quiet zone.** `quietZone` is the clear margin kept on every side, in modules, inside `size`. The default is 4, the margin the QR standard asks for; the tile covers it and its corners are rounded by half of it. Pass `0` only where the host keeps that margin itself, as `WalletAddress` does with its padding.
- **Accessibility.** The code is one image named by the built-in “QR code” message (`qrCode`), or by `label`. `decorative` hides it, for a host that names the code on an element of its own, as `WalletAddress` does. A QR code carries no text of its own: put the address or link beside it as text that can be read, selected and copied. Nothing animates, so reduced motion changes nothing; the code is never mirrored in a right-to-left layout, and no text is drawn, so large text changes nothing.
- **Performance.** The whole code is one path in one SVG: the dots and the three finder patterns (each a ring written as an outline with a hole, around a core). The arena is one more element over it. The value is encoded once per `value`, `errorCorrection` and arena, and the path is kept between renders; a new `size`, colour or quiet zone, or a parent render, recomputes nothing. The encoder scores the eight mask patterns on bits, 32 modules a word, and gives a pattern up once it cannot win; the path writes each column's start and each row's end once. Encoding a wallet address and writing its path (42 bytes under an arena, so high error correction) takes under 0.1 ms in Node on a development laptop, and under 1 ms with V8's JIT switched off (`node --jitless`), the closer stand-in for Hermes, which interprets: about an eighth of what the first encoder took in the same runs. In headless Chromium the first code on a page mounts in about 60% of the time it took, a list of 50 codes in under half, and a keystroke that changes the value in a little over half. `scripts/perf/qr-code-model.mjs` and `scripts/perf/qr-code-web.mjs` take these measurements and `evidence/perf/qr-code-*.json` holds them, with the machine's load at the time; `fixtures/native/perf/qr-code.tsx` logs the encoder's time on a device. It has not been timed on a phone.
- **Platforms.** Both draw a square that holds the SVG, with the arena as a box over it. Web's square is a `span` with `role="img"` and the class `hig-qr-code`; it accepts HTML attributes (`className`, `style`, `id`, `data-*`), the arena box is `span.hig-qr-code-arena` placed in percentages of the square, and an image arena is an `img`. The arena is not an SVG `foreignObject`: WebKit paints positioned, transformed or translucent `foreignObject` content at the SVG's corner, over a finder pattern, which made such a code unreadable in Safari. Native's square is a `View` with `accessibilityRole="image"`; it takes `testID` (also the prefix of `-code` for the SVG and `-arena` for the arena) and a view `style`. Web needs the HIG stylesheet (`@bloxwap/hig/react/css`) for the square's size and the arena's position.
- **Shared model.** `@bloxwap/hig/contracts/qr` is the encoder and the geometry both renderers use: `encodeQR(value, {errorCorrection, version, mask, mode})` returns the modules, `qrGeometry(matrix, {arena})` the path and the cleared square, and `qrFrame(geometry, edge, quietZone)` the view box and the arena's box. It imports nothing, so a host can draw the same code elsewhere, on a server for example. The encoder covers versions 1 to 40 at all four levels and picks the mask as the `qr` reference encoder does, so the modules match that encoder's for the same value and level.
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
- **One line (0.8.0, a defect fix that changes rendering).** An action row is one line on both platforms: the identity (favourite, icon, then the name over its detail) holds the leading edge and shrinks, the figures, `trailing` content and check keep their width on the trailing edge, and the name and detail truncate with an ellipsis instead of wrapping. Before, the web row wrapped: in action mode the identity was not laid out, so the avatar stacked above the name and the trailing content dropped to a second band (rows measured 126px). The name button is a 44 unit target with no block padding, so a row is 56 units (58 on web, 60dp on native, with a detail line). Web measurements in Chromium and WebKit at 310 and 402 px: 56px without a detail line, 58.02px with one. On web this includes the plain row (name, price, change), whose name now truncates rather than wrapping the figures onto a second line. Native rows with host options no longer wrap either (`flexWrap: 'nowrap'`, 8dp vertical padding); the native plain row is unchanged. Catalog state `one-line`.
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
- **A control in the trailing slot.** `trailingInteractive` says `trailing` holds a control, such as a Copy or Remove button, which then stays its own target and accessibility element. With `onSelect`, web draws a `div.hig-asset-row` holding the row's button (`button.hig-asset-row-main`, with the artwork, name, figures and `aria-current`) and the control beside it; native draws the row's button as `<testID>-main` (one element, read as before without the trailing text) and the control beside it in `<testID>-trailing`, outside the press. A static native row likewise becomes a named `<testID>-main` element beside the control; a static web row already keeps it reachable. `trailingLabel` is not used then. Without it nothing changes.
- **Selected.** `selected` draws a check on the trailing edge, in the text colour as in `LanguageBlock`, for the source or destination in use. Web sets `aria-current="true"`; native sets `accessibilityState.selected`.
- **Disabled.** `disabled` keeps the well fill, turns the name, figures and check muted and the artwork to half strength, and ignores presses: a pressable row becomes a disabled button on web and a disabled `Pressable` on native, and a plain row reads as unavailable (on web a `role="group"` with `aria-disabled`, since a plain `div` cannot carry the state; `accessibilityState.disabled` on native).
- **Anatomy.** A capsule concentric with its 40-unit avatar: 8 units of padding, 56 units high, a 28-unit end radius, on the well fill. Rows in a list sit 8 units apart.
- **Interaction.** `onSelect` makes the whole row a button; without it the row is not interactive.
- **Live numbers.** Both figures update through `NumberFlow`, so the native entry needs the optional Reanimated and Worklets peers.

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
- **Live details.** On web a figure detail updates place by place through `NumberFlow`. The native bar-mark entry still needs no peers, so on its own it draws a figure formatted, without movement; `TokenActionBlock` supplies a renderer that moves it place by place, and a host with the animated-number peers can do the same by wrapping its `BarMark` in `BarMarkFigureContext.Provider` with a function `(figure, {testID}) => <NumberFlow motion="slide" …/>`. Either way the legend item reads the formatted amount.
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
- **Motion.** The prices update place by place through `NumberFlow`, so the native entry needs the optional Reanimated and Worklets peers. On web the bar eases to a new price over the base duration and changes at once under reduced motion. Native redraws the bar without animation.

## When to use and examples

Do: show — for unknown and 0 for zero; mark stale. Don’t: turn a formatted number into order quantity or announce every live tick. Locale display, USD vs USDC, signed PnL and compact notation follow the [localization guide](https://bloxwap.github.io/hig/docs/guides/foundations/localization/). Vocabulary follows the [glossary](https://bloxwap.github.io/hig/docs/guides/foundations/glossary/).

## States, interaction and accessibility

`NumberReadout`, `Usd` and `Percent` are static and tabular. `NumberFlow` keeps the same final reading while adding decorative per-place motion, with static reduced-motion and unsupported-layout fallbacks. On native every digit reel takes the widest digit's advance; where the face's digits are not tabular (Android ignores `tabular-nums` for faces without the feature), the reels are wider than the reading. The reel row is drawn in the readout's own flow (the composed sign, every static part, each reel at the widest digit's advance, and the affixes), so the readout is laid out from what it draws and is wider than the reading by that much; the reading leaves the flow while the reels show and stays, invisible, for assistive technology. Each reel clips only its own column, so no glyph is cut (0.8.0: before, the reels were an overlay on the reading, so a box kept the reading's width and the reels drew past it, as `+100.00%` did over ` on margin` on Android). Where the reading is as wide as the reels, as on iOS, nothing changes. Percent uses percent points (5 is 5%), with localized percent placement/digits and a single native text readout. Intl options control precision/trailing zeros/sign; percent style is enforced. Unknown/nonfinite values stay —. DOM table caption/column headers/aria-sort and scroll region; RN FlatList labeled-row alternative with stable keys.

State review: rest; keyboard focus/hover (DOM); accepted press and release/cancel; selected/checked where applicable; disabled; busy; inline error/recovery; empty/loading; long translations/large text; reduced motion; sound and haptics disabled. No host action occurs on mere focus. Disabled/busy targets suppress accepted activation. Core has no required feedback backend; the optional provider callback follows the action, honors cancellation and isolates errors.

## Platform mapping and limits

Numbers are display-only IEEE numeric inputs, no decimal arithmetic or hidden parser. Exact financial strings remain host-owned. No heavy DataTable engine; optional virtualization/sorting belongs to host. Native list device performance pending.

## Validation and citation

See `tests/qr-model.test.ts`, `tests/qr-code.dom.test.tsx`, `tests/native/qr-code.test.cjs`, `tests/animated-number-model.test.ts`, `tests/animated-number.dom.test.tsx`, `tests/data.dom.test.tsx`, `tests/native/animated-number.test.cjs`, `tests/native/readout-styles.test.cjs`, and `scripts/pro-data-browser-smoke.mjs`, plus consumer fixtures and milestone evidence. Chromium/WebKit checks cover real per-place motion, interrupted updates, Arabic RTL digits, canonical final output and reduced motion. Android RN 0.83 and iOS RN 0.88 simulator matrices in `evidence/native-number-flow/` verify localized final labels, rapid bursts, large text and static fallbacks. iOS Hermes did not apply `nu-arab` to an English locale tag in the runtime check, so localized reel coverage uses `ar-EG` in LTR instead. `QRCode`'s modules are compared with the `qr` reference encoder for every version, level and mask and decoded by a software reader as drawn (round dots, with and without the arena); the web renderer's SVG is rasterised and decoded in `tests/qr-code.dom.test.tsx`, and `scripts/qr-code-browser-smoke.mjs` decodes screenshots of the web renderer and of the native renderer on react-native-web in Chromium and WebKit, left to right and right to left, with an arena node that is positioned, translucent and rotated. It has not been drawn on iOS or Android, and not scanned from a screen with a phone or a dedicated scanner. VoiceOver/TalkBack speech, physical devices, animation smoothness and exhaustive visual bidi review remain unclaimed. Cite HIG 0.1.0 with this chapter anchor and a commit permalink, not a mutable preview branch. Preserve business behavior behind a host rollback flag during adoption.

## Optional number motion

Number motion is optional for a readout on its own and required inside the swap card: `SwapBlock`, `SwapAmountCard` and the pickers update every changing number through `NumberFlow` (see the SwapBlock live numbers rule in the blocks chapter).

`NumberFlow` lives in the separate `animated-number` entry on both platforms. It moves changed numeric places rather than fading the whole reading or interpolating financial values. The final visible output remains the canonical `Intl.NumberFormat` result used by `NumberReadout`, including the host's `prefix`, `suffix`, locale, options and stale text. Localized digits, grouping and decimal marks, currency tokens, and scientific-notation tokens are preserved; motion never assumes ASCII digits or a decimal point.

The optional `trend` prop controls directional digit motion: `1` always moves upward, `-1` always moves downward, and `0` follows each changed digit’s own increase or decrease. A callback receives `(previousValue, newValue)` and returns one of those three values. When omitted, a finite numeric increase or decrease supplies the direction. This is a presentation hint, not a price signal or a replacement for an explicit semantic tone.

Updates are latest-value-wins: a newer value supersedes pending motion and settles on the newest final reading, including during rapid updates. Both platforms expose one accessible final reading rather than separate characters, and neither adds a live region or announces every tick. Pending visual motion is canceled on replacement and unmount. (A flowing figure, below, adds the newer value to the motion in flight instead of cancelling it, and lands on the same final reading.)

Reduced motion and unknown/non-finite values use the static final reading. A platform that cannot safely measure or lay out individual places also uses the static result. Opaque `formattedValue` remains static unless `animateFormatted` is set. Unsafe mixed-bidi tokenization and unsupported native text layouts may likewise fall back to the intact static reading; this is not a claim of physical-device or RTL certification.

The native animated entry uses the optional Reanimated and Worklets peers. Install SDK-compatible versions when using that entry; the ordinary native `data` entry and static readouts import no animation engine. Example: `import {NumberFlow} from '@bloxwap/hig/react/animated-number'` (or `hig-native/animated-number`), then `<NumberFlow value={price} label="Price" trend={1} prefix="≈ " options={{style:'currency',currency:'USD'}} />`. The gallery manifest contains runnable examples for both renderers.

## NumberFlow

`NumberFlow` is exported from `@bloxwap/hig/react/animated-number` and `@bloxwap/hig/native/animated-number`. Its default motion rolls the digits. Use `motion="slide"` for a short transition.

```tsx
import {NumberFlow, NumberFlowGroup} from '@bloxwap/hig/react/animated-number'; // or @bloxwap/hig/native/animated-number

<NumberFlow value={price} label="Mark price" options={{style: 'currency', currency: 'USD'}} />
<NumberFlow value={seconds % 60} trend={-1} digits={{1: {max: 5}}} options={{minimumIntegerDigits: 2}} />
```

What flowing means, on both platforms:

- **Digits roll through the values between.** A place going from 2 to 7 passes 3, 4, 5 and 6. With a `trend` every place turns that way and wraps (9 to 0 going up is one step); with `trend={0}` each place takes its own short way. `digits` limits a place (`{1:{max:5}}` makes the tens of a seconds counter wrap 5 to 0), and `continuous` turns the places below the highest changed one once all the way round so the figure reads as counting.
- **A new value joins the motion in flight.** Each change adds its own turn to the turns still running instead of cancelling them, so a figure that updates faster than it settles keeps moving at speed and still lands on the latest value.
- **NumberFlow's timing.** Movement takes 500 ms on NumberFlow's settle (`'number-flow'`) and fades take 250 ms ease-out. `duration` sets the movement and makes fades half of it; `spinTiming`, `transformTiming` and `opacityTiming` set each part as `{duration, easing}`. `easing` is `'number-flow'`, `'standard'` (HIG's), `'linear'`, `'ease'`, `'ease-in'`, `'ease-out'`, `'ease-in-out'` or four bezier control points. No part runs longer than 500 ms. The arithmetic for all of this is one module, `@bloxwap/hig/contracts/number-flow`, which both renderers call.
- **`animated={false}`** draws every new value at once, as reduced motion does. Use it for a typed echo and until the first real value arrives. It works for the sliding readout too.
- **One reading.** Assistive technology gets the final formatted reading as one static text, with `label` in front when given. The moving copy is hidden from it and nothing is announced per change. Reduced motion (the provider's `reducedMotion`, else the system setting), an unknown value and a change of locale or format all draw the new reading at once and the next value moves from it; so does a hidden page on web.

Platform differences:

| | Web | Native |
| --- | --- | --- |
| A figure gains or loses a place | Every part slides to its new position (first, last, invert, play), the new place fades in, a copy of the old one fades out, and the digits are clipped at their moving edge so a place passes under the currency sign instead of over it. | The figure changes width at once. A new place rolls up from zero as it fades in; a place that left is removed at once. |
| `NumberFlowGroup` | Figures inside it slide together when one of them changes width. Text between them is not moved; put a unit in `suffix` to move it. | Draws its children and nothing else. |
| At rest | Each part is its own inline box and the figure takes the line height, baseline and (in a monospaced or tabular face) the width the plain reading does; in a proportional face the parts lose the kerning between them, as on native. Nothing is mounted for motion until a value changes. | One glyph per place. A place mounts its strip (eleven glyphs) the first time it turns; the sliding readout mounts twenty glyphs per place up front. |
| While moving | Web Animations on `transform` and `opacity` (and `clip-path` while the width changes), started in the commit that draws the new value: positions are read once before it and once after it, for every figure the commit changes before any of them is touched, so a commit of forty figures costs the layout of one; nothing is read again. No script or layout per frame, and no React render when it lands. A roll or a slide that is alone on its element is a plain animation, which every engine can run off the main thread; one that joins another in flight is additive, and the one it joins becomes additive on the same clock. Chromium keeps additive animations on its main thread, so there each frame of joined motion recalculates the style of the parts that move. A reel starts and lands on the digit's own pixels, in WebKit too. | One Reanimated animation per turning place on the UI thread, changing `transform` (and `opacity` for a new place) only. The frame callback stops when the last turn lands. React commits once for a new value and not at all while it rolls, and that commit draws one text again, the reading: no glyph of a reel, separator or measuring probe. What Intl says about a format (its digits, parts and separator) is asked once and kept. |
| Right to left | The number is drawn left to right inside a right-to-left page, as digits are in every script, with `prefix` and `suffix` on the page's sides. A number that itself contains right-to-left letters or bidi controls (Arabic currency formats, and negative numbers in `ar-EG`) slides instead, so a figure that crosses zero there changes from one motion to the other. | As for the sliding readout: a right-to-left provider or text draws the static reading. |
| Large text | Sizes with the surrounding font. | Reels are measured at the current font scale and re-measured when it changes; `maxFontSizeMultiplier` caps it. |
| A limited place given a digit past its limit | The turn that reaches or leaves that digit goes round all ten glyphs; the place takes its short reel again on the next turn. | The same, and the reel always shows the digit the reading has. |
| Web only | `className` on the root, `willChange` (keeps moving parts on their own layers for a figure that ticks many times a second), and `--hig-number-flow-mask-height` (the fading band above and below a rolling digit, default `0.15em`; `0` cuts hard). | `willChange` is accepted and does nothing. `style`, `tone`, `testID` and `maxFontSizeMultiplier` are native only. |
| Limits | A browser without additive animations (`composite: 'add'`, in every engine since 2023) draws each value at once; one without `linear()` easing rolls on HIG's standard curve. In a proportional face a digit wider than the place it passes through is cut at the place's sides. Slides are measured in screen pixels, so inside an ancestor scaled by a CSS transform they start short or long by that scale, as in the reference. | Measured on two 120 Hz phones (see below). An iPhone 17 Pro rolls forty figures, each given ten values a second, with no animation hitch. A Seeker, a mid-range Android phone, presents 98% of frames on time with ten such figures and 92% with twenty; forty is past it (80%). The reels are not what it runs out of: two hundred moving at once hold 99.5%. Every new value redraws one text, the accessible reading, about 0.3 ms of the main thread on that phone, and each React commit sends every moving reel its transform again. So the ceiling there is values per second, about a hundred across the screen. A screen with more live figures than that should give them values less often. |

Validation: `tests/number-flow-model.test.ts` (the shared arithmetic and the web model), `tests/number-flow.dom.test.tsx`, `tests/native/number-flow.test.cjs`, `tests/number-flow-perf.dom.test.tsx` and `tests/native/number-flow-perf.test.cjs` (what a change costs: layout reads before writes, commits, formatters built and texts drawn again), and `scripts/number-flow-browser-smoke.mjs`, which runs the web motion in Chromium and WebKit: the flowing figure is laid out as the plain reading is, digits roll through the values between, a value arriving in flight does not restart the roll, a reel's first and last glyph sit within half a pixel of the digit React drew, a figure that changes width slides and clips, everything is removed when it lands, reduced motion moves nothing, and Arabic digits roll in a right-to-left page. The native motion's arithmetic, and what it mounts and starts, are tested against a stand-in for Reanimated that runs the real animation objects. On devices it was measured in November 2026, with the fixture's loads mounted in a release build of the trading app on an iPhone 17 Pro (Animation Hitches) and a Seeker (SurfaceFlinger present times, 30 seconds a load): one figure given a value every frame, 99.5% of frames on time on the Seeker and none dropped; ten, twenty and forty figures at ten values a second each, 98.0%, 92.1% and 80.3% there, and no hitch from forty on the iPhone; and, as a floor, two hundred bare reels turning without end, 99.5% driven by worklets and 99.9% by Reanimated's CSS engine. `scripts/perf/number-flow-web.mjs` measures the web motion under load in headless Chromium (forty figures ticking, one figure changed every frame, two hundred mounted), `scripts/perf/number-flow-model.mjs` times the model and formatting both renderers run per value, and `fixtures/native/perf/number-flow.tsx` runs the same loads on a device and logs the frames each thread got.

### Migrating from the product's NumberFlow

Web call sites of the vendored `@number-flow/react`:

| Product prop | HIG |
| --- | --- |
| `value` | `value`. `null`, `undefined`, `NaN` and infinities draw the dash; coerce to `0` first where the product wants a zero. |
| `format` | `options` (any `Intl.NumberFormatOptions`, scientific notation included). |
| `locales` | The provider: `HIGProvider locale`, or `numberFormat.locale` for numbers alone. For an echo pinned to one locale whatever the app language, format the text yourself and pass `formattedValue` with `animateFormatted`. |
| `prefix`, `suffix`, `trend`, `digits`, `animated`, `willChange` | The same names and meanings. |
| `plugins={[continuous]}` | `continuous`. |
| `spinTiming`, `transformTiming`, `opacityTiming` | The same names. `easing` is a named curve or control points, not a CSS string: `'ease-out'` stays, `cubic-bezier(0.22, 1, 0.36, 1)` becomes `[0.22, 1, 0.36, 1]` or `'standard'`, and NumberFlow's default becomes `'number-flow'` (or is left out). |
| `className` | `className`. `--number-flow-mask-height` becomes `--hig-number-flow-mask-height`. There is no shadow root, so `::part()` rules have nothing to match and the padding workaround that used them is not needed. |
| `NumberFlowGroup` | `NumberFlowGroup`. |
| `isolate`, `respectMotionPreference`, `onAnimationsStart`, `onAnimationsFinish`, `nonce`, the element ref, `data-*` and other HTML attributes | Not provided. Reduced motion always follows the provider. Wrap the figure for a test id. |
| `role="img"` with the value as its label | One visually hidden reading; `label` names it. |

Native call sites of `FlowUsd`, `FlowNumber`, `FlowPercent` and `FlowFormatted`:

| Product prop | HIG |
| --- | --- |
| `FlowUsd` `digits`, `signed`, `compact` | `options={{style:'currency', currency:'USD', minimumFractionDigits, maximumFractionDigits, signDisplay, notation}}`. |
| `FlowPercent` | `options={{style:'percent', minimumFractionDigits, maximumFractionDigits, signDisplay}}` and `value / 100`: the port takes percent points, `Intl` a fraction. |
| `FlowNumber` `suffix` | `suffix`. |
| `FlowFormatted` `text`, `value` | `value` with `formattedValue={text}` and `animateFormatted`. |
| `animate` | `animated`. |
| `duration` | `duration` (500 by default; `0` draws at once). |
| `style` | `style` takes typography only (`fontFamily`, `fontSize`, `fontWeight`, `lineHeight`, `letterSpacing`, `textAlign`); colour is `tone`. There is no `className`. |
| `textProps.maxFontSizeMultiplier`, `allowFontScaling={false}` | `maxFontSizeMultiplier` (`1` for no scaling). |
| `textProps.accessibilityLabel` | `label`, read as `label: reading`. |
| `textProps.accessibilityLiveRegion`, `pulse` | Not provided: live figures stay silent and do not flash. |
| `FlowLocaleContext` | The provider's `locale` and `numberFormat`, or `formattedValue` with `animateFormatted` for text the host localizes. |
