# Blocks

Composed patterns for balances, markets, trade review, swapping, picking assets, and documentation.

Includes `SwapPanelBlock`, `FromPickerBlock`, `ToPickerBlock`, `AccountBlock`, `TokenActionBlock`, `LanguageBlock`, `ManagePositionBlock`, `TradeHistoryListBlock`, `TradeHistoryDetailBlock`, `TargetBlock`, `PositionBlock`, `AssetsBlock`, `ProfileBlock`, `RewardBlock`, `SoundHapticsBlock`, `SignalsBlock`, and `NotificationsBlock`, and the `ScreenHeader` they all share.

`MarketRow`, `TradeEntry`, `InstallCommand` and `MarketingHero` are still imported from the blocks entry, but they are single components, not whole screens, so they are documented with their families: `MarketRow` in Financial data, `TradeEntry` in Fields & inputs, and `InstallCommand` and `MarketingHero` in Actions & surfaces.

Issue #26. Entry: `blocks`. Import platform entries from `@bloxwap/hig/react/blocks` or `@bloxwap/hig/native/blocks` according to applicability below. On web, each block also has its own entry, for example `@bloxwap/hig/react/blocks/install-command`, `blocks/market-row` and `blocks/marketing-hero`. These need no Radix peer; `smoke:packed-boundaries` renders and bundles them with no Radix installed (#63). `blocks/swap-panel-block` needs none either. `blocks/trade-entry` and the aggregate `blocks` entry need `@radix-ui/react-dialog` for the confirm step. `blocks/swap-sheet` (not in the aggregate) needs `vaul`. Import `@bloxwap/hig/react/css` once on web; tokens CSS is a separate explicit import.

Blocks were called recipes through 0.5.x. The old import paths, `@bloxwap/hig/react/recipes`, `@bloxwap/hig/react/recipes/<name>` and `@bloxwap/hig/native/recipes`, still resolve to the same modules and are deprecated: move imports to `blocks`. The native one is also a real file, `native/dist/recipes.js`, that re-exports the blocks, so a Jest `moduleNameMapper` that maps `@bloxwap/hig/native/<entry>` to `native/dist/<entry>.js` resolves it. They stay for at least one minor release and 30 days and are removed in the next major release, as the deprecation policy in the release guide requires. Blocks added after 0.5.2, such as `AccountBlock` and `TokenActionBlock`, `LanguageBlock`, exist only under `blocks`.

## API and anatomy

All data and actions are supplied by the host application.

| Block | Key props and behavior |
| --- | --- |
| `SwapPanelBlock` | Send, swap and bridge in one panel. `tokens` (and optional `fromTokens`, `chains`, `hotTokenIds`), the pair as `from` / `to` with `onFromChange` / `onToChange` or uncontrolled with `defaultFrom` / `defaultTo`, `onAmountChange` (From amount in token units), the host quote as `received`, `fee`, `fees` and `quoteLoading`, `slippage` / `onSlippageChange`, `wallet`, `receive`, and `onSubmit(action)`. Details below. |
| `AccountBlock` | An account at a glance: a header, the total with a deposit action, the pinned dollar balance, then every other holding by value. Details below. |
| `TokenActionBlock` | One token and what can be done with it: where it is held, the chains it sits on, and the actions as equal full-width buttons. Details below. |
| `TradeHistoryListBlock` | A history of closed trades: a header, then one row per trade with the asset, its side and leverage, and the net result over its age. Details below. |
| `TradeHistoryDetailBlock` | The full record of one closed trade: the asset, the net result as the headline figure, the trade's figures as rows, and the host's actions. Details below. |
| `LanguageBlock` | Choose the app's language: a header, a search field, and each language as a row with its flag and a check on the one in use. Details below. |
| `ManagePositionBlock` | One open position: margin against notional as a `BarMark`, the liquidation, mark and entry prices as a `BarPnl`, the host's actions as rows, and the position underneath. Details below. |
| `TargetBlock` | A take profit or a stop loss on one position: the target as the headline figure, an info button for how the order fills, the entry and trigger prices on one bar, the unit, quick choices and the confirming action. Details below. |
| `PositionBlock` | The position being opened or edited: a summary of what it costs and where it ends, an optional paper trading switch, and its settings as grouped rows. Details below. |
| `AssetsBlock` | Choose a market: a search field, category capsules, All / Positions / Trend views, then the markets in sections by category, each with its signal disc. Details below. |
| `ProfileBlock` | A person's profile as one screen: the avatar with a status dot, the name, then grouped rows for accounts, history, rewards and settings. Details below. |
| `RewardBlock` | A competition: a prize pool or sweepstakes promotion, a choice of standings, the viewer's own standing, and the ranked list. Details below. |
| `SoundHapticsBlock` | Sound, microphone, haptics and flash settings: one card per channel with a switch, and for a channel that is on its device, input meter and volume steps. Details below. |
| `SignalsBlock` | The signals the viewer receives, in groups with a heading, a small help pill and switches. Details below. |
| `NotificationsBlock` | The notifications the viewer receives: one card per kind with a switch, and a failure under its card. Details below. |
| `FromPickerBlock` | Where assets come from: a connected wallet row (disconnect optional) or Connect wallet with a Generate address switch, above a searchable token list. Details below. |
| `ToPickerBlock` | Where assets go: a destination address field with a scan button, on its own or above a searchable token list with or without the chain filter. Details below. |

Presentation mode uses a grid with logical numeric alignment and no block padding. The host can set matching column widths on each row through `style`/`className`, its compact height and the surrounding keyboard/option semantics. The number face inherits from that row. Slots render host content; keep decorative icons/indicators hidden from assistive technology, or give interactive controls their own names and deliberate keyboard behavior. Presentation rows accept no `onSelect` and emit no action feedback. Tiny prices keep the requested precision; unknown values remain —. Volume formatting and units stay host-owned. The optional `identity` slot belongs to presentation mode; action mode keeps its named HIG button. Hosts that use `toFixed` rounding should pass their already-rounded percent-point value plus explicit `changeOptions` to preserve binary rounding, trailing digits, signs and negative zero. Options use the same contract as `Percent`: the input is percent points, and the rendered style remains percent.

### SwapPanelBlock

`SwapPanelBlock` was called `SwapPanel` through 0.5.x. The old component name, its `SwapPanelProps` type and the import paths `@bloxwap/hig/react/blocks/swap-panel` and `@bloxwap/hig/react/recipes/swap-panel` still work and are deprecated; they are removed in the next major release. The swap pieces around it keep their names: `SwapSheet`, `SwapAmountCard`, `SwapPill`, `SwapKeypad`, `SwapToken` and the other `Swap…` types.

`SwapPanelBlock` is a From card and a To card joined by a flip control, with one action button that names itself from the pair: the same asset is **Send**, different assets on one chain is **Swap**, and different assets across chains is **Bridge** (`swapAction(from, to)` returns the same value). Until the pair and amount are valid the button is disabled and says what is missing: select a token, enter an amount, or insufficient balance.

```tsx
<SwapPanelBlock tokens={catalog} fromTokens={holdings} hotTokenIds={ranked}
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
- **Prices.** `entry` and `exit` draw one `BarPnl` without a card, scaled to the two prices: the stretch between them is filled in the result colour and the two prices read under it. This replaces an Entry row and an Exit row. `priceOptions` formats them; the default is US dollars. Leave either out and there is no bar.
- **Details.** `details=[{label, value, options, prefix, suffix}]` are the other figures, such as size, notional, time held, fees and funding. They are drawn three to a line as a small label over its value, in the order given. A number is formatted with `options` between `prefix` and `suffix` and updates place by place; a string is drawn as given, which suits a duration the host has already formatted.
- **Note.** `note` is a line under the cards for a limit or a delay; `noteTone='warning'` or `'negative'` makes it a tinted capsule.
- **Heading and controls.** `title` puts a heading above the cards and `onBack` a Back control beside it, for a panel that is its own screen or sheet. From Unreleased the heading is the shared `ScreenHeader` on both platforms (the title centred, 17/24 weight 600, in a 44 unit row with Back on its leading edge), like every other block, so a push from another block to a titled panel keeps Back and the title in place; it was a left-aligned 24px (web) or `Heading` (native) title. Native test IDs stay `swap-header` and `swap-back`, with `swap-title` added. `headingId` sets the heading's `id` (web) or `nativeID` (native). `controls={false}` leaves the action button alone at full width, and `actionIcon` puts a decoration before its text.
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

`SwapSheet` presents the panel in a gesture sheet: `@bloxwap/hig/react/blocks/swap-sheet` on web (Vaul) and `@bloxwap/hig/native/swap-sheet` on native (the native `GestureSheet` backend). It takes every `SwapPanelBlock` prop plus `open`, `onOpenChange`, a required accessible `title` and, on web, an optional `trigger`. Views push inside that one sheet, which follows the height of the view on show. Escape and Back pop a pushed view first; from the cards, Escape, the scrim and a downward drag close the sheet, and a reopened sheet starts on the cards. The native `SwapSheet` needs the optional `@gorhom/bottom-sheet` peer and the host's sheet providers, exactly as `GestureSheet` does; on Android the hardware Back button pops a pushed view before it closes the sheet.

```tsx
<SwapSheet title='Swap' open={open} onOpenChange={setOpen} trigger={<Button>Swap</Button>} tokens={catalog} onSubmit={execute}/>
```

### FromPickerBlock and ToPickerBlock

The two pickers are the swap panel's token views as standalone blocks, for a host that picks a source or a destination outside the panel: in its own sheet, a page, or a step of a flow. They carry no sheet or overlay of their own; place them in a `Dialog`, a `GestureSheet` or any container. `SwapPanelBlock` uses the same two blocks for its pushed views.

Both share one token list: `tokens` (a wallet's holdings, a whitelist or a whole catalog), `selected`, `onSelect`, optional `chains`, `hotTokenIds` and `loading`. The search and address fields are the standard rounded HIG inputs. `chainFilter={false}` leaves out the chain filter, for a single chain or a list that should not be narrowed by chain; it is also left out when the tokens are all on one chain.

```tsx
import {FromPickerBlock, ToPickerBlock} from '@bloxwap/hig/react/blocks/pickers';

// Destination address only
<ToPickerBlock address={address} onAddressChange={setAddress} addressPlaceholder={shortWallet} onScan={openScanner}/>
// Address, then the asset, filtered by chain
<ToPickerBlock address={address} onAddressChange={setAddress} onScan={openScanner} tokens={catalog} selected={to} onSelect={setTo}/>
// The same without the chain filter
<ToPickerBlock tokens={catalog} chainFilter={false} selected={to} onSelect={setTo}/>

