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
 const title=mode==='presentation'
  ?<View style={disabled?{opacity:0.5,flexShrink:1}:{flexShrink:1}}>{identity??lines??<Text>{label}</Text>}</View>
  :lines?<Button intent='ghost' contentMode='custom' accessibilityLabel={detailText?`${label}, ${detailText}`:label} accessibilityState={selected?{selected:true}:undefined} disabled={disabled} onPress={onSelect} onPressIn={onPressIn} testID={testID?`${testID}-select`:undefined} style={{alignItems:'flex-start',flexShrink:1,minWidth:0,paddingVertical:0}}>{lines}</Button>
  :<Button intent='ghost' contentMode='custom' accessibilityLabel={label} accessibilityState={selected?{selected:true}:undefined} disabled={disabled} onPress={onSelect} onPressIn={onPressIn} testID={testID?`${testID}-select`:undefined} style={{alignItems:'flex-start',flexShrink:1,minWidth:0}}><Text numberOfLines={1} style={{fontSize:16,fontWeight:'600',color:disabled?colors.faint:colors.muted}}>{label}</Text></Button>;
 const leading=favorite!==undefined||icon!==undefined;
 const identityCell=leading?<View style={{flexDirection:'row',alignItems:'center',gap:8,flex:1,flexShrink:1,minWidth:0}}>{favorite!==undefined?favorite:null}{icon!==undefined?<View {...hidden}>{icon}</View>:null}{title}</View>:<View style={{flex:1,flexShrink:1,minWidth:0,alignItems:'flex-start'}}>{title}</View>;
 // The figures and trailing content keep their width; only the identity shrinks.
 const dim=disabled?{opacity:0.5,flexShrink:0}:{flexShrink:0};
 const cells=<>
  {identityCell}
  {price!==undefined?<View style={dim}><Usd value={price} options={priceOptions}/></View>:null}
  {change!==undefined?<View style={dim}><Percent value={change} options={changeOptions}/></View>:null}
  {volume!==undefined?<View style={dim}>{volume}</View>:null}
  {trailing!=null&&trailing!==false?<View testID={testID?`${testID}-trailing`:undefined} style={[{flexDirection:'row',alignItems:'center',gap:8},dim]}>{trailing}</View>:null}
  {selected?<View {...hidden} testID={testID?`${testID}-check`:undefined} style={{width:20,height:20,alignItems:'center',justifyContent:'center'}}><View style={{width:6,height:12,borderRightWidth:2,borderBottomWidth:2,borderColor:colors.text,transform:[{translateY:-1},{rotate:'45deg'}]}}/></View>:null}
 </>;
 const plain=!ref&&!leading&&detail===undefined&&price!==undefined&&change!==undefined&&volume===undefined&&trailing==null&&!selected&&!disabled&&!active&&!onPressIn&&mode==='action'&&!testID&&!style;
 // Without host options the row is exactly the 0.6.0 one: the name button, the price and the change in a wrapping Row.
 if(plain)return <Row><Button intent='ghost' onPress={onSelect}>{name} ({symbol})</Button><Usd value={price} options={priceOptions}/><Percent value={change} options={changeOptions}/></Row>;
 const state=mode==='presentation'&&(selected||disabled)?{...(selected?{selected:true}:{}),...(disabled?{disabled:true}:{})}:undefined;
 return <View ref={ref} testID={testID} accessibilityState={state} style={[{flexDirection:'row',alignItems:'center',justifyContent:'space-between',flexWrap:'nowrap',gap:12,paddingVertical:8},active?{backgroundColor:fills.well,borderRadius:14}:null,style]}>{cells}</View>;
});
