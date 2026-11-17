"use client";
import React,{useContext,useEffect,useLayoutEffect,useMemo,useRef,useState} from 'react';
import {type NumberProps} from './data.js';
import {createAnimatedNumberModel,createAnimatedNumberTransitions,createFormattedAnimatedNumberModel,numberFlowPlaces,numberFlowTokenKeys} from './animated-number-model.js';
import {NumberFlowEngine,numberFlowWebMotion,type NumberFlowSpin} from './animated-number-flow.js';
import {numberFlowDeltas,numberFlowDigitLength,numberFlowNeutral,resolveNumberFlowTimings,type NumberFlowDigits,type NumberFlowTiming} from '@bloxwap/hig/contracts/number-flow';
import {useHIG,useNumberLocale} from './provider.js';
import {tokens as higTokens} from '@bloxwap/hig/tokens';
import * as en from '@bloxwap/hig/contracts/messages';
import {presentNumberFormat} from '@bloxwap/hig/contracts';
export type AnimatedNumberTrend=-1|0|1|((oldValue:number,newValue:number)=>-1|0|1);
export type {NumberFlowDigits,NumberFlowEasing,NumberFlowTiming} from '@bloxwap/hig/contracts/number-flow';
export interface AnimatedNumberProps extends NumberProps {
 /** How long a change takes, in milliseconds. Sliding: 180 by default, at most 600. Flowing: sets the roll and the sideways slide (900 by default) and fades take half of it; the three timings below override it. Zero or less draws the new value at once. */
 duration?:number;
 /** Which way digits move: `1` up, `-1` down, `0` each digit its own way, or a function of the old and new value. Defaults to the direction the value moved. */
 trend?:AnimatedNumberTrend;
 /**
  * How a change is drawn. `'flow'` is NumberFlow's motion: every changed digit rolls through the digits between its old and new
  * value, a figure that gains or loses a place slides closed while the place fades, and a new value joins the motion in flight.
  * `'slide'` is the short settle: the old digit leaves by one line as the new one arrives, and a newer value restarts it.
  * `NumberFlow` flows and `AnimatedNumberReadout` slides unless told otherwise. A reading that cannot be laid out place by place
  * (right-to-left letters or bidi controls in the number itself) slides.
  */
 motion?:'flow'|'slide';
 /** `false` draws every new value at once, with no motion, as reduced motion does. Use it for typed echoes and until first data arrives. Default `true`. */
 animated?:boolean;
 /** Flowing only: the roll of a changed digit. Defaults to `transformTiming`. */
 spinTiming?:NumberFlowTiming;
 /** Flowing only: the sideways slide when the figure changes width, and the roll unless `spinTiming` is set. Default 900 ms on NumberFlow's curve. */
 transformTiming?:NumberFlowTiming;
 /** Flowing only: the fade of a part that arrives or leaves. Default 450 ms ease-out. */
 opacityTiming?:NumberFlowTiming;
 /** Flowing only: a limit for an integer place, keyed by place (0 is the ones). `{1:{max:5}}` makes the tens of a seconds counter wrap from 5 to 0. */
 digits?:NumberFlowDigits;
 /** Flowing only, with a trend: every place below the highest one that changed turns once all the way round even when its digit is the same, so the figure reads as counting through the values between. */
 continuous?:boolean;
 /** Flowing only: keeps the moving parts on their own compositor layers between changes. For a figure that changes many times a second; it costs memory, so leave it off elsewhere. */
 willChange?:boolean;
 /** Class names for the readout's root, for the host's type size, weight and colour. */
 className?:string;
 /** Host-formatted text for a finite `value`, drawn in place of the Intl reading and read the same way, for a host whose number table the browser's Intl does not match. Never parse it back. Empty text falls back to Intl. Unknown values still read as the dash. */
 formattedValue?:string;
 /** With `formattedValue`, moves the host's text place by place: each digit rolls in place, counted from the end, and the rest stays as written. Without it `formattedValue` is drawn static. */
 animateFormatted?:boolean}
/**
 * A number that moves place by place when its value changes. It slides by default; `motion='flow'` (or `NumberFlow`, which is
 * this component flowing by default) gives it NumberFlow's motion. Either way the reading assistive technology gets is one
 * static text, and reduced motion draws each new value at once.
 */
