/** Identity must not collapse two rows into one stateful element. */
export function assertUniqueKeys<T>(items:readonly T[],key:(item:T)=>string|number,label='Collection'):void {
 const seen=new Set<string>();
 for(const item of items){const id=String(key(item));if(seen.has(id))throw new Error(`${label} requires unique keys: ${id}`);seen.add(id);}
}
/** Shared finite range for visuals, accessibility and emitted values. */
export function numericRange(min=0,max=100,step=1){
 if(!Number.isFinite(min)||!Number.isFinite(max)||max<min||!Number.isFinite(step)||step<=0)throw new RangeError('Range requires finite min <= max and step > 0');
 return {min,max,step,clamp:(value:number)=>Number.isFinite(value)?Math.min(max,Math.max(min,value)):min};
}
export function progressValue(value:number|undefined,max:number){
 const ceiling=Number.isFinite(max)&&max>0?max:100;
 return {max:ceiling,value:value===undefined||!Number.isFinite(value)?undefined:Math.min(ceiling,Math.max(0,value))};
}
export function paginationValue(page:number,total:number){
 const count=Number.isFinite(total)?Math.max(1,Math.floor(total)):1;
 return {total:count,page:Number.isFinite(page)?Math.max(1,Math.min(count,Math.floor(page))):1};
}
