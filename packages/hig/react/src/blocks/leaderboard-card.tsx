"use client";
import React from 'react';
import {formatNumber} from '@bloxwap/hig/contracts';
import {useHIG} from '../provider.js';
import {Button} from '../button.js';
import {SegmentedControl} from '../selection.js';
import {AnimatedNumberReadout} from '../animated-number.js';
import type {AssetArtwork} from '../asset-balance-row.js';
import {ScreenHeader} from './screen-header.js';
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
export interface LeaderboardCardProps extends Omit<React.HTMLAttributes<HTMLElement>,'title'> {
 /** Heading: Leaderboard. */
 title:string;
 promo?:LeaderboardPromo;
 /** A choice between standings, such as Upcoming draw and Top winners. `label` names the control and is not drawn. */
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
 /** Accessible name of the verified mark. The mark is decorative without it. */
 verifiedLabel?:string;
 /** A line under the list: Entries are provisional until audited. */
 footnote?:string;
 onBack?:()=>void;
 /** A control on the trailing edge of the header, usually an `IconButton` that shares. */
 headerAction?:React.ReactNode;
}
const wholeDollars={style:'currency',currency:'USD',maximumFractionDigits:0} as const,whole={maximumFractionDigits:0} as const;
/** The share of the goal reached, from 0 to 1. Unknown amounts and goals that are not above zero give `null`. */
export function leaderboardProgress(amount:number|null|undefined,goal:number|null|undefined):number|null{
 return amount==null||goal==null||!Number.isFinite(amount)||!Number.isFinite(goal)||!(goal>0)?null:Math.min(1,Math.max(0,amount/goal));
}
const verifiedMark=<svg className='hig-leaderboard-verified-mark' aria-hidden='true' focusable='false' viewBox='0 0 20 20' width='16' height='16' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round'><circle cx='10' cy='10' r='7.5'/><path d='m6.75 10.25 2.25 2.25 4.25-4.75'/></svg>;
function Standing({entry,scoreOptions,verifiedLabel,as:Tag='li'}:{entry:LeaderboardEntry;scoreOptions:Intl.NumberFormatOptions;verifiedLabel?:string;as?:'li'|'div'}){
 return <Tag className='hig-leaderboard-row' data-you={entry.you||undefined}>
  <span className='hig-leaderboard-rank hig-number'>{entry.rank}</span>
  <span className='hig-leaderboard-avatar' aria-hidden='true'>{typeof entry.avatar==='string'?<img src={entry.avatar} alt=''/>:entry.avatar??entry.name.slice(0,2)}</span>
  <span className='hig-leaderboard-identity'>
   <strong className='hig-number'>{entry.name}{entry.verified&&<span className='hig-leaderboard-verified' role={verifiedLabel?'img':undefined} aria-label={verifiedLabel}>{verifiedMark}</span>}</strong>
   {entry.detail&&<span className='hig-number'>{entry.detail}</span>}
  </span>
  <span className='hig-leaderboard-score'><AnimatedNumberReadout value={entry.score} options={scoreOptions}/></span>
 </Tag>;
}
/** A competition as a screen: an optional promotion (a prize pool filling towards its goal, or a draw with its top prize), an optional choice of standings, the viewer's own standing pinned on a tinted row, and the ranked list. */
export function LeaderboardCard({title,promo,tabs,you,listTitle,scoreTitle,entries,scoreOptions=whole,verifiedLabel,footnote,onBack,headerAction,className,...rest}:LeaderboardCardProps){
 const {locale}=useHIG();
 const money=promo?.amountOptions??wholeDollars,share=promo?leaderboardProgress(promo.amount,promo.goal):null;
 return <section {...rest} className={`hig-leaderboard-card${className?` ${className}`:''}`}>
  <ScreenHeader title={title} onBack={onBack} action={headerAction}/>
  {promo&&<section className='hig-surface hig-leaderboard-promo'>
   <div className='hig-leaderboard-promo-top'><span className='hig-leaderboard-eyebrow hig-number'>{promo.eyebrow}</span>{promo.rules&&<Button className='hig-leaderboard-rules' onClick={promo.rules.onSelect}>{promo.rules.label}</Button>}</div>
   <p className='hig-leaderboard-amount'><strong><AnimatedNumberReadout value={promo.amount} options={money}/></strong>{promo.goal!==undefined?<span className='hig-number'>/ {formatNumber(promo.goal,locale,money)}</span>:promo.caption&&<span className='hig-number'>{promo.caption}</span>}</p>
   {promo.goal!==undefined&&<div className='hig-leaderboard-progress'>
    <div className='hig-leaderboard-track' aria-hidden='true'><span style={{width:`${(share??0)*100}%`}}/></div>
    {(promo.progress||promo.updated)&&<div className='hig-leaderboard-progress-meta hig-number'><span>{promo.progress?.(share===null?'—':formatNumber(share,locale,{style:'percent',maximumFractionDigits:0}))}</span><span>{promo.updated}</span></div>}
   </div>}
   {promo.headline&&promo.headline.length>0&&<p className='hig-leaderboard-headline'>{promo.headline.map((part,index)=>typeof part==='string'?<React.Fragment key={index}>{part}</React.Fragment>:<mark key={index}>{part.highlight}</mark>)}</p>}
   {promo.description&&<p className='hig-leaderboard-description'>{promo.description}</p>}
   {promo.action&&<Button fullWidth onClick={promo.action.onSelect}>{promo.action.label}</Button>}
  </section>}
  {tabs&&<SegmentedControl label={tabs.label} options={tabs.options} value={tabs.value} onValueChange={tabs.onValueChange}/>}
  {you&&<div className='hig-leaderboard-you'><Standing as='div' entry={{...you,you:true}} scoreOptions={scoreOptions} verifiedLabel={verifiedLabel}/></div>}
  {(entries.length>0||listTitle||scoreTitle)&&<div className='hig-leaderboard-list'>
   {(listTitle||scoreTitle)&&<div className='hig-leaderboard-columns hig-number'><span>{listTitle}</span><span>{scoreTitle}</span></div>}
   {entries.length>0&&<ol className='hig-leaderboard-rows'>{entries.map(entry=><Standing key={entry.id} entry={entry} scoreOptions={scoreOptions} verifiedLabel={verifiedLabel}/>)}</ol>}
  </div>}
  {footnote&&<p className='hig-leaderboard-footnote'>{footnote}</p>}
 </section>;
}
