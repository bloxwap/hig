import {SeverityIcon} from './icons.js';
import React from 'react';
import {View,type ScrollViewProps} from 'react-native';
import {StickyHeaderLayout} from './sticky-header.js';
import {formatNumber} from './number-format.js';
import {withAlpha} from '@bloxwap/hig/tokens';
import * as en from '@bloxwap/hig/contracts/messages';
import type {HIGMessages} from '@bloxwap/hig/contracts/messages';
import {useColors,useHIG,useMessages,useNumberLocale} from './provider.js';
import {Text} from './surface.js';
import {Button,IconButton} from './button.js';
import {ChevronIcon} from './icons.js';
import {AnimatedNumberReadout} from './animated-number.js';
import {figureProps} from './figure.js';
import {BarMark,BarMarkFigureContext,type BarMarkElement,type BarMarkFigureRenderer} from './bar-mark.js';
export type {BarMarkElement,BarMarkFigure} from './bar-mark.js';
/** The actions HIG names itself. */
export type TokenActionId='send'|'receive'|'stake'|'unstake';
export interface TokenAction {
 /** 'send' | 'receive' | 'stake' | 'unstake' take a built-in label; any other id needs `label`. */
 id:TokenActionId|(string&{});
 label?:string;onSelect:()=>void;disabled?:boolean;
 /** Defaults to `secondary`: the actions are equal choices. */
 intent?:'primary'|'secondary'|'destructive';
}
export interface TokenActionBlockProps {
 /** Heading, usually the ticker: HYPE. */
 symbol:string;
 /** Title of the assets bar: Hyperliquid. Needed only with `assets`; the symbol stands in without it. */
 name?:string;
 /** Total holding in dollars, on the trailing edge of the assets bar. Defaults to the sum of the asset values; null reads as unknown. */
 value?:number|null;
 /** The holding in token units, for a token with no dollar value: with `value` left out or null it is drawn in place of the dollar total. */
 units?:number|null;
 /** Host text after the units, such as ` BLOX`. */
 unitsSuffix?:string;
 /** Format of the units; default `{maximumFractionDigits:6}`. */
 unitsOptions?:Intl.NumberFormatOptions;
 /** Where the token is held: Staked, Core, Paper. Leave it out to draw no assets bar. */
 assets?:readonly BarMarkElement[];
 /** The chains the token sits on. Leave it out to draw no chains bar. */
 chains?:readonly BarMarkElement[];
 /** Title of the chains bar. Defaults to the built-in "Chains". */
 chainsTitle?:string;
 actions:readonly TokenAction[];
 /** Shows Back on the leading edge of the header. */
 onBack?:()=>void;
 /** A control on the trailing edge of the header, usually an IconButton. */
 headerAction?:React.ReactNode;
 /** A line above the actions, for example why some are missing. `noteTone` tints it as in SwapBlock. */
 note?:React.ReactNode;noteTone?:'muted'|'warning'|'negative';
 /** Keeps the header pinned while the rest scrolls: the block becomes its own scroll view with the header as its sticky first child, transparent at rest and filled once content scrolls under it. Place it in a bounded container, such as a sheet body. */
 stickyHeader?:boolean;
 /** With `stickyHeader`: the header's fill once content is under it. Defaults to the background role; in a sheet pass the sheet's fill. */
 stickyHeaderBackground?:string;
 /** The scroll view used with `stickyHeader`, such as a sheet library's own. Defaults to React Native's ScrollView. */
 scrollComponent?:React.ComponentType<ScrollViewProps>;
 /** `nativeID` of the title, so a sheet around the block can name itself with `accessibilityLabelledBy` (Android). */
 headingId?:string;
 testID?:string;
}
const usd:Intl.NumberFormatOptions={style:'currency',currency:'USD'};
const unitsFormat:Intl.NumberFormatOptions={maximumFractionDigits:6};
const held=(value:number)=>Number.isFinite(value)&&value>0;
/** An action's text: its own `label`, else the built-in name of its id, else the id. */
export const tokenActionLabel=(action:TokenAction,messages:Partial<HIGMessages>):string=>action.label??(action.id==='send'?messages.swapActionSend??en.swapActionSend:action.id==='receive'?messages.receive??en.receive:action.id==='stake'?messages.stake??en.stake:action.id==='unstake'?messages.unstake??en.unstake:action.id);
/** One token as a screen: a header, where it is held, which chains it sits on, then what the user can do with it. */
/** Legend figures inside the block move place by place, like its total. */
const animatedFigure:BarMarkFigureRenderer=(figure,{testID})=><AnimatedNumberReadout {...figureProps(figure)} tone='faint' testID={testID} style={{fontSize:14,lineHeight:21}}/>;
export function TokenActionBlock({symbol,name,value,units,unitsSuffix,unitsOptions=unitsFormat,assets,chains,chainsTitle,actions,onBack,headerAction,note,noteTone='muted',stickyHeader,stickyHeaderBackground,scrollComponent,headingId,testID}:TokenActionBlockProps){
 const colors=useColors(),t=useMessages(),{direction}=useHIG(),locale=useNumberLocale();
 const total=value!==undefined?value:(assets??[]).reduce((sum,asset)=>sum+(held(asset.value)?asset.value:0),0);
 // With no dollar value the units are the headline, as an AccountBlock row headlines them.
 const showChains=chains!==undefined&&chains.length>1;
 const headline=units!==undefined&&value==null?<AnimatedNumberReadout key='units' value={units} options={unitsOptions} suffix={unitsSuffix} tone='muted' testID='token-units' style={{fontSize:14,lineHeight:21}}/>:<AnimatedNumberReadout key='value' value={total} options={usd} tone='muted' testID='token-value' style={{fontSize:14,lineHeight:21}}/>;
 const tone=noteTone==='warning'?colors.warning:noteTone==='negative'?colors.negative:null;
 const header=<View testID='token-header' style={{flexDirection:'row',alignItems:'center',minHeight:44}}>
  <View style={{minWidth:44,alignItems:'flex-start'}}>{onBack?<IconButton intent='ghost' label={t.back} suppressFeedback testID='token-back' onPress={onBack}><View style={{transform:[{rotate:direction==='rtl'?'-90deg':'90deg'}]}}><ChevronIcon color={colors.text}/></View></IconButton>:null}</View>
  <Text testID='token-title' nativeID={headingId} accessibilityRole='header' numberOfLines={1} style={{flex:1,textAlign:'center',fontSize:17,lineHeight:24,fontWeight:'600',color:colors.text}}>{symbol}</Text>
  <View style={{minWidth:44,alignItems:'flex-end'}}>{headerAction}</View>
 </View>;
 const body=<>
  {assets||showChains?<BarMarkFigureContext.Provider value={animatedFigure}><View testID='token-bars' style={{gap:20,marginTop:16,paddingHorizontal:4}}>
   {assets?<BarMark testID='token-assets' surface={false} title={name??symbol} elements={assets} description={headline}/>:null}
   {showChains?<BarMark testID='token-chains' surface={false} title={chainsTitle??t.swapChains} elements={chains} description={formatNumber(chains.filter(chain=>held(chain.value)).length,locale)}/>:null}
  </View></BarMarkFigureContext.Provider>:null}
  {note!=null&&note!==false?<View testID='token-note' style={[{marginTop:16},tone?{flexDirection:'row',alignItems:'flex-start',gap:8,paddingVertical:12,paddingHorizontal:16,borderRadius:16,backgroundColor:withAlpha(tone,0.1)}:{paddingHorizontal:4}]}>{tone&&<View accessibilityElementsHidden importantForAccessibility='no-hide-descendants'><SeverityIcon kind={noteTone==='warning'?'warning':'error'} color={tone}/></View>}<Text style={{flexShrink:1,fontSize:14,lineHeight:21,color:tone?colors.text:colors.muted}}>{note}</Text></View>:null}
  {actions.length>0?<View testID='token-actions' style={{gap:8,marginTop:note!=null&&note!==false?8:16}}>
   {actions.map(action=><Button key={action.id} testID={`token-action-${action.id}`} fullWidth intent={action.intent??'secondary'} disabled={action.disabled} onPress={action.onSelect}>{tokenActionLabel(action,t)}</Button>)}
  </View>:null}
 </>;
 if(stickyHeader)return <StickyHeaderLayout testID={testID} headerTestID='token-sticky-header' header={header} background={stickyHeaderBackground} scrollComponent={scrollComponent}>{body}</StickyHeaderLayout>;
 return <View testID={testID} style={{padding:16}}>
  {header}
  {body}
 </View>;
}
