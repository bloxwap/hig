# Trading glossary · HIG 0.1.0

Issue #46. Locked before any locale translation. Machine-readable source: `docs/foundations/glossary.json` (also exported as `/hig/glossary.json`). Formatting rules: [localization guide](localization.md).

Translation agents **must** consume the JSON. The rendered page is a view of that source. Do not invent terms, back-port product UI copy, or fill pending locales.

## Locales

| Locale | Status | Role |
| --- | --- | --- |
| `en-US` | approved | Canonical English. HIG defaultEnvironment and authored documentation locale. |
| `es` | todo | No HIG-approved glossary translation. Do not guess. Observed: apps/app/messages/es.json in the product inventory. |
| `fr` | todo | No HIG-approved glossary translation. Do not guess. Observed: apps/app/messages/fr.json in the product inventory. |
| `ko` | todo | No HIG-approved glossary translation. Do not guess. Observed: apps/app/messages/ko.json in the product inventory. |
| `ko-KR` | todo | No HIG-approved glossary translation. Do not guess. Observed: Google Play store-screenshot locale in the product inventory. |
| `zh-CN` | todo | No HIG-approved glossary translation. Do not guess. Observed: apps/app/messages/zh-CN.json in the product inventory. |
| `zh-Hans` | todo | No HIG-approved glossary translation. Do not guess. Observed: App Store screenshot locale in the product inventory. |
| `de-DE` | not a translation locale | HIG Intl number-format fixture only. Not an approved translation locale. |
| `ar-EG` | not a translation locale | HIG Intl percent/numeral fixture only. RTL is a layout direction, not a glossary locale. |

`en-US` is the only approved HIG glossary locale (`defaultEnvironment.locale`). Product message catalogs and store screenshots listed above are inventory observations, not approvals.

## Change process

1. Edit English fields in `docs/foundations/glossary.json` only. Do not hand-edit this Markdown.
2. Run `node scripts/generate-glossary.mjs` (also invoked by docs generation) and commit the JSON and Markdown together.
3. A term is locked when its English definition, usage notes, do/don't examples and `untranslated` flag are reviewed in this repository. Do not start translations before that lock.
4. Promote a pending locale only by setting `status: approved` and supplying `translations[locale]` for **every** term. Incomplete locales stay `todo`.
5. Never guess a translation. Product/marketing strings are not an approved glossary source.
6. Changing a locked definition is a breaking content change for translation agents. Call out term ids in the PR. Tickers, brand names and `untranslatedForms` never enter translation files.
7. `de-DE` and `ar-EG` remain Intl fixtures, not glossary locales.

This chapter blocks locale translation work until the JSON lock is adopted.

## Terms

### Perpetual (perp)

Term id: `perp`. Aliases: `perps`, `perpetual futures`, `perpetual contract`. **Untranslated:** keep the listed short form in every locale. Untranslated forms: `perp`, `perps`.

**Definition:** A derivative that tracks an asset’s price with no fixed expiry. Funding payments help keep the contract aligned with its underlying market. Stocks, commodities, indices and pre-IPO listings on Bloxwap are perps, not ownership of the underlying asset.

**Usage:** Prefer “perp” in dense UI (market row, ticket). Use “perpetual” once in explanatory copy, then the short form. Never imply the trader owns the tracked stock, commodity or token.

**Do:** Label a Bitcoin market “BTC perp”. Say “open a perp position” rather than “buy Bitcoin” when the instrument is a perpetual.

**Don't:** Don’t call a perp a spot purchase, share, or tokenized stock certificate. Don’t invent an expiry date for a perp.

See also: `funding`, `position`, `leverage`.

### Leverage

Term id: `leverage`. Aliases: `lev`. **Untranslated:** no — translate in approved locales.

**Definition:** Position size relative to the margin supporting it. At 10×, 100 USDC of margin supports 1,000 USDC of notional exposure. Leverage magnifies both gains and losses. Market-specific limits are set by Hyperliquid, not by HIG.

**Usage:** Display as a multiplier with the multiplication sign (`10×`), never as a percent (`1000%`). Keep the `×` suffix untranslated. Limits and available leverage are host-supplied.

**Do:** Show selected leverage as `10×` next to size. Repeat the selected leverage on the review step before the host submits.

**Don't:** Don’t write `10x leverage = safe`. Don’t display leverage as `+1000%` or reuse percent styling.

See also: `margin`, `notional`, `liquidation-price`.

### Margin

Term id: `margin`. Aliases: `collateral`, `cross margin`, `isolated margin`. **Untranslated:** no — translate in approved locales. Untranslated forms: `USDC`.

**Definition:** USDC collateral used to open and maintain a leveraged position. If collateral falls below the maintenance requirement, Hyperliquid can liquidate the position. With cross margin, liquidation can consume the whole trading account, not only one position’s margin.

