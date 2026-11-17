import React from 'react';
import {Platform,View,type ScrollViewProps} from 'react-native';
import {withAlpha} from '@bloxwap/hig/tokens';
import {useColors,useHIG,useMessages} from './provider.js';
import {Text} from './surface.js';
import {Button} from './button.js';
import {AnimatedNumberReadout} from './animated-number.js';
import {ScreenHeader} from './screen-header.js';
import {StickyHeaderLayout} from './sticky-header.js';
/** One more line under Network, such as a fee: host text on both edges. */
export interface ConfirmDetail {label:string;value:React.ReactNode;
 /** What a `value` that is not text reads as. */
 valueLabel?:string}
export interface ConfirmBlockProps {
 /** The amount being sent, in token units. `null` reads as unknown. */
 amount:number|null;
 /** The token's ticker, after the amount: HYPE. */
 symbol:string;
 /** Format of the amount; default `{maximumFractionDigits:6}`. */
 amountOptions?:Intl.NumberFormatOptions;
 /** The destination address, shown in full beside "To", always as two rows, with the first 4 characters (6 with a `0x` prefix) and the last 4 emphasised and the rest muted. */
 address:string;
 /** The network the send moves on: HyperEVM. */
 network:string;
 /** More lines under Network, such as a fee. */
 details?:readonly ConfirmDetail[];
 /** Heading. Defaults to the built-in "Confirm Send". */
 title?:string;
 /** Heading of the warning. Defaults to the built-in "Double-check the address." */
 warningTitle?:string;
 /** Body of the warning. Defaults to the built-in sentence naming the token and network; `null` or `false` draws no warning. */
 warning?:React.ReactNode;
 /** Called when the user confirms. The host signs and sends. */
 onConfirm:()=>void;
 /** Text of the confirming action. Defaults to the built-in "Confirm Send". */
 confirmLabel?:string;
 /** The send is in progress: the confirming action shows a spinner and ignores presses, and Back and Cancel are unavailable. */
 busy?:boolean;
 /** Draws the confirming action unavailable, for example while a quote refreshes. */
 confirmDisabled?:boolean;
 /** Shows Cancel on the leading side of the confirming action, the two sharing the row equally. Without it the confirming action takes the full width. */
 onCancel?:()=>void;
 /** Text of Cancel. Defaults to the built-in "Cancel". */
 cancelLabel?:string;
 /** Shows Back on the leading edge of the header. */
 onBack?:()=>void;
 /** A control on the trailing edge of the header, usually an IconButton. */
 headerAction?:React.ReactNode;
 /** Keeps the header pinned while the rest scrolls: the block becomes its own scroll view with the header as its sticky first child, transparent at rest and filled once content scrolls under it. Place it in a bounded container, such as a sheet body. */
 stickyHeader?:boolean;
 /** With `stickyHeader`: the header's fill once content is under it. Defaults to the background role; in a sheet pass the sheet's fill. */
 stickyHeaderBackground?:string;
 /** The scroll view used with `stickyHeader`, such as a sheet library's own. Defaults to React Native's ScrollView. */
 scrollComponent?:React.ComponentType<ScrollViewProps>;
 /** `nativeID` of the title, so a sheet around the block can name itself with `accessibilityLabelledBy` (Android). */
 headingId?:string;
 /** Prefix of the test IDs: `<testID>-header`, `-amount`, `-symbol`, `-to`, `-network`, `-detail-<index>`, `-warning`, `-confirm` and `-cancel`. Defaults to `confirm`. */
 testID?:string;
}
const amountFormat:Intl.NumberFormatOptions={maximumFractionDigits:6};
/** The address as the two rows the block draws: split at the middle, with `anchor` on the characters people compare, the first 4 (6 when it starts with `0x`) and the last 4. An address too short to have a middle is all anchor. */
export function confirmAddressRows(address:string):{text:string;anchor:boolean}[][]{
 const characters=Array.from(address),head=address.startsWith('0x')?6:4,tail=characters.length-4,split=Math.ceil(characters.length/2);
 return [characters.slice(0,split),characters.slice(split)].map((row,rowIndex)=>{const parts:{text:string;anchor:boolean}[]=[];
  row.forEach((character,index)=>{const position=rowIndex*split+index,anchor=position<head||position>=tail,last=parts[parts.length-1];if(last&&last.anchor===anchor)last.text+=character;else parts.push({text:character,anchor});});
  return parts;});
}
/** The last look before a send: the amount as the headline, where it goes and on which network, a warning that it cannot be taken back, then Cancel and Confirm side by side. */
export function ConfirmBlock({amount,symbol,amountOptions=amountFormat,address,network,details,title,warningTitle,warning,onConfirm,confirmLabel,busy,confirmDisabled,onCancel,cancelLabel,onBack,headerAction,stickyHeader,stickyHeaderBackground,scrollComponent,headingId,testID='confirm'}:ConfirmBlockProps){
 const colors=useColors(),t=useMessages(),{direction,monoFontFamily}=useHIG();
 const id=(part:string)=>`${testID}-${part}`;
 const note=warning===undefined?t.sendWarning(symbol,network):warning;
 // Read-only lines, each read as one: "To, 0x…".
 const line=(part:string,label:string,value:React.ReactNode,spoken?:string)=><View key={part} accessible accessibilityLabel={spoken!==undefined||typeof value==='string'||typeof value==='number'?`${label}, ${spoken??value}`:undefined} style={{direction,flexDirection:'row',alignItems:'baseline',justifyContent:'space-between',gap:12}}>
  <Text style={{fontSize:16,lineHeight:24,color:colors.muted}}>{label}</Text>
  {typeof value==='string'||typeof value==='number'?<Text testID={id(part)} style={{flexShrink:1,fontSize:16,lineHeight:24,fontWeight:'500',textAlign:'right',color:colors.text}}>{value}</Text>:<View testID={id(part)} style={{flexShrink:1}}>{value}</View>}
 </View>;
 const toPart='to',networkPart='network',mono=monoFontFamily??Platform.select({ios:'Menlo',default:'monospace'}),type={fontFamily:mono,fontSize:15,lineHeight:22},
  shown=<Text accessible={false} maxFontSizeMultiplier={1.2} style={{...type,writingDirection:'ltr',textAlign:'left'}}>{confirmAddressRows(address).map((row,index)=><React.Fragment key={index}>{index>0?'\n':null}{row.map((part,offset)=><Text key={offset} maxFontSizeMultiplier={1.2} style={{...type,color:part.anchor?colors.text:colors.muted,fontWeight:part.anchor?'700':'500'}}>{part.text}</Text>)}</React.Fragment>)}</Text>,
  lines=[line(toPart,t.sendTo,shown,address),line(networkPart,t.sendNetwork,network),...(details??[]).map((detail,index)=>line(`detail-${index}`,detail.label,detail.value,detail.valueLabel))];
 const header=<ScreenHeader title={title??t.confirmSend} onBack={onBack} backDisabled={busy} action={headerAction} headingId={headingId} testID={testID}/>;
 const body=<>
  <View style={{direction,flexDirection:'row',alignItems:'baseline',justifyContent:'center',flexWrap:'wrap',columnGap:8}}>
   <AnimatedNumberReadout testID={id('amount')} value={amount} options={amountOptions} style={{fontSize:44,lineHeight:50,fontWeight:'700',letterSpacing:-0.9,textAlign:'center'}}/>
   <Text testID={id('symbol')} style={{fontSize:24,lineHeight:32,fontWeight:'600',color:colors.muted}}>{symbol}</Text>
  </View>
  <View testID={id('details')} style={{gap:12,paddingHorizontal:4}}>
   {lines}
  </View>
  {note!=null&&note!==false?<View testID={id('warning')} accessible style={{gap:8,paddingVertical:20,paddingHorizontal:20,borderRadius:20,backgroundColor:withAlpha(colors.warning,0.16)}}>
   <Text testID={id('warning-title')} style={{fontSize:24,lineHeight:30,fontWeight:'700',color:colors.warning}}>{warningTitle??t.sendWarningTitle}</Text>
   <Text testID={id('warning-body')} style={{fontSize:16,lineHeight:24,color:colors.text}}>{note}</Text>
  </View>:null}
  <View testID={id('actions')} style={{direction,flexDirection:'row',gap:8}}>
   {onCancel?<Button testID={id('cancel')} intent='secondary' disabled={busy} onPress={onCancel} style={{flex:1,alignSelf:'auto'}}>{cancelLabel??t.cancel}</Button>:null}
   <Button testID={id('confirm')} busy={busy} disabled={confirmDisabled} onPress={onConfirm} style={{flex:1,alignSelf:'auto'}}>{confirmLabel??t.confirmSend}</Button>
  </View>
 </>;
 // The sticky layout puts the header and the body in separate views, so the body's first gap is its top padding.
 if(stickyHeader)return <StickyHeaderLayout testID={testID} headerTestID={id('sticky-header')} header={header} background={stickyHeaderBackground} scrollComponent={scrollComponent} bodyStyle={{direction,gap:16,paddingTop:16}}>{body}</StickyHeaderLayout>;
 return <View testID={testID} style={{direction,padding:16,gap:16}}>
  {header}
  {body}
 </View>;
}
