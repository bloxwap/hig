import React from 'react';
import {Image,Pressable,View,type ViewStyle} from 'react-native';
import {useColors,useFills,useHIG,useMessages} from './provider.js';
import {Text} from './surface.js';
import {CloseIcon,EditIcon,QrIcon} from './icons.js';
import {ListGroup,ListRow} from './list-group.js';
import {SwitchRow} from './switch-row.js';
import {addressColor} from './swap-shared.js';
import type {AssetArtwork} from './asset-balance-row.js';
export type {AssetArtwork} from './asset-balance-row.js';
/** One row of a profile section. The host supplies every label and value. */
export interface ProfileRow {
 id:string;label:string;leading?:React.ReactNode;value?:React.ReactNode;trailing?:React.ReactNode;onSelect?:()=>void;disabled?:boolean;
 /** With `onCheckedChange`, the row is a switch: the track trails and the label names it. */
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
export interface ProfileBlockProps {
 /** The name under the avatar: a display name or a shortened address. */
 name:string;
 /** Colours the avatar when there is no artwork. */
 address?:string;
 avatar?:AssetArtwork;status?:ProfileStatus;
 onEditName?:()=>void;onShowAddress?:()=>void;onClose?:()=>void;
 sections:readonly ProfileSection[];
 testID?:string;
}
const hidden={accessible:false,accessibilityElementsHidden:true,importantForAccessibility:'no-hide-descendants' as const};
/** A round 44 control on the well fill, stepping to the raised fill while pressed. */
function RoundButton({label,testID,onPress,children}:{label:string;testID:string;onPress:()=>void;children:React.ReactNode}){
 const fills=useFills();
 return <Pressable testID={testID} accessibilityRole='button' accessibilityLabel={label} onPress={onPress} hitSlop={{top:2,bottom:2}} style={({pressed})=>({width:44,height:44,borderRadius:22,alignItems:'center',justifyContent:'center',backgroundColor:pressed?fills.raised:fills.well})}>{children}</Pressable>;
}
/** A list row that is one switch: the same anatomy as ListRow, with the track on the trailing edge, level with the first line of the label. */
function ProfileSwitchRow({row}:{row:ProfileRow}){
 const colors=useColors(),fills=useFills();const on=!!row.checked;
 const first:ViewStyle={minHeight:40,justifyContent:'center'};
 return <SwitchRow testID={`profile-row-${row.id}`} label={row.label} checked={on} disabled={row.disabled} onCheckedChange={row.onCheckedChange} style={{minHeight:56,paddingVertical:8,paddingHorizontal:20,backgroundColor:fills.well,opacity:row.disabled?0.5:1}}>
  <View style={{flex:1,flexDirection:'row',alignItems:'flex-start',gap:12}}>
   {row.leading==null?null:<View style={first}>{row.leading}</View>}
   <Text style={{flex:1,flexShrink:1,minWidth:0,paddingVertical:8,fontSize:16,lineHeight:24,color:colors.text}}>{row.label}</Text>
   <View style={first}><View testID={`profile-row-${row.id}-track`} style={{width:40,height:24,borderRadius:12,padding:3,backgroundColor:on?colors.action:fills.raised,alignItems:on?'flex-end':'flex-start'}}><View style={{width:18,height:18,borderRadius:9,backgroundColor:on?colors.onAction:colors.text}}/></View></View>
  </View>
 </SwitchRow>;
}
/** A person's profile as one screen: the address and close controls, the avatar with its status, the name, then the host's sections of rows. */
export function ProfileBlock({name,address,avatar,status,onEditName,onShowAddress,onClose,sections,testID}:ProfileBlockProps){
 const colors=useColors(),fills=useFills(),t=useMessages(),{direction}=useHIG();
 const art=typeof avatar==='string'?<Image source={{uri:avatar}} style={{width:144,height:144}}/>:avatar??(address?null:<Text style={{fontSize:40,lineHeight:48,fontWeight:'600',color:colors.muted}}>{name.slice(0,2)}</Text>);
 const shown=sections.filter(section=>section.rows.length>0);
 return <View testID={testID} style={{direction,padding:16}}>
  <View testID='profile-bar' style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',minHeight:44}}>
   <View style={{minWidth:44,alignItems:'flex-start'}}>{onShowAddress?<RoundButton label={t.showAddress} testID='profile-address' onPress={onShowAddress}><QrIcon color={colors.text}/></RoundButton>:null}</View>
   <View style={{minWidth:44,alignItems:'flex-end'}}>{onClose?<RoundButton label={t.close} testID='profile-close' onPress={onClose}><CloseIcon color={colors.text}/></RoundButton>:null}</View>
  </View>
  <View style={{alignSelf:'center',width:144,height:144,marginTop:8}}>
   <View {...hidden} testID='profile-avatar' style={{width:144,height:144,borderRadius:72,overflow:'hidden',alignItems:'center',justifyContent:'center',backgroundColor:avatar==null&&address?addressColor(address):fills.well}}>{art}</View>
   {status?<View testID='profile-status' accessible accessibilityLabel={status.label} style={{position:'absolute',top:10,end:10,width:20,height:20,borderRadius:10,borderWidth:3,borderColor:colors.background,backgroundColor:colors[status.tone??'warning']}}/>:null}
  </View>
  <View style={{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:4,marginTop:16}}>
   <Text testID='profile-name' accessibilityRole='header' numberOfLines={1} style={{flexShrink:1,fontSize:28,lineHeight:34,fontWeight:'700',color:colors.text}}>{name}</Text>
   {onEditName?<Pressable testID='profile-edit' accessibilityRole='button' accessibilityLabel={t.editName} onPress={onEditName} style={({pressed})=>({width:44,height:44,alignItems:'center',justifyContent:'center',opacity:pressed?0.6:1})}><EditIcon color={colors.muted}/></Pressable>:null}
  </View>
  {shown.length>0?<View testID='profile-sections' style={{gap:24,marginTop:24}}>
   {shown.map(section=><ListGroup key={section.id} testID={`profile-section-${section.id}`} title={section.title}>
    {section.rows.map(row=>row.onCheckedChange?<ProfileSwitchRow key={row.id} row={row}/>:<ListRow key={row.id} testID={`profile-row-${row.id}`} label={row.label} leading={row.leading} value={row.value} trailing={row.trailing} onSelect={row.onSelect} disabled={row.disabled}/>)}
   </ListGroup>)}
  </View>:null}
 </View>;
}
