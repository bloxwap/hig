import {useBlockHorizontalInset} from './sheet-header-glow.js';
import React from 'react';
import {Image,Pressable,View,type ScrollViewProps,type ViewStyle} from 'react-native';
import {StickyHeaderLayout} from './sticky-header.js';
import {useColors,useFills,useHIG,useMessages,useNumberLocale,usePresentNumber} from './provider.js';
import {Text} from './surface.js';
import {Button} from './button.js';
import {CloseIcon,EditIcon,QrIcon} from './icons.js';
import {ListGroup,ListRow} from './list-group.js';
import {SwitchRow} from './switch-row.js';
import {AnimatedNumberReadout} from './animated-number.js';
import {figureProps,figureReading,type Figure} from './figure.js';
import {addressColor} from './swap-shared.js';
import type {AssetArtwork} from './asset-balance-row.js';
export type {AssetArtwork} from './asset-balance-row.js';
/** A row value that can change while the profile is shown, such as a balance: formatted with `options` between `prefix` and `suffix`, and updated place by place. `null` reads as unknown. */
export type ProfileFigure=Figure;
/** One row of a profile section. The host supplies every label and value. */
export interface ProfileRow {
 id:string;label:string;leading?:React.ReactNode;
 /** Short text on the trailing edge, or a live figure that updates place by place. */
 value?:React.ReactNode|ProfileFigure;
 /** Colours the value. Without it the value keeps the row's muted value style. */
 tone?:'positive'|'warning'|'negative'|'muted';
 trailing?:React.ReactNode;onSelect?:()=>void;disabled?:boolean;
 /** With `onCheckedChange`, the row is a switch: the whole row is the target, the track trails and the label names it. */
 checked?:boolean;onCheckedChange?:(checked:boolean)=>void;
}
export interface ProfileSection {
 id:string;
 /** Heading above the group, such as Rewards or Settings. */
 title?:string;
 rows:readonly ProfileRow[];
}
export interface ProfileStatus {
 /** Read out for the dot, for example Demo. */
 label:string;tone?:'positive'|'warning'|'negative'|'info';
}
/** The primary action under the name, such as Log in for a signed-out viewer. The host writes the label. */
export interface ProfileAction {
 label:string;onSelect:()=>void;disabled?:boolean;
 /** Defaults to `primary`. */
 intent?:'primary'|'secondary';
}
export interface ProfileBlockProps {
 /** The name under the avatar: a display name or a shortened address. It may be left out when `action` is set, for a signed-out viewer. */
 name?:string;
 /** Host content beside the name, such as a badge. It stays in the accessibility tree, so give an interactive badge its own label. */
 nameAccessory?:React.ReactNode;
 /** Colours the avatar when there is no artwork. */
 address?:string;
 avatar?:AssetArtwork;
 /** Makes the avatar a button, for example to choose a picture. `avatarLabel` names it. */
 onAvatarPress?:()=>void;
 /** The accessible name of the avatar button, such as Change profile picture. Defaults to `name`, then the built-in “Change profile picture”. */
 avatarLabel?:string;
 status?:ProfileStatus;
 onEditName?:()=>void;onShowAddress?:()=>void;onClose?:()=>void;
 /** A full-width button under the name, such as Log in. */
 action?:ProfileAction;
 sections:readonly ProfileSection[];
 /** Host content under the sections on the block's inset, such as legal links. */
 footer?:React.ReactNode;
 /** Keeps the top bar (address and Close) pinned while the rest scrolls: the block becomes its own scroll view with the bar as its sticky first child, transparent at rest and filled once content scrolls under it. Place it in a bounded container, such as a sheet body. */
 stickyHeader?:boolean;
 /** With `stickyHeader`: the bar's fill once content is under it. Defaults to the background role; in a sheet pass the sheet's fill. */
 stickyHeaderBackground?:string;
 /** The scroll view used with `stickyHeader`, such as a sheet library's own. Defaults to React Native's ScrollView. */
 scrollComponent?:React.ComponentType<ScrollViewProps>;
 /** `nativeID` of the name heading, so a sheet around the block can name itself with `accessibilityLabelledBy` (Android). */
 headingId?:string;
 testID?:string;
}
const hidden={accessible:false,accessibilityElementsHidden:true,importantForAccessibility:'no-hide-descendants' as const};
/** A 44dp control keeps a 48dp touch target on every side. */
const targetSlop={top:2,bottom:2,left:2,right:2};
/** True for a `ProfileFigure`: a plain object with a `value`, not an element, array or other node. */
const isProfileFigure=(value:unknown):value is ProfileFigure=>value!=null&&typeof value==='object'&&!React.isValidElement(value)&&!Array.isArray(value)&&!(Symbol.iterator in value)&&'value' in value;
/** A round 44 control with no fill of its own, like the other block headers; it takes the well fill while pressed. */
function RoundButton({label,testID,onPress,children}:{label:string;testID:string;onPress:()=>void;children:React.ReactNode}){
 const fills=useFills();
 return <Pressable testID={testID} accessibilityRole='button' accessibilityLabel={label} onPress={onPress} hitSlop={targetSlop} style={({pressed})=>({width:44,height:44,borderRadius:22,alignItems:'center',justifyContent:'center',backgroundColor:pressed?fills.well:'transparent'})}>{children}</Pressable>;
}
/** A list row that is one switch: the same anatomy as ListRow, with the track on the trailing edge, level with the first line of the label. */
function ProfileSwitchRow({row}:{row:ProfileRow}){
 const colors=useColors(),fills=useFills();const on=!!row.checked;
 const first:ViewStyle={minHeight:40,justifyContent:'center'};
 return <SwitchRow testID={`profile-row-${row.id}`} label={row.label} checked={on} disabled={row.disabled} onCheckedChange={row.onCheckedChange} style={{minHeight:56,paddingVertical:8,paddingHorizontal:20,backgroundColor:colors.surface,opacity:row.disabled?0.5:1}}>
  <View style={{flex:1,flexDirection:'row',alignItems:'flex-start',gap:12}}>
   {row.leading==null?null:<View style={first}>{row.leading}</View>}
   <Text style={{flex:1,flexShrink:1,minWidth:0,paddingVertical:8,fontSize:16,lineHeight:24,color:colors.text}}>{row.label}</Text>
   <View style={first}><View testID={`profile-row-${row.id}-track`} style={{width:40,height:24,borderRadius:12,padding:3,backgroundColor:on?colors.action:fills.raised,alignItems:on?'flex-end':'flex-start'}}><View style={{width:18,height:18,borderRadius:9,backgroundColor:on?colors.onAction:colors.text}}/></View></View>
  </View>
 </SwitchRow>;
}
/** A row that opens something or shows a value. A live figure or a toned value is drawn here and read through `valueLabel`. */
function ProfileListRow({row}:{row:ProfileRow}){
 const locale=useNumberLocale(),present=usePresentNumber();
 const {value,tone}=row,testID=`profile-row-${row.id}`;
 const style={fontSize:16,lineHeight:24,textAlign:'right' as const};
 if(isProfileFigure(value)){
  const reading=figureReading(value,locale,present(value.options));
  return <ListRow testID={testID} label={row.label} leading={row.leading} valueLabel={reading} value={<AnimatedNumberReadout {...figureProps(value)} tone={tone??'muted'} testID={`${testID}-value`} style={style}/>} trailing={row.trailing} onSelect={row.onSelect} disabled={row.disabled}/>;
 }
 return <ListRow testID={testID} label={row.label} leading={row.leading} value={value as React.ReactNode} valueTone={tone} trailing={row.trailing} onSelect={row.onSelect} disabled={row.disabled}/>;
}
/** A person's profile as one screen: the address and close controls, the avatar with its status, the name, then the host's sections of rows. */
export function ProfileBlock({name,nameAccessory,address,avatar,onAvatarPress,avatarLabel,status,onEditName,onShowAddress,onClose,action,sections,footer,stickyHeader,stickyHeaderBackground,scrollComponent,headingId,testID}:ProfileBlockProps){
 const horizontalInset=useBlockHorizontalInset();
 const colors=useColors(),fills=useFills(),t=useMessages(),{direction}=useHIG();
 const art=typeof avatar==='string'?<Image source={{uri:avatar}} style={{width:144,height:144}}/>:avatar??(address?null:<Text style={{fontSize:40,lineHeight:48,fontWeight:'600',color:colors.muted}}>{name?.slice(0,2)}</Text>);
 const shown=sections.filter(section=>section.rows.length>0);
 const disc=<View {...hidden} testID='profile-avatar' style={{width:144,height:144,borderRadius:72,overflow:'hidden',alignItems:'center',justifyContent:'center',backgroundColor:avatar==null&&address?addressColor(address):fills.well}}>{art}</View>;
 const bar=<View testID='profile-bar' style={stickyHeader?{direction,flexDirection:'row',alignItems:'center',justifyContent:'space-between',minHeight:44}:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',minHeight:44}}>
  <View style={{minWidth:44,alignItems:'flex-start'}}>{onShowAddress?<RoundButton label={t.showAddress} testID='profile-address' onPress={onShowAddress}><QrIcon color={colors.text}/></RoundButton>:null}</View>
  <Text testID='profile-title' accessibilityRole='header' style={{flex:1,textAlign:'center',fontSize:17,lineHeight:24,fontWeight:'600'}}>{t.profile}</Text>
  <View style={{minWidth:44,alignItems:'flex-end'}}>{onClose?<RoundButton label={t.close} testID='profile-close' onPress={onClose}><CloseIcon color={colors.text}/></RoundButton>:null}</View>
 </View>;
 const body=<>
  <View style={{alignSelf:'center',width:144,height:144,marginTop:8}}>
   {onAvatarPress?<Pressable testID='profile-avatar-button' accessibilityRole='button' accessibilityLabel={avatarLabel??name??t.changeProfilePicture} onPress={onAvatarPress} style={({pressed})=>({borderRadius:72,opacity:pressed?0.85:1})}>{disc}</Pressable>:disc}
   {status?<View testID='profile-status' accessible accessibilityLabel={status.label} style={{position:'absolute',top:10,end:10,width:20,height:20,borderRadius:10,borderWidth:3,borderColor:colors.background,backgroundColor:colors[status.tone??'warning']}}/>:null}
  </View>
  {name!=null?<View style={{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:4,marginTop:16}}>
   <Text testID='profile-name' nativeID={headingId} accessibilityRole='header' numberOfLines={1} style={{flexShrink:1,fontSize:28,lineHeight:34,fontWeight:'700',color:colors.text}}>{name}</Text>
   {nameAccessory!=null?<View testID='profile-name-accessory' style={{flexShrink:0}}>{nameAccessory}</View>:null}
   {onEditName?<Pressable testID='profile-edit' accessibilityRole='button' accessibilityLabel={t.editName} onPress={onEditName} hitSlop={targetSlop} style={({pressed})=>({width:44,height:44,alignItems:'center',justifyContent:'center',opacity:pressed?0.6:1})}><EditIcon color={colors.muted}/></Pressable>:null}
  </View>:null}
  {action?<View testID='profile-action-row' style={{marginTop:16}}><Button testID='profile-action' fullWidth intent={action.intent??'primary'} disabled={action.disabled} onPress={action.onSelect}>{action.label}</Button></View>:null}
  {shown.length>0?<View testID='profile-sections' style={{gap:24,marginTop:24}}>
   {shown.map(section=><ListGroup key={section.id} testID={`profile-section-${section.id}`} title={section.title}>
    {section.rows.map(row=>row.onCheckedChange?<ProfileSwitchRow key={row.id} row={row}/>:<ProfileListRow key={row.id} row={row}/>)}
   </ListGroup>)}
  </View>:null}
  {footer!=null?<View testID='profile-footer' style={{marginTop:24}}>{footer}</View>:null}
 </>;
 if(stickyHeader)return <StickyHeaderLayout horizontalInset={horizontalInset} testID={testID} headerTestID='profile-sticky-header' header={bar} background={stickyHeaderBackground} scrollComponent={scrollComponent} bodyStyle={{direction}}>{body}</StickyHeaderLayout>;
 return <View testID={testID} style={{direction,paddingVertical:16,paddingHorizontal:horizontalInset}}>
  {bar}
  {body}
 </View>;
}
