"use client";
import React,{useCallback,useEffect,useLayoutEffect,useRef,useState} from 'react';
import * as Modal from '@radix-ui/react-dialog';
import * as en from '@bloxwap/hig/contracts/messages';
import {SHEET_CLOSE,SHEET_RESIZE,SHEET_SCROLL_LOCK,SHEET_VIEW_ENTER,SHEET_VIEW_SCALE,validateSnapPoints} from '@bloxwap/hig/contracts/gesture-sheet';
import {useHIG,useThemeStyle} from './provider.js';
import {Button} from './button.js';
import type {DialogProps,DialogContentProps} from './dialog.js';
import {SheetEngine,cssCurve,cssNumber,sharedPoint,type SheetDirection,type SheetPoint} from './gesture-sheet-engine.js';

/** Options of HIG's sheet engine. HIG owns the controlled modal root, so `open`, `onOpenChange`, `modal` and nesting are not among them. */
interface EngineOptions {
 /** The edge the sheet rests on and closes toward: physical, independent of the text direction. Default `'bottom'`. */
 direction?:SheetDirection;
 /** Only the handle drags the sheet. Default `false`. */
 handleOnly?:boolean;
 /** `false` stops Escape, an outside press, the close button and a drag from asking to close; a drag past the lowest detent resists. Default `true`. */
 dismissible?:boolean;
 /** Share of the way from the lowest detent to closed past which a release closes. Default `0.25`. */
 closeThreshold?:number;
 /** Milliseconds after the content scrolls during which a drag does not move the sheet. Default `100`. */
 scrollLockTimeout?:number;
 /** Keep a bottom sheet above the software keyboard while a field in it is focused. Default `true`. */
 repositionInputs?:boolean;
 /** With `repositionInputs`: shorten the sheet by the keyboard and keep its top edge, instead of letting it ride up. */
 fixed?:boolean;
 /** With `repositionInputs`, on iOS: focus fields without letting the page scroll to them. Default `true`. */
 disablePreventScroll?:boolean;
 /** Scale the page inside `[data-hig-sheet-wrapper]` back while the sheet is open. Default `false`. */
 shouldScaleBackground?:boolean;
 /** With `shouldScaleBackground`: paint the body black behind the scaled page. Default `true`. */
 setBackgroundColorOnScale?:boolean;
 /** Leave the body's inline styles alone: no black background and no Safari position pin. */
 noBodyStyles?:boolean;
 /** After the Safari position pin, do not restore the page scroll when the URL changed while the sheet was open. */
 preventScrollRestoration?:boolean;
 /** Let the sheet focus its first focusable element when it opens. Default `false`. */
 autoFocus?:boolean;
 /** Portal target. Percentage detents and the closed position are measured in it instead of the viewport. */
 container?:HTMLElement|null;
 /** Each pointer move of a drag. `percentageDragged` is the share of the overlay that has faded: 0 at the fade detent, 1 at closed. */
 onDrag?:(event:React.PointerEvent<HTMLDivElement>,percentageDragged:number)=>void;
 /** The end of a drag, with whether the sheet stays open. */
 onRelease?:(event:React.PointerEvent<HTMLDivElement>,open:boolean)=>void;
 /** An open or close the sheet asked for and the host accepted has finished moving. */
 onAnimationEnd?:(open:boolean)=>void;
}
interface SnapOptions {
 /** The detent the sheet rests on, one of `snapPoints`. Omitted, the sheet keeps its own and starts on the first. */
 activeSnapPoint?:SheetPoint|null;
 setActiveSnapPoint?:(snapPoint:SheetPoint|null)=>void;
 /** A fast release steps one detent instead of going to the tallest or closing. Default `false`. */
 snapToSequentialPoint?:boolean;
}
/** Detents from the least visible up: a number is a share of the viewport (`0.4`), a string is CSS pixels (`'320px'`). The overlay is drawn from `fadeFromIndex` up, the last detent by default. */
type FadeOptions={snapPoints:SheetPoint[];fadeFromIndex:number}|{snapPoints?:SheetPoint[];fadeFromIndex?:never};
export type GestureSheetBackendProps=EngineOptions&SnapOptions&FadeOptions;
type SnapPointBackendProp='snapPoints'|'snapPoint'|'activeSnapPoint'|'setActiveSnapPoint'|'fadeFromIndex'|'snapToSequentialPoint';
export type GestureSheetDynamicBackendProps=EngineOptions&{[Key in SnapPointBackendProp]?:never};
export type GestureSheetContentProps = DialogContentProps & {[key:`data-${string}`]:string|number|boolean|undefined};
export type GestureSheetHandleProps = Omit<React.ComponentPropsWithoutRef<'div'>,'children'|'aria-hidden'|'dangerouslySetInnerHTML'|'onClick'|'onPointerDown'|'onPointerMove'|'onPointerCancel'>&{/** A press on the handle does not step to the next detent. */preventCycle?:boolean};
export type GestureSheetOverlayProps = Omit<React.ComponentPropsWithoutRef<typeof Modal.Overlay>,'children'|'asChild'|'forceMount'|'dangerouslySetInnerHTML'>;
interface GestureSheetCommonProps extends Omit<DialogProps,'contentProps'> {
 contentProps?:GestureSheetContentProps;
 /** Default anatomy pads and scrolls the card; custom anatomy leaves layout and scrolling to the host. */
 contentMode?:'default'|'custom';
 /** The drag handle is included by default. */
 handle?:boolean;
 handleProps?:GestureSheetHandleProps;
 handleRef?:React.Ref<HTMLDivElement>;
 overlayProps?:GestureSheetOverlayProps;
 /** `id` of a heading inside the sheet that names it, such as a block's `headingId`: the sheet is then named by that heading (`aria-labelledby`) and its own `title` is kept in the dialog but hidden from assistive technology, so the name is read once. */
 labelledBy?:string;
}
export type GestureSheetProps=GestureSheetCommonProps&(
 /** Engine defaults apply, including autoFocus=false and repositionInputs=true. */
 {enableDynamicSizing?:false;backendProps?:GestureSheetBackendProps;maxDynamicContentSize?:never}
 /** Vertical content sizing is intrinsic and cannot be combined with detents. */
 |{enableDynamicSizing:true;backendProps?:GestureSheetDynamicBackendProps;/** A finite positive content-height ceiling in CSS pixels; the viewport ceiling still applies. */maxDynamicContentSize?:number}
);
const OWNED_CONTENT=new Set(['children','asChild','forceMount','role','dir','lang','id','ref','aria-labelledby','aria-describedby','dangerouslySetInnerHTML']);
const OWNED_ROOT=new Set(['children','open','defaultOpen','onOpenChange','modal','nested','onClose']);
const OWNED_OVERLAY=new Set(['children','asChild','forceMount','ref','dangerouslySetInnerHTML']);
const OWNED_HANDLE=new Set(['children','aria-hidden','ref','dangerouslySetInnerHTML','onClick','onPointerDown','onPointerMove','onPointerCancel']);
const OWNED_SHEET_DATA=new Set(['data-hig-sheet','data-hig-sheet-direction','data-hig-sheet-snap-points','data-hig-sheet-overlay','data-hig-sheet-handle','data-hig-sheet-handle-hitarea','data-hig-sheet-dragging','data-hig-sheet-overshoot']);
const DYNAMIC_BACKEND=new Set<SnapPointBackendProp>(['snapPoints','snapPoint','activeSnapPoint','setActiveSnapPoint','fadeFromIndex','snapToSequentialPoint']);
const safeProps=<Props extends object>(props:Props|undefined,owned:Set<string>)=>Object.fromEntries(Object.entries(props??{}).filter(([key])=>!owned.has(key)&&!OWNED_SHEET_DATA.has(key))) as Props;
// One curve for the height and both views: no spring and no overshoot, a short ease in and a long ease out.
const VIEW_SWAP:KeyframeAnimationOptions={duration:SHEET_RESIZE.duration,easing:cssCurve(SHEET_RESIZE.curve)};
const VIEW_SMALL=`scale(${cssNumber(SHEET_VIEW_SCALE)})`;
const useCommitEffect=typeof window==='undefined'?useEffect:useLayoutEffect;
function useDynamicHeight(open:boolean,reducedMotion:boolean){
 const cleanup=useRef<(()=>void)|null>(null);
 return useCallback((content:HTMLDivElement|null)=>{
  cleanup.current?.();cleanup.current=null;
  const card=content?.parentElement;if(!open||!content||!card)return;
  let previous:number|null=null;
  let running:{animation:Animation;from:number;to:number;minHeight:string}|null=null;
  const cancel=()=>{
   if(!running)return;
   const {animation,minHeight}=running;running=null;
   animation.onfinish=animation.oncancel=null;
   animation.cancel();card.style.minHeight=minHeight;
  };
  const measure=(entries?:ResizeObserverEntry[])=>{
   const next=entries?.[0]?.borderBoxSize?.[0]?.blockSize??content.getBoundingClientRect().height;
   if(previous!==null&&Math.abs(previous-next)<.5)return;
   let from=previous;previous=next;
   if(running){
    const progress=running.animation.effect?.getComputedTiming().progress??0;
    from=running.from+(running.to-running.from)*progress;
    cancel();
   }
   if(from===null||Math.abs(from-next)<.5||reducedMotion||card.style.height||typeof card.animate!=='function')return;
   // Keep the larger surface behind the content. Move its visible edge into place with `translate`,
   // without resizing the scroll container on every frame or touching the engine's drag `transform`.
   const extent=Math.max(from,next),sign=card.dataset.higSheetDirection==='top'?-1:1;
   const minHeight=card.style.minHeight;
   if(from>next)card.style.minHeight=`${extent}px`;
   const animation=card.animate([{translate:`0 ${sign*(extent-from)}px`},{translate:`0 ${sign*(extent-next)}px`}],{...VIEW_SWAP,fill:'both'});
   running={animation,from,to:next,minHeight};
   animation.onfinish=animation.oncancel=()=>{if(running?.animation===animation)cancel();};
  };
  const resize=typeof ResizeObserver==='undefined'?null:new ResizeObserver(measure);resize?.observe(content,{box:'border-box'});measure();
  // `repositionInputs` writes an inline height while the keyboard is up; the sheet is then sized by it, not by its content.
  const inline=typeof MutationObserver==='undefined'?null:new MutationObserver(()=>{if(card.style.height)cancel();});inline?.observe(card,{attributes:true,attributeFilter:['style']});
  cleanup.current=()=>{resize?.disconnect();inline?.disconnect();cancel();};
 },[open,reducedMotion]);
}

