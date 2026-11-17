import React from 'react';
import Svg,{G,Path,Rect} from 'react-native-svg';
import {avatarColorRoles as paletteRoles,avatarSide,beamAvatar,beamEye,beamSize} from '@bloxwap/hig/contracts/avatar';
import {AvatarFrame,avatarSize,sameFrame,type AvatarFrameProps} from './avatar-frame.js';
import {useColors} from './provider.js';
/** Token roles of the default face palette, in this order: the `avatarColorRoles` of `@bloxwap/hig/contracts/avatar`, which web and native share. The order and the number of colours decide which colours a seed lands on. */
export const avatarColorRoles=paletteRoles;
export interface AvatarProps extends AvatarFrameProps {
 /** What the generated face is drawn from, such as a wallet address. The same seed and colours draw the same face on web and native. It is case-sensitive. Passing it selects the generated face. Defaults to `name`. */
 seed?:string;
 /** What shows without an image: `initials`, the first two letters of `name` on the well fill, or `beam`, a generated face. Defaults to `initials`, or to `beam` when `seed` is given. */
 variant?:'initials'|'beam';
 /** Palette of the generated face, as React Native colours. Defaults to the `action`, `info`, `negative` and `warning` roles of the provider's colour table (`avatarColorRoles`), which is Display P3 on an iOS host that paints in it. A seed picks by position, so the same list in the same order keeps the same faces. */
 colors?:readonly string[];
 /** One colour for the eyes and mouth of every generated face. Left out, each face takes the `background` role on a bright colour and the `text` role on a deep one. */
 faceColor?:string;
}
const beamBox=`0 0 ${beamSize} ${beamSize}`;
const samePalette=(a?:readonly string[],b?:readonly string[])=>a===b||(a!=null&&b!=null&&a.length===b.length&&a.every((color,index)=>color===b[index]));
/** The generated face in react-native-svg. Memoised on what it draws, so a list that re-renders with the same seeds and colours costs nothing here. */
const BeamFace=React.memo(function BeamFace({seed,size,colors,faceColor}: {seed:string;size:number;colors?:readonly string[];faceColor?:string}){
 const roles=useColors();
 const face=beamAvatar(seed,colors&&colors.length>0?colors:avatarColorRoles.map(role=>roles[role]),{dark:roles.background,light:roles.text});
 const ink=faceColor??face.faceColor,mouthFill=face.mouthStroked?'none':ink,mouthStroke=face.mouthStroked?ink:'none';
 return <Svg width={size} height={size} viewBox={beamBox}>
  <Rect width={beamSize} height={beamSize} fill={face.backgroundColor}/>
  <Rect width={beamSize} height={beamSize} rx={face.wrapperRadius} transform={face.wrapperTransform} fill={face.wrapperColor}/>
  <G transform={face.faceTransform}>
   <Path d={face.mouthPath} fill={mouthFill} stroke={mouthStroke} strokeLinecap='round'/>
   <Rect x={face.leftEyeX} y={beamEye.y} width={beamEye.width} height={beamEye.height} rx={beamEye.radius} fill={ink}/>
   <Rect x={face.rightEyeX} y={beamEye.y} width={beamEye.width} height={beamEye.height} rx={beamEye.radius} fill={ink}/>
  </G>
 </Svg>;
},(previous,next)=>previous.seed===next.seed&&previous.size===next.size&&previous.faceColor===next.faceColor&&samePalette(previous.colors,next.colors));
/** What `Drawing` takes: the props of Avatar, with the frame's kept as the one object Avatar already holds. */
interface DrawingProps extends Pick<AvatarProps,'seed'|'variant'|'colors'|'faceColor'> {frame:AvatarFrameProps}
/** The same props: each one identical, `colors` the same colours in whichever array and `source` the same image in whichever object, because a host often writes both inline. Each prop is read by name, as in `sameFrame`. */
const sameProps=(a:DrawingProps,b:DrawingProps)=>sameFrame(a.frame,b.frame)&&a.seed===b.seed&&a.variant===b.variant&&a.faceColor===b.faceColor&&samePalette(a.colors,b.colors);
/** What Avatar draws, kept while its props are the same: a list that renders again renders no frame and no view for the rows that did not change. */
const Drawing=React.memo(function AvatarDrawing({seed,variant,colors,faceColor,frame}:DrawingProps){
 const beam=(variant??(seed==null?'initials':'beam'))==='beam';
 return <AvatarFrame {...frame} face={beam?<BeamFace seed={seed??frame.name} size={avatarSide(frame.size)??avatarSize} colors={colors} faceColor={faceColor}/>:undefined}/>;
},sameProps);
/**
 * A person or account as a 40dp disc: an image, else the first two letters of the name on the well fill (one step lighter inside a Surface, Dialog or sheet),
 * else (with `variant='beam'` or a `seed`) a face generated from the seed. The face is an identity picture, so it is the same in right-to-left layouts and it never moves.
 * This entry draws the face with `react-native-svg`; `Avatar` from `@bloxwap/hig/native/status` is the same component without the face and without that peer.
 * It renders again only when one of its props changes.
 */
export function Avatar({seed,variant,colors,faceColor,...frame}:AvatarProps){return <Drawing seed={seed} variant={variant} colors={colors} faceColor={faceColor} frame={frame}/>;}
