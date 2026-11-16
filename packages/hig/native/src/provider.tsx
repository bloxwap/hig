import type {FeedbackSink,FeedbackIntent} from '@bloxwap/hig/contracts/feedback';
import React,{createContext,useContext,useEffect,useMemo,useState,useRef,useId} from 'react';
import {AccessibilityInfo,I18nManager,Platform} from 'react-native';
import {nativeSrgb,nativeDisplayP3,resolvePrimaryColor} from '@bloxwap/hig/tokens';
import {defaultEnvironment,numberLocale,presentNumberFormat,type Environment,type NumberFormatPresentation} from '@bloxwap/hig/contracts';
export type {NumberFormatPresentation} from '@bloxwap/hig/contracts';
import {defaultMessages,resolveMessages,type HIGMessages} from '@bloxwap/hig/contracts/messages';
export type {HIGMessages} from '@bloxwap/hig/contracts/messages';
/** Direction of a host-supplied locale (for example expo-localization's `getLocales()[0]`) for `HIGProvider direction`; see #86. */
export {localeDirection,type HostLocale} from '@bloxwap/hig/contracts';
/** Colour space the host paints React Native colours in. `display-p3` is for iOS hosts whose React Native default colour space is Display P3 (an app delegate `defaultColorSpace()` override); there HIG paints its generated `nativeDisplayP3` table (`nativeColors.iosDisplayP3`). Android and web stay sRGB, because HIG publishes no other table for them. */
export type HIGColorSpace='srgb'|'display-p3';
/** Roles of HIG's generated colour tables (`colorTable`). */
export type HIGTableColorRole=keyof typeof nativeSrgb;
/** Market-direction roles: `up` (rising, long, gain) and `down` (falling, short, loss). They default to `buy` and `sell`; `HIGProvider marketColors` overrides them. */
export type HIGMarketColorRole='up'|'down';
/** Semantic token roles every native component paints from. */
export type HIGColorRole=HIGTableColorRole|HIGMarketColorRole;
/** Native colour roles, including any provider primary colour and market colour override. */
export type HIGColors=Readonly<Record<HIGColorRole,string>>;
/** Host colours for the market-direction roles, in the provider's colour space (for example `#rrggbb` Display P3 channels on an iOS P3 host). An omitted role keeps `buy`/`sell`. */
export interface HIGMarketColors {up?:string;down?:string}
/** HIG's table for a colour space and platform: `nativeDisplayP3` for `display-p3` on iOS, sRGB everywhere else (including unknown values from untyped JS). */
export function colorTable(colorSpace?:HIGColorSpace,os:string=Platform.OS):Readonly<Record<HIGTableColorRole,string>>{return colorSpace==='display-p3'&&os==='ios'?nativeDisplayP3:nativeSrgb;}
export interface HIGContext extends Environment {/** Brand accent as opaque sRGB hex (#RGB or #RRGGBB), inherited by nested providers. */primaryColor?:string;/** Market-direction colours for `up`/`down`; inherited by nested providers, like `primaryColor`. */marketColors?:HIGMarketColors;onAccepted?:(id:string)=>void;feedback?:FeedbackSink;fontFamily?:string;fontFamilies?:Readonly<Record<string,string>>;/** Registered static companion faces by script and weight. Text selects the detected script and nearest registered weight. */fontFamiliesByScript?:Readonly<Partial<Record<'latin'|'ko'|'zh',Readonly<Record<string,string>>>>>;/** Registered monospace face for code/commands, e.g. BloxwapMonoRegular. */monoFontFamily?:string;/** Default Dynamic Type / font-scale cap for HIG Text; a Text prop overrides it. Leave unset for prose. */maxFontSizeMultiplier?:number;/** Per-script letter spacing in em for Korean and Chinese companion faces; overrides `scriptLetterSpacing`. */letterSpacingByScript?:Readonly<Partial<Record<'ko'|'zh',number>>>;/** Colour space HIG paints in; defaults to `srgb` and is inherited by nested providers. Read the resolved table with `useColors()`. */colorSpace:HIGColorSpace;/** Money presentation merged under every currency format HIG draws: the blocks, BarMark, BarPnl, AssetBalanceRow, the swap pieces and the number readouts. Options a format sets itself win. Nested providers inherit it. */numberFormat?:NumberFormatPresentation;/** Host translations of built-in copy, merged through nested providers. Components fall back to the English export per key; read the full resolved catalog with `useMessages()`. */messages:Readonly<Partial<HIGMessages>>}
export interface HIGProviderProps extends Partial<Omit<HIGContext,'messages'>> {/** `display-p3` selects HIG's iosDisplayP3 table on iOS for hosts that set React Native's default colour space to Display P3; omitted, the enclosing provider's value (else `srgb`) applies. */colorSpace?:HIGColorSpace;/** Translations for HIG's built-in strings; omitted keys fall back to the enclosing provider, then English. */messages?:Partial<HIGMessages>}
const Context=createContext<HIGContext>({...defaultEnvironment,direction:I18nManager.isRTL?'rtl':'ltr',colorSpace:'srgb',messages:{}});
/** Market-direction roles default to `buy`/`sell`; a host whose convention differs (KRX, A-share) overrides them through `HIGProvider marketColors`. */
function withMarketRoles(table:Readonly<Record<HIGTableColorRole,string>>,up?:string,down?:string):HIGColors{return {...table,up:up??table.buy,down:down??table.sell};}
const marketColor=(value:unknown)=>typeof value==='string'&&value!==''?value:undefined;
// Providers without an accent or market override share one table per colour space, so their colours keep a stable identity.
const srgbColors=withMarketRoles(nativeSrgb),displayP3Colors=withMarketRoles(nativeDisplayP3);
const ColorsContext=createContext<HIGColors>(srgbColors);
/** Direction defaults to the OS layout direction (I18nManager) so HIG roots never force LTR inside an RTL app. React Native 0.83 Android does not report a per-app RTL locale through I18nManager (#86): RTL hosts pass `direction={localeDirection(getLocales()[0])}`. Hosts that disallow RTL leave `direction` unset. */
export function HIGProvider({children,density='comfortable',locale='en-US',direction=I18nManager.isRTL?'rtl':'ltr',reducedMotion,onAccepted,feedback,fontFamily,fontFamilies,fontFamiliesByScript,monoFontFamily,maxFontSizeMultiplier,letterSpacingByScript,colorSpace,primaryColor,marketColors,messages,numberFormat}:React.PropsWithChildren<HIGProviderProps>){
 const parent=useContext(Context);const inherited=parent.messages;const resolved=useMemo(()=>resolveMessages(inherited,messages),[inherited,messages]);
 const accent=primaryColor??parent.primaryColor;const normalized=useMemo(()=>accent===undefined?undefined:resolvePrimaryColor(accent).action,[accent]);
 const space=colorSpace??parent.colorSpace;const baseColors=colorTable(space);
 const market=marketColors??parent.marketColors;const marketUp=marketColor(market?.up),marketDown=marketColor(market?.down);
 const inheritedMarket=useMemo(()=>marketUp===undefined&&marketDown===undefined?undefined:{up:marketUp,down:marketDown},[marketUp,marketDown]);
 const colors=useMemo(()=>normalized===undefined&&marketUp===undefined&&marketDown===undefined?baseColors===nativeDisplayP3?displayP3Colors:srgbColors:withMarketRoles(normalized===undefined?baseColors:{...baseColors,...resolvePrimaryColor(normalized,space==='display-p3'&&Platform.OS==='ios'?'display-p3':'srgb')},marketUp,marketDown),[baseColors,space,normalized,marketUp,marketDown]);
 const [osReduced,setOSReduced]=useState(false);
 useEffect(()=>{let alive=true;void AccessibilityInfo.isReduceMotionEnabled().then(v=>{if(alive)setOSReduced(v);}).catch(()=>{});const sub=AccessibilityInfo.addEventListener('reduceMotionChanged',setOSReduced);return()=>{alive=false;sub.remove();};},[]);
 return <Context.Provider value={{density,locale,direction,reducedMotion:reducedMotion??osReduced,onAccepted,feedback,fontFamily,fontFamilies,fontFamiliesByScript:fontFamiliesByScript??parent.fontFamiliesByScript,monoFontFamily,maxFontSizeMultiplier,letterSpacingByScript,colorSpace:space,primaryColor:normalized,marketColors:inheritedMarket,messages:resolved,numberFormat:numberFormat??parent.numberFormat}}><ColorsContext.Provider value={colors}>{children}</ColorsContext.Provider></Context.Provider>;
}
export const useHIG=()=>useContext(Context);
/** Number options with the nearest provider's `numberFormat` merged under them; only currency formats change. */
export function usePresentNumber():<T extends Intl.NumberFormatOptions|undefined>(options:T)=>T {const {numberFormat}=useContext(Context);return useMemo(()=><T extends Intl.NumberFormatOptions|undefined>(options:T)=>presentNumberFormat(options,numberFormat),[numberFormat]);}
/** The locale numbers are formatted in: the nearest provider's `numberFormat.locale`, else its `locale`. */
export function useNumberLocale():string{const {locale,numberFormat}=useContext(Context);return numberLocale(locale,numberFormat);}
const RaisedContext=createContext(false);
/** Marks content that sits on a Surface, Dialog or sheet. HIG has no resting strokes, so wells inside step up one fill to stay visible. */
export function Raised({children}:React.PropsWithChildren){return <RaisedContext.Provider value={true}>{children}</RaisedContext.Provider>;}
/** Fills for the current elevation: `well` for inputs, tracks and neutral chips; `raised` for what sits on a well (a selected segment). On the page they are `surface` and `nested`; inside a Surface, Dialog or sheet, `nested` and `border`. */
export function useFills():{well:string;raised:string}{const colors=useContext(ColorsContext);return useContext(RaisedContext)?{well:colors.nested,raised:colors.border}:{well:colors.surface,raised:colors.nested};}
/** The nearest HIGProvider's colour table (sRGB by default). Every HIG native component paints through this; hosts may read it for their own views. */
export function useColors():HIGColors{return useContext(ColorsContext);}
/** Approved Bloxwap brand colours in the host's colour space, independent of a product accent. */
/** The colour space this subtree actually paints in: `display-p3` only when a provider asked for it on iOS, as in `colorTable`; otherwise `srgb`. */
export function useColorSpace():HIGColorSpace{return useContext(Context).colorSpace==='display-p3'&&Platform.OS==='ios'?'display-p3':'srgb';}
export function useBrandColors():Readonly<Record<HIGTableColorRole,string>>{return colorTable(useContext(Context).colorSpace);}
/** Complete built-in copy for the nearest HIGProvider: host translations over the English defaults. */
export function useMessages():HIGMessages{const overrides=useContext(Context).messages;return useMemo(()=>resolveMessages({...defaultMessages},overrides),[overrides]);}
/** Controlled values never silently switch to internal state. `intent: null` commits without provider feedback. */
export function useControllable<T>(value:T|undefined,initial:T,onChange?: (value:T)=>void,intent:FeedbackIntent|null='selection'):[T,(next:T)=>void]{
 const [internal,setInternal]=useState(initial);const current=value===undefined?internal:value;
 const {feedback}=useHIG();const id=useId();const sequence=useRef(0);const pending=useRef<{value:T}|null>(null);
 useEffect(()=>{const request=pending.current;if(!request)return;pending.current=null;if(intent&&Object.is(current,request.value)){try{feedback?.emit({id:`${id}/${++sequence.current}`,source:id,intent,origin:'native'});}catch{/* Effects remain optional. */}}});
 return [current,(next)=>{if(Object.is(current,next))return;pending.current={value:next};if(value===undefined)setInternal(next);onChange?.(next);}];
}
