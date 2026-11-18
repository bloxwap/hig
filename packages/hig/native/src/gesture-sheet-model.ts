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
/** A flick counts once the sheet has moved this far (points) from where the drag picked it up: a nudge is a placement. */
export const SHEET_FLICK_TRAVEL=24;
/** A flick closes the sheet when its momentum lands it past this share of the way from the lowest detent to closed. */
export const SHEET_FLICK_CLOSE=0.25;
/**
 * The detent a release settles on, as an index into `positions` (increasing translateY, so index 0 is the tallest), or -1 to
 * close. A slow release takes the nearest detent, or closes when the sheet is more than half way from the lowest detent to
 * closed. A flick moves one detent in its direction; from the lowest it closes when its momentum carries the sheet a quarter
 * of the way to closed. A release is a flick only when the sheet moved `SHEET_FLICK_TRAVEL` from `start`, where the drag picked
 * it up, and the drag did not begin as a scroll of the content (`scrolled`): flinging a list back to its top places the sheet,
 * it does not throw it.
 */
export function releaseTarget(position:number,velocity:number,positions:readonly number[],closed:number,dismissible:boolean,start:number,scrolled=false):number{
 'worklet';
 if(positions.length===0)return -1;
 const lowestIndex=positions.length-1,lowest=positions[lowestIndex];
 let nearest=0;
 for(let index=1;index<positions.length;index++)if(Math.abs(positions[index]-position)<Math.abs(positions[nearest]-position))nearest=index;
 if(!scrolled&&Math.abs(velocity)>=SHEET_FLICK&&Math.abs(position-start)>=SHEET_FLICK_TRAVEL){
  if(velocity>0){
   // Downward: the next detent below where the finger let go, or closed when the momentum reaches the closing line.
   for(let index=0;index<positions.length;index++)if(positions[index]>position+1)return index;
   return dismissible&&position+velocity*SHEET_PROJECTION>lowest+(closed-lowest)*SHEET_FLICK_CLOSE?-1:lowestIndex;
  }
  for(let index=lowestIndex;index>=0;index--)if(positions[index]<position-1)return index;
  return 0;
 }
 if(dismissible&&position>lowest+(closed-lowest)/2)return -1;
 return nearest;
}
/** Backdrop strength for a position: full at the lowest detent and above, fading to none at closed. */
export function backdropProgress(position:number,lowest:number,closed:number):number{
 'worklet';
 if(closed<=lowest)return position>=closed?0:1;
 return Math.max(0,Math.min(1,(closed-position)/(closed-lowest)));
}
/** Sheet travel follows the height transition measured from Vaul's Dynamic Drawer. */
export const SHEET_TRANSITION={duration:270,curve:[0.26,0.08,0.25,1]} as const;

/** Invalid fixed detents are programmer errors, before they reach either sheet backend. */
export function validateSnapPoints(points:readonly SheetSnapPoint[],initialIndex=0){
 if(!points.length)throw new Error('GestureSheet requires at least one snap point.');
 if(!Number.isInteger(initialIndex)||initialIndex<0)throw new RangeError('GestureSheet initialIndex must be a nonnegative integer.');
 for(const point of points){
  const percent=typeof point==='string';
  const value=percent?Number(point.slice(0,-1)):point;
  if((percent&&!/^\d+(?:\.\d+)?%$/.test(point))||!Number.isFinite(value)||value<=0||(percent&&value>100))throw new RangeError('GestureSheet snap points must be positive finite points or percentages up to 100%.');
 }
}
