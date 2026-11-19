import {BackdropBlur} from './backdrop-blur.js';
import {GestureSheetHeaderContext,GestureSheetSurfaceContext,sheetGripStyle,sheetHandlePadding} from './sheet-header-glow.js';
import {gestureSheetResize,gestureSheetTravel} from './gesture-sheet-motion.js';
export {gestureSheetResize,gestureSheetTravel} from './gesture-sheet-motion.js';
import {validateSnapPoints} from './gesture-sheet-model.js';
import React,{createContext,useCallback,useContext,useEffect,useId,useMemo,useRef,useState} from 'react';
import {AccessibilityInfo,BackHandler,findNodeHandle,Keyboard,PixelRatio,Platform,Pressable,StyleSheet,Text as RNText,TextInput,View,type LayoutChangeEvent,type StyleProp,type ViewStyle} from 'react-native';
import Reanimated,{cancelAnimation,ReduceMotion,runOnJS,useAnimatedProps,useAnimatedReaction,useAnimatedScrollHandler,useAnimatedStyle,useDerivedValue,useSharedValue,withTiming,type SharedValue} from 'react-native-reanimated';
import {Gesture,GestureDetector,type GestureType} from 'react-native-gesture-handler';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {nativeMetrics as tokens} from '@bloxwap/hig/tokens';
import * as en from '@bloxwap/hig/contracts/messages';
import {Raised,useColors,useHIG} from './provider.js';
import {Heading,Text,Stack} from './surface.js';
import {Button} from './button.js';
import {backdropProgress,detentHeights,dragPosition,releaseTarget,type SheetSnapPoint} from './gesture-sheet-model.js';
export type {SheetSnapPoint} from './gesture-sheet-model.js';

type FocusTarget=React.ComponentRef<typeof View>|React.ComponentRef<typeof RNText>|React.ComponentRef<typeof TextInput>|null;
interface SheetCommonProps {
 open:boolean;
 onOpenChange:(open:boolean)=>void;
 /** Names the sheet. Drawn as the heading in default mode; in custom mode it is read by assistive technology unless `titleRef` points at the host's own heading. */
 title:string;
 description?:string;
 children:React.ReactNode;
 /** Default anatomy scrolls the title, description, content and a Close action. Custom content owns layout, scrolling and its own way out. */
 contentMode?:'default'|'custom';
 /** In custom mode, the host's accessible title. It takes accessibility focus when the sheet opens. */
 titleRef?:React.RefObject<FocusTarget>;
 /** Takes accessibility focus back when the sheet has closed. */
 returnFocusRef?:React.RefObject<FocusTarget>;
 /** `nativeID` of a heading inside the sheet that names it (Android `accessibilityLabelledBy`). Same prop as web. */
 labelledBy?:string;
 /** Close button text and accessible name; defaults to HIGProvider `messages.close`. */
 closeLabel?:string;
 /** `false` blocks every dismissal the user can start: drag, backdrop press, Android Back and the accessibility escape. Default `true`. */
 dismissible?:boolean;
 /** Modal draws in the nearest `GestureSheetHost`, above the screen. Inline draws where it is rendered and keeps its children mounted while closed. */
 presentation?:'modal'|'inline';
 /** Called once after an accepted dismissal has finished moving. */
 onDismiss?:()=>void;
 /** Called with the detent index (0 is the lowest) each time the sheet settles on one. */
 onChange?:(index:number)=>void;
 /** Return true to consume Android Back, or false to leave it to another handler. Omit for default dismissal. */
 onHardwareBackPress?:()=>boolean;
 /** Room kept clear above the sheet, and padding under its content so nothing sits behind the home indicator. Default to the safe-area insets; pass `bottomInset={0}` for content that runs to the edge. */
 topInset?:number;
 bottomInset?:number;
 /** Draws the drag handle. Default `true`. The whole sheet drags either way. */
 handle?:boolean;
 /** Merged over the sheet's fill, radius and clipping. */
 backgroundStyle?:StyleProp<ViewStyle>;
 /** Content sits one elevation up, so wells and rows step up a shade on the `overlay` fill. Pass `false` when `backgroundStyle` paints the page background. Default `true`. */
 raised?:boolean;
 /** Scales the modal scrim behind the sheet (the same scrim as Dialog), 0 to 1. Default 1; 0 draws none and lets presses through. */
 backdropOpacity?:number;
 /** Prefix of the test IDs: `<testID>`, `-backdrop`, `-surface`, `-handle` and `-content`. */
 testID?:string;
}
export type GestureSheetProps=SheetCommonProps&(
 /** Fixed detents, as points or a percentage of the room under `topInset`. Sorted for you; `initialIndex` counts from the lowest. */
 {enableDynamicSizing?:false;snapPoints:readonly SheetSnapPoint[];initialIndex?:number;maxDynamicContentSize?:never}
 /** One detent as tall as the content, up to `maxDynamicContentSize` points (default: all the room). */
 |{enableDynamicSizing:true;snapPoints?:never;initialIndex?:never;maxDynamicContentSize?:number}
);

