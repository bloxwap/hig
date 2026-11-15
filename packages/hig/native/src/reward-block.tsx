import React from 'react';
import {Image,Pressable,View,type ViewStyle} from 'react-native';
import {formatNumber} from '@bloxwap/hig/contracts';
import {withAlpha} from '@bloxwap/hig/tokens';
import {useColors,useFills,useHIG,useMessages,usePresentNumber} from './provider.js';
import {Surface,Text} from './surface.js';
import {IconButton} from './button.js';
import {SegmentedControl} from './radio-group.js';
import {ChevronIcon,SeverityIcon} from './icons.js';
import {AnimatedNumberReadout} from './animated-number.js';
import {formatNumberReadout} from './animated-number-model.js';
import type {AssetArtwork} from './asset-balance-row.js';
/** The promotion above the standings: a prize pool filling towards a goal, or a draw with a top prize. Every word is host text. */
export interface RewardPromo {
 /** The small capitals line: Season 01. */
 eyebrow:string;
 /** A text link with a chevron on the trailing edge of the eyebrow: Rules. */
 rules?:{label:string;onSelect:()=>void};
 /** The headline figure: the pool so far, or the top prize. `null` reads as unknown. */
 amount:number|null;
 /** Format of `amount` and `goal`. Defaults to whole US dollars. */
 amountOptions?:Intl.NumberFormatOptions;
 /** The amount the pool is filling towards. Draws the progress bar under the caption. */
 goal?:number;
 /** The line under the figure. A function receives the formatted goal: `goal => 'of ' + goal + ' prize pool'`. A string is drawn as given: top prize. */
 caption?:string|((goal:string)=>string);
 /** The lead of the explaining sentence, in the text colour: Top 100 traders split the pool. */
 headline?:string;
 /** Continues the sentence after the headline in the muted colour: Funded by builder fees on every trade. */
 description?:string;
 /** A full-width action under the description: Draws and winners. The host opens its own destination. */
 action?:{label:string;onSelect:()=>void};
}
/** One trader in the standings. */
export interface RewardEntry {
 id:string;rank:number;
 /** A short address, a handle, or the host's word for the viewer. */
 name:string;
 /** An image URL or a host element. Without one the first letters of the name are shown. */
 avatar?:AssetArtwork;
 /** Shows the verified mark after the name. */
 verified?:boolean;
 /** The line under the name: `$1,090,779 vol`. */
 detail?:string;
 /** Points or entries. `null` reads as unknown. */
 score:number|null;
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
 /** The column heading over the names: Top 25 by volume. */
 listTitle?:string;
 /** The column heading over the scores: Entries. */
 scoreTitle?:string;
 entries:readonly RewardEntry[];
 /** Format of every score. Defaults to a whole number. */
 scoreOptions?:Intl.NumberFormatOptions;
 /** Words for the verified mark, read after the name. */
 verifiedLabel?:string;
 /** A line under the list: Entries are provisional until audited. */
 footnote?:string;
 /** Shows Back on the leading edge of the header. */
 onBack?:()=>void;
 /** A control on the trailing edge of the header, usually an IconButton that shares. */
 headerAction?:React.ReactNode;
 testID?:string;
}
const wholeDollars:Intl.NumberFormatOptions={style:'currency',currency:'USD',maximumFractionDigits:0};
const whole:Intl.NumberFormatOptions={maximumFractionDigits:0};
const hidden={accessible:false,accessibilityElementsHidden:true,importantForAccessibility:'no-hide-descendants' as const};
const avatar=40,space=' ';
/** The share of the goal reached, from 0 to 1. Unknown amounts and goals that are not above zero give `null`. */
export function rewardProgress(amount:number|null|undefined,goal:number|null|undefined):number|null{
 return amount==null||goal==null||!Number.isFinite(amount)||!Number.isFinite(goal)||!(goal>0)?null:Math.min(1,Math.max(0,amount/goal));
}
/** A competition as a screen: an optional promotion (a prize pool filling towards its goal, or a draw with its top prize), an optional choice of standings, the viewer's own standing pinned on a tinted row, and the ranked list. */
export function RewardBlock({title,promo,tabs,you,listTitle,scoreTitle,entries,scoreOptions=whole,verifiedLabel,footnote,onBack,headerAction,testID}:RewardBlockProps){
 const colors=useColors(),fills=useFills(),t=useMessages(),{direction,locale,monoFontFamily}=useHIG(),present=usePresentNumber();
 const money=promo?.amountOptions??wholeDollars,reached=promo?rewardProgress(promo.amount,promo.goal):null;
 const caption=typeof promo?.caption==='function'?promo.goal!==undefined?promo.caption(formatNumber(promo.goal,locale,present(money))):undefined:promo?.caption;
 const caps={fontFamily:monoFontFamily,fontSize:12,lineHeight:16,letterSpacing:1.5,textTransform:'uppercase'} as const;
 const standing=(entry:RewardEntry,id:string,style?:ViewStyle)=>{
  const mine=!!entry.you,reading=[String(entry.rank),entry.name,entry.verified&&verifiedLabel?verifiedLabel:null,entry.detail,formatNumberReadout(entry.score,locale,present(scoreOptions)).text].filter(Boolean).join(', ');
  const disc:ViewStyle={width:avatar,height:avatar,borderRadius:avatar/2,backgroundColor:fills.raised,alignItems:'center',justifyContent:'center',overflow:'hidden'};
  return <View key={entry.id} testID={id} accessible accessibilityLabel={reading} style={{direction,flexDirection:'row',alignItems:'center',gap:12,minHeight:64,paddingVertical:8,paddingHorizontal:20,backgroundColor:fills.well,...style}}>
   <Text {...hidden} style={{minWidth:24,fontFamily:monoFontFamily,fontSize:16,lineHeight:24,fontWeight:'600',color:colors.muted}}>{entry.rank}</Text>
   <View {...hidden}>{typeof entry.avatar==='string'?<Image accessible={false} accessibilityIgnoresInvertColors source={{uri:entry.avatar}} style={disc as object}/>:<View style={disc}>{entry.avatar??<Text maxFontSizeMultiplier={1} style={{fontSize:12,lineHeight:16,fontWeight:'600',color:colors.muted}}>{entry.name.slice(0,2)}</Text>}</View>}</View>
   <View {...hidden} style={{flex:1,flexShrink:1,minWidth:0}}>
    <View style={{flexDirection:'row',alignItems:'center',gap:6}}>
     <Text testID={`${id}-name`} numberOfLines={1} style={{flexShrink:1,fontFamily:monoFontFamily,fontSize:16,lineHeight:24,fontWeight:'600',color:mine?colors.action:colors.text}}>{entry.name}</Text>
     {entry.verified?<View testID={`${id}-verified`} style={{transform:[{scale:0.8}]}}><SeverityIcon kind='success' color={colors.warning}/></View>:null}
    </View>
    {entry.detail?<Text numberOfLines={1} style={{fontFamily:monoFontFamily,fontSize:14,lineHeight:20,color:colors.muted}}>{entry.detail}</Text>:null}
   </View>
   <View {...hidden}><AnimatedNumberReadout value={entry.score} options={scoreOptions} tone={mine?'positive':'text'} testID={`${id}-score`} style={{fontSize:16,lineHeight:24,fontWeight:'600'}}/></View>
  </View>;
 };
 // Rows are built here so their test ids are code, not JSX text.
 const pinned=you?standing({...you,you:true},'reward-you',{marginTop:16,borderRadius:20,backgroundColor:withAlpha(colors.action,0.12)}):null;
 const rows=entries.map(entry=>standing(entry,`reward-row-${entry.id}`));
 return <View testID={testID} style={{padding:16}}>
  <View testID='reward-header' style={{flexDirection:'row',alignItems:'center',minHeight:44}}>
   <View style={{minWidth:44,alignItems:'flex-start'}}>{onBack?<IconButton intent='ghost' label={t.back} suppressFeedback testID='reward-back' onPress={onBack}><View style={{transform:[{rotate:direction==='rtl'?'-90deg':'90deg'}]}}><ChevronIcon color={colors.text}/></View></IconButton>:null}</View>
   <Text testID='reward-title' accessibilityRole='header' numberOfLines={1} style={{flex:1,textAlign:'center',fontSize:17,lineHeight:24,fontWeight:'600',color:colors.text}}>{title}</Text>
   <View style={{minWidth:44,alignItems:'flex-end'}}>{headerAction}</View>
  </View>
  {promo?<Surface testID='reward-promo' style={{gap:12,marginTop:16}}>
   <View style={{direction,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12}}>
    <Text testID='reward-eyebrow' style={{...caps,flexShrink:1,color:colors.muted}}>{promo.eyebrow}</Text>
    {promo.rules?<Pressable testID='reward-rules' accessibilityRole='button' hitSlop={12} onPress={promo.rules.onSelect} style={({pressed})=>({flexDirection:'row',alignItems:'center',gap:4,opacity:pressed?0.6:1})}>
     <Text style={{fontSize:16,lineHeight:24,fontWeight:'500',color:colors.muted}}>{promo.rules.label}</Text>
     <View {...hidden} style={{transform:[{rotate:direction==='rtl'?'90deg':'-90deg'}]}}><ChevronIcon color={colors.muted}/></View>
    </Pressable>:null}
   </View>
   <View testID='reward-amount' accessible accessibilityLabel={[formatNumberReadout(promo.amount,locale,present(money)).text,caption].filter(Boolean).join(' ')} style={{gap:4}}>
    <View {...hidden} style={{alignItems:'flex-start'}}><AnimatedNumberReadout value={promo.amount} options={money} tone='positive' style={{fontSize:44,lineHeight:50,fontWeight:'700',letterSpacing:-0.9}}/></View>
    {caption?<Text {...hidden} testID='reward-caption' style={{fontFamily:monoFontFamily,fontSize:15,lineHeight:22,color:colors.muted}}>{caption}</Text>:null}
   </View>
   {promo.goal!==undefined?<View {...hidden} testID='reward-track' style={{direction,flexDirection:'row',height:4,borderRadius:2,backgroundColor:fills.raised,overflow:'hidden'}}><View testID='reward-fill' style={{width:`${(reached??0)*100}%`,minWidth:8,borderRadius:2,backgroundColor:colors.action}}/></View>:null}
   {promo.headline||promo.description?<Text testID='reward-summary' style={{fontSize:16,lineHeight:24,color:colors.muted}}>{promo.headline?<Text style={{fontWeight:'600',color:colors.text}}>{promo.headline}</Text>:null}{promo.headline&&promo.description?space:null}{promo.description}</Text>:null}
   {promo.action?<Pressable testID='reward-action' accessibilityRole='button' accessibilityLabel={promo.action.label} onPress={promo.action.onSelect} style={{direction,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12,minHeight:44,marginTop:4,marginBottom:-8,paddingTop:12,borderTopWidth:1,borderTopColor:fills.raised}}>
    <Text {...hidden} style={{flexShrink:1,fontSize:16,lineHeight:24,fontWeight:'500',color:colors.muted}}>{promo.action.label}</Text>
    <View {...hidden} style={{transform:[{rotate:direction==='rtl'?'90deg':'-90deg'}]}}><ChevronIcon color={colors.muted}/></View>
   </Pressable>:null}
  </Surface>:null}
  {tabs?<View testID='reward-tabs' style={{marginTop:16}}><SegmentedControl label={tabs.label} options={tabs.options} value={tabs.value} onValueChange={tabs.onValueChange}/></View>:null}
  {pinned}
  {entries.length>0||listTitle||scoreTitle?<View testID='reward-list' style={{gap:8,marginTop:16}}>
   {listTitle||scoreTitle?<View style={{direction,flexDirection:'row',justifyContent:'space-between',gap:12,paddingHorizontal:4}}>
    <Text testID='reward-list-title' style={{...caps,flexShrink:1,color:colors.muted}}>{listTitle}</Text>
    <Text testID='reward-score-title' style={{...caps,flexShrink:1,color:colors.muted,textAlign:'right'}}>{scoreTitle}</Text>
   </View>:null}
   {entries.length>0?<View testID='reward-rows' style={{gap:2,borderRadius:20,overflow:'hidden'}}>{rows}</View>:null}
  </View>:null}
  {footnote?<Text testID='reward-footnote' style={{fontSize:14,lineHeight:21,color:colors.muted,marginTop:16,paddingHorizontal:4}}>{footnote}</Text>:null}
 </View>;
}