// No wallet yet: connect, or generate an address to send to
<FromPickerBlock wallet={{connected: false}} onConnect={connect} generateAddress={generating} onGenerateAddressChange={setGenerating} tokens={catalog} onSelect={setFrom}/>
// Connected: holdings, with sign-out
<FromPickerBlock wallet={{connected: true, address}} onDisconnect={disconnect} tokens={holdings} selected={from} onSelect={setFrom}/>
```

| Variant | Props |
| --- | --- |
| `ToPickerBlock`, address only | `address`, `onAddressChange`, optional `addressPlaceholder` and `onScan`; no `tokens` |
| `ToPickerBlock`, with chains | add `tokens` and `onSelect` |
| `ToPickerBlock`, without chains | add `chainFilter={false}` |
| `FromPickerBlock`, not connected | `wallet={{connected:false}}`, `onConnect`, and `generateAddress` / `onGenerateAddressChange` for the switch |
| `FromPickerBlock`, connected | `wallet={{connected:true, address}}`; `onDisconnect` shows the sign-out button, omit it where signing out does not belong |
| `FromPickerBlock`, whitelist | no `wallet`: the token list alone |

- **Generate address** is a switch, not an action: it reports the new value and the user goes on to pick a chain and an asset. The host then shows the address to send to, for example with `WalletAddress`, or `SwapPanelBlock`'s receive view.
- **Scanning** and **connecting** belong to the host: HIG ships no QR scanner and no wallet connection. `onScan` and `onConnect` only report the press.
- **Search** matches the token's name, symbol, chain and `keywords`, so put the contract address in `keywords` to make a pasted address find its token.
- **Keyboard** on web: with focus in the search field, the arrow keys move through the list and Enter selects.
- **No search.** `search={false}` leaves out the search field, for a list of two or three tokens such as a withdraw picker. On web no row is highlighted until the pointer moves over one, because there is no arrow-key cursor; each row is still a button in the tab order.
- **Balances.** A row draws a balance only when it is above zero; `zeroBalances` also draws a known zero, for a list of every asset the account can hold. A token's `unitsSuffix` follows its balance figure (`1.005 HYPE`), and its `detail` replaces the chain on the second line, for a list whose tokens are not told apart by chain; the search still matches the chain.
- **Input attributes.** `searchInputProps` and, on `ToPickerBlock`, `addressInputProps` reach the inputs: on web any `<input>` attribute, including `name`, `autoComplete`, `data-1p-ignore`, `data-lpignore`, `data-form-type`, a mono `className` and `onFocus` / `onBlur`; on native any `TextInput` prop, including `onFocus` / `onBlur`, `textContentType` and `style`. The value and its change handler stay the block's. A host `onKeyDown` on the web search runs first; the list's arrow keys and Enter then run unless it called `preventDefault()`. `searchRef` and `addressRef` give the host the input itself, for example to register it with a bottom sheet's keyboard handling or to focus it.
- **Visible labels.** `searchLabel` and `addressLabel` draw a visible label over the field (a `Field` label, 8 units above it on native and the field gap on web), which then names the field in place of the built-in hidden name. Without them the fields are named by the built-in “Search tokens” and “Recipient”, as before.
- **Selected row and row attributes (Unreleased).** The row of `selected` is marked `aria-current="true"` on web (native already read it as `accessibilityState.selected`), besides its drawn “Selected”. `tokenRowProps={token => props}` gives each token's row host attributes: on web `data-*`, `id`, `title` and `aria-describedby` (type `PickerRowProps`; HIG keeps the row's type, class, state and handlers), on native `testID` (replacing `swap-token-<id>`), `nativeID` and `accessibilityHint`.
- **Inside a host sheet (native).** The list is a bounded `FlatList`. `listComponent` renders the rows through the host's list instead, such as `BottomSheetFlatList` from `@gorhom/bottom-sheet`, so it scrolls inside the sheet and hands drags to it; the host's component receives HIG's bounded `style` and may override it. `SwapHostContext`, now exported from `@bloxwap/hig/native/pickers` and the `blocks` aggregate, does the same for every picker under it, as `SwapSheet` uses it; `listComponent` on the block wins.

### AccountBlock

`AccountBlock` shows one account: a header with Back on the leading edge, the title in the centre and an optional action on the trailing edge; under it the total on the leading edge and the deposit action on the trailing edge; then the holdings as `AssetBalanceRow` capsules 8 units apart. It is available from `@bloxwap/hig/react/blocks/account-block`, `@bloxwap/hig/native/account-block` and the `blocks` aggregates.

```tsx
<AccountBlock assets={holdings} onBack={goBack} onShowAddress={openAddress} onDeposit={openDeposit}
  onAssetSelect={asset => open(asset.id)}/>
```

- **Account address.** `onShowAddress` puts a QR button on the trailing edge of the header, above the deposit action. The host shows the address when it is pressed, for example in a `Dialog` or `Sheet` with `WalletAddress`; the card never holds the address. `headerAction` replaces the QR button with a host control.
- **Assets.** An `AccountAsset` is `{id, name, symbol}` plus optional `icon` (an image URL or a host element), `balance` (token units), `price` (USD per unit) and `value` (dollars). The value shown is `value`, or `balance × price` when both are known, or the unknown dash.
- **Pinned dollar balance.** The asset whose symbol is `pinnedSymbol` (default `USDC`) is always the first row and is always shown: when the account does not hold it, the row reads $0.00. It shows its dollar value alone, because its units are the same figure.
- **Order.** Every other asset follows by dollar value, largest first. Unknown values come last and ties sort by name. The host does not sort. `accountRows(assets, pinnedSymbol)` returns the same order for a host-drawn list.
- **Total.** `balance` is the total in dollars. Without it the card sums the asset values; `null` reads as unknown.
- **Deposit.** `onDeposit` shows the primary action beside the total. `depositLabel` replaces the built-in text, for example with Add funds.
- **Header.** `title` replaces the built-in “Account”. `onBack` shows Back; `headerAction` is the trailing control. The title stays centred with either, both or neither. `stickyHeader` pins it (see [pinned headers](#pinned-headers); native also takes `stickyHeaderBackground` and `scrollComponent`), and `headingId` names its heading.
- **Rows.** `onAssetSelect` makes each row a button that reports its asset. Without it the rows are plain. `selectable: false` on an asset keeps that one row plain.
- **Units.** `units: false` on an asset draws no units line, for a ledger whose units are the same figure as its value. `unitsOptions` formats an asset's units (at most six fraction digits by default) and `unitsSuffix` follows them (` PAPER`). An asset whose value is unknown but whose `balance` is known shows its units as the headline figure, with no second line, in place of the unknown dash. `unknownValue: 'dash'` on the asset keeps the unknown dash over the units instead, for a value that is still loading, such as a price not yet read.
- **Tags.** An asset's `tag` is short muted host text under its figures (`AssetBalanceRow tag`), such as Perp, Spot or Staked, so two rows of the same symbol read apart without changing the symbol line.
- **Order.** `order: 'given'` keeps the rows after the pinned one in the order passed, for a ledger with a fixed order; the default `'value'` sorts them as above. A section's own `order` overrides the block's. `accountRows(assets, pinnedSymbol, {order, pinnedId})` and `accountSectionRows` take the same options.
- **Pin by id.** `pinnedId` pins the asset with that id, for a dollar ledger whose symbol is not unique (two USDC rows); without a match the `pinnedSymbol` match applies as before. A section's own `pinnedId` overrides the block's. A row pinned by symbol shows its value alone; a row pinned by id keeps its own `units` setting.
- **Sections.** `sections=[{id, title, total, assets}]` replaces the flat list with titled groups in the order given, 24 units apart, each a region named by its title with its rows 8 apart under a heading line that carries the group's `total` on the trailing edge (the sum of its asset values when left out; `null` reads as unknown). Within a group the pinned asset leads only when the group holds it (no $0.00 placeholder), then the rest by value. A group with no assets is not drawn. Without `balance` the block total is the sum of the totals of the groups that are drawn, so a group with no assets adds nothing even when it has a `total`; when any drawn group's total is `null`, the block total is unknown too. `onAssetSelect` then also receives the group: `onAssetSelect(asset, section)`. `accountSectionRows` and `accountSectionTotal` return the same order and total for a host-drawn list.

```tsx
<AccountBlock onDeposit={openDeposit} onAssetSelect={(asset, section) => open(section?.id, asset.id)} sections={[
  {id: 'exchange', title: t.exchange, assets: [{id: 'perp', name: t.perp, symbol: 'USDC', value: 500, units: false}]},
  {id: 'wallet', title: t.wallet, assets: walletAssets},
]}/>
```

- **Live numbers.** The total, every section total, every value and every units figure update through `AnimatedNumberReadout`, as in the swap card.
- **Ownership.** The card never reads a wallet, fetches a price or moves funds.

### TokenActionBlock

`TokenActionBlock` is the screen for one token: the same header as `AccountBlock` with the ticker as its title, two `BarMark` bars, then the actions. The bars are read-only, so they are drawn without a card (`surface={false}`) and sit directly on the screen, as in `ManagePositionBlock`. The first bar is titled with the token's `name`, shows the total holding in dollars on its trailing edge, and divides among `assets`, the places the token is held (Staked, Core, Paper). The second is the same bar titled Chains that shows how many chains hold a balance and divides among `chains`. It is available from `@bloxwap/hig/react/blocks/token-action-block`, `@bloxwap/hig/native/token-action-block` and the `blocks` aggregates.

```tsx
<TokenActionBlock symbol="HYPE" name="Hyperliquid" onBack={goBack}
  assets={[{label: 'Staked', value: 320}, {label: 'Core', value: 239}, {label: 'Paper', value: 200}]}
  chains={[{label: 'Base', value: 120}, {label: 'Hyperliquid', value: 639}]}
  actions={[{id: 'send', onSelect: send}, {id: 'receive', onSelect: receive},
            {id: 'stake', onSelect: stake}, {id: 'unstake', onSelect: unstake}]}/>
