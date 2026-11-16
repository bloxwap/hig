export type Density = 'comfortable' | 'compact';
export type Intent = 'primary' | 'secondary' | 'destructive' | 'ghost';
export type Direction = 'ltr' | 'rtl';
export interface Environment { density: Density; locale: string; direction: Direction; reducedMotion: boolean }
export const defaultEnvironment: Environment = {density:'comfortable',locale:'en-US',direction:'ltr',reducedMotion:false};
/** A host-supplied locale: a BCP 47 tag (`ar-EG`), a Java/Android identifier (`ar_EG`, `az_IR_#Arab`), or a locale object that may carry its own `textDirection`, such as expo-localization's `getLocales()[0]`. */
export type HostLocale = string | {readonly textDirection?: Direction | null; readonly languageTag?: string | null};
// Scripts written right to left (ISO 15924), and languages whose default script is one of them when no script subtag is given.
const rtlScripts = new Set(['adlm','arab','aran','armi','avst','chrs','cprt','elym','hatr','hebr','hung','khar','lydi','mand','mani','mend','merc','mero','narb','nbat','nkoo','orkh','ougr','palm','phli','phlp','phnx','prti','rohg','samr','sarb','sogd','sogo','syrc','thaa','yezi']);
const rtlLanguages = new Set(['ar','arc','azb','bal','bqi','ckb','dv','fa','glk','he','iw','ji','khw','ks','lrc','mzn','nqo','pnb','prs','ps','rhg','sd','sdh','skr','syr','ug','ur','yi']);
/**
 * Writing direction of a host-supplied locale, or `undefined` when the value names no language (empty, `und`, malformed).
 * An explicit `textDirection` wins; otherwise a script subtag decides, then the language. Pass the result to `HIGProvider direction`
 * only in apps that lay out right to left: it reports the locale's direction, not whether the host allows RTL (#86).
 */
