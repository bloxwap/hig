"use client";
import React,{Children,useId} from 'react';
import {PressDecoration} from './provider.js';
export interface ListGroupProps extends Omit<React.HTMLAttributes<HTMLElement>,'title'> {
 /** Heading above the group, such as “Settings”. Omit it for an untitled group. */
 title?:string;
 /** `ListRow` elements. */
 children?:React.ReactNode;
}
/** A grouped list for menus and settings: an optional heading over rows that share one rounded container. */
export function ListGroup({title,children,className,...rest}:ListGroupProps){
 const id=useId();
 return <section {...rest} className={`hig-list-group${className?` ${className}`:''}`} aria-labelledby={title?id:undefined}>
  {title&&<h3 id={id} className='hig-list-group-title'>{title}</h3>}
  <ul className='hig-list-group-rows'>{Children.toArray(children).map((child,index)=><li key={React.isValidElement(child)&&child.key!=null?child.key:index}>{child}</li>)}</ul>
 </section>;
}
export interface ListRowProps extends Omit<React.HTMLAttributes<HTMLElement>,'onSelect'> {
 label:string;
 /** Artwork before the label, such as an icon. Decorative: the label names the row. */
 leading?:React.ReactNode;
 /** Short text on the trailing edge, such as `Off`, `English` or a balance. */
 value?:React.ReactNode;
 /** Anything richer on the trailing edge: icons, a `Badge`, or a control such as a `Switch`. */
 trailing?:React.ReactNode;
 /** Makes the whole row a button, usually one that opens another view, and shows the disclosure chevron. */
 onSelect?:()=>void;
 /** Makes the whole row a link and shows the disclosure chevron. */
 href?:string;
 /** Dims the row and blocks `onSelect` and `href`. */
 disabled?:boolean;
}
const chevron=<svg className='hig-list-row-chevron' aria-hidden='true' focusable='false' viewBox='0 0 20 20' width='20' height='20' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round'><path d='m7.5 4.5 5.5 5.5-5.5 5.5'/></svg>;
/** One row of a `ListGroup`: the label leads; a value, icons, a badge or a control trail. With `onSelect` or `href` the whole row is one target and shows a disclosure chevron; without them the row is static, so a control in `trailing` is its only target. */
export function ListRow({label,leading,value,trailing,onSelect,href,disabled,className,...rest}:ListRowProps){
 const action=!disabled&&(onSelect||href!=null);
 const content=<>
  {leading!=null&&<span className='hig-list-row-leading' aria-hidden='true'>{leading}</span>}
  <span className='hig-list-row-label'>{label}</span>
  {value!=null&&<span className='hig-list-row-value'>{value}</span>}
  {trailing!=null&&<span className='hig-list-row-trailing'>{trailing}</span>}
  {(onSelect||href!=null)&&chevron}
 </>;
 const classes=`hig-list-row${className?` ${className}`:''}`;
 if(action&&href!=null)return <a {...(rest as React.AnchorHTMLAttributes<HTMLAnchorElement>)} className={classes} href={href} onClick={onSelect}>{content}<PressDecoration kind='row'/></a>;
 if(onSelect)return <button type='button' {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)} className={classes} disabled={disabled} onClick={onSelect}>{content}<PressDecoration kind='row' disabled={!!disabled}/></button>;
 return <div {...rest} className={classes} aria-disabled={disabled||undefined}>{content}</div>;
}
