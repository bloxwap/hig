import React from 'react';
import {Image,View,type ViewStyle} from 'react-native';
import {formatNumber} from '@bloxwap/hig/contracts';
import {withAlpha} from '@bloxwap/hig/tokens';
import {useColors,useFills,useHIG,useMessages} from './provider.js';
import {Surface,Text} from './surface.js';
import {Button,IconButton} from './button.js';
import {SegmentedControl} from './radio-group.js';
import {ChevronIcon,SeverityIcon} from './icons.js';
import {AnimatedNumberReadout} from './animated-number.js';
import {formatNumberReadout} from './animated-number-model.js';
import type {AssetArtwork} from './asset-balance-row.js';
/** One piece of the headline: plain text, or `{highlight}` for a figure drawn in the action colour. */
export type LeaderboardText=string|{highlight:string};
/** The promotion above the standings: a prize pool filling towards a goal, or a draw with a top prize. Every word is host text. */
export interface LeaderboardPromo {
 /** The small capitals line: Season 01 prize pool. */
 eyebrow:string;
 /** The capsule on the trailing edge of the eyebrow: See rules. */
 rules?:{label:string;onSelect:()=>void};
 /** The headline figure: the pool so far, or the top prize. `null` reads as unknown. */
 amount:number|null;
 /** Format of `amount` and `goal`. Defaults to whole US dollars. */
 amountOptions?:Intl.NumberFormatOptions;
 /** The amount the pool is filling towards. Shows `/ $250,000` beside the figure and the progress bar under it. */
 goal?:number;
 /** Words after the figure when there is no goal: top prize. */
 caption?:string;
 /** The line under the leading end of the bar. Receives the share reached as a formatted percent: `percent => percent + ' to goal'`. */
 progress?:(percent:string)=>string;
 /** The line under the trailing end of the bar: Updates every 15 minutes. */
 updated?:string;
 /** The sentence that explains the promotion, as pieces: `['Top ', {highlight: '100'}, ' traders split ', {highlight: '$250,000'}, ' pot']`. */
 headline?:readonly LeaderboardText[];
 description?:string;
 /** A full-width action under the description: Draws and winners. The host opens its own destination. */
 action?:{label:string;onSelect:()=>void};
}
/** One trader in the standings. */
export interface LeaderboardEntry {
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
export interface LeaderboardCardProps {
 /** Heading: Leaderboard. */
 title:string;
 promo?:LeaderboardPromo;
 /** A choice between standings, such as Upcoming draw and Top winners. `label` names the control. */
 tabs?:{label:string;options:readonly {value:string;label:string}[];value:string;onValueChange:(value:string)=>void};
 /** The viewer's own standing, pinned above the list on a tinted row. */
 you?:LeaderboardEntry;
 /** The column heading over the names: Top 25 by volume. */
 listTitle?:string;
 /** The column heading over the scores: Entries. */
 scoreTitle?:string;
 entries:readonly LeaderboardEntry[];
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
const share:Intl.NumberFormatOptions={style:'percent',maximumFractionDigits:0};
const hidden={accessible:false,accessibilityElementsHidden:true,importantForAccessibility:'no-hide-descendants' as const};
const avatar=40,unknown='—',of='/ ';
/** The share of the goal reached, from 0 to 1. Unknown amounts and goals that are not above zero give `null`. */
export function leaderboardProgress(amount:number|null|undefined,goal:number|null|undefined):number|null{
 return amount==null||goal==null||!Number.isFinite(amount)||!Number.isFinite(goal)||!(goal>0)?null:Math.min(1,Math.max(0,amount/goal));
}
/** A competition as a screen: an optional promotion (a prize pool filling towards its goal, or a draw with its top prize), an optional choice of standings, the viewer's own standing pinned on a tinted row, and the ranked list. */
export function LeaderboardCard({title,promo,tabs,you,listTitle,scoreTitle,entries,scoreOptions=whole,verifiedLabel,footnote,onBack,headerAction,testID}:LeaderboardCardProps){
 const colors=useColors(),fills=useFills(),t=useMessages(),{direction,locale,monoFontFamily}=useHIG();
 const money=promo?.amountOptions??wholeDollars,reached=promo?leaderboardProgress(promo.amount,promo.goal):null;
 const caps={fontFamily:monoFontFamily,fontSize:12,lineHeight:16,letterSpacing:1.5,textTransform:'uppercase'} as const;
 const standing=(entry:LeaderboardEntry,id:string,style?:ViewStyle)=>{
  const mine=!!entry.you,reading=[String(entry.rank),entry.name,entry.verified&&verifiedLabel?verifiedLabel:null,entry.detail,formatNumberReadout(entry.score,locale,scoreOptions).text].filter(Boolean).join(', ');
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
 const pinned=you?standing({...you,you:true},'leaderboard-you',{marginTop:16,borderRadius:20,backgroundColor:withAlpha(colors.action,0.12)}):null;
 const rows=entries.map(entry=>standing(entry,`leaderboard-row-${entry.id}`));
 return <View testID={testID} style={{padding:16}}>
  <View testID='leaderboard-header' style={{flexDirection:'row',alignItems:'center',minHeight:44}}>
   <View style={{minWidth:44,alignItems:'flex-start'}}>{onBack?<IconButton intent='ghost' label={t.back} suppressFeedback testID='leaderboard-back' onPress={onBack}><View style={{transform:[{rotate:direction==='rtl'?'-90deg':'90deg'}]}}><ChevronIcon color={colors.text}/></View></IconButton>:null}</View>
   <Text testID='leaderboard-title' accessibilityRole='header' numberOfLines={1} style={{flex:1,textAlign:'center',fontSize:17,lineHeight:24,fontWeight:'600',color:colors.text}}>{title}</Text>
   <View style={{minWidth:44,alignItems:'flex-end'}}>{headerAction}</View>
  </View>
  {promo?<Surface testID='leaderboard-promo' style={{gap:12,marginTop:16}}>
   <View style={{direction,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12}}>
    <View style={{flexDirection:'row',alignItems:'center',gap:8,flexShrink:1}}>
     <View {...hidden} style={{width:8,height:8,borderRadius:4,backgroundColor:colors.action}}/>
     <Text testID='leaderboard-eyebrow' style={{...caps,flexShrink:1,color:colors.action}}>{promo.eyebrow}</Text>
    </View>
    {promo.rules?<Button testID='leaderboard-rules' onPress={promo.rules.onSelect} style={{minHeight:36,paddingVertical:6,paddingHorizontal:16}}>{promo.rules.label}</Button>:null}
   </View>
   <View testID='leaderboard-amount' accessible accessibilityLabel={[formatNumberReadout(promo.amount,locale,money).text,promo.goal!==undefined?of+formatNumber(promo.goal,locale,money):promo.caption].filter(Boolean).join(' ')} style={{direction,flexDirection:'row',alignItems:'baseline',flexWrap:'wrap',gap:8}}>
    <View {...hidden}><AnimatedNumberReadout value={promo.amount} options={money} tone='positive' style={{fontSize:36,lineHeight:44,fontWeight:'700'}}/></View>
    {promo.goal!==undefined?<Text {...hidden} style={{fontFamily:monoFontFamily,fontSize:16,lineHeight:24,color:colors.muted}}>{of+formatNumber(promo.goal,locale,money)}</Text>:promo.caption?<Text {...hidden} style={{fontFamily:monoFontFamily,fontSize:16,lineHeight:24,color:colors.muted}}>{promo.caption}</Text>:null}
   </View>
   {promo.goal!==undefined?<View style={{gap:8}}>
    <View {...hidden} testID='leaderboard-track' style={{direction,flexDirection:'row',height:8,borderRadius:4,backgroundColor:fills.raised,overflow:'hidden'}}><View testID='leaderboard-fill' style={{width:`${(reached??0)*100}%`,minWidth:8,borderRadius:4,backgroundColor:colors.action}}/></View>
    {promo.progress||promo.updated?<View style={{direction,flexDirection:'row',justifyContent:'space-between',gap:12}}>
     <Text testID='leaderboard-progress' style={{...caps,flexShrink:1,color:colors.muted}}>{promo.progress?.(reached===null?unknown:formatNumber(reached,locale,share))}</Text>
     <Text testID='leaderboard-updated' style={{...caps,flexShrink:1,color:colors.muted,textAlign:'right'}}>{promo.updated}</Text>
    </View>:null}
   </View>:null}
   {promo.headline&&promo.headline.length>0?<Text testID='leaderboard-headline' style={{fontSize:20,lineHeight:26,fontWeight:'600',color:colors.text}}>{promo.headline.map((part,index)=>typeof part==='string'?part:<Text key={index} style={{color:colors.action}}>{part.highlight}</Text>)}</Text>:null}
   {promo.description?<Text testID='leaderboard-description' style={{fontSize:14,lineHeight:21,color:colors.muted}}>{promo.description}</Text>:null}
   {promo.action?<Button testID='leaderboard-action' fullWidth onPress={promo.action.onSelect}>{promo.action.label}</Button>:null}
  </Surface>:null}
  {tabs?<View testID='leaderboard-tabs' style={{marginTop:16}}><SegmentedControl label={tabs.label} options={tabs.options} value={tabs.value} onValueChange={tabs.onValueChange}/></View>:null}
  {pinned}
  {entries.length>0||listTitle||scoreTitle?<View testID='leaderboard-list' style={{gap:8,marginTop:16}}>
   {listTitle||scoreTitle?<View style={{direction,flexDirection:'row',justifyContent:'space-between',gap:12,paddingHorizontal:4}}>
    <Text testID='leaderboard-list-title' style={{...caps,flexShrink:1,color:colors.muted}}>{listTitle}</Text>
    <Text testID='leaderboard-score-title' style={{...caps,flexShrink:1,color:colors.muted,textAlign:'right'}}>{scoreTitle}</Text>
   </View>:null}
   {entries.length>0?<View testID='leaderboard-rows' style={{gap:2,borderRadius:20,overflow:'hidden'}}>{rows}</View>:null}
  </View>:null}
  {footnote?<Text testID='leaderboard-footnote' style={{fontSize:14,lineHeight:21,color:colors.muted,marginTop:16,paddingHorizontal:4}}>{footnote}</Text>:null}
 </View>;
}
