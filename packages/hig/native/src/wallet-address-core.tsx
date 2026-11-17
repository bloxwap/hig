import { Copy } from '@bloxwap/icons/native/copy';
import React from 'react';
import {Pressable,View} from 'react-native';
import {useColors,useMessages} from './provider.js';
import {Text} from './surface.js';
import {Toast,useTransientNotice} from './status.js';
import {VerticalAddress,addressKind,type AddressKind} from './data.js';
export {VerticalAddress,addressKind,type AddressKind} from './data.js';
export interface WalletAddressCoreProps {
 address:string;kind?:AddressKind;
 /** The QR code, drawn by the host (its own encoder or SVG), laid out in a `size` square. It is read as one image named by the built-in “QR code” label. */
 qr:React.ReactNode;
 /** QR edge in dp; default 196. The address column is exactly as tall. */
 size?:number;
 /** Host clipboard adapter. When set the whole component is one button that copies the address and shows the Tap to copy hint. */
 onCopy?:()=>Promise<void>|void;
 /** `false` shows no “Address copied” notice after a copy, for a host that confirms the copy itself. Default `true`. */
 announce?:boolean;
 testID?:string;
}
const hidden={accessible:false,accessibilityElementsHidden:true,importantForAccessibility:'no-hide-descendants' as const};
/** Two overlapping rounded squares: copy. */
function CopyIcon({color}: {color:string}){return <Copy size={16} color={color}/>;}
/** @internal The layout both `WalletAddress` entries share. `code` is the QR as drawn, already named for assistive technology. */
export function WalletAddressFrame({address,kind,code,size=196,onCopy,announce=true,testID}:Omit<WalletAddressCoreProps,'qr'>&{code:React.ReactNode}){
 const colors=useColors();const t=useMessages();const {notice,show,dismiss}=useTransientNotice();
 const layout=kind??addressKind(address),rows=Math.max(1,Math.ceil(address.length/(layout==='ethereum'?6:4)));
 const body=<><View style={{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:16}}><View style={{width:size,height:size}}>{code}</View><VerticalAddress address={address} kind={layout} rowHeight={size/rows} testID='wallet-address-column'/></View>
  {onCopy?<View {...hidden} style={{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,marginTop:12}}><CopyIcon color={colors.muted}/><Text style={{color:colors.muted,fontSize:14,lineHeight:21}}>{t.tapToCopy}</Text></View>:null}</>;
 const copy=()=>{if(!onCopy)return;Promise.resolve().then(onCopy).then(()=>{if(announce)show(t.addressCopied);}).catch(()=>{/* The host adapter reports its own failure. */});};
 // The toast sits outside the button so its dismiss control is not nested in another control.
 return <View testID={testID} style={{alignItems:'center'}}>
  {onCopy?<Pressable accessibilityRole='button' accessibilityLabel={`${t.copyAddress}: ${address}`} testID='wallet-address-copy' onPress={copy} style={({pressed})=>({opacity:pressed?0.8:1})}>{body}</Pressable>:<View>{body}</View>}
  {notice?<View style={{marginTop:8}}><Toast notices={[notice]} onDismiss={dismiss}/></View>:null}
 </View>;
}
/**
 * `WalletAddress` without the QR encoder: the host passes the code as `qr`, so neither `cuer` nor `react-native-svg` is
 * needed. The address column, the copy button, its hint and the notice are the same as `WalletAddress` from `wallet-address`.
 */
export function WalletAddress({qr,...props}:WalletAddressCoreProps){
 const t=useMessages();
 return <WalletAddressFrame {...props} code={<View accessible accessibilityRole='image' accessibilityLabel={t.qrCode} testID='wallet-address-qr' style={{width:'100%',height:'100%'}}>{qr}</View>}/>;
}
