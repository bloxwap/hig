/** The sheet's arithmetic is shared with the web engine: see `@bloxwap/hig/contracts/gesture-sheet`. */
export * from '@bloxwap/hig/contracts/gesture-sheet';
/**
 * Whether the content's scroller, not the sheet, takes this moment of a drag. It can only where the drag began on the top
 * detent (`start` at `top`). There the content takes any `travel` above where the drag began: it scrolls. It also keeps the
 * drag while it is scrolled (`offset` above 0), but only while the sheet rests at its top. Once this drag has moved the
 * sheet, an offset is the content slipping inside a moving sheet, not a scroll the person made: handing the drag back for
 * it would send the sheet to its top and down again on alternate frames.
 */
export function scrollerOwnsDrag(scrollers:number,start:number,top:number,position:number,offset:number,travel:number):boolean{
 'worklet';
 if(scrollers<=0||start>top+0.5)return false;
 if(travel<0)return true;
 return offset>0&&position<=top+0.5;
}
