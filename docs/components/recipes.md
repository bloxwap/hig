# Recipes · HIG 0.1.0

Composed patterns for balances, markets, trade review, and documentation.

Includes `MarketRow`, `BalanceCard`, `TradeEntry`, `ActivityList`, `InstallCommand`, `CodeWindow`, and `MarketingHero`.

Issue #26. Entry: `recipes`. Import platform entries from `@bloxwap/hig-react/recipes` or `@bloxwap/hig-native/recipes` according to applicability below. Import `@bloxwap/hig-react/css` once on web; tokens CSS is a separate explicit import.

## API and anatomy

All data and actions are supplied by the host application.

| Recipe | Key props and behavior |
| --- | --- |
| `TradeEntry` | Raw `amount`, `onAmountChange`, `onConfirm`, `available`, `busy`, and `error`; opens review before submission. |
| `InstallCommand` | `command` and `onCopy`; accepts an asynchronous host clipboard adapter. |

## When to use and examples

Do: compose primitives and explicit outcomes in comfortable app or compact Pro context. Don’t: put wallet/network/SDK services in core packages.

## States, interaction and accessibility

Copy failures leave a manual-selection recovery message. Trade confirm remains host-controlled; no demo sends a transaction. Web/native fixtures show balance, market, entry and feedback preference previews.

State review: rest; keyboard focus/hover (DOM); accepted press and release/cancel; selected/checked where applicable; disabled; busy; inline error/recovery; empty/loading; long translations/large text; reduced motion; sound and haptics disabled. No host action occurs on mere focus. Disabled/busy targets suppress accepted activation. Core has no required feedback backend; the optional provider callback follows the action, honors cancellation and isolates errors.

## Platform mapping and limits

M2 supplies visual recipes; M3 adds semantic feedback composition because #26 depends on #25. Product visual fidelity is provisional until inaccessible monorepo audit. Account/positions variants can compose these primitives without service coupling.

## Validation and citation

See `tests/components.dom.test.tsx`, `tests/native/components.test.cjs`, consumer fixtures and milestone evidence. Physical hardware, assistive-technology and baseline product comparisons are unperformed unless linked explicitly. Cite HIG 0.1.0 with this chapter anchor and a commit permalink, not a mutable preview branch. Preserve business behavior behind a host rollback flag during adoption.
