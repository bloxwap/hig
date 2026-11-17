"use client";
import React,{useId,useMemo} from 'react';
import * as en from '@bloxwap/hig/contracts/messages';
import {QR_QUIET_ZONE,qrCodeGeometry,qrFrame,type QRErrorCorrection} from '@bloxwap/hig/contracts/qr';
import {useHIG} from './provider.js';
export type {QRErrorCorrection} from '@bloxwap/hig/contracts/qr';
export interface QRCodeProps extends Omit<React.SVGAttributes<SVGSVGElement>,'children'|'width'|'height'|'viewBox'> {
 /** The text to encode: an address, a payment URI, a link. Digits pack tightest, then upper-case alphanumerics, then UTF-8. A value too long for a QR code draws an empty square. */
 value:string;
 /** Edge of the square in CSS pixels, quiet zone included; default 196. Host CSS on the element may resize it: the drawing scales. */
 size?:number;
 /** Drawn over the centre, which is cleared of modules: an image URL, or a node such as a token mark laid out in the arena's box. */
 arena?:React.ReactNode;
 /** Error correction level. Defaults to `high` with an arena, which covers part of the code, and `medium` without. */
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
/**
 * A QR code in the Cuer style: round modules, rounded finder patterns and an optional arena in the centre. HIG encodes the
 * value itself, so no package is needed, and the whole code is one path in one inline SVG. The value is encoded once per
 * `value`, `errorCorrection` and arena; `size`, the colours and the quiet zone only change attributes.
 */
export function QRCode({value,size=196,arena,errorCorrection,color,background,quietZone=QR_QUIET_ZONE,label,decorative=false,className,...rest}:QRCodeProps){
 const {messages}=useHIG();const id=`hig-qr-${useId().replace(/[^a-zA-Z0-9_-]/g,'')}`;const withArena=drawn(arena);
 const geometry=useMemo(()=>qrCodeGeometry(value,{errorCorrection,arena:withArena}),[value,errorCorrection,withArena]);
 const frame=useMemo(()=>geometry?qrFrame(geometry,size,quietZone):null,[geometry,size,quietZone]);
 const tile=background==='none'||background==='transparent'?null:background??'var(--hig-background,transparent)';
 const named=!decorative&&geometry!==null;const box=frame?.arena;
 return <svg focusable='false' {...rest} className={`hig-qr-code${className?` ${className}`:''}`} width={size} height={size} viewBox={frame?.viewBox} role={named?'img':undefined} aria-label={named?label??messages.qrCode??en.qrCode:undefined} aria-hidden={named?undefined:true} data-empty={geometry?undefined:''}>
  {tile&&frame&&<rect x={-frame.quietZone} y={-frame.quietZone} width={frame.span} height={frame.span} rx={frame.tileRadius} style={{fill:tile}}/>}
  {geometry&&<path d={geometry.path} style={{fill:color??'var(--hig-text,currentColor)'}}/>}
  {box&&(typeof arena==='string'
   ?<><clipPath id={id}><rect x={box.x} y={box.x} width={box.size} height={box.size} rx={box.radius}/></clipPath><image href={arena} x={box.x} y={box.x} width={box.size} height={box.size} preserveAspectRatio='xMidYMid slice' clipPath={`url(#${id})`}/></>
   // A node is laid out in CSS pixels: the nested viewport maps the arena's box to its size at `size`.
   :<svg x={box.x} y={box.x} width={box.size} height={box.size} viewBox={`0 0 ${box.edge} ${box.edge}`}><foreignObject width={box.edge} height={box.edge}><div className='hig-qr-code-arena' style={{width:box.edge,height:box.edge,borderRadius:box.corner}}>{arena}</div></foreignObject></svg>)}
 </svg>;
}
