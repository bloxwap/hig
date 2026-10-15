# Numbers, currency, dates and built-in strings · HIG 0.1.0

Issue #47. Vocabulary is locked in the [trading glossary](glossary.md); agents consume [`docs/foundations/glossary.json`](glossary.json). Machine-readable format profiles: [`docs/foundations/localization.json`](localization.json). Host owns locale selection, parsing and time zone; HIG formats display only.

`HIGProvider` locale is a BCP 47 tag (`en-US` default). Direction (`ltr`/`rtl`) is independent. `de-DE` and `ar-EG` are Intl fixtures already covered by tests, not approved translation locales.

## Shared helpers

Use the display helpers from `@bloxwap/hig-contracts` and the data readouts. Do not hand-roll separators, currency symbols, compact suffixes, the leverage `×` or zone labels. Every helper returns `—` for `null`, `undefined` and non-finite input.

```ts
import {formatNumber, formatLeverage, formatTicker, formatZonedTime} from '@bloxwap/hig-contracts';
formatNumber(value, locale, options);             // Intl.NumberFormat
formatLeverage(10, locale);                        // '10×' (decimal style forced)
formatTicker(12.34, 'USDC', locale, {signDisplay: 'exceptZero'}); // '+12.34 USDC' (no-break space)
formatZonedTime(instant, locale, 'UTC');           // '4:00 PM UTC' / '16:00 UTC'
```

| Need | API |
| --- | --- |
| Decimal/grouped numbers | `formatNumber` / `NumberReadout` + host `minimumFractionDigits`/`maximumFractionDigits` |
| USD | `Usd` (`style:'currency', currency:'USD'`) |
| USDC | `formatTicker(amount, 'USDC', locale, options)` — decimal amount plus untranslated ticker, never `$` |
| Leverage | `formatLeverage(value, locale)` — `10×`, never percent |
| Percent points | `Percent` (5 means 5%; do not pass a ratio) |
| Signed PnL | `signDisplay:'exceptZero'` on `Usd`/`formatNumber`/`formatTicker` |
| Compact totals | `notation:'compact', compactDisplay:'short'` |
| Funding / expiry clocks | `formatZonedTime(instant, locale, timeZone)` — `Intl.DateTimeFormat` with the zone name always shown |
| Other dates | `Intl.DateTimeFormat` |
| Funding countdown | `Intl.RelativeTimeFormat` on a duration, not a zone-less clock |

Hermes in RN 0.81.5 provides `Intl`. Don’t polyfill, don’t concatenate `'$'+value`, and don’t parse a formatted string back into an order.

## Numbers

Grouping and decimal marks come from the locale: `1,234.5` in `en-US`, `1.234,5` in `de-DE`, Eastern Arabic numerals in `ar-EG`. Precision is host-supplied (tick size, `szDecimals`). Generic USD balances may use 2 fraction digits; prices, sizes, funding rates and fees do not share one precision table.

**Do** keep `0` for zero and — for unknown/non-finite; mark stale. **Don’t** use a rounded display value as transaction input, strip unfamiliar separators, or replace Eastern Arabic digits with Latin ones unless a dual readout is explicit.

## Currency, signed PnL and compact notation

USD uses ISO `currency:'USD'`. Intl places the symbol (`$1,234.50` vs `1.234,50 $`). USDC is a ticker, not a reliable ISO 4217 code: use `formatTicker(amount, 'USDC', locale)`, which formats the number without `style:'currency'` and appends `USDC` after a no-break space. Never show USDC as `$` or `USD`.

Signed PnL always includes a sign except at zero (`+$12.34`, `-$12.34`). Color is not a substitute for the sign. Don’t use accounting parentheses.

Compact notation is locale-owned. `1.2K` / `3.4M` is the `en-US` short form; `de-DE` yields `3,4 Mio.`, `ja-JP` may use `万`. Never hard-code `K`/`M`. Compact is for overview totals, not order tickets or review amounts.

USDC PnL follows the same sign rule: `+12.34 USDC`. Tabular nums on every readout.

## Dates, times and funding

`en-US` clocks are 12-hour (`4:00 PM`). Many other locales resolve `h23`. Use `Intl.DateTimeFormat` (`hourCycle` from the locale unless the host overrides). Store instants in UTC.

Funding and expiries: compute the next payment from UTC (Hyperliquid funding is hourly; the interval is protocol-owned). Display the instant with an explicit zone (`16:00 UTC` or a named device zone) using `formatZonedTime`. Pair a duration countdown (“in 12 min”) with that labeled clock. Perps have no expiry — don’t render an expiry field on a perp.

