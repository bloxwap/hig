# Blocks

Composed patterns for balances, markets, trade review, swapping, picking assets, and documentation.

Includes `MarketRow`, `TradeEntry`, `SwapPanel`, `FromPicker`, `ToPicker`, `AccountCard`, `TokenActionCard`, `ManagePositionCard`, `TradeHistoryCard`, `TradeHistoryDetailCard`, `TargetCard`, `InstallCommand`, and `MarketingHero`.

Issue #26. Entry: `blocks`. Import platform entries from `@bloxwap/hig/react/blocks` or `@bloxwap/hig/native/blocks` according to applicability below. On web, each block also has its own entry, for example `@bloxwap/hig/react/blocks/install-command`, `blocks/code-window`, `blocks/market-row`, `blocks/balance-card`, `blocks/marketing-hero` and `blocks/activity-list`. These need no Radix peer; `smoke:packed-boundaries` renders and bundles them with no Radix installed (#63). `blocks/swap-panel` needs none either. `blocks/trade-entry` and the aggregate `blocks` entry need `@radix-ui/react-dialog` for the confirm step. `blocks/swap-sheet` (not in the aggregate) needs `vaul`. Import `@bloxwap/hig/react/css` once on web; tokens CSS is a separate explicit import.

Blocks were called recipes through 0.5.x. The old import paths, `@bloxwap/hig/react/recipes`, `@bloxwap/hig/react/recipes/<name>` and `@bloxwap/hig/native/recipes`, still resolve to the same modules and are deprecated: move imports to `blocks`. They stay for at least one minor release and 30 days and are removed in the next major release, as the deprecation policy in the release guide requires. Blocks added after 0.5.2, such as `AccountCard` and `TokenActionCard`, exist only under `blocks`.

## API and anatomy

All data and actions are supplied by the host application.

| Block | Key props and behavior |
| --- | --- |
| `TradeEntry` | Raw `amount`, `onAmountChange`, `onConfirm`, `available`, `busy`, and `error`; opens review before submission. |
| `SwapPanel` | Send, swap and bridge in one panel. `tokens` (and optional `fromTokens`, `chains`, `hotTokenIds`), the pair as `from` / `to` with `onFromChange` / `onToChange` or uncontrolled with `defaultFrom` / `defaultTo`, `onAmountChange` (From amount in token units), the host quote as `received`, `fee`, `fees` and `quoteLoading`, `slippage` / `onSlippageChange`, `wallet`, `receive`, and `onSubmit(action)`. Details below. |
| `AccountCard` | An account at a glance: a header, the total with a deposit action, the pinned dollar balance, then every other holding by value. Details below. |
| `TokenActionCard` | One token and what can be done with it: where it is held, the chains it sits on, and the actions as equal full-width buttons. Details below. |
| `TradeHistoryCard` | One closed trade: the asset, side and leverage, the net profit and loss, and a bar from the entry price to the exit price. Details below. |
| `TradeHistoryDetailCard` | The full record of one closed trade: the asset, the net result as the headline figure, the trade's figures as rows, and the host's actions. Details below. |
| `ManagePositionCard` | One open position: margin against notional as a `BarMark`, the liquidation, mark and entry prices as a `BarPnl`, the host's actions as rows, and the position underneath. Details below. |
| `TargetCard` | A take profit or a stop loss on one position: the target as the headline figure, an info button for how the order fills, the entry, mark and trigger prices on one bar, the unit, quick choices and the confirming action. Details below. |
| `FromPicker` | Where assets come from: a connected wallet row (disconnect optional) or Connect wallet with a Generate address switch, above a searchable token list. Details below. |
| `ToPicker` | Where assets go: a destination address field with a scan button, on its own or above a searchable token list with or without the chain filter. Details below. |
| `InstallCommand` | `command` and `onCopy`; accepts an asynchronous host clipboard adapter. The copy result is raised as a toast: on web when `Toaster` from `@bloxwap/hig/react/toast` is mounted, and inline otherwise. The block itself does not load Sonner. |
| `MarketRow` (web) | `symbol`, `name`, `price`, `change`, and `onSelect`; `priceOptions` controls Intl precision and currency/decimal presentation; `changeOptions` controls percent-point precision/signs. `mode='presentation'` lets a host option own selection, with optional `identity`, `icon`, `favorite`, and formatted `volume` slots. |

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