**Usage:** Bloxwap trading collateral is USDC. Say “margin” for trading collateral; do not call it a deposit held by Bloxwap. Isolated vs cross is a host/protocol mode, not a HIG component.

**Do:** Label available collateral “Available margin (USDC)”. Explain that cross margin can consume the trading account, not only the row’s margin.

**Don't:** Don’t call USDC margin a bank deposit or a Bloxwap-custodied balance. Don’t display unknown margin as `0`.

See also: `usdc`, `leverage`, `liquidation-price`, `position`.

### Position

Term id: `position`. Aliases: `open position`, `exposure`. **Untranslated:** no — translate in approved locales.

**Definition:** Open long or short exposure in one market. A position has size, side, margin, leverage, entry, mark, notional, unrealized PnL and an estimated liquidation price. Closing requires a host-submitted order; HIG never executes a trade.

**Usage:** One row per market/side as the host provides. Don’t merge unrelated markets into a single position label. Size stays a raw decimal string in business logic.

**Do:** Title a row “BTC long” with size, leverage and PnL as separate readouts. Keep last-known position data and mark it stale when the host is offline.

**Don't:** Don’t say “position closed” until the host confirms the close fill. Don’t treat a formatted size as the order quantity.

See also: `long`, `short`, `notional`, `pnl`.

### Liquidation price (liq. price)

Term id: `liquidation-price`. Aliases: `liq price`, `liquidation`, `estimated liquidation price`. **Untranslated:** no — translate in approved locales.

**Definition:** The estimated mark price at which the position no longer meets its maintenance margin and Hyperliquid may force-close it. The figure is an estimate; auto-deleveraging can also close positions, including profitable ones.

**Usage:** Always present it as estimated and host-computed. Higher leverage generally leaves less room for an adverse move. Unknown estimates render as —.

**Do:** Label the readout “Est. liquidation price”. Keep the estimate visible next to leverage when the trader changes size.

**Don't:** Don’t call the estimate a guaranteed stop. Don’t omit “estimated” on first display in a risk-critical surface.

See also: `margin`, `leverage`, `stop`.

### Funding

Term id: `funding`. Aliases: `funding rate`, `funding payment`. **Untranslated:** no — translate in approved locales.

**Definition:** Periodic payments between long and short holders of a perpetual that help keep the contract aligned with its underlying market. Positive funding generally means longs pay shorts; negative funding means shorts pay longs. Funding is separate from exchange and builder fees.

**Usage:** Show the rate and the next payment time. Compute from UTC; display in the user’s locale with an explicit time zone. Hyperliquid funding is hourly; the interval is protocol-owned, not a HIG constant to restyle as a calendar expiry.

**Do:** Label “Funding +0.0100% · next 16:00 UTC”. Use a duration countdown (“in 12 min”) rather than a zone-less clock.

**Don't:** Don’t mix funding into the builder-fee line as if it were the same charge. Don’t show a next-funding time without a time zone.

See also: `perp`, `pnl`, `long`, `short`.

### Profit and loss (PnL)

Term id: `pnl`. Aliases: `P&L`, `unrealized PnL`, `realized PnL`, `net PnL`. **Untranslated:** keep the listed short form in every locale. Untranslated forms: `PnL`.

**Definition:** Profit and loss on a position or account. Unrealized PnL marks an open position; realized PnL is locked in after closes. Net figures may include trading fees and available funding; the host must say which components are included.

**Usage:** Keep the abbreviation PnL in every locale. Pair it with a signed, locale-formatted amount. Color is not a substitute for the sign. Zero is `0`, not empty; unknown is —.

**Do:** Show `PnL +$12.34` with `signDisplay: 'exceptZero'`. Name the readout “Unrealized PnL” or “Net PnL” according to host data.

**Don't:** Don’t translate PnL into an unverified local acronym. Don’t announce every live PnL tick to a screen reader.

See also: `position`, `notional`, `funding`.

### Long

Term id: `long`. Aliases: `UP`. **Untranslated:** no — translate in approved locales.

**Definition:** A position that profits if the market price rises. Opening long buys the perp; closing long sells it. Product chrome may label the action UP; the canonical term remains long.

**Usage:** Map UP/DOWN product labels to long/short in copy, APIs and accessibility names. Buy/sell color means direction, never safety. Don’t leave the canonical term untranslated just because the button says UP.

**Do:** Accessible name: “Long BTC”. Visible tap label may stay “UP” where the product uses it. Pair long with a buy-direction token, not a success/destructive intent.

**Don't:** Don’t say “buy Bitcoin” when the action opens a BTC perp long. Don’t use destructive red for every long close.

See also: `short`, `position`, `perp`.

### Short

