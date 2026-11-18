// Geometry for OutcomeChart: each outcome's chance on a 0 to 100% ladder, and the capsules the trails end in.

export interface Outcome {
 /** Stable key. */
 id:string;
 /** Host text for the capsule, such as a team code or `Cut`. */
 label:string;
 /** Current price of one share in dollars, 0 to 1, read as its chance from 0 to 100%. `null` while unknown. */
 price:number|null;
 /** Host hex color. Defaults to `outcomeColors` in order. */
 color?:string;
}
/** A live source of outcomes: call `onOutcomes` with each new snapshot, and return a function that stops it. */
export type OutcomeFeed=(onOutcomes:(outcomes:readonly Outcome[])=>void,onStale?:()=>void)=>()=>void;
/** The most outcomes drawn; later ones are dropped. */
export const OUTCOME_LIMIT=10;
/** Default line and capsule colors, in order. Each reads on the dark chart background (4.5:1 or better on #0a0a0a). */
export const outcomeColors:readonly string[]=['#e5a445','#6b9a3c','#4f8fe0','#c8643c','#d0554f','#8279d9','#8a8880','#3fa7a0','#d873b0','#d9c24a'];

/** An outcome's price as a chance from 0 to 1, or `null` while unknown. */
export function outcomeChance(price:number|null|undefined):number|null{return price==null||!Number.isFinite(price)?null:Math.min(1,Math.max(0,price));}
/** The part of 0..1 the ladder shows, and the chance between two ticks. */
export interface OutcomeScale {low:number;high:number;step:number}
/** The whole ladder: 0 to 100% with a tick every ten percent. */
export const fullScale:OutcomeScale={low:0,high:1,step:.1};
const STEPS=[.01,.02,.05,.1];
/**
 * The ladder for these chances: the range they occupy plus a tenth of it on each side, on the finest of 1, 2, 5 or
 * 10 percent steps that needs no more than twelve, and never fewer than four. Unknown chances are ignored; with none
 * known it is the whole ladder. The `previous` scale is kept while every chance stays inside it, unless the chances
 * have closed in to a third of it or less, so the ladder holds still while chances move.
 */
export function outcomeScale(chances:readonly (number|null)[],previous?:OutcomeScale):OutcomeScale{
 const known=chances.filter((chance):chance is number=>chance!=null);
 if(known.length===0)return previous??fullScale;
 const least=Math.min(...known),most=Math.max(...known),margin=Math.max(.002,(most-least)*.1),from=Math.max(0,least-margin),to=Math.min(1,most+margin);
 let step=.1,first=0,last=10;
 for(const candidate of STEPS){
  const units=Math.round(1/candidate);let low=Math.floor(from/candidate+1e-9),high=Math.ceil(to/candidate-1e-9);
  while(high-low<4){if(low>0)low--;if(high-low<4&&high<units)high++;}
  if(high-low<=12){step=candidate;first=low;last=high;break;}
 }
 const round=(value:number)=>+value.toFixed(6),fresh={low:round(first*step),high:round(last*step),step};
 return previous&&least>=previous.low&&most<=previous.high&&(fresh.high-fresh.low)*3>previous.high-previous.low?previous:fresh;
}
/** The ladder's ticks, from the top of the scale down. */
export function outcomeTicks(scale:OutcomeScale=fullScale):number[]{
 const count=Math.round((scale.high-scale.low)/scale.step);
 return Array.from({length:count+1},(_,index)=>+(scale.high-index*scale.step).toFixed(6));
}
/** Vertical position of a chance: the top of the scale sits `inset` below the top and its bottom `inset` above the bottom. Chances outside the scale stay on its edge. */
export function outcomeY(chance:number,height:number,inset:number,scale:OutcomeScale=fullScale):number{
 const share=Math.min(1,Math.max(0,(scale.high-chance)/(scale.high-scale.low)));
 return inset+share*(height-2*inset);
}
/** Clearance between the plot edges and the outer edges of target labels, in layout units. */
export interface TargetLabelInsets {top?:number;bottom?:number}

/** Reduce excessive clearance proportionally so at least one label can fit. */
export function labelBounds(height:number,size:number,insets?:TargetLabelInsets,defaultInset=0){
 const available=Math.max(0,height-size);
 const edge=(value:number|undefined)=>Math.min(available,value!==undefined&&Number.isFinite(value)?Math.max(0,value):defaultInset);
 const top=edge(insets?.top),bottom=edge(insets?.bottom);
 const factor=top+bottom>available?available/(top+bottom):1;
 return {top:top*factor,bottom:Math.max(size,height)-bottom*factor};
}
/**
 * Centers for capsules of `size` that want to sit at `wanted` but may not overlap: neighbors keep `gap` between
 * them and all stay inside `height`; when they cannot all fit with the gap, the gap shrinks. Returned in the order given.
 * `preserveOrder` keeps the input sequence instead of sorting by desired position, for stable target-label stacks.
 */
export function capsuleCenters(wanted:readonly number[],height:number,size=36,gap=6,preserveOrder=false,bounds={top:0,bottom:height}):number[]{
 const count=wanted.length;
 const order=preserveOrder?undefined:wanted.map((_,index)=>index).sort((a,b)=>wanted[a]-wanted[b]);
 const centers=new Array<number>(count);
 // A crowded chart gives up the gap before any capsule leaves it.
 const step=count>1?Math.min(size+gap,(bounds.bottom-bounds.top-size)/(count-1)):size+gap;
 let lower=bounds.top+size/2;
 for(let rank=0;rank<count;rank++){
  const index=order?.[rank]??rank;
  centers[index]=Math.max(wanted[index],lower);
  lower=centers[index]+step;
 }
 let upper=bounds.bottom-size/2;
 for(let rank=count-1;rank>=0;rank--){
  const index=order?.[rank]??rank;
  centers[index]=Math.min(centers[index],upper);
  upper=centers[index]-step;
 }
 return centers;
}
