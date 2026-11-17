import { Check } from '@bloxwap/icons/native/check';
import React,{forwardRef} from 'react';
import {View,type GestureResponderEvent,type StyleProp,type ViewStyle} from 'react-native';
import {useColors,useFills} from './provider.js';
import {Button} from './button.js';
import {Text} from './surface.js';
import {Row,Usd,Percent} from './data.js';
import {plainText} from './text-content.js';
interface MarketRowContent {
 symbol:string;name:string;
 /** Leave out to draw no price (no dash); `null` reads as unknown. */
 price?:number|null;
 /** Leave out to draw no change (no dash); `null` reads as unknown. */
 change?:number|null;
 /** Intl display options for the price, including a decimal style when the host omits a currency symbol. */
 priceOptions?:Intl.NumberFormatOptions;
 /** Percent-point display precision and sign, forwarded to `Percent`. */
 changeOptions?:Intl.NumberFormatOptions;
 /** Host artwork before the name, such as the market icon. Decorative. */
 icon?:React.ReactNode;
 /** Host favourite indicator or control before the icon. */
 favorite?:React.ReactNode;
 /** Host-formatted volume after the change. */
 volume?:React.ReactNode;
 /** A muted second line under the name, such as the maximum leverage. Text, or host nodes (text nodes are drawn muted; an element is drawn as given). In action mode its text is read with the name. */
 detail?:React.ReactNode;
 /** Host content on the trailing edge, after the figures, such as a held position's result. */
 trailing?:React.ReactNode;
 /** The market in use: a check on the trailing edge and `accessibilityState.selected` on the name button (the row in presentation mode). */
 selected?:boolean;
 /** Dims the row; in action mode the name button is disabled. */
 disabled?:boolean;
 /** Highlights the row with the well fill, as for a host's keyboard cursor. */
 active?:boolean;
 /** Action mode: called when a press starts on the name button, before it is accepted, for example to prefetch the market. */
 onPressIn?:(event:GestureResponderEvent)=>void;
 testID?:string;style?:StyleProp<ViewStyle>;
}
export type MarketRowProps=MarketRowContent&({/** Default: HIG owns the name button and its accepted activation. */mode?:'action';onSelect:()=>void;identity?:never}|{/** The host owns selection, for example a row inside its own Pressable. HIG adds no button. */mode:'presentation';onSelect?:never;/** Host market identity in place of `name (symbol)`. */identity?:React.ReactNode});
const hidden={accessible:false,accessibilityElementsHidden:true,importantForAccessibility:'no-hide-descendants' as const};
/** A market as one row: its name (a button, or the host's identity in presentation mode), price and change. The ref reaches the row's root view. */
export const MarketRow:React.ForwardRefExoticComponent<MarketRowProps&React.RefAttributes<React.ComponentRef<typeof View>>>=/* @__PURE__ */forwardRef<React.ComponentRef<typeof View>,MarketRowProps>(function MarketRow({symbol,name,price,change,priceOptions,changeOptions,mode='action',onSelect,identity,icon,favorite,volume,detail,trailing,selected,disabled,active,onPressIn,testID,style},ref){
 const colors=useColors(),fills=useFills();
 const label=`${name} (${symbol})`;
 // A row with host options is one line: the name and its detail truncate rather than wrap, so the trailing cells keep their place.
 const lines=detail===undefined?null:<View style={{alignItems:'flex-start',flexShrink:1,minWidth:0}}><Text numberOfLines={1} style={{fontSize:16,lineHeight:24,fontWeight:'600',color:disabled?colors.muted:colors.text}}>{label}</Text>{typeof detail==='string'||typeof detail==='number'?<Text numberOfLines={1} style={{fontSize:14,lineHeight:20,color:colors.muted}}>{detail}</Text>:detail}</View>;
 const detailText=detail===undefined?'':plainText(detail);
 // When the row is too narrow for everything, space is given up in this order (as on web): the name truncates down to a floor (the
 // name cell's basis is 96dp and it never shrinks, so the icon never leaves the identity and the start of the name stays readable);
 // then whole figures drop from the end (volume, change, price); then the trailing content is clipped. The check keeps its place.
 const nameCell={flexGrow:1,flexShrink:0,flexBasis:96,minWidth:0};
 const title=mode==='presentation'
  ?<View style={disabled?{opacity:0.5,...nameCell}:nameCell}>{identity??lines??<Text numberOfLines={1}>{label}</Text>}</View>
  :lines?<Button intent='ghost' contentMode='custom' accessibilityLabel={detailText?`${label}, ${detailText}`:label} accessibilityState={selected?{selected:true}:undefined} disabled={disabled} onPress={onSelect} onPressIn={onPressIn} testID={testID?`${testID}-select`:undefined} style={{alignItems:'flex-start',...nameCell,paddingVertical:0}}>{lines}</Button>
  :<Button intent='ghost' contentMode='custom' accessibilityLabel={label} accessibilityState={selected?{selected:true}:undefined} disabled={disabled} onPress={onSelect} onPressIn={onPressIn} testID={testID?`${testID}-select`:undefined} style={{alignItems:'flex-start',...nameCell}}><Text numberOfLines={1} style={{fontSize:16,fontWeight:'600',color:disabled?colors.faint:colors.muted}}>{label}</Text></Button>;
 const leading=favorite!==undefined||icon!==undefined;
 // The identity's basis is its favourite + icon + the name cell's 96dp, and it does not shrink: that is the floor.
 const identityCell=<View style={{flexDirection:'row',alignItems:'center',gap:leading?8:0,flexGrow:1,flexShrink:0,flexBasis:'auto'}}>{favorite!==undefined?<View style={{flexShrink:0}}>{favorite}</View>:null}{icon!==undefined?<View {...hidden} style={{flexShrink:0}}>{icon}</View>:null}{title}</View>;
 const dim=disabled?{opacity:0.5}:null;
 // The figures are one 44dp line that wraps and clips, so a figure that does not fit moves to the hidden second line instead of being
 // cut; the zero-width first item lets even the price wrap away. Their large shrink factor makes them give up space before the trailing content.
 const figure=(node:React.ReactNode)=><View style={[{height:44,justifyContent:'center',marginStart:12,flexShrink:0},dim]}>{node}</View>;
 const figures=price===undefined&&change===undefined&&volume===undefined?null:<View testID={testID?`${testID}-figures`:undefined} style={{flexDirection:'row',flexWrap:'wrap',justifyContent:'flex-end',alignContent:'flex-start',height:44,overflow:'hidden',flexGrow:0,flexShrink:1000,minWidth:0,marginStart:-12}}>
  <View style={{width:0,height:44}}/>
  {price!==undefined?figure(<Usd value={price} options={priceOptions}/>):null}
  {change!==undefined?figure(<Percent value={change} options={changeOptions}/>):null}
  {volume!==undefined?figure(volume):null}
 </View>;
 const cells=<>
  {identityCell}
  {figures}
  {trailing!=null&&trailing!==false?<View testID={testID?`${testID}-trailing`:undefined} style={[{flexDirection:'row',alignItems:'center',gap:8,flexShrink:1,minWidth:0,overflow:'hidden'},dim]}>{trailing}</View>:null}
  {selected?<Check size={20} color={colors.text} testID={testID?`${testID}-check`:undefined}/>:null}
 </>;
 const plain=!ref&&!leading&&detail===undefined&&price!==undefined&&change!==undefined&&volume===undefined&&trailing==null&&!selected&&!disabled&&!active&&!onPressIn&&mode==='action'&&!testID&&!style;
 // Without host options the row is exactly the 0.6.0 one: the name button, the price and the change in a wrapping Row.
 if(plain)return <Row><Button intent='ghost' onPress={onSelect}>{name} ({symbol})</Button><Usd value={price} options={priceOptions}/><Percent value={change} options={changeOptions}/></Row>;
 const state=mode==='presentation'&&(selected||disabled)?{...(selected?{selected:true}:{}),...(disabled?{disabled:true}:{})}:undefined;
 return <View ref={ref} testID={testID} accessibilityState={state} style={[{flexDirection:'row',alignItems:'center',justifyContent:'space-between',flexWrap:'nowrap',gap:12,paddingVertical:8},active?{backgroundColor:fills.well,borderRadius:14}:null,style]}>{cells}</View>;
});