interface HostValue {height:React.RefObject<number>;show:(id:string,node:React.ReactNode)=>void;hide:(id:string)=>void}
const HostContext=createContext<HostValue|null>(null);
/**
 * Where modal sheets draw: wrap the screen (inside GestureHandlerRootView and SafeAreaProvider) once. Sheets render in a
 * layer over its children, so they cover the tab bar and anything else inside it. Without a host a modal sheet draws in place.
 */
export function GestureSheetHost({children,style}:{children:React.ReactNode;style?:StyleProp<ViewStyle>}){
 const [layers,setLayers]=useState<readonly {id:string;node:React.ReactNode}[]>([]);
 const height=useRef(0);
 const measureHost=useCallback((event:LayoutChangeEvent)=>{height.current=event.nativeEvent.layout.height;},[]);
 const value=useMemo<HostValue>(()=>({height,
  show:(id,node)=>setLayers(current=>{const index=current.findIndex(layer=>layer.id===id);if(index<0)return [...current,{id,node}];if(current[index].node===node)return current;const next=current.slice();next[index]={id,node};return next;}),
  hide:id=>setLayers(current=>current.some(layer=>layer.id===id)?current.filter(layer=>layer.id!==id):current),
 }),[]);
 return <HostContext.Provider value={value}>
  <View onLayout={measureHost} style={[styles.fill,style]}>
   {children}
   {layers.map(layer=><View key={layer.id} pointerEvents='box-none' style={StyleSheet.absoluteFill}>{layer.node}</View>)}
  </View>
 </HostContext.Provider>;
}

interface ScrollValue {pan:GestureType;scrollY:SharedValue<number>;scrollers:SharedValue<number>;atTop:SharedValue<boolean>}
const ScrollContext=createContext<ScrollValue|null>(null);
/**
 * A ScrollView that shares the drag with its sheet: at the top detent it scrolls, and a pull down from the top of the
 * content moves the sheet; below the top detent the drag moves the sheet and the content stays put. Outside a sheet it is a
 * plain ScrollView. Bounce and overscroll are off so the content cannot move while the sheet does.
 */
