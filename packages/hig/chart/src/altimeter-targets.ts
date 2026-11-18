import {tokens} from '@bloxwap/hig/tokens';
import {ALTIMETER_TICK_PX,easeInOut} from './altimeter-model.js';
import {capsuleCenters,labelBounds,type TargetLabelInsets} from './outcome-model.js';

/** A host-owned price level. Plain labels align right; colors accept any CSS color, including variables. */
export interface AltimeterTarget {
 /** Stable, unique identity. Changing the price re-arms this target without firing an effect. */
 id:string;
 price:number;
 /** Title shown before the formatted target price, with capitalized words. Omit for a line without text. */
 label?:string;
 /** Defaults to the chart's primary accent. */
 color?:string;
}

/** Keep the first valid target for each ID. Invalid prices must never enter chart geometry. */
export function validTargets(targets:readonly AltimeterTarget[]):AltimeterTarget[]{
 const ids=new Set<string>();
 return targets.filter(target=>{
  if(!target.id||ids.has(target.id)||!Number.isFinite(target.price)||target.price<=0)return false;
  ids.add(target.id);return true;
 });
}

const LABEL_HEIGHT=18,LABEL_GAP=6,EDGE_INSET=8;
const sideOffset=(price:number,display:number)=>price>display?LABEL_GAP+2:-LABEL_HEIGHT-LABEL_GAP+2;
export interface AltimeterTargetPosition {
 /** Actual line position, which may be outside the chart. */
 y:number;
 /** Row position clamped to the chart so pinned labels never inherit a huge offscreen transform. */
 anchor:number;
 /** Label's top in chart coordinates, after stacking. */
 labelTop?:number;
 pinned:'top'|'bottom'|null;
}

/** Labels stay inside the chart and share the chart capsule layout's collision avoidance. */
export function placeTargets(targets:readonly AltimeterTarget[],display:number,spacing:number,height:number,sideOffsets?:ReadonlyMap<string,number>,insets?:TargetLabelInsets):Map<string,AltimeterTargetPosition>{
 const positions=new Map<string,AltimeterTargetPosition>();
 if(!Number.isFinite(display)||display<=0||!Number.isFinite(spacing)||spacing<=0||!Number.isFinite(height)||height<=0)return positions;
 for(const target of targets){
  const y=height/2-((target.price-display)/spacing)*ALTIMETER_TICK_PX;
  positions.set(target.id,{y,anchor:Math.max(0,Math.min(height,y)),pinned:y<0?'top':y>height?'bottom':null});
 }
 // Price order also breaks ties for targets pinned at the same edge, independently of array order.
 const labelled=targets.filter(target=>target.label).sort((a,b)=>b.price-a.price);
 const wanted=labelled.map(target=>{
  const {y}=positions.get(target.id)!;
  const top=y+(sideOffsets?.get(target.id)??sideOffset(target.price,display));
  return top+LABEL_HEIGHT/2;
 });
 const centers=capsuleCenters(wanted,height,LABEL_HEIGHT,LABEL_GAP,true,labelBounds(height,LABEL_HEIGHT,insets,EDGE_INSET));
 for(const [index,target] of labelled.entries())positions.get(target.id)!.labelTop=centers[index]-LABEL_HEIGHT/2;
 return positions;
}

/** Follow the line exactly; animate only its above/below offset, then resolve collisions and edge pinning. */
export function targetLayout(){
 const sides=new Map<string,{from:number;to:number;start:number}>();
 return {
  reset(){sides.clear();},
  update(targets:readonly AltimeterTarget[],display:number,spacing:number,height:number,now:number,snap=false,insets?:TargetLabelInsets){
   if(targets.length===0){sides.clear();return new Map<string,AltimeterTargetPosition>();}
   const offsets=new Map<string,number>();
   for(const target of targets){
    if(!target.label)continue;
    const to=sideOffset(target.price,display);
    let side=sides.get(target.id);
    if(!side||snap){side={from:to,to,start:now};sides.set(target.id,side);}
    const value=side.from+(side.to-side.from)*easeInOut((now-side.start)/tokens.motion.base);
    if(side.to!==to){side.from=value;side.to=to;side.start=now;}
    offsets.set(target.id,value);
   }
   for(const id of sides.keys())if(!offsets.has(id))sides.delete(id);
   const positions=placeTargets(targets,display,spacing,height,offsets,insets);
   if(!positions.size)sides.clear();
   return positions;
  },
 };
}

/** Tracks displayed prices, so the effect coincides with the line reaching the live pill. */
export function targetCrossings(){
 let previous=NaN;
 const levels=new Map<string,number>();
 return {
  reset(){previous=NaN;levels.clear();},
  update(price:number,targets:readonly AltimeterTarget[]):AltimeterTarget[]{
   const crossed=targets.filter(target=>levels.get(target.id)===target.price&&(
    (previous<target.price&&price>=target.price)||(previous>target.price&&price<=target.price)
   ));
   // Coalesced effects use the last level encountered along the direction of travel.
   crossed.sort((a,b)=>price>previous?a.price-b.price:b.price-a.price);
   previous=price;levels.clear();
   for(const target of targets)levels.set(target.id,target.price);
   return crossed;
  },
 };
}