/**
 * Optional web gesture sheet: a Radix modal dialog moved by HIG's own drag engine. It needs `@radix-ui/react-dialog`; the
 * core overlay entry never imports it.
 */
export function GestureSheet({open,onOpenChange,title,description,trigger,children,titleHidden,descriptionHidden,contentProps,contentRef,closeButton,closeLabel,backendProps,contentMode='default',handle=true,handleProps,handleRef,overlayProps,enableDynamicSizing=false,maxDynamicContentSize,labelledBy}:GestureSheetProps){
 if(enableDynamicSizing&&Object.entries(backendProps??{}).some(([key,value])=>value!==undefined&&DYNAMIC_BACKEND.has(key as SnapPointBackendProp)))throw new Error('Dynamic GestureSheet does not accept snap-point props.');
 if(maxDynamicContentSize!==undefined&&(!Number.isFinite(maxDynamicContentSize)||maxDynamicContentSize<=0))throw new Error('GestureSheet maxDynamicContentSize must be finite and greater than zero.');
 const {messages,direction,locale,reducedMotion}=useHIG();
 const themeStyle=useThemeStyle();
 const backend:GestureSheetBackendProps=safeProps(backendProps,OWNED_ROOT);
 const side=backend.direction??'bottom',points=backend.snapPoints?.length?backend.snapPoints:undefined;
 if(points)validateSnapPoints(points.map(sharedPoint));
 // The sheet stays mounted after `open` turns false until its closing travel ends.
 const [mounted,setMounted]=useState(open);
 if(open&&!mounted)setMounted(true);
 const [ownSnap,setOwnSnap]=useState<SheetPoint|null|undefined>(points?.[0]);
 const active=backend.activeSnapPoint!==undefined?backend.activeSnapPoint:ownSnap;
 const currentOpen=useRef(open);currentOpen.current=open;
 const engineRef=useRef<SheetEngine|null>(null);
 const engine=engineRef.current??=new SheetEngine();
 // What the sheet last asked the host for, until the host answers: `onAnimationEnd` reports only an accepted request.
 const requested=useRef<boolean|null>(null),frame=useRef<number|null>(null);
 const setAnatomy=useDynamicHeight(open,reducedMotion);
 // A frame after a request, a host that declined it still shows the old state: the sheet goes back to it.
 const reconcile=()=>{frame.current??=requestAnimationFrame(()=>{frame.current=null;if(requested.current!==currentOpen.current)requested.current=null;engine.settle();});};
 const requestOpen=(next:boolean)=>{
  if(!next&&backend.dismissible===false)return;
  requested.current=next;reconcile();
  onOpenChange(next);
 };
 const selectSnap=(point:SheetPoint)=>{setOwnSnap(point);backend.setActiveSnapPoint?.(point);reconcile();};
 engine.options={
  open,direction:side,snapPoints:points,activeSnapPoint:active,fadeFromIndex:backend.fadeFromIndex,
  snapToSequentialPoint:backend.snapToSequentialPoint??false,handleOnly:backend.handleOnly??false,dismissible:backend.dismissible??true,
  closeThreshold:backend.closeThreshold??SHEET_CLOSE,scrollLockTimeout:backend.scrollLockTimeout??SHEET_SCROLL_LOCK,container:backend.container,reducedMotion,
  shouldScaleBackground:backend.shouldScaleBackground??false,setBackgroundColorOnScale:backend.setBackgroundColorOnScale??true,noBodyStyles:backend.noBodyStyles??false,
  repositionInputs:backend.repositionInputs??true,fixed:backend.fixed??false,preventScroll:backend.disablePreventScroll??true,preventScrollRestoration:backend.preventScrollRestoration??false,
  onDrag:backend.onDrag,onRelease:backend.onRelease,
  requestClose:()=>requestOpen(false),selectSnapPoint:selectSnap,
  onSettled:settled=>{
   if(!settled){
    // The next open starts on the first detent.
    if(points&&active!==points[0]){setOwnSnap(points[0]);backend.setActiveSnapPoint?.(points[0]);}
    setMounted(false);
   }
   if(requested.current===settled){requested.current=null;backend.onAnimationEnd?.(settled);}
  },
 };
 // Radix composes its refs anew on every render, so React hands these the element again each time, after a null. Only a
 // new element is a new sheet; the sheet is gone when it unmounts. The host's ref follows React's own rules for a ref
 // that changes between renders.
 const hostRef=useRef(contentRef);hostRef.current=contentRef;
 const panel=useRef<HTMLDivElement|null>(null),bound=useRef<{ref:React.Ref<HTMLDivElement>;release:()=>void}|null>(null);
 const bind=useCallback((element:HTMLDivElement|null)=>{
  bound.current?.release();bound.current=null;
  const ref=hostRef.current;
  if(!element||!ref)return;
  if(typeof ref==='function'){const cleanup=ref(element);bound.current={ref,release:typeof cleanup==='function'?cleanup:()=>{ref(null);}};}
  else{ref.current=element;bound.current={ref,release:()=>{ref.current=null;}};}
 },[]);
 const seen=useRef<HTMLDivElement|null>(null);
 const take=useCallback((element:HTMLDivElement)=>{panel.current=element;bind(element);engine.attach(element);},[bind,engine]);
 const setPanel=useCallback((element:HTMLDivElement|null)=>{if(!element)return;seen.current=element;if(element!==panel.current)take(element);},[take]);
 const setBackdrop=useCallback((element:HTMLDivElement|null)=>{if(element)engine.attachOverlay(element);},[engine]);
 const drop=useCallback(()=>{if(!panel.current)return;panel.current=null;bind(null);engine.release();},[bind,engine]);
 useCommitEffect(()=>{if(!mounted)drop();},[mounted,drop]);
 useCommitEffect(()=>{if(panel.current&&(bound.current?.ref??undefined)!==(contentRef??undefined))bind(panel.current);},[contentRef,bind]);
 useCommitEffect(()=>{engine.sync();},[engine,open,active,side,points?.join('|'),backend.fadeFromIndex,backend.container]);
 // Strict mode runs this cleanup once while the sheet is still on the page; the sheet is taken up again.
 useEffect(()=>{
  if(!panel.current&&seen.current?.isConnected)take(seen.current);
  return ()=>{if(frame.current!==null)cancelAnimationFrame(frame.current);frame.current=null;drop();};
 },[take,drop]);
 const dynamic=!!enableDynamicSizing&&(side==='top'||side==='bottom');
 const {className,style,onOpenAutoFocus,onPointerDown,onPointerMove,onPointerUp,onPointerCancel,onLostPointerCapture,onContextMenu,onClickCapture,...content}=safeProps(contentProps,OWNED_CONTENT);
 const {className:overlayClass,...overlay}=safeProps(overlayProps,OWNED_OVERLAY);
 const {className:handleClass,preventCycle,...grip}=safeProps(handleProps,OWNED_HANDLE);
 // A tap on the handle steps up one detent, and closes from the tallest.
 const cycle=()=>{
  if(preventCycle||!points||engine.dragged)return;
  const index=Math.max(0,points.indexOf(active as SheetPoint));
  if(index===points.length-1)requestOpen(false);else selectSnap(points[index+1]);
 };
 // The click that ends a drag is not a press on what lies under the pointer. A keyboard click has no detail.
 const swallow=(event:React.MouseEvent<HTMLDivElement>)=>{onClickCapture?.(event);if(engine.dragged&&event.detail!==0){engine.dragged=false;event.preventDefault();event.stopPropagation();}};
 const detent=handle&&<div {...grip} ref={handleRef} className={['hig-gesture-handle',handleClass].filter(Boolean).join(' ')} data-hig-sheet-handle='' aria-hidden='true' onClick={cycle}><span data-hig-sheet-handle-hitarea='' aria-hidden='true'/></div>;
 const pinned=!!detent&&contentMode==='default'&&side==='bottom';
 const body=<>
  {pinned
   ?<div className='hig-detent-bar'>{detent}</div>
   :detent}
  <Modal.Title className={titleHidden||labelledBy?'hig-sr-only':undefined} aria-hidden={labelledBy?true:undefined}>{title}</Modal.Title>
  {description&&<Modal.Description className={descriptionHidden?'hig-sr-only':undefined}>{description}</Modal.Description>}
  {children}
  {closeButton!==null&&<Modal.Close asChild>{closeButton??<Button intent='secondary' suppressFeedback>{closeLabel??messages.close??en.close}</Button>}</Modal.Close>}
 </>;
 return <Modal.Root open={open} onOpenChange={requestOpen} modal>
  {trigger&&<Modal.Trigger asChild>{trigger}</Modal.Trigger>}
  {mounted&&<Modal.Portal forceMount container={backend.container??undefined}>
   <Modal.Overlay {...overlay} ref={setBackdrop} className={['hig-backdrop','hig-gesture-backdrop',overlayClass].filter(Boolean).join(' ')} data-hig-sheet-overlay='' data-hig-motion={reducedMotion?'reduced':'full'}/>
   <Modal.Content {...content} {...(!description?{'aria-describedby':undefined}:{})} {...(labelledBy?{'aria-labelledby':labelledBy}:{})} ref={setPanel}
    className={['hig-gesture-sheet',pinned&&'hig-pin',className].filter(Boolean).join(' ')} role='dialog' dir={direction} lang={locale} style={{...themeStyle,...style,...(dynamic&&maxDynamicContentSize!==undefined&&{maxHeight:maxDynamicContentSize})}}
    onOpenAutoFocus={event=>{onOpenAutoFocus?.(event);if(!backend.autoFocus)event.preventDefault();}}
    onPointerDown={event=>{onPointerDown?.(event);engine.down(event);}}
    onPointerMove={event=>{onPointerMove?.(event);engine.move(event);}}
    onPointerUp={event=>{onPointerUp?.(event);engine.up(event);}}
    onPointerCancel={event=>{onPointerCancel?.(event);engine.cancel(event);}}
    onLostPointerCapture={event=>{onLostPointerCapture?.(event);if(event.target===event.currentTarget)engine.cancel(event);}}
    onContextMenu={event=>{onContextMenu?.(event);engine.cancel();}}
    onClickCapture={swallow}
    data-hig-sheet='' data-hig-sheet-direction={side} data-hig-sheet-snap-points={points?'true':'false'}
    data-hig-content-mode={contentMode} data-hig-motion={reducedMotion?'reduced':'full'} data-hig-dynamic={dynamic?'true':undefined}>
    {dynamic?<div ref={setAnatomy} className='hig-gesture-dynamic' data-hig-content-mode={contentMode}>{body}</div>:body}
   </Modal.Content>
  </Modal.Portal>}
 </Modal.Root>;
}