Presentation mode uses a grid with logical numeric alignment and no block padding. The host can set matching column widths on each row through `style`/`className`, its compact height and the surrounding keyboard/option semantics. The number face inherits from that row. Slots render host content; keep decorative icons/indicators hidden from assistive technology, or give interactive controls their own names and deliberate keyboard behavior. Presentation rows accept no `onSelect` and emit no action feedback. Tiny prices keep the requested precision; unknown values remain —. Volume formatting and units stay host-owned. The optional `identity` slot belongs to presentation mode; action mode keeps its named HIG button. Hosts that use `toFixed` rounding should pass their already-rounded percent-point value plus explicit `changeOptions` to preserve binary rounding, trailing digits, signs and negative zero. Options use the same contract as `Percent`: the input is percent points, and the rendered style remains percent.

### SwapPanel

`SwapPanel` is a From card and a To card joined by a flip control, with one action button that names itself from the pair: the same asset is **Send**, different assets on one chain is **Swap**, and different assets across chains is **Bridge** (`swapAction(from, to)` returns the same value). Until the pair and amount are valid the button is disabled and says what is missing: select a token, enter an amount, or insufficient balance.

```tsx
<SwapPanel tokens={catalog} fromTokens={holdings} hotTokenIds={ranked}
  from={from} to={to} onFromChange={setFrom} onToChange={setTo}
  onAmountChange={setUnits} received={quote?.out} fee={quote?.feeUsd} fees={quote?.fees} quoteLoading={loading}
  slippage={slippage} onSlippageChange={setSlippage}
  wallet={{connected, address}} onConnect={connect} onDisconnect={disconnect}
  submitting={executing} onSubmit={action => execute(action, quote)}/>
```

One panel covers each flow with the same cards; the catalog page shows every one as an example state.

| Flow | From card | Bottom card | Props | Example |
| --- | --- | --- | --- | --- |
| Swap | token | another token, same chain | the pair | `swap` |
| Bridge | token | a token on another chain | the pair | `bridge` |
| Send | token | recipient, still to be picked | `destination` with `pending` and `onPress` | `send` |
| Deposit to an account | account, dollars only | the account | `caption` on the token, `lockFrom`, `destination`, `denominationSwitch={false}` | `deposit` |
| Withdraw from an account | account | where it lands, with a limit note | as deposit, plus `note` | `withdraw` |
| Withdraw to another chain | account the user can change | pressable destination | `destination` with `onPress` | `withdraw-chain` |
| Stake | holding, token units | label and value rows | `details`, `denomination='token'` | `stake` |
| Unstake | position, token units | rows, with a warning | `details`, `note`, `noteTone='negative'` | `unstake` |
| Receive | QR code and address | hidden | `receive`, `receiving` | none |

Stake and unstake are one example each: the asset changes only the token data, not the layout.

