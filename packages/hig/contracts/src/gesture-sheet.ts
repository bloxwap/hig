/**
 * The arithmetic and motion of HIG's gesture sheet, shared by the web and native engines so the sheet behaves the same
 * everywhere. It is kept apart from React: on native these run on the UI thread as worklets, on web in pointer handlers,
 * and they are tested as plain functions. Positions are the sheet's offset along its closing axis in points (CSS pixels on
 * web): 0 is the sheet at its full height, `height` is closed. The motion values and release rules are Vaul's
 * (https://github.com/emilkowalski/vaul), measured and written out here so neither engine depends on it.
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
/**
 * Sheet travel: opening, closing, moving between detents and returning after a drag. Vaul's values, one curve with no
 * spring: a quick start and a long settle.
 */
export const SHEET_TRAVEL={duration:500,curve:[0.32,0.72,0,1]} as const;
/**
 * A content-sized sheet moving to a new height, and the view that leaves while it does: the height transition of Vaul's
 * Dynamic Drawer.
 */
export const SHEET_RESIZE={duration:270,curve:[0.26,0.08,0.25,1]} as const;
/** The arriving view in a swap fades in a little faster than the old one leaves, on the resize curve (Dynamic Drawer). */
export const SHEET_VIEW_ENTER=220;
/** The share of its size a swapped view shrinks to as it fades (Dynamic Drawer). */
export const SHEET_VIEW_SCALE=0.96;
/** A release at this speed or faster (units per second) is a flick, not a placement. Vaul's velocity threshold, 0.4 per millisecond. */
export const SHEET_FLICK=400;
/** A flick this fast with several detents goes straight to the end: the tallest detent upward, closed downward. Vaul's 2 per millisecond. */
export const SHEET_THROW=2000;
/** A flick counts once the sheet has moved this far from where the drag picked it up: a nudge is a placement. */
export const SHEET_FLICK_TRAVEL=24;
/** A flick steps one detent only while the drag covered less than this share of the room; a longer drag is placed where it was let go (Vaul). */
export const SHEET_FLICK_REACH=0.4;
/** How far ahead of the finger a flick toward closed is read, in seconds: it lands where its momentum would carry it. */
export const SHEET_PROJECTION=0.18;
/**
 * A sheet let go more than this share of the way from its lowest detent to closed closes, and a flick from the lowest
 * detent closes when its momentum lands past the same line. Vaul's close threshold.
 */
export const SHEET_CLOSE=0.25;
/** After the content scrolls, a drag does not move the sheet for this long (milliseconds), so a scroll that reaches the top does not run on into a drag (Vaul). */
export const SHEET_SCROLL_LOCK=100;
/**
 * The detent a release settles on, as an index into `positions` (increasing offset, so index 0 is the tallest), or -1 to
 * close. Offsets and `velocity` share one unit (points or CSS pixels, per second); positive is toward closed.
 *
 * The rules are Vaul's, with two guards that keep a list inside the sheet from throwing it away. A slow release takes the
 * nearest detent, or closes past `SHEET_CLOSE` of the way from the lowest detent to closed. A flick (`SHEET_FLICK`) moves
 * to the next detent in its direction; from the lowest it closes when its momentum carries the sheet past the closing
 * line. A throw (`SHEET_THROW`) with several detents goes to the tallest, or closes. A release is a flick only
 * when the sheet moved `SHEET_FLICK_TRAVEL` from `start` and the drag did not begin as a scroll of the content (`scrolled`).
 * `room` is the space the sheet moves in, for `SHEET_FLICK_REACH`; it defaults to `closed`.
 */
export function releaseTarget(position:number,velocity:number,positions:readonly number[],closed:number,dismissible:boolean,start:number,scrolled=false,room=closed):number{
 'worklet';
 if(positions.length===0)return -1;
 const lowestIndex=positions.length-1,lowest=positions[lowestIndex];
 let nearest=0;
 for(let index=1;index<positions.length;index++)if(Math.abs(positions[index]-position)<Math.abs(positions[nearest]-position))nearest=index;
 const moved=Math.abs(position-start),speed=Math.abs(velocity);
 if(!scrolled&&speed>=SHEET_FLICK&&moved>=SHEET_FLICK_TRAVEL){
  const closes=dismissible&&position+velocity*SHEET_PROJECTION>lowest+(closed-lowest)*SHEET_CLOSE;
  if(velocity>0){
   if(positions.length>1&&speed>=SHEET_THROW)return closes?-1:lowestIndex;
   if(moved<room*SHEET_FLICK_REACH){
    // The next detent below where the finger let go, or closed when the momentum reaches the closing line.
    for(let index=0;index<positions.length;index++)if(positions[index]>position+1)return index;
    return closes?-1:lowestIndex;
   }
  }else{
   if(positions.length>1&&speed>=SHEET_THROW)return 0;
   if(moved<room*SHEET_FLICK_REACH){
    for(let index=lowestIndex;index>=0;index--)if(positions[index]<position-1)return index;
    return 0;
   }
  }
 }
 if(dismissible&&position>lowest+(closed-lowest)*SHEET_CLOSE)return -1;
 return nearest;
}
/** Backdrop strength for a position: full at the lowest detent and above, fading to none at closed. */
export function backdropProgress(position:number,lowest:number,closed:number):number{
 'worklet';
 if(closed<=lowest)return position>=closed?0:1;
 return Math.max(0,Math.min(1,(closed-position)/(closed-lowest)));
}
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