export function AnimatedNumberReadout({motion='slide',...props}:AnimatedNumberProps){return motion==='flow'?<FlowReadout {...props}/>:<SlideReadout {...props}/>;}
/** `AnimatedNumberReadout` with NumberFlow's motion by default: the same component and the same props, under the name the product uses for it. */
export function NumberFlow({motion='flow',...props}:AnimatedNumberProps){return <AnimatedNumberReadout motion={motion} {...props}/>;}
export type NumberFlowProps=AnimatedNumberProps;
function SlideReadout({duration=180,trend,options:requested,formattedValue,animateFormatted=false,animated=true,className,...rest}:AnimatedNumberProps){
 const locale=useNumberLocale();const {direction,reducedMotion:reduced,messages,numberFormat}=useHIG(),reducedMotion=reduced||!animated;const props={...rest,options:presentNumberFormat(requested,numberFormat)};const element=useRef<HTMLSpanElement>(null);const previous=useRef<{value:number|null|undefined;signature:string;model:ReturnType<typeof createAnimatedNumberModel>}|null>(null);const generation=useRef(0);const active=useRef<Animation[]>([]);
 const known=props.value!=null&&Number.isFinite(props.value),own=known&&!!formattedValue;
 const signature=JSON.stringify([locale,direction,props.options??{},own,own&&animateFormatted]);
 const frame=useMemo(()=>{const model=own?createFormattedAnimatedNumberModel(formattedValue as string,locale,animateFormatted):createAnimatedNumberModel(props.value,locale,props.options),prior=previous.current,changed=!!prior&&prior.signature===signature&&!Object.is(prior.value,props.value);let movement:-1|0|1=0;
  if(changed&&prior&&model.animatable&&prior.model.animatable&&Number.isFinite(prior.value)&&Number.isFinite(props.value)){const requested=typeof trend==='function'?trend(prior.value as number,props.value as number):trend??Math.sign((props.value as number)-(prior.value as number));movement=requested===-1||requested===1?requested:0;}
  return {model,changed,movement,tokens:createAnimatedNumberTransitions(changed?prior?.model??null:null,model)};
 },[props.value,signature,formattedValue]);
 const [settled,setSettled]=useState<typeof frame|null>(null);
 const reading=known?`${props.prefix??''}${frame.model.reading}${props.suffix??''}`:frame.model.reading,staleText=messages.stale??en.stale,accessible=`${props.label?`${props.label}: `:''}${reading}${props.stale?` ${staleText}`:''}`;
 useEffect(()=>{const id=++generation.current;const cancel=()=>{const running=active.current;active.current=[];for(const animation of running){animation.onfinish=null;animation.cancel();}};cancel();previous.current={value:props.value,signature,model:frame.model};
  if(!frame.changed)return;
  if(reducedMotion||!Number.isFinite(duration)||duration<=0||!frame.model.animatable){setSettled(frame);return;}
  const places=element.current?.querySelectorAll<HTMLElement>('[data-hig-animated-number-change]');if(!places){setSettled(frame);return;}const created:Animation[]=[],changes=frame.tokens.filter(token=>token.changed);
  for(const [index,place] of Array.from(places).entries()){const token=changes[index],movement=frame.movement||(token?.value!==undefined&&token.oldValue!==undefined?token.value>token.oldValue?1:token.value<token.oldValue?-1:0:0),old=place.querySelector<HTMLElement>('.hig-animated-number-old'),next=place.querySelector<HTMLElement>('.hig-animated-number-new'),timing:KeyframeAnimationOptions={duration:Math.min(duration,600),easing:`cubic-bezier(${higTokens.easing.standard.join(',')})`,fill:'forwards'};
   const oldFrames:Keyframe[]=movement===0?[{opacity:1},{opacity:0}]:[{opacity:1,transform:'translateY(0%)'},{opacity:0,transform:`translateY(${-movement*100}%)`}];
   const newFrames:Keyframe[]=movement===0?[{opacity:0},{opacity:1}]:[{opacity:0,transform:`translateY(${movement*100}%)`},{opacity:1,transform:'translateY(0%)'}];
   const oldAnimation=old?.animate?.(oldFrames,timing),newAnimation=next?.animate?.(newFrames,timing);if(oldAnimation)created.push(oldAnimation);if(newAnimation)created.push(newAnimation);
  }
  active.current=created;if(!created.length){setSettled(frame);return;}let remaining=created.length;
  for(const animation of created)animation.onfinish=()=>{if(generation.current===id&&--remaining===0){active.current=[];setSettled(frame);}};
  return()=>{if(generation.current===id)cancel();};
 },[frame,reducedMotion,duration]);
 const tokens=settled===frame||reducedMotion?createAnimatedNumberTransitions(null,frame.model):frame.tokens;
 return <span className={className?`hig-number ${className}`:'hig-number'}><span className='hig-sr-only' aria-label={props.label?accessible:undefined}>{accessible}</span><span ref={element} className='hig-animated-number-visual' aria-hidden='true' dir={direction}>{known&&props.prefix}{tokens.map(token=>token.changed?<span className='hig-animated-number-place' data-hig-animated-number-change key={token.key}>{token.oldText!==undefined&&<span className='hig-animated-number-old'>{token.oldText}</span>}{token.text&&<span className='hig-animated-number-new'>{token.text}</span>}</span>:<span key={token.key}>{token.text}</span>)}{known&&props.suffix}{props.stale&&<span> {staleText}</span>}</span></span>;
}

