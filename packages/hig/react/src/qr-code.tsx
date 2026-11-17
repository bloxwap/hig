"use client";
import React,{useMemo} from 'react';
import * as en from '@bloxwap/hig/contracts/messages';
import {QR_QUIET_ZONE,qrCodeGeometry,qrFrame,type QRErrorCorrection} from '@bloxwap/hig/contracts/qr';
import {useHIG} from './provider.js';
export type {QRErrorCorrection} from '@bloxwap/hig/contracts/qr';
export interface QRCodeProps extends Omit<React.HTMLAttributes<HTMLSpanElement>,'children'|'color'> {
 /** The text to encode: an address, a payment URI, a link. Digits pack tightest, then upper-case alphanumerics, then UTF-8. A value too long for a QR code draws an empty square. */
 value:string;
 /** Edge of the square in CSS pixels, quiet zone included; default 196. It sets `--hig-qr-code-size`, the element's width, so host CSS may resize the element: the drawing and the arena's box scale with it. */
 size?:number;
 /** Drawn over the centre, which is cleared of modules: an image URL, or a node such as a token mark laid out in the arena's box. */
 arena?:React.ReactNode;
 /** Error correction level. Defaults to `high` with an arena, which covers part of the code, and `medium` without. With an arena, `low` and `medium` are raised to `quartile` so the code still reads. */
 errorCorrection?:QRErrorCorrection;
 /** Colour of the modules. Defaults to the text role, `var(--hig-text)`. */
 color?:string;
 /** Colour of the tile behind the code. Defaults to the background role, `var(--hig-background)`; `'none'` draws no tile, for a code that sits on the host's own surface. */
 background?:string;
 /** Clear modules kept on every side, inside `size`; default 4, the margin scanners expect. Pass 0 only where the host keeps that margin itself. */
 quietZone?:number;
 /** Accessible name. Defaults to the built-in “QR code”. */
 label?:string;
 /** Hides the code from assistive technology, for a host that names it on an element of its own. */
 decorative?:boolean;
}
const drawn=(node:React.ReactNode)=>node!=null&&node!==false&&node!==true&&node!=='';
const percent=(fraction:number)=>`${Math.round(fraction*1e6)/1e4}%`;
/**
 * A QR code in the Cuer style: round modules, rounded finder patterns and an optional arena in the centre. HIG encodes the
 * value itself, so no package is needed, and the whole code is one path in one inline SVG. The value is encoded once per
 * `value`, `errorCorrection` and arena; `size`, the colours and the quiet zone only change attributes.
 *
 * The arena is an HTML box over the SVG, not a `foreignObject` inside it: WebKit paints positioned, transformed or
 * translucent content of a `foreignObject` at the SVG's corner, where it would cover a finder pattern.
 */
export function QRCode({value,size=196,arena,errorCorrection,color,background,quietZone=QR_QUIET_ZONE,label,decorative=false,className,style,...rest}:QRCodeProps){
 const {messages}=useHIG();const withArena=drawn(arena);
 const geometry=useMemo(()=>qrCodeGeometry(value,{errorCorrection,arena:withArena}),[value,errorCorrection,withArena]);
 const frame=useMemo(()=>geometry?qrFrame(geometry,size,quietZone):null,[geometry,size,quietZone]);
 const tile=background==='none'||background==='transparent'?null:background??'var(--hig-background,transparent)';
 const named=!decorative&&geometry!==null;const box=frame?.arena;
 // Percentages of the square, so the box stays over the cleared modules when host CSS resizes the code. Physical `left`: a right-to-left page does not mirror a QR code.
 const boxStyle=box?{left:percent(box.inset),top:percent(box.inset),width:percent(box.extent),height:percent(box.extent),borderRadius:percent(box.radius/box.size)}:undefined;
 return <span {...rest} className={`hig-qr-code${className?` ${className}`:''}`} style={{'--hig-qr-code-size':`${size}px`,...style} as React.CSSProperties} role={named?'img':undefined} aria-label={named?label??messages.qrCode??en.qrCode:undefined} aria-hidden={named?undefined:true} data-empty={geometry?undefined:''}>
  <svg aria-hidden='true' focusable='false' width={size} height={size} viewBox={frame?.viewBox}>
   {tile&&frame&&<rect x={-frame.quietZone} y={-frame.quietZone} width={frame.span} height={frame.span} rx={frame.tileRadius} style={{fill:tile}}/>}
   {geometry&&<path d={geometry.path} style={{fill:color??'var(--hig-text,currentColor)'}}/>}
  </svg>
  {box&&<span className='hig-qr-code-arena' style={boxStyle}>{typeof arena==='string'?<img className='hig-qr-code-image' src={arena} alt='' draggable={false}/>:arena}</span>}
 </span>;
}