export const GestureSheetScrollView=React.forwardRef<React.ComponentRef<typeof Reanimated.ScrollView>,React.ComponentProps<typeof Reanimated.ScrollView>>(function GestureSheetScrollView(props,ref){
 const sheet=useContext(ScrollContext);
 const ownY=useSharedValue(0),ownCount=useSharedValue(0),free=useSharedValue(true);
 const scrollY=sheet?.scrollY??ownY,scrollers=sheet?.scrollers??ownCount,atTop=sheet?.atTop??free,pan=sheet?.pan;
 const native=useMemo(()=>pan?Gesture.Native().simultaneousWithExternalGesture(pan):Gesture.Native(),[pan]);
 useEffect(()=>{scrollers.value+=1;return()=>{scrollers.value-=1;scrollY.value=0;};},[scrollers,scrollY]);
 // A list drawn through this scroller windows its rows from scroll events, and a pinned header reads them too, so the host's
 // listener hears each one as well as the sheet's pan.
 const listener=typeof props.onScroll==='function'?props.onScroll as (event:{nativeEvent:unknown;timeStamp:number})=>void:undefined;
 const notifyScroll=useCallback((nativeEvent:unknown)=>listener?.({nativeEvent,timeStamp:Date.now()}),[listener]);
 const hasListener=!!listener;
 const onScroll=useAnimatedScrollHandler(event=>{'worklet';scrollY.value=event.contentOffset.y;if(hasListener)runOnJS(notifyScroll)(event);},[hasListener,notifyScroll]);
 const animatedProps=useAnimatedProps(()=>{'worklet';return {scrollEnabled:atTop.value};});
 return <GestureDetector gesture={native}><Reanimated.ScrollView showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps='handled' {...props} ref={ref} bounces={false} overScrollMode='never' scrollEventThrottle={16} onScroll={onScroll} animatedProps={animatedProps}/></GestureDetector>;
});


const focusOn=(node:FocusTarget)=>{if(!node)return;try{const handle=findNodeHandle(node);if(handle!=null){AccessibilityInfo.setAccessibilityFocus(handle);if(Platform.OS==='android')AccessibilityInfo.sendAccessibilityEvent(node,'viewHoverEnter');}}catch{/* A detached focus target cannot block the sheet. */}};
const OFFSCREEN=100000;

