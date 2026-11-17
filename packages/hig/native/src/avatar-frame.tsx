import React,{useState} from 'react';
import {Image,View,type ImageSourcePropType} from 'react-native';
import {avatarInitials,avatarSide} from '@bloxwap/hig/contracts/avatar';
import {Text} from './surface.js';
import {useFills} from './provider.js';
/** The side of an avatar when `size` is left out. */
export const avatarSize=40;
/** What every Avatar takes, with or without the generated face. */
export interface AvatarFrameProps {
 /** The person or account. It is the accessible name, and the first two letters are the initials. */
 name:string;
 /** An image to show instead, cropped to fill the box. If it fails to load, or it names no image (`{uri: undefined}`, an empty address), the fallback shows in its place. */
 source?:ImageSourcePropType;
 /** Width and height in dp. Defaults to 40. With it, the initials are drawn at 40% of the size and keep that size at every system text size, so they stay inside the box. A size that is not a finite number of zero or more is ignored. */
 size?:number;
 /** A square with no rounded corners instead of a disc, for a host that clips it to its own shape. */
 square?:boolean;
 /** Hides the avatar from VoiceOver and TalkBack, for an avatar beside the name it stands for. */
 decorative?:boolean;
}
const unread={accessible:false,accessibilityElementsHidden:true,importantForAccessibility:'no-hide-descendants' as const};
/**
 * What identifies an image source across renders: its address (a host often builds `{uri}` inline), or the `require` number.
 * Undefined when the source names no image (no address, an empty one, an empty list), which a host gets from `{uri: photo}` before the photo is known.
 */
function sourceKey(source:ImageSourcePropType|null|undefined):unknown{
 if(typeof source==='number'||typeof source==='string')return source||undefined;
 if(Array.isArray(source))return source.map(item=>sourceKey(item)).filter(key=>key!==undefined).join(' ')||undefined;
 if(typeof source!=='object'||source===null)return undefined;
 const uri=(source as {uri?:unknown}).uri;
 return typeof uri==='string'&&uri!==''?uri:undefined;
}
/**
 * The box behind every Avatar: the image, else `face` clipped to the box, else the first two letters on the well fill.
 * Internal. `status` renders it with no face and `avatar` with the generated one, so only the `avatar` entry loads `react-native-svg`.
 */
export function AvatarFrame({name,source,size,square,decorative,face}:AvatarFrameProps&{/** Drawn in place of the initials, filling the box. */face?:React.ReactNode}){
 const fills=useFills();const [failed,setFailed]=useState<{key:unknown}>();
 const sized=avatarSide(size),side=sized??avatarSize,borderRadius=square?0:side/2,key=sourceKey(source);
 // The fallback is a named image, so the photo is one too: an Image with a label alone is not an accessibility element on iOS.
 const reading=decorative?unread:{accessible:true,accessibilityRole:'image' as const,accessibilityLabel:name};
 if(source&&key!==undefined&&(!failed||failed.key!==key))return <Image {...reading} source={source} onError={()=>setFailed({key})} style={{width:side,height:side,borderRadius}}/>;
 if(face!=null)return <View {...reading} style={{width:side,height:side,borderRadius,overflow:'hidden'}}>{face}</View>;
 // Letters sized to the box stay that size, like the letters in HIG's other fixed discs; without `size` they follow the system text size as they always have.
 return <View {...reading} style={{width:side,height:side,borderRadius,backgroundColor:fills.well,alignItems:'center',justifyContent:'center'}}><Text accessible={false} maxFontSizeMultiplier={sized===undefined?undefined:1} style={sized===undefined?undefined:{fontSize:Math.round(sized*0.4),lineHeight:Math.round(sized*0.6)}}>{avatarInitials(name)}</Text></View>;
}
