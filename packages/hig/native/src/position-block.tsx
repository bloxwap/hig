import React from 'react';
import {View,type ScrollViewProps,type StyleProp,type ViewStyle} from 'react-native';
import {useColors,useFills,useHIG,useMessages,useNumberLocale,usePresentNumber} from './provider.js';
import {Text} from './surface.js';
import {Button} from './button.js';
import {SwitchRow} from './switch-row.js';
import {ListGroup,ListRow} from './list-group.js';
import {AnimatedNumberReadout} from './animated-number.js';
import {HeaderClose,ScreenHeader,type ScreenHeaderControlProps} from './screen-header.js';
import {StickyHeaderLayout,stickyHeaderFill} from './sticky-header.js';
import {figureProps,figureReading,type Figure} from './figure.js';
/** A number the host supplies as a number so it updates place by place: `{value:0.53,options:{style:'currency',currency:'USD'}}`, or Leverage as `{value:40,suffix:'×'}`. `null` reads as unknown. `formattedValue` is the host's own text for it, still moving place by place. */
export type PositionBlockFigure=Figure;
/** One line of the summary: Notional, Fee, Liquidation. `value` is host text (`2% of profit`) or a live figure. `tone` colours the value; the default is the text colour. */
export interface PositionBlockDetail {
 id?:string;label:string;value:string|PositionBlockFigure;tone?:'positive'|'negative'|'muted';
 /** Draws the value struck through, for a charge that does not apply, and reads this host text after it: Waived. */
 struck?:string;
 /** Host content right after the label, such as a badge that explains the line. It may be pressable; it is then its own accessibility element. */
 labelAccessory?:React.ReactNode;
}
/** One setting of the position: Size, Leverage, Stop Loss. With `onSelect` the row opens the host's own view and shows a chevron; with `onCheckedChange` the row is a switch. */
export interface PositionBlockRow {
 id:string;label:string;
 /** Host text on the trailing edge, or a live figure that updates place by place. */
 value?:string|PositionBlockFigure;
 onSelect?:()=>void;disabled?:boolean;
 /** With `onCheckedChange`, the row is a switch named by its label, and the whole row toggles it. */
 checked?:boolean;onCheckedChange?:(checked:boolean)=>void;
}
/** An action on the paper trading row's card, under the switch, such as collecting what the paper position earned. */
export interface PositionBlockFlagAction {label:string;onSelect:()=>void;intent?:'primary'|'secondary'|'destructive';busy?:boolean;disabled?:boolean}
/** The paper trading switch. The host supplies its name, because HIG ships no trading terms. */
export interface PositionBlockFlag {
 label:string;checked:boolean;onCheckedChange:(checked:boolean)=>void;disabled?:boolean;
 /** A button on the row's card, under the switch. */
 action?:PositionBlockFlagAction;
}
/** The header of a PositionBlock on its own, for a host scroller that pins it: Back, the title and Close. */
export interface PositionBlockHeaderProps {
 /** Heading: Position. */
 title:string;
 /** Shows Close on the trailing edge. */
 onClose?:()=>void;
 /** Shows Back on the leading edge. */
 onBack?:()=>void;
 /** A control on the trailing edge in place of Close. */
 headerAction?:React.ReactNode;
 /** Sets `nativeID` on the title, so a sheet around the pane can name itself with `accessibilityLabelledBy` (Android). */
 headingId?:string;
 /** Style of the header's container, such as padding of the host's scroller. */
 style?:StyleProp<ViewStyle>;
 /** Content has scrolled under the header (`useStickyHeaderScroll().scrolled`): it is transparent while false and takes `stickyHeaderBackground` while true. Omitted, the header draws no fill of its own. */
 scrolled?:boolean;
 /** The fill once `scrolled`. Defaults to the background role. */
 stickyHeaderBackground?:string;
 /** Pressable props for Back, such as `{android_disableSound: true}`. */
 backProps?:ScreenHeaderControlProps;
 /** Pressable props for Close. */
 closeProps?:ScreenHeaderControlProps;
 testID?:string;
}
export interface PositionBlockProps {
 /** Heading: Position. */
 title:string;
 /** The summary under the header, in order. */
 details:readonly PositionBlockDetail[];
 /** One sentence under the summary, such as the minimum margin. */
 note?:string;
 /** Shows the paper trading switch as a row of its own above the settings. */
 paperTrade?:PositionBlockFlag;
 /** The settings, as groups of rows. Each group is one rounded container. */
 groups:readonly (readonly PositionBlockRow[])[];
 /** Shows Close on the trailing edge of the header. */
 onClose?:()=>void;
 /** Shows Back on the leading edge of the header. */
 onBack?:()=>void;
 /** A control on the trailing edge of the header in place of Close. */
 headerAction?:React.ReactNode;
 /** Sets `nativeID` on the title, so a sheet around the pane can name itself with `accessibilityLabelledBy` (Android). */
 headingId?:string;
 /** Set false to leave the header out, when the host draws `PositionBlockHeader` itself, for example as a sticky header of its scroller. The two stack exactly as the whole block does. */
 header?:boolean;
 /** Keeps the header pinned while the rest scrolls: the block becomes its own scroll view with the header as its sticky first child, transparent at rest and filled once content scrolls under it. Place it in a bounded container, such as a sheet body. */
 stickyHeader?:boolean;
 /** Fill behind the pinned header once content scrolls under it. Defaults to the background role; in a sheet pass the sheet's fill (`useColors().overlay`). */
 stickyHeaderBackground?:string;
 /** The scroll view used with `stickyHeader`, such as a sheet library's own. Defaults to React Native's ScrollView. */
 scrollComponent?:React.ComponentType<ScrollViewProps>;
 /** Pressable props for the header's Back, such as `{android_disableSound: true}`. */
 backProps?:ScreenHeaderControlProps;
 /** Pressable props for the header's Close. */
 closeProps?:ScreenHeaderControlProps;
 testID?:string;
}
const hidden={accessible:false,accessibilityElementsHidden:true,importantForAccessibility:'no-hide-descendants' as const};
function HeaderRow({title,onClose,onBack,headerAction,headingId,backProps,closeProps}:Omit<PositionBlockHeaderProps,'style'|'testID'|'scrolled'|'stickyHeaderBackground'>){
 const t=useMessages();
 return <ScreenHeader testID='position' title={title} onBack={onBack} backProps={backProps} headingId={headingId} action={headerAction??(onClose?<HeaderClose testID='position-close' label={t.close} onClose={onClose} closeProps={closeProps}/>:null)}/>;
}
/** The PositionBlock header on its own: put it in a scroller's sticky header and render `PositionBlock` with `header={false}` under it. It carries the block's top and side padding. */
export function PositionBlockHeader({style,testID,scrolled,stickyHeaderBackground,...props}:PositionBlockHeaderProps){
 const colors=useColors();
 return <View testID={testID} style={[{paddingTop:16,paddingHorizontal:16},scrolled===undefined?undefined:stickyHeaderFill(scrolled,stickyHeaderBackground??colors.background),style]}><HeaderRow {...props}/></View>;
}
function Track({checked,testID}:{checked:boolean;testID?:string}){
 const colors=useColors(),fills=useFills();
 return <View testID={testID} style={{width:40,height:24,borderRadius:12,padding:3,backgroundColor:checked?colors.action:fills.raised,alignItems:checked?'flex-end':'flex-start'}}><View style={{width:18,height:18,borderRadius:9,backgroundColor:checked?colors.onAction:colors.text}}/></View>;
}
/** The position being opened or edited as a screen: a summary of what it costs and where it ends, an optional paper trading switch, and its settings as grouped rows that open the host's own views. */
export function PositionBlock({title,details,note,paperTrade,groups,onClose,onBack,headerAction,headingId,header=true,stickyHeader,stickyHeaderBackground,scrollComponent,backProps,closeProps,testID}:PositionBlockProps){
 const colors=useColors(),fills=useFills(),{direction}=useHIG(),locale=useNumberLocale(),present=usePresentNumber();
 const figure={fontSize:16,lineHeight:24,fontWeight:'500'} as const;
 const shown=groups.filter(group=>group.length>0);
 const read=(live:PositionBlockFigure)=>figureReading(live,locale,present(live.options));
 const flagRow=paperTrade?<SwitchRow testID='position-paper-trade' label={paperTrade.label} checked={paperTrade.checked} disabled={paperTrade.disabled} onCheckedChange={paperTrade.onCheckedChange} style={{minHeight:56,paddingVertical:8,paddingHorizontal:20,borderRadius:20,backgroundColor:fills.well,opacity:paperTrade.disabled?0.5:1}}>
  <View style={{flex:1,flexDirection:'row',alignItems:'center',gap:12}}>
   <Text style={{flex:1,flexShrink:1,minWidth:0,fontSize:16,lineHeight:24,color:colors.text}}>{paperTrade.label}</Text>
   <Track checked={paperTrade.checked} testID='position-paper-trade-track'/>
  </View>
 </SwitchRow>:null;
 const action=paperTrade?.action;
 const row=(item:PositionBlockRow)=>{
  const live=item.value==null||typeof item.value==='string'?null:item.value,reading=live?read(live):item.value as string|undefined;
  if(item.onCheckedChange)return <SwitchRow key={item.id} testID={`position-row-${item.id}`} label={item.label} accessibilityHint={reading} checked={!!item.checked} disabled={item.disabled} onCheckedChange={item.onCheckedChange} style={{minHeight:56,paddingVertical:8,paddingHorizontal:20,backgroundColor:fills.well,opacity:item.disabled?0.5:1}}>
   <View style={{flex:1,flexDirection:'row',alignItems:'center',gap:12}}>
    <Text style={{flex:1,flexShrink:1,minWidth:0,fontSize:16,lineHeight:24,color:colors.text}}>{item.label}</Text>
    {live?<AnimatedNumberReadout {...figureProps(live)} tone='muted' style={{fontSize:16,lineHeight:24}}/>:reading?<Text numberOfLines={1} style={{flexShrink:1,maxWidth:'50%',fontSize:16,lineHeight:24,color:colors.muted,textAlign:'right'}}>{reading}</Text>:null}
    <Track checked={!!item.checked} testID={`position-row-${item.id}-track`}/>
   </View>
  </SwitchRow>;
  return <ListRow key={item.id} testID={`position-row-${item.id}`} label={item.label} value={live?<AnimatedNumberReadout {...figureProps(live)} tone='muted' testID={`position-row-${item.id}-value`} style={{fontSize:16,lineHeight:24}}/>:item.value as string|undefined} valueLabel={live?reading:undefined} onSelect={item.onSelect} disabled={item.disabled}/>;
 };
 const headerRow=<HeaderRow title={title} onClose={onClose} onBack={onBack} headerAction={headerAction} headingId={headingId} backProps={backProps} closeProps={closeProps}/>;
 const content=<>
  {details.length>0?<View testID='position-details' style={{gap:12,marginTop:16,paddingHorizontal:20}}>
   {details.map((detail,index)=>{
    const key=detail.id??index,live=typeof detail.value==='string'?null:detail.value,reading=live?read(live):detail.value as string;
    const spoken=`${detail.label}, ${reading}${detail.struck?`, ${detail.struck}`:''}`;
    const value=live?<AnimatedNumberReadout {...figureProps(live)} tone={detail.tone??'text'} style={figure}/>:<Text style={{...figure,color:detail.tone?colors[detail.tone]:colors.text,textAlign:'right'}}>{reading}</Text>;
    // The line is drawn over the figure, so it crosses animated digits as well as text.
    const drawn=detail.struck?<View testID={`position-detail-${key}-struck`} style={{position:'relative'}}>{value}<View pointerEvents='none' style={{position:'absolute',start:0,end:0,top:'50%',height:1,backgroundColor:detail.tone?colors[detail.tone]:colors.text}}/></View>:value;
    const label=<Text {...hidden} style={{flexShrink:1,fontSize:16,lineHeight:24,color:colors.muted}}>{detail.label}</Text>;
    if(detail.labelAccessory!=null)return <View key={key} testID={`position-detail-${key}`} style={{direction,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12}}>
     <View style={{direction,flexDirection:'row',alignItems:'center',gap:6,flexShrink:1}}>
      <Text testID={`position-detail-${key}-label`} accessible accessibilityLabel={spoken} style={{flexShrink:1,fontSize:16,lineHeight:24,color:colors.muted}}>{detail.label}</Text>
      {detail.labelAccessory}
     </View>
     <View {...hidden} style={{flexShrink:1}}>{drawn}</View>
    </View>;
    return <View key={key} testID={`position-detail-${key}`} accessible accessibilityLabel={spoken} style={{direction,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12}}>
     {label}
     <View {...hidden} style={{flexShrink:1}}>{drawn}</View>
    </View>;
   })}
  </View>:null}
  {note?<Text testID='position-note' style={{color:colors.muted,fontSize:13,lineHeight:20,marginTop:8,paddingHorizontal:20}}>{note}</Text>:null}
  {paperTrade||shown.length>0?<View testID='position-groups' style={{gap:24,marginTop:16}}>
   {action?<View testID='position-paper-trade-card' style={{borderRadius:20,overflow:'hidden',backgroundColor:fills.well}}>
    {flagRow}
    <View style={{paddingHorizontal:20,paddingBottom:16}}><Button testID='position-paper-trade-action' fullWidth intent={action.intent??'primary'} busy={action.busy} disabled={action.disabled} onPress={action.onSelect}>{action.label}</Button></View>
   </View>:flagRow}
   {shown.map((group,index)=><ListGroup key={index} testID={`position-group-${index}`}>{group.map(row)}</ListGroup>)}
  </View>:null}
 </>;
 if(header&&stickyHeader)return <StickyHeaderLayout testID={testID} headerTestID='position-sticky-header' header={headerRow} background={stickyHeaderBackground} scrollComponent={scrollComponent}>{content}</StickyHeaderLayout>;
 return <View testID={testID} style={header?{padding:16}:{padding:16,paddingTop:0}}>
  {header?headerRow:null}
  {content}
 </View>;
}
