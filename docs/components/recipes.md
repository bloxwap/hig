# Recipes · HIG 0.1.0

Composed patterns for balances, markets, trade review, and documentation.

Includes `MarketRow`, `BalanceCard`, `TradeEntry`, `ActivityList`, `InstallCommand`, `CodeWindow`, and `MarketingHero`.

Issue #26. Entry: `recipes`. Import platform entries from `@bloxwap/hig-react/recipes` or `@bloxwap/hig-native/recipes` according to applicability below. On web, each recipe also has its own entry, for example `@bloxwap/hig-react/recipes/install-command`, `recipes/code-window`, `recipes/market-row`, `recipes/balance-card`, `recipes/marketing-hero` and `recipes/activity-list`. These need no Radix peer; `smoke:packed-boundaries` renders and bundles them with no Radix installed (#63). `recipes/trade-entry` and the aggregate `recipes` entry need `@radix-ui/react-dialog` for the confirm step. Import `@bloxwap/hig-react/css` once on web; tokens CSS is a separate explicit import.

## API and anatomy

All data and actions are supplied by the host application.

| Recipe | Key props and behavior |
| --- | --- |
| `TradeEntry` | Raw `amount`, `onAmountChange`, `onConfirm`, `available`, `busy`, and `error`; opens review before submission. |
| `InstallCommand` | `command` and `onCopy`; accepts an asynchronous host clipboard adapter. |
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

## When to use and examples

Do: compose primitives and explicit outcomes in comfortable app or compact Pro context. Don’t: put wallet/network/SDK services in core packages.

## States, interaction and accessibility

Native CodeWindow and InstallCommand render code in the provider's `monoFontFamily` (for example the registered `BloxwapMonoRegular`; platform monospace otherwise) and keep code left-to-right inside RTL roots. Copy failures leave a manual-selection recovery message. Trade confirm remains host-controlled; no demo sends a transaction. Web/native fixtures show balance, market, entry and feedback preference previews.

State review: rest; keyboard focus/hover (DOM); accepted press and release/cancel; selected/checked where applicable; disabled; busy; inline error/recovery; empty/loading; long translations/large text; reduced motion; sound and haptics disabled. No host action occurs on mere focus. Disabled/busy targets suppress accepted activation. Core has no required feedback backend; the optional provider callback follows the action, honors cancellation and isolates errors.

## Platform mapping and limits

M2 supplies visual recipes; M3 adds semantic feedback composition because #26 depends on #25. Product visual fidelity is provisional until inaccessible monorepo audit. Account/positions variants can compose these primitives without service coupling.

## Validation and citation

See `tests/components.dom.test.tsx`, `tests/pro-data.dom.test.tsx`, `tests/pro-data-typecheck.tsx`, `tests/native/components.test.cjs`, consumer fixtures and milestone evidence. Physical hardware, assistive-technology and baseline product comparisons are unperformed unless linked explicitly. Cite HIG 0.1.0 with this chapter anchor and a commit permalink, not a mutable preview branch. Preserve business behavior behind a host rollback flag during adoption.