```

- **Bars.** `assets` and `chains` are `BarMark` elements: `{label, value}` plus optional `tone`, `color`, `detail` and `id`. Use one unit for both, usually dollars. `chainsTitle` replaces the built-in “Chains”. A `detail` can be a live figure (`{value, options, prefix, suffix}`), which moves place by place on both platforms, like the total.
- **Actions only.** Both bars are optional: leave out `chains` to draw the assets bar alone, `assets` to draw the chains bar alone, or both for a card of commands with no breakdown. `name` is needed only with `assets`; the ticker stands in without it.
- **Note.** `note` is a line under the actions, for example why some are missing on a view-only account; `noteTone='warning'` or `'negative'` makes it a tinted capsule, as in `SwapPanelBlock`. It sits 8 units under the actions, or 16 under the bars when there are no actions.
- **Total.** `value` is the holding in dollars. Without it the card sums the asset values; `null` reads as unknown. It updates place by place.
- **Units headline.** For a token with no dollar value, `units` (token units) with `value` left out or `null` takes the total's place on the assets bar, followed by `unitsSuffix` (` BLOX`) and formatted with `unitsOptions` (at most six fraction digits by default). It updates place by place, and an unknown `units` (`null`) reads as the dash. With a dollar `value` the total is shown as before.
- **Chain count.** The chains bar shows the number of chains with a balance above zero.
- **Actions.** Each action is `{id, onSelect}` plus optional `label`, `disabled` and `intent`. The ids `send`, `receive`, `stake` and `unstake` take a built-in translated label; any other id needs `label`. They render in the order given, full width, 8 units apart and 16 below the bars. Leave out the actions a token does not support.
- **Intent.** Actions default to `secondary`, because the card offers equal choices. Set `intent: 'primary'` on at most one, or `'destructive'` for something like a burn.
- **Header.** `onBack` shows Back and `headerAction` is the trailing control, as in `AccountBlock`, with the same `stickyHeader` and `headingId`.
- **Ownership.** The card never reads a wallet or starts a flow. Each action only reports the press; the host opens its send, receive, stake or unstake screen, for example a `SwapPanelBlock`.

### LanguageBlock

`LanguageBlock` is the screen for choosing the app's language: the same header as `AccountBlock`, a search field, then each language as a row. It is available from `@bloxwap/hig/react/blocks/language-block`, `@bloxwap/hig/native/language-block` and the `blocks` aggregates.

```tsx
<LanguageBlock value={locale} onSelect={language => setLocale(language.code)} onBack={goBack}
  languages={[
    {code: 'en', name: 'English', description: 'English', flag: '/flags/us.svg'},
    {code: 'fr', name: 'Français', description: 'French', flag: '/flags/fr.svg'},
  ]}/>