export interface GestureSheetViewProps extends React.HTMLAttributes<HTMLDivElement> {
 /** Names the view. A change swaps the content with the transition. */
 viewKey:string|number;
}
/**
 * One view of a sheet that shows several, such as the steps of a flow or the levels of a menu. When `viewKey` changes, the
 * old view fades and shrinks out of the way without holding its space, the new one fades in at its own size, and a
 * content-sized sheet (`enableDynamicSizing`) moves to the new height at the same time. Going deeper and going back look
 * the same. The first view appears with the sheet, and nothing moves under reduced motion. The outgoing view is
 * inert and hidden from assistive technology while it leaves.
 */
export function GestureSheetView({viewKey,children,className,...rest}:GestureSheetViewProps){
 const {reducedMotion}=useHIG();
 type View={key:string|number;node:React.ReactNode};
 const committed=useRef<View>({key:viewKey,node:children}),enter=useRef<HTMLDivElement>(null),exit=useRef<HTMLDivElement>(null),mounted=useRef(false);
 const [shown,setShown]=useState(viewKey),[leaving,setLeaving]=useState<View|null>(null);
 // The children of the view that was last on screen are kept so it can be drawn once more while it leaves.
 if(shown!==viewKey){setShown(viewKey);setLeaving(reducedMotion||committed.current.key===viewKey?null:committed.current);}
 useEffect(()=>{committed.current={key:viewKey,node:children};});
 useCommitEffect(()=>{
  if(!mounted.current){mounted.current=true;return;}
  if(reducedMotion){setLeaving(null);return;}
  const incoming=enter.current?.animate?.([{opacity:0,transform:VIEW_SMALL},{opacity:1,transform:'scale(1)'}],{...VIEW_SWAP,duration:SHEET_VIEW_ENTER});
  const out=exit.current?.animate?.([{opacity:1,transform:'scale(1)'},{opacity:0,transform:VIEW_SMALL}],{...VIEW_SWAP,fill:'forwards'});
  if(!out){setLeaving(null);return()=>incoming?.cancel();}
  const done=()=>setLeaving(current=>current&&current.key!==viewKey?null:current);
  out.onfinish=done;out.oncancel=done;
  return()=>{out.onfinish=null;out.oncancel=null;incoming?.cancel();out.cancel();};
 },[viewKey,reducedMotion]);
 return <div {...rest} className={['hig-gesture-views',className].filter(Boolean).join(' ')}>
  {leaving&&<div key={leaving.key} ref={exit} className='hig-gesture-view' data-leaving='' aria-hidden='true' inert>{leaving.node}</div>}
  <div key={viewKey} ref={enter} className='hig-gesture-view'>{children}</div>
 </div>;
}
