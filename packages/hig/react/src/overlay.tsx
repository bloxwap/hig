"use client";
import React,{useEffect,useId,useRef} from 'react';
import * as en from '@bloxwap/hig/contracts/messages';
import {useControllable,useHIG,useThemeStyle} from './provider.js';
import * as Drop from '@radix-ui/react-dropdown-menu';
import * as Pop from '@radix-ui/react-popover';
import * as Tip from '@radix-ui/react-tooltip';
import {Button} from './button.js';
export {Dialog,Sheet,AlertDialog,type DialogProps,type DialogContentProps,type AlertDialogProps} from './dialog.js';
export function Menu({label,items}: {label:string;items:readonly {label:string;disabled?:boolean;onSelect:(event:Event)=>void}[]}){const {feedback,direction,locale,density}=useHIG();const themeStyle=useThemeStyle();const id=useId();const sequence=useRef(0);const origin=useRef<'pointer'|'keyboard'>('keyboard');return <Drop.Root dir={direction}><Drop.Trigger asChild><Button intent='secondary' suppressFeedback>{label}</Button></Drop.Trigger><Drop.Portal><Drop.Content className='hig-popover hig-menu' align='start' sideOffset={6} collisionPadding={16} style={themeStyle} lang={locale} data-hig-density={density}>{items.map((item,i)=><Drop.Item key={i} disabled={item.disabled} className='hig-menu-item' onPointerDown={()=>{origin.current='pointer';}} onKeyDown={()=>{origin.current='keyboard';}} onSelect={event=>{if(item.disabled)return;item.onSelect(event);if(!event.defaultPrevented)try{feedback?.emit({id:`${id}/${++sequence.current}`,source:id,intent:'selection',origin:origin.current});}catch{/* Optional feedback cannot alter the action. */}}}>{item.label}</Drop.Item>)}</Drop.Content></Drop.Portal></Drop.Root>;}
export interface PopoverProps {
 /** Text of the built-in trigger, a secondary Button. With `trigger`, it names the popover instead (`aria-label` on its content). */
 label:string;
 children?:React.ReactNode;
 /** Close button text and accessible name; defaults to HIGProvider `messages.close`. */
 closeLabel?:string;
 /** Leaves out the Close button, for a popover that holds only information or that the host closes itself. Escape and a press outside still close it. */
 hideClose?:boolean;
 /** Controls whether the popover is open. Omit it, with `defaultOpen`, to let the popover keep its own state. */
 open?:boolean;
 defaultOpen?:boolean;
 /** Called with the next state when the trigger, Close, Escape, a press outside or (with `openOnHover`) the pointer opens or closes it. */
 onOpenChange?:(open:boolean)=>void;
 /** The host's own trigger in place of the built-in Button: one element that accepts a ref and spreads its props onto a focusable element, such as a HIG `Button`, `IconButton` or a `<button>`. */
 trigger?:React.ReactElement;
 /** Also opens while a mouse pointer rests on the trigger, and closes shortly after it leaves both the trigger and the popover. Touch and pen keep press to open; keyboard focus is not moved by a hover. */
 openOnHover?:boolean;
 /** `data-testid` of the popover's content. */
 testID?:string;
}
/** How long the pointer may be off the trigger and the popover before a hover-opened popover closes, so it can cross the gap between them. */
const hoverCloseDelay=150;
export function Popover({label,children,closeLabel,hideClose,open,defaultOpen=false,onOpenChange,trigger,openOnHover,testID}:PopoverProps){
 const {messages,direction,locale,density}=useHIG();const themeStyle=useThemeStyle();
 const [current,set]=useControllable(open,defaultOpen,onOpenChange,null);
 const timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),hovered=useRef(false);
 useEffect(()=>()=>clearTimeout(timer.current),[]);
 // Hover handlers only for a mouse: a touch's pointerenter comes just before its click, which toggles. A hover opens without moving focus into the popover.
 const hover=openOnHover?{
  onPointerEnter:(event:React.PointerEvent)=>{if(event.pointerType!=='mouse')return;clearTimeout(timer.current);if(!current){hovered.current=true;set(true);}},
  onPointerLeave:(event:React.PointerEvent)=>{if(event.pointerType!=='mouse')return;clearTimeout(timer.current);timer.current=setTimeout(()=>set(false),hoverCloseDelay);},
 }:undefined;
 return <Pop.Root open={current} onOpenChange={next=>{clearTimeout(timer.current);if(!next)hovered.current=false;set(next);}}>
  <Pop.Trigger asChild {...hover}>{trigger??<Button intent='secondary' suppressFeedback>{label}</Button>}</Pop.Trigger>
  <Pop.Portal><Pop.Content {...hover} className='hig-popover' sideOffset={6} collisionPadding={16} style={themeStyle} dir={direction} lang={locale} data-hig-density={density} aria-label={trigger?label:undefined} data-testid={testID} onOpenAutoFocus={event=>{if(hovered.current)event.preventDefault();}}>
   {children}
   {hideClose?null:<Pop.Close asChild><Button intent='ghost' suppressFeedback>{closeLabel??messages.close??en.close}</Button></Pop.Close>}
  </Pop.Content></Pop.Portal>
 </Pop.Root>;
}
export function Tooltip({content,children}:React.PropsWithChildren<{content:string}>){const {direction,locale,density}=useHIG();const themeStyle=useThemeStyle();return <Tip.Provider><Tip.Root><Tip.Trigger asChild>{children}</Tip.Trigger><Tip.Portal><Tip.Content className='hig-popover hig-tooltip' sideOffset={6} collisionPadding={16} style={themeStyle} dir={direction} lang={locale} data-hig-density={density}>{content}</Tip.Content></Tip.Portal></Tip.Root></Tip.Provider>;}
