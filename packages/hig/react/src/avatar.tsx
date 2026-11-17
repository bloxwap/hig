"use client";
import React,{useState} from 'react';
import {beamAvatar,beamEye,beamSize} from '@bloxwap/hig/contracts/avatar';
import {useColors} from './provider.js';
/** Token roles of the default face palette, in this order. The order and the number of colours decide which colours a seed lands on. */
export const avatarColorRoles=['action','info','negative','warning'] as const;
export interface AvatarProps {
 /** The person or account. It is the accessible name, the first two letters are the initials, and it is the seed of the generated face unless `seed` is given. */
 name:string;
 /** An image to show instead. If it fails to load, the initials or the generated face show in its place. */
 src?:string;
 /** What the generated face is drawn from, such as a wallet address. The same seed and colours draw the same face on web and native. It is case-sensitive. Passing it selects the generated face. Defaults to `name`. */
 seed?:string;
 /** What shows without an image: `initials`, the first two letters of `name` on the well fill, or `beam`, a generated face. Defaults to `initials`, or to `beam` when `seed` is given. */
 variant?:'initials'|'beam';
 /** Width and height in CSS pixels. Defaults to 40. With it, the initials are drawn at 40% of the size. */
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
const samePalette=(a?:readonly string[],b?:readonly string[])=>a===b||(a!==undefined&&b!==undefined&&a.length===b.length&&a.every((color,index)=>color===b[index]));
/** The generated face as inline SVG. Memoised on what it draws, so a parent that re-renders with the same seed and colours costs nothing here. */
const BeamFace=React.memo(function BeamFace({seed,colors,faceColor}: {seed:string;colors?:readonly string[];faceColor?:string}){
 // The default palette paints the CSS variables (Display P3 where supported) and chooses each ink from the provider's resolved roles, so a host `primaryColor` is read too.
 const roles=useColors(),own=colors&&colors.length>0?colors:undefined;
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
},(previous,next)=>previous.seed===next.seed&&previous.faceColor===next.faceColor&&samePalette(previous.colors,next.colors));
/** A person or account as a 40px disc: an image, else the first two letters of the name, else (with `variant='beam'` or a `seed`) a face generated from the seed. The face is an identity picture, so it is the same in right-to-left layouts and it never moves. */
export function Avatar({name,src,seed,variant,size,colors,faceColor,square,decorative}:AvatarProps){
 const [failed,setFailed]=useState<string>();
 const box=size===undefined?undefined:{width:size,height:size},flat=square||undefined;
 if(src&&failed!==src)return <img className='hig-avatar' alt={decorative?'':name} src={src} style={box} data-square={flat} onError={()=>setFailed(src)}/>;
 const named=decorative?{'aria-hidden':true}:{role:'img','aria-label':name};
 if((variant??(seed===undefined?'initials':'beam'))==='beam')return <span {...named} className='hig-avatar' data-variant='beam' data-square={flat} style={box}><BeamFace seed={seed??name} colors={colors} faceColor={faceColor}/></span>;
 return <span {...named} className='hig-avatar' data-square={flat} style={size===undefined?undefined:{width:size,height:size,fontSize:size*0.4,lineHeight:1}}>{name.slice(0,2)}</span>;
}
