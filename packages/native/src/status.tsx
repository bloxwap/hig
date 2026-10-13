import React from 'react';
import {ActivityIndicator,View,Image,type ImageSourcePropType} from 'react-native';
import {nativeColors as colors} from '@bloxwap/hig-tokens';
import {Text,Heading,Surface,Stack} from './surface.js';
import {Button} from './button.js';
export function Badge({children}:React.PropsWithChildren){return <Text style={{backgroundColor:colors.android.nested,borderRadius:9999,padding:8}}>{children}</Text>;}
export function Alert({title,children,severity='info',action}:React.PropsWithChildren<{title:string;severity?:'info'|'success'|'warning'|'error';action?:React.ReactNode}>){return <Surface accessibilityLiveRegion={severity==='error'?'assertive':'polite'}><Heading>{title}</Heading>{children}{action}</Surface>;}
export const Callout=Alert;
export interface Notice {id:string;message:string;severity:'info'|'success'|'warning'|'error';action?:React.ReactNode}
export function Toast({notices,onDismiss}: {notices:readonly Notice[];onDismiss:(id:string)=>void}){return <Stack>{[...new Map(notices.map(n=>[n.id,n])).values()].slice(-3).map(n=><Alert key={n.id} title={n.message} severity={n.severity} action={<>{n.action}<Button intent='ghost' accessibilityLabel={`Dismiss ${n.message}`} onPress={()=>onDismiss(n.id)}>Dismiss</Button></>}/>)}</Stack>;}
export function Spinner({label='Loading'}: {label?:string}){return <View accessible accessibilityLabel={label}><ActivityIndicator color={colors.android.action}/><Text>{label}</Text></View>;}
export function Progress({label,value,max=100}: {label:string;value?:number;max?:number}){return <View accessibilityRole='progressbar' accessibilityLabel={label} accessibilityValue={{min:0,max,now:value,text:value===undefined?'In progress':`${value} of ${max}`}}><Text>{label}{value===undefined?'…':` ${value}/${max}`}</Text></View>;}
export function Skeleton({label='Loading content'}: {label?:string}){return <View accessible accessibilityLabel={label} style={{minHeight:48,backgroundColor:colors.android.nested,borderRadius:10}}/>;}
export function EmptyState({title,description,action}: {title:string;description:string;action?:React.ReactNode}){return <Surface><Heading>{title}</Heading><Text>{description}</Text>{action}</Surface>;}
export function Avatar({name,source}: {name:string;source?:ImageSourcePropType}){return source?<Image source={source} accessibilityLabel={name} style={{width:40,height:40,borderRadius:20}}/>:<Text accessibilityLabel={name}>{name.slice(0,2)}</Text>;}
export function StatusIndicator({label,state}: {label:string;state:'online'|'offline'|'stale'}){return <Text>{label}: {state}</Text>;}
