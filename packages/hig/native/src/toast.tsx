import React,{memo,useCallback,useContext,useEffect,useMemo,useRef,useState,useSyncExternalStore} from 'react';
import {AccessibilityInfo,AppState,StyleSheet,View,useWindowDimensions,type LayoutChangeEvent} from 'react-native';
import Reanimated,{cancelAnimation,Easing,ReduceMotion,runOnJS,useAnimatedReaction,useAnimatedStyle,useSharedValue,withSpring,withTiming,type SharedValue} from 'react-native-reanimated';
import {Gesture,GestureDetector} from 'react-native-gesture-handler';
import {SafeAreaInsetsContext} from 'react-native-safe-area-context';
import * as en from '@bloxwap/hig/contracts/messages';
import {notificationDelta} from '@bloxwap/hig/contracts/announcements';
import {TOAST_DURATION,TOAST_EXIT,TOAST_GAP,TOAST_HOLD,TOAST_MOTION,TOAST_NARROW,TOAST_NARROW_OFFSET,TOAST_OFFSET,TOAST_REDUCED_FADE,TOAST_SPRING,TOAST_VISIBLE,TOAST_WIDTH,toastClockPause,toastClockRun,toastDrag,toastDuration,toastEdge,toastEnterFrom,toastExitTo,toastGrab,toastLeave,toastOrder,toastRemove,toastSlot,toastSwipeAxis,toastSwipeDirections,toastSwipeDismisses,toastSwipeOut,toastUpsert,type ToastBaseOptions,type ToastCall,type ToastClock,type ToastEntry,type ToastId,type ToastPosition,type ToastSeverity,type ToastSwipeDirection} from '@bloxwap/hig/contracts/toast';
import {useColors,useHIG} from './provider.js';
import {ToastNotice} from './status.js';
import {speak} from './announce.js';
export type {ToastBaseOptions,ToastCall,ToastId,ToastPosition,ToastSeverity,ToastSwipeDirection} from '@bloxwap/hig/contracts/toast';

export interface ToastOptions extends ToastBaseOptions {/** A control drawn before the close button, such as a `Button` that retries. */action?:React.ReactNode}
export interface ToasterProps {
 /** The corner or edge the stack hangs from. Default `bottom-center`, as on web. `left` and `right` are the physical sides in either direction, as in Sonner; only the capsule's content mirrors under right-to-left. */
 position?:ToastPosition;
 /** Draws the visible notices one after another instead of as a collapsed stack. Default `false`. A finger resting on a notice for 200ms expands the stack until it lifts, and a running screen reader keeps it expanded so every notice can be reached. */
 expand?:boolean;
 /** Notices drawn at once; older ones wait behind them and their time does not run. Default 3; anything below 1 or not a number shows one. */
 visibleToasts?:number;
 /** Points between notices when expanded, and how far each notice behind the front peeks out when collapsed. Default 14. */
 gap?:number;
 /** Points between the stack and the screen edges, added to the safe-area insets: one number for every edge, or an object naming edges, the others keeping the default. Default 16 on a window narrower than 600 points and 24 otherwise. `left` and `right` are the physical sides, like `position`. */
 offset?:number|{top?:number;right?:number;bottom?:number;left?:number};
 /** Milliseconds a notice stays when `toast()` names no `duration`. Default 4000, which also stands in for a value that is not a positive number. */
 duration?:number;
 /** Directions a swipe dismisses in. Default: towards the edges the stack sits against (`bottom-center` → down; `top-right` → up and right). */
 swipeDirections?:readonly ToastSwipeDirection[];
 /** Prefix of the test IDs: `<testID>` on the layer and `<testID>-toast` on each notice. */
 testID?:string;
}

