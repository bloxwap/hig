import React,{useMemo} from 'react';
import {Image,StyleSheet,View,type StyleProp,type ViewStyle} from 'react-native';
import Svg,{Path,Rect} from 'react-native-svg';
import {QR_QUIET_ZONE,qrCodeGeometry,qrFrame,type QRErrorCorrection} from '@bloxwap/hig/contracts/qr';
import {useColors,useMessages} from './provider.js';
export type {QRErrorCorrection} from '@bloxwap/hig/contracts/qr';
export interface QRCodeProps {
 /** The text to encode: an address, a payment URI, a link. Digits pack tightest, then upper-case alphanumerics, then UTF-8. A value too long for a QR code draws an empty square. */
 value:string;
 /** Edge of the square in dp, quiet zone included; default 196. */
 size?:number;
 /** Drawn over the centre, which is cleared of modules: an image URL, or a node such as a token mark laid out in the arena's box. */
 arena?:React.ReactNode;
 /** Error correction level. Defaults to `high` with an arena, which covers part of the code, and `medium` without. */
 errorCorrection?:QRErrorCorrection;
 /** Colour of the modules. Defaults to the provider's `text` role. */
 color?:string;
 /** Colour of the tile behind the code. Defaults to the provider's `background` role; `'none'` draws no tile, for a code that sits on the host's own surface. */
 background?:string;
 /** Clear modules kept on every side, inside `size`; default 4, the margin scanners expect. Pass 0 only where the host keeps that margin itself. */
 quietZone?:number;
 /** Accessible name. Defaults to the built-in “QR code”. */
 label?:string;
 /** Hides the code from assistive technology, for a host that names it on an element of its own. */
 decorative?:boolean;
 /** Also the prefix of `-code` (the drawing) and `-arena` (the image or node in the centre). */
 testID?:string;
 style?:StyleProp<ViewStyle>;
}
const hidden={accessible:false,accessibilityElementsHidden:true,importantForAccessibility:'no-hide-descendants' as const};
const drawn=(node:React.ReactNode)=>node!=null&&node!==false&&node!==true&&node!=='';
// Centred rather than offset from an edge, so a right-to-left layout cannot move the arena off the cleared square.
const styles=StyleSheet.create({centre:{position:'absolute',top:0,right:0,bottom:0,left:0,alignItems:'center',justifyContent:'center'},arena:{overflow:'hidden',alignItems:'center',justifyContent:'center'}});
/**
 * A QR code in the Cuer style: round modules, rounded finder patterns and an optional arena in the centre. HIG encodes the
 * value itself; the drawing is one `react-native-svg` path, so the only peer is `react-native-svg`. The value is encoded once
 * per `value`, `errorCorrection` and arena; `size`, the colours and the quiet zone only change props of the drawing.
 */
export function QRCode({value,size=196,arena,errorCorrection,color,background,quietZone=QR_QUIET_ZONE,label,decorative=false,testID,style}:QRCodeProps){
 const colors=useColors();const t=useMessages();const withArena=drawn(arena);
 const geometry=useMemo(()=>qrCodeGeometry(value,{errorCorrection,arena:withArena}),[value,errorCorrection,withArena]);
 const frame=useMemo(()=>geometry?qrFrame(geometry,size,quietZone):null,[geometry,size,quietZone]);
 const tile=background==='none'||background==='transparent'?null:background??colors.background;
 const named=!decorative&&geometry!==null;const box=frame?.arena;
 const access=named?{accessible:true,accessibilityRole:'image' as const,accessibilityLabel:label??t.qrCode}:hidden;
 const codeID=testID?`${testID}-code`:undefined,arenaID=testID?`${testID}-arena`:undefined;
 const boxStyle=box?{width:box.edge,height:box.edge,borderRadius:box.corner}:undefined;
 return <View {...access} testID={testID} style={[{width:size,height:size},style]}>
  <Svg width={size} height={size} viewBox={frame?.viewBox} accessible={false} testID={codeID}>
   {tile&&frame?<Rect x={-frame.quietZone} y={-frame.quietZone} width={frame.span} height={frame.span} rx={frame.tileRadius} fill={tile}/>:null}
   {geometry?<Path d={geometry.path} fill={color??colors.text}/>:null}
  </Svg>
  {box?<View {...hidden} pointerEvents='none' style={styles.centre}>{typeof arena==='string'?<Image source={{uri:arena}} testID={arenaID} style={boxStyle}/>:<View testID={arenaID} style={[styles.arena,boxStyle]}>{arena}</View>}</View>:null}
 </View>;
}
