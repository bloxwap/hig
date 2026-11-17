import React,{useState} from 'react';
import {Image,View,type ImageSourcePropType} from 'react-native';
import {Text} from './surface.js';
import {useFills} from './provider.js';
/** The side of an avatar when `size` is left out. */
export const avatarSize=40;
/** What every Avatar takes, with or without the generated face. */
export interface AvatarFrameProps {
 /** The person or account. It is the accessible name, and the first two letters are the initials. */
 name:string;
 /** An image to show instead. If it fails to load, the fallback shows in its place. */
 source?:ImageSourcePropType;
 /** Width and height in dp. Defaults to 40. With it, the initials are drawn at 40% of the size. */
 size?:number;
 /** A square with no rounded corners instead of a disc, for a host that clips it to its own shape. */
 square?:boolean;
 /** Hides the avatar from VoiceOver and TalkBack, for an avatar beside the name it stands for. */
 decorative?:boolean;
}
const unread={accessible:false,accessibilityElementsHidden:true,importantForAccessibility:'no-hide-descendants' as const};
/** What identifies an image source across renders: its address (a host often builds `{uri}` inline), or the `require` number. */
const sourceKey=(source:ImageSourcePropType):unknown=>Array.isArray(source)?source.map(item=>item.uri).join(' '):typeof source==='object'&&source!==null?(source as {uri?:string}).uri??source:source;
/**
 * The box behind every Avatar: the image, else `face` clipped to the box, else the first two letters on the well fill.
 * Internal. `status` renders it with no face and `avatar` with the generated one, so only the `avatar` entry loads `react-native-svg`.
 */
export function AvatarFrame({name,source,size,square,decorative,face}:AvatarFrameProps&{/** Drawn in place of the initials, filling the box. */face?:React.ReactNode}){
 const fills=useFills();const [failed,setFailed]=useState<{key:unknown}>();
 const side=size??avatarSize,borderRadius=square?0:side/2;
 if(source){const key=sourceKey(source);if(!failed||failed.key!==key){const reading=decorative?unread:{accessibilityLabel:name};return <Image {...reading} source={source} onError={()=>setFailed({key})} style={{width:side,height:side,borderRadius}}/>;}}
 const reading=decorative?unread:{accessible:true,accessibilityRole:'image' as const,accessibilityLabel:name};
 if(face!=null)return <View {...reading} style={{width:side,height:side,borderRadius,overflow:'hidden'}}>{face}</View>;
 return <View {...reading} style={{width:side,height:side,borderRadius,backgroundColor:fills.well,alignItems:'center',justifyContent:'center'}}><Text accessible={false} style={size===undefined?undefined:{fontSize:Math.round(size*0.4),lineHeight:Math.round(size*0.6)}}>{name.slice(0,2)}</Text></View>;
}
