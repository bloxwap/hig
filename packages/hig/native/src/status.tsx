import React,{useEffect,useRef,useState} from 'react';
import {tokens} from '@bloxwap/hig/tokens';
import {CloseIcon,EmptyIcon,SeverityIcon} from './icons.js';
import {notificationDelta} from '@bloxwap/hig/contracts/announcements';
import {beamAvatar,beamEye,beamSize} from '@bloxwap/hig/contracts/avatar';
import Svg,{G,Path,Rect} from 'react-native-svg';
import {ActivityIndicator,Animated,Easing,View,Image,ScrollView,useWindowDimensions,AccessibilityInfo,Platform,type DimensionValue,type ImageSourcePropType,type ViewProps,type TextProps} from 'react-native';
import {Text,Heading,Surface,Stack} from './surface.js';
import {formatNumber} from './number-format.js';
import {Button} from './button.js';
import * as en from '@bloxwap/hig/contracts/messages';
import {useColors,useFills,useHIG} from './provider.js';
import {blockText,plainText} from './text-content.js';
import {roleColor,type AccentRole} from './roles.js';
export type {AccentRole} from './roles.js';
const severityRole={info:'info',note:'info',success:'positive',tip:'positive',warning:'warning',error:'negative'} as const;
/** `note` and `tip` are documentation callout severities that reuse the info and positive token roles; `default` is the neutral variant (a faint `text` tint, title in `text`). */
export type AlertSeverity=keyof typeof severityRole|'default';
function speak(message:string,severity:string){if(Platform.OS==='web'||!message)return;try{if(Platform.OS==='ios'&&typeof AccessibilityInfo.announceForAccessibilityWithOptions==='function')AccessibilityInfo.announceForAccessibilityWithOptions(message,{queue:severity!=='error'});else AccessibilityInfo.announceForAccessibility(message);}catch{/* The visible message and navigable text remain available. */}}
/** Neutral chip in the dark well fill (one step lighter inside a Surface, Dialog or sheet). */
export function Badge({children}:React.PropsWithChildren){const fills=useFills();return <Text style={{alignSelf:'flex-start',maxWidth:'100%',backgroundColor:fills.well,overflow:'hidden',borderRadius:9999,paddingVertical:4,paddingHorizontal:10}}>{children}</Text>;}
/** Opaque sRGB blend of `tone` into `base` (both `#rrggbb`): the native counterpart of CSS `color-mix`. */
const tint=(tone:string,base:string,amount:number)=>'#'+[1,3,5].map(i=>Math.round(parseInt(base.slice(i,i+2),16)*(1-amount)+parseInt(tone.slice(i,i+2),16)*amount).toString(16).padStart(2,'0')).join('');
/** Severity tints the fill 10% and colours the title from a token role (info/note → info, success/tip → positive, warning, error → negative; default → 6% of `text`), with no stroke or glow; `tone` swaps in another approved token role, never a raw colour. A non-string title renders inside the Heading, so pass strings or inline Text; its visible text is announced. A string or number child is drawn in a HIG `Text`. `announce` (default true) speaks the title and body when they appear or change; pass `false` for guidance that is present from the start. */
export function Alert({title,children:body,severity='info',tone,action,announce=true}:React.PropsWithChildren<{title:React.ReactNode;severity?:AlertSeverity;tone?:AccentRole;action?:React.ReactNode;/** Speaks the alert when it appears or changes (iOS announcement, Android live region). Defaults to true. */announce?:boolean}>){const children=React.Children.map(body,child=>typeof child==='string'||typeof child==='number'?<Text>{child}</Text>:child);const colors=useColors();const neutral=severity==='default'&&tone===undefined;const accent=neutral?colors.text:roleColor(tone,severityRole[severity as keyof typeof severityRole]??'info',colors);const message=[plainText(title),blockText(children)].filter(Boolean).join('. ');const previous=useRef('');useEffect(()=>{const key=severity+message;if(announce&&key!==previous.current){previous.current=key;if(Platform.OS==='ios')speak(message,severity);}});return <Surface style={{gap:12,backgroundColor:tint(accent,colors.surface,neutral?0.06:0.1)}} accessibilityLiveRegion={announce&&Platform.OS!=='ios'?(severity==='error'?'assertive':'polite'):'none'}><Heading style={{color:accent}}>{title}</Heading>{children}{action}</Surface>;}
export const Callout=Alert;
export interface Notice {
 id:string;
 message:string;
 description?:string;
 severity:'info'|'success'|'warning'|'error';
 action?:React.ReactNode;
 /** Defaults to true when Toast has an onDismiss handler. */
 closable?:boolean;
}
export interface ToastProps {
 notices:readonly Notice[];
 onDismiss?:(id:string)=>void;
 /** Dismiss wording inside the close control's accessible name; defaults to HIGProvider messages.dismiss. The control shows an x, not text. */
 dismissLabel?:string;
 /** Scroll viewport limit, in dp or a percentage of the parent. Defaults to 60% of the window height. */
 maxHeight?:DimensionValue;
 testID?:string;
}
/** Loops a 0→1 value while `active`; rests at 0 otherwise (reduced motion, or nothing to show). */
function useLoop(active:boolean,duration:number,easing:(value:number)=>number=Easing.linear){const value=useRef(new Animated.Value(0)).current;useEffect(()=>{if(!active){value.stopAnimation();value.setValue(0);return;}const loop=Animated.loop(Animated.timing(value,{toValue:1,duration,easing,useNativeDriver:Platform.OS!=='web',isInteraction:false}));loop.start();return()=>loop.stop();},[active,duration,easing,value]);return value;}
/** Each notice is one capsule row: severity symbol, message, optional action, then a close control. Compact, scrollable notices remain visible until their host removes them. */
export function Toast({notices,onDismiss,dismissLabel,maxHeight,testID}:ToastProps){
 const {messages,direction}=useHIG();const colors=useColors();
 const {height}=useWindowDimensions();
 const dismiss=dismissLabel??messages.dismiss??en.dismiss;
 const unique=[...new Map(notices.map(n=>[n.id,n])).values()];
 const spoken=unique.map(n=>({...n,message:[n.message,n.description].filter(Boolean).join('. ')}));
 const previous=useRef(new Map<string,string>()),[announcement,setAnnouncement]=useState('');
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const key=JSON.stringify(spoken.map(n=>[n.id,n.message,n.severity]));
 useEffect(()=>{
  const delta=notificationDelta(previous.current,spoken);previous.current=delta.next;
  if(!delta.message)return;
  if(Platform.OS!=='web'){speak(delta.message,delta.severity);return;}
  setAnnouncement('');
  if(timer.current!==null)clearTimeout(timer.current);
  timer.current=setTimeout(()=>{timer.current=null;if(previous.current.get(delta.id!)===delta.next.get(delta.id!))setAnnouncement(delta.message!);},25);
 },[key]);
 useEffect(()=>()=>{if(timer.current!==null)clearTimeout(timer.current);},[]);
 return <View testID={testID} style={{maxHeight:maxHeight??height*.6,flexShrink:1}}>
  <ScrollView style={{flexGrow:0,flexShrink:1}} nestedScrollEnabled keyboardShouldPersistTaps='handled' accessibilityLabel={messages.notifications??en.notifications}>
   <Stack style={{gap:8}}>{unique.map(n=><View key={n.id} accessibilityLiveRegion='none' style={{direction,flexDirection:'row',alignItems:'center',gap:10,minHeight:44,paddingVertical:6,paddingHorizontal:12,borderRadius:22,backgroundColor:colors.nested,boxShadow:'0 4px 16px #0006'}}>
    <SeverityIcon kind={n.severity} color={colors[severityRole[n.severity]]}/>
    <View style={{flex:1,minWidth:0}}><Text style={{fontWeight:'600'}}>{n.message}</Text>{n.description?<Text>{n.description}</Text>:null}</View>
    {n.action}
    {n.closable!==false&&onDismiss?<Button intent='ghost' contentMode='custom' suppressFeedback accessibilityLabel={(messages.dismissNotice??en.dismissNotice)(n.message,dismiss)} hitSlop={8} onPress={()=>onDismiss(n.id)} style={{minHeight:32,minWidth:32,paddingHorizontal:0,paddingVertical:0,alignSelf:'center'}}><CloseIcon color={colors.muted}/></Button>:null}
   </View>)}</Stack>
  </ScrollView>
  {Platform.OS==='web'&&<Text accessibilityLiveRegion='polite' style={{position:'absolute',width:1,height:1,overflow:'hidden'}}>{announcement}</Text>}
 </View>;
}
/** One transient notice: shown for about four seconds, replaced by the next one, dismissible, and cleared on unmount. Render it with `Toast`, which announces it. */
export function useTransientNotice(duration=4000):{notice:Notice|null;show:(message:string,severity?:Notice['severity'])=>void;dismiss:()=>void}{
 const [notice,setNotice]=useState<Notice|null>(null);const sequence=useRef(0),timer=useRef<ReturnType<typeof setTimeout>|null>(null),alive=useRef(true);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;if(timer.current!==null)clearTimeout(timer.current);};},[]);
 const stop=()=>{if(timer.current!==null){clearTimeout(timer.current);timer.current=null;}};
 return {notice,dismiss:()=>{stop();setNotice(null);},show:(message,severity='success')=>{if(!alive.current)return;stop();setNotice({id:`notice-${++sequence.current}`,message,severity});timer.current=setTimeout(()=>{timer.current=null;setNotice(null);},duration);}};
}
export function Spinner({label}: {label?:string}){const {messages}=useHIG();const colors=useColors();const text=label??messages.loading??en.loading;return <View accessible accessibilityLabel={text}><ActivityIndicator color={colors.action}/><Text>{text}</Text></View>;}
export function Progress({label,value,max=100,hideValue}: {label:string;value?:number;max?:number;/** Draws the label without the ` value/max` suffix (or the `…` while indeterminate), for a host that shows the figure itself. The value is still read. */hideValue?:boolean}){
 const {locale,messages,direction}=useHIG();const colors=useColors();const fills=useFills();
 const fill=value===undefined?35:Math.min(100,Math.max(0,Number.isFinite(value)&&max>0?value/max*100:0));
 return <View style={{gap:12,direction}} accessibilityRole='progressbar' accessibilityLabel={label} accessibilityValue={{min:0,max,now:value,text:value===undefined?messages.inProgress??en.inProgress:(messages.progressValue??en.progressValue)(formatNumber(value,locale),formatNumber(max,locale))}}>
  <Text>{label}{hideValue?null:value===undefined?'…':` ${value}/${max}`}</Text>
  <View accessible={false} accessibilityElementsHidden importantForAccessibility='no-hide-descendants' style={{height:6,borderRadius:9999,overflow:'hidden',backgroundColor:fills.raised}}>
   <View style={{width:`${fill}%`,height:'100%',alignSelf:value===undefined?'center':'flex-start',borderRadius:9999,backgroundColor:colors.action}}/>
  </View>
 </View>;
}
/** Pulses while content is on its way; still with reduced motion. */
export function Skeleton({label}: {label?:string}){const {messages,reducedMotion}=useHIG();const fills=useFills();const pulse=useLoop(!reducedMotion,1500);return <Animated.View accessible accessibilityLabel={label??messages.loadingContent??en.loadingContent} style={{minHeight:48,backgroundColor:fills.raised,borderRadius:10,opacity:pulse.interpolate({inputRange:[0,.5,1],outputRange:[1,.5,1]})}}/>;}
export interface EmptyStateProps extends Omit<ViewProps,'children'> {
 title:string;
 description?:string;
 action?:React.ReactNode;
 /** Decorative mark above the title, hidden from accessibility; the title and description supply its meaning. Omitted, a neutral outline icon shows; `null` shows none. */
 illustration?:React.ReactNode;
 titleStyle?:TextProps['style'];
 descriptionStyle?:TextProps['style'];
 /** Applies to both actual text nodes; omitted values retain the provider's scaling policy. */
 maxFontSizeMultiplier?:number;
}
/** A strokeless card, centred: icon, title, optional description, then the action. */
export function EmptyState({title,description,action,illustration,titleStyle,descriptionStyle,maxFontSizeMultiplier,...props}:EmptyStateProps){const colors=useColors();const mark=illustration!==undefined?illustration:<EmptyIcon color={colors.muted}/>;return <Surface {...props} style={[{gap:12,alignItems:'center'},props.style]}>
 {mark!=null&&<View accessible={false} accessibilityElementsHidden importantForAccessibility='no-hide-descendants'>{mark}</View>}
 <Heading style={[{textAlign:'center'},titleStyle]} maxFontSizeMultiplier={maxFontSizeMultiplier}>{title}</Heading>
 {description?<Text style={[{textAlign:'center',color:colors.muted},descriptionStyle]} maxFontSizeMultiplier={maxFontSizeMultiplier}>{description}</Text>:null}
 {action}
</Surface>;}
/** Token roles of the default face palette, in this order. The order and the number of colours decide which colours a seed lands on. */
export const avatarColorRoles=['action','info','negative','warning'] as const;
export interface AvatarProps {
 /** The person or account. It is the accessible name, the first two letters are the initials, and it is the seed of the generated face unless `seed` is given. */
 name:string;
 /** An image to show instead. If it fails to load, the initials or the generated face show in its place. */
 source?:ImageSourcePropType;
 /** What the generated face is drawn from, such as a wallet address. The same seed and colours draw the same face on web and native. It is case-sensitive. Passing it selects the generated face. Defaults to `name`. */
 seed?:string;
 /** What shows without an image: `initials`, the first two letters of `name` on the well fill, or `beam`, a generated face. Defaults to `initials`, or to `beam` when `seed` is given. */
 variant?:'initials'|'beam';
 /** Width and height in dp. Defaults to 40. */
 size?:number;
 /** Palette of the generated face, as React Native colours. Defaults to the `action`, `info`, `negative` and `warning` roles of the provider's colour table (`avatarColorRoles`), which is Display P3 on an iOS host that paints in it. A seed picks by position, so the same list in the same order keeps the same faces. */
 colors?:readonly string[];
 /** One colour for the eyes and mouth of every generated face. Left out, each face takes the `background` role on a bright colour and the `text` role on a deep one. */
 faceColor?:string;
 /** A square with no rounded corners instead of a disc, for a host that clips it to its own shape. */
 square?:boolean;
 /** Hides the avatar from VoiceOver and TalkBack, for an avatar beside the name it stands for. */
 decorative?:boolean;
}
const unread={accessible:false,accessibilityElementsHidden:true,importantForAccessibility:'no-hide-descendants' as const};
const beamBox=`0 0 ${beamSize} ${beamSize}`;
const samePalette=(a?:readonly string[],b?:readonly string[])=>a===b||(a!==undefined&&b!==undefined&&a.length===b.length&&a.every((color,index)=>color===b[index]));
/** What identifies an image source across renders: its address (a host often builds `{uri}` inline), or the `require` number. */
const sourceKey=(source:ImageSourcePropType):unknown=>Array.isArray(source)?source.map(item=>item.uri).join(' '):typeof source==='object'&&source!==null?(source as {uri?:string}).uri??source:source;
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
/** A person or account as a 40dp disc: an image, else the first two letters of the name on the well fill (one step lighter inside a Surface, Dialog or sheet), else (with `variant='beam'` or a `seed`) a face generated from the seed. The face is an identity picture, so it is the same in right-to-left layouts and it never moves. */
export function Avatar({name,source,seed,variant,size,colors,faceColor,square,decorative}:AvatarProps){
 const fills=useFills();const [failed,setFailed]=useState<{key:unknown}>();
 const side=size??40,borderRadius=square?0:side/2;
 if(source){const key=sourceKey(source);if(!failed||failed.key!==key){const reading=decorative?unread:{accessibilityLabel:name};return <Image {...reading} source={source} onError={()=>setFailed({key})} style={{width:side,height:side,borderRadius}}/>;}}
 const reading=decorative?unread:{accessible:true,accessibilityRole:'image' as const,accessibilityLabel:name};
 if((variant??(seed===undefined?'initials':'beam'))==='beam')return <View {...reading} style={{width:side,height:side,borderRadius,overflow:'hidden'}}><BeamFace seed={seed??name} size={side} colors={colors} faceColor={faceColor}/></View>;
 return <View {...reading} style={{width:side,height:side,borderRadius,backgroundColor:fills.well,alignItems:'center',justifyContent:'center'}}><Text accessible={false} style={size===undefined?undefined:{fontSize:Math.round(size*0.4),lineHeight:Math.round(size*0.6)}}>{name.slice(0,2)}</Text></View>;
}
const statusRole={online:'positive',stale:'warning',offline:'muted'} as const;
const ringEasing=Easing.out(Easing.quad);
/** The dot carries the state colour. Online and stale emit a ring that grows and fades in that colour; offline and reduced motion stay still. */
export function StatusIndicator({label,state}: {label:string;state:'online'|'offline'|'stale'}){const {messages,reducedMotion,direction}=useHIG();const colors=useColors();const text={online:messages.statusOnline??en.statusOnline,offline:messages.statusOffline??en.statusOffline,stale:messages.statusStale??en.statusStale}[state]??state;const color=colors[statusRole[state]??'muted'];const live=!reducedMotion&&(state==='online'||state==='stale');const ring=useLoop(live,1600,ringEasing);
 return <View style={{direction,flexDirection:'row',alignItems:'center',gap:tokens.space.sm}}><View accessible={false} accessibilityElementsHidden importantForAccessibility='no-hide-descendants' style={{width:7,height:7}}>{live&&<Animated.View style={{position:'absolute',width:7,height:7,borderRadius:4,backgroundColor:color,opacity:ring.interpolate({inputRange:[0,1],outputRange:[.6,0]}),transform:[{scale:ring.interpolate({inputRange:[0,1],outputRange:[1,3]})}]}}/>}<View style={{width:7,height:7,borderRadius:4,backgroundColor:color}}/></View><Text style={{flexShrink:1,minWidth:0}}>{label}: {text}</Text></View>;}
