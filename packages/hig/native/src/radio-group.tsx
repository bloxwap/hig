import React,{useEffect,useLayoutEffect,useRef,useState} from 'react';
import {Animated,Easing,Image,Platform,Pressable,ScrollView,View,type LayoutChangeEvent,type ScrollViewProps} from 'react-native';
import {tokens} from '@bloxwap/hig/tokens';
import {useControllable,useColors,useFills,useHIG} from './provider.js';
import {Text} from './surface.js';
import type {Choice,ChoicesProps} from './selection-types.js';
export function RadioGroup({label,options,value,defaultValue='',disabled,onValueChange}:ChoicesProps){
 const [current,set]=useControllable(value,defaultValue,onValueChange);const {direction,locale}=useHIG();const colors=useColors();
 return <View accessibilityRole='radiogroup' accessibilityLabel={label} style={{direction}}><Text>{label}</Text>{options.map(o=>{
  const blocked=!!disabled||!!o.disabled;const activate=()=>{if(!blocked)set(o.value);};
  return <Pressable key={o.value} accessible accessibilityRole='radio' aria-checked={current===o.value} aria-disabled={blocked} accessibilityLabel={o.label} accessibilityHint={o.description} accessibilityLanguage={o.lang} accessibilityState={{checked:current===o.value,disabled:blocked}} accessibilityActions={[{name:'activate'}]} disabled={blocked} onPress={activate} onAccessibilityAction={event=>{if(event.nativeEvent.actionName==='activate')activate();}} style={{minHeight:48,paddingVertical:12,flexDirection:'row',alignItems:'center',gap:12,opacity:blocked?0.5:1}}><Text accessible={false}>{current===o.value?'●':'○'}</Text><View style={{flex:1}}><Text accessible={false} accessibilityLanguage={o.lang}>{o.label}</Text>{o.description!==undefined&&<Text accessible={false} accessibilityLanguage={locale} style={{color:colors.muted,fontSize:14,lineHeight:20}}>{o.description}</Text>}</View></Pressable>;
 })}</View>;
}
/** Segments are 36dp inside a 44dp track (28 in a 36 track at compact density); the slop restores a 48dp touch target at either density. Segments sit 4 apart and the slop is vertical only, so neighbouring targets never overlap. Android (Fabric) counts a child's hitSlop in its parent's overflow inset, so the slop past the track is reachable there too. */
const segmentSlop={top:6,bottom:6},compactSegmentSlop={top:10,bottom:10};
/** Equal-width choices with one interruptible selection indicator. The track is the dark well and the selected segment the lighter fill; the control is 44dp tall (36 compact). */
/** One segment. `testID` is the segment's test ID, in place of `<group testID>-<value>`. */
export interface SegmentedControlOption extends Choice {testID?:string}
export interface SegmentedControlProps extends Omit<ChoicesProps,'options'> {options:readonly SegmentedControlOption[];/** Keeps `label` as the group's accessible name but does not draw it, for a control whose heading or row already names it. */hideLabel?:boolean;/** Test ID of the group; each segment takes `<testID>-<value>`, such as `trade-share-mode-video`, unless the option sets its own `testID`. */testID?:string}
export function SegmentedControl({label,options,value,defaultValue='',disabled,hideLabel,testID,onValueChange}:SegmentedControlProps){
 const [current,set]=useControllable(value,defaultValue,onValueChange);
 const {direction,locale,reducedMotion,density}=useHIG();const colors=useColors();const fills=useFills();const compact=density==='compact';
 const [width,setWidth]=useState(0);const translateX=useRef(new Animated.Value(0)).current;
 const selected=options.findIndex(option=>option.value===current),count=options.length;
 const segmentWidth=count>0?Math.max(0,(width-(count-1)*4)/count):0;
 const target=selected>=0?(direction==='rtl'?-1:1)*selected*(segmentWidth+4):0;
 // RN Web resolves `start` through its own locale context rather than this View's direction.
 const anchor=Platform.OS==='web'?(direction==='rtl'?{right:0}:{left:0}):{start:0};
 const previous=useRef<{selected:number;width:number;count:number;direction:string}|null>(null);
 useLayoutEffect(()=>{
  const old=previous.current;previous.current={selected,width,count,direction};
  // Initial layout, rotation, option-count changes and reduced motion snap into place.
  // A new selection interrupts the running animation at its current position.
  if(reducedMotion||!old||old.selected===selected||old.selected<0||selected<0||old.width!==width||old.count!==count||old.direction!==direction){
   translateX.stopAnimation();translateX.setValue(target);return;
  }
  const animation=Animated.timing(translateX,{toValue:target,duration:tokens.motion.base,easing:Easing.bezier(...tokens.easing.standard),useNativeDriver:Platform.OS!=='web',isInteraction:false});
  animation.start();return()=>animation.stop();
 },[selected,width,count,direction,reducedMotion,target,translateX]);
 return <View testID={testID} accessibilityRole='radiogroup' accessibilityLabel={label} style={{direction,gap:8}}>
  {hideLabel?null:<Text style={{fontWeight:'600'}}>{label}</Text>}
  <View style={{padding:4,borderRadius:9999,backgroundColor:fills.well}}>
   <View onLayout={event=>setWidth(event.nativeEvent.layout.width)} style={{flexDirection:'row',gap:4}}>
    {selected>=0&&width>0&&<Animated.View pointerEvents='none' accessible={false} accessibilityElementsHidden importantForAccessibility='no-hide-descendants' style={{position:'absolute',...anchor,top:0,bottom:0,width:segmentWidth,borderRadius:9999,backgroundColor:fills.raised,opacity:disabled||options[selected].disabled?0.5:1,transform:[{translateX}]}}/>}
    {options.map(option=>{
     const checked=current===option.value,blocked=!!disabled||!!option.disabled;
     const activate=()=>{if(!blocked)set(option.value);};
     return <Pressable key={option.value} testID={option.testID??(testID===undefined?undefined:`${testID}-${option.value}`)} accessible accessibilityRole='radio' accessibilityLabel={option.label} accessibilityHint={option.description} accessibilityLanguage={option.lang} aria-checked={checked} aria-disabled={blocked} accessibilityState={{checked,disabled:blocked}} accessibilityActions={[{name:'activate'}]} disabled={blocked} onPress={activate} onAccessibilityAction={event=>{if(event.nativeEvent.actionName==='activate')activate();}} hitSlop={compact?compactSegmentSlop:segmentSlop} style={{flex:1,minWidth:0,minHeight:compact?28:36,paddingHorizontal:12,paddingVertical:compact?2:4,alignItems:'stretch',justifyContent:'center',borderRadius:9999,opacity:blocked?0.5:1}}>
      <Text accessible={false} accessibilityLanguage={option.lang} style={{color:checked?colors.text:colors.muted,fontWeight:'500',textAlign:'center'}}>{option.label}</Text>
      {option.description!==undefined&&<Text accessible={false} accessibilityLanguage={locale} style={{color:colors.muted,fontSize:14,lineHeight:20,textAlign:'center'}}>{option.description}</Text>}
     </Pressable>;
    })}
   </View>
  </View>
 </View>;
}
export interface FilterOption {value:string;label:string;disabled?:boolean;/** Image URL shown in the option's circle until it is selected. */icon?:string}
export interface FilterProps {/** Accessible name of the group; not drawn. */label:string;options:readonly FilterOption[];value?:string;defaultValue?:string;disabled?:boolean;onValueChange?:(value:string)=>void;/** The horizontal scroll view the capsules sit in, such as a sheet library's ScrollView that keeps sideways drags from the sheet. It receives the same props as React Native's `ScrollView`, which is the default. */scrollComponent?:React.ComponentType<ScrollViewProps>;/** Units the row scrolls out past its container on each side, so the capsules are cut by the container's edge, while the first and last capsule rest this far in: pass the container's side padding. Default 0. */bleed?:number}
/** Chips are 40dp; the slop restores a 44dp touch target. */
const filterSlop={top:2,bottom:2};
const hiddenMark={accessible:false,accessibilityElementsHidden:true,importantForAccessibility:'no-hide-descendants' as const,pointerEvents:'none' as const};
/** One chip. Its circle holds the option's icon or an empty ring; when the chip is selected the circle fills and a check settles in, and deselecting reverses it. */
function FilterChip({option,checked,blocked,reducedMotion,onSelect,onLayout}: {option:FilterOption;checked:boolean;blocked:boolean;reducedMotion:boolean;onSelect:()=>void;onLayout:(event:LayoutChangeEvent)=>void}){
 const colors=useColors();const fills=useFills();const progress=useRef(new Animated.Value(checked?1:0)).current;const first=useRef(true);
 useEffect(()=>{
  const target=checked?1:0;
  // The first render and reduced motion show the final state at once.
  if(first.current||reducedMotion){first.current=false;progress.stopAnimation();progress.setValue(target);return;}
  const animation=Animated.timing(progress,{toValue:target,duration:220,easing:Easing.bezier(...tokens.easing.standard),useNativeDriver:Platform.OS!=='web',isInteraction:false});
  animation.start();return()=>animation.stop();
 },[checked,reducedMotion,progress]);
 const ink=checked?colors.background:colors.text;
 const activate=()=>{if(!blocked)onSelect();};
 return <Pressable accessible accessibilityRole='radio' accessibilityLabel={option.label} aria-checked={checked} aria-disabled={blocked} accessibilityState={{checked,disabled:blocked}} accessibilityActions={[{name:'activate'}]} disabled={blocked} onPress={activate} onAccessibilityAction={event=>{if(event.nativeEvent.actionName==='activate')activate();}} hitSlop={filterSlop} onLayout={onLayout}
  style={state=>({flexDirection:'row',alignItems:'center',gap:8,minHeight:40,paddingVertical:6,paddingStart:8,paddingEnd:16,borderRadius:9999,backgroundColor:checked?colors.text:state.pressed?fills.raised:fills.well,opacity:blocked?0.5:1})}>
  <View {...hiddenMark} style={{width:24,height:24,borderRadius:12,overflow:'hidden',alignItems:'center',justifyContent:'center'}}>
   {option.icon?<Image source={{uri:option.icon}} accessible={false} style={{position:'absolute',width:24,height:24,borderRadius:12}}/>:<View style={{position:'absolute',width:24,height:24,borderRadius:12,borderWidth:2,borderColor:ink}}/>}
   <Animated.View style={{position:'absolute',width:24,height:24,borderRadius:12,backgroundColor:colors.background,opacity:progress}}/>
   <Animated.View style={{opacity:progress,transform:[{scale:progress.interpolate({inputRange:[0,1],outputRange:[0.4,1]})}]}}><View style={{width:11,height:6,borderLeftWidth:2,borderBottomWidth:2,borderColor:colors.text,transform:[{translateY:-1.5},{rotate:'-45deg'}]}}/></Animated.View>
  </View>
  <Text accessible={false} style={{fontSize:14,lineHeight:21,fontWeight:'600',color:ink}}>{option.label}</Text>
 </Pressable>;
}
/**
 * A horizontal, scrolling row of single-choice filter chips. The selected chip inverts and its circle shows a check that animates in.
 * The row scrolls the selected chip fully into view on mount and whenever the selection changes, through the scroll view's
 * `scrollTo` (a host `scrollComponent` receives the ref and `onLayout`/`onScroll`; one without `scrollTo` simply does not scroll).
 */
