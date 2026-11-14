import React,{useMemo} from 'react';
import {Image,Pressable,View} from 'react-native';
import Svg,{Path,Rect} from 'react-native-svg';
import {create} from 'cuer/QrCode';
import {useColors,useMessages} from './provider.js';
import {Text} from './surface.js';
import {Toast,useTransientNotice} from './status.js';
import {VerticalAddress,addressKind,type AddressKind} from './data.js';
export {VerticalAddress,addressKind,type AddressKind} from './data.js';
export interface WalletAddressProps {
 address:string;kind?:AddressKind;
 /** QR payload when it differs from the address, e.g. an EIP-681 or Solana Pay URI. Defaults to the address. */
 qrValue?:string;
 /** Image URL shown in the centre of the QR. */
 arena?:string;
 /** QR edge in dp; default 196. */
 size?:number;
 /** Host clipboard adapter. When set the whole component is one button that copies the address and shows the Tap to copy hint. */
 onCopy?:()=>Promise<void>|void;
 testID?:string;
}
const hidden={accessible:false,accessibilityElementsHidden:true,importantForAccessibility:'no-hide-descendants' as const};
/** The QR's drawing, in module units: three finder origins, one path of round dots for every other dark module, and the centre square left clear for an arena. */
export function qrGeometry(grid:readonly (readonly boolean[])[],withArena:boolean):{edge:number;finders:{x:number;y:number}[];dots:string;count:number;arena:{origin:number;size:number}|null}{
 const edge=grid.length,far=edge-7,radius=0.45,size=withArena?Math.floor(edge/4):0,origin=(edge-size)/2;
 const inFinder=(row:number,column:number)=>(row<7&&(column<7||column>=far))||(row>=far&&column<7);
 const inArena=(row:number,column:number)=>size>0&&row+1>origin&&row<origin+size&&column+1>origin&&column<origin+size;
 let dots='',count=0;
 for(let row=0;row<edge;row++)for(let column=0;column<edge;column++){
  if(!grid[row]?.[column]||inFinder(row,column)||inArena(row,column))continue;
  // One circle as two arcs, so the whole code is a single path.
  dots+=`M${column+0.5-radius} ${row+0.5}a${radius} ${radius} 0 1 0 ${radius*2} 0a${radius} ${radius} 0 1 0 ${-radius*2} 0`;count++;
 }
 return {edge,finders:[{x:0,y:0},{x:far,y:0},{x:0,y:far}],dots,count,arena:size>0?{origin,size}:null};
}
/** Two overlapping rounded squares: copy. */
function CopyIcon({color}: {color:string}){return <View {...hidden} style={{width:16,height:16}}><View style={{position:'absolute',left:0,top:0,width:11,height:11,borderRadius:3,borderWidth:1.5,borderColor:color}}/><View style={{position:'absolute',right:0,bottom:0,width:11,height:11,borderRadius:3,borderWidth:1.5,borderColor:color}}/></View>;}
/**
 * A wallet address to scan or copy: the QR in the cuer style (round dots, rounded finder patterns, no tile) beside the
 * address as a monospace column exactly as tall as the code. Ethereum (`0x…`) lays out 6 characters a row and Solana 4.
 * With `onCopy` the whole component is one button and a Tap to copy hint sits under it. Needs the optional `cuer` and
 * `react-native-svg` peers; the encoder comes from `cuer/QrCode`, so React DOM is never loaded.
 */
export function WalletAddress({address,kind,qrValue,arena,size=196,onCopy,testID}:WalletAddressProps){
 const colors=useColors();const t=useMessages();const {notice,show,dismiss}=useTransientNotice();
 const layout=kind??addressKind(address),rows=Math.max(1,Math.ceil(address.length/(layout==='ethereum'?6:4)));
 const value=qrValue??address,withArena=!!arena;
 const qr=useMemo(()=>qrGeometry(create(value,{errorCorrection:withArena?'high':'medium'}).grid,withArena),[value,withArena]);
 const unit=size/qr.edge;
 const code=<View style={{width:size,height:size}}>
  <Svg width={size} height={size} viewBox={`0 0 ${qr.edge} ${qr.edge}`} accessible accessibilityRole='image' accessibilityLabel={t.qrCode} testID='wallet-address-qr'>
   {qr.finders.map((finder,index)=><React.Fragment key={index}><Rect x={finder.x+0.5} y={finder.y+0.5} width={6} height={6} rx={1.75} fill='none' stroke={colors.text} strokeWidth={1}/><Rect x={finder.x+2} y={finder.y+2} width={3} height={3} rx={0.75} fill={colors.text}/></React.Fragment>)}
   <Path d={qr.dots} fill={colors.text}/>
  </Svg>
  {arena&&qr.arena?<Image {...hidden} source={{uri:arena}} testID='wallet-address-arena' style={{position:'absolute',left:(qr.arena.origin+0.5)*unit,top:(qr.arena.origin+0.5)*unit,width:(qr.arena.size-1)*unit,height:(qr.arena.size-1)*unit,borderRadius:unit}}/>:null}
 </View>;
 const body=<><View style={{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:16}}>{code}<VerticalAddress address={address} kind={layout} rowHeight={size/rows} testID='wallet-address-column'/></View>
  {onCopy?<View {...hidden} style={{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,marginTop:12}}><CopyIcon color={colors.muted}/><Text style={{color:colors.muted,fontSize:14,lineHeight:21}}>{t.tapToCopy}</Text></View>:null}</>;
 const copy=()=>{if(!onCopy)return;Promise.resolve().then(onCopy).then(()=>show(t.addressCopied)).catch(()=>{/* The host adapter reports its own failure. */});};
 // The toast sits outside the button so its dismiss control is not nested in another control.
 return <View testID={testID} style={{alignItems:'center'}}>
  {onCopy?<Pressable accessibilityRole='button' accessibilityLabel={`${t.copyAddress}: ${address}`} testID='wallet-address-copy' onPress={copy} style={({pressed})=>({opacity:pressed?0.8:1})}>{body}</Pressable>:<View>{body}</View>}
  {notice?<View style={{marginTop:8}}><Toast notices={[notice]} onDismiss={dismiss}/></View>:null}
 </View>;
}
