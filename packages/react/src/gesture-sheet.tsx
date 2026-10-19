"use client";
import React,{useCallback,useEffect,useRef} from 'react';
import {Drawer,type DialogProps as BackendProps} from 'vaul';
import * as en from '@bloxwap/hig-contracts/messages';
import {useHIG} from './provider.js';
import {Button} from './button.js';
import type {DialogProps,DialogContentProps} from './dialog.js';

/** Vaul owns gestures, detents, input repositioning and background scaling. HIG owns the controlled modal root. */
type HostBackendProps<Props> = Props extends object ? Omit<Props,'children'|'open'|'defaultOpen'|'onOpenChange'|'modal'|'nested'|'onClose'> : never;
export type GestureSheetBackendProps = HostBackendProps<BackendProps>;
export type GestureSheetContentProps = DialogContentProps & {[key:`data-${string}`]:string|number|boolean|undefined};
export type GestureSheetHandleProps = Omit<React.ComponentPropsWithoutRef<typeof Drawer.Handle>,'children'|'aria-hidden'|'dangerouslySetInnerHTML'|'onClick'|'onPointerDown'|'onPointerMove'|'onPointerCancel'>;
export type GestureSheetOverlayProps = Omit<React.ComponentPropsWithoutRef<typeof Drawer.Overlay>,'children'|'asChild'|'forceMount'|'dangerouslySetInnerHTML'>;
export interface GestureSheetProps extends Omit<DialogProps,'contentProps'> {
 contentProps?:GestureSheetContentProps;
 /** Backend defaults are retained, including autoFocus=false and repositionInputs=true. */
 backendProps?:GestureSheetBackendProps;
 /** Default anatomy pads and scrolls the card; custom anatomy leaves layout and scrolling to the host. */
 contentMode?:'default'|'custom';
 /** The real backend drag handle is included by default. */
 handle?:boolean;
 handleProps?:GestureSheetHandleProps;
 handleRef?:React.Ref<HTMLDivElement>;
 overlayProps?:GestureSheetOverlayProps;
}
const OWNED_CONTENT=new Set(['children','asChild','forceMount','role','dir','lang','id','ref','aria-labelledby','aria-describedby','dangerouslySetInnerHTML']);
const OWNED_ROOT=new Set(['children','open','defaultOpen','onOpenChange','modal','nested','onClose']);
const OWNED_OVERLAY=new Set(['children','asChild','forceMount','ref','dangerouslySetInnerHTML']);
const OWNED_HANDLE=new Set(['children','aria-hidden','ref','dangerouslySetInnerHTML','onClick','onPointerDown','onPointerMove','onPointerCancel']);
const OWNED_BACKEND_DATA=new Set(['data-vaul-drawer','data-vaul-drawer-direction','data-vaul-delayed-snap-points','data-vaul-snap-points','data-vaul-custom-container','data-vaul-animate','data-vaul-overlay','data-vaul-snap-points-overlay','data-vaul-handle','data-vaul-drawer-visible','data-vaul-handle-hitarea']);
const safeProps=<Props extends object>(props:Props|undefined,owned:Set<string>)=>Object.fromEntries(Object.entries(props??{}).filter(([key])=>!owned.has(key)&&!OWNED_BACKEND_DATA.has(key))) as Props;
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
export function GestureSheet({open,onOpenChange,title,description,trigger,children,titleHidden,descriptionHidden,contentProps,contentRef,closeButton,closeLabel,backendProps,contentMode='default',handle=true,handleProps,handleRef,overlayProps}:GestureSheetProps){
 const {messages,direction,locale,reducedMotion}=useHIG();
 const currentOpen=useRef(open);currentOpen.current=open;
 const panel=useRef<HTMLDivElement>(null),backdrop=useRef<HTMLDivElement>(null),motion=useRef<(()=>void)|null>(null),frame=useRef<number|null>(null);
 const refCleanup=useRef<(()=>void)|null>(null),releasePosition=useRef<(()=>void)|null>(null);
 // Vaul's internal ref composition predates React callback-ref cleanup returns.
 const setPanel=useCallback((element:HTMLDivElement|null)=>{panel.current=element;if(typeof contentRef==='function'){if(!element&&refCleanup.current){const cleanup=refCleanup.current;refCleanup.current=null;cleanup();}else{const cleanup=contentRef(element);refCleanup.current=typeof cleanup==='function'?cleanup:null;}}else if(contentRef)contentRef.current=element;},[contentRef]);
 useEffect(()=>()=>{if(frame.current!==null)cancelAnimationFrame(frame.current);releasePosition.current?.();},[]);
 useEffect(()=>{if(!open){motion.current=null;releasePosition.current?.();releasePosition.current=null;}},[open]);
 const {onAnimationEnd,...backend}=safeProps(backendProps,OWNED_ROOT);
 const {className,onPointerDownCapture,onFocusOutside,onInteractOutside,...content}=safeProps(contentProps,OWNED_CONTENT);
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
 return <Drawer.Root {...backend} open={open} onOpenChange={requestOpen} modal
  onAnimationEnd={next=>{if(next===currentOpen.current)onAnimationEnd?.(next);}}>
  {trigger&&<Drawer.Trigger asChild>{trigger}</Drawer.Trigger>}
  <Drawer.Portal>
   <Drawer.Overlay {...overlay} ref={backdrop} className={['hig-backdrop','hig-gesture-backdrop',overlayClass].filter(Boolean).join(' ')} data-hig-motion={reducedMotion?'reduced':'full'}/>
   <Drawer.Content {...content} {...(!description?{'aria-describedby':undefined}:{})} ref={setPanel}
    className={['hig-gesture-sheet',className].filter(Boolean).join(' ')} role='dialog' dir={direction} lang={locale}
    onPointerDownCapture={event=>{const restorePanel=snapshotStyles(panel.current,MOTION_PROPERTIES),restoreOverlay=snapshotStyles(backdrop.current,['opacity','transition']),restoreBackground=backend.shouldScaleBackground?snapshotStyles(document.querySelector<HTMLElement>('[data-vaul-drawer-wrapper]'),BACKGROUND_PROPERTIES):()=>{};motion.current=()=>{restorePanel();restoreOverlay();restoreBackground();};onPointerDownCapture?.(event);}}
    onInteractOutside={event=>{if(event.detail.originalEvent.type==='focusin')onFocusOutside?.(event as Parameters<NonNullable<GestureSheetContentProps['onFocusOutside']>>[0]);onInteractOutside?.(event);}}
    data-hig-content-mode={contentMode} data-hig-motion={reducedMotion?'reduced':'full'}>
    {handle&&<Drawer.Handle {...grip} ref={handleRef} className={['hig-gesture-handle',handleClass].filter(Boolean).join(' ')}/>}
    <Drawer.Title className={titleHidden?'hig-sr-only':undefined}>{title}</Drawer.Title>
    {description&&<Drawer.Description className={descriptionHidden?'hig-sr-only':undefined}>{description}</Drawer.Description>}
    {children}
    {closeButton!==null&&<Drawer.Close asChild>{closeButton??<Button intent='secondary' suppressFeedback>{closeLabel??messages.close??en.close}</Button>}</Drawer.Close>}
   </Drawer.Content>
  </Drawer.Portal>
 </Drawer.Root>;
}
