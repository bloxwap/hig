/**
 * The arithmetic of HIG's own sheet, kept apart from React so it runs on the UI thread as worklets and is tested as plain
 * functions. Positions are the sheet's `translateY` in points: 0 is the sheet at its full height, `height` is closed.
 */
export type SheetSnapPoint=number|`${number}%`;
/** A detent as visible height in points, from points or a percentage of the room the sheet has. Invalid input reads as 0. */
export function detentHeight(point:SheetSnapPoint,room:number):number{
 'worklet';
 const raw=typeof point==='number'?point:parseFloat(point)/100*room;
 return Number.isFinite(raw)?Math.max(0,Math.min(raw,room)):0;
}
/** Detent heights for fixed snap points: clamped to the room, sorted increasing, without duplicates or empty detents. */
export function detentHeights(points:readonly SheetSnapPoint[],room:number):number[]{
 'worklet';
 const heights:number[]=[];
 for(const point of points){const height=detentHeight(point,room);if(height>0&&!heights.includes(height))heights.push(height);}
 return heights.sort((a,b)=>a-b);
}
/**
 * Resistance past the sheet's limit: the further the finger goes, the less the sheet follows, and it never passes `limit`
 * points. The same curve UIScrollView uses.
 */
export function rubberBand(overshoot:number,limit:number):number{
 'worklet';
 if(overshoot<=0||limit<=0)return 0;
 return (1-1/(overshoot*0.55/limit+1))*limit;
}
/** Where a drag puts the sheet: 1:1 between the top detent and closed, resisting above the top detent, and resisting below the lowest detent when it cannot be dismissed. */
export function dragPosition(raw:number,top:number,lowest:number,closed:number,dismissible:boolean):number{
 'worklet';
 if(raw<top)return top-rubberBand(top-raw,Math.max(top,64));
 const floor=dismissible?closed:lowest;
 if(raw>floor)return dismissible?closed:floor+rubberBand(raw-floor,Math.max(closed-floor,64));
 return raw;
}
/** How far ahead of the finger a release is read, in seconds: a flick lands where its momentum would carry it. */
export const SHEET_PROJECTION=0.18;
/** A release slower than this (points per second) is a placement, not a flick. */
export const SHEET_FLICK=500;
/**
 * The detent a release settles on, as an index into `positions` (increasing translateY, so index 0 is the tallest), or -1 to
 * close. A flick moves one detent in its direction, or closes from the lowest; a slow release takes the nearest detent, or
 * closes when the sheet is more than half way from the lowest detent to closed.
 */
export function releaseTarget(position:number,velocity:number,positions:readonly number[],closed:number,dismissible:boolean):number{
 'worklet';
 if(positions.length===0)return -1;
 const lowestIndex=positions.length-1,lowest=positions[lowestIndex];
 let nearest=0;
 for(let index=1;index<positions.length;index++)if(Math.abs(positions[index]-position)<Math.abs(positions[nearest]-position))nearest=index;
 if(Math.abs(velocity)>=SHEET_FLICK){
  const projected=position+velocity*SHEET_PROJECTION;
  if(velocity>0){
   // Downward: the next detent below where the finger let go, or closed.
   for(let index=0;index<positions.length;index++)if(positions[index]>position+1)return index;
   return dismissible&&projected>lowest?-1:lowestIndex;
  }
  for(let index=lowestIndex;index>=0;index--)if(positions[index]<position-1)return index;
  return 0;
 }
 if(dismissible&&position>lowest+(closed-lowest)/2)return -1;
 return nearest;
}
/**
 * The spring every settle uses: critically damped (damping = 2·√(stiffness·mass)), so the sheet lands without a bounce and
 * without a slow tail, in about a third of a second. An overdamped spring creeps to rest and keeps drawing frames long
 * after the sheet looks still (measured on a Seeker: animating almost a second per settle).
 */
export const SHEET_SPRING={damping:36,stiffness:320,mass:1,overshootClamping:true} as const;
/** Backdrop strength for a position: full at the lowest detent and above, fading to none at closed. */
export function backdropProgress(position:number,lowest:number,closed:number):number{
 'worklet';
 if(closed<=lowest)return position>=closed?0:1;
 return Math.max(0,Math.min(1,(closed-position)/(closed-lowest)));
}
/**
 * A view swap and the height change that goes with it, measured from Vaul's Dynamic Drawer: one curve for all of it, with
 * no spring and no overshoot. The old view leaves and the sheet resizes in `duration`; the new view arrives in `enter`.
 */
export const SHEET_VIEW_SWAP={duration:270,enter:220,curve:[0.26,0.08,0.25,1],/** How far a pushed or popped view travels, as a percentage of its own width. */travel:30} as const;
/** What a swap between two depths is: 1 pushes, -1 pops, 0 cross-fades in place (no depth given, or the same depth). */
export function viewMove(from:number|undefined,to:number|undefined):-1|0|1{return from===undefined||to===undefined||from===to?0:to>from?1:-1;}