```

- **Languages.** A `LanguageOption` is `{code, name}` plus optional `description` and `flag`. `name` is the language in its own words and `description` is the reader's name for it, shown muted underneath. `flag` is round artwork: an image URL or a host element; without it the row shows the first two letters of the code. Rows keep the host's order.
- **Selection.** `value` is the `code` in use; its row shows a check on the trailing edge. `onSelect` reports the language pressed. The host applies it and navigates.
- **Search.** The field at the top filters by name, description and code, ignoring case and accents, so `francais` finds Français. No match shows the built-in “No results”. On web the arrow keys move through the matches from the field and Enter chooses the highlighted one, or the only one. `search={false}` leaves the field out for a short list. `filterLanguages(languages, query)` returns the same matches.
- **Header.** `title` defaults to the built-in “Language”. `onBack` shows Back and `headerAction` is the trailing control, as in `AccountBlock`, with the same `stickyHeader` and `headingId`. `description` is a muted line under the header.
- **Disabled.** `disabled` dims the rows, marks them unavailable and ignores presses (and Enter from the search field on web), for example while a change is being applied.
- **Accessibility.** The rows are a radio group named by the title; each row is a radio that reads the language's name and description, and carries its `code` as the language of its name.

### ManagePositionBlock

`ManagePositionBlock` is the screen for one open position. Under the shared header it draws a `BarMark` and a `BarPnl`, the host's actions as rows, and the position itself. The two bars are read-only, so they are drawn without a card (`surface={false}`) and sit directly on the screen; only the things a person can press look like surfaces. It is available from `@bloxwap/hig/react/blocks/manage-position-block`, `@bloxwap/hig/native/manage-position-block` and the `blocks` aggregates.

```tsx
<ManagePositionBlock labels={t.position} mode="Demo" side="long"
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
- **Actions.** Each action is `{id, label, onSelect}` plus optional `disabled`. Together they are one `ListGroup`: rows with a chevron that share one rounded container, such as Stop Loss, Take Profit and Close. The host supplies the labels and opens its own flow.
- **Action values.** An action can take a trailing `value` before its chevron: host text, or a live figure `{value, options, prefix, suffix}` that updates place by place. `tone` colours it `positive`, `negative` or `muted` (the default is the muted value colour). Use it for a resting order on the row that manages it, such as a take profit set at $66,000. The row reads its label and value as one button.
- **Position.** `position={{name, icon, leverage, size, pnl, pnlPercent}}` draws the row under the actions: artwork, the name over an arrow for the side with the leverage and size, and profit and loss in dollars over its percent. The arrow and the profit and loss take the positive role for long and gain, and the negative role for short and loss; the arrow's meaning is also read out from `labels.long` or `labels.short`, so colour is never the only signal.
- **Position extras.** All optional, all host text. `badge` draws a small badge after the name, such as a venue. `caption` is one muted line 8 units under the row, for a result that is stale or estimated. `onSelect` with `label` makes the whole row one button, for example to open the market: it is named by `label` followed by what the row shows (View Bitcoin, Bitcoin, Long, 40×, -$0.0247), so the figures are read even with hints turned off, and the caption is its description (native: its hint).
- **Artwork and initials.** `symbol` is the short ticker the disc shows when there is no artwork (`BT`); without it the disc shows the first three letters of the name. An `icon` URL that fails to load falls back to the initials on both platforms. `icon` can also be a function that draws a host element and receives `failed`, for artwork the block cannot watch itself, such as an SVG component: `icon: failed => <MarketIcon symbol='BTC' onError={failed}/>`. Once it is called the disc shows `iconFallback`, a host element, or the initials without one, until the artwork changes.
- **Profit and loss format.** `pnlOptions` is merged over the default format of the dollar figure (signed US dollars, up to four decimals), for example `{maximumFractionDigits: 3}` for a host's own decimal ladder. The provider's `numberFormat` still applies under it.
- **Heading id.** `headingId` is passed to the header, as on `ScreenHeader`.
- **Pinned header.** `stickyHeader` pins the header (see [pinned headers](#pinned-headers)); native also takes `stickyHeaderBackground` and `scrollComponent`.
- **Live numbers.** The share to liquidation, the three prices, the size, the profit and loss and figure values on the actions update through `AnimatedNumberReadout`.
- **Ownership.** The block never reads a position, a price feed or an account, and never places an order.

### TargetBlock

`TargetBlock` sets a take profit or a stop loss on one open position. `kind` chooses which: `take-profit` takes the positive role and `stop-loss` the negative role, for the bar, the trigger price, the selected quick choice and the confirming action. It is available from `@bloxwap/hig/react/blocks/target-block`, `@bloxwap/hig/native/target-block` and the `blocks` aggregates.

```tsx
<TargetBlock kind="take-profit" labels={t.takeProfit} position="BTC · Long 40×" orderType={t.takeLimit}
  note={t.takeLimitNote} entry={64699.5} trigger={quote.trigger}
  unit={unit} onUnitChange={setUnit} value={target} onValueChange={setTarget} presets={[1, 2, 5, 10]}
  onCustom={openEntry} onCancel={goBack} onSubmit={placeOrder} onBack={goBack}/>
```

- **Labels.** The host supplies the trading words through `labels`: `title`, `submit`, `entry`, `trigger`, `custom`, `unit` (the name of the unit control) and `units` (`dollar`, `price`, `percent`). `cancel` defaults to the built-in Cancel. `presets` (Unreleased) names the quick choices, not drawn, and defaults to `title` (web: the `role="group"`'s name; native: each chip's hint).
- **Target.** `value` is the target in the current `unit` and is the headline figure: signed dollars of profit or loss (`2` reads +$2.00, `-0.5` reads -$0.50), a price, or a signed fraction (`0.05` reads +5%). `null` reads as unknown and disables the confirming action.
- **Prices.** One chart replaces a list of label and value rows, and it sits directly on the screen with no card around it. Its title is `position`, host text such as BTC · Long 40×, and its trailing text is `orderType`, such as Take-limit. The bar under them has two points, the entry price and the trigger price, and is a solid fill in the role colour between them, with the trigger edge in the role colour. The two prices read under the bar in price order, with the trigger in the role colour. The mark price is not part of this block: the question it answers is how far the trigger is from entry. `targetLayout({entry, trigger})` returns the same positions for a host-drawn view. `surface` draws it inside a card (fill, padding and radius), the same setting as `BarMark` and `BarPnl`, where it defaults to on.
- **Trigger.** `trigger` is the price the order triggers at. The host derives it from the target, because that needs the position size and the fee model. In the `price` unit it defaults to `value`. Until it is known the bar has no stretch and the trigger reads as the unknown dash.
- **Note.** `note` is one sentence about how the order fills, such as that a take-limit fills only at the target price or better. With `labels.info`, the accessible name of the button, an info button sits on the trailing edge of the header and opens the sentence in a popover under it. Pressing the button again, pressing anywhere else or, on web, Escape closes it. The popover is the block's own, so the web entry needs no Radix peer, and native draws the same popover. Without `labels.info`, or when `headerAction` takes the trailing edge, the sentence is always shown under the headline figure. Leave `note` out and there is no button, as on a stop-market order.
- **Unit.** `units` lists the units offered, all three by default, as a `SegmentedControl`; `onUnitChange` reports the choice. With one unit the control is hidden. The host converts `value` and `presets` when the unit changes. A unit can be `{unit, disabled}` to show it dimmed when it cannot be chosen now, for example Price while the size is zero.
- **Quick choices.** `presets` are values in the current unit, drawn as equal capsules in one row by the public `PresetGroup` ([selection](selection.md#api-and-anatomy)), selected in the kind's colour. Whole dollar amounts drop their cents (+$1, -$0.50), and so do whole prices (Unreleased: `$63,000` even when `priceOptions` fix two fraction digits; a price formatted by significant digits keeps `priceOptions`), on web and native alike. On native each label is one line that shrinks to fit its column (down to 75%) rather than wrapping. The preset equal to `value` is shown selected and exposed as pressed; `onValueChange` reports a press on another preset (Unreleased: a press on the selected one no longer reports it again, and a new choice plays the provider's `selection` feedback instead of `activate`). A preset can be `{value, disabled}` to show it dimmed, for example a stop inside a fee floor; the host explains why. `targetPresets` and `targetUnits` return either list in its object form. `onCustom` adds a Custom row with a chevron above them, and the host opens its own entry, for example a keypad sheet.
- **Custom value.** `customValue` is the value the host's entry set, in the current unit. The Custom row then shows it on its trailing edge in the kind's colour, takes a ring in that colour and is exposed as pressed (native: selected), and no quick choice shows selected. Its accessible name is the label and the value.
- **Money format.** Dollar presets, the custom value and the headline follow the provider's `numberFormat`, so `{currencyDisplay: 'narrowSymbol'}` reads `+1 $` in French. Percentages are not currencies and keep Intl's percent format.
- **Actions.** `onSubmit` is the confirming action, labelled by `labels.submit`, with `busy` and `submitDisabled`. `onCancel` adds Cancel beside it. `onBack` and `headerAction` are the header controls, as in `AccountBlock`. `headerActionBesideInfo` keeps the info button when `headerAction` is given: the info button comes first and the host control sits on the trailing edge, and both header sides widen to 92 units so the title stays centred. Without it `headerAction` replaces the info button, as before. `headingId` is passed to the header.
- **Live numbers.** The headline figure and the three prices update through `AnimatedNumberReadout`.
- **Pinned header.** `stickyHeader` pins the header (see [pinned headers](#pinned-headers)); on native the block becomes its own scroll view and the info popover opens just under the pinned header.
- **Ownership.** The block never reads a position or a price feed and never places an order.

### PositionBlock

`PositionBlock` is the sheet for the position being opened or edited. Under the shared header, with Close on its trailing edge, it shows a summary, an optional paper trading switch, and the settings as grouped rows. It is available from `@bloxwap/hig/react/blocks/position-block`, `@bloxwap/hig/native/position-block` and the `blocks` aggregates.

```tsx
<PositionBlock title={t.position} onClose={close}
  details={[{label: t.notional, value: {value: 400, options: wholeDollars}},
            {label: t.fee, value: {value: 0.53, options: dollars}, tone: 'negative'},
            {label: t.liquidation, value: {value: -0.025, options: percent}, tone: 'negative'}]}
  paperTrade={{label: t.paperTrade, checked: paper, onCheckedChange: setPaper}}
  groups={[[{id: 'size', label: t.size, value: '$10', onSelect: openSize},
            {id: 'leverage', label: t.leverage, value: '40×', onSelect: openLeverage}],
           [{id: 'positions', label: t.positions, value: '2', onSelect: openPositions}]]}/>
```

- **Words.** Every label is host text, because built-in strings carry no trading terms; only Close and Back are built in.
- **Summary.** `details` are label and value lines in the order given. They sit directly on the screen, with no card, on the same text inset as the list rows below. Values use the interface face at one weight, so host text and figures read alike. A value is host text, such as 2% of profit, or a figure `{value, options, prefix, suffix}` that updates place by place through `AnimatedNumberReadout`; a `null` figure reads as unknown. `tone` colours the value `positive`, `negative` or `muted`, for a fee or a liquidation distance. The label always carries the meaning, so colour is never the only signal.
- **Waived values.** `struck` on a detail draws its value struck through, for a charge that does not apply, and is the host word read after it, such as Waived: the line reads Fee, $0.53, Waived. The line is drawn over the value, so it crosses a live figure too. Pair it with `tone: 'muted'`.
- **Label accessory.** `labelAccessory` is host content right after a detail's label, such as a badge with a popover that explains a reduced fee. It may be interactive: on native the line is then no longer one accessibility element; the label reads the line and the accessory follows as its own element.
- **Note.** `note` is one sentence, such as the minimum margin. It is the summary's footnote: small muted text 8 units under the summary, on the same inset.
- **Paper trading.** `paperTrade={{label, checked, onCheckedChange}}` adds a switch as a row of its own above the settings. The host names it and owns its state, and usually changes `details`, `note` and `groups` with it: a paper position might charge a share of profit and offer no stop loss. `disabled` dims it. The whole row is the target: on web a press anywhere on the row that is not on a control presses the switch once, through the switch, so its feedback runs as usual; on native the row is one switch.
- **Paper trading action.** `paperTrade.action={{label, onSelect, intent, busy, disabled}}` draws a full-width button on the row's card, 8 units under the switch and 16 from the card's bottom, for example to collect what a paper position earned. `intent` is `primary` (the default), `secondary` or `destructive`, such as for a second press that confirms. Pressing it does not toggle the switch. It is a HIG `Button`, so on web it draws the provider's `pressDecoration` as a `'button'`, like every block action.
- **Settings.** `groups` is a list of groups, and each group is one `ListGroup`: rows that share a rounded container, 24 units from the next group, the standard gap between list groups. A row is `{id, label}` plus an optional `value` on the trailing edge: host text or a live figure `{value, options, prefix, suffix}` that updates place by place. Any number a row shows can be a figure, not only money: Leverage is `{value: 40, suffix: '×'}` and Positions `{value: 2}`, so they move place by place too. With `onSelect` the whole row is a button with a chevron and the host opens its own view, for example a `TargetBlock` for Stop Loss; without it the row is static. With `onCheckedChange` and `checked` the row is a switch named by its label, toggled from anywhere on the row like the paper trading row; its `value`, if any, sits before the switch. `disabled` dims a row. An empty group is not drawn.
- **Header.** `onClose` shows Close on the trailing edge; `headerAction` takes its place. `onBack` shows Back. `headingId` is passed to the header. `backProps` and `closeProps` pass attributes (web) or Pressable props (native, such as `android_disableSound`) through to Back and Close.
- **Pinned header.** `stickyHeader` pins the header with the shared behaviour described under [pinned headers](#pinned-headers): transparent at rest, filled once content scrolls under it. On native the block then becomes its own scroll view. The header can also be drawn on its own for a host scroller: render `PositionBlockHeader` (the same `title`, `onClose`, `onBack`, `headerAction`, `headingId`, `backProps` and `closeProps`, plus `style`) as a sticky header of that scroller, pass it `scrolled` from `useStickyHeaderScroll()` so it fills the same way, and render `PositionBlock` with `header={false}` under it. The two stack exactly as the whole block does.
- **Ownership.** The card never reads an account, computes a fee or places an order.

### TradeHistoryListBlock

`TradeHistoryListBlock` is the history of closed trades as one screen: the same header as `AccountBlock`, then one capsule row per trade, 8 units apart. It is available from `@bloxwap/hig/react/blocks/trade-history-list-block`, `@bloxwap/hig/native/trade-history-list-block` and the `blocks` aggregates.

```tsx
<TradeHistoryListBlock labels={t.history} trades={closed} onBack={goBack}
  onSelect={trade => open(trade.id)}/>
```

- **Labels.** `labels` supplies `title`, `long`, `short` and `empty`, and optionally `emptyDescription`. They are trading terms, so HIG ships none.
- **Trades.** A `TradeHistoryItem` is `{id, name, side, pnl}` plus optional `icon`, `symbol`, `leverage`, `leverageNote`, `time` and `tag`. `icon` is round artwork: an image URL or a host element; without it the row shows `symbol`, or the first letters of the name. `time` is host-formatted text such as `2d`. `tag` is small muted host text before the age, such as the wallet a trade came from (`0x22…22 · 2d`), and is read after the result. Rows keep the host's order; the host sorts and pages them.
- **Side.** Under the name an arrow points up for a long and down for a short, followed by the leverage (`20×`), in the market `up` role for a long and the `down` role for a short, the same roles `TradeHistoryDetailBlock` uses. They default to `buy` and `sell`; a host whose market convention differs sets `HIGProvider marketColors` on either platform (see [market direction colours](../foundations/platform.md#market-direction-colours)). Assistive technology reads the host's word for the side. `leverageNote` is a short muted qualifier after the leverage, read with it, for leverage that was not recorded with the trade: `20× current`.
- **Result.** `pnl` is the net profit and loss in dollars, signed, in the `up` role for a gain and the `down` role for a loss; `null` reads as unknown. The default format is four significant digits (`+$1.412`, `+$17.90`, `-$0.6878`); `pnlOptions` changes it on web and native, and the provider's `numberFormat` is merged under it. A trade's own `pnlOptions` wins over the block's, for a host whose decimal ladder depends on the amount, such as more digits under one cent. The figure updates place by place.
- **Selection.** `onSelect` makes each row one button that reports its trade, for example to open `TradeHistoryDetailBlock`, and shows a disclosure chevron. Without it the rows are not interactive.
- **Empty.** With no trades the block shows `labels.empty` under the header, with `labels.emptyDescription` as a muted second line when given. The empty line (and an `error` in its place) keeps 32 units above it and none below, so the block's 16-unit inset is the only space under the text (Unreleased: it also kept 32 below, which left 48 under the text in a sheet).
- **Loading and failure.** `loading` draws four skeleton rows in place of the trades and marks them busy; `loadingLabel` is host text that names and announces them. `error` is host text in place of the rows, in the negative role and announced. The header stays in place in both.
- **Notice and footer.** `notice` is host content under the header and above the rows, such as a partial-history notice or a mode banner. `footer` is host content under the rows, such as paging or a spinner for the next page. Both sit 16 units from their neighbours, the block's gap.
- **Long lists (native).** The block draws every row it is given. For a long history, `renderList` hands the rows to the host's own list: it receives `{trades, renderItem, keyExtractor, ItemSeparatorComponent}`, shaped for `FlatList`, so `renderList={list => <FlatList data={list.trades} {...list} initialNumToRender={10}/>}` mounts only the rows near the screen and keeps the 8 unit gap. By default the header, `notice` and `footer` stay fixed around the list, in the block's own 16 unit inset. Add `listChrome` and the list carries everything around the rows instead: it also receives `ListHeaderComponent` (the header and `notice`, 16 units above the first row), `ListFooterComponent` (the `footer`, 16 under the last) and `contentContainerStyle` (the 16 unit inset), and the block adds no padding of its own, so everything scrolls together, a sheet that sizes itself to its content measures the list alone and needs no offsets of its own, and a notice that appears later is just part of the list. With `listChrome`, spread the whole object; picking only `renderItem` leaves the header out. With `renderList` the block fills its parent (`flex: 1`), so place it in a bounded container such as a sheet body, not inside a `ScrollView`. A sheet library's list (for example a bottom sheet's `FlatList`) works the same way. Loading, an error and the empty state are drawn by the block as usual.
- **Header.** `onBack` shows Back and `headerAction` is the trailing control, as in `AccountBlock`.
- **Pinned header.** `stickyHeader` pins the header (see [pinned headers](#pinned-headers)). On native without `renderList` the block becomes its own scroll view; with `renderList` the header stays above the host's list (with `listChrome`, `ListHeaderComponent` then carries only the notice), and the list gets `onScroll` and `scrollEventThrottle` so the header fills once rows scroll under it.

### TradeHistoryDetailBlock

`TradeHistoryDetailBlock` is the full record of one closed trade. Under the shared header it shows the asset with its side and leverage on one line, the net result as the headline figure with the return on margin under it, one bar from the entry price to the exit price, the trade's other figures as a compact grid, and the host's actions in one row. Nothing above the actions is pressable, so none of it is drawn as a card: it sits directly on the screen. It is available from `@bloxwap/hig/react/blocks/trade-history-detail-block`, `@bloxwap/hig/native/trade-history-detail-block` and the `blocks` aggregates.

```tsx
<TradeHistoryDetailBlock labels={t.trade} name="Amazon" icon={amzn} side="short" leverage={20}
  pnl={1.418} pnlPercent={0.0284}
  entry={267.6} exit={267.18}
  details={[{label: t.size, value: 3.734, suffix: ' AMZN'}, {label: t.notional, value: 999.23, options: usd},
            {label: t.held, value: '38m 20s'}]}
  actions={[{id: 'save', label: t.saveImage, onSelect: saveImage},
            {id: 'share', label: t.share, intent: 'primary', onSelect: share}]}
  onBack={goBack}/>
```

- **Labels.** `labels` supplies `title`, `long`, `short`, `entry` and `exit` (the names of the two prices under the bar), one sentence that receives a formatted figure, `onMargin(percent)`, and `netPnl`. `netPnl` names the figure for assistive technology and is not drawn: on screen the signed figure and the sentence under it carry the meaning. The detail figures and the actions carry their own labels. HIG ships no trading terms.
- **Asset.** One centred line shows a small disc with the artwork (`icon` as an image URL or a host element, else `symbol` or the first letters of the name), the `name`, an arrow and the side word in the market `up` role for long and the `down` role for short, and the `leverage` as `20×`, followed by the muted `leverageNote` when given.
- **Result.** `pnl` is the headline figure, signed, in the `up` role for a gain and the `down` role for a loss; `null` reads as unknown. `pnlOptions` formats it (default: signed US dollars, up to four decimals), and the provider's `numberFormat` is merged under it, so `{currencyDisplay:'narrowSymbol'}` makes French read `+12,50 $`. `pnlPercent` is the return on margin as a fraction and reads inside the host's sentence, for example +2.84% on margin; `percentOptions` formats it (default: a signed percent with two decimals). Leave `pnlPercent` out to hide the line.
- **Details.** `details=[{label, value, options, prefix, suffix, formattedValue}]` draws one row each, in the order given. A number is formatted with `options` between `prefix` and `suffix`, or drawn as the host's `formattedValue`, and moves place by place; a string is drawn as given, which suits a duration the host has already formatted.
- **Note.** `note` is one muted sentence under the details, such as that part of the record is missing.
- **Badge.** `badge` is short host text in a badge beside the title, such as Demo, read as part of the heading after a pause (Trade, Demo). `ScreenHeader` takes the same `badge`.
- **Capture.** `summaryRef` is a ref to the asset line, the headline figure and the return: on web the summary element, on native a `View` drawn around them only when the ref is passed. A host that saves the trade as an image captures that, without the details, actions or Back. The summary has no fill of its own, so an image of it is transparent: `summaryBackground` fills it, `true` with the background role or a colour such as the sheet's (`var(--hig-overlay)` on web, `useColors().overlay` on native).
- **Pinned header.** `stickyHeader` pins the header (see [pinned headers](#pinned-headers)).
- **Actions.** `actions=[{id, label, onSelect, intent, disabled, busy}]` draws the buttons in one row with equal widths, 8 units apart and 16 below the details. `intent` defaults to `secondary`; set `primary` on the one that matters, such as Share.
- **Ownership.** The card never reads trade history, renders an image or opens a share sheet. The host does each of those when an action reports a press.

### RewardBlock

`RewardBlock` is the screen for a trading competition. Under the shared header it shows an optional promotion, an optional choice between standings, the viewer's own standing pinned on a tinted row, and the ranked list. One block covers both a prize pool that fills towards a goal and a sweepstakes with a top prize; the promotion's fields decide which. It is available from `@bloxwap/hig/react/blocks/reward-block`, `@bloxwap/hig/native/reward-block` and the `blocks` aggregates.

```tsx
<RewardBlock title={t.leaderboard} onBack={goBack} headerAction={share} verifiedLabel={t.verified}
  promo={{eyebrow: t.season, rules: {label: t.rules, onSelect: openRules},
          amount: 4037, goal: 250000, caption: goal => t.ofPrizePool(goal),
          headline: t.topTradersSplit, description: t.poolFunding}}
  you={me} entries={standings}/>
```

- **Words.** Every word is host text; only Back is built in.
- **Promotion.** `promo` draws one quiet card: the `eyebrow` in muted small capitals, `rules` as a text link with a chevron on its trailing edge, `amount` as the one large figure in the action colour, the same size as the `SwapPanelBlock` amount and the `TargetBlock` figure, updating place by place, and `caption` as the line under it. `headline` and `description` read as one paragraph: the headline in the text colour, the description continuing it in the muted colour. `action` is a quiet row at the foot of the card, under a hairline, with its label in the muted colour and a chevron on the trailing edge, for example to the draws. It is not a filled button: the card promotes the prize, and the row is a way onward. Leave `promo` out for standings alone.
- **Prize pool.** With `goal`, a thin progress bar filled to `amount / goal` sits under the caption, and a `caption` function receives the formatted goal: `goal => 'of ' + goal + ' prize pool'`. The bar carries the progress on its own; there are no lines under it. `rewardProgress(amount, goal)` returns the same share.
- **Sweepstakes.** Without `goal` there is no bar, and `caption` is a string under the figure, such as top prize.
- **Money.** `amountOptions` formats `amount` and `goal`; the default is whole US dollars.
- **Standings choice.** `tabs={{label, options, value, onValueChange}}` adds a `SegmentedControl`, such as Upcoming draw and Top winners. The host swaps `entries` when it changes.
- **Your standing.** `you` is the viewer's entry, pinned above the list on a tinted row with the name and score in the action colour. An entry in the list with `you: true` gets the same colours in place. `youLabel` names the pinned row for assistive technology, such as Your rank: on web it is a named group, on native it is read before the rank.
- **Status.** `status` is a muted line between the pinned row and the list, announced when it changes, for a message about the standings such as not ranked yet or failed to load.
- **Entries.** An entry is `{id, rank, name, score}` plus optional `avatar` (an image URL or a host element; the name's first letters otherwise), `verified`, `detail` and `scoreOptions`. `detail` is the line under the name such as the volume: host text, or a live figure `{value, options, prefix, suffix}` that updates place by place. The host ranks and pages them. `scoreOptions` formats the scores; the default is a whole number, and an entry's own `scoreOptions` wins, so a prize list can show cents only where a prize has them. Scores update place by place.
- **Verified.** `verified` shows a mark after the name. `verifiedLabel` names it for assistive technology; without it the mark is decorative. `verifiedMark` is host artwork in place of the built-in mark, drawn inside the mark's image role on web and inside the row's one accessible element on native. When the mark is a control, such as a badge that opens an explanation, add `verifiedMarkInteractive`: the mark then stays in the accessibility tree. On web it sits after `verifiedLabel` (read, not drawn) instead of inside an image role. On native the row's reading moves from the whole row to the name, and the mark follows as its own element; the rest of the row is unchanged.
- **Headline.** `promo.headline` is host text, or host elements, for example to accent words in the action colour: `headline: <>Top 100 <Text style={{color: colors.action}}>split the pool.</Text></>` on native, or a `<span>` with the host's own class on web. The block wraps it in the semibold text-coloured run and puts one space and `description` after it, so the host translates the whole sentence and decides where the accent falls; keep any closing punctuation inside the elements.
- **Links (web).** `promo.rules` and `promo.action` take `href`, and `target` such as `_blank`: they then render as real links (`<a>`, with `rel="noopener noreferrer"` for `_blank`) with the same look, and `onSelect`, now optional, is still called on the press. On native they stay buttons; the host opens the URL in `onSelect`.
- **Loading.** `loading` draws five skeleton rows in place of the list and marks the block busy; `loadingLabel` is host text that names and announces them. Pass the promotion's `amount` as `null` while it loads.
- **Paging.** `pagination={{previous, next, label}}` sits under the list: Previous and Next as secondary buttons (`{label, onSelect, disabled}`) with the host's range, such as 1–25, between them, announced when it changes.
- **Sticky header.** `stickyHeader` keeps the header at the top while the standings scroll, with the shared behaviour under [pinned headers](#pinned-headers): transparent at rest, so a glow the host draws behind the title shows through, and filled once the standings scroll under it. On native the block becomes its own scroll view with the header as its sticky first child; `stickyHeaderBackground` is the fill and `scrollComponent` swaps in a sheet library's scroll view. Place it in a bounded container.
- **Host header.** `header={false}` leaves the header out, for a host that pins its own `ScreenHeader` above the block (for example in a sheet's fixed header). The content then starts at the block's top edge, and `title`, `onBack` and `headerAction` are not drawn.
- **Test IDs (native).** `testID` prefixes every test ID inside the block: `<testID>-header`, `<testID>-back`, `<testID>-title`, `<testID>-row-<id>`, `<testID>-you` and so on. Without it they start with `reward`, as before, so two blocks on one screen can be told apart.
- **Columns and footnote.** `listTitle` and `scoreTitle` are small capitals over the names and the scores. `footnote` is a line under the list and the paging.
- **Ownership.** The card never computes a rank, fetches standings, or runs a draw.

### SoundHapticsBlock, SignalsBlock and NotificationsBlock

Three settings screens share one anatomy: the shared header, then settings as cards. Each setting is a switch whose whole row is the target, with the label on the leading edge, an optional description under it, and the track on the trailing edge. The label names the switch and the description describes it. Every word is host text; only Back is built in. They are available from `@bloxwap/hig/react/blocks/sound-haptics-block`, `blocks/signals-block` and `blocks/notifications-block`, the matching `@bloxwap/hig/native/<name>` entries, and the `blocks` aggregates.

```tsx
<SoundHapticsBlock title={t.soundHaptics} onBack={goBack} sections={[
  {id: 'effects', label: t.effects, checked: effects, onCheckedChange: setEffects,
   volume: {label: t.volume, value: volume, onValueChange: setVolume}},
  {id: 'mic', label: t.micInput, checked: mic, onCheckedChange: setMic, source: device.name, level: inputLevel,
   volume: {label: t.micVolume, value: micVolume, onValueChange: setMicVolume}},
  {id: 'haptics', label: t.haptics, checked: haptics, onCheckedChange: setHaptics}]}/>

<SignalsBlock title={t.signals} verifiedLabel={t.verified} onBack={goBack} groups={[
  {id: 'trend', title: t.trend, help: {label: t.howItWorks, onSelect: explainTrend},
   items: [{id: 'trend', label: t.trend, description: t.trendAbout, checked: trend, onCheckedChange: setTrend}]}]}/>

<NotificationsBlock title={t.notifications} onBack={goBack} items={[
  {id: 'push', label: t.push, description: t.pushAbout, checked: push, onCheckedChange: requestPush, error: pushError}]}/>
```

- **SoundHapticsBlock.** `sections` draws one card per channel, 8 units apart: `{id, label, checked, onCheckedChange}` plus optional `description` and `disabled`. A channel that is on can show more under its switch, in this order: `source`, the device in use; `choices`, a radio group for picking the device (`{label, options, value, onValueChange}`, such as Automatic and each microphone); `level`, a live input level from 0 to 1 drawn as a thin meter (`null` is empty); and `volume`, fixed steps as equal capsules with the chosen one in the action colour. They are hidden while the channel is off.
- **Level meter.** The meter is decorative and hidden from assistive technology unless `levelLabel` names it, such as Input level. It is then a meter (web `role="meter"`, native `progressbar`) that reads the level as a percentage when focused.
- **Volume steps.** `volume={{label, value, onValueChange}}` uses fractions: `0.25` reads 25%. `options` replaces the default 25%, 50%, 75% and 100%. `label` is drawn above the steps and names the group. With `volumeWhenOff: 'disabled'` the steps stay in place while the channel is off, unavailable, instead of being hidden. `soundLevel(level)` returns the clamped meter share.
- **Section action.** `action={{label, onSelect, disabled, feedback}}` is a secondary full-width button at the foot of the card, 16 units below the content above it, shown whether the channel is on or off, such as Open Settings when the system refused the microphone. Like any `Button` it plays the provider's press feedback; `feedback: false` keeps it off that one button, for a host that plays its own cue for it, so the host need not take the provider's feedback away from the whole block.
- **SignalsBlock.** `groups` are families of signals: `{id, title, items}` plus `verified`, which shows a mark after the title (`verifiedLabel` names it, `verifiedMark` replaces it with host artwork), and `help={{label, onSelect, ref}}`, a small pill on the trailing edge of the heading (with `verifiedMarkInteractive` a control `verifiedMark` stays in the accessibility tree, as in `RewardBlock`: on native the heading then sits on the title text and the mark follows it), such as How it works. It is the same 32-unit pill the swap card uses, with a full-size touch target around it. `ref` reaches the pill, so the host can return focus to it when its explanation closes (web `focus()`, native `AccessibilityInfo.setAccessibilityFocus`). A group's `items` are switches that share one rounded container, 2 units apart; an item's `hint` and `error` sit inside its card, under the switch.
- **NotificationsBlock.** `items` draws one card per kind of notification. `hint` is a neutral muted line under that card, announced when it changes, for progress or a hint such as Registering this device. `error` is a line in the negative role under it, announced when it appears, for a permission request that failed or timed out; the host keeps the switch off in that case. `action` is a secondary button under the card, 16 units below it, such as Open Settings; it takes `feedback: false` as the section action does. `groups=[{id, title, items}]` draws more cards under `items`, each group under an optional muted heading and 24 units from what is above it; `items` may then be left out.
- **Row geometry.** Separate cards are 8 units apart and a `SignalsBlock` group's cards 2 apart, on both platforms. A setting's switch is a 48-unit target with 12 above and below its text, and its card adds 4 above and below, so a row is 56 units, 79 with a one-line description (each further description line adds 21); a card with content under its switch (a channel's body, a signal's hint or error) has 12 between them and 16 at its foot. Unreleased on native: the switch was 32dp in a card padded 12, so a described row measured about 72dp, a plain row's label sat 4dp high, and the switch's touch target was 32dp tall.
- **Locked and accessories.** An item in either block takes `locked`: the switch shows on at full strength and is read as unavailable (web `aria-disabled`, native disabled state), and presses do nothing. Use it for a signal that is always on. `labelAccessory` is host content after the label, such as a badge. On web it is part of the switch's name, read after the label and a pause (a comma that is read, not drawn: Swing notifications, Genesis), so give artwork a text alternative; on native the switch is read by `label` alone. `labelAccessoryLabel` is host words for the accessory on both platforms, read after the label and a pause (`Feed, New`): native adds them to the switch's name, and web reads them in place of the accessory's content, which is then hidden from assistive technology. The accessory cannot be a control of its own: on web it sits inside the switch's `<label>`, whose content model allows no other labelable control and whose text becomes the switch's name (`aria-labelledby`), and on native the whole row is one accessible switch, so a nested control would not be reachable by a screen reader.
- **Pinned header.** `stickyHeader` on each of the three pins the header (see [pinned headers](#pinned-headers)); on native the block becomes its own scroll view.
- **Description.** `description` on each of the three blocks, and on `LanguageBlock`, is a muted line under the header that explains the screen.
- **State.** Every switch is controlled: the host holds `checked` and decides in `onCheckedChange` whether the change takes, for example after the system permission prompt. `disabled` dims a row and blocks it.
- **Ownership.** The blocks never play a sound, read the microphone, vibrate, request a permission or subscribe to anything.

### AssetsBlock

`AssetsBlock` is the market chooser as one screen, usually in a sheet: the header with an optional Close, a search field, the category capsules (`Filter`), the All / Positions / Trend views (`SegmentedControl`), then the markets in sections by category. Each row shows the market's round icon, its name over its symbol and detail, and an optional signal disc on the trailing edge. It is available from `@bloxwap/hig/react/blocks/assets-block`, `@bloxwap/hig/native/assets-block` and the `blocks` aggregates.

```tsx
<AssetsBlock onClose={close} selectedId={market.id} onSelect={openMarket}
  categories={[{id: 'crypto', label: 'Crypto', status: {label: 'OPEN'}},
               {id: 'commodities', label: 'Commodities', opensAt: session.commodities.opensAt}]}
  assets={[{id: 'BTC', name: 'Bitcoin', symbol: 'BTC', detail: '40×', category: 'crypto', signal: 'watch', position: true},
           {id: 'GOLD', name: 'Gold', symbol: 'GOLD', detail: '20×', category: 'commodities', signal: null}]}/>
```

- **Markets.** Each asset is `{id, name, symbol, category}` plus optional `detail` (short text after the symbol, such as the maximum leverage `40×`), `icon` (an image URL or a host element; without it the disc shows the symbol's first letters), `keywords` for search, and `disabled`. A selectable row is one button named by its name, symbol line and signal.
- **Trailing content (Unreleased).** `trailing` puts host content on the row's trailing edge before the signal disc, such as the live result of the viewer's open position; it never shrinks, and the name and symbol line truncate first. It sits inside the row button and is hidden from assistive technology, so `trailingLabel` gives the words the row reads after its symbol line (`Bitcoin, BTC · 40×, open position, Watch`). On native the content's wrapper takes the test ID `<testID>-<id>-trailing`.
- **Signal.** `signal` is `'watch'` (an eye on a warning tint), `'up'` or `'down'` (a trend arrow on a positive or negative tint), or `null` for an empty disc. Leave it out to draw no disc. The signal is read after the market (built-in `signalWatch`, `signalUp`, `signalDown`), so it is never colour alone.
- **Categories.** `categories` orders the sections and the capsules; a market whose category is not listed is not shown, and an empty section is not drawn. `status={{label, tone}}` puts a badge on the section heading, such as OPEN, read with the heading. `tone` is `positive` by default.
- **Opening countdown.** Bloxwap trades around the clock, so a section never says closed. When the legacy market behind a category is shut, pass `opensAt` (epoch milliseconds or a `Date`) and the badge counts down to it in a neutral tone: “Opens in 2:14:33”, or “Opens in 1d 04:12:09” past a day, ticking each second. The heading reads it in words without seconds (“Commodities, Opens in 2 hours, 14 minutes”), so the accessible name changes at most once a minute and nothing is announced on its own. The countdown takes the place of `status` while it runs; once `opensAt` passes, `status` shows again, so a host can pass both. On web the countdown appears after hydration, so server HTML carries no clock. `formatCountdown` from `@bloxwap/hig/contracts` exports the same formatting. The capsules are left out with one category or `categoryFilter={false}`; on native, `filterScrollComponent` reaches `Filter`'s `scrollComponent`.
- **Views.** All shows every market, Positions those with `position: true`, and Trend those with a signal (not `null`). Each view, the category (`''` is All) and the search query are uncontrolled by default (`defaultView`, `defaultCategory`, `defaultQuery`) or controlled with `view`/`onViewChange`, `category`/`onCategoryChange` and `query`/`onQueryChange`, for example to restore the last choice. The search matches name, symbol and `keywords`, ignoring case and accents. `clearable` (Unreleased) shows `SearchInput`'s clear button while the field holds text; it empties the query (through `onQueryChange` when controlled) and returns focus to the field, named by `messages.clearSearch`, with the native test ID `<testID>-search-clear`. `filterAssets` exports the same filtering for a host that needs the counts.
- **Empty and loading.** With nothing to show, the list reads `noResults` for a search, `noPositions` or `noTrend` for those views, and `noItems` otherwise; `loading` shows the loading text instead. `emptyAction={{label, onPress, testID?}}` (Unreleased) draws a secondary `Button` centred under the empty text, only while the list is empty and not `loading`, such as Browse all markets on an empty Positions or Trend view; `onPress` is the one name on both platforms. Its `testID` is the web `data-testid` and the native test ID (native default `<testID>-empty-action`).
- **Countdown clock (Unreleased).** The countdown's timer runs only while a section with an opening still ahead is on screen under the current category, view and query. `now` gives the host's clock (epoch milliseconds; default `Date.now`), and `paused` freezes the countdown at the text it last showed and stops the timer, for a sheet that is closed or an app in the background, even when the host re-renders after the opening has passed; unpausing reads the clock again.
- **Keyboard (web, Unreleased).** From the search field, ArrowDown and ArrowUp move an active row through the enabled rows of every section (it fills like a hovered row and scrolls into view), and Enter chooses it, or the only row when the arrows have not moved; typing, a new category or a new view resets it. The active row follows its asset's `id`, so a live update that reorders the rows keeps it on the same market, and one that drops that market clears it without Enter falling back to another row. Focus stays in the field, as in `LanguageBlock` and the token pickers, and the active row's name is spoken through a polite live line (the rows are buttons, not options the field could point at with `aria-activedescendant`). Enter during an IME composition only commits the text. `autoFocusSearch` focuses the field on mount, on web only with a hardware pointer (as `LanguageBlock autoFocus`), on native always (`TextInput autoFocus`). Each row carries `data-asset-id` with its asset's `id`, so a host or a test never depends on HIG's class names.
- **Selected row.** The selected row (`selectedId`) fills with the well; an empty signal disc (`signal: null`) on it, or on a pressed, hovered or active row, steps up to the raised fill so it stays visible (web `--hig-fill-raised`, native `useFills().raised`).
- **Category capsules (native).** The capsules scroll the selected one fully into view on mount and whenever the category changes (`Filter` does this for every host), animated unless motion is reduced, through the scroll view's `scrollTo`, so a host `filterScrollComponent` must forward its ref (a sheet library's or Gesture Handler's `ScrollView` does) and pass on `onLayout` and `onScroll`. Right-to-left rows are left where the reader puts them.
- **One line per row.** The name and the symbol line each stay on one line and truncate with an ellipsis (Unreleased), as `MarketRow` does.
- **Header.** `headingId` names the heading (web `id`, native the title's `nativeID`), so a sheet can name itself with `GestureSheet labelledBy`. `stickyHeader` pins the header (title and Close): on web in the nearest scroller, as `ScreenHeader stickyHeader`; on native the block becomes its own scroll view with the header as its sticky first child, transparent at rest and filled with `stickyHeaderBackground` (default the background role) once content scrolls under it, in `scrollComponent` (a sheet library's scroll view) if given; the pinned header's test ID is `<testID>-sticky-header` (`assets-sticky-header`).
- **Ownership.** The block never reads a market, a position or a signal. The host passes the data and opens the market on `onSelect`; on native the host also owns the scrolling, as for the other blocks, unless `stickyHeader` is set.

### ProfileBlock

`ProfileBlock` is a person's profile as one screen, usually in a sheet. A top bar holds the address control on the leading edge and Close on the trailing edge, both as bare icons with no filled circle behind them, like the other block headers; under it sit the avatar with an optional status dot, the name with an optional edit control, and then the sections as `ListGroup`s 24 units apart. It is available from `@bloxwap/hig/react/blocks/profile-block`, `@bloxwap/hig/native/profile-block` and the `blocks` aggregates.

```tsx
<ProfileBlock name="5459····6263" address={account.address} status={{label: 'Demo'}}
  onShowAddress={showAddress} onClose={close} onEditName={editName}
  sections={[
    {id: 'money', rows: [{id: 'accounts', label: 'Accounts', value: '$1,042.09', onSelect: openAccounts},
                         {id: 'history', label: 'History', onSelect: openHistory}]},
    {id: 'settings', title: 'Settings', rows: [
      {id: 'live', label: 'Live Mode', checked: live, onCheckedChange: setLive},
      {id: 'notifications', label: 'Notifications', value: 'Off', onSelect: openNotifications}]},
  ]}/>
```

- **Avatar.** `avatar` is an image URL or a host element. Without it, `address` colours the disc the way wallet avatars are coloured elsewhere; with neither, the disc shows the first letters of the name. It is 144 units across and decorative.
- **Avatar press.** `onAvatarPress` makes the avatar a button, for example to choose a picture, named by `avatarLabel` (the name when left out, and the built-in `changeProfilePicture` message, “Change profile picture”, when there is no name either). The status dot stays outside the button and is still read on its own. On web it takes the host's press decoration as an `'icon-button'`.
- **Status.** `status={{label, tone}}` draws a dot on the avatar's top trailing edge for an account mode or state, such as Demo. `label` is read out, so the dot is never colour alone. `tone` is `warning` by default, or `positive`, `negative` or `info`.
- **Name.** `name` is the heading: a display name or an address the host has shortened. `onEditName` adds the edit control after it. `nameAccessory` puts host content between the name and the edit control, such as a membership badge; it stays in the accessibility tree, so an interactive badge needs its own name.
- **Action.** `action={{label, onSelect}}` draws a full-width button 16 units under the name, such as Log in for a signed-out viewer. It is `primary` by default (`intent: 'secondary'` for a quieter one) and takes `disabled`. With an action, `name` may be left out: the heading is then not drawn.
- **Top bar.** `onShowAddress` shows the address control and `onClose` shows Close. Leave either out to hide it. `stickyHeader` pins the top bar (see [pinned headers](#pinned-headers); native also takes `stickyHeaderBackground` and `scrollComponent`), so Close stays reachable on a long profile. `headingId` sets the `id` (native: `nativeID`) of the name heading.
- **Sections.** Each section is `{id, title, rows}`; a section with no rows is not drawn. A row is `{id, label}` plus optional `leading`, `value`, `tone`, `trailing`, `disabled`, and either `onSelect` (the whole row is a button with a chevron) or `onCheckedChange` with `checked` (the row is a switch, named by its label). The host writes every label and value.
- **Switch rows.** The whole row is the target, as in the settings blocks: a press anywhere on it toggles the switch, and the switch is still the one named control for the keyboard and assistive technology. On web the row is `ListRow`'s switch row and the host's press decoration covers the whole row; native switch rows were already whole-row targets. From Unreleased the web input is named by the row's visible label (`aria-labelledby`) and the switch draws no second, visually hidden copy of the label, so the name is read once instead of two or three times.
- **Row values.** `value` is short text, or a live figure `{value, options, prefix, suffix}`, such as a balance, that updates place by place (`null` reads as unknown). `tone` colours the value `positive`, `warning`, `negative` or `muted`, for a mode or state such as Live or Demo; without it the value keeps the muted value style. A selectable row is still named by its label and value.
- **Footer.** `footer` is host content under the sections, 24 units below them on the block's inset, such as the Terms and Privacy links.

```tsx
<ProfileBlock action={{label: t.logIn, onSelect: openLogin}} onClose={close} sections={sections}
  footer={<nav aria-label={t.legal}><Link href='/terms'>{t.terms}</Link> <Link href='/privacy'>{t.privacy}</Link></nav>}/>
<ProfileBlock name={name} nameAccessory={<GenesisBadge/>} avatar={photo} onAvatarPress={chooseAvatar} avatarLabel={t.chooseAvatar}
  sections={[{id: 'money', rows: [{id: 'accounts', label: t.accounts, value: {value: balance, options: usd}, onSelect: openAccounts},
                                 {id: 'history', label: t.history, value: t.live, tone: 'positive', onSelect: openHistory}]}]}/>
```

- **Ownership.** The block never reads an account, a balance or a setting. Each control only reports the press; the host opens its accounts, history, rewards and settings screens.

### ScreenHeader

`ScreenHeader` is the block header: Back on the leading edge, the title centred, and an optional control on the trailing edge, with the title centred whichever of the two are present. On web every block with a header draws it; on native the settings blocks (`NotificationsBlock`, `SignalsBlock`, `SoundHapticsBlock`) draw it and the other blocks draw a header that matches it. It has its own entry for a host pane that has no block, such as a keypad pushed from `TargetBlock` or a pane between two blocks, so the pane matches the blocks around it: `@bloxwap/hig/react/blocks/screen-header` on web and `@bloxwap/hig/native/screen-header` on native. The native entry also exports `ChevronIcon`, the glyph its Back control draws (it points down; rotate it).

```tsx
import {ScreenHeader} from '@bloxwap/hig/react/blocks/screen-header';
// Native: import {ScreenHeader} from '@bloxwap/hig/native/screen-header';

<ScreenHeader title={t.editTarget} onBack={goBack} action={<IconButton label={t.done} onClick={done}>{check}</IconButton>}/>
```

- **Props.** `title` is host text. `onBack` shows Back, named by the built-in translated `back` message. `action` is the trailing control. `badge` is short host text in a badge beside the title, such as Demo, read as part of the heading after a pause (web: inside the `h2` after a comma that is read, not drawn; native: one header element read as `title, badge`).
- **Unavailable Back.** `backDisabled` draws Back in the faint colour, `disabled` (native: read as disabled) and not pressable, for example while a close is being signed; on web it draws no press decoration.
- **Control props.** `backProps` passes attributes to the Back `<button>` on web, or Pressable props on native, such as `{android_disableSound: true}` when the host plays its own sound. HIG keeps the control's name, role, state and press. Blocks with a Close control take `closeProps` the same way (`PositionBlock`).
- **Hidden title.** `hideTitle` hides the title visually while it stays the accessible heading, with its `headingId`, so a dialog whose own visible title is drawn elsewhere is not read twice. The header keeps its height and both sides keep their places.
- **Heading id.** On web `headingId` sets the `id` of the `h2`, so a `Dialog` or sheet around the pane can name itself with `aria-labelledby` and the title is read once. On native it sets `nativeID` on the title, for `accessibilityLabelledBy` (Android). Without it the heading has no id.
- **Title ref (native).** `titleRef` reaches the heading's accessible element (the title, or the title and badge together), so the host can move accessibility focus to it when the pane opens, for example with `AccessibilityInfo.setAccessibilityFocus(findNodeHandle(ref.current))`.
- **Test IDs (native).** `testID` prefixes `<testID>-header`, `<testID>-back` and `<testID>-title`; without it the header sets none. `SettingHeader`, the name the settings blocks use inside HIG, is the same component.
- **Targets.** On native the Back control and every other header `IconButton` is drawn at 44dp and reaches 48dp on every side through `hitSlop`.

#### Pinned headers

`stickyHeader` is one behaviour shared by `ScreenHeader` and every block that draws it with the prop: `PositionBlock`, `TargetBlock`, `RewardBlock`, `SoundHapticsBlock`, `SignalsBlock`, `NotificationsBlock`, `TradeHistoryListBlock`, `TradeHistoryDetailBlock` and, from Unreleased, `ProfileBlock` (its top bar with the address and Close controls), `ManagePositionBlock`, `AccountBlock`, `TokenActionBlock` and `LanguageBlock`. The header stays at the top while the content scrolls, and it is transparent at rest, so whatever the host draws behind the title, such as a sheet's glow, shows through. It takes its fill only once content has scrolled under it. It does not move when it starts to stick, whatever padding the host puts around the block.

- **No jump (web, Unreleased).** Browsers pin a sticky header inside the scroller's own padding, but any padding between the scroller and the block, such as a pane's 12 or 16px inset, used to scroll away first, so the header slid up by that much before it pinned. The script now measures how far a header that leads its pane rests below the scroller's content edge (the top margins, borders and padding of the boxes between them) and pins it there (`--hig-sticky-inset`, with `data-sticky-inset`), so it pins on the first pixel of scrolling and never moves. Its fill reaches up to the scroller's edge (`--hig-sticky-cover`, drawn by a `::before`), so rows do not show through above it, and the fill appears on the script's `data-scrolled` at the moment it pins. A header that follows other content in its pane scrolls up to the edge before it pins, as before. Measured in Chromium and WebKit with a 12px scroller padding and a 16px pane padding: `AccountBlock`, `ProfileBlock` and `RewardBlock` headers rest at 28px from the scroller's top and stay at 28px at every scroll offset.

- **Web.** The header is `position: sticky` in the nearest scrolling container and fills with `--hig-sticky-header-background`, which defaults to `--hig-background` (`--hig-screen-background` is still read before it). Remap it with `var()` to match the scroller, for example `--hig-sticky-header-background: var(--hig-overlay)` in a sheet. Where the browser has scroll-driven animations, the fill fades in as the header's parent passes the top of the scroller (`view-timeline`, `exit-crossing`), with no script. Everywhere, a small script marks the header `data-scrolled` at the same moment, so browsers without them (Firefox) and reduced motion get the same rule, instantly. When the header's parent is itself the scroller (a pane with `overflow: auto` around the header and rows), a view timeline would follow an outer scroller instead, so the script also marks the header `data-sticky-own` and the scroll-driven fill is left off; the script alone fills it; before the script runs, as in server-rendered markup, the header is transparent.
- **Heading ids.** Every web block with a header takes `headingId` (Unreleased: `AccountBlock`, `TokenActionBlock`, `LanguageBlock`, `RewardBlock`, `SoundHapticsBlock`, `SignalsBlock`, `NotificationsBlock`, the trade history blocks, `SwapPanelBlock` with a `title`, and `ProfileBlock`'s name heading, beside `PositionBlock`, `TargetBlock` and `ManagePositionBlock`), so a host `Dialog` or `GestureSheet` (`labelledBy`) can be named by the block's heading. Native `AccountBlock`, `TokenActionBlock`, `LanguageBlock`, `ProfileBlock` and `SwapPanelBlock` set it as the title's `nativeID`.
- **Native.** A block with `stickyHeader` becomes its own scroll view (`scrollComponent`, React Native's `ScrollView` by default) with the header as its sticky first child; the header is transparent while the scroll offset is at the top and takes `stickyHeaderBackground` (default the background role; in a sheet pass `useColors().overlay`) as soon as it moves. Place it in a bounded container such as a sheet body. For a host's own scroller, `useStickyHeaderScroll()` from the screen-header entry returns `{scrolled, onScroll, scrollEventThrottle}`: spread the last two on the scroller and pass `scrolled` to `ScreenHeader` with `stickyHeader` (or to `PositionBlockHeader`). Give a pinned `ScreenHeader` its inset as `inset` (the blocks' 16), not as `style` padding: React Native moves a sticky child's `style` onto the slot's own wrapper, outside the fill, while `inset` stays inside it.

```tsx
// Native: a host pane with a pinned header
const scroll = useStickyHeaderScroll();
<ScrollView stickyHeaderIndices={[0]} onScroll={scroll.onScroll} scrollEventThrottle={scroll.scrollEventThrottle}>
  <ScreenHeader title={t.history} onBack={goBack} stickyHeader scrolled={scroll.scrolled} stickyHeaderBackground={colors.overlay} inset={16}/>
  {rows}
</ScrollView>
```

### Shared host hooks

Two `HIGProvider` settings reach every block at once. Both are optional and inherited by nested providers; without them nothing a block draws changes.

**Press decoration (web).** iOS Safari gives a haptic only when the finger lands on a native `<input type="checkbox" switch>`, so a host that wants that haptic has to put its own element inside each control it presses. `pressDecoration={({kind, disabled}) => node}` draws the host's node inside these HIG controls: `Button`, the block action buttons, the swap keypad keys and a `ListGroup` heading action (`kind: 'button'`, which includes the small capsules such as a help pill), `IconButton`, the swap flip button and the `SearchInput` clear button (`'icon-button'`), a pressable or linked `ListRow`, a pressable `AssetBalanceRow`, the `WalletAddress` copy button, the block rows that open something, the swap token pickers, destination row and receive address (`'row'`), `Switch`, a switch `ListRow` and the settings switch rows (`'switch'`), each `SegmentedControl` segment (`'segment'`), and the header's Back, Close, address and info controls (`'back'`). `disabled` is true when the control will not act (disabled or busy), so the host can leave its node out. `Checkbox`, `RadioGroup` and `Filter` do not draw it.

```tsx
<HIGProvider pressDecoration={({disabled}) => disabled ? null : <HapticSwitch/>}>…</HIGProvider>
```

- **Layout.** The node sits in one `span.hig-press-decoration` that is the control's last child: absolutely positioned over the whole control (`inset: 0`), clipped to its radius, out of flow so it adds no gap or size, and with `pointer-events: none` on the layer itself while its children take pointer events. A control with no position of its own becomes `position: relative` only while it holds the layer. The layer's `data-kind` names the control kind.
- **Presses.** A press on the host's element reaches the control once, with the control's default action. By the HTML rules a click on an interactive element makes that element the activation target, so the control around it would skip its own: a submit or reset `Button` would not submit, a linked `ListRow` would not navigate, and a switch drawn as a `<label>` would not toggle. The layer therefore stops that click and sends the control one click of its own (to the switch's input for a switch), carrying the pointer position and modifier keys; a disabled control gets nothing. A host `<label for>` inside the layer is left to send its own click to its control first, which the layer then forwards. Native click listeners on the control itself see both clicks; React handlers see one. The host keeps its own element out of the accessibility tree and tab order.
- **Host controls.** `PressDecoration` from `@bloxwap/hig/react/provider` draws the same layer inside a host control: `<PressDecoration kind='button'/>`; pass `input` (a ref to the switch input) for a host switch drawn as a label.
- **Native.** There is no native equivalent: native haptics are called directly.

**Money format.** The blocks format dollars with fixed Intl options, so French reads `12,50 $US` where a host that uses `narrowSymbol` reads `12,50 $`. `numberFormat={{currencyDisplay, useGrouping}}` sets how money reads across the provider, on web and native: `currencyDisplay` is `'symbol'`, `'narrowSymbol'`, `'code'` or `'name'`, and `useGrouping` takes Intl's values, such as `'always'` to group a four-digit Spanish amount. It is merged under every currency format HIG draws: the blocks (totals, rows, prices, presets, legends, captions and their spoken labels), `BarMark`, `BarPnl`, `AssetBalanceRow`, the swap pieces, and `NumberReadout`, `Usd` and `AnimatedNumberReadout`. Options a format sets itself win, so a block's `priceOptions` or a figure's own `options` keep their fields. Only `style: 'currency'` formats change; percentages and plain numbers do not. `presentNumberFormat(options, numberFormat)` from `@bloxwap/hig/contracts` returns the same merge for a host-drawn figure.

```tsx
<HIGProvider locale='fr-FR' numberFormat={{currencyDisplay: 'narrowSymbol'}}>…</HIGProvider>
```

`numberFormat.locale` is the locale numbers are formatted in when it differs from the interface `locale`, for example a Korean or Chinese interface whose figures read with US separators: `<HIGProvider locale='ko-KR' numberFormat={{locale: 'en-US'}}>`. It changes every number HIG formats (separators, digits and the currency's place, money or not), while messages, `lang` and direction keep the interface locale. `useNumberLocale()` from either provider entry returns the locale in effect for a host-drawn figure; an empty value is ignored.

**Live figures.** Every figure a block takes as `{value, options, prefix, suffix}` (`PositionBlock` details and rows, `ManagePositionBlock` action values, `RewardBlock` details, `ProfileBlock` row values, `BarMark` details, `SwapPanelBlock` captions, destination details and detail rows, and `TradeHistoryDetailBlock` details) also takes `formattedValue`: the host's own text for the value, drawn and read in place of Intl's while still moving place by place. Use it where the runtime's Intl does not match the host's number table, for example on Hermes for a locale it formats differently: `{value: 1234.5, formattedValue: '1 234,50 $'}`. Each digit in the text (ASCII or the locale's own) rolls in its place counted from the end; everything else stays as written. `value` must still be the number, because it decides the direction of the movement and an unknown value still reads as the dash. Never parse the text back. `AnimatedNumberReadout` takes the same pair as `formattedValue` with `animateFormatted`; without `animateFormatted` it keeps host text static, as before.

**Native targets.** Every block control drawn under the 48dp comfortable target keeps its drawn size and reaches 48dp through `hitSlop`: the header `IconButton`s (Back, Close, address, info) and `ProfileBlock`'s round top-bar controls and edit control reach 2dp beyond each 44dp edge, and the 32dp `SignalsBlock` help pill reaches 8dp beyond each edge.

## When to use and examples

Do: compose primitives and explicit outcomes in comfortable app or compact Pro context. Don’t: put wallet/network/SDK services in core packages.

## States, interaction and accessibility

Trade confirm remains host-controlled; no demo sends a transaction. Web/native fixtures show market, entry and feedback preference previews.

State review: rest; keyboard focus/hover (DOM); accepted press and release/cancel; selected/checked where applicable; disabled; busy; inline error/recovery; empty/loading; long translations/large text; reduced motion; sound and haptics disabled. No host action occurs on mere focus. Disabled/busy targets suppress accepted activation. Core has no required feedback backend; the optional provider callback follows the action, honors cancellation and isolates errors.

## Platform mapping and limits

M2 supplies visual blocks; M3 adds semantic feedback composition because #26 depends on #25. Product visual fidelity is provisional until inaccessible monorepo audit. Account/positions variants can compose these primitives without service coupling.

## Validation and citation

See `tests/components.dom.test.tsx`, `tests/pro-data.dom.test.tsx`, `tests/pro-data-typecheck.tsx`, `tests/native/components.test.cjs`, consumer fixtures and milestone evidence. Physical hardware, assistive-technology and baseline product comparisons are unperformed unless linked explicitly. Cite HIG 0.1.0 with this chapter anchor and a commit permalink, not a mutable preview branch. Preserve business behavior behind a host rollback flag during adoption.
