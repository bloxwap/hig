import React from 'react';
import {View} from 'react-native';
import {formatNumber} from '@bloxwap/hig/contracts';
import * as en from '@bloxwap/hig/contracts/messages';
import type {HIGMessages} from '@bloxwap/hig/contracts/messages';
import {useColors,useHIG,useMessages} from './provider.js';
import {Text} from './surface.js';
import {Button,IconButton} from './button.js';
import {ChevronIcon} from './icons.js';
import {AnimatedNumberReadout} from './animated-number.js';
import {BarMark,type BarMarkElement} from './bar-mark.js';
export type {BarMarkElement} from './bar-mark.js';
/** The actions HIG names itself. */
export type TokenActionId='send'|'receive'|'stake'|'unstake';
export interface TokenAction {
 /** 'send' | 'receive' | 'stake' | 'unstake' take a built-in label; any other id needs `label`. */
 id:TokenActionId|(string&{});
 label?:string;onSelect:()=>void;disabled?:boolean;
 /** Defaults to `secondary`: the actions are equal choices. */
 intent?:'primary'|'secondary'|'destructive';
}
export interface TokenActionCardProps {
 /** Heading, usually the ticker: HYPE. */
 symbol:string;
 /** Title of the assets bar: Hyperliquid. */
 name:string;
 /** Total holding in dollars, on the trailing edge of the assets bar. Defaults to the sum of the asset values; null reads as unknown. */
 value?:number|null;
 /** Where the token is held: Staked, Core, Paper. */
 assets:readonly BarMarkElement[];
 /** The chains the token sits on. */
 chains:readonly BarMarkElement[];
 /** Title of the chains bar. Defaults to the built-in "Chains". */
 chainsTitle?:string;
 actions:readonly TokenAction[];
 /** Shows Back on the leading edge of the header. */
 onBack?:()=>void;
 /** A control on the trailing edge of the header, usually an IconButton. */
 headerAction?:React.ReactNode;
 testID?:string;
}
const usd:Intl.NumberFormatOptions={style:'currency',currency:'USD'};
const held=(value:number)=>Number.isFinite(value)&&value>0;
/** An action's text: its own `label`, else the built-in name of its id, else the id. */
export const tokenActionLabel=(action:TokenAction,messages:Partial<HIGMessages>):string=>action.label??(action.id==='send'?messages.swapActionSend??en.swapActionSend:action.id==='receive'?messages.receive??en.receive:action.id==='stake'?messages.stake??en.stake:action.id==='unstake'?messages.unstake??en.unstake:action.id);
/** One token as a screen: a header, where it is held, which chains it sits on, then what the user can do with it. */
export function TokenActionCard({symbol,name,value,assets,chains,chainsTitle,actions,onBack,headerAction,testID}:TokenActionCardProps){
 const colors=useColors(),t=useMessages(),{direction,locale}=useHIG();
 const total=value!==undefined?value:assets.reduce((sum,asset)=>sum+(held(asset.value)?asset.value:0),0);
 return <View testID={testID} style={{padding:16}}>
  <View testID='token-header' style={{flexDirection:'row',alignItems:'center',minHeight:44}}>
   <View style={{minWidth:44,alignItems:'flex-start'}}>{onBack?<IconButton intent='ghost' label={t.back} suppressFeedback testID='token-back' onPress={onBack}><View style={{transform:[{rotate:direction==='rtl'?'-90deg':'90deg'}]}}><ChevronIcon color={colors.text}/></View></IconButton>:null}</View>
   <Text testID='token-title' accessibilityRole='header' numberOfLines={1} style={{flex:1,textAlign:'center',fontSize:17,lineHeight:24,fontWeight:'600',color:colors.text}}>{symbol}</Text>
   <View style={{minWidth:44,alignItems:'flex-end'}}>{headerAction}</View>
  </View>
  <View style={{gap:8,marginTop:16}}>
   <BarMark testID='token-assets' title={name} elements={assets} description={<AnimatedNumberReadout value={total} options={usd} tone='muted' testID='token-value' style={{fontSize:14,lineHeight:21}}/>}/>
   <BarMark testID='token-chains' title={chainsTitle??t.swapChains} elements={chains} description={formatNumber(chains.filter(chain=>held(chain.value)).length,locale)}/>
  </View>
  {actions.length>0?<View testID='token-actions' style={{gap:8,marginTop:16}}>
   {actions.map(action=><Button key={action.id} testID={`token-action-${action.id}`} fullWidth intent={action.intent??'secondary'} disabled={action.disabled} onPress={action.onSelect}>{tokenActionLabel(action,t)}</Button>)}
  </View>:null}
 </View>;
}