interface FlowMember {measure:()=>void;flip:()=>void}
interface FlowGroup {join:(member:FlowMember)=>()=>void;willUpdate:()=>void;didUpdate:()=>void}
const FlowGroupContext=React.createContext<FlowGroup|null>(null);
/**
 * Moves the flowing figures inside it together: when one changes width, its neighbours in the group slide to their new
 * positions instead of jumping, as the parts of a single figure do. For a row of figures that read as one, such as the units
 * of a countdown. Text between the figures is not moved. On native it draws its children and nothing else.
 */
export function NumberFlowGroup({children}:{children?:React.ReactNode}){
 const group=useMemo<FlowGroup>(()=>{const members=new Set<FlowMember>();let pending=false;
  return {join(member){members.add(member);return()=>{members.delete(member);};},willUpdate(){if(pending)return;pending=true;for(const member of members)member.measure();},didUpdate(){if(!pending)return;pending=false;for(const member of members)member.flip();}};
 },[]);
 return <FlowGroupContext.Provider value={group}>{children}</FlowGroupContext.Provider>;
}
/** Runs `before` after a render and before its changes reach the DOM, the one moment the old positions can still be read. Function components have no such hook. */
class BeforeCommit extends React.Component<{before:()=>void;children:React.ReactNode}>{
 getSnapshotBeforeUpdate(){this.props.before();return null;}
 componentDidUpdate(){/* Required beside getSnapshotBeforeUpdate. */}
 render(){return this.props.children;}
}
const useCommitEffect=typeof window==='undefined'?useEffect:useLayoutEffect;
const asciiDigits=['0','1','2','3','4','5','6','7','8','9'];
function FlowReadout(all:AnimatedNumberProps){
 const {duration,trend,options:requested,formattedValue,animateFormatted=false,animated=true,spinTiming,transformTiming,opacityTiming,digits,continuous=false,willChange=false,className,...rest}=all;
 const locale=useNumberLocale();const {direction,reducedMotion,messages,numberFormat}=useHIG(),group=useContext(FlowGroupContext);const props={...rest,options:presentNumberFormat(requested,numberFormat)};
 const known=props.value!=null&&Number.isFinite(props.value),own=known&&!!formattedValue;
 const signature=JSON.stringify([locale,direction,props.options??{},own,own&&animateFormatted]);
 const model=useMemo(()=>own?createFormattedAnimatedNumberModel(formattedValue as string,locale,animateFormatted):createAnimatedNumberModel(props.value,locale,props.options),[props.value,signature,formattedValue]);
 const keys=useMemo(()=>numberFlowTokenKeys(model.tokens),[model]);
 const timings=resolveNumberFlowTimings({duration,spinTiming,transformTiming,opacityTiming}),timingKey=JSON.stringify(timings),flowMotion=useMemo(()=>numberFlowWebMotion(timings),[timingKey]);
 const staleText=messages.stale??en.stale,prefix=known?props.prefix??'':'',suffix=known?props.suffix??'':'',reading=`${prefix}${model.reading}${suffix}`,accessible=`${props.label?`${props.label}: `:''}${reading}${props.stale?` ${staleText}`:''}`;
 // Everything the visual draws, so an affix or the stale mark changing is a change to slide for as much as a digit is.
 const drawn=JSON.stringify([prefix,model.reading,suffix,props.stale?staleText:'']),placeable=!model.animatable||numberFlowNeutral(model.reading),moving=animated&&!reducedMotion&&placeable&&model.animatable;
 const visual=useRef<HTMLSpanElement>(null),engine=useRef<NumberFlowEngine|null>(null),committed=useRef<{value:number|null|undefined;signature:string;model:typeof model;drawn:string}|null>(null),live=useRef({moving,motion:flowMotion});
 useEffect(()=>group?.join({measure:()=>{if(live.current.moving)engine.current?.measure();},flip:()=>engine.current?.flip(live.current.motion)}),[group]);
 useEffect(()=>()=>engine.current?.cancel(),[]);
 const before=()=>{const prior=committed.current;if(!prior||!moving||(prior.model===model&&prior.drawn===drawn))return;if(group)group.willUpdate();else engine.current?.measure();};
 useCommitEffect(()=>{
  // A reading that slides instead is drawn by another tree; whatever comes back after it is a first paint, not a change.
  if(!placeable){committed.current=null;engine.current?.cancel();return;}
  const flow=engine.current??=new NumberFlowEngine();flow.attach(visual.current);live.current={moving,motion:flowMotion};
  const prior=committed.current;committed.current={value:props.value,signature,model,drawn};
  if(!moving&&flow.busy)flow.cancel();
  if(!prior||(prior.model===model&&prior.drawn===drawn))return;
  // A new locale, format or direction is a different reading rather than a new value, and a hidden page has nobody to move for.
  if(!moving||prior.signature!==signature||!prior.model.animatable||document.visibilityState==='hidden'){flow.cancel();group?.didUpdate();return;}
  if(group)group.didUpdate();else flow.flip(flowMotion);
  if(prior.model===model||flowMotion.spin.duration<=0)return;
  let movement:-1|0|1=0;
  if(Number.isFinite(prior.value)&&Number.isFinite(props.value)){const wanted=typeof trend==='function'?trend(prior.value as number,props.value as number):trend??Math.sign((props.value as number)-(prior.value as number));movement=wanted===-1||wanted===1?wanted:0;}
  const old=new Map(numberFlowPlaces(prior.model).map(place=>[place.key,place.digit])),places=numberFlowPlaces(model),deltas=numberFlowDeltas(numberFlowPlaces(prior.model),places,{trend:movement,digits,continuous}),spins=new Map<string,NumberFlowSpin>();
  for(const place of places){const delta=deltas.get(place.key)??0,from=old.get(place.key)??0;if(delta)spins.set(place.key,{delta,from,length:numberFlowDigitLength(digits,place.place,Math.max(place.digit,from))});}
  flow.spin(spins,model.digits??asciiDigits,flowMotion.spin);
 });
 // The number itself is always drawn left to right, as digits are in every script; a reading that needs reordering slides instead.
 if(!placeable)return <SlideReadout {...all}/>;
 // The digits, first to last with the separators between them, sit in one box the engine clips while it changes width; signs and currency stay outside it.
 const parts=model.tokens.map((token,index)=>token.digit?<span className='hig-number-flow-place' data-hig-flow-key={keys[index]} data-hig-flow-digit='' key={keys[index]}><span className='hig-number-flow-digit'>{token.text}</span></span>:<span className='hig-number-flow-part' data-hig-flow-key={keys[index]} key={keys[index]}>{token.text}</span>);
 const found=model.tokens.findIndex(token=>token.digit),first=found<0?parts.length:found;let last=parts.length-1;while(last>=first&&!model.tokens[last].digit)last--;
 return <BeforeCommit before={before}><span className={className?`hig-number hig-number-flow ${className}`:'hig-number hig-number-flow'}><span className='hig-sr-only' aria-label={props.label?accessible:undefined}>{accessible}</span><span ref={visual} className='hig-animated-number-visual' aria-hidden='true' dir={direction} data-will-change={willChange?'':undefined}>
  {prefix&&<span className='hig-number-flow-part' data-hig-flow-key='affix:prefix'>{prefix}</span>}
  <span className='hig-number-flow-core' dir='ltr'>{parts.slice(0,first)}<span className='hig-number-flow-digits' key='digits'>{parts.slice(first,last+1)}<span className='hig-number-flow-ghosts' key='ghosts'/></span>{parts.slice(last+1)}</span>
  {suffix&&<span className='hig-number-flow-part' data-hig-flow-key='affix:suffix'>{suffix}</span>}
  {props.stale&&<span className='hig-number-flow-part' data-hig-flow-key='affix:stale'> {staleText}</span>}
  <span className='hig-number-flow-ghosts'/>
 </span></span></BeforeCommit>;
}