interface ToastValue {message:string;description?:string;severity:ToastSeverity;action?:React.ReactNode;dismissName?:string;onDismiss?:()=>void;onAutoClose?:()=>void}
type Entry=ToastEntry<ToastValue>;
// One store for the app, so `toast()` works from anywhere, not only from components. Mounted hosts subscribe; the last one mounted draws.
let entries:readonly Entry[]=[],sequence=0;
const listeners=new Set<()=>void>(),hosts:object[]=[];
const emit=()=>{for(const listener of [...listeners])listener();};
const subscribe=(listener:()=>void)=>{listeners.add(listener);return()=>{listeners.delete(listener);};};
const snapshot=()=>entries;
function attach(host:object):()=>void{
 hosts.push(host);emit();
 return()=>{hosts.splice(hosts.indexOf(host),1);
  // Notices on their way out have nobody left to finish them.
  if(hosts.length===0)entries=entries.filter(entry=>!entry.leaving);
  emit();};
}
/** Starts one notice's exit and tells its owner why: its time ran out (`expired`), or it was dismissed. The host removes it when the exit has played. */
function leave(key:number,expired:boolean):void{
 const entry=entries.find(candidate=>candidate.key===key);if(!entry||entry.leaving)return;
 entries=toastLeave(entries,entry.id);emit();
 if(expired)entry.value.onAutoClose?.();else entry.value.onDismiss?.();
}
function forget(key:number):void{const next=toastRemove(entries,key);if(next!==entries){entries=next;emit();}}
function raise(message:string,options:ToastOptions={}):ToastId{
 const {severity='info',description,action,dismissName,duration,id,onDismiss,onAutoClose}=options;
 // As in Sonner, an empty string is not an id: the notice gets the next one.
 const key=++sequence,resolved=typeof id==='number'||(typeof id==='string'&&id.length>0)?id:key;
 entries=toastUpsert(entries,{key,id:resolved,duration:toastDuration(duration),value:{message,description,severity,action,dismissName,onDismiss,onAutoClose}});emit();
 return resolved;
}
/** Dismisses one notice by id, or every notice when the id is omitted. */
export function dismissToast(id?:ToastId):void{
 const next=toastLeave(entries,id);if(next===entries)return;
 const dismissed=next.filter((entry,index)=>entry.leaving&&!entries[index].leaving);
 // Without a mounted Toaster nothing can play the exit, so they go at once.
 entries=hosts.length>0?next:next.filter(entry=>!entry.leaving);emit();
 for(const entry of dismissed)entry.value.onDismiss?.();
}
const as=(severity:ToastSeverity)=>(message:string,options?:Omit<ToastOptions,'severity'>):ToastId=>raise(message,{...options,severity});
/**
 * Raises a transient HIG capsule on the mounted `Toaster` and returns its id. Callable from anywhere. `toast.success`,
 * `toast.error`, `toast.warning` and `toast.info` set the severity; `toast.dismiss` is `dismissToast`. The same call,
 * options and names work in `@bloxwap/hig/react/toast`.
 */
export const toast:ToastCall<ToastOptions>=Object.assign(raise,{success:as('success'),error:as('error'),warning:as('warning'),info:as('info'),dismiss:dismissToast});

// The provider decides reduced motion (it already follows the OS setting), so these timings never defer to the system on their own.
const MOVE={duration:TOAST_MOTION.duration,easing:Easing.bezier(...TOAST_MOTION.curve),reduceMotion:ReduceMotion.Never};
const EXIT={duration:TOAST_EXIT.duration,easing:Easing.bezier(...TOAST_EXIT.curve),reduceMotion:ReduceMotion.Never};
const FADE={duration:TOAST_REDUCED_FADE,easing:Easing.bezier(...TOAST_EXIT.curve),reduceMotion:ReduceMotion.Never};
const NO_INSETS={top:0,right:0,bottom:0,left:0} as const;
interface Stack {keys:number[];heights:number[]}
interface CardProps {
 entry:Entry;front:boolean;hidden:boolean;interactive:boolean;lift:1|-1;gap:number;visible:number;reduce:boolean;
 left:boolean;right:boolean;up:boolean;down:boolean;narrow:boolean;testID?:string;
 stack:SharedValue<Stack>;expanded:SharedValue<boolean>;held:SharedValue<boolean>;
 report:(key:number,height:number)=>void;hold:(key:number,down:boolean)=>void;
}
/**
 * One notice in the stack. React renders it when the store changes; everything that moves it runs on the UI thread. Its
 * slot comes from the shared stack, so a notice arriving, leaving or changing height restacks every card in one frame
 * without a render, and only transforms and opacity change while it moves.
 */