- **Tokens.** A `SwapToken` is `{id, symbol, name, chain, chainId}` plus optional `icon`, `chainIcon`, `balance` (token units), `price` (USD per unit) and `keywords` (extra search text such as the contract address). `balance` enables Max, Test and the balance check; `price` enables the dollar and unit conversion and the estimate shown before `received` arrives.
- **Amount.** The From amount is typed in dollars or token units; the capsule under it switches denomination and converts the entry. Keys typed while focus is in the panel, a paste, and the keypad all drive it. `onAmountChange` always reports token units. Set `amount` only to resync the entry, for example to `'0'` after a submit. `keypad='auto'` shows the keypad for a coarse pointer on web and always on native; `captureKeyboard` (web) lets digits typed anywhere outside a text field drive the amount.
- **Pushed views.** The token pickers and settings are views pushed inside the panel's own bounds, replacing the cards, each with a Back control; Escape pops one level on web and choosing a token pops to the cards. `view` / `onViewChange` (`'main' | 'from' | 'to' | 'settings' | 'slippage' | 'fees'`) control the stack when the host needs to.
- **Pickers.** Pressing a card pushes its picker: search, chain filter chips, an optional Hot section from `hotTokenIds`, and the token list with arrow-key and Enter selection on web. The From picker shows the connected wallet with a disconnect control, or Connect wallet and the receive toggle; the To picker shows the recipient field when `onRecipientChange` is set, with a scan button when `onScanRecipient` is set. On web ⌘F / Ctrl+F and ⌘K / Ctrl+K open the From and To pickers while the panel is mounted; pass `shortcuts={false}` to leave the browser's own shortcuts alone.
- **Settings.** The menu button pushes the settings view: the default denomination, slippage (presets plus a custom percent) and the fee breakdown one level deeper, then any host rows passed as `settings`.
- **Receive view.** With `receive={{address, qr, onCopy}}` the From picker offers “Receive to an address”. The From card then shows the host's QR node beside the address in fixed-width rows with the leading and trailing characters emphasised, the To amount is hidden, and the action becomes “Send from your wallet” (calls `onConnect`). HIG ships no QR encoder or scanner: the host renders `qr` and implements `onScanRecipient`.
- **Fixed destination.** `destination={{title, subtitle, icon, address, detail, onPress}}` replaces the To token with a place the host already knows: a recipient wallet, a staking pool, a trading account. The To card becomes one compact row with no picker and no amount, the panel is one-way, the action is ready from the From side alone, and `onSubmit` receives `'send'`. `address` shows shortened with the wallet's colour disc; `onPress` makes the card a button with a trailing chevron, for example to change the recipient; `fee` shows on the card when the host passes it.
- **Accounts.** A token with a `caption` (for example `$22.72 available`, or the same as a live figure, `{value:22.72, options:{style:'currency', currency:'USD'}, suffix:' available'}`) is presented as an account: the name over the caption beside one disc, with Max only. A small chevron follows the name while the side can still be changed.
- **Pending destination.** `destination.pending` shows the destination as a placeholder; the action stays disabled and reads “Pick a destination” until the host supplies a real one.
- **Details.** `details=[{label, value, options, prefix, suffix}]` adds label and value rows to the bottom card, under a destination or on their own. On their own they stand in for the To side exactly as a destination does. A number `value` is formatted with `options` between `prefix` and `suffix` and updates place by place; a string is drawn as given.
- **Note.** `note` is a line under the cards for a limit or a delay; `noteTone='warning'` or `'negative'` makes it a tinted capsule.
- **Heading and controls.** `title` puts a heading above the cards and `onBack` a Back control beside it, for a panel that is its own screen or sheet. `controls={false}` leaves the action button alone at full width, and `actionIcon` puts a decoration before its text.
- **Locked sides.** `lockFrom` / `lockTo` keep that side's token fixed: its card looks the same but does not open the picker, has no shortcut, and reset leaves the token in place.
- **Action label.** `actionLabel` names the action once it is ready, in place of Send, Swap or Bridge: Stake, Deposit, Unstake. The host supplies the translated text. The prompts before it is ready (select a token, enter an amount, insufficient balance) do not change.
- **Host-held action.** `actionDisabled` holds the action for a reason only the host knows (below a minimum, no quote yet, a closed market), and `actionStatus` is what it then says. The panel's own prompts still come first. `actionIntent='destructive'` is for an action that cannot be undone, such as a burn.
- **Amount limits.** A token's `decimals` caps how many decimal places can be typed in token units (dollars always stop at two). `limitToBalance` refuses a key that would take the amount past the From balance, where the default lets it through and says Insufficient.
- **Artwork.** A token's `icon` and `chainIcon` and a destination's `icon` take an image URL or the host's own element, which fills the disc.
- **Host content.** `banner` sits above the From card (a pending transfer) and `footer` under the action (recent activity).
- **Starting amount.** A mounted `amount` (token units) seeds the entry in the default denomination.
- **Fixed denomination.** `denominationSwitch={false}` removes the conversion capsule under each amount and the denomination setting, and keeps both amounts in `denomination` (dollars by default). Use it when the host only has one of the two, for example dollars with no token price.
- **One way.** `oneWay` is for flows that only run top to bottom, such as a deposit: the control between the cards becomes a decorative down arrow instead of the flip button, and the pair cannot be exchanged.
- **Live numbers (required).** Every number in the swap card that can change while the card is on screen updates through `AnimatedNumberReadout`: only the places that changed move, and the text is never swapped in one step. This covers the entered and received amounts, the conversion capsule, the From balance, the fee and slippage on the To card, an account caption, the destination detail, detail rows, the settings rows and fee breakdown, and the balances in the token pickers. The panel does this itself for everything it formats. For text the host writes, pass the figure as a number so the panel can do the same: `details=[{label:'Staked', value:11.0735, suffix:' HYPE'}]`, `caption={{value:234.68, options:{style:'currency', currency:'USD'}, suffix:' available'}}`, `destination.detail={{value:3.1, suffix:'% APR'}}`. A string is still accepted and is drawn as given; use it only for text that does not change, such as a tier name. A value that is loading or unknown shows `…` or `—` and does not roll in from zero. Reduced motion updates the same numbers without movement, and the accessible reading is always the final value. Host-drawn parts of the card follow the rule too: `SwapNumber` (web, from the swap panel entry) or `AnimatedNumberReadout` for a `SwapAmountCard` `meta` or `conversion`, and for custom settings rows. On native the swap panel and pickers entries therefore need the optional Reanimated and Worklets peers of the `animated-number` entry.
- **Ownership.** The panel never fetches a quote, reads a wallet or submits a transaction. `onSubmit` is called once per accepted press and not while `submitting`.