/** The sheet itself. It lives in the host's layer (modal) or in place (inline), so a parent re-render reaches it only through the props below. */
function Surface({open,onOpenChange,title,description,children,contentMode='default',titleRef,returnFocusRef,labelledBy,closeLabel,dismissible=true,presentation='modal',onDismiss,onChange,onHardwareBackPress,topInset,bottomInset,handle=true,backgroundStyle,raised=true,backdropOpacity=1,testID,snapPoints,initialIndex=0,enableDynamicSizing=false,maxDynamicContentSize,onClosed,hostHeight,backdropVisible}:GestureSheetProps&{backdropVisible:boolean;onClosed:()=>void;hostHeight?:number}){
 const env=useHIG(),colors=useColors(),insets=useSafeAreaInsets();
 const top=topInset??insets.top,bottom=bottomInset??insets.bottom;
 const id=(part:string)=>testID===undefined?undefined:part?`${testID}-${part}`:testID;
 const heading=useRef<React.ComponentRef<typeof RNText>>(null);
 const latest=useRef({open,onOpenChange,onDismiss,onChange,onHardwareBackPress,onClosed,returnFocusRef,titleRef,contentMode});latest.current={open,onOpenChange,onDismiss,onChange,onHardwareBackPress,onClosed,returnFocusRef,titleRef,contentMode};
 // Layout the JS side needs: the room under the top inset sizes the content box. It changes on rotation and when Android resizes the window for the keyboard, not while the sheet moves.
 const [room,setRoom]=useState(()=>Math.max(0,(hostHeight??0)-top));
 const roomValue=useSharedValue(room),contentHeight=useSharedValue(0),position=useSharedValue(OFFSCREEN),dragStart=useSharedValue(0),rebase=useSharedValue(0),scrolled=useSharedValue(false),dragging=useSharedValue(false),closing=useSharedValue(false),shown=useSharedValue(open),keyboard=useSharedValue(0),kick=useSharedValue(0);
 const points=useSharedValue<readonly SheetSnapPoint[]>(snapPoints??[]),dynamic=useSharedValue(enableDynamicSizing),ceiling=useSharedValue(maxDynamicContentSize??0),canDismiss=useSharedValue(dismissible),reduce=useSharedValue(env.reducedMotion);
 const detentCount=enableDynamicSizing?1:(snapPoints??[]).length;
 const active=useSharedValue(Math.max(0,Math.min(initialIndex,detentCount-1)));
 const scrollY=useSharedValue(0),scrollers=useSharedValue(0);
 // The wait before a travel the host asked for: 0 none, 1 waiting to open, 2 clear to open, 3 waiting to close, 4 clear to close. `launch` is a ticket that cancels a wait.
 const primed=useSharedValue(0),launch=useSharedValue(0);
 const pixel=PixelRatio.get();
 const pointsKey=JSON.stringify(snapPoints??[]);
 useEffect(()=>{points.value=snapPoints??[];dynamic.value=enableDynamicSizing;ceiling.value=maxDynamicContentSize??0;canDismiss.value=dismissible;reduce.value=env.reducedMotion;},[pointsKey,enableDynamicSizing,maxDynamicContentSize,dismissible,env.reducedMotion]);
 // translateY of each detent, tallest first. Empty until the sheet knows its room (and, sized by content, its content).
 const positions=useDerivedValue(()=>{
  'worklet';
  const space=roomValue.value;if(space<=0)return [] as number[];
  const heights=dynamic.value?(contentHeight.value>0?[Math.min(contentHeight.value,ceiling.value>0?Math.min(ceiling.value,space):space)]:[]):detentHeights(points.value,space);
  const result:number[]=[];for(let index=heights.length-1;index>=0;index--)result.push(space-heights[index]);
  return result;
 });
 const atTop=useDerivedValue(()=>{'worklet';return positions.value.length===0||position.value<=positions.value[0]+0.5;});
 const reported=useRef(-1);
 const settled=useCallback((index:number)=>{
  if(!latest.current.open||reported.current===index)return;
  reported.current=index;latest.current.onChange?.(index);
 },[]);
 const requested=useRef(false);
 const requestClose=useCallback(()=>{
  if(requested.current||!latest.current.open)return;requested.current=true;latest.current.onOpenChange(false);
  // A host may decline, for example to pop a pushed view first. A tap or an escape has no closing motion to end, so the
  // sheet listens again a frame later if it is still open.
  requestAnimationFrame(()=>{if(latest.current.open)requested.current=false;});
 },[]);
 // An inline sheet first mounts closed. Only a sheet that was shown can be dismissed.
 const presented=useRef(false),closeFrame=useRef<number|null>(null);
 const finishClose=useCallback(()=>{
  // One frame for a host that answers `onOpenChange(false)` asynchronously, then: still open means the dismissal was rejected and the sheet returns to its detent.
  if(closeFrame.current!==null)cancelAnimationFrame(closeFrame.current);
  closeFrame.current=requestAnimationFrame(()=>{
   closeFrame.current=null;requested.current=false;closing.value=false;
   if(latest.current.open){kick.value+=1;return;}
   if(!presented.current)return;
   presented.current=false;reported.current=-1;
   focusOn(latest.current.returnFocusRef?.current??null);latest.current.onDismiss?.();latest.current.onClosed();
  });
 },[closing,kick]);
 useEffect(()=>()=>{if(closeFrame.current!==null)cancelAnimationFrame(closeFrame.current);},[]);
 useEffect(()=>{requested.current=false;shown.value=open;if(open){presented.current=true;reported.current=-1;active.value=Math.max(0,Math.min(initialIndex,detentCount-1));}},[open]);
 // Open focus: once per presentation, after the first frame so the content exists.
 useEffect(()=>{if(!open)return;const frame=requestAnimationFrame(()=>focusOn(latest.current.contentMode==='custom'?(latest.current.titleRef?.current??heading.current):heading.current));return()=>cancelAnimationFrame(frame);},[open]);
 useEffect(()=>{if(!open)return;const subscription=BackHandler.addEventListener('hardwareBackPress',()=>{if(latest.current.onHardwareBackPress)return latest.current.onHardwareBackPress();if(dismissible)requestClose();return true;});return()=>subscription.remove();},[open,dismissible,requestClose]);
 // iOS lifts the sheet over the keyboard. Android resizes the window instead, which arrives here as a new room.
 useEffect(()=>{if(Platform.OS!=='ios')return;const show=Keyboard.addListener('keyboardWillShow',event=>{keyboard.value=withTiming(event.endCoordinates.height,{duration:event.duration||250});}),hide=Keyboard.addListener('keyboardWillHide',event=>{keyboard.value=withTiming(0,{duration:event.duration||250});});return()=>{show.remove();hide.remove();};},[keyboard]);
 // The one place the sheet is told where to rest: opening, closing, a new detent set and content that changed height all arrive here and become one timed transition on the UI thread.
 useAnimatedReaction(()=>{
  'worklet';
  const list=positions.value,space=roomValue.value;
  if(space<=0)return {target:-1,kick:kick.value,index:active.value};
  if(!shown.value)return {target:space,kick:kick.value,index:active.value};
  if(list.length===0)return {target:-1,kick:kick.value,index:active.value};
  const index=Math.max(0,Math.min(list.length-1,active.value));return {target:list[list.length-1-index],kick:kick.value,index};
 },(next,previous)=>{
  'worklet';
  const target=next.target;
  if(target<0||dragging.value||(previous!==null&&target===previous.target&&next.kick===previous.kick&&next.index===previous.index))return;
  const space=roomValue.value;
  if(position.value>space)position.value=space;
  const closes=target>=space;
  if(closes&&closing.value)return;
  // The same detent at a new offset is the content or the room changing size: the sheet follows on the resize curve. Opening, closing and a change of detent travel.
  const resizes=previous!==null&&!closes&&previous.target>=0&&previous.target<space&&next.index===previous.index&&next.kick===previous.kick;
  const motion={...(resizes?gestureSheetResize:gestureSheetTravel),reduceMotion:reduce.value?ReduceMotion.Always:ReduceMotion.System};
  // A travel the host asks for arrives with a render: opening, the content has only just been mounted; closing, the screen
  // behind is often drawn again. The frame that render is drawn in is the costly one (text is laid out, images are
  // decoded, vector canvases are rasterised), so the sheet holds still for two display frames and only then moves. The
  // travel never starts with a stall, and the wait is counted in frames, not time: a slow frame holds the second
  // callback back for as long as it takes. A release from a drag is not held; it carries on from the finger.
  const opens=!closes&&position.value>=space;
  if(opens||closes){
   const waiting=closes?3:1;
   if(primed.value!==waiting+1){
    if(primed.value!==waiting){
     primed.value=waiting;
     const ticket=launch.value+1;launch.value=ticket;
     requestAnimationFrame(()=>{requestAnimationFrame(()=>{if(launch.value===ticket){primed.value=waiting+1;kick.value+=1;}});});
    }
    return;
   }
  }
  // Anything else supersedes a wait that was still running.
  if(primed.value!==0){primed.value=0;launch.value+=1;}
  if(closes){closing.value=true;position.value=withTiming(target,motion,finished=>{'worklet';if(finished)runOnJS(finishClose)();});return;}
  const index=next.index;active.value=index;
  position.value=withTiming(target,motion,finished=>{'worklet';if(finished)runOnJS(settled)(index);});
 });
 const pan=useMemo(()=>Gesture.Pan().activeOffsetY([-6,6]).failOffsetX([-28,28])
  .onStart(()=>{'worklet';cancelAnimation(position);dragStart.value=position.value;rebase.value=0;scrolled.value=false;dragging.value=true;closing.value=false;primed.value=0;launch.value+=1;})
  .onChange(event=>{
   'worklet';
   const list=positions.value;if(list.length===0)return;
   const space=roomValue.value,highest=list[0],lowest=list[list.length-1];
   // At the top detent with the content scrolled, the scroller owns the drag. The sheet holds still and the drag is rebased, so it picks up from here once the content is back at its top.
   if(scrollers.value>0&&dragStart.value<=highest+0.5&&(scrollY.value>0||event.translationY-rebase.value<0)){if(scrollY.value>0)scrolled.value=true;rebase.value=event.translationY;position.value=highest;return;}
   position.value=dragPosition(dragStart.value+event.translationY-rebase.value,highest,lowest,space,canDismiss.value);
  })
  .onEnd(event=>{
   'worklet';
   dragging.value=false;
   const list=positions.value;if(list.length===0)return;
   const space=roomValue.value,target=releaseTarget(position.value,event.velocityY,list,space,canDismiss.value,dragStart.value,scrolled.value,space);
   const motion={...gestureSheetTravel,reduceMotion:reduce.value?ReduceMotion.Always:ReduceMotion.System};
   if(target<0){closing.value=true;runOnJS(requestClose)();position.value=withTiming(space,motion,finished=>{'worklet';if(finished)runOnJS(finishClose)();});return;}
   const index=list.length-1-target;active.value=index;
   position.value=withTiming(list[target],motion,finished=>{'worklet';if(finished)runOnJS(settled)(index);});
  })
  .onFinalize(()=>{'worklet';dragging.value=false;}),[]);
 const scroll=useMemo<ScrollValue>(()=>({pan,scrollY,scrollers,atTop}),[pan,scrollY,scrollers,atTop]);
 // Only transforms and opacity change while the sheet moves, so no frame lays anything out. The sheet sits on whole device
 // pixels, in flight and at rest: its content is one texture on Android, and a texture held between pixels is drawn soft.
 const surfaceStyle=useAnimatedStyle(()=>{'worklet';return {transform:[{translateY:Math.round(Math.max(0,position.value-keyboard.value)*pixel)/pixel}]};});
 const backdropStyle=useAnimatedStyle(()=>{'worklet';const list=positions.value,space=roomValue.value;return {opacity:list.length===0?0:backdropProgress(position.value,list[list.length-1],space)*backdropOpacity};});
 const onRoom=useCallback((event:LayoutChangeEvent)=>{const next=Math.max(0,event.nativeEvent.layout.height-top);roomValue.value=next;setRoom(current=>current===next?current:next);},[top,roomValue]);
 const onContent=useCallback((event:LayoutChangeEvent)=>{contentHeight.value=event.nativeEvent.layout.height;},[contentHeight]);
 const tallest=useMemo(()=>enableDynamicSizing?0:Math.max(0,...detentHeights(snapPoints??[],room)),[enableDynamicSizing,pointsKey,room]);
 const limit=enableDynamicSizing?(maxDynamicContentSize?Math.min(maxDynamicContentSize,room):room):tallest;
 const modal=presentation==='modal';
 const accessibility={...(modal?{accessibilityViewIsModal:true,onAccessibilityEscape:dismissible?requestClose:undefined}:{accessibilityElementsHidden:!open,importantForAccessibility:open?'auto' as const:'no-hide-descendants' as const}),...(labelledBy?{accessibilityLabelledBy:labelledBy}:{})};
 const hiddenTitle=!titleRef?<Heading ref={heading} accessible accessibilityLabel={title} style={styles.hidden}>{title}</Heading>:null;
 const content=contentMode==='custom'
  ?<View {...accessibility} testID={id('content')} collapsable={false} style={[enableDynamicSizing?styles.shrink:styles.grow,{paddingHorizontal:16,direction:env.direction}]}>{hiddenTitle}{children}</View>
  :<GestureSheetScrollView {...accessibility} testID={id('content')} style={enableDynamicSizing?styles.shrink:styles.grow} contentContainerStyle={{paddingVertical:tokens.space.xl,paddingHorizontal:16,paddingBottom:tokens.space.xl+bottom,direction:env.direction}}><Stack><Heading ref={heading}>{title}</Heading>{description?<Text>{description}</Text>:null}{children}<Button intent='secondary' onPress={requestClose}>{closeLabel??env.messages.close??en.close}</Button></Stack></GestureSheetScrollView>;
 const painted=StyleSheet.flatten(backgroundStyle)?.backgroundColor,surfaceColor=typeof painted==='string'?painted:colors.overlay;
 const lifted=<GestureSheetSurfaceContext.Provider value={surfaceColor}><GestureSheetHeaderContext.Provider value={contentMode}><Raised raised={raised}>{content}</Raised></GestureSheetHeaderContext.Provider></GestureSheetSurfaceContext.Provider>;
 return <View testID={id('')} pointerEvents={open?'box-none':'none'} style={StyleSheet.absoluteFill} onLayout={onRoom}>
  {backdropOpacity>0?<Reanimated.View testID={id('backdrop')} pointerEvents={open?'auto':'none'} style={[StyleSheet.absoluteFill,backdropStyle]}>{backdropVisible&&<BackdropBlur/>}<Pressable accessible={false} importantForAccessibility='no' style={[styles.fill,styles.backdrop]} onPress={dismissible?requestClose:undefined}/></Reanimated.View>:null}
  <GestureDetector gesture={pan}>
   <Reanimated.View testID={id('surface')} renderToHardwareTextureAndroid style={[styles.surface,{top,backgroundColor:colors.overlay,borderTopLeftRadius:48,borderTopRightRadius:48},backgroundStyle,surfaceStyle]}>
    {room>0?<ScrollContext.Provider value={scroll}>
     <View onLayout={onContent} style={[enableDynamicSizing?{maxHeight:limit}:{height:limit},contentMode==='custom'?{paddingBottom:bottom}:null]}>
      {handle?<View testID={id('handle')} accessible={false} importantForAccessibility='no' style={styles.handle}><View style={sheetGripStyle(colors.action)}/></View>:null}
      {lifted}
     </View>
    </ScrollContext.Provider>:null}
   </Reanimated.View>
  </GestureDetector>
 </View>;
}

