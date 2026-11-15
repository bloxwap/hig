import React from 'react';
import {Pressable,View} from 'react-native';
import {useHIG} from './provider.js';
import {AnimatedNumberReadout} from './animated-number.js';
import {formatNumberReadout} from './animated-number-model.js';
import {BarPnl} from './bar-pnl.js';
/** The trading words of the card. HIG's built-in strings hold no trading terms, so the host supplies them, translated. */
export interface TradeHistoryLabels {entry:string;exit:string;long:string;short:string}
export interface TradeHistoryCardProps {
 labels:TradeHistoryLabels;
 /** Ticker: AMZN. */
 symbol:string;
 side:'long'|'short';
 /** 20 reads `20×`. */
 leverage?:number;
 entry:number;exit:number;
 /** Net profit and loss in dollars, on the trailing edge of the title row. */
 pnl?:number|null;
 /** Format of the two prices. Defaults to US dollars. */
 priceOptions?:Intl.NumberFormatOptions;
 /** Set false to draw no card. Default `true`. */
 surface?:boolean;
 /** Makes the whole card a button, for example to open the detail. */
 onSelect?:()=>void;
 testID?:string;
}
const pnlUsd:Intl.NumberFormatOptions={style:'currency',currency:'USD',signDisplay:'exceptZero',maximumFractionDigits:4};
const gearing:Intl.NumberFormatOptions={maximumFractionDigits:6};
const times='×',dot=' · ';
const hidden={accessible:false,accessibilityElementsHidden:true,importantForAccessibility:'no-hide-descendants' as const};
const known=(value:number|null|undefined):value is number=>value!=null&&Number.isFinite(value);
/** The card's heading: `AMZN · Short 20×`, or `AMZN · Short` without leverage. The side word is the host's. */
export const tradeHistoryTitle=({symbol,side,leverage,labels}:{symbol:string;side:'long'|'short';leverage?:number;labels:Pick<TradeHistoryLabels,'long'|'short'>},locale:string='en-US'):string=>symbol+dot+(side==='long'?labels.long:labels.short)+(known(leverage)?' '+formatNumberReadout(leverage,locale,gearing).text+times:'');
/** One closed trade: the asset, side and leverage, the net profit and loss, and one bar from entry to exit, tinted for a gain or a loss, over the two prices. */
export function TradeHistoryCard({labels,symbol,side,leverage,entry,exit,pnl,priceOptions,surface=true,onSelect,testID}:TradeHistoryCardProps){
 const {locale}=useHIG();const title=tradeHistoryTitle({symbol,side,leverage,labels},locale);
 const result=pnl===undefined?undefined:<AnimatedNumberReadout testID={testID?`${testID}-pnl`:undefined} value={pnl} options={pnlUsd} tone={known(pnl)&&pnl>0?'up':known(pnl)&&pnl<0?'down':'muted'} style={{fontSize:14,lineHeight:21}}/>;
 const bar=<BarPnl testID={testID} surface={surface} fit side={side} entry={entry} mark={exit} labels={{entry:labels.entry,mark:labels.exit,liquidation:''}} priceOptions={priceOptions} title={title} description={result}/>;
 if(!onSelect)return bar;
 const label=[title,known(pnl)?formatNumberReadout(pnl,locale,pnlUsd).text:null].filter(Boolean).join(', ');
 return <Pressable testID={testID?`${testID}-button`:undefined} accessibilityRole='button' accessibilityLabel={label} onPress={onSelect} style={({pressed})=>({opacity:pressed?0.7:1})}><View {...hidden} pointerEvents='none'>{bar}</View></Pressable>;
}
