import { Copy } from '@bloxwap/icons/native/copy';
import {addressGrid} from '@bloxwap/hig/contracts/address';
import {useAsyncResult} from './async-result.js';
import React from 'react';
import {Pressable,View} from 'react-native';
import {useColors,useMessages} from './provider.js';
import {Text} from './surface.js';
import {Toast,useTransientNotice} from './status.js';
import {HorizontalAddress,VerticalAddress,addressKind,type AddressKind} from './data.js';
export {AddressLockup,Address,HorizontalAddress,VerticalAddress,addressKind,type AddressKind} from './data.js';
export interface WalletAddressCoreProps {
 /** Horizontal (default) puts the QR left of the address column. Vertical puts the QR above a two-row address. */
 orientation?:'horizontal'|'vertical';
 address:string;kind?:AddressKind;
 /** The QR code, drawn by the host (its own encoder or SVG), laid out in a `size` square. It is read as one image named by the built-in “QR code” label. */
 qr:React.ReactNode;
 /** Horizontal QR edge in dp, default 196. Vertical sizes the square to the address. */
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
export function WalletAddressFrame({address,kind,code,orientation='horizontal',size=196,onCopy,announce=true,testID}:Omit<WalletAddressCoreProps,'qr'>&{code:React.ReactNode|((edge:number)=>React.ReactNode)}){
 const colors=useColors();const t=useMessages();const {notice,show,dismiss}=useTransientNotice();
 const layout=kind??addressKind(address),rows=Math.max(1,addressGrid(address,layout,'vertical').length);
 const [addressWidth,setAddressWidth]=React.useState(0);
 const edge=orientation==='vertical'&&addressWidth>0?addressWidth:size;
 const body=<><View style={{direction:'ltr',flexDirection:orientation==='horizontal'?'row':'column',alignItems:'center',justifyContent:'center',gap:16}}><View style={{width:edge,height:edge}}>{typeof code==='function'?code(edge):code}</View>{orientation==='vertical'?<View testID='wallet-address-measure' onLayout={event=>setAddressWidth(event.nativeEvent.layout.width)} style={{maxWidth:'100%'}}><HorizontalAddress address={address} kind={layout} rowHeight={18} testID='wallet-address-horizontal'/></View>:<VerticalAddress address={address} kind={layout} rowHeight={size/rows} testID='wallet-address-column'/>}</View>
  {onCopy?<View {...hidden} style={{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,marginTop:12}}><CopyIcon color={colors.muted}/><Text style={{color:colors.muted,fontSize:14,lineHeight:21}}>{t.tapToCopy}</Text></View>:null}</>;
 const beginCopy=useAsyncResult(address);
 const copy=()=>{const current=beginCopy();if(!onCopy)return;Promise.resolve().then(onCopy).then(()=>{if(current()&&announce)show(t.addressCopied);}).catch(()=>{/* The host adapter reports its own failure. */});};
 // The toast sits outside the button so its dismiss control is not nested in another control.
 return <View testID={testID} style={{alignItems:'center'}}>
  {onCopy?<Pressable accessibilityRole='button' accessibilityLabel={`${t.copyAddress}: ${address}`} testID='wallet-address-copy' onPress={copy} style={({pressed})=>({maxWidth:'100%',opacity:pressed?0.8:1})}>{body}</Pressable>:<View style={{maxWidth:'100%'}}>{body}</View>}
  {notice?<View style={{marginTop:8}}><Toast notices={[notice]} onDismiss={dismiss}/></View>:null}
 </View>;
}
/**
 * `WalletAddress` without the QR encoder: the host passes the code as `qr`, so `react-native-svg` is not
 * needed. The address column, the copy button, its hint and the notice are the same as `WalletAddress` from `wallet-address`.
 */
export function WalletAddress({qr,...props}:WalletAddressCoreProps){
 const t=useMessages();
 return <WalletAddressFrame {...props} code={<View accessible accessibilityRole='image' accessibilityLabel={t.qrCode} testID='wallet-address-qr' style={{width:'100%',height:'100%'}}>{qr}</View>}/>;
}
