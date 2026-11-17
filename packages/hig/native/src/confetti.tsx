import React,{useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {AccessibilityInfo,Dimensions,StyleSheet,View,type LayoutChangeEvent,type StyleProp,type ViewStyle} from 'react-native';
import Reanimated,{cancelAnimation,Easing,ReduceMotion,runOnJS,useAnimatedStyle,useSharedValue,withTiming,type SharedValue} from 'react-native-reanimated';
import {CONFETTI_FIRST_TICK,confettiBox,confettiBursts,confettiDuration,confettiOpacity,confettiPose,confettiSkipped,confettiStarWedge,createConfettiBurst,type ConfettiBurst,type ConfettiOptions,type ConfettiParticle,type ConfettiPhysics} from '@bloxwap/hig/contracts/confetti';
import {useColors,useHIG} from './provider.js';
export {mirrorConfetti,type ConfettiOptions,type ConfettiShape} from '@bloxwap/hig/contracts/confetti';
/**
 * HIG's own confetti on Reanimated, with no third-party confetti package. `confetti(options)` fires one burst in the most
 * recently mounted `Confetti` and resolves when it has finished; the options are canvas-confetti's. React renders once when
 * a burst starts and once when it ends. In between one clock per burst runs on the UI thread and every piece, a plain
 * view, reads its transform and opacity from it: nothing is laid out and nothing crosses to JavaScript per frame. The
 * flight itself is `@bloxwap/hig/contracts/confetti`, shared with web.
 */
interface Host {fire:(options?:ConfettiOptions)=>Promise<void>;reset:()=>void;stop:()=>void}
interface Run {id:number;burst:ConfettiBurst;/** The burst's origin in the layer, in points. */left:number;top:number}
interface Wait {options:ConfettiOptions|undefined;resolve:()=>void}
const hosts:Host[]=[];
let sequence=0;
// The sides of a star's triangles that must not show. Android Fabric reads colour 0 ('transparent') as unset and would draw
// them in the default colour; clear white is non-zero there and still invisible.
const clear='#ffffff00';
const fifths=[0,1,2,3,4] as const;
/**
 * A star without an SVG package: the five triangles of `confettiStarWedge`, each a view with no size whose bottom border
 * is the triangle, turned about the middle of its base, which is the star's centre. They never change after mount.
 */
function starWedges(size:number,color:string):ViewStyle[]{
 const width=confettiStarWedge.width*size,height=confettiStarWedge.height*size;
 return fifths.map(fifth=>({position:'absolute',left:height-width/2,top:0,width:0,height:0,borderLeftWidth:width/2,borderRightWidth:width/2,borderBottomWidth:height,borderLeftColor:clear,borderRightColor:clear,borderBottomColor:color,transform:[{translateY:height/2},{rotate:`${fifth*72}deg`},{translateY:-height/2}]}));
}
const Piece=React.memo(function Piece({particle,physics,clock,left,top,color}:{particle:ConfettiParticle;physics:ConfettiPhysics;clock:SharedValue<number>;left:number;top:number;color:string}){
 const box=confettiBox(particle.shape,physics),half=box/2;
 // Transform and opacity only: the view keeps its layout for the whole flight.
 const motion=useAnimatedStyle(()=>{
  'worklet';
  const pose=confettiPose(particle,physics,clock.value);
  return {opacity:confettiOpacity(physics,clock.value),transform:[{translateX:left+pose.x-half},{translateY:top+pose.y-half},{rotate:`${pose.rotate}rad`},{scaleX:pose.scaleX},{scaleY:pose.scaleY}]};
 });
 // The triangles overlap at the centre, so the star fades as one picture, not triangle by triangle.
 if(particle.shape==='star')return <Reanimated.View needsOffscreenAlphaCompositing style={[styles.piece,{width:box,height:box},motion]}>{starWedges(physics.size,color).map((wedge,fifth)=><View key={fifth} style={wedge}/>)}</Reanimated.View>;
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
 /** Stops every burst now, also one still waiting for its layer, removes its views and resolves their promises. */
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
 *
 * HIGProvider learns the system's reduced motion setting a moment after it mounts. So a burst asked for while this layer
 * mounts (a truthy `trigger`, or `confetti()` in a mount effect) waits until the layer has asked the system too, and is
 * then drawn only if the provider says motion is wanted.
 */
export function Confetti({trigger,options,style,testID}:ConfettiProps){
 const colors=useColors();const {reducedMotion}=useHIG();
 const [runs,setRuns]=useState<readonly Run[]>([]);
 const [settled,setSettled]=useState(false);
 const room=useRef<{width:number;height:number}|null>(null),pending=useRef(new Map<number,()=>void>()),waiting=useRef<Wait[]>([]),ready=useRef(false),palette=useRef<readonly string[]>([]),motion=useRef(reducedMotion),latest=useRef(options),fired=useRef<unknown>(undefined);
 palette.current=useMemo(()=>[colors.action,colors.info,colors.down,colors.warning,colors.up],[colors]);
 motion.current=reducedMotion;latest.current=options;
 const settle=useCallback(()=>{const over=[...waiting.current.splice(0).map(wait=>wait.resolve),...pending.current.values()];pending.current.clear();for(const resolve of over)resolve();},[]);
 const end=useCallback((id:number)=>{
  setRuns(current=>current.some(run=>run.id===id)?current.filter(run=>run.id!==id):current);
  const resolve=pending.current.get(id);if(resolve){pending.current.delete(id);resolve();}
 },[]);
 const launch=useCallback((burstOptions?:ConfettiOptions)=>{
  if(pending.current.size>=8||confettiSkipped(burstOptions,motion.current))return Promise.resolve();
  const burst=createConfettiBurst(burstOptions,palette.current);
  if(burst.particles.length===0)return Promise.resolve();
  // Before the layer has been laid out the window stands in for it.
  const {width,height}=room.current??Dimensions.get('window'),id=++sequence;
  return new Promise<void>(resolve=>{pending.current.set(id,resolve);setRuns(current=>[...current,{id,burst,left:burst.origin.x*width,top:burst.origin.y*height}]);});
 },[]);
 // Until the layer can answer for reduced motion a burst waits, a moment at most.
 const fire=useCallback((burstOptions?:ConfettiOptions)=>ready.current?launch(burstOptions):new Promise<void>(resolve=>{if(waiting.current.length>=8){resolve();return;}waiting.current.push({options:burstOptions,resolve});}),[launch]);
 const begin=useCallback(()=>{ready.current=true;for(const wait of waiting.current.splice(0))void launch(wait.options).then(wait.resolve);},[launch]);
 const reset=useCallback(()=>{setRuns(current=>current.length?[]:current);settle();},[settle]);
 // One host for the life of the component, so a burst it holds survives React running the effects twice in development.
 const host=useMemo<Host>(()=>({fire,reset,stop:settle}),[fire,reset,settle]);
 useEffect(()=>{
  hosts.push(host);
  // Only a host that stays out is gone; its promises then resolve.
  return()=>{const index=hosts.indexOf(host);if(index>=0)hosts.splice(index,1);void Promise.resolve().then(()=>{if(!hosts.includes(host))host.stop();});};
 },[host]);
 useEffect(()=>{
  if(ready.current)return;
  // Asked after the provider's own question, so the answer comes after the provider's. Without a system request for
  // reduced motion the provider has nothing left to learn. With one, the update below is rendered no sooner than the
  // provider's, and the effect after it sees what the provider decided.
  let alive=true;const known=(reduced:boolean)=>{if(!alive)return;if(reduced)setSettled(true);else begin();};
  void Promise.resolve().then(()=>AccessibilityInfo.isReduceMotionEnabled()).then(known,()=>known(false));
  return()=>{alive=false;};
 },[begin]);
 useEffect(()=>{if(settled)begin();},[settled,begin]);
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
