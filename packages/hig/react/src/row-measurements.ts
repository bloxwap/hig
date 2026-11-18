// Store only deviations from the estimated height. A Fenwick tree updates prefix
// heights in logarithmic time when a wrapped label is measured.
export function rowMeasurements(count:number,estimate:number){
 const topBit=count>1?2**Math.floor(Math.log2(count-1)):0;
 const heights=new Map<number,number>(),deltas=new Map<number,number>();
 const offset=(index:number)=>{
  let height=index*estimate;
  if(deltas.size===0)return height;
  for(let node=index;node>0;node-=(node&-node)>>>0){
   height+=deltas.get(node)??0;
  }
  return height;
 };
 return {
  offset,
  measured:()=>heights.entries(),
  measure(index:number,height:number){
   const previous=heights.get(index)??estimate;
   if(height===previous)return false;
   if(height===estimate)heights.delete(index);
   else heights.set(index,height);
   for(let node=index+1;node<=count;node+=(node&-node)>>>0){
    const delta=(deltas.get(node)??0)+height-previous;
    if(delta===0)deltas.delete(node);
    else deltas.set(node,delta);
   }
   return true;
  },
  rowAt(position:number){
   if(deltas.size===0)return Math.max(0,Math.min(count-1,Math.floor(position/estimate)));
   // Walk the Fenwick tree once, retaining the prefix already known to fit.
   // At a fractional boundary, use the same summation order as the rendered offset.
   const tolerance=64*Number.EPSILON*(count*estimate+Math.abs(position));
   let index=0,delta=0;
   for(let bit=topBit;bit>=1;bit/=2){
    const next=index+bit;
    if(next>=count)continue;
    const nextDelta=delta+(deltas.get(next)??0);
    const top=next*estimate+nextDelta;
    const boundary=Math.abs(top-position)<=tolerance?offset(next):top;
    if(boundary<=position){
     index=next;
     delta=nextDelta;
    }
   }
   return index;
  },
 };
}
