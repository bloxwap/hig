import React from 'react';
import {View,type ScrollViewProps} from 'react-native';
import {useColors,useHIG} from './provider.js';
import {Text} from './surface.js';
import {Button} from './button.js';
import {SettingCard,SettingHeader,SettingSwitch,type SettingAction} from './setting-switch.js';
import {StickyHeaderLayout} from './sticky-header.js';
/** One kind of notification. Every word is host text. */
export interface NotificationsItem {
 id:string;label:string;description?:string;
 checked:boolean;onCheckedChange:(checked:boolean)=>void;disabled?:boolean;
 /** Always on and not changeable: shown on at full strength and read as unavailable. */
 locked?:boolean;
 /** Host content after the label, such as a badge. It is drawn only; the switch is read by `label`. */
 labelAccessory?:React.ReactNode;
 /** Host words for the `labelAccessory`, read after the label and a pause: `Push, New`. */
 labelAccessoryLabel?:string;
 /** A neutral line under the card, announced when it changes, for progress or a hint: Registering this device. */
 hint?:string;
 /** Why turning it on failed, under the card: Push request timed out. It is announced when it appears. */
 error?:string;
 /** A secondary action under the card, such as Open Settings after the permission was refused. `feedback: false` keeps the provider's press feedback off it. */
 action?:SettingAction;
}
/** Notifications under one optional heading: Alert types. */
export interface NotificationsGroup {id:string;title?:string;items:readonly NotificationsItem[]}
export interface NotificationsBlockProps {
 /** Heading: Notifications. */
 title:string;
 /** A muted line under the header that explains the screen. */
 description?:string;
 /** One card each, in order. */
 items?:readonly NotificationsItem[];
 /** More cards under the items, in groups with an optional heading, 24dp apart. */
 groups?:readonly NotificationsGroup[];
 /** Shows Back on the leading edge of the header. */
 onBack?:()=>void;
 /** A control on the trailing edge of the header, usually an IconButton. */
 headerAction?:React.ReactNode;
 /** Keeps the header pinned while the cards scroll: the block becomes its own scroll view with the header as its sticky first child, transparent at rest and filled once content scrolls under it. Place it in a bounded container. */
 stickyHeader?:boolean;
 /** Fill behind the pinned header once content scrolls under it. Defaults to the background role; in a sheet pass the sheet's fill. */
 stickyHeaderBackground?:string;
 /** The scroll view used with `stickyHeader`, such as a sheet library's own. */
 scrollComponent?:React.ComponentType<ScrollViewProps>;
 testID?:string;
}
/** The notifications the viewer receives, as a screen: each kind is a card with a switch and a line of explanation, and a failure to turn one on reads under its card. */
export function NotificationsBlock({title,description,items=[],groups,onBack,headerAction,stickyHeader,stickyHeaderBackground,scrollComponent,testID}:NotificationsBlockProps){
 const colors=useColors(),{direction}=useHIG();
 const note={paddingHorizontal:20,fontSize:14,lineHeight:21} as const;
 const card=(item:NotificationsItem)=>{
  const id=`notifications-${item.id}`;
  return <View key={item.id} style={{gap:8}}>
   <SettingCard testID={id}><SettingSwitch testID={`${id}-switch`} label={item.label} description={item.description} checked={item.checked} disabled={item.disabled} locked={item.locked} labelAccessory={item.labelAccessory} labelAccessoryLabel={item.labelAccessoryLabel} onCheckedChange={item.onCheckedChange}/></SettingCard>
   {item.hint?<Text testID={`${id}-hint`} accessibilityLiveRegion='polite' style={{...note,color:colors.muted}}>{item.hint}</Text>:null}
   {item.error?<Text testID={`${id}-error`} accessibilityRole='alert' accessibilityLiveRegion='polite' style={{paddingHorizontal:20,fontSize:14,lineHeight:21,color:colors.negative}}>{item.error}</Text>:null}
   {item.action?<View style={{marginTop:8}}><Button testID={`${id}-action`} intent='secondary' fullWidth disabled={item.action.disabled} suppressFeedback={item.action.feedback===false} onPress={item.action.onSelect}>{item.action.label}</Button></View>:null}
  </View>;
 };
 const cards=items.map(card);
 const header=<SettingHeader testID='notifications' title={title} onBack={onBack} action={headerAction}/>;
 const body=<>
  {description?<Text testID='notifications-description' style={{fontSize:14,lineHeight:21,color:colors.muted,marginTop:16,paddingHorizontal:4}}>{description}</Text>:null}
  {items.length>0?<View testID='notifications-items' style={{gap:8,marginTop:16}}>{cards}</View>:null}
  {groups?.map(group=><View key={group.id} testID={`notifications-group-${group.id}`} style={{gap:8,marginTop:24}}>
   {group.title?<View style={{direction,flexDirection:'row',alignItems:'center',minHeight:44,paddingStart:4}}><Text testID={`notifications-group-${group.id}-title`} accessibilityRole='header' numberOfLines={1} style={{flexShrink:1,fontSize:16,lineHeight:24,fontWeight:'500',color:colors.muted}}>{group.title}</Text></View>:null}
   {group.items.map(card)}
  </View>)}
 </>;
 if(stickyHeader)return <StickyHeaderLayout testID={testID} headerTestID='notifications-sticky-header' header={header} background={stickyHeaderBackground} scrollComponent={scrollComponent}>{body}</StickyHeaderLayout>;
 return <View testID={testID} style={{padding:16}}>
  {header}
  {body}
 </View>;
}
