"use client";
import React from 'react';
import {formatNumber} from '@bloxwap/hig/contracts';
import {PressDecoration,usePresentNumber,useNumberLocale} from '../provider.js';
import {figureProps,type Figure} from '../figure.js';
import {SegmentedControl} from '../selection.js';
import {Button} from '../button.js';
import {AnimatedNumberReadout} from '../animated-number.js';
import type {AssetArtwork} from '../asset-balance-row.js';
import {ScreenHeader} from './screen-header.js';
import {SwapIcon,SwapNumber} from './swap/shared.js';
/** A way onward from the promotion. `href` draws a real link (an `<a>`), with `target` such as `_blank`; `onSelect` is still called on the press. */
export type RewardLink={label:string;onSelect:()=>void;href?:undefined;target?:undefined}|{label:string;href:string;target?:string;onSelect?:()=>void};
/** The promotion above the standings: a prize pool filling towards a goal, or a draw with a top prize. Every word is host text. */
export interface RewardPromo {
 /** The small capitals line: Season 01. */
 eyebrow:string;
 /** A text link with a chevron on the trailing edge of the eyebrow: Rules. */
 rules?:RewardLink;
 /** The headline figure: the pool so far, or the top prize. `null` reads as unknown. */
 amount:number|null;
 /** Format of `amount` and `goal`. Defaults to whole US dollars. */
 amountOptions?:Intl.NumberFormatOptions;
 /** The amount the pool is filling towards. Draws the progress bar under the caption. */
 goal?:number;
 /** The line under the figure. A function receives the formatted goal: `goal => 'of ' + goal + ' prize pool'`. A string is drawn as given: top prize. */
 caption?:string|((goal:string)=>string);
 /** The lead of the explaining sentence, in the text colour: Top 100 traders split the pool. Host text, or host elements for an accented word. */
 headline?:React.ReactNode;
 /** Continues the sentence after the headline in the muted colour: Funded by builder fees on every trade. */
 description?:string;
 /** A quiet row under a hairline at the foot of the card, with a chevron on its trailing edge: Draws and winners. The host opens its own destination. */
 action?:RewardLink;
}
/** A host figure that updates place by place: `{value:1090779, options:{style:'currency',currency:'USD',maximumFractionDigits:0}, suffix:' vol'}`. */
export type RewardFigure=Figure;
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
/** One step of the paging control under the list. */
export interface RewardPageStep {label:string;onSelect:()=>void;disabled?:boolean}
export interface RewardBlockProps extends Omit<React.HTMLAttributes<HTMLElement>,'title'> {
 /** Heading: Leaderboard. */
 title:string;
 promo?:RewardPromo;
 /** A choice between standings, such as Upcoming draw and Top winners. `label` names the control and is not drawn. */
 tabs?:{label:string;options:readonly {value:string;label:string}[];value:string;onValueChange:(value:string)=>void};
 /** The viewer's own standing, pinned above the list on a tinted row. */
 you?:RewardEntry;
 /** Names the pinned row for assistive technology: Your rank. */
 youLabel?:string;
 /** A muted line between the pinned row and the list, announced when it changes: You're not ranked yet. */
 status?:string;
 /** The column heading over the names: Top 25 by volume. */
 listTitle?:string;
 /** The column heading over the scores: Entries. */
 scoreTitle?:string;
 entries:readonly RewardEntry[];
 /** Format of every score. Defaults to a whole number. An entry's own `scoreOptions` wins. */
 scoreOptions?:Intl.NumberFormatOptions;
 /** Accessible name of the verified mark. The mark is decorative without it. */
 verifiedLabel?:string;
 /** Host artwork in place of the built-in verified mark, drawn inside the mark's image role. */
 verifiedMark?:React.ReactNode;
 /** The `verifiedMark` is a control, such as a badge with a popover: it stays in the accessibility tree outside the image role, and `verifiedLabel` is read before it. */
 verifiedMarkInteractive?:boolean;
 /** Draws skeleton rows in place of the entries while the host loads them. */
 loading?:boolean;
 /** Host text that names the skeleton rows for assistive technology and announces them: Loading standings. Without it the block is only marked busy. */
 loadingLabel?:string;
 /** Paging under the list: Previous and Next as buttons with the host's range between them, such as 1–25. */
 pagination?:{previous?:RewardPageStep;next?:RewardPageStep;label?:string};
 /** A line under the list: Entries are provisional until audited. */
 footnote?:string;
 onBack?:()=>void;
 /** A control on the trailing edge of the header, usually an `IconButton` that shares. */
 headerAction?:React.ReactNode;
 /** Keeps the header pinned to the top of the scrolling container. It is transparent at rest and fills with `--hig-sticky-header-background` (`--hig-background` by default) once the standings scroll under it; inside a sheet remap it, for example `--hig-sticky-header-background: var(--hig-overlay)`. */
 stickyHeader?:boolean;
 /** Set false to leave the header out, when the host pins its own `ScreenHeader` above the block. */
 header?:boolean;
}
const wholeDollars={style:'currency',currency:'USD',maximumFractionDigits:0} as const,whole={maximumFractionDigits:0} as const;
const skeletons=[0,1,2,3,4];
/** The share of the goal reached, from 0 to 1. Unknown amounts and goals that are not above zero give `null`. */
export function rewardProgress(amount:number|null|undefined,goal:number|null|undefined):number|null{
 return amount==null||goal==null||!Number.isFinite(amount)||!Number.isFinite(goal)||!(goal>0)?null:Math.min(1,Math.max(0,amount/goal));
}
const verifiedGlyph=<svg className='hig-reward-verified-mark' aria-hidden='true' focusable='false' viewBox='0 0 20 20' width='16' height='16' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round'><circle cx='10' cy='10' r='7.5'/><path d='m6.75 10.25 2.25 2.25 4.25-4.75'/></svg>;
function Standing({entry,scoreOptions,verifiedLabel,verifiedMark,verifiedMarkInteractive,as:Tag='li'}:{entry:RewardEntry;scoreOptions:Intl.NumberFormatOptions;verifiedLabel?:string;verifiedMark?:React.ReactNode;verifiedMarkInteractive?:boolean;as?:'li'|'div'}){
 const detail=entry.detail;
 return <Tag className='hig-reward-row' data-you={entry.you||undefined}>
  <span className='hig-reward-rank hig-number'>{entry.rank}</span>
  <span className='hig-reward-avatar' aria-hidden='true'>{typeof entry.avatar==='string'?<img src={entry.avatar} alt=''/>:entry.avatar??entry.name.slice(0,2)}</span>
  <span className='hig-reward-identity'>
   <strong className='hig-number'>{entry.name}{entry.verified&&(verifiedMark!=null&&verifiedMarkInteractive?<span className='hig-reward-verified'>{verifiedLabel&&<span className='hig-sr-only'>{verifiedLabel}</span>}{verifiedMark}</span>:<span className='hig-reward-verified' role={verifiedLabel?'img':undefined} aria-label={verifiedLabel}>{verifiedMark??verifiedGlyph}</span>)}</strong>
   {detail!=null&&detail!==''&&<span className='hig-number'>{typeof detail==='string'?detail:<SwapNumber {...figureProps(detail)}/>}</span>}
  </span>
  <span className='hig-reward-score'><AnimatedNumberReadout value={entry.score} options={entry.scoreOptions??scoreOptions}/></span>
 </Tag>;
}
function Onward({link,className,children}:{link:RewardLink;className:string;children:React.ReactNode}){
 return link.href!==undefined?<a className={className} href={link.href} target={link.target} rel={link.target==='_blank'?'noopener noreferrer':undefined} onClick={link.onSelect}>{children}<PressDecoration kind='row'/></a>
  :<button type='button' className={className} onClick={link.onSelect}>{children}<PressDecoration kind='row'/></button>;
}
/** A competition as a screen: an optional promotion (a prize pool filling towards its goal, or a draw with its top prize), an optional choice of standings, the viewer's own standing pinned on a tinted row, and the ranked list. */
export function RewardBlock({title,promo,tabs,you,youLabel,status,listTitle,scoreTitle,entries,scoreOptions=whole,verifiedLabel,verifiedMark,verifiedMarkInteractive,loading,loadingLabel,pagination,footnote,onBack,headerAction,stickyHeader,header=true,className,...rest}:RewardBlockProps){
 const locale=useNumberLocale();const present=usePresentNumber();
 const money=promo?.amountOptions??wholeDollars,share=promo?rewardProgress(promo.amount,promo.goal):null;
 const caption=typeof promo?.caption==='function'?promo.goal!==undefined?promo.caption(formatNumber(promo.goal,locale,present(money))):undefined:promo?.caption;
 const pinned=you&&<Standing as='div' entry={{...you,you:true}} scoreOptions={scoreOptions} verifiedLabel={verifiedLabel} verifiedMark={verifiedMark} verifiedMarkInteractive={verifiedMarkInteractive}/>;
 return <section {...rest} className={`hig-reward-block${className?` ${className}`:''}`}>
  {header&&<ScreenHeader title={title} onBack={onBack} action={headerAction} stickyHeader={stickyHeader}/>}
  {promo&&<section className='hig-surface hig-reward-promo'>
   <div className='hig-reward-promo-top'><span className='hig-reward-eyebrow hig-number'>{promo.eyebrow}</span>{promo.rules&&<Onward link={promo.rules} className='hig-reward-rules'>{promo.rules.label}<SwapIcon name='chevron' size={16}/></Onward>}</div>
   <p className='hig-reward-amount'><AnimatedNumberReadout value={promo.amount} options={money}/></p>
   {caption&&<p className='hig-reward-caption hig-number'>{caption}</p>}
   {promo.goal!==undefined&&<div className='hig-reward-track' aria-hidden='true'><span style={{width:`${(share??0)*100}%`}}/></div>}
   {(promo.headline||promo.description)&&<p className='hig-reward-summary'>{promo.headline&&<strong>{promo.headline}</strong>}{promo.headline&&promo.description?' ':null}{promo.description}</p>}
   {promo.action&&<Onward link={promo.action} className='hig-reward-action'><span>{promo.action.label}</span><SwapIcon name='chevron' size={16}/></Onward>}
  </section>}
  {tabs&&<SegmentedControl label={tabs.label} options={tabs.options} value={tabs.value} onValueChange={tabs.onValueChange}/>}
  {pinned&&(youLabel?<div className='hig-reward-you' role='group' aria-label={youLabel}>{pinned}</div>:<div className='hig-reward-you'>{pinned}</div>)}
  {status&&<p className='hig-reward-status' role='status'>{status}</p>}
  {loading?<>
   {loadingLabel&&<p className='hig-sr-only' role='status'>{loadingLabel}</p>}
   <div className='hig-reward-list' aria-busy='true'>{skeletons.map(index=><div key={index} className='hig-skeleton hig-reward-skeleton' aria-hidden='true'/>)}</div>
  </>:(entries.length>0||listTitle||scoreTitle)&&<div className='hig-reward-list'>
   {(listTitle||scoreTitle)&&<div className='hig-reward-columns hig-number'><span>{listTitle}</span><span>{scoreTitle}</span></div>}
   {entries.length>0&&<ol className='hig-reward-rows'>{entries.map(entry=><Standing key={entry.id} entry={entry} scoreOptions={scoreOptions} verifiedLabel={verifiedLabel} verifiedMark={verifiedMark} verifiedMarkInteractive={verifiedMarkInteractive}/>)}</ol>}
  </div>}
  {pagination&&<div className='hig-reward-pagination'>
   {pagination.previous?<Button intent='secondary' disabled={pagination.previous.disabled} onClick={pagination.previous.onSelect}>{pagination.previous.label}</Button>:<span/>}
   {pagination.label?<span className='hig-reward-page hig-number' aria-live='polite'>{pagination.label}</span>:<span/>}
   {pagination.next?<Button intent='secondary' disabled={pagination.next.disabled} onClick={pagination.next.onSelect}>{pagination.next.label}</Button>:<span/>}
  </div>}
  {footnote&&<p className='hig-reward-footnote'>{footnote}</p>}
 </section>;
}
