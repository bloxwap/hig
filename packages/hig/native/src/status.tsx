import {progressValue} from '@bloxwap/hig/contracts';
import React,{useEffect,useRef,useState} from 'react';
import {tokens} from '@bloxwap/hig/tokens';
import {CloseIcon,EmptyIcon,SeverityIcon} from './icons.js';
import {notificationDelta} from '@bloxwap/hig/contracts/announcements';
import {AvatarFrame,sameFrame,type AvatarFrameProps} from './avatar-frame.js';
import {ActivityIndicator,Animated,Easing,View,ScrollView,useWindowDimensions,Platform,type DimensionValue,type StyleProp,type ViewProps,type ViewStyle,type TextProps} from 'react-native';
import {Text,Heading,Surface,Stack} from './surface.js';
import {formatNumber} from './number-format.js';
import {Button} from './button.js';
import * as en from '@bloxwap/hig/contracts/messages';
import {useColors,useFills,useHIG} from './provider.js';
import {blockText,plainText} from './text-content.js';
import {roleColor,type AccentRole} from './roles.js';
import {speak} from './announce.js';
export type {AccentRole} from './roles.js';
const severityRole={info:'info',note:'info',success:'positive',tip:'positive',warning:'warning',error:'negative'} as const;
/** `note` and `tip` are documentation callout severities that reuse the info and positive token roles; `default` is the neutral variant (a faint `text` tint, title in `text`). */
export type AlertSeverity=keyof typeof severityRole|'default';
/** A badge's meaning, as on web: explicit, never inferred from text or a number's sign. */
export type BadgeTone='neutral'|'positive'|'negative'|'warning'|'info';
export interface BadgeProps {children?:React.ReactNode;/** `positive`, `negative`, `warning` or `info` draws the label in that token role over a 15% wash of it, like web `.hig-badge[data-tone]`; `neutral` (default) keeps the well fill. */tone?:BadgeTone;/** A 6dp status dot in the label colour on the leading edge, hidden from assistive technology. */dot?:boolean;testID?:string}
/** Neutral chip in the dark well fill (one step lighter inside a Surface, Dialog or sheet). */
export function Badge({children,tone='neutral',dot,testID}:BadgeProps){const fills=useFills();const colors=useColors();const accent=tone==='positive'||tone==='negative'||tone==='warning'||tone==='info'?colors[tone]:undefined;
 /* 15% of the role over whatever is behind, as web color-mix with transparent; a colour that is not #rrggbb blends into the well instead. */
 const fill=accent?(/^#[0-9a-f]{6}$/i.test(accent)?`${accent}26`:tint(accent,fills.well,0.15)):fills.well;const chip={alignSelf:'flex-start' as const,maxWidth:'100%' as const,backgroundColor:fill,overflow:'hidden' as const,borderRadius:9999,paddingVertical:4,paddingHorizontal:10};const label=accent?{color:accent}:null;
 return dot?<View testID={testID} style={[chip,{flexDirection:'row',alignItems:'center',gap:6}]}><View accessibilityElementsHidden importantForAccessibility='no-hide-descendants' style={{width:6,height:6,borderRadius:3,backgroundColor:accent??colors.text}}/><Text style={[label,{flexShrink:1}]}>{children}</Text></View>:<Text testID={testID} style={label?[chip,label]:chip}>{children}</Text>;}
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
export interface ToastNoticeProps {
 message:string;
 /** A second line under the message, in regular weight. */
 description?:string;
 severity?:Notice['severity'];
 action?:React.ReactNode;
 /** Accessible name of the close control; defaults to HIGProvider `messages.dismissNotice` around the message. */
 dismissName?:string;
 /** Draws the close control and takes its press. Omitted, the notice has none. */
 onDismiss?:()=>void;
 /** Sizes the capsule to its content, up to the room it has, instead of filling its parent. `Toaster` draws it this way. Default `false`. */
 hug?:boolean;
 /** Merged over the capsule's fill, radius and shadow. */
 style?:StyleProp<ViewStyle>;
}
/** One notice as a single capsule row: severity symbol on the leading edge, message with an optional description under it, optional action, close on the trailing edge. Shared by `Toast` and the transient `Toaster` of `@bloxwap/hig/native/toast`; it announces nothing itself. */
export function ToastNotice({message,description,severity='info',action,dismissName,onDismiss,hug=false,style}:ToastNoticeProps){
 const {messages,direction}=useHIG();const colors=useColors();
 const close=onDismiss?<Button intent='ghost' contentMode='custom' suppressFeedback accessibilityLabel={dismissName??(messages.dismissNotice??en.dismissNotice)(message,messages.dismiss??en.dismiss)} hitSlop={8} onPress={onDismiss} style={{minHeight:32,minWidth:32,paddingHorizontal:0,paddingVertical:0,alignSelf:'center'}}><CloseIcon color={colors.muted}/></Button>:null;
 return <View accessibilityLiveRegion='none' style={[{direction,flexDirection:'row',alignItems:'center',gap:10,minHeight:44,paddingVertical:6,paddingHorizontal:12,borderRadius:22,backgroundColor:colors.nested,boxShadow:'0 4px 16px #0006'},style]}>
  <SeverityIcon kind={severity} color={colors[severityRole[severity]]}/>
  {/* Filling its parent, the message takes the room that is left. Hugging, nothing in the row may grow, or the row would take all the room it is offered. */}
  <View style={hug?{flexShrink:1,minWidth:0}:{flex:1,minWidth:0}}><Text style={{fontWeight:'600'}}>{message}</Text>{description?<Text>{description}</Text>:null}</View>
  {action}
  {close}
 </View>;
}
/** Each notice is one capsule row: severity symbol, message, optional action, then a close control. Compact, scrollable notices remain visible until their host removes them. */
export function Toast({notices,onDismiss,dismissLabel,maxHeight,testID}:ToastProps){
 const {messages}=useHIG();
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
   <Stack style={{gap:8}}>{unique.map(n=><ToastNotice key={n.id} message={n.message} description={n.description} severity={n.severity} action={n.action} dismissName={(messages.dismissNotice??en.dismissNotice)(n.message,dismiss)} onDismiss={n.closable!==false&&onDismiss?()=>onDismiss(n.id):undefined}/>)}</Stack>
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
export interface SpinnerProps {
 /** What is loading; defaults to HIGProvider `messages.loading`. */
 label?:string;
 /** Draws the indicator alone, for a tight spot such as a row or a button-sized slot: the label is not drawn but stays the element's accessibility label. */
 hideLabel?:boolean;
 testID?:string;
}
export function Spinner({label,hideLabel,testID}:SpinnerProps){const {messages}=useHIG();const colors=useColors();const text=label??messages.loading??en.loading;return <View testID={testID} accessible accessibilityLabel={text}><ActivityIndicator color={colors.action}/>{hideLabel?null:<Text>{text}</Text>}</View>;}
export function Progress({label,value,max=100,hideValue}: {label:string;value?:number;max?:number;/** Draws the label without the ` value/max` suffix (or the `…` while indeterminate), for a host that shows the figure itself. The value is still read. */hideValue?:boolean}){({value,max}=progressValue(value,max));
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
/** The Avatar frame, kept while its props are the same: a list that renders again renders no frame for the rows that did not change. */
const StillFrame=React.memo(AvatarFrame,sameFrame);
/**
 * A person or account as a 40dp disc: an image, else the first two letters of the name on the well fill (one step lighter inside a Surface, Dialog or sheet).
 * `size`, `square` and `decorative` are as in `@bloxwap/hig/native/avatar`, whose `Avatar` also draws a face generated from a seed; that entry needs `react-native-svg` and this one does not.
 * It renders again only when one of its props changes.
 */
export function Avatar(props:AvatarFrameProps){return <StillFrame {...props}/>;}
const statusRole={online:'positive',stale:'warning',offline:'muted'} as const;
const ringEasing=Easing.out(Easing.quad);
/** The dot carries the state colour. Online and stale emit a ring that grows and fades in that colour; offline and reduced motion stay still. */
export function StatusIndicator({label,state}: {label:string;state:'online'|'offline'|'stale'}){const {messages,reducedMotion,direction}=useHIG();const colors=useColors();const text={online:messages.statusOnline??en.statusOnline,offline:messages.statusOffline??en.statusOffline,stale:messages.statusStale??en.statusStale}[state]??state;const color=colors[statusRole[state]??'muted'];const live=!reducedMotion&&(state==='online'||state==='stale');const ring=useLoop(live,1600,ringEasing);
 return <View style={{direction,flexDirection:'row',alignItems:'center',gap:tokens.space.sm}}><View accessible={false} accessibilityElementsHidden importantForAccessibility='no-hide-descendants' style={{width:7,height:7}}>{live&&<Animated.View style={{position:'absolute',width:7,height:7,borderRadius:4,backgroundColor:color,opacity:ring.interpolate({inputRange:[0,1],outputRange:[.6,0]}),transform:[{scale:ring.interpolate({inputRange:[0,1],outputRange:[1,3]})}]}}/>}<View style={{width:7,height:7,borderRadius:4,backgroundColor:color}}/></View><Text style={{flexShrink:1,minWidth:0}}>{label}: {text}</Text></View>;}