const Card=memo(function Card({entry,front,hidden,interactive,lift,gap,visible,reduce,left,right,up,down,narrow,testID,stack,expanded,held,report,hold}:CardProps){
 const id=entry.key,{leaving,value}=entry,colors=useColors();
 const y=useSharedValue(0),scaleX=useSharedValue(1),scaleY=useSharedValue(1),opacity=useSharedValue(0),content=useSharedValue(1),dragX=useSharedValue(0),dragY=useSharedValue(0);
 // 0: laid out but not placed yet. 1: in the stack. 2: leaving, so nothing may pull it back.
 const phase=useSharedValue(0),gone=useSharedValue(false);
 const rest=useSharedValue({y:0,height:0,index:-1}),size=useSharedValue({width:0,height:0});
 // The axis a drag is locked to (0 none, 1 horizontal, 2 vertical) and the translation that counts as rest, so the notice does not jump by the recognition distance.
 const axis=useSharedValue(0),origin=useSharedValue(0);
 useAnimatedReaction(()=>{
  'worklet';
  const {keys,heights}=stack.value,index=keys.indexOf(id);
  const slot=toastSlot(index,heights,expanded.value||held.value,gap,visible,lift);
  return {index,height:index<0?0:heights[index],y:slot.y,scaleX:slot.scaleX,scaleY:slot.scaleY,opacity:slot.opacity,content:slot.content};
 },(next,previous)=>{
  'worklet';
  if(next.index<0||phase.value===2)return;
  rest.value={y:next.y,height:next.height,index:next.index};
  // What it was drawn at, when it was already in the stack: only what differs from that moves, so a restack that leaves a notice where it is costs it nothing.
  const was=phase.value===1&&previous!==null&&previous.index>=0?previous:null;
  if(phase.value===0){
   phase.value=1;
   // The front slides in from its own height away; a notice that appears further back fades in where it rests.
   y.value=next.index===0&&!reduce?toastEnterFrom(next.y,next.height,lift):next.y;
   scaleX.value=next.scaleX;scaleY.value=next.scaleY;content.value=next.content;opacity.value=0;
  }
  if(was===null||next.y!==was.y)y.value=reduce?next.y:withTiming(next.y,MOVE);
  if(was===null||next.scaleX!==was.scaleX)scaleX.value=reduce?next.scaleX:withTiming(next.scaleX,MOVE);
  if(was===null||next.scaleY!==was.scaleY)scaleY.value=reduce?next.scaleY:withTiming(next.scaleY,MOVE);
  const fade=reduce?FADE:MOVE;
  if(was===null||next.opacity!==was.opacity)opacity.value=withTiming(next.opacity,fade);
  if(was===null||next.content!==was.content)content.value=withTiming(next.content,fade);
 },[id,gap,visible,lift,reduce]);
 // The exit, unless a swipe has already sent the notice on its way.
 useAnimatedReaction(()=>{'worklet';return gone.value;},(now,before)=>{
  'worklet';
  if(!now||now===before||phase.value===2)return;
  const placed=phase.value===1;phase.value=2;
  if(!placed)return;
  opacity.value=withTiming(0,reduce?FADE:EXIT);
  if(!reduce)y.value=withTiming(toastExitTo(rest.value.y,rest.value.height,lift,rest.value.index===0||expanded.value||held.value),EXIT);
 },[lift,reduce]);
 // The store drops the notice once the exit has had time to play. The exit itself never waits for this thread.
 useEffect(()=>{if(!leaving)return;gone.value=true;const timer=setTimeout(()=>forget(id),TOAST_EXIT.duration+50);return()=>clearTimeout(timer);},[leaving,id,gone]);
 const dismiss=useCallback(()=>leave(id,false),[id]);
 const pan=useMemo(()=>Gesture.Pan().enabled(interactive).activeOffsetX([-8,8]).activeOffsetY([-8,8])
  // A finger on the notice holds every notice's time, whether or not it goes on to swipe.
  .onBegin(()=>{'worklet';runOnJS(hold)(id,true);})
  .onStart(event=>{
   'worklet';
   const horizontal=toastSwipeAxis(event.translationX,event.translationY)==='x';
   axis.value=horizontal?1:2;
   // A notice caught while it springs back carries on from where it is.
   if(horizontal){cancelAnimation(dragX);origin.value=event.translationX-toastGrab(dragX.value,left,right);}
   else{cancelAnimation(dragY);origin.value=event.translationY-toastGrab(dragY.value,up,down);}
  })
  .onChange(event=>{
   'worklet';
   if(phase.value===2)return;
   if(axis.value===1)dragX.value=toastDrag(event.translationX-origin.value,left,right);
   else if(axis.value===2)dragY.value=toastDrag(event.translationY-origin.value,up,down);
  })
  .onEnd((event,success)=>{
   'worklet';
   const horizontal=axis.value===1;axis.value=0;
   if(phase.value===2)return;
   const amount=horizontal?dragX.value:dragY.value,velocity=horizontal?event.velocityX:event.velocityY;
   // A gesture the system took away (a call, the notice pushed behind a new one) is not a decision to dismiss: it goes back to rest.
   if(success!==false&&toastSwipeDismisses(amount,velocity,horizontal?left:up,horizontal?right:down)){
    phase.value=2;
    const out=toastSwipeOut(amount,velocity,horizontal?size.value.width:size.value.height),timing={duration:out.duration,easing:EXIT.easing,reduceMotion:ReduceMotion.Never};
    if(!reduce){if(horizontal)dragX.value=withTiming(out.to,timing);else dragY.value=withTiming(out.to,timing);}
    opacity.value=withTiming(0,reduce?FADE:timing);
    runOnJS(dismiss)();
    return;
   }
   // Not far or fast enough: back to rest on a spring that carries the release velocity.
   const spring={...TOAST_SPRING,velocity,reduceMotion:reduce?ReduceMotion.Always:ReduceMotion.Never};
   if(horizontal)dragX.value=withSpring(0,spring);else dragY.value=withSpring(0,spring);
  })
  .onFinalize(()=>{'worklet';axis.value=0;runOnJS(hold)(id,false);}),[id,interactive,left,right,up,down,reduce,hold,dismiss]);
 const cardStyle=useAnimatedStyle(()=>{'worklet';return {opacity:opacity.value,transform:[{translateX:dragX.value},{translateY:y.value+dragY.value},{scaleX:scaleX.value},{scaleY:scaleY.value}]};});
 const contentStyle=useAnimatedStyle(()=>{'worklet';return {opacity:content.value};});
 const onLayout=useCallback((event:LayoutChangeEvent)=>{const {width,height}=event.nativeEvent.layout;size.value={width,height};report(id,height);},[id,report,size]);
 const name=testID===undefined?undefined:`${testID}-toast`;
 // A notice behind a collapsed stack, or past the visible ones, shows no content: it takes no touches and assistive technology skips it.
 return <GestureDetector gesture={pan}>
  <Reanimated.View testID={name} onLayout={onLayout} pointerEvents={interactive?'auto':'none'} accessibilityElementsHidden={hidden||(!front&&!interactive)} importantForAccessibility={hidden||(!front&&!interactive)?'no-hide-descendants':'auto'} style={[styles.card,lift===1?styles.top:styles.bottom,narrow?styles.narrow:styles.wide,{backgroundColor:colors.nested},cardStyle]}>
   <Reanimated.View style={contentStyle}><ToastNotice message={value.message} description={value.description} severity={value.severity} action={value.action} dismissName={value.dismissName} onDismiss={dismiss} hug style={styles.bare}/></Reanimated.View>
  </Reanimated.View>
 </GestureDetector>;
});

