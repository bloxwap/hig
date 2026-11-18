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

function labelledByPrice(targets:readonly AltimeterTarget[]){
 // Price order also breaks ties for targets pinned at the same edge.
 return targets.filter(target=>target.label).sort((a,b)=>b.price-a.price);
}

/** Labels stay inside the chart and share the chart capsule layout's collision avoidance. */
export function placeTargets(targets:readonly AltimeterTarget[],display:number,spacing:number,height:number,sideOffsets?:ReadonlyMap<string,number>,insets?:TargetLabelInsets):Map<string,AltimeterTargetPosition>{
 return placeOrderedTargets(targets,display,spacing,height,sideOffsets,insets);
}

function placeOrderedTargets(targets:readonly AltimeterTarget[],display:number,spacing:number,height:number,sideOffsets?:ReadonlyMap<string,number>,insets?:TargetLabelInsets,ordered?:readonly AltimeterTarget[]){
 const positions=new Map<string,AltimeterTargetPosition>();
 if(!Number.isFinite(display)||display<=0||!Number.isFinite(spacing)||spacing<=0||!Number.isFinite(height)||height<=0)return positions;
 for(const target of targets){
  const y=height/2-((target.price-display)/spacing)*ALTIMETER_TICK_PX;
  positions.set(target.id,{y,anchor:Math.max(0,Math.min(height,y)),pinned:y<0?'top':y>height?'bottom':null});
 }
 const labelled=ordered??labelledByPrice(targets);
 if(!labelled.length)return positions;
 const wanted=labelled.map(target=>{
  const {y}=positions.get(target.id)!;
  const top=y+(sideOffsets?.get(target.id)??sideOffset(target.price,display));
  return top+LABEL_HEIGHT/2;
 });
 const centers=capsuleCenters(wanted,height,LABEL_HEIGHT,LABEL_GAP,true,labelBounds(height,LABEL_HEIGHT,insets,EDGE_INSET));
 for(let index=0;index<labelled.length;index++)positions.get(labelled[index].id)!.labelTop=centers[index]-LABEL_HEIGHT/2;
 return positions;
}

/** Follow the line exactly; animate only its above/below offset, then resolve collisions and edge pinning. */
export function targetLayout({reuseSettled=false}={}){
 // Renderers supply immutable target arrays and consume the returned positions read-only.
 let settled:{targets:readonly AltimeterTarget[];display:number;spacing:number;height:number;top?:number;bottom?:number;positions:Map<string,AltimeterTargetPosition>}|undefined;
 let ordered:{targets:readonly AltimeterTarget[];labels:AltimeterTarget[]}|undefined;
 const sides=new Map<string,{from:number;to:number;start:number}>();
 return {
  reset(){sides.clear();settled=undefined;ordered=undefined;},
  update(targets:readonly AltimeterTarget[],display:number,spacing:number,height:number,now:number,snap=false,insets?:TargetLabelInsets){
   if(settled&&targets===settled.targets&&display===settled.display&&spacing===settled.spacing&&height===settled.height&&insets?.top===settled.top&&insets?.bottom===settled.bottom)return settled.positions;
   const labels=ordered?.targets===targets?ordered.labels:labelledByPrice(targets);
   if(reuseSettled&&ordered?.targets!==targets)ordered={targets,labels};
   let moving=false;
   const offsets=new Map<string,number>();
   for(const target of labels){
    const to=sideOffset(target.price,display);
    let side=sides.get(target.id);
    if(!side||snap){side={from:to,to,start:now};sides.set(target.id,side);}
    const value=side.from===side.to?side.to:side.from+(side.to-side.from)*easeInOut((now-side.start)/tokens.motion.base);
    if(side.to!==to){side.from=value;side.to=to;side.start=now;}
    if(value!==to)moving=true;
    offsets.set(target.id,value);
   }
   for(const id of sides.keys())if(!offsets.has(id))sides.delete(id);
   const positions=targets.length?placeOrderedTargets(targets,display,spacing,height,offsets,insets,labels):new Map<string,AltimeterTargetPosition>();
   if(!positions.size)sides.clear();
   settled=reuseSettled&&!moving?{targets,display,spacing,height,top:insets?.top,bottom:insets?.bottom,positions}:undefined;
   return positions;
  },
 };
}

/** Tracks displayed prices, so the effect coincides with the line reaching the live pill. */
export function targetCrossings({immutableTargets=false}={}){
 let lastTargets:readonly AltimeterTarget[]|undefined;
 let previous=NaN;
 // The open interval can contain one target price when the scan landed exactly on it.
 let below=Infinity,above=-Infinity,exact=NaN;
 const levels=new Map<string,number>();
 return {
  reset(){previous=NaN;lastTargets=undefined;levels.clear();},
  update(price:number,targets:readonly AltimeterTarget[],enabled=true):AltimeterTarget[]{
   const sameTargets=immutableTargets&&targets===lastTargets;
   const withinGap=sameTargets&&previous>below&&previous<above&&price>below&&price<above&&
    (Number.isNaN(exact)||previous===exact||(previous<exact&&price<exact)||(previous>exact&&price>exact));
   const crossed:AltimeterTarget[]=[];
   if(enabled&&!Number.isNaN(price)&&price!==previous&&!withinGap){
    below=-Infinity;above=Infinity;exact=NaN;
    for(const target of targets){
     const level=target.price;
     if(immutableTargets){
      if(level<price){if(level>below)below=level;}
      else if(level>price){if(level<above)above=level;}
      else if(level===price)exact=price;
     }
     if(((previous<level&&price>=level)||(previous>level&&price<=level))&&levels.get(target.id)===level)crossed.push(target);
    }
   }else if(!sameTargets){below=Infinity;above=-Infinity;}
   // Coalesced effects use the last level encountered along the direction of travel.
   if(crossed.length>1)crossed.sort((a,b)=>price>previous?a.price-b.price:b.price-a.price);
   previous=price;
   if(!immutableTargets||targets!==lastTargets){
    levels.clear();
    for(const target of targets)levels.set(target.id,target.price);
    if(immutableTargets)lastTargets=targets;
   }
   return crossed;
  },
 };
}

