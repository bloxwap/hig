'use client';
import React,{useEffect,useRef} from 'react';
import * as en from '@bloxwap/hig/contracts/messages';
import {useControllable,useHIG,useThemeStyle} from './provider.js';
import * as Pop from '@radix-ui/react-popover';
import {Button} from './button.js';
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
 /** Tints the popover's surface from a token role: a 12% wash over its fill, a 40% stroke and a soft glow in the role's colour, such as `warning` for a gold badge's explanation. `data-tone` on the content. Without it the surface is neutral. */
 tone?:PopoverTone;
 /** Classes added to the popover's content after `hig-popover`, for a host surface treatment the tones do not cover. */
 className?:string;
 /** Inline style for the popover's content, after the theme's variables, so it can set `--hig-popover-tone` or a host border, background or shadow. */
 style?:React.CSSProperties;
}
/** A token role that tints a `Popover`'s surface. */
export type PopoverTone='info'|'positive'|'warning'|'negative';
/** How long the pointer may be off the trigger and the popover before a hover-opened popover closes, so it can cross the gap between them. */
const hoverCloseDelay=150;
export function Popover({label,children,closeLabel,hideClose,open,defaultOpen=false,onOpenChange,trigger,openOnHover,testID,tone,className,style}:PopoverProps){
 const {messages,direction,locale,density}=useHIG();const themeStyle=useThemeStyle();
 const [current,set]=useControllable(open,defaultOpen,onOpenChange,null);
 const timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),hovered=useRef(false),pinned=useRef(false);
 useEffect(()=>()=>clearTimeout(timer.current),[]);
 // Hover handlers only for a mouse: a touch's pointerenter comes just before its click, which toggles. A hover opens without moving focus into the popover.
 const hover=openOnHover?{
  onPointerEnter:(event:React.PointerEvent)=>{if(event.pointerType!=='mouse')return;clearTimeout(timer.current);if(!current){hovered.current=true;set(true);}},
  onPointerLeave:(event:React.PointerEvent)=>{if(event.pointerType!=='mouse'||pinned.current)return;clearTimeout(timer.current);timer.current=setTimeout(()=>set(false),hoverCloseDelay);},
 }:undefined;
 // A click on the trigger of a hover-opened popover pins it open instead of toggling it shut: the pointer always hovers before it clicks.
 const pin=openOnHover?{onClick:(event:React.MouseEvent)=>{if(!hovered.current)return;event.preventDefault();clearTimeout(timer.current);hovered.current=false;pinned.current=true;}}:undefined;
 return <Pop.Root open={current} onOpenChange={next=>{clearTimeout(timer.current);if(!next){hovered.current=false;pinned.current=false;}set(next);}}>
  <Pop.Trigger asChild {...hover} {...pin}>{trigger??<Button intent='secondary' suppressFeedback>{label}</Button>}</Pop.Trigger>
  <Pop.Portal><Pop.Content {...hover} className={`hig-popover${className?` ${className}`:''}`} data-tone={tone} sideOffset={6} collisionPadding={16} style={style?{...themeStyle,...style}:themeStyle} dir={direction} lang={locale} data-hig-density={density} aria-label={trigger?label:undefined} data-testid={testID} onOpenAutoFocus={event=>{if(hovered.current)event.preventDefault();}}>
   {children}
   {hideClose?null:<Pop.Close asChild><Button intent='ghost' suppressFeedback>{closeLabel??messages.close??en.close}</Button></Pop.Close>}
  </Pop.Content></Pop.Portal>
 </Pop.Root>;
}
