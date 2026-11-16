import React from 'react';
import {View,type ScrollViewProps} from 'react-native';
import {withAlpha} from '@bloxwap/hig/tokens';
import {useColors,useHIG,useMessages} from './provider.js';
import {Text} from './surface.js';
import {Button} from './button.js';
import {AnimatedNumberReadout} from './animated-number.js';
import {ListGroup,ListRow} from './list-group.js';
import {ScreenHeader} from './screen-header.js';
import {StickyHeaderLayout} from './sticky-header.js';
/** One more row under Network, such as a fee: host text on both edges. */
export interface ConfirmSendDetail {label:string;value:React.ReactNode;
 /** What a `value` that is not text reads as. */
 valueLabel?:string}
export interface ConfirmSendBlockProps {
 /** The amount being sent, in token units. `null` reads as unknown. */
 amount:number|null;
 /** The token's ticker, after the amount: HYPE. */
 symbol:string;
 /** Format of the amount; default `{maximumFractionDigits:6}`. */
 amountOptions?:Intl.NumberFormatOptions;
 /** The destination address, shown in full under "To" so it can be checked character by character. */
 address:string;
 /** The network the send moves on: HyperEVM. */
 network:string;
 /** More rows under Network, such as a fee. */
 details?:readonly ConfirmSendDetail[];
 /** Heading. Defaults to the built-in "Confirm send". */
 title?:string;
 /** Heading of the warning. Defaults to the built-in "Double-check the address." */
 warningTitle?:string;
 /** Body of the warning. Defaults to the built-in sentence naming the token and network; `null` or `false` draws no warning. */
 warning?:React.ReactNode;
 /** Called when the user confirms. The host signs and sends. */
 onConfirm:()=>void;
 /** Text of the confirming action. Defaults to the built-in "Confirm send". */
 confirmLabel?:string;
 /** The send is in progress: the confirming action shows a spinner and ignores presses, and Back and Cancel are unavailable. */
 busy?:boolean;
 /** Draws the confirming action unavailable, for example while a quote refreshes. */
 confirmDisabled?:boolean;
 /** Shows Cancel under the confirming action. */
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
 /** Prefix of the test IDs: `<testID>-header`, `-amount`, `-symbol`, `-to`, `-network`, `-detail-<index>`, `-warning`, `-confirm` and `-cancel`. Defaults to `confirm-send`. */
 testID?:string;
}
const amountFormat:Intl.NumberFormatOptions={maximumFractionDigits:6};
/** The last look before a send: the amount as the headline, where it goes and on which network, a warning that it cannot be taken back, then Confirm and Cancel. */
export function ConfirmSendBlock({amount,symbol,amountOptions=amountFormat,address,network,details,title,warningTitle,warning,onConfirm,confirmLabel,busy,confirmDisabled,onCancel,cancelLabel,onBack,headerAction,stickyHeader,stickyHeaderBackground,scrollComponent,headingId,testID='confirm-send'}:ConfirmSendBlockProps){
 const colors=useColors(),t=useMessages(),{direction}=useHIG();
 const id=(part:string)=>`${testID}-${part}`;
 const note=warning===undefined?t.sendWarning(symbol,network):warning;
 const header=<ScreenHeader title={title??t.confirmSend} onBack={onBack} backDisabled={busy} action={headerAction} headingId={headingId} testID={testID}/>;
 const body=<>
  <View style={{direction,flexDirection:'row',alignItems:'baseline',justifyContent:'center',flexWrap:'wrap',columnGap:8}}>
   <AnimatedNumberReadout testID={id('amount')} value={amount} options={amountOptions} style={{fontSize:44,lineHeight:50,fontWeight:'700',letterSpacing:-0.9,textAlign:'center'}}/>
   <Text testID={id('symbol')} style={{fontSize:24,lineHeight:32,fontWeight:'600',color:colors.muted}}>{symbol}</Text>
  </View>
  <ListGroup testID={id('rows')}>
   <ListRow testID={id('to')} label={t.sendTo} description={address}/>
   <ListRow testID={id('network')} label={t.sendNetwork} value={network}/>
   {details?.map((detail,index)=><ListRow key={detail.label} testID={id(`detail-${index}`)} label={detail.label} value={detail.value} valueLabel={detail.valueLabel}/>)}
  </ListGroup>
  {note!=null&&note!==false?<View testID={id('warning')} accessible style={{gap:8,paddingVertical:20,paddingHorizontal:20,borderRadius:20,backgroundColor:withAlpha(colors.warning,0.16)}}>
   <Text testID={id('warning-title')} style={{fontSize:24,lineHeight:30,fontWeight:'700',color:colors.warning}}>{warningTitle??t.sendWarningTitle}</Text>
   <Text testID={id('warning-body')} style={{fontSize:16,lineHeight:24,color:colors.text}}>{note}</Text>
  </View>:null}
  <View testID={id('actions')} style={{gap:8}}>
   <Button testID={id('confirm')} fullWidth busy={busy} disabled={confirmDisabled} onPress={onConfirm}>{confirmLabel??t.confirmSend}</Button>
   {onCancel?<Button testID={id('cancel')} fullWidth intent='secondary' disabled={busy} onPress={onCancel}>{cancelLabel??t.cancel}</Button>:null}
  </View>
 </>;
 // The sticky layout puts the header and the body in separate views, so the body's first gap is its top padding.
 if(stickyHeader)return <StickyHeaderLayout testID={testID} headerTestID={id('sticky-header')} header={header} background={stickyHeaderBackground} scrollComponent={scrollComponent} bodyStyle={{direction,gap:16,paddingTop:16}}>{body}</StickyHeaderLayout>;
 return <View testID={testID} style={{direction,padding:16,gap:16}}>
  {header}
  {body}
 </View>;
}
