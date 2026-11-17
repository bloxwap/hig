import React,{useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {Dimensions,StyleSheet,View,type LayoutChangeEvent,type StyleProp,type ViewStyle} from 'react-native';
import Reanimated,{cancelAnimation,Easing,ReduceMotion,runOnJS,useAnimatedStyle,useSharedValue,withTiming,type SharedValue} from 'react-native-reanimated';
import {CONFETTI_FIRST_TICK,confettiBox,confettiBursts,confettiDuration,confettiOpacity,confettiPose,confettiSkipped,createConfettiBurst,type ConfettiBurst,type ConfettiOptions,type ConfettiParticle,type ConfettiPhysics} from '@bloxwap/hig/contracts/confetti';
import {useColors,useHIG} from './provider.js';
export {mirrorConfetti,type ConfettiOptions,type ConfettiShape} from '@bloxwap/hig/contracts/confetti';
/**
 * HIG's own confetti on Reanimated, with no third-party confetti package. `confetti(options)` fires one burst in the most
 * recently mounted `Confetti` and resolves when it has finished; the options are canvas-confetti's. React renders once when
 * a burst starts and once when it ends. In between one clock per burst runs on the UI thread and every piece, a plain
 * view, reads its transform and opacity from it: nothing is laid out and nothing crosses to JavaScript per frame. The
 * flight itself is `@bloxwap/hig/contracts/confetti`, shared with web.
 */
interface Host {fire:(options?:ConfettiOptions)=>Promise<void>;reset:()=>void}
interface Run {id:number;burst:ConfettiBurst;/** The burst's origin in the layer, in points. */left:number;top:number}
const hosts:Host[]=[];
let sequence=0;
/** React Native has no star to draw without an SVG package, so a star flies as a square. */
function drawable(options:ConfettiOptions|undefined):ConfettiOptions|undefined{
 return options?.shapes?.includes('star')?{...options,shapes:options.shapes.map(shape=>shape==='star'?'square':shape)}:options;
}
const Piece=React.memo(function Piece({particle,physics,clock,left,top,color}:{particle:ConfettiParticle;physics:ConfettiPhysics;clock:SharedValue<number>;left:number;top:number;color:string}){
 const box=confettiBox(particle.shape,physics),half=box/2;
 // Transform and opacity only: the view keeps its layout for the whole flight.
 const motion=useAnimatedStyle(()=>{
  'worklet';
  const pose=confettiPose(particle,physics,clock.value);
  return {opacity:confettiOpacity(physics,clock.value),transform:[{translateX:left+pose.x-half},{translateY:top+pose.y-half},{rotate:`${pose.rotate}rad`},{scaleX:pose.scaleX},{scaleY:pose.scaleY}]};
 });
 return <Reanimated.View style={[styles.piece,{width:box,height:box,borderRadius:particle.shape==='circle'?half:0,backgroundColor:color},motion]}/>;
});
const Burst=React.memo(function Burst({run,onEnd}:{run:Run;onEnd:(id:number)=>void}){
 const {id,burst,left,top}=run,{physics,particles,colors}=burst;
 const clock=useSharedValue<number>(CONFETTI_FIRST_TICK);
 useEffect(()=>{
  const end=()=>onEnd(id);
  // One clock moves every piece. It is linear because the physics holds the easing, and it ignores the system's reduced
  // motion setting because the host has already decided whether this burst is drawn.
  clock.value=withTiming(physics.ticks,{duration:confettiDuration(physics),easing:Easing.linear,reduceMotion:ReduceMotion.Never},finished=>{
   'worklet';
   if(finished)runOnJS(end)();
  });
  return()=>cancelAnimation(clock);
 },[clock,id,onEnd,physics]);
 return <>{particles.map((particle,index)=><Piece key={index} particle={particle} physics={physics} clock={clock} left={left} top={top} color={colors[particle.color]}/>)}</>;
});
export interface ConfettiFire {
 /** Fires one burst in the most recently mounted `Confetti` and resolves when it has finished, or at once when nothing is drawn: no `Confetti` is mounted, reduced motion is on (unless `disableForReducedMotion` is false) or the burst has no pieces. */
 (options?:ConfettiOptions):Promise<void>;
 /** Stops every burst now, removes its views and resolves their promises. */
 reset():void;
}
/** Fires a burst of confetti. Call it from an event handler or an effect; mount `Confetti` once first. */
export const confetti:ConfettiFire=Object.assign((options?:ConfettiOptions)=>{const host=hosts[hosts.length-1];return host?host.fire(options):Promise.resolve();},{reset:()=>{for(const host of hosts.slice())host.reset();}});
export interface ConfettiProps {
 /** Fires `options` whenever it is truthy: on mount, and each time it changes to another truthy value. A win count or an order id works. Leave it out to fire only through `confetti()`. */
 trigger?:unknown;
 /** The burst `trigger` fires, or several fired together. Read when `trigger` changes, so it need not be a stable object. */
 options?:ConfettiOptions|readonly ConfettiOptions[];
 /** Merged over the layer, which fills its parent and takes no touches. */
 style?:StyleProp<ViewStyle>;
 /** Test ID of the layer. */
 testID?:string;
}
/**
 * The confetti layer. Mount it once, last inside the screen root and inside HIGProvider, so it covers what it should rain
 * over. Bursts follow the provider's `reducedMotion` and paint its `action`, `info`, `down`, `warning` and `up` colours
 * (Display P3 on an iOS host that paints P3) unless the call names its own. The layer is hidden from assistive technology
 * and stays left-to-right, because confetti is physical: `origin.x` 0 is the left edge in both text directions.
 */
export function Confetti({trigger,options,style,testID}:ConfettiProps){
 const colors=useColors();const {reducedMotion}=useHIG();
 const [runs,setRuns]=useState<readonly Run[]>([]);
 const room=useRef<{width:number;height:number}|null>(null),pending=useRef(new Map<number,()=>void>()),palette=useRef<readonly string[]>([]),motion=useRef(reducedMotion),latest=useRef(options),fired=useRef<unknown>(undefined);
 palette.current=useMemo(()=>[colors.action,colors.info,colors.down,colors.warning,colors.up],[colors]);
 motion.current=reducedMotion;latest.current=options;
 const settle=useCallback(()=>{const waiting=[...pending.current.values()];pending.current.clear();for(const resolve of waiting)resolve();},[]);
 const end=useCallback((id:number)=>{
  setRuns(current=>current.some(run=>run.id===id)?current.filter(run=>run.id!==id):current);
  const resolve=pending.current.get(id);if(resolve){pending.current.delete(id);resolve();}
 },[]);
 const fire=useCallback((burstOptions?:ConfettiOptions)=>{
  if(confettiSkipped(burstOptions,motion.current))return Promise.resolve();
  const burst=createConfettiBurst(drawable(burstOptions),palette.current);
  if(burst.particles.length===0)return Promise.resolve();
  // Before the layer has been laid out the window stands in for it.
  const {width,height}=room.current??Dimensions.get('window'),id=++sequence;
  return new Promise<void>(resolve=>{pending.current.set(id,resolve);setRuns(current=>[...current,{id,burst,left:burst.origin.x*width,top:burst.origin.y*height}]);});
 },[]);
 const reset=useCallback(()=>{setRuns(current=>current.length?[]:current);settle();},[settle]);
 useEffect(()=>{
  const host:Host={fire,reset};hosts.push(host);
  return()=>{const index=hosts.indexOf(host);if(index>=0)hosts.splice(index,1);settle();};
 },[fire,reset,settle]);
 useEffect(()=>{
  // Each truthy value fires once, also when React runs the effect twice in development.
  if(Object.is(fired.current,trigger))return;fired.current=trigger;if(!trigger)return;
  for(const burst of confettiBursts(latest.current))void fire(burst);
 },[trigger,fire]);
 const measure=useCallback((event:LayoutChangeEvent)=>{const {width,height}=event.nativeEvent.layout;room.current={width,height};},[]);
 return <View testID={testID} pointerEvents='none' accessible={false} accessibilityElementsHidden importantForAccessibility='no-hide-descendants' onLayout={measure} style={[styles.layer,style]}>
  {runs.map(run=><Burst key={run.id} run={run} onEnd={end}/>)}
 </View>;
}
const styles=StyleSheet.create({
 layer:{position:'absolute',left:0,right:0,top:0,bottom:0,direction:'ltr'},
 piece:{position:'absolute',left:0,top:0},
});
