import React,{useEffect,useRef,useState} from 'react';
import {notificationDelta} from '@bloxwap/hig-contracts/announcements';
import {ActivityIndicator,View,Image,ScrollView,useWindowDimensions,AccessibilityInfo,Platform,type DimensionValue,type ImageSourcePropType,type ViewProps,type TextProps} from 'react-native';
import {Text,Heading,Surface,Stack} from './surface.js';
import {formatNumber} from '@bloxwap/hig-contracts';
import {Button} from './button.js';
import * as en from '@bloxwap/hig-contracts/messages';
import {useColors,useHIG} from './provider.js';
import {withAlpha} from '@bloxwap/hig-tokens';
import {blockText,plainText} from './text-content.js';
import {roleColor,type AccentRole} from './roles.js';
export type {AccentRole} from './roles.js';
const severityRole={info:'info',note:'info',success:'positive',tip:'positive',warning:'warning',error:'negative'} as const;
/** `note` and `tip` are documentation callout severities that reuse the info and positive token roles; `default` is the neutral variant (border stroke, soft white glow). */
export type AlertSeverity=keyof typeof severityRole|'default';
function speak(message:string,severity:string){if(Platform.OS==='web'||!message)return;try{if(Platform.OS==='ios'&&typeof AccessibilityInfo.announceForAccessibilityWithOptions==='function')AccessibilityInfo.announceForAccessibilityWithOptions(message,{queue:severity!=='error'});else AccessibilityInfo.announceForAccessibility(message);}catch{/* The visible message and navigable text remain available. */}}
export function Badge({children}:React.PropsWithChildren){const colors=useColors();return <Text style={{backgroundColor:colors.nested,borderRadius:9999,padding:8}}>{children}</Text>;}
/** Severity sets the glowing stroke from a token role (info/note → info, success/tip → positive, warning, error → negative, default → neutral border); `tone` swaps in another approved token role, never a raw colour. A non-string title renders inside the Heading, so pass strings or inline Text; its visible text is announced. */
export function Alert({title,children,severity='info',tone,action,announce=true}:React.PropsWithChildren<{title:React.ReactNode;severity?:AlertSeverity;tone?:AccentRole;action?:React.ReactNode;announce?:boolean}>){const colors=useColors();const neutral=severity==='default'&&tone===undefined;const accent=neutral?colors.border:roleColor(tone,severityRole[severity as keyof typeof severityRole]??'info',colors);const message=[plainText(title),blockText(children)].filter(Boolean).join('. ');const previous=useRef('');useEffect(()=>{const key=severity+message;if(announce&&key!==previous.current){previous.current=key;if(Platform.OS==='ios')speak(message,severity);}});return <Surface style={{borderWidth:2,borderColor:accent,borderRadius:16,backgroundColor:withAlpha(colors.surface,0.95),boxShadow:neutral?`0 0 20px ${withAlpha(colors.text,0.12)}`:`0 0 24px ${withAlpha(accent,0.55)}`}} accessibilityLiveRegion={announce&&Platform.OS!=='ios'?(severity==='error'?'assertive':'polite'):'none'}><Heading>{title}</Heading>{children}{action}</Surface>;}
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
 /** Dismiss button text; defaults to HIGProvider messages.dismiss. */
 dismissLabel?:string;
 /** Scroll viewport limit, in dp or a percentage of the parent. Defaults to 60% of the window height. */
 maxHeight?:DimensionValue;
 testID?:string;
}
/** Compact, scrollable notices remain visible until their host removes them. */
export function Toast({notices,onDismiss,dismissLabel,maxHeight,testID}:ToastProps){
 const {messages}=useHIG();const colors=useColors();
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
   <Stack style={{gap:8}}>{unique.map(n=><Surface key={n.id} accessibilityLiveRegion='none' style={{padding:12,borderWidth:2,borderColor:colors[severityRole[n.severity]],borderRadius:999,backgroundColor:withAlpha(colors.surface,0.95),boxShadow:`0 0 24px ${withAlpha(colors[severityRole[n.severity]],0.55)}`}}>
    <Text style={{fontWeight:'600'}}>{n.message}</Text>
    {n.description?<Text>{n.description}</Text>:null}
    {n.action}
    {n.closable!==false&&onDismiss?<Button intent='ghost' accessibilityLabel={(messages.dismissNotice??en.dismissNotice)(n.message,dismiss)} onPress={()=>onDismiss(n.id)}>{dismiss}</Button>:null}
   </Surface>)}</Stack>
  </ScrollView>
  {Platform.OS==='web'&&<Text accessibilityLiveRegion='polite' style={{position:'absolute',width:1,height:1,overflow:'hidden'}}>{announcement}</Text>}
 </View>;
}
export function Spinner({label}: {label?:string}){const {messages}=useHIG();const colors=useColors();const text=label??messages.loading??en.loading;return <View accessible accessibilityLabel={text}><ActivityIndicator color={colors.action}/><Text>{text}</Text></View>;}
export function Progress({label,value,max=100}: {label:string;value?:number;max?:number}){const {locale,messages}=useHIG();return <View accessibilityRole='progressbar' accessibilityLabel={label} accessibilityValue={{min:0,max,now:value,text:value===undefined?messages.inProgress??en.inProgress:(messages.progressValue??en.progressValue)(formatNumber(value,locale),formatNumber(max,locale))}}><Text>{label}{value===undefined?'…':` ${value}/${max}`}</Text></View>;}
export function Skeleton({label}: {label?:string}){const {messages}=useHIG();const colors=useColors();return <View accessible accessibilityLabel={label??messages.loadingContent??en.loadingContent} style={{minHeight:48,backgroundColor:colors.nested,borderRadius:10}}/>;}
export interface EmptyStateProps extends Omit<ViewProps,'children'> {
 title:string;
 description?:string;
 action?:React.ReactNode;
 /** Decorative content, hidden from accessibility; the title and description supply its meaning. */
 illustration?:React.ReactNode;
 titleStyle?:TextProps['style'];
 descriptionStyle?:TextProps['style'];
 /** Applies to both actual text nodes; omitted values retain the provider's scaling policy. */
 maxFontSizeMultiplier?:number;
}
export function EmptyState({title,description,action,illustration,titleStyle,descriptionStyle,maxFontSizeMultiplier,...props}:EmptyStateProps){return <Surface {...props}>
 {illustration!=null&&<View accessible={false} accessibilityElementsHidden importantForAccessibility='no-hide-descendants'>{illustration}</View>}
 <Heading style={titleStyle} maxFontSizeMultiplier={maxFontSizeMultiplier}>{title}</Heading>
 {description?<Text style={descriptionStyle} maxFontSizeMultiplier={maxFontSizeMultiplier}>{description}</Text>:null}
 {action}
</Surface>;}
export function Avatar({name,source}: {name:string;source?:ImageSourcePropType}){return source?<Image source={source} accessibilityLabel={name} style={{width:40,height:40,borderRadius:20}}/>:<Text accessibilityLabel={name}>{name.slice(0,2)}</Text>;}
export function StatusIndicator({label,state}: {label:string;state:'online'|'offline'|'stale'}){const {messages}=useHIG();const text={online:messages.statusOnline??en.statusOnline,offline:messages.statusOffline??en.statusOffline,stale:messages.statusStale??en.statusStale}[state]??state;return <Text>{label}: {text}</Text>;}
