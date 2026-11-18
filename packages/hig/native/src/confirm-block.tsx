import {InlineNotice} from './status.js';
import {AddressReadout} from './address-readout.js';
import React from 'react';
import {View,type ScrollViewProps} from 'react-native';
import {useColors,useHIG,useMessages} from './provider.js';
import {Text} from './surface.js';
import {Button} from './button.js';
import {AnimatedNumberReadout} from './animated-number.js';
import {ScreenHeader,type ScreenHeaderControlProps} from './screen-header.js';
import {StickyHeaderLayout} from './sticky-header.js';
/** One more line under Network, such as a fee: host text on both edges. */
export interface ConfirmDetail {label:string;value:React.ReactNode;
 /** What a `value` that is not text reads as. */
 valueLabel?:string}
/** A full-width action under Cancel and Confirm, such as "Delete anyway": a ghost button, in the negative colour with `tone='destructive'`. */
export interface ConfirmTertiaryAction {label:string;onSelect:()=>void;tone?:'destructive';disabled?:boolean;
 /** The button's test ID, in place of `<testID>-tertiary`. */
 testID?:string}
export interface ConfirmBlockProps {
 /** The amount being sent, in token units. `null` reads as unknown. Leave it out, with `symbol`, `address` and `network`, for a confirmation that is not a send, such as signing out: the block then draws only the header, `children`, the notice and the actions. */
 amount?:number|null;
 /** The token's ticker, after the amount: HYPE. */
 symbol?:string;
 /** Format of the amount; default `{maximumFractionDigits:6}`. */
 amountOptions?:Intl.NumberFormatOptions;
 /** What the amount is read as before the figure, such as "Amount" ("Amount: 2.5", then the ticker). Without it the figure is read alone. */
 amountLabel?:string;
 /** The destination address, shown in full beside "To", always as two rows, with the first 4 characters (6 with a `0x` prefix) and the last 4 emphasised and the rest muted. */
 address?:string;
 /** The network the send moves on: HyperEVM. */
 network?:string;
 /** What is being confirmed, drawn as given under the header (and under the amount and lines of a send): usually a muted `Text`, an `Alert` or a `ListGroup`. */
 children?:React.ReactNode;
 /** A bulleted list under `children`, in the muted colour, such as what deleting an account loses. */
 points?:readonly React.ReactNode[];
 /** The confirming action's intent: `primary` (the default), `destructive`, for an action that deletes or ends something, or `warning`, the warning role's fill, for an action that goes ahead despite a caution, such as confirming past a `warning`. */
 confirmIntent?:'primary'|'destructive'|'warning';
 /** A full-width action under Cancel and Confirm, such as "Delete anyway". Unavailable while `busy`, unless `cancelWhileBusy` is set. */
 tertiaryAction?:ConfirmTertiaryAction;
 /** More lines under Network, such as a fee. */
 details?:readonly ConfirmDetail[];
 /** Draws the Network line and each of `details` on one line: the label keeps its width and the value truncates with an ellipsis instead of wrapping (the whole line is still read in full). A value that is not text is set inside that one line of text, so pass inline text content, such as a Text. The address keeps its two rows. Off by default. */
 oneLineDetails?:boolean;
 /** Heading. Defaults to the built-in "Confirm Send". */
 title?:string;
 /** Heading of the warning. Defaults to the built-in "Double-check the address." */
 warningTitle?:string;
 /** Body of the warning. Defaults to the built-in sentence naming the token and network when `address` is given, and to none otherwise; `null` or `false` draws no warning. */
 warning?:React.ReactNode;
 /** A notice between the warning and the actions, drawn as given, such as an error `Alert` when a fee cannot be read or the send failed. Nothing by default. */
 notice?:React.ReactNode;
 /** Called when the user confirms. The host signs and sends. */
 onConfirm:()=>void;
 /** Text of the confirming action. Defaults to the built-in "Confirm Send". */
 confirmLabel?:string;
 /** The send is in progress: the confirming action shows a spinner and ignores presses, and Back, Cancel and the tertiary action are unavailable. */
 busy?:boolean;
 /** Draws the confirming action unavailable, for example while a quote refreshes. */
 confirmDisabled?:boolean;
 /** Keeps Back, Cancel and the tertiary action available while `busy`, for a wait the user may walk away from, such as a wallet signature the host can abandon. Off by default. */
 cancelWhileBusy?:boolean;
 /** Keeps only Back available while `busy`: the user may leave the pane while the action finishes, but Cancel and the tertiary action stay held, since they cannot stop it. Off by default; `cancelWhileBusy` frees Back as well. */
 backWhileBusy?:boolean;
 /** Shows Cancel on the leading side of the confirming action, the two sharing the row equally. Without it the confirming action takes the full width. */
 onCancel?:()=>void;
 /** Text of Cancel. Defaults to the built-in "Cancel". */
 cancelLabel?:string;
 /** Draws Cancel unavailable without `busy`, for example while the host's own work runs and the confirming action is a step that does not show a spinner. */
 cancelDisabled?:boolean;
 /** The confirming action's test ID, in place of `<testID>-confirm`. */
 confirmTestID?:string;
 /** Cancel's test ID, in place of `<testID>-cancel`. */
 cancelTestID?:string;
 /** Shows Back on the leading edge of the header. */
 onBack?:()=>void;
 /** Pressable props for the header's Back, such as `{android_disableSound: true}` when the host plays its own sound, as `ScreenHeader` takes them. */
 backProps?:ScreenHeaderControlProps;
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
 /** Prefix of the test IDs: `<testID>-header`, `-amount`, `-symbol`, `-to`, `-network`, `-detail-<index>`, `-body`, `-point-<index>`, `-warning`, `-confirm`, `-cancel` and `-tertiary`. Defaults to `confirm`. `confirmTestID`, `cancelTestID` and `tertiaryAction.testID` replace the last three one by one. */
 testID?:string;
}
export {confirmAddressRows} from './address-readout.js';
const amountFormat:Intl.NumberFormatOptions={maximumFractionDigits:6};
/** The last look before a send: the amount as the headline, where it goes and on which network, a warning that it cannot be taken back, then Cancel and Confirm side by side. Without an amount, address or network it confirms anything else, such as signing out or deleting an account: the header, `children`, then the actions. */
export function ConfirmBlock({amount,symbol,amountOptions=amountFormat,amountLabel,address,network,details,oneLineDetails,children,points,confirmIntent='primary',tertiaryAction,title,warningTitle,warning,notice,onConfirm,confirmLabel,busy,confirmDisabled,cancelWhileBusy,backWhileBusy,onCancel,cancelLabel,cancelDisabled,confirmTestID,cancelTestID,onBack,backProps,headerAction,stickyHeader,stickyHeaderBackground,scrollComponent,headingId,testID='confirm'}:ConfirmBlockProps){
 // What busy holds besides the confirming action: Back, Cancel and the tertiary action, unless the host lets them leave the wait (Back alone with backWhileBusy).
 const held=!!busy&&!cancelWhileBusy;
 const backHeld=held&&!backWhileBusy;
 const colors=useColors(),t=useMessages(),{direction}=useHIG();
 const id=(part:string)=>`${testID}-${part}`;
 const note=warning===undefined?(address!==undefined?t.sendWarning(symbol??'',network??''):null):warning;
 // Read-only lines, each read as one: "To, 0x…".
 // With oneLineDetails every line but the address is one line: the label keeps its width, the value truncates.
 // A value that is not text is set inside the one-line Text too, so its text content truncates with an ellipsis as on web.
 const line=(part:string,label:string,value:React.ReactNode,spoken?:string)=>{const one=!!oneLineDetails&&part!==toPart,lines=one?1:undefined;return <View key={part} accessible accessibilityLabel={spoken!==undefined||typeof value==='string'||typeof value==='number'?`${label}, ${spoken??value}`:undefined} style={{direction,flexDirection:'row',alignItems:'baseline',justifyContent:'space-between',gap:12}}>
  <Text numberOfLines={lines} style={{...(one?{flexShrink:0}:null),fontSize:16,lineHeight:24,color:colors.muted}}>{label}</Text>
  {one||typeof value==='string'||typeof value==='number'?<Text testID={id(part)} numberOfLines={lines} ellipsizeMode={one?'tail':undefined} style={{flexShrink:1,fontSize:16,lineHeight:24,fontWeight:'500',textAlign:'right',color:colors.text}}>{value}</Text>:<View testID={id(part)} style={{flexShrink:1}}>{value}</View>}
 </View>;};
 const toPart='to',networkPart='network',
  shown=address===undefined?null:<AddressReadout address={address}/>,
  lines=[...(address!==undefined?[line(toPart,t.sendTo,shown,address)]:[]),...(network!==undefined?[line(networkPart,t.sendNetwork,network)]:[]),...(details??[]).map((detail,index)=>line(`detail-${index}`,detail.label,detail.value,detail.valueLabel))];
 const header=<ScreenHeader title={title??t.confirmSend} onBack={onBack} backDisabled={backHeld} backProps={backProps} action={headerAction} headingId={headingId} testID={testID}/>;
 const hasBody=(children!=null&&children!==false)||!!points?.length;
 const tertiaryInert=held||!!tertiaryAction?.disabled;
 const body=<>
  {amount!==undefined?<View style={{direction,flexDirection:'row',alignItems:'baseline',justifyContent:'center',flexWrap:'wrap',columnGap:8}}>
   <AnimatedNumberReadout testID={id('amount')} value={amount} options={amountOptions} label={amountLabel} style={{fontSize:44,lineHeight:50,fontWeight:'700',letterSpacing:-0.9,textAlign:'center'}}/>
   {symbol?<Text testID={id('symbol')} style={{fontSize:24,lineHeight:32,fontWeight:'600',color:colors.muted}}>{symbol}</Text>:null}
  </View>:null}
  {lines.length?<View testID={id('details')} style={{gap:12,paddingHorizontal:4}}>
   {lines}
  </View>:null}
  {hasBody?<View testID={id('body')} style={{gap:12}}>
   {children}
   {points?.length?<View style={{gap:8}}>{points.map((point,index)=><View key={index} testID={id(`point-${index}`)} accessible style={{direction,flexDirection:'row',gap:8,paddingStart:4}}>
    <Text aria-hidden accessibilityElementsHidden importantForAccessibility='no' style={{fontSize:16,lineHeight:24,color:colors.muted}}>{'•'}</Text>
    <Text style={{flexShrink:1,fontSize:16,lineHeight:24,color:colors.muted}}>{point}</Text>
   </View>)}</View>:null}
  </View>:null}
  {note!=null&&note!==false?<InlineNotice accessible testID={id('warning')} severity='warning' title={warningTitle??t.sendWarningTitle} description={note}/>:null}
  {notice}
  <View testID={id('actions')} style={{direction,flexDirection:'row',gap:8}}>
   {onCancel?<Button testID={cancelTestID??id('cancel')} intent='secondary' disabled={held||!!cancelDisabled} onPress={onCancel} style={{flex:1,alignSelf:'auto'}}>{cancelLabel??t.cancel}</Button>:null}
   <Button testID={confirmTestID??id('confirm')} intent={confirmIntent} busy={busy} disabled={confirmDisabled} onPress={onConfirm} style={{flex:1,alignSelf:'auto'}}>{confirmLabel??t.confirmSend}</Button>
  </View>
  {tertiaryAction?<Button testID={tertiaryAction.testID??id('tertiary')} intent='ghost' fullWidth disabled={tertiaryInert} onPress={tertiaryAction.onSelect} accessibilityLabel={tertiaryAction.label} contentMode='custom' style={{marginTop:-8}}>
   <Text style={{fontSize:16,fontWeight:'600',textAlign:'center',color:tertiaryInert?colors.faint:tertiaryAction.tone==='destructive'?colors.negative:colors.muted}}>{tertiaryAction.label}</Text>
  </Button>:null}
 </>;
 // The sticky layout puts the header and the body in separate views, so the body's first gap is its top padding.
 if(stickyHeader)return <StickyHeaderLayout testID={testID} headerTestID={id('sticky-header')} header={header} background={stickyHeaderBackground} scrollComponent={scrollComponent} bodyStyle={{direction,gap:16,paddingTop:16}}>{body}</StickyHeaderLayout>;
 return <View testID={testID} style={{direction,padding:16,gap:16}}>
  {header}
  {body}
 </View>;
}
