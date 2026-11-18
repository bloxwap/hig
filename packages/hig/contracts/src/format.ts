// Display formatting for numbers, clocks and countdowns. Components that draw figures import this module; `./environment.js` holds
// what every provider needs.
const defaultNumberOptions: Intl.NumberFormatOptions = Object.freeze({});
const numberFormatters = new Map<string, Intl.NumberFormat>();
let formatterConstructor: typeof Intl.NumberFormat | undefined;

function numberFormatter(locale: string, options: Intl.NumberFormatOptions): Intl.NumberFormat {
 const ctor = Intl.NumberFormat;
 if (ctor !== formatterConstructor) {
  numberFormatters.clear();
  formatterConstructor = ctor;
 }
 let key: string;
 if (options === defaultNumberOptions && typeof locale === 'string') {
  key = 'default:' + locale;
 } else {
  const prototype = Object.getPrototypeOf(options);
  if (typeof locale !== 'string' || (prototype !== Object.prototype && prototype !== null)) return new ctor(locale, options);

  // Snapshot primitive options so callers can reuse or mutate their options object.
  const parts: unknown[] = [locale];
  for (const name of Object.getOwnPropertyNames(options)) {
   const descriptor = Object.getOwnPropertyDescriptor(options, name)!;
   if (!('value' in descriptor)) return new ctor(locale, options);
   const value = descriptor.value;
   if (value === undefined) continue;
   if (typeof value !== 'string' && typeof value !== 'boolean' && !(typeof value === 'number' && Number.isFinite(value))) return new ctor(locale, options);
   parts.push(name, value);
  }
  if (parts.length === 1) {
   key = 'default:' + locale;
  } else if (parts.length === 5 && parts[1] === 'style' && parts[2] === 'currency'
    && parts[3] === 'currency' && typeof parts[4] === 'string' && parts[4].length === 3) {
   // The fixed-width currency code keeps this key unambiguous for every locale.
   key = 'currency:' + parts[4] + locale;
  } else {
   key = JSON.stringify(parts);
  }
 }
 const cached = numberFormatters.get(key);
 if (cached) return cached;
 const formatter = new ctor(locale, options);
 if (numberFormatters.size >= 64) numberFormatters.delete(numberFormatters.keys().next().value!);
 numberFormatters.set(key, formatter);
 return formatter;
}
/**
 * Display only. Keep raw decimal strings in transaction logic. A `signDisplay` the runtime's Intl ignores (Hermes on iOS draws
 * `12.34%` for `exceptZero`) is composed by {@link formatSignedNumber}, so every engine draws the same string; engines whose Intl
 * honours it format exactly as before.
 */
export function formatNumber(value: number | null | undefined, locale = 'en-US', options: Intl.NumberFormatOptions = defaultNumberOptions): string {
 if (value == null || !Number.isFinite(value)) return '—';
 const sign = options.signDisplay as SignDisplay | undefined;
 try { return sign !== undefined && sign !== 'auto' && !intlSignDisplaySupported(sign) ? formatSignedNumber(value, locale, options) : numberFormatter(locale, options).format(value); } catch { return '—'; }
}
/** `Intl.NumberFormatOptions['signDisplay']`, with ES2023's `negative`, which the TypeScript lib in use may not list. */
export type SignDisplay = NonNullable<Intl.NumberFormatOptions['signDisplay']> | 'negative';
const signSupport = new Map<string, boolean>();
/** Whether this runtime's `Intl.NumberFormat` draws `signDisplay` (each mode is checked once, in decimal, currency and percent). */
export function intlSignDisplaySupported(mode: SignDisplay): boolean {
 const known = signSupport.get(mode);
 if (known !== undefined) return known;
 const expected: Record<string, ReadonlyArray<readonly [number, string, string, string]>> = {
  always: [[1, '+1', '+$1.00', '+100%'], [0, '+0', '+$0.00', '+0%'], [-1, '-1', '-$1.00', '-100%']],
  exceptZero: [[1, '+1', '+$1.00', '+100%'], [0, '0', '$0.00', '0%'], [-0, '0', '$0.00', '0%'], [-1, '-1', '-$1.00', '-100%']],
  negative: [[1, '1', '$1.00', '100%'], [-0, '0', '$0.00', '0%'], [-1, '-1', '-$1.00', '-100%']],
  never: [[1, '1', '$1.00', '100%'], [-1, '1', '$1.00', '100%']],
 };
 let supported = false;
 try {
  const cases = expected[mode];
  if (cases) {
   const signed = (options: Intl.NumberFormatOptions) => new Intl.NumberFormat('en-US', {...options, signDisplay: mode} as Intl.NumberFormatOptions);
   const decimal = signed({}), money = signed({style: 'currency', currency: 'USD'}), share = signed({style: 'percent'});
   supported = cases.every(([value, plain, usd, percent]) => decimal.format(value) === plain && money.format(value) === usd && share.format(value) === percent);
  }
 } catch { supported = false; }
 signSupport.set(mode, supported);
 return supported;
}
const zeroReadings=new WeakMap<Intl.NumberFormat,string>();
const minusSign = /[-−‐-―﹣－]/u;
/**
 * `Intl.NumberFormat` with `signDisplay`, composed without asking Intl to draw the sign: the magnitude and the locale's own negative
 * form are formatted with `signDisplay` left out, and a plus takes the minus sign's place, so the sign keeps its side of the currency
 * sign, percent sign and digits and any bidi marks around it (`+$12.50`, `12,50 $` → `+12,50 $`, `$+12.50` in de-CH, `؜+١٢` in
 * Arabic). Zero follows the rounded figure: `exceptZero` draws `0.00` for 0.001 at two places, as Intl does. Where the negative form
 * has no minus (accounting parentheses), the locale's plus leads the positive form. Matches ICU's output for decimal, currency,
 * percent, unit and compact formats; display only.
 */
