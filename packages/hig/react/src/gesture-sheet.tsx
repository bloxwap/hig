"use client";
import React,{useCallback,useEffect,useLayoutEffect,useRef,useState} from 'react';
import {Drawer,type DialogProps as BackendProps} from 'vaul';
import * as en from '@bloxwap/hig/contracts/messages';
import {useHIG,useThemeStyle} from './provider.js';
import {Button} from './button.js';
import type {DialogProps,DialogContentProps} from './dialog.js';

/** Vaul owns gestures, detents, input repositioning and background scaling. HIG owns the controlled modal root. */
type HostBackendProps<Props> = Props extends object ? Omit<Props,'children'|'open'|'defaultOpen'|'onOpenChange'|'modal'|'nested'|'onClose'> : never;
export type GestureSheetBackendProps = HostBackendProps<BackendProps>;
type SnapPointBackendProp='snapPoints'|'snapPoint'|'activeSnapPoint'|'setActiveSnapPoint'|'fadeFromIndex'|'snapToSequentialPoint';
export type GestureSheetDynamicBackendProps=Omit<GestureSheetBackendProps,SnapPointBackendProp>&{[Key in SnapPointBackendProp]?:never};
export type GestureSheetContentProps = DialogContentProps & {[key:`data-${string}`]:string|number|boolean|undefined};
export type GestureSheetHandleProps = Omit<React.ComponentPropsWithoutRef<typeof Drawer.Handle>,'children'|'aria-hidden'|'dangerouslySetInnerHTML'|'onClick'|'onPointerDown'|'onPointerMove'|'onPointerCancel'>;
export type GestureSheetOverlayProps = Omit<React.ComponentPropsWithoutRef<typeof Drawer.Overlay>,'children'|'asChild'|'forceMount'|'dangerouslySetInnerHTML'>;
interface GestureSheetCommonProps extends Omit<DialogProps,'contentProps'> {
 contentProps?:GestureSheetContentProps;
 /** Default anatomy pads and scrolls the card; custom anatomy leaves layout and scrolling to the host. */
 contentMode?:'default'|'custom';
 /** The real backend drag handle is included by default. */
 handle?:boolean;
 handleProps?:GestureSheetHandleProps;
 handleRef?:React.Ref<HTMLDivElement>;
 overlayProps?:GestureSheetOverlayProps;
 /** `id` of a heading inside the sheet that names it, such as a block's `headingId`: the sheet is then named by that heading (`aria-labelledby`) and its own `title` is kept for the backend but hidden from assistive technology, so the name is read once. */
 labelledBy?:string;
}
export type GestureSheetProps=GestureSheetCommonProps&(
 /** Backend defaults are retained, including autoFocus=false and repositionInputs=true. */
 {enableDynamicSizing?:false;backendProps?:GestureSheetBackendProps;maxDynamicContentSize?:never}
 /** Vertical content sizing is intrinsic and cannot be combined with Vaul detents. */
 |{enableDynamicSizing:true;backendProps?:GestureSheetDynamicBackendProps;/** A finite positive content-height ceiling in CSS pixels; the viewport ceiling still applies. */maxDynamicContentSize?:number}
);
const OWNED_CONTENT=new Set(['children','asChild','forceMount','role','dir','lang','id','ref','aria-labelledby','aria-describedby','dangerouslySetInnerHTML']);
const OWNED_ROOT=new Set(['children','open','defaultOpen','onOpenChange','modal','nested','onClose']);
const OWNED_OVERLAY=new Set(['children','asChild','forceMount','ref','dangerouslySetInnerHTML']);
const OWNED_HANDLE=new Set(['children','aria-hidden','ref','dangerouslySetInnerHTML','onClick','onPointerDown','onPointerMove','onPointerCancel']);
const OWNED_BACKEND_DATA=new Set(['data-vaul-drawer','data-vaul-drawer-direction','data-vaul-delayed-snap-points','data-vaul-snap-points','data-vaul-custom-container','data-vaul-animate','data-vaul-overlay','data-vaul-snap-points-overlay','data-vaul-handle','data-vaul-drawer-visible','data-vaul-handle-hitarea']);
const DYNAMIC_BACKEND=new Set<SnapPointBackendProp>(['snapPoints','snapPoint','activeSnapPoint','setActiveSnapPoint','fadeFromIndex','snapToSequentialPoint']);
const safeProps=<Props extends object>(props:Props|undefined,owned:Set<string>)=>Object.fromEntries(Object.entries(props??{}).filter(([key])=>!owned.has(key)&&!OWNED_BACKEND_DATA.has(key))) as Props;
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
   // Keep the larger surface behind the content. Move its visible edge into place
   // without resizing the scroll container on every frame or touching Vaul's drag transform.
   const extent=Math.max(from,next),sign=card.dataset.vaulDrawerDirection==='top'?-1:1;
   const minHeight=card.style.minHeight;
   if(from>next)card.style.minHeight=`${extent}px`;
   const animation=card.animate([{translate:`0 ${sign*(extent-from)}px`},{translate:`0 ${sign*(extent-next)}px`}],{...VIEW_SWAP,fill:'both'});
   running={animation,from,to:next,minHeight};
   animation.onfinish=animation.oncancel=()=>{if(running?.animation===animation)cancel();};
  };
  const resize=typeof ResizeObserver==='undefined'?null:new ResizeObserver(measure);resize?.observe(content,{box:'border-box'});measure();
  const inline=typeof MutationObserver==='undefined'?null:new MutationObserver(()=>{if(card.style.height)cancel();});inline?.observe(card,{attributes:true,attributeFilter:['style']});
  cleanup.current=()=>{resize?.disconnect();inline?.disconnect();cancel();};
 },[open,reducedMotion]);
}
// Vaul 1.1.2 writes motion styles before requesting a controlled close. If the host
// rejects that request, restore the last resting styles without remounting its card.
function snapshotStyles(element:HTMLElement|null,properties:string[]){
 const values=properties.map(property=>[property,element?.style.getPropertyValue(property)??'',element?.style.getPropertyPriority(property)??'']);
 return ()=>{if(element?.isConnected)for(const [property,value,priority] of values){if(value)element.style.setProperty(property,value,priority);else element.style.removeProperty(property);}};
}
const MOTION_PROPERTIES=['transform','transition','transition-property','transition-duration','transition-timing-function'];
const BACKGROUND_PROPERTIES=[...MOTION_PROPERTIES,'border-radius','overflow','transform-origin'];
const BODY_POSITION=['position','top','left','right','height'];