/**
 * HIG's own sheet, one engine for iOS and Android: Reanimated moves it and Gesture Handler reads the finger, both on the UI
 * thread. While it moves only a transform and the backdrop's opacity change, so content of any weight costs no layout per frame.
 * Host supplies GestureHandlerRootView, SafeAreaProvider and, for modal sheets, GestureSheetHost.
 */
export const GestureSheet=React.memo(function GestureSheet(props:GestureSheetProps){
 if(!props.enableDynamicSizing)validateSnapPoints(props.snapPoints??[],props.initialIndex);
 if(props.enableDynamicSizing&&props.snapPoints!==undefined)throw new Error('Content-sized GestureSheet does not accept fixed snapPoints.');
 if(!props.enableDynamicSizing&&(props.snapPoints??[]).length===0)throw new Error('GestureSheet requires at least one snap point.');
 if(props.maxDynamicContentSize!==undefined&&(!Number.isFinite(props.maxDynamicContentSize)||props.maxDynamicContentSize<=0))throw new Error('GestureSheet maxDynamicContentSize must be finite and greater than zero.');
 const host=useContext(HostContext),key=useId(),inline=props.presentation==='inline'||!host;
 // A modal sheet stays mounted from the moment it opens until its closing motion has finished.
 const [mounted,setMounted]=useState(props.open);
 if(props.open&&!mounted)setMounted(true);
 const onClosed=useCallback(()=>setMounted(false),[]);
 const surface=<Surface {...props} backdropVisible={mounted||props.open} hostHeight={inline?undefined:host.height.current} onClosed={onClosed}/>;
 useEffect(()=>{if(inline||!host)return;if(mounted)host.show(key,surface);else host.hide(key);});
 useEffect(()=>()=>{if(host)host.hide(key);},[host,key]);
 if(!inline)return null;
 return props.presentation==='inline'||mounted?surface:null;
});

const styles=StyleSheet.create({
 fill:{flex:1},
 backdrop:{backgroundColor:'#000b'},
 surface:{position:'absolute',left:0,right:0,bottom:0,overflow:'hidden'},
 handle:{alignItems:'center',...sheetHandlePadding},
 grow:{flex:1,minHeight:0},
 shrink:{flexShrink:1,minHeight:0},
 hidden:{position:'absolute',width:1,height:1,overflow:'hidden'},
});