**Don’t** show a funding time without a zone or treat a local wall clock as UTC.

## Leverage and percentages

Leverage is a multiplier with the untranslated `×` suffix (`10×`, via `formatLeverage`), never `1000%` or percent styling. Percentages use the glossary’s rate terms (funding, builder fee as `5 bps (0.05%)`) and `Percent` for percent-point values (`+2.5%`, `-2.5%`). Keep `bps` untranslated.

## RTL and text expansion

Logical inline spacing, wrapping labels, no fixed-height clipping of translated text, Dynamic Type stays on. Plan for ~30–40% expansion (German/Finnish) and 200% text. Directional arrows mirror in RTL; brand, check marks and financial direction (`+`/`−`, buy/sell) do not. Preserve bidi isolates that Intl inserts around signed currency in Arabic. Mixed-script punctuation needs the required font scripts; a Latin-only fixture does not certify them.

Long translations, Arabic/Hebrew RTL and large text remain part of the [platform checklist](platform.md#accessibility-and-localization-10). Physical-device observations are still pending.

## Built-in component strings

Issue #62. HIG components render a small amount of their own copy: the Close button on overlays, the Toast Dismiss button, the Button busy suffix, loading and empty states, and the recipe labels. None of it is hard-coded in `packages/react/src` or `packages/native/src`. Every string comes from a typed `HIGMessages` catalog (`@bloxwap/hig-contracts/messages`). Hosts translate it through `HIGProvider messages`. A few components also take a per-instance prop (`closeLabel`, `cancelLabel`, `dismissLabel`, `busyLabel`).

HIG ships the English (`en-US`) defaults only (`defaultMessages`). It does not ship or guess translations. The host's message catalog owns French, Korean and other copy, under the same rule as the [glossary](glossary.md): an unapproved locale is never filled by guessing.

```tsx
import {HIGProvider} from '@bloxwap/hig-react/provider'; // or '@bloxwap/hig-native/provider'
import type {HIGMessages} from '@bloxwap/hig-contracts/messages';

const fr: Partial<HIGMessages> = {
  close: t('hig.close'),             // from the host catalog, e.g. 'Fermer'
  dismiss: t('hig.dismiss'),
  dismissNotice: (message, dismiss) => `${dismiss} : ${message}`,
  busy: t('hig.busy'),
};

<HIGProvider locale='fr-FR' messages={fr}>…</HIGProvider>
<Dialog closeLabel={t('checkout.back')} …/>   // one instance
<Button busy busyLabel=''>…</Button>           // no visible suffix; busy state stays exposed
```

Resolution order, per key: the component prop, then the nearest `HIGProvider messages`, then any enclosing `HIGProvider messages`, then English. A nested provider for density or direction keeps the host's translations. `undefined` keys and values of the wrong type (a string where a function is expected, or the reverse) are ignored, so a partial catalog never blanks a label. `useMessages()` returns the complete resolved catalog; `useHIG().messages` holds only the host overrides. Each English default is also a named export of `@bloxwap/hig-contracts/messages`, and a component falls back per key (`messages.close ?? en.close`), so importing one component bundles only the copy it renders.

Rules:

- **Visible text and accessible names come from the same key.** The Close, Dismiss and busy text is the button content, so it is also the accessible name. The Toast dismiss name is `dismissNotice(message, dismiss)`. A translation must keep the `dismiss` argument in it, so voice-control users can say the label they see. `stale` and `required` are appended to both the visible text and the accessible name.
- **Close means dismissing an overlay.** `close` closes a dialog or sheet. It is not the glossary sense of closing a position (an exit order). Translate it with the platform's dismiss word, never with the trading term for closing a position.
- **Functions receive formatted arguments.** `pageOf` and `progressValue` receive numbers already formatted for the provider locale (Eastern Arabic digits in `ar-EG`). `resultCount` receives the raw count and the locale, so it can pick a plural form with `Intl.PluralRules`. Translations may reorder arguments. Component code never concatenates words.
- **RTL is a direction, not a translation.** Messages render inside the provider's `dir` (web) or `writingDirection` (native). The Unicode bidi algorithm places the ` · ` busy separator and parentheses. Do not add direction marks to messages.
- **Trading words stay with the host.** Default messages contain no glossary term. The TradeEntry recipe copy (`reviewAssetOrder`, `confirmOrder`, …) is generic order-review copy. The host supplies the asset ticker, which stays untranslated.

| Key | English default | Where | Prop override |
| --- | --- | --- | --- |
| `close` | Close | Dialog, Sheet, Popover (web), Menu and GestureSheet (native) close button | `closeLabel` |
| `cancel` | Cancel | AlertDialog (web) decline button | `cancelLabel` |
| `dismiss` | Dismiss | Toast dismiss button text | `dismissLabel` |
| `dismissNotice` `(message, dismiss)` | {dismiss} {message} | Toast dismiss accessible name; must contain the `dismiss` argument | — |
| `busy` | Working | Button busy suffix, shown as ` · {busy}`; `''` hides it | `busyLabel` |
| `notifications` | Notifications | Toast region name (web) | — |
| `loading` | Loading | Spinner label (web appends `…`) | `label` |
| `loadingContent` | Loading content | Skeleton label | `label` |
| `loadingItems` | Loading items | List loading row | — |
| `loadingChart` | Loading chart… | PriceChart fallback (web) | — |
| `noItems` | No items | List empty text | `empty` |
| `noRows` | No rows | Table empty text (web) | — |
| `retry` | Retry | List retry button | — |
| `loadMore` | Load more | List load-more button | — |
| `stale` | (stale) | NumberReadout stale marker (visible and accessible) | — |
| `required` | (required) | Field required marker (visible and accessible) | — |
| `breadcrumb` | Breadcrumb | Breadcrumb landmark name (web) | — |
| `pagination` | Pagination | Pagination landmark name (web) | — |
| `previous` | Previous | Pagination previous button | — |
| `next` | Next | Pagination next button | — |
| `pageOf` `(page, total)` | Page {page} of {total} | Pagination position; numbers arrive locale-formatted | — |
| `search` | Search | Search field label | — |
| `searching` | Searching… | Search in-progress status | — |
| `noResults` | No results | Search empty status | — |
| `resultCount` `(count, locale)` | {count} result / {count} results | Search result count (native); use `Intl.PluralRules` for other plural forms | — |
| `back` | Back | BackButton (native) | — |
| `menuDescription` | Available actions | Menu sheet description (native) | — |
| `choose` | Choose | Select trigger before a choice (native) | — |
| `chooseOne` | Choose one option. | Select sheet description (native) | — |
| `inProgress` | In progress | Indeterminate Progress value text (native) | — |
| `progressValue` `(value, max)` | {value} of {max} | Determinate Progress value text (native); numbers arrive locale-formatted | — |
| `copied` | Copied | InstallCommand success status | — |
| `copyFailed` | Copy failed. Select the command and copy manually. | InstallCommand failure status | — |
| `copyInstallCommand` | Copy install command | InstallCommand button | — |
| `reviewAssetOrder` `(asset)` | Review {asset} order | TradeEntry heading | — |
| `amountInAsset` `(asset)` | Amount ({asset}) | TradeEntry amount label | — |
| `availableAmount` `(available)` | Available: {available} | TradeEntry amount description | — |
| `reviewOrder` | Review order | TradeEntry review button | — |
| `confirmOrder` | Confirm order | TradeEntry dialog title and confirm button | — |
| `confirmOrderDescription` `(amount, asset)` | Amount: {amount} {asset}. Verify the host-provided terms before submission. | TradeEntry dialog description | — |
| `orderUnavailable` | Order unavailable | TradeEntry error title (web) | — |
| `noActivity` | No activity yet | ActivityList empty text | — |
| `statusOnline` | online | StatusIndicator `online` | — |
| `statusOffline` | offline | StatusIndicator `offline` | — |
| `statusStale` | stale | StatusIndicator `stale` | — |

`npm run lint` runs `scripts/check-built-in-strings.mjs`, and so does `tests/built-in-strings.test.ts`. The check fails when a component under `packages/{react,native}/src` adds a user-visible or accessible literal. That covers JSX text, a visible or accessibility attribute (`aria-label`, `accessibilityLabel`, `title`, `label`, `description`, …), a label-like default prop and a `set…()` status string. To add copy, add a key to `HIGMessages`, read it with `useMessages()`, and add a row to the table above. The test checks that every key is in this table with its English default.

## Validation

See `tests/tokens.test.ts`, `tests/data.dom.test.tsx`, `tests/glossary.test.ts`, `tests/built-in-strings.test.ts`, `tests/messages.dom.test.tsx`, `tests/native/messages.test.cjs`, `docs/foundations/localization.json` and the data chapter. Cite HIG 0.1.0 with this chapter anchor and a commit permalink.
