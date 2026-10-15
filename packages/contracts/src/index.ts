export type Density = 'comfortable' | 'compact';
export type Intent = 'primary' | 'secondary' | 'destructive' | 'ghost';
export type Direction = 'ltr' | 'rtl';
export interface Environment { density: Density; locale: string; direction: Direction; reducedMotion: boolean }
export const defaultEnvironment: Environment = {density:'comfortable',locale:'en-US',direction:'ltr',reducedMotion:false};
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
export interface FontManifest { version: string; faces: ReadonlyArray<{family:string; weight:number; asset:string; script:string; registration?:string}> }
export function nativeFont(manifest: FontManifest, family: string, weight: number, script = 'latin'): string {
 const face = manifest.faces.find(f=>f.family===family && f.weight===weight && f.script===script);
 if (!face) throw new Error(`Register a pinned ${family} ${weight} ${script} native face`);
 return face.registration??face.family;
}
export {defaultMessages,resolveMessages,type HIGMessages} from './messages.js';