/** Optional web gesture backend. Install vaul separately; the core overlay entry never imports it. */
export function GestureSheet({open,onOpenChange,title,description,trigger,children,titleHidden,descriptionHidden,contentProps,contentRef,closeButton,closeLabel,backendProps,contentMode='default',handle=true,handleProps,handleRef,overlayProps,enableDynamicSizing=false,maxDynamicContentSize,labelledBy}:GestureSheetProps){
 if(enableDynamicSizing&&Object.entries(backendProps??{}).some(([key,value])=>value!==undefined&&DYNAMIC_BACKEND.has(key as SnapPointBackendProp)))throw new Error('Dynamic GestureSheet does not accept Vaul snap-point props.');
 if(maxDynamicContentSize!==undefined&&(!Number.isFinite(maxDynamicContentSize)||maxDynamicContentSize<=0))throw new Error('GestureSheet maxDynamicContentSize must be finite and greater than zero.');
 const {messages,direction,locale,reducedMotion}=useHIG();
 const themeStyle=useThemeStyle();
 const currentOpen=useRef(open);currentOpen.current=open;
 const panel=useRef<HTMLDivElement>(null),backdrop=useRef<HTMLDivElement>(null),motion=useRef<(()=>void)|null>(null),frame=useRef<number|null>(null);
 const setAnatomy=useDynamicHeight(open,reducedMotion);
 const refCleanup=useRef<(()=>void)|null>(null),releasePosition=useRef<(()=>void)|null>(null);
 // Vaul's internal ref composition predates React callback-ref cleanup returns.
 const setPanel=useCallback((element:HTMLDivElement|null)=>{panel.current=element;if(typeof contentRef==='function'){if(!element&&refCleanup.current){const cleanup=refCleanup.current;refCleanup.current=null;cleanup();}else{const cleanup=contentRef(element);refCleanup.current=typeof cleanup==='function'?cleanup:null;}}else if(contentRef)contentRef.current=element;},[contentRef]);
 useEffect(()=>()=>{if(frame.current!==null)cancelAnimationFrame(frame.current);releasePosition.current?.();},[]);
 useEffect(()=>{if(!open){motion.current=null;releasePosition.current?.();releasePosition.current=null;}},[open]);
 const {onAnimationEnd,...backend}=safeProps(backendProps,OWNED_ROOT);
 const dynamic=!!enableDynamicSizing&&((backend.direction??'bottom')==='top'||(backend.direction??'bottom')==='bottom');
 const {className,onPointerDownCapture,onFocusOutside,onInteractOutside,style,...content}=safeProps(contentProps,OWNED_CONTENT);
 const {className:overlayClass,...overlay}=safeProps(overlayProps,OWNED_OVERLAY);
 const {className:handleClass,...grip}=safeProps(handleProps,OWNED_HANDLE);
 const requestOpen=(next:boolean)=>{
  if(!next&&frame.current===null){
   const wasFixed=document.body.style.position==='fixed';
   const restoreBody=snapshotStyles(document.body,[...BODY_POSITION,'pointer-events']);
   const restoreMotion=motion.current;motion.current=null;
   frame.current=requestAnimationFrame(()=>{frame.current=null;if(currentOpen.current){
    // Safari's backend clears its saved body position even for a rejected close.
    // Retain the released position so the eventual accepted close still unlocks.
    if(wasFixed&&document.body.style.position!=='fixed')releasePosition.current??=snapshotStyles(document.body,BODY_POSITION);
    restoreBody();restoreMotion?.();
   }});
  }
  onOpenChange(next);
 };
 const detent=handle&&<Drawer.Handle {...grip} ref={handleRef} className={['hig-gesture-handle',handleClass].filter(Boolean).join(' ')}/>;
 const pinned=!!detent&&contentMode==='default'&&(backend.direction??'bottom')==='bottom';
 const body=<>
  {pinned
   ?<div className='hig-detent-bar'>{detent}</div>
   :detent}
  <Drawer.Title className={titleHidden||labelledBy?'hig-sr-only':undefined} aria-hidden={labelledBy?true:undefined}>{title}</Drawer.Title>
  {description&&<Drawer.Description className={descriptionHidden?'hig-sr-only':undefined}>{description}</Drawer.Description>}
  {children}
  {closeButton!==null&&<Drawer.Close asChild>{closeButton??<Button intent='secondary' suppressFeedback>{closeLabel??messages.close??en.close}</Button>}</Drawer.Close>}
 </>;
 return <Drawer.Root {...backend} open={open} onOpenChange={requestOpen} modal
  onAnimationEnd={next=>{if(next===currentOpen.current)onAnimationEnd?.(next);}}>
  {trigger&&<Drawer.Trigger asChild>{trigger}</Drawer.Trigger>}
  <Drawer.Portal>
   <Drawer.Overlay {...overlay} ref={backdrop} className={['hig-backdrop','hig-gesture-backdrop',overlayClass].filter(Boolean).join(' ')} data-hig-motion={reducedMotion?'reduced':'full'}/>
   <Drawer.Content {...content} {...(!description?{'aria-describedby':undefined}:{})} {...(labelledBy?{'aria-labelledby':labelledBy}:{})} ref={setPanel}
    className={['hig-gesture-sheet',pinned&&'hig-pin',className].filter(Boolean).join(' ')} role='dialog' dir={direction} lang={locale} style={{...themeStyle,...style,...(dynamic&&maxDynamicContentSize!==undefined&&{maxHeight:maxDynamicContentSize})}}
    onPointerDownCapture={event=>{const restorePanel=snapshotStyles(panel.current,MOTION_PROPERTIES),restoreOverlay=snapshotStyles(backdrop.current,['opacity','transition']),restoreBackground=backend.shouldScaleBackground?snapshotStyles(document.querySelector<HTMLElement>('[data-vaul-drawer-wrapper]'),BACKGROUND_PROPERTIES):()=>{};motion.current=()=>{restorePanel();restoreOverlay();restoreBackground();};onPointerDownCapture?.(event);}}
    onInteractOutside={event=>{if(event.detail.originalEvent.type==='focusin')onFocusOutside?.(event as Parameters<NonNullable<GestureSheetContentProps['onFocusOutside']>>[0]);onInteractOutside?.(event);}}
    data-hig-content-mode={contentMode} data-hig-motion={reducedMotion?'reduced':'full'} data-hig-dynamic={dynamic?'true':undefined}>
    {dynamic?<div ref={setAnatomy} className='hig-gesture-dynamic' data-hig-content-mode={contentMode}>{body}</div>:body}
   </Drawer.Content>
  </Drawer.Portal>
 </Drawer.Root>;
}

