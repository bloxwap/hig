import { Check as SharedCheck } from '@bloxwap/icons/native/check';
import { ArrowUpRight } from '@bloxwap/icons/native/arrow-up-right';
import React,{forwardRef,useState} from 'react';
import {ActivityIndicator,Platform,Pressable,Text as NativeText,View,type PressableProps,type ViewProps,type ViewStyle} from 'react-native';
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
const bare=(node:React.ReactNode)=>typeof node==='string'||typeof node==='number';
/** A fragment or array with a bare string or number among its children (through nested fragments and arrays). */
const loose=(node:React.ReactNode):boolean=>Array.isArray(node)?node.some(child=>bare(child)||loose(child)):React.isValidElement(node)&&node.type===React.Fragment&&loose(([] as React.ReactNode[]).concat((node.props as {children?:React.ReactNode}).children));
const actionSlop={top:12,bottom:12,left:8,right:8};
/** A grouped list for menus and settings: an optional heading over rows that share one rounded container. */
export function ListGroup({title,titleAccessory,action,intro,children,testID}:ListGroupProps){
 const colors=useColors(),{direction}=useHIG();
 const titled=shown(title),accessory=shown(titleAccessory);
 const titleStyle={color:colors.muted,fontSize:14,lineHeight:20,fontWeight:'500' as const};
 const titleTestID=testID?`${testID}-title`:undefined;
 // A string title keeps its 0.6.0 anatomy; an element title is one header node. With an accessory, the title and the accessory are one header node instead.
 const joined=titled&&accessory;
 const role=joined?{}:{accessibilityRole:'header' as const};
 const name=!titled?null:typeof title==='string'||typeof title==='number'
  ?<Text {...role} testID={titleTestID} style={accessory||action?{flexShrink:1,...titleStyle}:{paddingHorizontal:4,...titleStyle}}>{title}</Text>
  :<View {...(joined?{}:{accessible:true,...role})} testID={titleTestID} style={accessory||action?{flexShrink:1}:{paddingHorizontal:4}}>{title}</View>;
 const extra=accessory?<View testID={testID?`${testID}-title-accessory`:undefined} style={{flexShrink:1}}>{typeof titleAccessory==='string'||typeof titleAccessory==='number'?<Text style={titleStyle}>{titleAccessory}</Text>:titleAccessory}</View>:null;
 // An element with no text of its own, such as a live figure, leaves the platform to read the node's children.
 const titleText=joined?plainText(title):'',accessoryText=joined?plainText(titleAccessory):'';
 const heading=joined?<View accessible accessibilityRole='header' accessibilityLabel={titleText&&accessoryText?`${titleText}, ${accessoryText}`:undefined} testID={testID?`${testID}-heading`:undefined} style={{flexDirection:'row',alignItems:'center',gap:8,flexShrink:1,minWidth:0}}>{name}{extra}</View>:<>{name}{extra}</>;
 // The action stays outside the header node, so it remains its own button.
 const header=!accessory&&!action?name:<View testID={testID?`${testID}-header`:undefined} style={{direction,flexDirection:'row',alignItems:'center',gap:8,paddingHorizontal:4,minWidth:0}}>
  {heading}
  {action?<Pressable testID={testID?`${testID}-action`:undefined} accessibilityRole='button' accessibilityLabel={action.label} accessibilityState={{disabled:!!action.disabled}} disabled={action.disabled} hitSlop={actionSlop} onPress={action.onSelect} style={({pressed})=>({marginStart:'auto',minWidth:32,alignItems:'center',paddingVertical:4,paddingHorizontal:4,opacity:action.disabled?0.5:pressed?0.6:1})}>
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
 /** A muted second line under the label, such as a subtitle or an address. The row grows to fit it, and it is read with the label (as the hint of a switch row). A string, a number, one Text element, or a fragment or array with bare text among its children (`<>Ends in <Text>3m</Text></>`) is drawn in the muted Text; any other node (several Text elements, a row with an icon, a live figure) is drawn as given in a View, styled by the host. A component of the host's own that renders bare strings must be wrapped in a Text, as anywhere in a View. Its text is read as concatenated, so give such a row `accessibilityLabel`. */
 description?:React.ReactNode;
 /** What the row reads as, in place of its label, description and value: Long BTC, 10×, 0.5 BTC, up $12. A pressable row keeps its busy text after it, a switch row is named by it (its description and value stay its hint), and a static row becomes one element named by it (with a `trailing` control, the label, description and value become that element and the control stays its own target). */
 accessibilityLabel?:string;
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
function Check({color,testID}:{color:string;testID?:string}){return <SharedCheck size={20} color={color} testID={testID}/>;}
/** An arrow pointing up and away, for a row that opens something outside the app; it mirrors in right-to-left layouts. */
function External({color,rtl,testID}:{color:string;rtl:boolean;testID?:string}){return <ArrowUpRight size={20} color={color} testID={testID} style={{transform:rtl?[{scaleX:-1}]:undefined}}/>;}
/** One row of a ListGroup: the label leads; a value, icons, a badge or a control trail. With `onSelect` the whole row is one button and shows a disclosure chevron; with `checked` or `onCheckedChange` the whole row is a switch; otherwise the row is static, so a control in `trailing` is its only target. Other Pressable props, such as `android_disableSound`, `hitSlop` or `onLongPress`, reach the row, and the ref reaches its view. */
export const ListRow:React.ForwardRefExoticComponent<ListRowProps&React.RefAttributes<React.ComponentRef<typeof View>>>=/* @__PURE__ */forwardRef<React.ComponentRef<typeof View>,ListRowProps>(function ListRow({label,description,accessibilityLabel,tone,leading,value,valueLabel,valueTone,trailing,onSelect,disabled,selected,busy,busyLabel,disclosure,checked,defaultChecked,onCheckedChange,testID,...rest},ref){
 const colors=useColors(),fills=useFills(),{direction,messages}=useHIG();const [internal,setInternal]=useState(!!defaultChecked);
 const toggles=!onSelect&&(checked!==undefined||defaultChecked!==undefined||onCheckedChange!=null);
 const row=(pressed:boolean):ViewStyle=>({flexDirection:'row',alignItems:'flex-start',gap:12,minHeight:56,paddingVertical:8,paddingHorizontal:20,backgroundColor:pressed?fills.raised:fills.well,opacity:disabled?0.5:1});
 const text=typeof value==='string'||typeof value==='number';
 const described=shown(description),about=described?plainText(description):'';
 const reading=accessibilityLabel??[label,about||null,text?String(value):valueLabel??null].filter(Boolean).join(', ');
 const busyText=busyLabel??messages.busy??en.busy;
 const spoken=busy&&busyText&&Platform.OS!=='android'?`${reading} · ${busyText}`:reading;
 // Everything aligns to the first line of the label, so a trailing switch stays at the top when the label wraps.
 const first:ViewStyle={minHeight:40,justifyContent:'center'};
 // A static row with a state is one element, so the state is read; a trailing control keeps the row open so the control stays its own target.
 // A host name on a static row: with no trailing control the row is one element; with one, the text is one element beside it.
 const named=!onSelect&&!toggles&&accessibilityLabel!==undefined;
 const announced=!onSelect&&!toggles&&(selected!==undefined||!!busy||named)&&trailing==null;
 const grouped=named&&trailing!=null;
 const quiet=onSelect||toggles||announced?hidden:{},textQuiet=grouped?hidden:quiet;
 const lead=leading==null?null:<View {...hidden} style={first}>{leading}</View>;
 const labelColor=tone==='destructive'?colors.negative:tone==='muted'?colors.muted:colors.text;
 const descriptionStyle={fontSize:14,lineHeight:20,color:colors.muted};
 // Text, one Text element, or a fragment or array holding bare text (`<>Ends in <Text>3m</Text></>`) keeps the muted line, since a bare string cannot sit in a View; richer host content is laid out as given.
 const inline=bare(description)||loose(description)||(React.isValidElement(description)&&(description.type===Text||description.type===NativeText));
 const descriptionTestID=testID?`${testID}-description`:undefined;
 const nameBox={flex:1,flexShrink:1,minWidth:0,paddingVertical:8} as const;
 const nameRole=grouped?{accessible:true,accessibilityLabel}:quiet;
 const name=described
  ?<View {...nameRole} style={nameBox}>
   <Text style={{fontSize:16,lineHeight:24,color:labelColor}}>{label}</Text>
   {inline?<Text testID={descriptionTestID} style={descriptionStyle}>{description}</Text>:<View testID={descriptionTestID} style={{minWidth:0}}>{description}</View>}
  </View>
  :grouped?<View {...nameRole} style={nameBox}><Text style={{fontSize:16,lineHeight:24,color:labelColor}}>{label}</Text></View>
  :<Text {...textQuiet} style={{...nameBox,fontSize:16,lineHeight:24,color:labelColor}}>{label}</Text>;
 const amount=value==null||value===false?null:text?<Text {...textQuiet} testID={testID?`${testID}-value`:undefined} numberOfLines={1} style={{flexShrink:1,maxWidth:'50%',paddingVertical:8,fontSize:16,lineHeight:24,color:colors[valueTone??'muted'],textAlign:'right'}}>{value}</Text>:<View {...(grouped?hidden:!onSelect&&!toggles&&!announced&&valueLabel?{accessible:true,accessibilityLabel:valueLabel}:{})} style={first}>{value}</View>;
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
  return <SwitchRow {...rest} ref={ref} testID={testID} label={accessibilityLabel??label} accessibilityHint={rest.accessibilityHint??hint} accessibilityState={busy?{busy:true}:undefined} checked={on} disabled={disabled||busy} onCheckedChange={next=>{if(checked===undefined)setInternal(next);onCheckedChange?.(next);}} style={row(false)}>
   <SwitchRowContent first={first} lead={lead} name={name} amount={amount} extra={extra} checked={on} testID={testID}/>
  </SwitchRow>;
 }
 const state={...(selected!==undefined?{selected}:{}),...(busy?{busy:true}:{})};
 if(!onSelect)return <View {...(rest as ViewProps)} ref={ref} testID={testID} {...(announced?{accessible:true,accessibilityLabel:spoken}:{})} accessibilityState={Object.keys(state).length?state:undefined} style={row(false)}>{lead}{name}{amount}{extra}{end}</View>;
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