`SwapAmountCard`, from the same web entry, is the From card on its own for a host that enters one amount without a pair, such as a position size. It draws the asset (`name`, `symbol`, `icon` as a URL or a host-drawn node, optional `chainIcon` and `context` line), capsule `actions` such as Max (use `SwapPill`), a `meta` line such as the balance, and the entered `value` with `prefix`, `suffix`, `fractionDigits` and `trailingDot`. `conversion` puts a capsule under the amount, and `onSelect` with `selectLabel` makes the slot choose the asset. The host owns the entry and the keypad; `SwapKeypad` is exported beside it.

```tsx
<SwapAmountCard name="USD Coin" symbol="USDC" context="Hyperliquid" value={Number(entry)} prefix="$"
  fractionDigits={typedDecimals} trailingDot={entry.endsWith(".")} amountLabel="Size"
  actions={<SwapPill onClick={useMax}>Max</SwapPill>} meta="1,000 USDC" />
```

`SwapSheet` presents the panel in a gesture sheet: `@bloxwap/hig/react/blocks/swap-sheet` on web (Vaul) and `@bloxwap/hig/native/swap-sheet` on native (the native `GestureSheet` backend). It takes every `SwapPanel` prop plus `open`, `onOpenChange`, a required accessible `title` and, on web, an optional `trigger`. Views push inside that one sheet, which follows the height of the view on show. Escape and Back pop a pushed view first; from the cards, Escape, the scrim and a downward drag close the sheet, and a reopened sheet starts on the cards. The native `SwapSheet` needs the optional `@gorhom/bottom-sheet` peer and the host's sheet providers, exactly as `GestureSheet` does; on Android the hardware Back button pops a pushed view before it closes the sheet.

```tsx
<SwapSheet title='Swap' open={open} onOpenChange={setOpen} trigger={<Button>Swap</Button>} tokens={catalog} onSubmit={execute}/>
```

### FromPicker and ToPicker

The two pickers are the swap panel's token views as standalone blocks, for a host that picks a source or a destination outside the panel: in its own sheet, a page, or a step of a flow. They carry no sheet or overlay of their own; place them in a `Dialog`, a `GestureSheet` or any container. `SwapPanel` uses the same two blocks for its pushed views.

