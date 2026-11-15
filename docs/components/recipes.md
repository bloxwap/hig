# Recipes

Composed patterns for balances, markets, trade review, swapping, picking assets, and documentation.

Includes `MarketRow`, `BalanceCard`, `TradeEntry`, `SwapPanel`, `FromPicker`, `ToPicker`, `ActivityList`, `InstallCommand`, `CodeWindow`, and `MarketingHero`.

Issue #26. Entry: `recipes`. Import platform entries from `@bloxwap/hig/react/recipes` or `@bloxwap/hig/native/recipes` according to applicability below. On web, each recipe also has its own entry, for example `@bloxwap/hig/react/recipes/install-command`, `recipes/code-window`, `recipes/market-row`, `recipes/balance-card`, `recipes/marketing-hero` and `recipes/activity-list`. These need no Radix peer; `smoke:packed-boundaries` renders and bundles them with no Radix installed (#63). `recipes/swap-panel` needs none either. `recipes/trade-entry` and the aggregate `recipes` entry need `@radix-ui/react-dialog` for the confirm step. `recipes/swap-sheet` (not in the aggregate) needs `vaul`. Import `@bloxwap/hig/react/css` once on web; tokens CSS is a separate explicit import.

## API and anatomy

All data and actions are supplied by the host application.

| Recipe | Key props and behavior |
| --- | --- |
| `TradeEntry` | Raw `amount`, `onAmountChange`, `onConfirm`, `available`, `busy`, and `error`; opens review before submission. |
| `SwapPanel` | Send, swap and bridge in one panel. `tokens` (and optional `fromTokens`, `chains`, `hotTokenIds`), the pair as `from` / `to` with `onFromChange` / `onToChange` or uncontrolled with `defaultFrom` / `defaultTo`, `onAmountChange` (From amount in token units), the host quote as `received`, `fee`, `fees` and `quoteLoading`, `slippage` / `onSlippageChange`, `wallet`, `receive`, and `onSubmit(action)`. Details below. |
| `FromPicker` | Where assets come from: a connected wallet row (disconnect optional) or Connect wallet with a Generate address switch, above a searchable token list. Details below. |
| `ToPicker` | Where assets go: a destination address field with a scan button, on its own or above a searchable token list with or without the chain filter. Details below. |
| `InstallCommand` | `command` and `onCopy`; accepts an asynchronous host clipboard adapter. The copy result is raised as a toast: on web when `Toaster` from `@bloxwap/hig/react/toast` is mounted, and inline otherwise. The recipe itself does not load Sonner. |
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

`SwapSheet` presents the panel in a gesture sheet: `@bloxwap/hig/react/recipes/swap-sheet` on web (Vaul) and `@bloxwap/hig/native/swap-sheet` on native (the native `GestureSheet` backend). It takes every `SwapPanel` prop plus `open`, `onOpenChange`, a required accessible `title` and, on web, an optional `trigger`. Views push inside that one sheet, which follows the height of the view on show. Escape and Back pop a pushed view first; from the cards, Escape, the scrim and a downward drag close the sheet, and a reopened sheet starts on the cards. The native `SwapSheet` needs the optional `@gorhom/bottom-sheet` peer and the host's sheet providers, exactly as `GestureSheet` does; on Android the hardware Back button pops a pushed view before it closes the sheet.

```tsx
<SwapSheet title='Swap' open={open} onOpenChange={setOpen} trigger={<Button>Swap</Button>} tokens={catalog} onSubmit={execute}/>
```

### FromPicker and ToPicker

The two pickers are the swap panel's token views as standalone recipes, for a host that picks a source or a destination outside the panel: in its own sheet, a page, or a step of a flow. They carry no sheet or overlay of their own; place them in a `Dialog`, a `GestureSheet` or any container. `SwapPanel` uses the same two recipes for its pushed views.

Both share one token list: `tokens` (a wallet's holdings, a whitelist or a whole catalog), `selected`, `onSelect`, optional `chains`, `hotTokenIds` and `loading`. The search and address fields are the standard rounded HIG inputs. `chainFilter={false}` leaves out the chain filter, for a single chain or a list that should not be narrowed by chain; it is also left out when the tokens are all on one chain.

```tsx
import {FromPicker, ToPicker} from '@bloxwap/hig/react/recipes/pickers';

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

## When to use and examples

Do: compose primitives and explicit outcomes in comfortable app or compact Pro context. Don’t: put wallet/network/SDK services in core packages.

## States, interaction and accessibility

Native CodeWindow and InstallCommand render code in the provider's `monoFontFamily` (for example the registered `BloxwapMonoRegular`; platform monospace otherwise) and keep code left-to-right inside RTL roots. Copy failures leave a manual-selection recovery message. Trade confirm remains host-controlled; no demo sends a transaction. Web/native fixtures show balance, market, entry and feedback preference previews.

State review: rest; keyboard focus/hover (DOM); accepted press and release/cancel; selected/checked where applicable; disabled; busy; inline error/recovery; empty/loading; long translations/large text; reduced motion; sound and haptics disabled. No host action occurs on mere focus. Disabled/busy targets suppress accepted activation. Core has no required feedback backend; the optional provider callback follows the action, honors cancellation and isolates errors.

## Platform mapping and limits

M2 supplies visual recipes; M3 adds semantic feedback composition because #26 depends on #25. Product visual fidelity is provisional until inaccessible monorepo audit. Account/positions variants can compose these primitives without service coupling.

## Validation and citation

See `tests/components.dom.test.tsx`, `tests/pro-data.dom.test.tsx`, `tests/pro-data-typecheck.tsx`, `tests/native/components.test.cjs`, consumer fixtures and milestone evidence. Physical hardware, assistive-technology and baseline product comparisons are unperformed unless linked explicitly. Cite HIG 0.1.0 with this chapter anchor and a commit permalink, not a mutable preview branch. Preserve business behavior behind a host rollback flag during adoption.