export function formatSignedNumber(value: number | null | undefined, locale = 'en-US', options: Intl.NumberFormatOptions = defaultNumberOptions): string {
 if (value == null || !Number.isFinite(value)) return '—';
 if (options === defaultNumberOptions) {
  let formatter: Intl.NumberFormat;
  try { formatter = numberFormatter(locale, options); } catch { return '—'; }
  return formatter.format(value);
 }
 const {signDisplay: requested, ...rest} = options, signDisplay = requested as SignDisplay | undefined;
 let formatter:Intl.NumberFormat;try{formatter=numberFormatter(locale,rest);}catch{return '—';}
 if (signDisplay === undefined || signDisplay === 'auto') return formatter.format(value);
 const magnitude=Math.abs(value),negative=value<0||Object.is(value,-0);
 if(signDisplay==='never'){
  const {currencySign,...plain}=rest;
  return (currencySign===undefined?formatter:numberFormatter(locale,plain)).format(magnitude);
 }
 if(signDisplay==='always'&&negative)return formatter.format(value);
 if(signDisplay==='negative'&&!negative)return formatter.format(value);
 let absolute:string|undefined;
 if(signDisplay==='negative'||signDisplay==='exceptZero'){
  absolute=formatter.format(magnitude);
  let zero=zeroReadings.get(formatter);
  if(zero===undefined){zero=formatter.format(0);zeroReadings.set(formatter,zero);}
  if(absolute===zero)return absolute;
  if(negative)return formatter.format(value);
 }else if(signDisplay!=='always')return formatter.format(value);
 const minus=formatter.format(-magnitude),at=minus.search(minusSign);
 if(at>=0)return `${minus.slice(0,at)}+${minus.slice(at+1)}`;
 const digits=numberFormatter(locale,{maximumFractionDigits:0,useGrouping:false}),sign=digits.format(-1).replace(digits.format(1),'');
 return `${minusSign.test(sign)?sign.replace(minusSign,'+'):'+'}${absolute??formatter.format(magnitude)}`;
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
const clockFormatters = new Map<string, Intl.DateTimeFormat>();
let clockConstructor: typeof Intl.DateTimeFormat | undefined;

function defaultClockFormatter(locale: string, timeZone: string): Intl.DateTimeFormat {
 const ctor = Intl.DateTimeFormat;
 if (clockConstructor !== ctor) {
  clockFormatters.clear();
  clockConstructor = ctor;
 }
 const key = JSON.stringify([locale, timeZone]);
 const cached = clockFormatters.get(key);
 if (cached) return cached;
 const formatter = new ctor(locale, {timeZoneName: 'short', hour: 'numeric', minute: '2-digit', timeZone});
 if (clockFormatters.size >= 64) clockFormatters.delete(clockFormatters.keys().next().value!);
 clockFormatters.set(key, formatter);
 return formatter;
}
/** Clock display for funding and other protocol instants. The host must name the zone; the zone name is always shown. Unknown → `—`. */
export function formatZonedTime(value: Date | number | null | undefined, locale: string, timeZone: string, options?: Intl.DateTimeFormatOptions): string {
 const time = value instanceof Date ? value.getTime() : value;
 if (time == null || !Number.isFinite(time) || Math.abs(time)>8640000000000000) return '—';
 try {
  const formatter = options === undefined ? defaultClockFormatter(locale, timeZone) : new Intl.DateTimeFormat(locale, {timeZoneName: 'short', ...options, timeZone});
  return formatter.format(time);
 } catch { return '—'; }
}
/** Font 0.1.2 publishes CSS/Next loaders, native faces are derived by the optional pinned HIG font generator. */
/** Formats one unit with Intl (`2 hours`, `1d`), falling back to plain digits and the unit name where the runtime lacks unit formatting. */
function formatUnit(value: number, unit: 'day' | 'hour' | 'minute' | 'second', locale: string, unitDisplay: 'long' | 'narrow'): string {
 try { return numberFormatter(locale, {style: 'unit', unit, unitDisplay}).format(value); }
 catch { return unitDisplay === 'narrow' ? `${value}${unit[0]}` : `${value} ${unit}${value === 1 ? '' : 's'}`; }
}
interface CountdownWords {spoken:string;dayPrefix:string}
interface CountdownLocale {list:Intl.ListFormat|null;readings:Map<number,CountdownWords>}
const countdownLocales=new Map<string,CountdownLocale>();
let countdownNumberConstructor:typeof Intl.NumberFormat|undefined;
let countdownListConstructor:typeof Intl.ListFormat|undefined;

function countdownWords(total:number,days:number,hours:number,minutes:number,locale:string):CountdownWords{
 const numberConstructor=globalThis.Intl?.NumberFormat,listConstructor=globalThis.Intl?.ListFormat;
 if(countdownNumberConstructor!==numberConstructor||countdownListConstructor!==listConstructor){
  countdownLocales.clear();
  countdownNumberConstructor=numberConstructor;
  countdownListConstructor=listConstructor;
 }
 let formats=countdownLocales.get(locale);
 if(!formats){
  let list:Intl.ListFormat|null=null;
  try{if(listConstructor)list=new listConstructor(locale,{style:'narrow',type:'unit'});}catch{/* Use comma-separated units on older runtimes. */}
  formats={list,readings:new Map()};
  if(countdownLocales.size>=16)countdownLocales.delete(countdownLocales.keys().next().value!);
  countdownLocales.set(locale,formats);
 }
 // Sub-minute clocks speak seconds. All other readings are identical for one whole minute.
 const bucket=total<60?total:Math.floor(total/60)*60;
 const cached=formats.readings.get(bucket);
 if(cached)return cached;
 const words=total<60?[formatUnit(total,'second',locale,'long')]:[
  days?formatUnit(days,'day',locale,'long'):'',
  hours?formatUnit(hours,'hour',locale,'long'):'',
  minutes?formatUnit(minutes,'minute',locale,'long'):'',
 ].filter(Boolean);
 let spoken:string;
 try{spoken=formats.list?formats.list.format(words):words.join(', ');}catch{spoken=words.join(', ');}
 const result={spoken,dayPrefix:days?formatUnit(days,'day',locale,'narrow')+' ':''};
 if(formats.readings.size>=128)formats.readings.delete(formats.readings.keys().next().value!);
 formats.readings.set(bucket,result);
 return result;
}
/**
 * Time left until a market opens, rounded up to the second. `visible` is a clock: `2:14:33`, or `1d 04:12:09` past a day.
 * `spoken` names the largest units in words without seconds (`2 hours, 14 minutes`), so it changes once a minute and is
 * calm in an accessible name; under a minute it reads the seconds. Negative time reads as zero.
 */
export function formatCountdown(remainingMs: number, locale = 'en-US'): {visible: string; spoken: string} {
 if(!Number.isFinite(remainingMs))return {visible:'—',spoken:'—'};
 const total = Math.max(0, Math.ceil(remainingMs / 1000));
 const days = Math.floor(total / 86400), hours = Math.floor(total % 86400 / 3600), minutes = Math.floor(total % 3600 / 60), seconds = total % 60;
 const pad = (n: number) => String(n).padStart(2, '0');
 const {dayPrefix,spoken}=countdownWords(total,days,hours,minutes,locale);
 const visible=`${dayPrefix}${days?pad(hours):hours}:${pad(minutes)}:${pad(seconds)}`;
 return {visible,spoken};
}
/** Publish whole seconds remaining to an epoch-millisecond deadline, including zero at expiry. */
export function watchCountdown(at:number,publish:(seconds:number|null)=>void):()=>void {
 let timer:ReturnType<typeof setTimeout>;
 function tick(){
  const remaining=at-Date.now();
  if(!Number.isFinite(remaining)){publish(null);return;}
  const seconds=Math.max(0,Math.ceil(remaining/1000));
  publish(seconds);
  if(seconds>0)timer=setTimeout(tick,remaining-(seconds-1)*1000);
 }
 tick();
 return ()=>clearTimeout(timer);
}
