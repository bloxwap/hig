"use client";
import type {FeedbackSink,FeedbackIntent} from '@bloxwap/hig/contracts/feedback';
import React,{createContext,useContext,useEffect,useMemo,useState,useRef,useId} from 'react';
import {defaultEnvironment,presentNumberFormat,type Environment,type NumberFormatPresentation} from '@bloxwap/hig/contracts';
import {defaultMessages,resolveMessages,type HIGMessages} from '@bloxwap/hig/contracts/messages';
import {nativeSrgb,resolvePrimaryColor} from '@bloxwap/hig/tokens';
export type {HIGMessages} from '@bloxwap/hig/contracts/messages';
export type {NumberFormatPresentation} from '@bloxwap/hig/contracts';
/** The kind of pressable HIG control a press decoration is drawn in: `button` (Button and the block action buttons), `icon-button` (IconButton), `row` (a pressable ListRow, AssetBalanceRow or block row), `switch` (Switch and the setting switch rows) and `back` (the block header's Back, Close and address controls). */
export type PressDecorationKind='button'|'icon-button'|'row'|'switch'|'back';
export interface PressDecorationInfo {kind:PressDecorationKind;/** The control is disabled or busy and will not act on a press. */disabled:boolean}
export interface HIGContext extends Environment { onAccepted?: (id:string)=>void; feedback?:FeedbackSink; /** Brand accent as opaque sRGB hex (#RGB or #RRGGBB). Nested providers inherit it; omitted at the root, Bloxwap green applies. */ primaryColor?:string; /** Host translations of built-in copy, merged through nested providers. Components fall back to the English export per key; read the full resolved catalog with `useMessages()`. */ messages:Readonly<Partial<HIGMessages>>;
 /** Host content drawn inside every pressable HIG control, such as a native switch input that gives iOS Safari a haptic. It sits in an absolutely positioned layer over the control that changes no layout and catches no pointer events itself; its children do. Nested providers inherit it. Omitted, nothing is drawn. */
 pressDecoration?:(info:PressDecorationInfo)=>React.ReactNode;
 /** Money presentation merged under every currency format HIG draws: the blocks, BarMark, BarPnl, AssetBalanceRow, the swap pieces and the number readouts. Options a format sets itself win. Nested providers inherit it. */
 numberFormat?:NumberFormatPresentation }
export interface HIGProviderProps extends Partial<Omit<HIGContext,'messages'>> { /** Translations for HIG's built-in strings; omitted keys fall back to the enclosing provider, then English. */ messages?:Partial<HIGMessages> }
const Context=createContext<HIGContext>({...defaultEnvironment,messages:{}});
export function HIGProvider({children,density='comfortable',locale='en-US',direction='ltr',reducedMotion,onAccepted,feedback,primaryColor,messages,pressDecoration,numberFormat}:React.PropsWithChildren<HIGProviderProps>){
 const parent=useContext(Context);const inherited=parent.messages;const resolved=useMemo(()=>resolveMessages(inherited,messages),[inherited,messages]);
 const accent=primaryColor??parent.primaryColor;const theme=useMemo(()=>primaryStyle(accent),[accent]);
 const [osReduced,setOSReduced]=useState(false);
 useEffect(()=>{const query=window.matchMedia?.('(prefers-reduced-motion: reduce)');if(!query)return;const update=()=>setOSReduced(query.matches);update();query.addEventListener('change',update);return()=>query.removeEventListener('change',update);},[]);
 return <Context.Provider value={{density,locale,direction,reducedMotion:reducedMotion??osReduced,onAccepted,feedback,primaryColor:accent,messages:resolved,pressDecoration:pressDecoration??parent.pressDecoration,numberFormat:numberFormat??parent.numberFormat}}><div style={theme} data-hig-density={density} data-hig-motion={reducedMotion??osReduced?'reduced':'full'} dir={direction} lang={locale}>{children}</div></Context.Provider>;
}
export const useHIG=()=>useContext(Context);
/** Number options with the nearest provider's `numberFormat` merged under them; only currency formats change. */
export function usePresentNumber():<T extends Intl.NumberFormatOptions|undefined>(options:T)=>T {const {numberFormat}=useContext(Context);return useMemo(()=><T extends Intl.NumberFormatOptions|undefined>(options:T)=>presentNumberFormat(options,numberFormat),[numberFormat]);}
const interactive='a[href],button,input,select,textarea,label';
/**
 * The provider's press decoration for one control: the host content in an absolutely positioned layer that is the control's last
 * child, or nothing without a `pressDecoration`. Place it inside a host control to give it the same treatment as HIG's own.
 * For a control drawn as a `<label>` around its `input`, pass that input: a press on an interactive element in the layer skips
 * the label's own activation (the HTML label rules), so the layer hands the press to the input. A host `<label>` that names a
 * control is left alone, because the click it then sends to that control comes through next.
 */
export function PressDecoration({kind,disabled=false,input}:{kind:PressDecorationKind;disabled?:boolean;input?:React.RefObject<HTMLInputElement|null>}){
 const {pressDecoration}=useContext(Context);if(!pressDecoration)return null;
 const content=pressDecoration({kind,disabled});if(content==null||content===false)return null;
 const forward=input&&((event:React.MouseEvent<HTMLSpanElement>)=>{for(let node=event.target as Element|null;node&&node!==event.currentTarget;node=node.parentElement){if(!node.matches(interactive))continue;if(node!==input.current&&!(node instanceof HTMLLabelElement&&node.control))input.current?.click();return;}});
 return <span className='hig-press-decoration' data-kind={kind} onClick={forward||undefined}>{content}</span>;
}
function primaryStyle(primaryColor?:string):React.CSSProperties|undefined {
 if(primaryColor===undefined)return undefined;
 const colors=resolvePrimaryColor(primaryColor);
 return {'--hig-action':colors.action,'--hig-focus':colors.focus,'--hig-onAction':colors.onAction} as React.CSSProperties;
}
/** Scoped primary colour variables for host-owned portals outside the provider's DOM. */
export function useThemeStyle():React.CSSProperties|undefined {const {primaryColor}=useHIG();return useMemo(()=>primaryStyle(primaryColor),[primaryColor]);}
/** Resolved sRGB roles for canvas and host-drawn content. CSS retains the default wide-gamut palette. */
export function useColors():Readonly<Record<keyof typeof nativeSrgb,string>> {const {primaryColor}=useHIG();return useMemo(()=>primaryColor===undefined?nativeSrgb:{...nativeSrgb,...resolvePrimaryColor(primaryColor)},[primaryColor]);}
/** Complete built-in copy for the nearest HIGProvider: host translations over the English defaults. */
export function useMessages():HIGMessages{const overrides=useContext(Context).messages;return useMemo(()=>resolveMessages({...defaultMessages},overrides),[overrides]);}
/** Controlled values never silently switch to internal state. */
export function useControllable<T>(value:T|undefined,initial:T,onChange?: (value:T)=>void,intent:FeedbackIntent='selection'):[T,(next:T)=>void]{
 const [internal,setInternal]=useState(initial);const current=value===undefined?internal:value;
 const {feedback}=useHIG();const id=useId();const sequence=useRef(0);const pending=useRef<{value:T}|null>(null);
 useEffect(()=>{const request=pending.current;if(!request)return;pending.current=null;if(Object.is(current,request.value)){try{feedback?.emit({id:`${id}/${++sequence.current}`,source:id,intent,origin:'programmatic'});}catch{/* Effects remain optional. */}}});
 return [current,(next)=>{if(Object.is(current,next))return;pending.current={value:next};if(value===undefined)setInternal(next);onChange?.(next);}];
}
