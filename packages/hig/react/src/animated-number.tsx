"use client";
import React,{useContext,useEffect,useLayoutEffect,useMemo,useRef,useState} from 'react';
import {type NumberProps} from './data.js';
import {animatedNumberReading,createAnimatedNumberModel,createAnimatedNumberTransitions,createFormattedAnimatedNumberModel,numberFlowPlaces,numberFlowTokenKeys} from './animated-number-model.js';
import {NumberFlowEngine,numberFlowCommit,numberFlowWebMotion,type NumberFlowSpin} from './animated-number-flow.js';
import {forEachNumberFlowTurn,numberFlowNeutral,resolveNumberFlowTimings,type NumberFlowDigits,type NumberFlowTiming} from '@bloxwap/hig/contracts/number-flow';
import {useLayoutDirection,useReadoutFormat,useReducedMotion} from './provider.js';
import {tokens as higTokens} from '@bloxwap/hig/tokens';
import * as en from '@bloxwap/hig/contracts/messages';
import {presentNumberFormat} from '@bloxwap/hig/contracts/environment';
export type AnimatedNumberTrend=-1|0|1|((oldValue:number,newValue:number)=>-1|0|1);
export type {NumberFlowDigits,NumberFlowEasing,NumberFlowTiming} from '@bloxwap/hig/contracts/number-flow';
export interface AnimatedNumberProps extends NumberProps {
 /** How long a change takes, in milliseconds. Sliding: 180 by default, at most 500. Flowing: sets the roll and the sideways slide (500 by default) and fades take half of it; the three timings below override it. Zero or less draws the new value at once. */
 duration?:number;
 /** Which way digits move: `1` up, `-1` down, `0` each digit its own way, or a function of the old and new value. Defaults to the direction the value moved. */
 trend?:AnimatedNumberTrend;
 /**
  * How a change is drawn. `'flow'` is NumberFlow's motion: every changed digit rolls through the digits between its old and new
  * value, a figure that gains or loses a place slides closed while the place fades, and a new value joins the motion in flight.
  * `'slide'` is the short settle: the old digit leaves by one line as the new one arrives, and a newer value restarts it.
  * `NumberFlow` flows by default. A reading that cannot be laid out place by place
  * (right-to-left letters or bidi controls in the number itself) slides.
  */
 motion?:'flow'|'slide';
 /** `false` draws every new value at once, with no motion, as reduced motion does. Use it for typed echoes and until first data arrives. Default `true`. */
 animated?:boolean;
 /** Flowing only: the roll of a changed digit. Defaults to `transformTiming`. */
 spinTiming?:NumberFlowTiming;
 /** Flowing only: the sideways slide when the figure changes width, and the roll unless `spinTiming` is set. Default 500 ms on NumberFlow's curve. */
 transformTiming?:NumberFlowTiming;
 /** Flowing only: the fade of a part that arrives or leaves. Default 250 ms ease-out. */
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
const MemoFlowReadout=React.memo(FlowReadout);
const MemoSlideReadout=React.memo(SlideReadout);
function renderNumberReadout(motion:AnimatedNumberProps['motion'],props:AnimatedNumberProps){
 const optionsKey=JSON.stringify(props.options);
 if(motion!=='flow')return <MemoSlideReadout {...props} optionsKey={optionsKey}/>;
 const motionKey=props.digits||props.spinTiming||props.transformTiming||props.opacityTiming
  ?JSON.stringify([props.digits,props.spinTiming,props.transformTiming,props.opacityTiming]):undefined;
 return <MemoFlowReadout {...props} optionsKey={optionsKey} motionKey={motionKey}/>;
}
/** A localized number that rolls through changes and honors reduced motion. */
export function NumberFlow({motion='flow',...props}:AnimatedNumberProps){return renderNumberReadout(motion,props);}
export type NumberFlowProps=AnimatedNumberProps;
// A rounded reading can span many raw ticks. Decode its places once, on demand, while retaining each raw value for trend callbacks.
function useNumberReading(value:AnimatedNumberProps['value'],locale:string,options:Intl.NumberFormatOptions|undefined,signature:string,formattedValue:string|undefined,animateFormatted:boolean){
 const known=value!=null&&Number.isFinite(value),own=known&&!!formattedValue,modelValue=own?undefined:value;
 const {canonical,formatter}=useMemo(()=>({
  canonical:own?formattedValue:animatedNumberReading(modelValue,locale,options),formatter:globalThis.Intl?.NumberFormat,
 }),[modelValue,signature,formattedValue]);
 // Unsafe integers stay static even when a safe neighbour formats to the same text.
 const unsafeInteger=Number.isInteger(modelValue)&&!Number.isSafeInteger(modelValue);
 return useMemo(()=>{
  let model:ReturnType<typeof createAnimatedNumberModel>|undefined;
  return {canonical,getModel:()=>model??=(own?createFormattedAnimatedNumberModel(canonical,locale,animateFormatted):createAnimatedNumberModel(modelValue,locale,options,canonical))};
 },[canonical,signature,known,unsafeInteger,formatter]);
}
const slideEasing=`cubic-bezier(${higTokens.easing.standard.join(',')})`;
function slideFrames(movement:-1|0|1){
 const outgoing:Keyframe[]=[{opacity:1},{opacity:0}],incoming:Keyframe[]=[{opacity:0},{opacity:1}];
 if(movement){
  outgoing[0].transform=incoming[1].transform='translateY(0%)';
  outgoing[1].transform=`translateY(${-movement*100}%)`;
  incoming[0].transform=`translateY(${movement*100}%)`;
 }
 return {outgoing,incoming};
}
const slideDown=slideFrames(-1),slideFade=slideFrames(0),slideUp=slideFrames(1);
function SlideReadout({optionsKey,duration=180,trend,options:requested,formattedValue,animateFormatted=false,animated=true,className,...rest}:AnimatedNumberProps&{optionsKey?:string}){
 const {locale,numberFormat,staleLabel}=useReadoutFormat(requested?.style==='currency');const direction=useLayoutDirection(),reducedMotion=useReducedMotion()||!animated;const props={...rest,options:presentNumberFormat(requested,numberFormat)};const element=useRef<HTMLSpanElement>(null);const previous=useRef<{value:number|null|undefined;signature:string;getModel:()=>ReturnType<typeof createAnimatedNumberModel>}|null>(null);const generation=useRef(0);const active=useRef<Animation[]>([]);
 const known=props.value!=null&&Number.isFinite(props.value),own=known&&!!formattedValue;
 const formatKey=props.options===requested&&optionsKey!==undefined?optionsKey:JSON.stringify(props.options??{});
 const signature=JSON.stringify([locale,direction,formatKey,own,own&&animateFormatted]);
 const {canonical,getModel}=useNumberReading(props.value,locale,props.options,signature,formattedValue,animateFormatted);
 const frame=useMemo(()=>{
  const prior=previous.current;
  if(!prior||prior.signature!==signature||Object.is(prior.value,props.value)||reducedMotion||!Number.isFinite(duration)||duration<=0){
   return {getModel,reading:canonical,tokens:null,movement:0};
  }
  const model=getModel(),before=prior.getModel();
  let movement:-1|0|1=0;
  if(model.animatable&&before.animatable&&Number.isFinite(prior.value)&&Number.isFinite(props.value)){
   const requested=typeof trend==='function'?trend(prior.value as number,props.value as number):trend??Math.sign((props.value as number)-(prior.value as number));movement=requested===-1||requested===1?requested:0;
  }
  return {getModel,reading:model.reading,tokens:model.animatable?createAnimatedNumberTransitions(before,model):null,movement};
 },[getModel,reducedMotion,duration]);
 const [settled,setSettled]=useState<typeof frame|null>(null);
 const reading=known?`${props.prefix??''}${frame.reading}${props.suffix??''}`:frame.reading,staleText=staleLabel??en.stale,accessible=`${props.label?`${props.label}: `:''}${reading}${props.stale?` ${staleText}`:''}`;
 // Raw ticks still advance the trend baseline while the displayed reading stays the same.
 useEffect(()=>{previous.current={value:props.value,signature,getModel:frame.getModel};},[props.value,signature,frame]);
 useEffect(()=>{const id=++generation.current;const cancel=()=>{const running=active.current;active.current=[];for(const animation of running){animation.onfinish=null;animation.cancel();}};cancel();
  if(!frame.tokens)return;
  const places=element.current?.querySelectorAll<HTMLElement>('[data-hig-animated-number-change]');
  const created:Animation[]=[],timing:KeyframeAnimationOptions={duration:Math.min(duration,500),easing:slideEasing,fill:'forwards'};
  let index=0;
  for(const token of frame.tokens){
   if(!token.changed)continue;
   const place=places?.[index++];if(!place)break;
   const movement=frame.movement||(token.value!==undefined&&token.oldValue!==undefined?Math.sign(token.value-token.oldValue):0);
   const frames=movement>0?slideUp:movement<0?slideDown:slideFade;
   const outgoing=token.oldText!==undefined?place.firstElementChild?.animate?.(frames.outgoing,timing):undefined;
   const incoming=token.text?place.lastElementChild?.animate?.(frames.incoming,timing):undefined;
   if(outgoing)created.push(outgoing);
   if(incoming)created.push(incoming);
  }
  active.current=created;if(!created.length){setSettled(frame);return;}let remaining=created.length;
  for(const animation of created)animation.onfinish=()=>{if(generation.current===id&&--remaining===0){active.current=[];setSettled(frame);}};
  return()=>{if(generation.current===id)cancel();};
 },[frame,reducedMotion,duration]);
 // The same elements for the same reading: a parent that draws again without a new value costs this figure no reconciliation.
 const still=settled===frame||reducedMotion;
 return useMemo(()=>{const tokens=(!still?frame.tokens:null)??(own?createAnimatedNumberTransitions(null,frame.getModel()):null);
  const parts:React.ReactNode[]|undefined=tokens?[]:undefined;
  if(tokens&&parts){
   let restingText='';
   for(const token of tokens){
    if(token.changed){
     if(restingText){parts.push(restingText);restingText='';}
     parts.push(<span className='hig-animated-number-place' data-hig-animated-number-change key={token.key}>{token.oldText!==undefined&&<span className='hig-animated-number-old'>{token.oldText}</span>}{token.text&&<span className='hig-animated-number-new'>{token.text}</span>}</span>);
    }else if(own)parts.push(<span key={token.key}>{token.text}</span>);
    else restingText+=token.text;
   }
   if(restingText)parts.push(restingText);
  }
  return <span className={className?`hig-number ${className}`:'hig-number'}><span className='hig-sr-only' aria-label={props.label?accessible:undefined}>{accessible}</span><span ref={element} className='hig-animated-number-visual' aria-hidden='true' dir={direction}>{known&&props.prefix}{parts??frame.reading}{known&&props.suffix}{props.stale&&<span> {staleText}</span>}</span></span>;
 },[frame,still,own,className,props.label,accessible,direction,known,props.prefix,props.suffix,props.stale,staleText]);
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
let defaultFlowMotion:ReturnType<typeof numberFlowWebMotion>|undefined;
const asciiDigits=['0','1','2','3','4','5','6','7','8','9'];
function FlowReadout(all:AnimatedNumberProps&{optionsKey?:string;motionKey?:string}){
 const {duration,trend,options:requested,formattedValue,animateFormatted=false,animated=true,spinTiming,transformTiming,opacityTiming,digits,continuous=false,willChange=false,className,...rest}=all;
 const {locale,numberFormat,staleLabel}=useReadoutFormat(requested?.style==='currency');const direction=useLayoutDirection(),reducedMotion=useReducedMotion(),group=useContext(FlowGroupContext);const props={...rest,options:presentNumberFormat(requested,numberFormat)};
 const known=props.value!=null&&Number.isFinite(props.value),own=known&&!!formattedValue;
 const formatKey=props.options===requested&&all.optionsKey!==undefined?all.optionsKey:JSON.stringify(props.options??{});
 const signature=JSON.stringify([locale,direction,formatKey,own,own&&animateFormatted]);
 const model=useNumberReading(props.value,locale,props.options,signature,formattedValue,animateFormatted).getModel();
 const keys=useMemo(()=>numberFlowTokenKeys(model.tokens),[model]);
 const customTiming=spinTiming||transformTiming||opacityTiming;
 const timings=customTiming?resolveNumberFlowTimings({duration,spinTiming,transformTiming,opacityTiming}):undefined;
 const timingKey=timings?JSON.stringify(timings):duration;
 const flowMotion=useMemo(()=>{
  if(timingKey===undefined)return defaultFlowMotion??=numberFlowWebMotion(resolveNumberFlowTimings({}));
  return numberFlowWebMotion(timings??resolveNumberFlowTimings({duration}));
 },[timingKey]);
 const layoutMotion=flowMotion.transform.duration>0||flowMotion.opacity.duration>0,instant=flowMotion.spin.duration===0&&!layoutMotion;
 const staleText=staleLabel??en.stale,prefix=known?props.prefix??'':'',suffix=known?props.suffix??'':'',reading=`${prefix}${model.reading}${suffix}`,accessible=`${props.label?`${props.label}: `:''}${reading}${props.stale?` ${staleText}`:''}`;
 // Everything the visual draws, so an affix or the stale mark changing is a change to slide for as much as a digit is.
 const drawn=JSON.stringify([prefix,model.reading,suffix,props.stale?staleText:'']),placeable=!model.animatable||numberFlowNeutral(model.reading),moving=animated&&!reducedMotion&&placeable&&model.animatable;
 const visual=useRef<HTMLSpanElement>(null),engine=useRef<NumberFlowEngine|null>(null),committed=useRef<{value:number|null|undefined;signature:string;model:typeof model;drawn:string;keys:readonly string[];affixes:number;places?:ReturnType<typeof numberFlowPlaces>}|null>(null),live=useRef({moving:moving&&layoutMotion,motion:flowMotion});
 useEffect(()=>group?.join({measure:()=>{if(live.current.moving)engine.current?.measure();},flip:()=>engine.current?.flip(live.current.motion)}),[group]);
 useEffect(()=>()=>engine.current?.cancel(),[]);
 // A figure that is about to change holds its writes until every figure changing in the same commit has read its positions.
 const affixes=(prefix?1:0)+(suffix?2:0)+(props.stale?4:0);
 const expected=useRef(false),before=()=>{
  const prior=committed.current;
  if(!prior||!moving||(prior.model===model&&prior.drawn===drawn))return;
  if(document.visibilityState==='hidden'||(!group&&(!layoutMotion||prior.signature!==signature||!prior.model.animatable)))return;
  const sameParts=!group&&prior.affixes===affixes&&keys.length===prior.keys.length&&keys.every((key,i)=>key===prior.keys[i]);
  // With only fades enabled, persistent parts have no layout motion to start.
  if(sameParts&&flowMotion.transform.duration===0&&!engine.current?.busy)return;
  if(!expected.current){expected.current=true;numberFlowCommit.expect();}
  if(group)group.willUpdate();else engine.current?.measure(sameParts);
 };
 const change=()=>{
  // A reading that slides instead is drawn by another tree; whatever comes back after it is a first paint, not a change.
  if(!placeable){committed.current=null;engine.current?.cancel();return;}
  const flow=engine.current??=new NumberFlowEngine();flow.attach(visual.current);live.current={moving:moving&&layoutMotion,motion:flowMotion};
  const prior=committed.current;committed.current={value:props.value,signature,model,drawn,keys,affixes,places:prior?.model===model?prior.places:undefined};
  if((!moving||instant)&&flow.busy)flow.cancel();
  if(!prior||(prior.model===model&&prior.drawn===drawn))return;
  // A new locale, format or direction is a different reading rather than a new value, and a hidden page has nobody to move for.
  if(!moving||instant||prior.signature!==signature||!prior.model.animatable||document.visibilityState==='hidden'){flow.cancel();group?.didUpdate();return;}
  if(group)group.didUpdate();else flow.flip(flowMotion);
  if(prior.model===model||flowMotion.spin.duration<=0)return;
  let movement:-1|0|1=0;
  if(Number.isFinite(prior.value)&&Number.isFinite(props.value)){const wanted=typeof trend==='function'?trend(prior.value as number,props.value as number):trend??Math.sign((props.value as number)-(prior.value as number));movement=wanted===-1||wanted===1?wanted:0;}
  const previousPlaces=prior.places??numberFlowPlaces(prior.model),places=numberFlowPlaces(model);
  committed.current.places=places;
  const spins=new Map<string,NumberFlowSpin>();
  forEachNumberFlowTurn(previousPlaces,places,{trend:movement,digits,continuous,uniqueKeys:true},(place,from,delta,length)=>{
   if(delta)spins.set(place.key,{delta,from,length});
  });
  flow.spin(spins,model.digits??asciiDigits,flowMotion.spin,!layoutMotion);
 };
 useCommitEffect(()=>{try{change();}finally{if(expected.current){expected.current=false;numberFlowCommit.done();}}});
 // The same elements for the same reading: a parent that draws again without a new value costs this figure no reconciliation.
 const figure=useMemo(()=>{
  // The digits, first to last with the separators between them, sit in one box the engine clips while it changes width; signs and currency stay outside it.
  const parts=model.tokens.map((token,index)=>token.digit?<span className='hig-number-flow-place' data-hig-flow-key={keys[index]} data-hig-flow-digit='' key={keys[index]}><span className='hig-number-flow-digit'>{token.text}</span></span>:<span className='hig-number-flow-part' data-hig-flow-key={keys[index]} key={keys[index]}>{token.text}</span>);
  const found=model.tokens.findIndex(token=>token.digit),first=found<0?parts.length:found;let last=parts.length-1;while(last>=first&&!model.tokens[last].digit)last--;
  return <span className={className?`hig-number hig-number-flow ${className}`:'hig-number hig-number-flow'}><span className='hig-sr-only' aria-label={props.label?accessible:undefined}>{accessible}</span><span ref={visual} className='hig-animated-number-visual' aria-hidden='true' dir={direction} data-will-change={willChange?'':undefined}>
   {prefix&&<span className='hig-number-flow-part' data-hig-flow-key='affix:prefix'>{prefix}</span>}
   <span className='hig-number-flow-core' dir='ltr'>{parts.slice(0,first)}<span className='hig-number-flow-digits' key='digits'>{parts.slice(first,last+1)}<span className='hig-number-flow-ghosts' key='ghosts'/></span>{parts.slice(last+1)}</span>
   {suffix&&<span className='hig-number-flow-part' data-hig-flow-key='affix:suffix'>{suffix}</span>}
   {props.stale&&<span className='hig-number-flow-part' data-hig-flow-key='affix:stale'> {staleText}</span>}
   <span className='hig-number-flow-ghosts'/>
  </span></span>;
 },[model,keys,className,props.label,accessible,direction,willChange,prefix,suffix,props.stale,staleText]);
 // The number itself is always drawn left to right, as digits are in every script; a reading that needs reordering slides instead.
 if(!placeable)return <SlideReadout {...all}/>;
 return <BeforeCommit before={before}>{figure}</BeforeCommit>;
}
