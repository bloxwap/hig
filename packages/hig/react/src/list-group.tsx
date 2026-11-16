"use client";
import React,{Children,forwardRef,useId,useRef} from 'react';
import * as en from '@bloxwap/hig/contracts/messages';
import {PressDecoration,useControllable,useHIG} from './provider.js';
/** A text action on the trailing edge of a `ListGroup` heading, such as “Cancel all”. */
export interface ListGroupAction {
 /** Host text drawn as the action and naming it. */
 label:string;
 onSelect:()=>void;
 disabled?:boolean;
}
export interface ListGroupProps extends Omit<React.HTMLAttributes<HTMLElement>,'title'> {
 /** Heading above the group, such as “Settings”: host text or an element such as a live count. Omit it for an untitled group. */
 title?:React.ReactNode;
 /** Host content after the title, such as a count or a figure. It is read with the heading; the group itself stays named by the title. */
 titleAccessory?:React.ReactNode;
 /** A text action on the trailing edge of the heading. */
 action?:ListGroupAction;
 /** Host content between the heading and the rows, such as a note or a field. A group with `intro` and no rows draws no row container. */
 intro?:React.ReactNode;
 /** `ListRow` elements. */
 children?:React.ReactNode;
}
const shown=(node:React.ReactNode)=>node!=null&&node!==false&&node!=='';
/** A grouped list for menus and settings: an optional heading over rows that share one rounded container. */
export function ListGroup({title,titleAccessory,action,intro,children,className,...rest}:ListGroupProps){
 const id=useId();
 const titled=shown(title),accessory=shown(titleAccessory);
 const heading=titled?accessory
  ?<h3 className='hig-list-group-title' data-accessory=''><span id={id}>{title}</span>{' '}<span className='hig-list-group-title-accessory'>{titleAccessory}</span></h3>
  :<h3 id={id} className='hig-list-group-title'>{title}</h3>:null;
 const rows=Children.toArray(children);
 return <section {...rest} className={`hig-list-group${className?` ${className}`:''}`} aria-labelledby={titled?id:undefined}>
  {action?<div className='hig-list-group-header'>{heading}<button type='button' className='hig-list-group-action' disabled={action.disabled} onClick={action.onSelect}>{action.label}<PressDecoration kind='button' disabled={!!action.disabled}/></button></div>:heading}
  {shown(intro)&&<div className='hig-list-group-intro'>{intro}</div>}
  {(!shown(intro)||rows.length>0)&&<ul className='hig-list-group-rows'>{rows.map((child,index)=><li key={React.isValidElement(child)&&child.key!=null?child.key:index}>{child}</li>)}</ul>}
 </section>;
}
export interface ListRowProps extends Omit<React.HTMLAttributes<HTMLElement>,'onSelect'|'defaultChecked'> {
 label:string;
 /** A muted second line under the label, such as a subtitle or an address. The row grows to fit it, and it is read with the label. */
 description?:React.ReactNode;
 /** Colours the label: `destructive` for an action that deletes or ends something, `muted` for one that is done or inactive. */
 tone?:'destructive'|'muted';
 /** Artwork before the label, such as an icon. Decorative: the label names the row. */
 leading?:React.ReactNode;
 /** Short text on the trailing edge, such as `Off`, `English` or a balance. A string or number is drawn muted. */
 value?:React.ReactNode;
 /** What a `value` that is not text reads as, such as the formatted amount of a live figure. The element is then hidden from assistive technology and this text is read in its place. */
 valueLabel?:string;
 /** Colours a string or number `value` instead of the muted default, keeping its layout and reading. */
 valueTone?:'positive'|'warning'|'negative'|'muted';
 /** Anything richer on the trailing edge: icons, a `Badge`, or a control such as a `Switch`. */
 trailing?:React.ReactNode;
 /** Makes the whole row a button, usually one that opens another view, and shows the disclosure chevron. */
 onSelect?:()=>void;
 /** Makes the whole row a link and shows the disclosure chevron. */
 href?:string;
 /** Dims the row and blocks `onSelect`, `href` and the switch. */
 disabled?:boolean;
 /** A row in a list of choices, such as a picker that selects and closes: `true` draws a check on the trailing edge and marks the row `aria-current`. With `selected` set, true or false, the row draws no chevron unless `disclosure` asks for one. */
 selected?:boolean;
 /** Something the row started is in progress: a spinner takes the disclosure's place, the row is marked busy and presses are ignored, without dimming it. */
 busy?:boolean;
 /** Busy text appended to the accessible name while `busy`; defaults to HIGProvider `messages.busy`. `''` omits it (the busy state stays exposed). */
 busyLabel?:string;
 /** The glyph a row with `onSelect` or `href` draws on its trailing edge: the `chevron` (default), `external` (an arrow, for something that opens outside the app) or `none`. */
 disclosure?:'chevron'|'external'|'none';
 /** Makes the row a switch: the whole row is the target, the switch on its trailing edge is named by `label`, and `onCheckedChange` receives the new state. Use with no `onSelect` or `href`. */
 checked?:boolean;
 defaultChecked?:boolean;
 onCheckedChange?:(checked:boolean)=>void;
}
const svg={'aria-hidden':true,focusable:false,viewBox:'0 0 20 20',width:20,height:20,fill:'none',stroke:'currentColor',strokeLinecap:'round',strokeLinejoin:'round'} as const;
const chevron=<svg className='hig-list-row-chevron' aria-hidden='true' focusable='false' viewBox='0 0 20 20' width='20' height='20' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round'><path d='m7.5 4.5 5.5 5.5-5.5 5.5'/></svg>;
const external=<svg {...svg} className='hig-list-row-chevron' data-glyph='external' strokeWidth='1.8'><path d='M6.5 13.5 14 6M8 5.5h6.5V12'/></svg>;
const check=<svg {...svg} className='hig-list-row-check' strokeWidth='2'><path d='m4.5 10.5 3.5 3.5 7.5-8'/></svg>;
/** One row of a `ListGroup`: the label leads; a value, icons, a badge or a control trail. With `onSelect` or `href` the whole row is one target and shows a disclosure chevron; with `checked` or `onCheckedChange` the whole row is a switch; otherwise the row is static, so a control in `trailing` is its only target. The ref reaches the row's element. */
export const ListRow:React.ForwardRefExoticComponent<ListRowProps&React.RefAttributes<HTMLElement>>=/* @__PURE__ */forwardRef<HTMLElement,ListRowProps>(function ListRow({label,description,tone,leading,value,valueLabel,valueTone,trailing,onSelect,href,disabled,selected,busy,busyLabel,disclosure,checked,defaultChecked,onCheckedChange,className,...rest},ref){
 const {messages}=useHIG();const descriptionId=useId();const input=useRef<HTMLInputElement>(null);
 const [on,setOn]=useControllable(checked,defaultChecked??false,onCheckedChange);
 const pressable=onSelect!=null||href!=null;
 const toggles=!pressable&&(checked!==undefined||defaultChecked!==undefined||onCheckedChange!=null);
 const action=!disabled&&!busy&&pressable;
 const text=typeof value==='string'||typeof value==='number';
 const busyText=busyLabel??messages.busy??en.busy;
 const name=<span className='hig-list-row-label' data-tone={tone}>{label}</span>;
 const glyphKind=disclosure??(selected!==undefined?'none':'chevron');
 const glyph=busy&&!toggles?<span className='hig-button-spinner hig-list-row-spinner' aria-hidden='true'/>:selected?check:pressable?(glyphKind==='chevron'?chevron:glyphKind==='external'?external:null):null;
 const swatch=toggles?<label className='hig-choice hig-switch'><input ref={input} role='switch' type='checkbox' checked={on} disabled={disabled} aria-busy={busy||undefined} aria-describedby={shown(description)?descriptionId:undefined} onChange={event=>{if(!busy)setOn(event.target.checked);}}/><span>{label}</span></label>:null;
 const content=<>
  {leading!=null&&<span className='hig-list-row-leading' aria-hidden='true'>{leading}</span>}
  {shown(description)?<span className='hig-list-row-text'>{name}<span id={descriptionId} className='hig-list-row-description'>{description}</span></span>:name}
  {value!=null&&<span className='hig-list-row-value' data-tone={text&&valueTone&&valueTone!=='muted'?valueTone:undefined}>{!text&&valueLabel?<><span aria-hidden='true'>{value}</span><span className='hig-sr-only'>{valueLabel}</span></>:value}</span>}
  {(trailing!=null||swatch)&&<span className='hig-list-row-trailing'>{trailing}{swatch}</span>}
  {glyph}
  {busy&&!toggles&&busyText?<span role='status' className='hig-busy hig-sr-only'> · {busyText}</span>:null}
 </>;
 const classes=`hig-list-row${className?` ${className}`:''}`;
 const current=selected?{'aria-current':true as const}:{};
 if(toggles){
  // A press anywhere outside the switch and the host's own controls toggles it; the input stays the one named control.
  const toggle=(event:React.MouseEvent<HTMLDivElement>)=>{const target=event.target as Element;if(disabled||busy||target.closest('.hig-switch')||target.closest('a[href],button,input,select,textarea,label'))return;input.current?.click();};
  return <div {...rest} ref={ref as React.Ref<HTMLDivElement>} className={classes} data-switch='' aria-disabled={disabled||undefined} onClick={event=>{rest.onClick?.(event);if(!event.defaultPrevented)toggle(event);}}>{content}<PressDecoration kind='switch' disabled={!!disabled||!!busy} input={input}/></div>;
 }
 if(action&&href!=null)return <a {...current} {...(rest as React.AnchorHTMLAttributes<HTMLAnchorElement>)} ref={ref as React.Ref<HTMLAnchorElement>} className={classes} href={href} onClick={onSelect}>{content}<PressDecoration kind='row'/></a>;
 if(onSelect)return <button type='button' {...current} {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)} ref={ref as React.Ref<HTMLButtonElement>} className={classes} disabled={disabled} aria-busy={busy||undefined} onClick={busy?undefined:onSelect}>{content}<PressDecoration kind='row' disabled={!!disabled||!!busy}/></button>;
 return <div {...current} {...rest} ref={ref as React.Ref<HTMLDivElement>} className={classes} aria-disabled={disabled||undefined} aria-busy={busy||undefined}>{content}</div>;
});
