import {primaryButtonInk} from '@bloxwap/hig/tokens';
import {assertUniqueKeys} from '@bloxwap/hig/contracts/invariants';
import React from 'react';
import {View,type StyleProp,type ViewStyle} from 'react-native';
import {useColors,useControllable,useHIG} from './provider.js';
import {Button} from './button.js';
import {Text} from './surface.js';
/** One quick choice. `testID` is the chip's test ID; without it the chip takes `<group testID>-<value>`. */
export interface PresetOption<T extends string|number=string> {value:T;label:string;disabled?:boolean;testID?:string}
export interface PresetGroupProps<T extends string|number=string> {
 /** Accessible name of the group; not drawn, so a heading or row above it names it on screen. Native reads it as each chip's hint, after the chip's own label and state. */
 label?:string;
 options:readonly PresetOption<T>[];
 /** The selected choice; `null` selects none. Omit it, with `defaultValue`, to let the group keep its own selection. */
 value?:T|null;
 defaultValue?:T|null;
 /** Called with the choice taken. A press on the selected chip, or on a dimmed one, does nothing. */
 onValueChange?:(value:T)=>void;
 /** Chips per row. Defaults to every option in one row; with fewer columns the chips wrap onto equal-width rows. */
 columns?:number;
 /** Fill of the selected chip. Defaults to `primary`; TargetBlock passes `destructive` for a stop loss. */
 selectedIntent?:'primary'|'destructive'|'up'|'down';
 disabled?:boolean;
 /** Keeps the provider's `selection` feedback off this group, for a host that plays its own cue. By default a new choice plays it like a SegmentedControl. */
 suppressFeedback?:boolean;
 /** Layout of the group, such as a top margin. */
 style?:StyleProp<ViewStyle>;
 testID?:string;
}
/**
 * A chip is 44dp tall; 2dp above and below make its 48dp touch target (Material's 48dp target around a smaller visual,
 * as every HIG native control under 48dp does). Chips and rows sit 8 apart, so the slop reaches half the gap sideways
 * (4) and 2 of it vertically: neighbouring targets meet but never overlap, and a chip narrower than 48 (many columns
 * on a narrow screen) still gets the whole column pitch. Android (Fabric) counts a child's hitSlop in its parent's
 * overflow inset, so slop past the row's own frame is reachable there too, unless a clipping ancestor cuts it.
 */
const chipSlop={top:2,bottom:2,left:4,right:4};
function PresetChip<T extends string|number>({option,selected,blocked,intent,selection,label,groupTestID}:{
 option:PresetOption<T>;selected:boolean;blocked:boolean;intent:NonNullable<PresetGroupProps<T>['selectedIntent']>;
 selection:React.RefObject<(value:T|null)=>void>;label?:string;groupTestID?:string;
}){
 const choose=()=>{if(!blocked&&!selected)selection.current(option.value);};
 const colors=useColors();
 const color=blocked?colors.muted:!selected?colors.text:intent==='up'?colors.up:intent==='down'?colors.down:intent==='destructive'?colors.negative:primaryButtonInk(colors);
 const chipID=option.testID??(groupTestID===undefined?undefined:`${groupTestID}-${option.value}`);
 return <Button testID={chipID} intent={selected?intent:'secondary'} disabled={blocked||undefined} accessibilityLabel={option.label} accessibilityState={{selected}} accessibilityHint={label||undefined} hitSlop={chipSlop} suppressFeedback contentMode='custom' onPress={choose} style={{flex:1,alignSelf:'auto',paddingHorizontal:8}}>
  <Text testID={option.testID?`${option.testID}-label`:groupTestID===undefined?undefined:`${groupTestID}-${option.value}-label`} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} style={{alignSelf:'stretch',color,fontSize:16,fontWeight:'600',textAlign:'center'}}>{option.label}</Text>
 </Button>;
}
const Chip=React.memo(PresetChip) as typeof PresetChip;

/** A set of quick choices as chips in an equal-width grid, such as order sizes or leverage steps. Single choice, or none; each chip is a button that reads selected, 44dp tall with a 48dp touch target, in the interface face. TargetBlock draws its presets with it. */
export function PresetGroup<T extends string|number=string>({label,options,value,defaultValue=null,onValueChange,columns,selectedIntent='primary',disabled,suppressFeedback,style,testID}:PresetGroupProps<T>){
 const {direction}=useHIG();
 const [current,set]=useControllable<T|null>(value,defaultValue,onValueChange as ((value:T|null)=>void)|undefined,suppressFeedback?null:'selection');
 const selection=React.useRef(set);
 React.useLayoutEffect(()=>{selection.current=set;},[set]);
 const count=Math.max(1,Math.floor(columns??options.length)||1);
 const rows=React.useMemo(()=>{
  assertUniqueKeys(options,option=>option.value,'Choices');
  const groups:PresetOption<T>[][]=[];
  for(let index=0;index<options.length;index+=count)groups.push(options.slice(index,index+count));
  return groups;
 },[options,count]);
 const chip=(option:PresetOption<T>)=><Chip key={String(option.value)} option={option} selected={Object.is(current,option.value)} blocked={!!disabled||!!option.disabled} intent={selectedIntent} selection={selection} label={label} groupTestID={testID}/>;
 // A short row keeps the column width, as the web grid does: empty cells hold the place of the missing chips, also in a single row with more columns than options.
 const row=(items:PresetOption<T>[],key?:number,own?:object)=><View key={key} {...own} style={[{direction,flexDirection:'row',gap:8},key===undefined?{alignSelf:'stretch'}:null,key===undefined?style:null]}>{items.map(chip)}{Array.from({length:items.length>0?count-items.length:0},(_,cell)=><View key={`cell-${cell}`} style={{flex:1}}/>)}</View>;
 // React Native has no named group: VoiceOver never reads a container that is not an element (RN exposes no
 // `accessibilityContainerType`), and TalkBack reads a plain container's description unreliably. So the group's name
 // reaches each chip as its hint, which both read after the chip ("$25, button, selected, Size"), and the container
 // carries none, so it is never read twice.
 const group={testID};
 return rows.length>1?<View {...group} style={[{alignSelf:'stretch',gap:8},style]}>{rows.map((items,index)=>row(items,index))}</View>:row(rows[0]??[],undefined,group);
}
