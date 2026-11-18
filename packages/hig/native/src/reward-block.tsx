import React from 'react';
import {formatCountdown,watchCountdown} from '@bloxwap/hig/contracts/format';
import {Image,Pressable,View,type FlatListProps,type ScrollViewProps,type ViewStyle} from 'react-native';
import {formatNumber} from './number-format.js';
import {withAlpha} from '@bloxwap/hig/tokens';
import {useColors,useFills,useLayoutDirection,useMonoFontFamily,useNumberLocale,usePresentNumber} from './provider.js';
import {Surface,Text} from './surface.js';
import {Button} from './button.js';
import {SegmentedControl} from './radio-group.js';
import {ChevronIcon,SeverityIcon} from './icons.js';
import {AnimatedNumberReadout,NumberFlow} from './animated-number.js';
import {formatNumberReadout} from './animated-number-model.js';
import type {AssetArtwork} from './asset-balance-row.js';
import {ScreenHeader} from './screen-header.js';
import {ListWithIntro,PickerFlatList} from './picker-flat-list.js';
import {StickyHeaderLayout} from './sticky-header.js';
import {figureProps,type Figure} from './figure.js';
/** The promotion above the standings: a prize pool filling towards a goal, or a draw with a top prize. Every word is host text. */
export interface RewardPromo {
 /** The small capitals line: Season 01. */
 eyebrow:string;
 /** Viewer streak and its earned reward. The host supplies the current points or multiplier. */
 streak?:{label:string;count:Figure;rewardLabel:string;reward:Figure};
 /** Prize drawing deadline in epoch milliseconds, with host text for the running and finished states. */
 drawing?:{at:number;label:string;endedLabel:string};
 /** A text link with a chevron on the trailing edge of the eyebrow: Rules. */
 rules?:{label:string;onSelect:()=>void};
 /** The headline figure: the pool so far, or the top prize. A number updates place by place, formatted with `amountOptions`; `null` reads as unknown; a string is host text drawn as given in the same style, such as `$500` already formatted. Leave it out (with no `figure`) for a promotion with no figure. */
 amount?:number|null|string;
 /** Host content drawn in the headline figure's place (`<testID>-figure`), in place of `amount`, such as the host's own live figure. It is drawn as given and reads itself. */
 figure?:React.ReactNode;
 /** Format of a number `amount` and of `goal`. Defaults to whole US dollars. */
 amountOptions?:Intl.NumberFormatOptions;
 /** The amount the pool is filling towards. Draws the progress bar under the caption (full only against a number `amount`). */
 goal?:number;
 /** The line under the figure. A function receives the formatted goal: `goal => 'of ' + goal + ' prize pool'`. A string is drawn as given and read with the figure: top prize. Any other node, such as a live countdown, is drawn as given after the figure and reads itself. */
 caption?:React.ReactNode|((goal:string)=>React.ReactNode);
 /** The lead of the explaining sentence, in the text colour: Top 100 traders split the pool. Host text, or host Text elements for an accented word. */
 headline?:React.ReactNode;
 /** Continues the sentence after the headline in the muted colour: Funded by builder fees on every trade. */
 description?:string;
 /** A full-width action under the description: Draws and winners. The host opens its own destination. */
 action?:{label:string;onSelect:()=>void};
}
/** A host figure that updates place by place: `{value:1090779, options:{style:'currency',currency:'USD',maximumFractionDigits:0}, suffix:' vol'}`. */
export type RewardFigure=Figure;
/** One step of the paging control under the list. */
export interface RewardPageStep {label:string;onSelect:()=>void;disabled?:boolean}
/** One trader in the standings. */
export interface RewardEntry {
 id:string;rank:number;
 /** A short address, a handle, or the host's word for the viewer. */
 name:string;
 /** An image URL or a host element. Without one the first letters of the name are shown. */
 avatar?:AssetArtwork;
 /** Shows the verified mark after the name. */
 verified?:boolean;
 /** The line under the name: `$1,090,779 vol` as text, or the same as a live figure. */
 detail?:string|RewardFigure;
 /** Points or entries. `null` reads as unknown. */
 score:number|null;
 /** Format of this entry's score, in place of the block's `scoreOptions`, for a prize list where some amounts have cents. */
 scoreOptions?:Intl.NumberFormatOptions;
 /** Marks the viewer's own row: the name and score take the action colour. */
 you?:boolean;
}
export interface RewardBlockProps {
 /** Heading: Leaderboard. */
 title:string;
 promo?:RewardPromo;
 /** A choice between standings, such as Upcoming draw and Top winners. `label` names the control. */
 tabs?:{label:string;options:readonly {value:string;label:string}[];value:string;onValueChange:(value:string)=>void};
 /** The viewer's own standing, pinned above the list on a tinted row. */
 you?:RewardEntry;
 /** Names the pinned row for assistive technology, read before its rank: Your rank. */
 youLabel?:string;
 /** A muted line between the pinned row and the list, announced when it changes: You're not ranked yet. */
 status?:string;
 /** Host artwork in place of the built-in verified mark, inside the row's one accessible element. */
 verifiedMark?:React.ReactNode;
 /** The `verifiedMark` is a control, such as a badge that opens an explanation: it stays in the accessibility tree, the row's reading then sits on the name and the mark follows as its own element. */
 verifiedMarkInteractive?:boolean;
 /** Draws skeleton rows in place of the entries while the host loads them. */
 loading?:boolean;
 /** Host text that names the skeleton rows for assistive technology: Loading standings. Without it they are only marked busy. */
 loadingLabel?:string;
 /** Paging under the list: Previous and Next as buttons with the host's range between them, such as 1–25. */
 pagination?:{previous?:RewardPageStep;next?:RewardPageStep;label?:string};
 /** Keeps the header pinned while the rest scrolls: the block becomes its own scroll view (`scrollComponent`) with the header as a sticky first child, transparent at rest and filled once the standings scroll under it. Place it in a bounded container, such as a sheet body. */
 stickyHeader?:boolean;
 /** Fill behind the pinned header once rows scroll under it. Defaults to the background role; in a sheet pass the sheet's fill (`useColors().overlay`). */
 stickyHeaderBackground?:string;
 /** Set false to leave the header out, when the host pins its own `ScreenHeader` above the block. The content then starts at the block's top edge. */
 header?:boolean;
 /** The scroll view used with `stickyHeader`, such as a sheet library's own. Defaults to React Native's ScrollView. */
 scrollComponent?:React.ComponentType<ScrollViewProps>;
 /** A host FlatList, such as a sheet-integrated list, that scrolls the entire screen. Its null cell holds the content before the standings. */
 listComponent?:React.ComponentType<FlatListProps<RewardEntry|null>>;
 /** The column heading over the names: Top 25 by volume. */
 listTitle?:string;
 /** The column heading over the scores: Entries. */
 scoreTitle?:string;
 /** The standings, in order. Leave them out for a promotion-only pane: no list is drawn. */
 entries?:readonly RewardEntry[];
 /** Format of every score. Defaults to a whole number. An entry's own `scoreOptions` wins. */
 scoreOptions?:Intl.NumberFormatOptions;
 /** Words for the verified mark, read after the name. */
 verifiedLabel?:string;
 /** A line under the list: Entries are provisional until audited. */
 footnote?:string;
 /** Shows Back on the leading edge of the header. */
 onBack?:()=>void;
 /** A control on the trailing edge of the header, usually an IconButton that shares. */
 headerAction?:React.ReactNode;
 /** Prefixes every test ID inside the block: `<testID>-header`, `<testID>-back`, `<testID>-title`, `<testID>-row-<id>` and so on. Omitted, they start with `reward`. */
 testID?:string;
}
const rewardStatStyle:ViewStyle={flex:1,minWidth:0,gap:4,justifyContent:'space-between'};
function DrawingCountdown({drawing}:{drawing:NonNullable<RewardPromo['drawing']>}){
 const locale=useNumberLocale();
 const [seconds,setSeconds]=React.useState<number|null>(null);
 React.useEffect(()=>watchCountdown(drawing.at,setSeconds),[drawing.at]);
 const clock=formatCountdown(seconds==null?NaN:seconds*1000,locale);
 const colors=useColors();
 if(seconds===0)return <View style={rewardStatStyle}><Text style={{color:colors.muted,fontSize:14}}>{drawing.label}</Text><Text>{drawing.endedLabel}</Text></View>;
 return <View accessible accessibilityLabel={drawing.label+' '+clock.spoken} style={rewardStatStyle}>
  <Text accessible={false} style={{color:colors.muted,fontSize:14}}>{drawing.label}</Text>
  <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants"><NumberFlow value={seconds} formattedValue={clock.visible} animateFormatted trend={-1}/></View>
 </View>;
}
const wholeDollars:Intl.NumberFormatOptions={style:'currency',currency:'USD',maximumFractionDigits:0};
const whole:Intl.NumberFormatOptions={maximumFractionDigits:0};
const noEntries:readonly RewardEntry[]=[];
const hidden={accessible:false,accessibilityElementsHidden:true,importantForAccessibility:'no-hide-descendants' as const};
const avatar=40,space=' ';
/** The share of the goal reached, from 0 to 1. Unknown amounts and goals that are not above zero give `null`. */
export function rewardProgress(amount:number|null|undefined,goal:number|null|undefined):number|null{
 return amount==null||goal==null||!Number.isFinite(amount)||!Number.isFinite(goal)||!(goal>0)?null:Math.min(1,Math.max(0,amount/goal));
}
const Standing=React.memo(function Standing({entry,id,style,lead,pinned,scoreOptions,verifiedLabel,verifiedMark,verifiedMarkInteractive}:{
 entry:RewardEntry;id:string;style?:ViewStyle;lead?:string;pinned?:boolean;scoreOptions:Intl.NumberFormatOptions;
} & Pick<RewardBlockProps,'verifiedLabel'|'verifiedMark'|'verifiedMarkInteractive'>){
 const colors=useColors(),fills=useFills(),direction=useLayoutDirection(),monoFontFamily=useMonoFontFamily(),locale=useNumberLocale(),present=usePresentNumber();
  const figure=entry.detail!=null&&typeof entry.detail==='object'?entry.detail:null,detail=typeof entry.detail==='string'?entry.detail:undefined,score=entry.scoreOptions??scoreOptions;
  const said=figure?formatNumberReadout(figure.value,locale,present(figure.options),figure.formattedValue,figure.prefix,figure.suffix).text:detail;
  const reading=[lead,String(entry.rank),entry.name,entry.verified&&verifiedLabel?verifiedLabel:null,said,formatNumberReadout(entry.score,locale,present(score)).text].filter(Boolean).join(', ');
  const disc:ViewStyle={width:avatar,height:avatar,borderRadius:avatar/2,backgroundColor:fills.raised,alignItems:'center',justifyContent:'center',overflow:'hidden'};
  // An interactive host mark stays in the accessibility tree: the row's reading moves to the name, and the mark follows as its own element.
  const split=!!entry.verified&&verifiedMark!=null&&!!verifiedMarkInteractive;
  return <View testID={id} accessible={!split} accessibilityLabel={split?undefined:reading} style={{direction,flexDirection:'row',alignItems:'center',gap:12,minHeight:64,paddingVertical:8,paddingHorizontal:20,backgroundColor:pinned?withAlpha(colors.action,0.12):fills.well,...(pinned?{marginTop:16,borderRadius:20}:null),...style}}>
   <Text {...hidden} style={{minWidth:24,fontFamily:monoFontFamily,fontSize:16,lineHeight:24,fontWeight:'600',color:colors.muted}}>{entry.rank}</Text>
   <View {...hidden}>{typeof entry.avatar==='string'?<Image accessible={false} accessibilityIgnoresInvertColors source={{uri:entry.avatar}} style={disc as object}/>:<View style={disc}>{entry.avatar??<Text maxFontSizeMultiplier={1} style={{fontSize:12,lineHeight:16,fontWeight:'600',color:colors.muted}}>{entry.name.slice(0,2)}</Text>}</View>}</View>
   <View {...(split?null:hidden)} style={{flex:1,flexShrink:1,minWidth:0}}>
    <View style={{flexDirection:'row',alignItems:'center',gap:6}}>
     <Text testID={`${id}-name`} accessible={split} accessibilityLabel={split?reading:undefined} numberOfLines={1} style={{flexShrink:1,fontFamily:monoFontFamily,fontSize:16,lineHeight:24,fontWeight:'600',color:colors.text}}>{entry.name}</Text>
     {entry.verified?(verifiedMark!=null?<View testID={`${id}-verified`}>{verifiedMark}</View>:<View testID={`${id}-verified`} style={{transform:[{scale:0.8}]}}><SeverityIcon kind='success' color={colors.warning}/></View>):null}
    </View>
    {figure?<View {...hidden} style={{alignItems:'flex-start'}}><AnimatedNumberReadout testID={`${id}-detail`} {...figureProps(figure)} tone='muted' style={{fontFamily:monoFontFamily,fontSize:14,lineHeight:20}}/></View>
     :detail?<Text {...hidden} numberOfLines={1} style={{fontFamily:monoFontFamily,fontSize:14,lineHeight:20,color:colors.muted}}>{detail}</Text>:null}
   </View>
   <View {...hidden}><AnimatedNumberReadout value={entry.score} options={score} tone='text' testID={`${id}-score`} style={{fontSize:16,lineHeight:24,fontWeight:'600'}}/></View>
  </View>;
});
const firstStanding:ViewStyle={borderTopLeftRadius:20,borderTopRightRadius:20,overflow:"hidden"};
const lastStanding:ViewStyle={borderBottomLeftRadius:20,borderBottomRightRadius:20,overflow:"hidden"};
const onlyStanding:ViewStyle={borderRadius:20,overflow:"hidden"};
/** A competition as a screen: an optional promotion (a prize pool filling towards its goal, or a draw with its top prize), an optional choice of standings, the viewer's own standing pinned on a tinted row, and the ranked list. */
export function RewardBlock({title,promo,tabs,you,youLabel,status,listTitle,scoreTitle,entries=noEntries,scoreOptions=whole,verifiedLabel,verifiedMark,verifiedMarkInteractive,loading,loadingLabel,pagination,footnote,onBack,headerAction,stickyHeader,stickyHeaderBackground,scrollComponent,listComponent,header:showHeader=true,testID}:RewardBlockProps){
 const colors=useColors(),fills=useFills(),direction=useLayoutDirection(),monoFontFamily=useMonoFontFamily(),locale=useNumberLocale(),present=usePresentNumber();
 const prefix=testID??'reward',tid=(part:string)=>`${prefix}-${part}`;
 const amount=promo?.amount,money=promo?.amountOptions??wholeDollars,reached=promo?rewardProgress(typeof amount==='string'?null:amount,promo.goal):null;
 const caption=typeof promo?.caption==='function'?promo.goal!==undefined?promo.caption(formatNumber(promo.goal,locale,present(money))):undefined:promo?.caption;
 // A text caption is read with the figure; a host node (such as a live countdown) and a host figure read themselves.
 const captionText=typeof caption==='string'||typeof caption==='number'?String(caption):null,captionNode=captionText===null&&caption!=null&&caption!==false?caption:null;
 const hostFigure=promo?.figure!=null&&promo.figure!==false?promo.figure:null;
 const caps={fontFamily:monoFontFamily,fontSize:12,lineHeight:16,letterSpacing:1.5,textTransform:'uppercase'} as const;
 const figureStyle={fontSize:44,lineHeight:50,fontWeight:'700',letterSpacing:-0.9} as const,captionStyle={fontFamily:monoFontFamily,fontSize:15,lineHeight:22,color:colors.muted} as const;
 const standing=(entry:RewardEntry,style?:ViewStyle)=><Standing key={entry.id} entry={entry} id={tid(`row-${entry.id}`)} style={style} scoreOptions={scoreOptions}
  verifiedLabel={verifiedLabel} verifiedMark={verifiedMark} verifiedMarkInteractive={verifiedMarkInteractive}/>;
 const pinned=you?<Standing key={you.id} pinned entry={you} id={tid('you')} lead={youLabel} scoreOptions={scoreOptions}
  verifiedLabel={verifiedLabel} verifiedMark={verifiedMark} verifiedMarkInteractive={verifiedMarkInteractive}/>:null;

 const header=<ScreenHeader testID={prefix} title={title} onBack={onBack} action={headerAction}/>;
 const small={fontSize:14,lineHeight:21,color:colors.muted} as const;
 const windowed=!!listComponent||(!!showHeader&&!!stickyHeader&&!loading&&entries.length>50);
 const cells=React.useMemo<readonly (RewardEntry|null)[]>(()=>listComponent?(loading?[null]:[null,...entries]):entries,[listComponent,entries,loading]);
 const list=loading?<View testID={tid('loading')} accessible={!!loadingLabel} accessibilityLabel={loadingLabel} accessibilityState={{busy:true}} style={{gap:2,marginTop:16,borderRadius:20,overflow:'hidden'}}>
   {[0,1,2,3,4].map(index=><View key={index} style={{minHeight:64,backgroundColor:fills.raised}}/>)}
  </View>:entries.length>0||listTitle||scoreTitle?<View testID={tid('list')} style={{gap:8,marginTop:16}}>
   {listTitle||scoreTitle?<View style={{direction,flexDirection:'row',justifyContent:'space-between',gap:12,paddingHorizontal:4}}>
    <Text testID={tid('list-title')} style={{...caps,flexShrink:1,color:colors.muted}}>{listTitle}</Text>
    <Text testID={tid('score-title')} style={{...caps,flexShrink:1,color:colors.muted,textAlign:'right'}}>{scoreTitle}</Text>
   </View>:null}
   {!windowed&&entries.length>0?<View testID={tid('rows')} style={{gap:2,borderRadius:20,overflow:'hidden'}}>{entries.map(entry=>standing(entry))}</View>:null}
  </View>:null;
 const pages=pagination?<View testID={tid('pagination')} style={{direction,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8,marginTop:16}}>
   <View style={{flex:1,alignItems:'flex-start'}}>{pagination.previous?<Button testID={tid('previous')} intent='secondary' disabled={pagination.previous.disabled} onPress={pagination.previous.onSelect}>{pagination.previous.label}</Button>:null}</View>
   {pagination.label?<Text testID={tid('page')} accessibilityLiveRegion='polite' style={{...small,fontFamily:monoFontFamily,textAlign:'center'}}>{pagination.label}</Text>:null}
   <View style={{flex:1,alignItems:'flex-end'}}>{pagination.next?<Button testID={tid('next')} intent='secondary' disabled={pagination.next.disabled} onPress={pagination.next.onSelect}>{pagination.next.label}</Button>:null}</View>
  </View>:null;
 const beforeRows=<>
  {promo?<Surface testID={tid('promo')} style={{gap:12,marginTop:16}}>
   <View style={{direction,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12}}>
    <Text testID={tid('eyebrow')} style={{...caps,flexShrink:1,color:colors.muted}}>{promo.eyebrow}</Text>
    {promo.rules?<Pressable testID={tid('rules')} accessibilityRole='button' hitSlop={12} onPress={promo.rules.onSelect} style={({pressed})=>({flexDirection:'row',alignItems:'center',gap:4,opacity:pressed?0.6:1})}>
     <Text style={{fontSize:16,lineHeight:24,fontWeight:'500',color:colors.muted}}>{promo.rules.label}</Text>
     <View {...hidden} style={{transform:[{rotate:direction==='rtl'?'90deg':'-90deg'}]}}><ChevronIcon color={colors.muted}/></View>
    </Pressable>:null}
   </View>
   {hostFigure?<View testID={tid('amount')} style={{gap:4}}>
    <View testID={tid('figure')} style={{alignItems:'flex-start'}}>{hostFigure}</View>
    {captionText?<Text testID={tid('caption')} style={captionStyle}>{captionText}</Text>:null}
   </View>:amount!==undefined||captionText?<View testID={tid('amount')} accessible accessibilityLabel={[amount===undefined?null:typeof amount==='string'?amount:formatNumberReadout(amount,locale,present(money)).text,captionText].filter(Boolean).join(' ')} style={{gap:4}}>
    {amount===undefined?null:<View {...hidden} style={{alignItems:'flex-start'}}>{typeof amount==='string'?<Text style={{...figureStyle,color:colors.text}}>{amount}</Text>:<AnimatedNumberReadout value={amount} options={money} tone='text' style={figureStyle}/>}</View>}
    {captionText?<Text {...hidden} testID={tid('caption')} style={captionStyle}>{captionText}</Text>:null}
   </View>:null}
   {captionNode?<View testID={tid('caption')} style={{marginTop:-8}}>{captionNode}</View>:null}
   {promo.goal!==undefined?<View {...hidden} testID={tid('track')} style={{direction,flexDirection:'row',height:4,borderRadius:2,backgroundColor:fills.raised,overflow:'hidden'}}><View testID={tid('fill')} style={{width:`${(reached??0)*100}%`,minWidth:8,borderRadius:2,backgroundColor:colors.action}}/></View>:null}
   {promo.headline||promo.description?<Text testID={tid('summary')} style={{fontSize:16,lineHeight:24,color:colors.muted}}>{promo.headline?<Text style={{fontWeight:'600',color:colors.text}}>{promo.headline}</Text>:null}{promo.headline&&promo.description?space:null}{promo.description}</Text>:null}
   {promo.streak||promo.drawing?<View style={{direction,flexDirection:'row',gap:8}}>
    {promo.streak?<>
    <View style={rewardStatStyle}><Text style={{color:colors.muted,fontSize:14}}>{promo.streak.label}</Text><AnimatedNumberReadout {...figureProps(promo.streak.count)}/></View>
    <View style={rewardStatStyle}><Text style={{color:colors.muted,fontSize:14}}>{promo.streak.rewardLabel}</Text><AnimatedNumberReadout {...figureProps(promo.streak.reward)} tone="text"/></View>
    </>:null}
    {promo.drawing&&<DrawingCountdown key={promo.drawing.at} drawing={promo.drawing}/>}
   </View>:null}
   {promo.action?<Pressable testID={tid('action')} accessibilityRole='button' accessibilityLabel={promo.action.label} onPress={promo.action.onSelect} style={{direction,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12,minHeight:44,marginTop:4,marginBottom:-8,paddingTop:12,borderTopWidth:1,borderTopColor:fills.raised}}>
    <Text {...hidden} style={{flexShrink:1,fontSize:16,lineHeight:24,fontWeight:'500',color:colors.muted}}>{promo.action.label}</Text>
    <View {...hidden} style={{transform:[{rotate:direction==='rtl'?'90deg':'-90deg'}]}}><ChevronIcon color={colors.muted}/></View>
   </Pressable>:null}
  </Surface>:null}
  {tabs?<View testID={tid('tabs')} style={{marginTop:16}}><SegmentedControl label={tabs.label} options={tabs.options} value={tabs.value} onValueChange={tabs.onValueChange}/></View>:null}
  {pinned}
  {status?<Text testID={tid('status')} accessibilityLiveRegion='polite' style={{...small,marginTop:16,paddingHorizontal:4}}>{status}</Text>:null}
  {list}
 </>;
 const afterRows=<>
  {pages}
  {footnote?<Text testID={tid('footnote')} style={{fontSize:14,lineHeight:21,color:colors.muted,marginTop:16,paddingHorizontal:4}}>{footnote}</Text>:null}
 </>;
 if(windowed)return <PickerFlatList listComponent={listComponent??ListWithIntro<RewardEntry>} data={cells} keyExtractor={entry=>entry?`standing:${entry.id}`:'intro'} testID={testID}
  header={showHeader?header:null} headerTestID={tid('sticky-header')} sticky={!!showHeader&&stickyHeader} background={stickyHeaderBackground} scrollComponent={scrollComponent}
  inset={16} direction={direction} rowHeight={66}
  renderItem={({item,index})=>{
   if(!item)return <View style={{paddingHorizontal:16}}>{beforeRows}</View>;
   const first=index===1,last=index===entries.length;
   return <View style={{paddingHorizontal:16,paddingTop:first?(listTitle||scoreTitle?8:0):2}}>
    {standing(item,first&&last?onlyStanding:first?firstStanding:last?lastStanding:undefined)}
   </View>;
  }} ListFooterComponent={<View style={{paddingHorizontal:16}}>{afterRows}</View>}/>;
 const body=<>{beforeRows}{afterRows}</>;
 if(!showHeader)return <View testID={testID} style={{padding:16,paddingTop:0}}>{body}</View>;
 if(stickyHeader)return <StickyHeaderLayout testID={testID} headerTestID={tid('sticky-header')} header={header} background={stickyHeaderBackground} scrollComponent={scrollComponent}>{body}</StickyHeaderLayout>;
 return <View testID={testID} style={{padding:16}}>
  {header}
  {body}
 </View>;
}
