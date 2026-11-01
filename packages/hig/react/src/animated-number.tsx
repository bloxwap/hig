"use client";
import React,{useEffect,useMemo,useRef,useState} from 'react';
import {type NumberProps} from './data.js';
import {createAnimatedNumberModel,createAnimatedNumberTransitions} from './animated-number-model.js';
import {useHIG} from './provider.js';
import * as en from '@bloxwap/hig/contracts/messages';
export type AnimatedNumberTrend=-1|0|1|((oldValue:number,newValue:number)=>-1|0|1);
export interface AnimatedNumberProps extends NumberProps {duration?:number;trend?:AnimatedNumberTrend}
export function AnimatedNumberReadout({duration=180,trend,...props}:AnimatedNumberProps){
 const {locale,direction,reducedMotion,messages}=useHIG();const element=useRef<HTMLSpanElement>(null);const previous=useRef<{value:number|null|undefined;signature:string;model:ReturnType<typeof createAnimatedNumberModel>}|null>(null);const generation=useRef(0);const active=useRef<Animation[]>([]);
 const signature=JSON.stringify([locale,direction,props.options??{}]);
 const frame=useMemo(()=>{const model=createAnimatedNumberModel(props.value,locale,props.options),prior=previous.current,changed=!!prior&&prior.signature===signature&&!Object.is(prior.value,props.value);let movement:-1|0|1=0;
  if(changed&&prior&&model.animatable&&prior.model.animatable&&Number.isFinite(prior.value)&&Number.isFinite(props.value)){const requested=typeof trend==='function'?trend(prior.value as number,props.value as number):trend??Math.sign((props.value as number)-(prior.value as number));movement=requested===-1||requested===1?requested:0;}
  return {model,changed,movement,tokens:createAnimatedNumberTransitions(changed?prior?.model??null:null,model)};
 },[props.value,signature]);
 const [settled,setSettled]=useState<typeof frame|null>(null);
 const known=props.value!=null&&Number.isFinite(props.value),reading=known?`${props.prefix??''}${frame.model.reading}${props.suffix??''}`:frame.model.reading,staleText=messages.stale??en.stale,accessible=`${props.label?`${props.label}: `:''}${reading}${props.stale?` ${staleText}`:''}`;
 useEffect(()=>{const id=++generation.current;const cancel=()=>{const running=active.current;active.current=[];for(const animation of running){animation.onfinish=null;animation.cancel();}};cancel();previous.current={value:props.value,signature,model:frame.model};
  if(!frame.changed)return;
  if(reducedMotion||!Number.isFinite(duration)||duration<=0||!frame.model.animatable){setSettled(frame);return;}
  const places=element.current?.querySelectorAll<HTMLElement>('[data-hig-animated-number-change]');if(!places){setSettled(frame);return;}const created:Animation[]=[],changes=frame.tokens.filter(token=>token.changed);
  for(const [index,place] of Array.from(places).entries()){const token=changes[index],movement=frame.movement||(token?.value!==undefined&&token.oldValue!==undefined?token.value>token.oldValue?1:token.value<token.oldValue?-1:0:0),old=place.querySelector<HTMLElement>('.hig-animated-number-old'),next=place.querySelector<HTMLElement>('.hig-animated-number-new'),timing:KeyframeAnimationOptions={duration:Math.min(duration,600),easing:'ease-out',fill:'forwards'};
   const oldFrames:Keyframe[]=movement===0?[{opacity:1},{opacity:0}]:[{opacity:1,transform:'translateY(0%)'},{opacity:0,transform:`translateY(${-movement*100}%)`}];
   const newFrames:Keyframe[]=movement===0?[{opacity:0},{opacity:1}]:[{opacity:0,transform:`translateY(${movement*100}%)`},{opacity:1,transform:'translateY(0%)'}];
   const oldAnimation=old?.animate?.(oldFrames,timing),newAnimation=next?.animate?.(newFrames,timing);if(oldAnimation)created.push(oldAnimation);if(newAnimation)created.push(newAnimation);
  }
  active.current=created;if(!created.length){setSettled(frame);return;}let remaining=created.length;
  for(const animation of created)animation.onfinish=()=>{if(generation.current===id&&--remaining===0){active.current=[];setSettled(frame);}};
  return()=>{if(generation.current===id)cancel();};
 },[frame,reducedMotion,duration]);
 const tokens=settled===frame||reducedMotion?createAnimatedNumberTransitions(null,frame.model):frame.tokens;
 return <span className='hig-number'><span className='hig-sr-only' aria-label={props.label?accessible:undefined}>{accessible}</span><span ref={element} className='hig-animated-number-visual' aria-hidden='true' dir={direction}>{known&&props.prefix}{tokens.map(token=>token.changed?<span className='hig-animated-number-place' data-hig-animated-number-change key={token.key}>{token.oldText!==undefined&&<span className='hig-animated-number-old'>{token.oldText}</span>}{token.text&&<span className='hig-animated-number-new'>{token.text}</span>}</span>:<span key={token.key}>{token.text}</span>)}{known&&props.suffix}{props.stale&&<span> {staleText}</span>}</span></span>;
}