export function localeDirection(locale: HostLocale | null | undefined): Direction | undefined {
 if (locale == null) return undefined;
 if (typeof locale === 'object') { if (locale.textDirection === 'rtl' || locale.textDirection === 'ltr') return locale.textDirection; return localeDirection(locale.languageTag); }
 const [language = '', ...rest] = locale.trim().toLowerCase().split(/[-_#]+/);
 if (!/^[a-z]{2,3}$/.test(language) || language === 'und') return undefined;
 // The script precedes any singleton extension (`-u-nu-arab` names Arabic digits, not Arabic script).
 const singleton = rest.findIndex(subtag => subtag.length === 1);
 const script = (singleton < 0 ? rest : rest.slice(0, singleton)).find(subtag => /^[a-z]{4}$/.test(subtag));
 return (script ? rtlScripts.has(script) : rtlLanguages.has(language)) ? 'rtl' : 'ltr';
}
/** How money reads across a provider: the currency sign and digit grouping a host's own figures use, such as `narrowSymbol` so French reads `12,50 $` rather than `12,50 $US`. */
export interface NumberFormatPresentation {
 /** How the currency is named. Intl's default is `symbol`. */
 currencyDisplay?: 'symbol' | 'narrowSymbol' | 'code' | 'name';
 /** Digit grouping. `'always'` groups four-digit amounts in locales that otherwise leave them ungrouped, such as Spanish. */
 useGrouping?: boolean | 'always' | 'auto' | 'min2';
 /** The locale numbers are formatted in, when it differs from the provider's interface `locale`: `'en-US'` keeps Korean or Chinese figures in US separators. It changes every number HIG formats (separators, digits and currency placement), not only money. Omitted, numbers follow the provider's `locale`. */
 locale?: string;
}
/** The locale HIG formats numbers in: the presentation's `locale` when it names one, otherwise the interface locale. */
export function numberLocale(locale: string, presentation?: NumberFormatPresentation): string {
 const own = presentation?.locale;
 return typeof own === 'string' && own.trim() !== '' ? own : locale;
}
/**
 * Merges a provider's money presentation under the options of one currency format. Only `style: 'currency'` options change, and any
 * field the options set themselves wins. Without a presentation, or for any other style, the same options object is returned.
 */
export function presentNumberFormat<T extends Intl.NumberFormatOptions | undefined>(options: T, presentation?: NumberFormatPresentation): T {
 if (!presentation || options?.style !== 'currency') return options;
 const merged: Record<string, unknown> = {};
 if (presentation.currencyDisplay !== undefined) merged.currencyDisplay = presentation.currencyDisplay;
 if (presentation.useGrouping !== undefined) merged.useGrouping = presentation.useGrouping;
 for (const [key, value] of Object.entries(options)) if (value !== undefined) merged[key] = value;
 return merged as T;
}
/** Display only. Keep raw decimal strings in transaction logic. */
export function formatNumber(value: number | null | undefined, locale = 'en-US', options: Intl.NumberFormatOptions = {}): string {
 return value == null || !Number.isFinite(value) ? '—' : new Intl.NumberFormat(locale, options).format(value);
}
/** Leverage multiplier display (`10×`). Never percent-styled; the `×` suffix is untranslated. Unknown → `—`. */
export function formatLeverage(value: number | null | undefined, locale = 'en-US', options: Intl.NumberFormatOptions = {maximumFractionDigits: 2}): string {
 const amount = formatNumber(value, locale, {...options, style: 'decimal'});
 return amount === '—' ? amount : `${amount}×`;
}
/** Amount followed by an untranslated ticker such as `USDC` (not an ISO 4217 currency), joined by a no-break space. Unknown → `—`. */
export function formatTicker(value: number | null | undefined, ticker: string, locale = 'en-US', options: Intl.NumberFormatOptions = {}): string {
 const amount = formatNumber(value, locale, {...options, style: 'decimal'});
 return amount === '—' ? amount : `${amount}\u00a0${ticker}`;
}
/** Clock display for funding and other protocol instants. The host must name the zone; the zone name is always shown. Unknown → `—`. */
export function formatZonedTime(value: Date | number | null | undefined, locale: string, timeZone: string, options: Intl.DateTimeFormatOptions = {hour: 'numeric', minute: '2-digit'}): string {
 const time = value instanceof Date ? value.getTime() : value;
 if (time == null || !Number.isFinite(time)) return '—';
 return new Intl.DateTimeFormat(locale, {timeZoneName: 'short', ...options, timeZone}).format(time);
}
/** Font 0.1.2 publishes CSS/Next loaders, native faces are derived by the optional pinned HIG font generator. */
/** Formats one unit with Intl (`2 hours`, `1d`), falling back to plain digits and the unit name where the runtime lacks unit formatting. */
function formatUnit(value: number, unit: 'day' | 'hour' | 'minute' | 'second', locale: string, unitDisplay: 'long' | 'narrow'): string {
 try { return new Intl.NumberFormat(locale, {style: 'unit', unit, unitDisplay}).format(value); }
 catch { return unitDisplay === 'narrow' ? `${value}${unit[0]}` : `${value} ${unit}${value === 1 ? '' : 's'}`; }
}
/**
 * Time left until a market opens, rounded up to the second. `visible` is a clock: `2:14:33`, or `1d 04:12:09` past a day.
 * `spoken` names the largest units in words without seconds (`2 hours, 14 minutes`), so it changes once a minute and is
 * calm in an accessible name; under a minute it reads the seconds. Negative time reads as zero.
 */
export function formatCountdown(remainingMs: number, locale = 'en-US'): {visible: string; spoken: string} {
 const total = Math.max(0, Math.ceil(remainingMs / 1000));
 const days = Math.floor(total / 86400), hours = Math.floor(total % 86400 / 3600), minutes = Math.floor(total % 3600 / 60), seconds = total % 60;
 const pad = (n: number) => String(n).padStart(2, '0');
 const visible = days > 0 ? `${formatUnit(days, 'day', locale, 'narrow')} ${pad(hours)}:${pad(minutes)}:${pad(seconds)}` : `${hours}:${pad(minutes)}:${pad(seconds)}`;
 const words = total < 60 ? [formatUnit(seconds, 'second', locale, 'long')] : [days ? formatUnit(days, 'day', locale, 'long') : '', hours ? formatUnit(hours, 'hour', locale, 'long') : '', minutes ? formatUnit(minutes, 'minute', locale, 'long') : ''].filter(Boolean);
 let spoken: string;
 try { spoken = new Intl.ListFormat(locale, {style: 'narrow', type: 'unit'}).format(words); } catch { spoken = words.join(', '); }
 return {visible, spoken};
}
export interface FontManifest { version: string; faces: ReadonlyArray<{family:string; weight:number; asset:string; script:string; registration?:string}> }
export function nativeFont(manifest: FontManifest, family: string, weight: number, script = 'latin'): string {
 const face = manifest.faces.find(f=>f.family===family && f.weight===weight && f.script===script);
 if (!face) throw new Error(`Register a pinned ${family} ${weight} ${script} native face`);
 return face.registration??face.family;
}
