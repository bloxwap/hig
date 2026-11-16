import React,{forwardRef,useState} from 'react';
import {ActivityIndicator,Platform,Pressable,View,type PressableProps,type ViewProps,type ViewStyle} from 'react-native';
import * as en from '@bloxwap/hig/contracts/messages';
import {useColors,useFills,useHIG} from './provider.js';
import {Text} from './surface.js';
import {ChevronIcon} from './icons.js';
import {SwitchRow} from './switch-row.js';
import {plainText} from './text-content.js';
/** A text action on the trailing edge of a `ListGroup` heading, such as “Cancel all”. */
export interface ListGroupAction {
 /** Host text drawn as the action and naming it. */
 label:string;
 onSelect:()=>void;
 disabled?:boolean;
}
export interface ListGroupProps {
 /** Heading above the group, such as “Settings”: host text or an element such as a live count. Omit it for an untitled group. */
 title?:React.ReactNode;
 /** Host content after the title, such as a count or a figure; a string is drawn muted. */
 titleAccessory?:React.ReactNode;
 /** A text action on the trailing edge of the heading. */
 action?:ListGroupAction;
 /** Host content between the heading and the rows, such as a note or a field. A group with `intro` and no rows draws no row container. */
 intro?:React.ReactNode;
 /** `ListRow` elements. */
 children?:React.ReactNode;
 testID?:string;
}
const shown=(node:React.ReactNode)=>node!=null&&node!==false&&node!=='';
const actionSlop={top:12,bottom:12,left:8,right:8};
/** A grouped list for menus and settings: an optional heading over rows that share one rounded container. */
export function ListGroup({title,titleAccessory,action,intro,children,testID}:ListGroupProps){
 const colors=useColors(),{direction}=useHIG();
 const titled=shown(title),accessory=shown(titleAccessory);
 const titleStyle={color:colors.muted,fontSize:14,lineHeight:20,fontWeight:'500' as const};
 const titleTestID=testID?`${testID}-title`:undefined;
 // A string title keeps its 0.6.0 anatomy; an element title is one header node.
 const name=!titled?null:typeof title==='string'||typeof title==='number'
  ?<Text accessibilityRole='header' testID={titleTestID} style={accessory||action?{flexShrink:1,...titleStyle}:{paddingHorizontal:4,...titleStyle}}>{title}</Text>
  :<View accessible accessibilityRole='header' testID={titleTestID} style={accessory||action?{flexShrink:1}:{paddingHorizontal:4}}>{title}</View>;
 const header=!accessory&&!action?name:<View testID={testID?`${testID}-header`:undefined} style={{direction,flexDirection:'row',alignItems:'center',gap:8,paddingHorizontal:4,minWidth:0}}>
  {name}
  {accessory?<View testID={testID?`${testID}-title-accessory`:undefined} style={{flexShrink:1}}>{typeof titleAccessory==='string'||typeof titleAccessory==='number'?<Text style={titleStyle}>{titleAccessory}</Text>:titleAccessory}</View>:null}
  {action?<Pressable testID={testID?`${testID}-action`:undefined} accessibilityRole='button' accessibilityLabel={action.label} accessibilityState={{disabled:!!action.disabled}} disabled={action.disabled} hitSlop={actionSlop} onPress={action.onSelect} style={({pressed})=>({marginStart:'auto',paddingVertical:4,paddingHorizontal:4,opacity:action.disabled?0.5:pressed?0.6:1})}>
   <Text accessible={false} style={{fontSize:14,lineHeight:20,fontWeight:'600',color:colors.text}}>{action.label}</Text>
  </Pressable>:null}
 </View>;
 const empty=React.Children.count(children)===0;
 return <View testID={testID} style={{direction,gap:8,minWidth:0}}>
  {header}
  {shown(intro)?<View testID={testID?`${testID}-intro`:undefined} style={{paddingHorizontal:4,minWidth:0}}>{intro}</View>:null}
  {shown(intro)&&empty?null:<View testID={testID?`${testID}-rows`:undefined} style={{gap:2,borderRadius:20,overflow:'hidden'}}>{children}</View>}
 </View>;
}
export interface ListRowProps extends Omit<PressableProps,'children'|'style'|'onPress'|'disabled'|'role'|'accessibilityRole'|'accessibilityLabel'|'accessibilityState'|'aria-label'|'aria-checked'|'aria-disabled'|'aria-busy'|'aria-selected'> {
 label:string;
 /** A muted second line under the label, such as a subtitle or an address. The row grows to fit it, and it is read with the label (as the hint of a switch row). */
 description?:React.ReactNode;
 /** Colours the label: `destructive` for an action that deletes or ends something, `muted` for one that is done or inactive. */
 tone?:'destructive'|'muted';
 /** Artwork before the label, such as an icon. Decorative: the label names the row. */
 leading?:React.ReactNode;
 /** Short text on the trailing edge, such as `Off`, `English` or a balance. A string or number is drawn muted, or in `valueTone`, and read with the label. */
 value?:React.ReactNode;
 /** What a `value` that is not text reads as, such as the formatted amount of a live figure. The element is then read as this text in its place: with the label on a pressable row, and on its own on a static row. */
 valueLabel?:string;
 /** Colours a string or number `value` instead of the muted default, keeping its layout and reading. */
 valueTone?:'positive'|'warning'|'negative'|'muted';
 /** Anything richer on the trailing edge: icons, a Badge, or a control such as a Switch. */
 trailing?:React.ReactNode;
 /** Makes the whole row a button, usually one that opens another view, and shows the disclosure chevron. */
 onSelect?:()=>void;
 /** Dims the row and blocks `onSelect` and the switch. */
 disabled?:boolean;
 /** A row in a list of choices, such as a picker that selects and closes: `true` draws a check on the trailing edge, and the row exposes `accessibilityState.selected`. With `selected` set, true or false, the row draws no chevron unless `disclosure` asks for one. */
 selected?:boolean;
 /** Something the row started is in progress: a spinner takes the disclosure's place, the row is read as busy and presses are ignored, without dimming it. A busy switch row ignores presses and is read as unavailable. */
 busy?:boolean;
 /** Busy text appended to the accessible name while `busy` (not on Android, which speaks its own); defaults to HIGProvider `messages.busy`. `''` omits it. */
 busyLabel?:string;
 /** The glyph a row with `onSelect` draws on its trailing edge: the `chevron` (default), `external` (an arrow, for something that opens outside the app) or `none`. */
 disclosure?:'chevron'|'external'|'none';
 /** Makes the row a switch: the whole row is the target, named by `label`, with the track on its trailing edge; `onCheckedChange` receives the new state. Use without `onSelect`. */
 checked?:boolean;
 defaultChecked?:boolean;
 onCheckedChange?:(checked:boolean)=>void;
 testID?:string;
}
const hidden={accessible:false,accessibilityElementsHidden:true,importantForAccessibility:'no-hide-descendants' as const};
/** The check of a selected row. It does not mirror in right-to-left layouts. */
function Check({color,testID}:{color:string;testID?:string}){return <View {...hidden} testID={testID} style={{width:20,height:20,alignItems:'center',justifyContent:'center'}}><View style={{width:6,height:12,borderRightWidth:2,borderBottomWidth:2,borderColor:color,transform:[{translateY:-1},{rotate:'45deg'}]}}/></View>;}
/** An arrow pointing up and away, for a row that opens something outside the app; it mirrors in right-to-left layouts. */
function External({color,rtl,testID}:{color:string;rtl:boolean;testID?:string}){return <View {...hidden} testID={testID} style={{width:20,height:20,alignItems:'center',justifyContent:'center',transform:rtl?[{scaleX:-1}]:undefined}}>
 <View style={{position:'absolute',width:12,height:1.75,borderRadius:1,backgroundColor:color,transform:[{rotate:'-45deg'}]}}/>
 <View style={{position:'absolute',top:5,right:5,width:7,height:7,borderTopWidth:1.75,borderRightWidth:1.75,borderColor:color}}/>
</View>;}
/** One row of a ListGroup: the label leads; a value, icons, a badge or a control trail. With `onSelect` the whole row is one button and shows a disclosure chevron; with `checked` or `onCheckedChange` the whole row is a switch; otherwise the row is static, so a control in `trailing` is its only target. Other Pressable props, such as `android_disableSound`, `hitSlop` or `onLongPress`, reach the row, and the ref reaches its view. */
export const ListRow:React.ForwardRefExoticComponent<ListRowProps&React.RefAttributes<React.ComponentRef<typeof View>>>=/* @__PURE__ */forwardRef<React.ComponentRef<typeof View>,ListRowProps>(function ListRow({label,description,tone,leading,value,valueLabel,valueTone,trailing,onSelect,disabled,selected,busy,busyLabel,disclosure,checked,defaultChecked,onCheckedChange,testID,...rest},ref){
 const colors=useColors(),fills=useFills(),{direction,messages}=useHIG();const [internal,setInternal]=useState(!!defaultChecked);
 const toggles=!onSelect&&(checked!==undefined||defaultChecked!==undefined||onCheckedChange!=null);
 const row=(pressed:boolean):ViewStyle=>({flexDirection:'row',alignItems:'flex-start',gap:12,minHeight:56,paddingVertical:8,paddingHorizontal:20,backgroundColor:pressed?fills.raised:fills.well,opacity:disabled?0.5:1});
 const text=typeof value==='string'||typeof value==='number';
 const described=shown(description),about=described?plainText(description):'';
 const reading=[label,about||null,text?String(value):valueLabel??null].filter(Boolean).join(', ');
 const busyText=busyLabel??messages.busy??en.busy;
 const spoken=busy&&busyText&&Platform.OS!=='android'?`${reading} · ${busyText}`:reading;
 // Everything aligns to the first line of the label, so a trailing switch stays at the top when the label wraps.
 const first:ViewStyle={minHeight:40,justifyContent:'center'};
 const quiet=onSelect||toggles?hidden:{};
 const lead=leading==null?null:<View {...hidden} style={first}>{leading}</View>;
 const labelColor=tone==='destructive'?colors.negative:tone==='muted'?colors.muted:colors.text;
 const name=described
  ?<View {...quiet} style={{flex:1,flexShrink:1,minWidth:0,paddingVertical:8}}>
   <Text style={{fontSize:16,lineHeight:24,color:labelColor}}>{label}</Text>
   <Text testID={testID?`${testID}-description`:undefined} style={{fontSize:14,lineHeight:20,color:colors.muted}}>{description}</Text>
  </View>
  :<Text {...quiet} style={{flex:1,flexShrink:1,minWidth:0,paddingVertical:8,fontSize:16,lineHeight:24,color:labelColor}}>{label}</Text>;
 const amount=value==null||value===false?null:text?<Text {...quiet} testID={testID?`${testID}-value`:undefined} numberOfLines={1} style={{flexShrink:1,maxWidth:'50%',paddingVertical:8,fontSize:16,lineHeight:24,color:colors[valueTone??'muted'],textAlign:'right'}}>{value}</Text>:<View {...(!onSelect&&!toggles&&valueLabel?{accessible:true,accessibilityLabel:valueLabel}:{})} style={first}>{value}</View>;
 const extra=trailing==null?null:<View pointerEvents={onSelect||toggles?'none':'auto'} {...quiet} style={{flexDirection:'row',alignItems:'center',gap:8,minHeight:40}}>{trailing}</View>;
 const chevron=<View testID={testID?`${testID}-chevron`:undefined} style={{transform:[{rotate:direction==='rtl'?'90deg':'-90deg'}]}}><ChevronIcon color={colors.muted}/></View>;
 const glyphKind=disclosure??(selected!==undefined?'none':'chevron');
 const glyph=busy&&!toggles?<ActivityIndicator testID={testID?`${testID}-busy`:undefined} size='small' color={colors.muted} {...hidden}/>
  :selected?<Check color={colors.text} testID={testID?`${testID}-check`:undefined}/>
  :onSelect?(glyphKind==='chevron'?chevron:glyphKind==='external'?<External color={colors.muted} rtl={direction==='rtl'} testID={testID?`${testID}-external`:undefined}/>:null):null;
 const end=glyph?<View {...hidden} style={first}>{glyph}</View>:null;
 if(toggles){
  const on=checked??internal;
  const hint=[about||null,text?String(value):valueLabel??null].filter(Boolean).join(', ')||undefined;
  // The row holds an uncontrolled state itself so the drawn track follows it; SwitchRow stays controlled and emits feedback once.
  return <SwitchRow {...rest} ref={ref} testID={testID} label={label} accessibilityHint={rest.accessibilityHint??hint} accessibilityState={busy?{busy:true}:undefined} checked={on} disabled={disabled||busy} onCheckedChange={next=>{if(checked===undefined)setInternal(next);onCheckedChange?.(next);}} style={row(false)}>
   <SwitchRowContent first={first} lead={lead} name={name} amount={amount} extra={extra} checked={on} testID={testID}/>
  </SwitchRow>;
 }
 const state={...(selected!==undefined?{selected}:{}),...(busy?{busy:true}:{})};
 if(!onSelect)return <View {...(rest as ViewProps)} ref={ref} testID={testID} accessibilityState={Object.keys(state).length?state:undefined} style={row(false)}>{lead}{name}{amount}{extra}{end}</View>;
 return <Pressable {...rest} ref={ref} testID={testID} accessibilityRole='button' accessibilityLabel={spoken} accessibilityState={{disabled:!!disabled,...state}} aria-busy={busy||undefined} disabled={disabled} onPress={busy?undefined:onSelect} style={({pressed})=>row(pressed&&!busy)}>
  {lead}{name}{amount}{extra}{end}
 </Pressable>;
});
/** The decorative anatomy of a switch row: the label, value and trailing content, then the track. */
function SwitchRowContent({first,lead,name,amount,extra,checked,testID}:{first:ViewStyle;lead:React.ReactNode;name:React.ReactNode;amount:React.ReactNode;extra:React.ReactNode;checked:boolean;testID?:string}){
 const colors=useColors(),fills=useFills();
 return <View style={{flex:1,flexDirection:'row',alignItems:'flex-start',gap:12}}>
  {lead}{name}{amount}{extra}
  <View style={first}><View testID={testID?`${testID}-track`:undefined} style={{width:40,height:24,borderRadius:12,padding:3,backgroundColor:checked?colors.action:fills.raised,alignItems:checked?'flex-end':'flex-start'}}><View style={{width:18,height:18,borderRadius:9,backgroundColor:checked?colors.onAction:colors.text}}/></View></View>
 </View>;
}
