# Numbers, currency and dates · HIG 0.1.0

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

## Validation

See `tests/tokens.test.ts`, `tests/data.dom.test.tsx`, `tests/glossary.test.ts`, `docs/foundations/localization.json` and the data chapter. Cite HIG 0.1.0 with this chapter anchor and a commit permalink.