Term id: `short`. Aliases: `DOWN`. **Untranslated:** no — translate in approved locales.

**Definition:** A position that profits if the market price falls. Opening short sells the perp; closing short buys it back. Product chrome may label the action DOWN; the canonical term remains short.

**Usage:** Same mapping rules as long. Short is a market direction, not a destructive action. Closing a short is not “selling the asset”.

**Do:** Accessible name: “Short ETH”. Visible tap label may stay “DOWN” where the product uses it. State “close short” for an exit, not “buy ETH”.

**Don't:** Don’t describe a short as borrowing stock or delivering the underlying. Don’t treat DOWN as a glossary synonym that replaces short in docs or APIs.

See also: `long`, `position`, `perp`.

### Stop

Term id: `stop`. Aliases: `stop loss`, `stop-loss`, `SL`, `stop order`. **Untranslated:** keep the listed short form in every locale. Untranslated forms: `SL`.

**Definition:** A reduce-risk order that submits a close when the market reaches a trigger the trader set. It is not a guaranteed fill at that price and it is not the protocol liquidation price.

**Usage:** Label the control “Stop”. If a compact badge uses SL, keep SL untranslated and expose “Stop” to assistive technology. Host owns trigger parsing and submission.

**Do:** Place stop beside take profit as optional risk controls on an open position. Confirm the trigger price as a raw string before the host submits.

**Don't:** Don’t present a stop as insurance against liquidation. Don’t reuse the estimated liquidation price as a silent stop.

See also: `take-profit`, `liquidation-price`, `position`.

### Take profit

Term id: `take-profit`. Aliases: `TP`, `take-profit`. **Untranslated:** keep the listed short form in every locale. Untranslated forms: `TP`.

**Definition:** An order that submits a close when the market reaches a favorable trigger the trader set. Like a stop, it is not a guaranteed fill at that price.

**Usage:** Spell “take profit” in sentences. Compact badges may use TP; keep TP untranslated. Pair with stop; neither replaces a review step.

**Do:** Label the field “Take profit”. Show both trigger and current mark so the trader can see distance.

**Don't:** Don’t hide take profit behind an unlabeled TP icon. Don’t treat a take-profit fill as realized until the host confirms it.

See also: `stop`, `pnl`, `position`.

### Notional

Term id: `notional`. Aliases: `notional value`, `position value`. **Untranslated:** no — translate in approved locales.

**Definition:** Absolute position value in quote terms, typically mark × size. Notional is the exposure, not the margin posted. At 10×, 100 USDC margin corresponds to 1,000 USDC notional.

**Usage:** Use “notional” in Pro/details; “position value” is allowed in first-run copy if it still means mark × size. Never display notional as if it were withdrawable balance.

**Do:** Show “Notional 1,000.00 USDC” separately from “Margin 100.00 USDC”. Keep notional host-computed; HIG only formats the number.

**Don't:** Don’t label margin as notional or notional as available cash. Don’t round notional for display and feed that figure back into an order.

See also: `leverage`, `margin`, `position`.

### Builder fee

Term id: `builder-fee`. Aliases: `builder-fee`, `interface fee`. **Untranslated:** no — translate in approved locales. Untranslated forms: `bps`.

**Definition:** A fee added by an interface that routes orders to Hyperliquid, charged on each fill in addition to the exchange fee. Live rates, Genesis discounts and rebate math belong to the host fee schedule, not this glossary.

**Usage:** Spell “builder fee”. Quote basis points as `bps` (untranslated) with a percent companion (`5 bps (0.05%)`) when showing a rate. Fees apply on open and close fills; funding is separate.

**Do:** Itemize “Builder fee” and “Exchange fee” on the review step. Point at the host fee schedule for the current rate rather than hard-coding it in a component.

**Don't:** Don’t call the builder fee a spread, a spread markup, or Hyperliquid’s exchange fee. Don’t bake a candidate rate into HIG component copy.

See also: `funding`, `pnl`.

### USDC

Term id: `usdc`. Aliases: `USD Coin`. **Untranslated:** yes — keep English. Untranslated forms: `USDC`.

**Definition:** A stablecoin designed to track the US dollar. Bloxwap uses USDC for trading collateral and settlement. It is not the same ticker as USD for display purposes.

**Usage:** Always keep `USDC` untranslated. Format the amount with the locale’s decimal/grouping rules, then place the ticker `USDC` — never a `$` or `currency: 'USD'` style. See the localization guide.

**Do:** Display `1,234.50 USDC`. Use the Usd readout only for actual USD, not for USDC collateral.

**Don't:** Don’t localize USDC to “USD”, “US$”, or a local currency name. Don’t pass `currency: 'USDC'` to Intl; it is not a reliable ISO 4217 code.

See also: `margin`, `notional`, `pnl`.
