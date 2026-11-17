"use client";
import React,{useEffect,useMemo,useRef,useState} from 'react';
import {avatarColorRoles as paletteRoles,avatarInitials,avatarSide,beamAvatar,beamEye,beamSize} from '@bloxwap/hig/contracts/avatar';
import {useColors} from './provider.js';
/** Token roles of the default face palette, in this order: the `avatarColorRoles` of `@bloxwap/hig/contracts/avatar`, which web and native share. The order and the number of colours decide which colours a seed lands on. */
export const avatarColorRoles=paletteRoles;
export interface AvatarProps {
 /** The person or account. It is the accessible name, the first two letters are the initials, and it is the seed of the generated face unless `seed` is given. */
 name:string;
 /** An image to show instead, cropped to fill the box. If it fails to load, the initials or the generated face show in its place. */
 src?:string;
 /** What the generated face is drawn from, such as a wallet address. The same seed and colours draw the same face on web and native. It is case-sensitive. Passing it selects the generated face. Defaults to `name`. */
 seed?:string;
 /** What shows without an image: `initials`, the first two letters of `name` on the well fill, or `beam`, a generated face. Defaults to `initials`, or to `beam` when `seed` is given. */
 variant?:'initials'|'beam';
 /** Width and height in CSS pixels. Defaults to 40. With it, the initials are drawn at 40% of the size. A size that is not a finite number of zero or more is ignored. */
 size?:number;
 /** Palette of the generated face, as CSS colours. Defaults to the `action`, `info`, `negative` and `warning` token roles (`avatarColorRoles`), which are Display P3 where the screen supports it. A seed picks by position, so the same list in the same order keeps the same faces. */
 colors?:readonly string[];
 /** One colour for the eyes and mouth of every generated face. Left out, each face takes the `background` role on a bright colour and the `text` role on a deep one. */
 faceColor?:string;
 /** A square with no rounded corners instead of a disc, for a host that clips it to its own shape. */
 square?:boolean;
 /** Hides the avatar from assistive technology, for an avatar beside the name it stands for. */
 decorative?:boolean;
}
const beamPaints=avatarColorRoles.map(role=>`var(--hig-${role})`),beamInks={dark:'var(--hig-background)',light:'var(--hig-text)'},beamBox=`0 0 ${beamSize} ${beamSize}`;
/** The generated face as inline SVG. The drawing is kept until its seed, colours or ink change, so a parent or a provider that renders again with the same face computes nothing and writes nothing to the page. */
function BeamFace({seed,colors,faceColor}: {seed:string;colors?:readonly string[];faceColor?:string}){
 // The default palette paints the CSS variables (Display P3 where supported) and chooses each ink from the provider's resolved roles, so a host `primaryColor` is read too.
 // A host often writes its palette inline, so the palette is compared by its colours, not by the array.
 const roles=useColors(),own=colors&&colors.length>0?colors:undefined,palette=own?.join('\n');
 return useMemo(()=>{
  const face=beamAvatar(seed,own??avatarColorRoles.map(role=>roles[role]),beamInks),paint=own??beamPaints,ink=faceColor??face.faceColor;
  return <svg viewBox={beamBox} aria-hidden='true' focusable='false'>
   <rect width={beamSize} height={beamSize} style={{fill:paint[face.backgroundIndex]}}/>
   <rect width={beamSize} height={beamSize} rx={face.wrapperRadius} transform={face.wrapperTransform} style={{fill:paint[face.wrapperIndex]}}/>
   <g transform={face.faceTransform}>
    <path d={face.mouthPath} style={face.mouthStroked?{fill:'none',stroke:ink,strokeLinecap:'round'}:{fill:ink}}/>
    <rect x={face.leftEyeX} y={beamEye.y} width={beamEye.width} height={beamEye.height} rx={beamEye.radius} style={{fill:ink}}/>
    <rect x={face.rightEyeX} y={beamEye.y} width={beamEye.width} height={beamEye.height} rx={beamEye.radius} style={{fill:ink}}/>
   </g>
  </svg>;
  // `own` is read through `palette`: the same colours in a new array are the same drawing.
 },[seed,palette,faceColor,roles]);
}
const samePalette=(a?:readonly string[],b?:readonly string[])=>a===b||(a!=null&&b!=null&&a.length===b.length&&a.every((color,index)=>color===b[index]));
/**
 * The same props: each one identical, and `colors` the same colours in whichever array, because a host often writes its palette inline.
 * Each prop is read by name, because walking a list of names costs as much as the render it saves. `tests/avatar.dom.test.tsx` changes every prop of AvatarProps in turn, so a prop this does not read fails there.
 */
const sameProps=(a:AvatarProps,b:AvatarProps)=>a.name===b.name&&a.seed===b.seed&&a.src===b.src&&a.size===b.size&&a.variant===b.variant&&a.faceColor===b.faceColor&&a.square===b.square&&a.decorative===b.decorative&&samePalette(a.colors,b.colors);
/** What Avatar draws, kept while its props are the same: a list that renders again runs none of this for the rows that did not change. */
const Drawing=React.memo(function AvatarDrawing({name,src,seed,variant,size,colors,faceColor,square,decorative}:AvatarProps){
 const [failed,setFailed]=useState<string>();const image=useRef<HTMLImageElement>(null);
 // An image that failed before this component could listen (a server-rendered page that has not hydrated yet) has fired its error event already.
 // It reads as complete with no width; `decode()` tells it from a sound image with no size of its own, such as some SVG files.
 useEffect(()=>{
  const node=image.current;if(!src||!node||!node.complete||node.naturalWidth>0||typeof node.decode!=='function')return;
  let current=true;node.decode().catch(()=>{if(current)setFailed(src);});
  return ()=>{current=false;};
 },[src]);
 const side=avatarSide(size),box=side===undefined?undefined:{width:side,height:side},flat=square||undefined;
 if(src&&failed!==src)return <img ref={image} className='hig-avatar' alt={decorative?'':name} src={src} style={box} data-square={flat} onError={()=>setFailed(src)}/>;
 const named=decorative?{'aria-hidden':true}:{role:'img','aria-label':name};
 if((variant??(seed==null?'initials':'beam'))==='beam')return <span {...named} className='hig-avatar' data-variant='beam' data-square={flat} style={box}><BeamFace seed={seed??name} colors={colors} faceColor={faceColor}/></span>;
 return <span {...named} className='hig-avatar' data-square={flat} style={side===undefined?undefined:{width:side,height:side,fontSize:side*0.4,lineHeight:1}}>{avatarInitials(name)}</span>;
},sameProps);
/** A person or account as a 40px disc: an image, else the first two letters of the name, else (with `variant='beam'` or a `seed`) a face generated from the seed. The face is an identity picture, so it is the same in right-to-left layouts and it never moves. It renders again only when one of its props changes. */
export function Avatar({name,src,seed,variant,size,colors,faceColor,square,decorative}:AvatarProps){return <Drawing name={name} src={src} seed={seed} variant={variant} size={size} colors={colors} faceColor={faceColor} square={square} decorative={decorative}/>;}