export interface GestureSheetViewProps extends React.HTMLAttributes<HTMLDivElement> {
 /** Names the view. A change swaps the content with the transition. */
 viewKey:string|number;
}
// One curve for the height and both views, measured from Vaul's Dynamic Drawer: no spring and no overshoot, a short ease in and a long ease out. The old view leaves in 270ms and the new one arrives in 220ms.
const VIEW_SWAP:KeyframeAnimationOptions={duration:270,easing:'cubic-bezier(.26,.08,.25,1)'};
const useCommitEffect=typeof window==='undefined'?useEffect:useLayoutEffect;
/**
 * One view of a sheet that shows several, such as the steps of a flow or the levels of a menu. When `viewKey` changes, the
 * old view fades and shrinks out of the way without holding its space, the new one fades in at its own size, and a
 * content-sized sheet (`enableDynamicSizing`) moves to the new height at the same time. Going deeper and going back look
 * the same, as in Vaul. The first view appears with the sheet, and nothing moves under reduced motion. The outgoing view is
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
  const incoming=enter.current?.animate?.([{opacity:0,transform:'scale(.96)'},{opacity:1,transform:'scale(1)'}],{...VIEW_SWAP,duration:220});
  const out=exit.current?.animate?.([{opacity:1,transform:'scale(1)'},{opacity:0,transform:'scale(.96)'}],{...VIEW_SWAP,fill:'forwards'});
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