Both share one token list: `tokens` (a wallet's holdings, a whitelist or a whole catalog), `selected`, `onSelect`, optional `chains`, `hotTokenIds` and `loading`. The search and address fields are the standard rounded HIG inputs. `chainFilter={false}` leaves out the chain filter, for a single chain or a list that should not be narrowed by chain; it is also left out when the tokens are all on one chain.

```tsx
import {FromPicker, ToPicker} from '@bloxwap/hig/react/blocks/pickers';

// Destination address only
<ToPicker address={address} onAddressChange={setAddress} addressPlaceholder={shortWallet} onScan={openScanner}/>
// Address, then the asset, filtered by chain
<ToPicker address={address} onAddressChange={setAddress} onScan={openScanner} tokens={catalog} selected={to} onSelect={setTo}/>
// The same without the chain filter
<ToPicker tokens={catalog} chainFilter={false} selected={to} onSelect={setTo}/>

// No wallet yet: connect, or generate an address to send to
<FromPicker wallet={{connected: false}} onConnect={connect} generateAddress={generating} onGenerateAddressChange={setGenerating} tokens={catalog} onSelect={setFrom}/>
// Connected: holdings, with sign-out
<FromPicker wallet={{connected: true, address}} onDisconnect={disconnect} tokens={holdings} selected={from} onSelect={setFrom}/>
```

| Variant | Props |
| --- | --- |
| `ToPicker`, address only | `address`, `onAddressChange`, optional `addressPlaceholder` and `onScan`; no `tokens` |
| `ToPicker`, with chains | add `tokens` and `onSelect` |
| `ToPicker`, without chains | add `chainFilter={false}` |
| `FromPicker`, not connected | `wallet={{connected:false}}`, `onConnect`, and `generateAddress` / `onGenerateAddressChange` for the switch |
| `FromPicker`, connected | `wallet={{connected:true, address}}`; `onDisconnect` shows the sign-out button, omit it where signing out does not belong |
| `FromPicker`, whitelist | no `wallet`: the token list alone |

- **Generate address** is a switch, not an action: it reports the new value and the user goes on to pick a chain and an asset. The host then shows the address to send to, for example with `WalletAddress`, or `SwapPanel`'s receive view.
- **Scanning** and **connecting** belong to the host: HIG ships no QR scanner and no wallet connection. `onScan` and `onConnect` only report the press.
- **Search** matches the token's name, symbol, chain and `keywords`, so put the contract address in `keywords` to make a pasted address find its token.
- **Keyboard** on web: with focus in the search field, the arrow keys move through the list and Enter selects.

### AccountCard

`AccountCard` shows one account: a header with Back on the leading edge, the title in the centre and an optional action on the trailing edge; under it the total on the leading edge and the deposit action on the trailing edge; then the holdings as `AssetBalanceRow` capsules 8 units apart. It is available from `@bloxwap/hig/react/blocks/account-card`, `@bloxwap/hig/native/account-card` and the `blocks` aggregates.

```tsx
<AccountCard assets={holdings} onBack={goBack} onShowAddress={openAddress} onDeposit={openDeposit}
  onAssetSelect={asset => open(asset.id)}/>
```

- **Account address.** `onShowAddress` puts a QR button on the trailing edge of the header, above the deposit action. The host shows the address when it is pressed, for example in a `Dialog` or `Sheet` with `WalletAddress`; the card never holds the address. `headerAction` replaces the QR button with a host control.
- **Assets.** An `AccountAsset` is `{id, name, symbol}` plus optional `icon` (an image URL or a host element), `balance` (token units), `price` (USD per unit) and `value` (dollars). The value shown is `value`, or `balance × price` when both are known, or the unknown dash.
- **Pinned dollar balance.** The asset whose symbol is `pinnedSymbol` (default `USDC`) is always the first row and is always shown: when the account does not hold it, the row reads $0.00. It shows its dollar value alone, because its units are the same figure.
- **Order.** Every other asset follows by dollar value, largest first. Unknown values come last and ties sort by name. The host does not sort. `accountRows(assets, pinnedSymbol)` returns the same order for a host-drawn list.
- **Total.** `balance` is the total in dollars. Without it the card sums the asset values; `null` reads as unknown.
- **Deposit.** `onDeposit` shows the primary action beside the total. `depositLabel` replaces the built-in text, for example with Add funds.
- **Header.** `title` replaces the built-in “Account”. `onBack` shows Back; `headerAction` is the trailing control. The title stays centred with either, both or neither.
- **Rows.** `onAssetSelect` makes each row a button that reports its asset. Without it the rows are plain.
- **Live numbers.** The total, every value and every units figure update through `AnimatedNumberReadout`, as in the swap card.
- **Ownership.** The card never reads a wallet, fetches a price or moves funds.

### TokenActionCard

`TokenActionCard` is the screen for one token: the same header as `AccountCard` with the ticker as its title, two `BarMark` cards, then the actions. The first bar is titled with the token's `name`, shows the total holding in dollars on its trailing edge, and divides among `assets`, the places the token is held (Staked, Core, Paper). The second is the same bar titled Chains that shows how many chains hold a balance and divides among `chains`. It is available from `@bloxwap/hig/react/blocks/token-action-card`, `@bloxwap/hig/native/token-action-card` and the `blocks` aggregates.

```tsx
<TokenActionCard symbol="HYPE" name="Hyperliquid" onBack={goBack}
  assets={[{label: 'Staked', value: 320}, {label: 'Core', value: 239}, {label: 'Paper', value: 200}]}
  chains={[{label: 'Base', value: 120}, {label: 'Hyperliquid', value: 639}]}
  actions={[{id: 'send', onSelect: send}, {id: 'receive', onSelect: receive},
            {id: 'stake', onSelect: stake}, {id: 'unstake', onSelect: unstake}]}/>
```

- **Bars.** `assets` and `chains` are `BarMark` elements: `{label, value}` plus optional `tone`, `color`, `detail` and `id`. Use one unit for both, usually dollars. `chainsTitle` replaces the built-in “Chains”.
- **Total.** `value` is the holding in dollars. Without it the card sums the asset values; `null` reads as unknown. It updates place by place.
- **Chain count.** The chains bar shows the number of chains with a balance above zero.
- **Actions.** Each action is `{id, onSelect}` plus optional `label`, `disabled` and `intent`. The ids `send`, `receive`, `stake` and `unstake` take a built-in translated label; any other id needs `label`. They render in the order given, full width, 8 units apart and 16 below the bars. Leave out the actions a token does not support.
- **Intent.** Actions default to `secondary`, because the card offers equal choices. Set `intent: 'primary'` on at most one, or `'destructive'` for something like a burn.
- **Header.** `onBack` shows Back and `headerAction` is the trailing control, as in `AccountCard`.
- **Ownership.** The card never reads a wallet or starts a flow. Each action only reports the press; the host opens its send, receive, stake or unstake screen, for example a `SwapPanel`.

### ManagePositionCard

`ManagePositionCard` is the screen for one open position. Under the shared header it draws a `BarMark` and a `BarPnl`, the host's actions as rows, and the position itself. The two bars are read-only, so they are drawn without a card (`surface={false}`) and sit directly on the screen; only the things a person can press look like surfaces. It is available from `@bloxwap/hig/react/blocks/manage-position-card`, `@bloxwap/hig/native/manage-position-card` and the `blocks` aggregates.

```tsx
<ManagePositionCard labels={t.position} mode="Demo" side="long"
  entry={64700} mark={64696} liquidation={63082} margin={10} notional={399.98}
  actions={[{id: 'stop-loss', label: t.stopLoss, onSelect: openStopLoss},
            {id: 'take-profit', label: t.takeProfit, onSelect: openTakeProfit},
            {id: 'close', label: t.close, onSelect: openClose}]}
  position={{name: 'Bitcoin', icon: btc, leverage: 40, size: 0.006182, pnl: -0.0247, pnlPercent: -0.0025}}
  onBack={goBack}/>
```

- **Labels.** Every word in this block is a trading term, so the host supplies all of them through `labels`: `title`, `margin`, `notional`, `liquidation`, `mark`, `entry`, `long`, `short`, and one sentence that receives a formatted figure, `toLiquidation(percent)`. HIG ships no default text here, in keeping with the rule that built-in strings contain no glossary term.
- **Margin bar.** The first element is a `BarMark` titled with the margin mode from `mode` (Demo, Cross, Isolated), or the margin label without one, and reads the share left before liquidation on its trailing edge, for example 99.8% to liquidation. Its bar is the margin in the info role against the rest of the notional in the positive role, so a 40× position shows a one-fortieth sliver of margin. The legend names both with their dollar amounts.
- **Price bar.** The second element is a `BarPnl` (see the financial data chapter): one bar that places the liquidation, mark and entry prices, coloured by whether the position is in profit or loss, with the three prices under it in price order. It takes its three labels from `labels.liquidation`, `labels.mark` and `labels.entry`. `positionCorridor({side, entry, mark, liquidation})` still returns the share left before liquidation that the first element shows. In profit the bar and the mark price take the positive role and the first element reads 100% to liquidation; the catalog's `profit` example shows it.
- **Prices.** The three prices are drawn compact, with no extra zeros: `$64,700`, `$142.96`, `$0.4821`. `priceOptions` changes the format, for example to another currency.
- **Actions.** Each action is `{id, label, onSelect}` plus optional `disabled`, drawn as a full-width row with a chevron, 8 units apart: Stop Loss, Take Profit, Close. The host supplies the labels and opens its own flow.
- **Position.** `position={{name, icon, leverage, size, pnl, pnlPercent}}` draws the row under the actions: artwork, the name over an arrow for the side with the leverage and size, and profit and loss in dollars over its percent. The arrow and the profit and loss take the positive role for long and gain, and the negative role for short and loss; the arrow's meaning is also read out from `labels.long` or `labels.short`, so colour is never the only signal.
- **Live numbers.** The share to liquidation, the three prices, the size and the profit and loss update through `AnimatedNumberReadout`.
- **Ownership.** The block never reads a position, a price feed or an account, and never places an order.

### TargetCard

`TargetCard` sets a take profit or a stop loss on one open position. `kind` chooses which: `take-profit` takes the positive role and `stop-loss` the negative role, for the bar, the trigger price, the selected quick choice and the confirming action. It is available from `@bloxwap/hig/react/blocks/target-card`, `@bloxwap/hig/native/target-card` and the `blocks` aggregates.

```tsx
<TargetCard kind="take-profit" labels={t.takeProfit} position="BTC · Long 40×" orderType={t.takeLimit}
  note={t.takeLimitNote} entry={64699.5} mark={mark} trigger={quote.trigger}
  unit={unit} onUnitChange={setUnit} value={target} onValueChange={setTarget} presets={[1, 2, 5, 10]}
  onCustom={openEntry} onCancel={goBack} onSubmit={placeOrder} onBack={goBack}/>
```

- **Labels.** The host supplies the trading words through `labels`: `title`, `submit`, `entry`, `mark`, `trigger`, `custom`, `unit` (the name of the unit control) and `units` (`dollar`, `price`, `percent`). `cancel` defaults to the built-in Cancel.
- **Target.** `value` is the target in the current `unit` and is the headline figure: signed dollars of profit or loss (`2` reads +$2.00, `-0.5` reads -$0.50), a price, or a signed fraction (`0.05` reads +5%). `null` reads as unknown and disables the confirming action.
- **Prices.** One chart replaces a list of label and value rows, and it sits directly on the screen with no card around it. Its title is `position`, host text such as BTC · Long 40×, and its trailing text is `orderType`, such as Take-limit. The bar under them is a price axis from the lowest to the highest of the entry, mark and trigger prices. The tinted stretch is what the price still has to travel, from the mark to the trigger; its trigger edge takes the role colour and the entry price is a tick. The three prices read under the bar in price order, with the trigger in the role colour. While the mark is unknown the stretch runs from entry to the trigger. `targetLayout({entry, mark, trigger})` returns the same positions for a host-drawn view. `surface` draws it inside a card (fill, padding and radius), the same setting as `BarMark` and `BarPnl`, where it defaults to on.
- **Trigger.** `trigger` is the price the order triggers at. The host derives it from the target, because that needs the position size and the fee model. In the `price` unit it defaults to `value`. Until it is known the bar has no stretch and the trigger reads as the unknown dash.
- **Note.** `note` is one sentence about how the order fills, such as that a take-limit fills only at the target price or better. With `labels.info`, the accessible name of the button, an info button sits on the trailing edge of the header and opens the sentence in a popover under it. Pressing the button again, pressing anywhere else or, on web, Escape closes it. The popover is the block's own, so the web entry needs no Radix peer, and native draws the same popover. Without `labels.info`, or when `headerAction` takes the trailing edge, the sentence is always shown under the headline figure. Leave `note` out and there is no button, as on a stop-market order.
- **Unit.** `units` lists the units offered, all three by default, as a `SegmentedControl`; `onUnitChange` reports the choice. With one unit the control is hidden. The host converts `value` and `presets` when the unit changes.
- **Quick choices.** `presets` are values in the current unit, drawn as equal capsules in one row. Whole dollar amounts drop their cents (+$1, -$0.50). The preset equal to `value` is shown selected and exposed as pressed; `onValueChange` reports a press. `onCustom` adds a Custom row with a chevron above them, and the host opens its own entry, for example a keypad sheet.
- **Actions.** `onSubmit` is the confirming action, labelled by `labels.submit`, with `busy` and `submitDisabled`. `onCancel` adds Cancel beside it. `onBack` and `headerAction` are the header controls, as in `AccountCard`.
- **Live numbers.** The headline figure and the three prices update through `AnimatedNumberReadout`.
- **Ownership.** The block never reads a position or a price feed and never places an order.

### TradeHistoryCard

`TradeHistoryCard` is one closed trade in a history list. It is a `BarPnl` for a finished trade: the title reads the ticker, the side and the leverage (`AMZN · Short 20×`), the trailing edge reads the net profit and loss, and the bar is filled from the entry price to the exit price (`BarPnl` with `fit`), in the positive role for a gain and the negative role for a loss, with the two prices under it in price order. It is available from `@bloxwap/hig/react/blocks/trade-history-card`, `@bloxwap/hig/native/trade-history-card` and the `blocks` aggregates.

```tsx
<TradeHistoryCard labels={t.history} symbol="AMZN" side="short" leverage={20}
  entry={267.6} exit={267.18} pnl={1.418} onSelect={() => open(trade.id)}/>
```

- **Labels.** `labels` supplies `entry`, `exit`, `long` and `short`. They are trading terms, so HIG ships none.
- **Result.** `pnl` is the net profit and loss in dollars, signed, in the positive role for a gain and the negative role for a loss. Leave it out to show the bar alone; `null` reads as unknown. The bar's colour follows the prices and the side, not `pnl`, so a trade that moved the right way but lost to fees shows a positive bar beside a negative figure.
- **Prices.** The two prices are US dollars with cents by default. `priceOptions` changes the format, for example more fraction digits for a low-priced asset or another currency.
- **Selection.** `onSelect` makes the whole card one button, named with the title and the result, for example to open `TradeHistoryDetailCard`. Without it the card is not interactive.
- **Card.** `surface={false}` draws it without a card, as on `BarMark` and `BarPnl`.
- **Lists.** Cards in a list sit 8 units apart. The host orders them and pages them.

### TradeHistoryDetailCard

`TradeHistoryDetailCard` is the full record of one closed trade. Under the shared header it shows the asset with its side and leverage, the net result as the headline figure with the return on margin under it, the trade's figures as label and value rows, and the host's actions in one row. It is available from `@bloxwap/hig/react/blocks/trade-history-detail-card`, `@bloxwap/hig/native/trade-history-detail-card` and the `blocks` aggregates.

```tsx
<TradeHistoryDetailCard labels={t.trade} name="Amazon" icon={amzn} side="short" leverage={20}
  pnl={1.418} pnlPercent={0.0284}
  details={[{label: t.entry, value: 267.6, options: usd}, {label: t.exit, value: 267.18, options: usd},
            {label: t.size, value: 3.734, suffix: ' AMZN'}, {label: t.held, value: '38m 20s'}]}
  actions={[{id: 'save', label: t.saveImage, onSelect: saveImage},
            {id: 'share', label: t.share, intent: 'primary', onSelect: share}]}
  onBack={goBack}/>
```

- **Labels.** `labels` supplies `title`, `netPnl`, `long`, `short` and one sentence that receives a formatted figure, `onMargin(percent)`. The detail rows and the actions carry their own labels. HIG ships no trading terms.
- **Asset.** The row shows the artwork (`icon` as an image URL or a host element, else the first letters of the name), the `name`, an arrow and the side word in the positive role for long and the negative role for short, and the `leverage` as `20×`.
- **Result.** `pnl` is the headline figure, signed, in the positive role for a gain and the negative role for a loss; `null` reads as unknown. `pnlPercent` is the return on margin as a fraction and reads inside the host's sentence, for example +2.84% on margin; leave it out to hide the line.
- **Details.** `details=[{label, value, options, prefix, suffix}]` draws one row each, in the order given. A number is formatted with `options` between `prefix` and `suffix`; a string is drawn as given, which suits a duration the host has already formatted.
- **Actions.** `actions=[{id, label, onSelect, intent, disabled, busy}]` draws the buttons in one row with equal widths, 8 units apart and 16 below the details. `intent` defaults to `secondary`; set `primary` on the one that matters, such as Share.
- **Ownership.** The card never reads trade history, renders an image or opens a share sheet. The host does each of those when an action reports a press.

## When to use and examples

Do: compose primitives and explicit outcomes in comfortable app or compact Pro context. Don’t: put wallet/network/SDK services in core packages.

## States, interaction and accessibility

Native InstallCommand renders code in the provider's `monoFontFamily` (for example the registered `BloxwapMonoRegular`; platform monospace otherwise) and keeps code left-to-right inside RTL roots. Copy failures leave a manual-selection recovery message. Trade confirm remains host-controlled; no demo sends a transaction. Web/native fixtures show market, entry and feedback preference previews.

State review: rest; keyboard focus/hover (DOM); accepted press and release/cancel; selected/checked where applicable; disabled; busy; inline error/recovery; empty/loading; long translations/large text; reduced motion; sound and haptics disabled. No host action occurs on mere focus. Disabled/busy targets suppress accepted activation. Core has no required feedback backend; the optional provider callback follows the action, honors cancellation and isolates errors.

## Platform mapping and limits

M2 supplies visual blocks; M3 adds semantic feedback composition because #26 depends on #25. Product visual fidelity is provisional until inaccessible monorepo audit. Account/positions variants can compose these primitives without service coupling.

## Validation and citation

See `tests/components.dom.test.tsx`, `tests/pro-data.dom.test.tsx`, `tests/pro-data-typecheck.tsx`, `tests/native/components.test.cjs`, consumer fixtures and milestone evidence. Physical hardware, assistive-technology and baseline product comparisons are unperformed unless linked explicitly. Cite HIG 0.1.0 with this chapter anchor and a commit permalink, not a mutable preview branch. Preserve business behavior behind a host rollback flag during adoption.