/**
 * The host for transient HIG notices on native. Mount it once, last inside the root view, within HIGProvider,
 * GestureHandlerRootView and SafeAreaProvider; `toast()` then works from anywhere. It draws the same capsule as `Toast`,
 * stacked the way Sonner stacks on web: the newest in front, up to three visible, each leaving after its time, by its
 * close control or by a swipe. A touch holds every notice's time and so does the app going to the background.
 *
 * Reanimated moves the notices and Gesture Handler reads the finger, both on the UI thread; only transforms and opacity
 * change while anything moves. With no notice showing it renders nothing.
 */
export function Toaster({position='bottom-center',expand=false,visibleToasts=TOAST_VISIBLE,gap=TOAST_GAP,offset,duration=TOAST_DURATION,swipeDirections,testID}:ToasterProps){
 const env=useHIG(),insets=useContext(SafeAreaInsetsContext)??NO_INSETS,{width}=useWindowDimensions();
 const token=useRef({}).current;
 const list=useSyncExternalStore(subscribe,snapshot,snapshot),active=useSyncExternalStore(subscribe,()=>hosts[hosts.length-1]===token,()=>false);
 useEffect(()=>attach(token),[token]);
 // A screen reader cannot reach content the collapsed stack hides, so the stack stays expanded while one runs.
 const [reader,setReader]=useState(false);
 useEffect(()=>{let alive=true;void AccessibilityInfo.isScreenReaderEnabled().then(value=>{if(alive&&value)setReader(true);}).catch(()=>{});const subscription=AccessibilityInfo.addEventListener('screenReaderChanged',setReader);return()=>{alive=false;subscription.remove();};},[]);
 const open=expand||reader,visible=visibleToasts>=1?Math.floor(visibleToasts):1;
 const order=useMemo(()=>active?toastOrder(list):[],[active,list]);
 const stack=useSharedValue<Stack>({keys:[],heights:[]}),expanded=useSharedValue(open),held=useSharedValue(false);
 useEffect(()=>{expanded.value=open;},[open,expanded]);
 const heights=useRef(new Map<number,number>()).current,published=useRef<Stack>({keys:[],heights:[]});
 const clocks=useRef(new Map<number,{clock:ToastClock;revision:number;timer:ReturnType<typeof setTimeout>|null}>()).current;
 const holds=useRef(new Set<number>()).current,awake=useRef(AppState.currentState!=='background'&&AppState.currentState!=='inactive');
 const latest=useRef({order,visible,duration});latest.current={order,visible,duration};
 // The stack the UI thread lays out: live notices that have been measured, front first. A new notice joins when its height is known, so nothing moves for it before it can be placed.
 const publish=useCallback(()=>{
  const keys:number[]=[],sizes:number[]=[];
  for(const entry of latest.current.order){const height=heights.get(entry.key);if(height===undefined)continue;keys.push(entry.key);sizes.push(height);}
  const last=published.current;
  if(last.keys.length===keys.length&&keys.every((key,index)=>key===last.keys[index]&&sizes[index]===last.heights[index]))return;
  published.current={keys,heights:sizes};stack.value={keys,heights:sizes};
 },[heights,stack]);
 // A notice's time runs only while it is one of the visible notices, nothing is held and the app is in front. Raising it again under the same id starts its time over.
 const sync=useCallback(()=>{
  const now=Date.now(),paused=holds.size>0||!awake.current,live=new Set<number>();
  latest.current.order.forEach((entry,index)=>{
   const total=entry.duration??toastDuration(latest.current.duration)??TOAST_DURATION;
   if(total===Infinity)return;
   let record=clocks.get(entry.key);
   if(!record||record.revision!==entry.revision){if(record?.timer!=null)clearTimeout(record.timer);record={clock:{remaining:total,startedAt:null},revision:entry.revision,timer:null};clocks.set(entry.key,record);}
   live.add(entry.key);
   const runs=!paused&&index<latest.current.visible&&heights.has(entry.key);
   if(runs&&record.clock.startedAt===null){record.clock=toastClockRun(record.clock,now);record.timer=setTimeout(()=>leave(entry.key,true),record.clock.remaining);}
   else if(!runs&&record.clock.startedAt!==null){record.clock=toastClockPause(record.clock,now);if(record.timer!=null)clearTimeout(record.timer);record.timer=null;}
  });
  for(const [key,record] of clocks)if(!live.has(key)){if(record.timer!=null)clearTimeout(record.timer);clocks.delete(key);}
 },[clocks,heights,holds]);
 const report=useCallback((key:number,height:number)=>{if(heights.get(key)===height)return;heights.set(key,height);publish();sync();},[heights,publish,sync]);
 // Time stops the moment a finger lands. The stack expands only if it stays, so a tap or a quick swipe does not stir it.
 const peek=useRef<ReturnType<typeof setTimeout>|null>(null);
 const settle=useCallback(()=>{
  if(holds.size===0){if(peek.current!==null){clearTimeout(peek.current);peek.current=null;}held.value=false;}
  else if(peek.current===null)peek.current=setTimeout(()=>{held.value=holds.size>0;},TOAST_HOLD);
  sync();
 },[holds,held,sync]);
 // The notices that take touches. A finger reported on any other arrived late, from a notice that has since been pushed out of reach, and is ignored.
 const reach=useRef<ReadonlySet<number>>(new Set());
 const hold=useCallback((key:number,down:boolean)=>{if(!down)holds.delete(key);else if(reach.current.has(key))holds.add(key);settle();},[holds,settle]);
 useEffect(()=>{
  const known=new Set(list.map(entry=>entry.key));
  for(const key of [...heights.keys()])if(!known.has(key))heights.delete(key);
  // Only a notice that takes touches can be holding the time. One that is gone, leaving, or pushed out of reach may never report the finger lifting, and would hold every notice for good.
  const touchable=new Set<number>();latest.current.order.forEach((entry,index)=>{if(index<visible&&(index===0||open))touchable.add(entry.key);});
  reach.current=touchable;
  for(const key of [...holds])if(!touchable.has(key))holds.delete(key);
  // A notice dismissed before it was ever drawn has no exit to play.
  if(active)for(const entry of list)if(entry.leaving&&!heights.has(entry.key))forget(entry.key);
  publish();settle();
 },[active,list,visible,duration,open,heights,holds,publish,settle]);
 useEffect(()=>{const subscription=AppState.addEventListener('change',state=>{awake.current=state==='active';sync();});return()=>subscription.remove();},[sync]);
 useEffect(()=>()=>{for(const record of clocks.values())if(record.timer!=null)clearTimeout(record.timer);clocks.clear();if(peek.current!==null)clearTimeout(peek.current);},[clocks]);
 // One announcement per burst: an error if there is one, otherwise the newest, which is the one drawn in front. A notice that is redrawn unchanged is not read again.
 const spoken=useRef<ReadonlyMap<string,string>>(new Map());
 useEffect(()=>{
  if(!active)return;
  const delta=notificationDelta(spoken.current,[...order].reverse().map(entry=>({id:String(entry.key),message:[entry.value.message,entry.value.description].filter(Boolean).join('. '),severity:entry.value.severity})));
  spoken.current=delta.next;if(delta.message)speak(delta.message,delta.severity);
 },[active,order]);
 const edge=toastEdge(position);
 const directions=useMemo(()=>swipeDirections??toastSwipeDirections(position),[swipeDirections,position]);
 const rank=new Map(order.map((entry,index)=>[entry.key,index]));
 // One notice past the visible ones stays mounted and transparent, so the notice the stack pushes out fades where it is and the one it uncovers is ready.
 const mounted=active?list.filter(entry=>entry.leaving?heights.has(entry.key):rank.get(entry.key)!<=visible):[];
 if(mounted.length===0)return null;
 const narrow=width<TOAST_NARROW,fallback=narrow?TOAST_NARROW_OFFSET:TOAST_OFFSET;
 const distance=(side:'top'|'right'|'bottom'|'left')=>(typeof offset==='object'?offset[side]:offset)??fallback;
 const label=env.messages.notifications??en.notifications;
 // `left` and `right` are physical, as in Sonner. The layer always lays out left to right, so start and end on the rail are the physical left and right whatever the provider or the OS says (React Native swaps `left` and `right` themselves under an RTL OS). The capsule sets the provider's direction on its own row.
 return <View testID={testID} pointerEvents='box-none' style={[StyleSheet.absoluteFill,styles.layer]}>
  <View pointerEvents='box-none' accessibilityLabel={label} style={[styles.rail,{top:insets.top+distance('top'),bottom:insets.bottom+distance('bottom'),start:insets.left+distance('left'),end:insets.right+distance('right'),alignItems:edge.x==='center'?'center':edge.x==='left'?'flex-start':'flex-end'}]}>
   {mounted.map(entry=>{const index=rank.get(entry.key)??-1,hidden=index<0||index>=visible;
    return <Card key={entry.key} entry={entry} front={index===0} hidden={hidden} interactive={!hidden&&!entry.leaving&&(index===0||open)} lift={edge.lift} gap={gap} visible={visible} reduce={env.reducedMotion} left={directions.includes('left')} right={directions.includes('right')} up={directions.includes('top')} down={directions.includes('bottom')} narrow={narrow} testID={testID} stack={stack} expanded={expanded} held={held} report={report} hold={hold}/>;})}
  </View>
 </View>;
}

const styles=StyleSheet.create({
 layer:{direction:'ltr'},
 rail:{position:'absolute'},
 // The capsule's own fill, radius and shadow sit on the moving view, so the content inside can fade without the capsule going with it.
 card:{position:'absolute',borderRadius:22,boxShadow:'0 4px 16px #0006'},
 top:{top:0},
 bottom:{bottom:0},
 narrow:{maxWidth:'100%'},
 wide:{maxWidth:TOAST_WIDTH},
 bare:{backgroundColor:'transparent',boxShadow:undefined},
});