export function Filter({label,options,value,defaultValue='',disabled,onValueChange,scrollComponent=ScrollView,bleed=0}:FilterProps){
 const [current,set]=useControllable(value,defaultValue,onValueChange);const {direction,reducedMotion}=useHIG();
 const Scroll=scrollComponent as React.ComponentType<ScrollViewProps&{ref?:React.Ref<ScrollView>}>;
 const scroller=useRef<ScrollView|null>(null),chips=useRef(new Map<string,{x:number;width:number}>()),viewport=useRef({width:0,offset:0}),mounted=useRef(false);
 // Left-to-right only: right-to-left horizontal offsets differ by platform, so that row stays where the reader leaves it.
 const reveal=(animated:boolean)=>{
  const chip=chips.current.get(current),{width,offset}=viewport.current;
  if(!chip||width<=0||direction==='rtl')return;
  // With a bleed the chip's x includes the leading inset, and a revealed chip keeps the inset clear on either side.
  const x=chip.x-bleed<offset?chip.x-bleed:chip.x+chip.width+bleed>offset+width?chip.x+chip.width+bleed-width:null;
  if(x===null)return;
  viewport.current.offset=Math.max(0,x);scroller.current?.scrollTo?.({x:viewport.current.offset,animated:animated&&!reducedMotion});
 };
 useEffect(()=>{if(mounted.current)reveal(true);mounted.current=true;},[current]);
 return <Scroll ref={scroller} horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps='handled' accessibilityRole='radiogroup' accessibilityLabel={label} style={{flexGrow:0,direction,...(bleed?{marginHorizontal:-bleed}:null)}} contentContainerStyle={{direction,gap:8,...(bleed?{paddingHorizontal:bleed}:null)}}
  onLayout={event=>{viewport.current.width=event.nativeEvent.layout.width;reveal(false);}} onScroll={event=>{viewport.current.offset=event.nativeEvent.contentOffset.x;}} scrollEventThrottle={16}>
  {options.map(option=><FilterChip key={option.value} option={option} checked={current===option.value} blocked={!!disabled||!!option.disabled} reducedMotion={!!reducedMotion} onSelect={()=>set(option.value)}
   onLayout={event=>{const {x,width}=event.nativeEvent.layout;chips.current.set(option.value,{x,width});if(option.value===current)reveal(false);}}/>)}
 </Scroll>;
}
