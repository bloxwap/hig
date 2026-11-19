// Trail geometry for a renderer that cannot afford to draw the chart again each frame (React Native, where every vector
// canvas is rasterised on the CPU). The trail is the path the pill has followed: the price tween is a cubic in time and
// the trail is linear in time, so that path is a run of exact cubics, and the past of it never changes. It is cut into
// pieces that are drawn once and afterwards only moved: tiles of history, one patch beside the pill that also holds the
// course the tween is on, drawn ahead of the pill and uncovered as the pill reaches it, and the shaded area to
// break-even. Something is drawn again only when the price changes course, or every second or two to top the patch up.
// A renderer places each piece at its coordinates in a `TrailSpace` and moves that whole space with `trailScroll`.
import {ALTIMETER_EASE_MS,ALTIMETER_FLOW_PX,ALTIMETER_TICK_PX,type AltimeterTweenState} from './altimeter-model.js';

/** The frame a piece of trail is drawn in: `t0` is the chart time at x = 0, `p0` the price at y = 0, `spacing` the price of one ladder row. */
export interface TrailSpace {t0:number;p0:number;spacing:number}
/** Horizontal pixels from the space's origin to chart time `t`: the trail travels 50px a second. */
export function trailX(space:TrailSpace,t:number):number{'worklet';return (t-space.t0)*ALTIMETER_FLOW_PX/1000;}
/** Vertical pixels from the space's origin to `price`: a higher price sits further up. */
export function trailY(space:TrailSpace,price:number):number{'worklet';return -(price-space.p0)/space.spacing*ALTIMETER_TICK_PX;}
/**
 * The translation that puts chart time `now` and `price` at a space's origin, rounded to whole device pixels (`pixel` per
 * layout pixel) so that what was drawn stays sharp while it moves. Runs on the UI thread every display frame.
 */
export function trailScroll(space:TrailSpace,now:number,price:number,pixel:number):{x:number;y:number}{
 'worklet';
 const x=Math.round(trailX(space,now)*pixel)/pixel,y=Number.isFinite(price)?Math.round(trailY(space,price)*pixel)/pixel:0;
 // Never a negative zero: a style that flips between 0 and -0 is written to the view again for nothing.
 return {x:x===0?0:-x,y:y===0?0:-y};
}

/** The price a tween shows at `now`. The same arithmetic as `stepPriceTween`, without retargeting. */
export function tweenValue(state:AltimeterTweenState,now:number):number{
 'worklet';
 const {from,to,start,tangent}=state;
 if(!Number.isFinite(to))return NaN;
 if(from===to||now-start>=ALTIMETER_EASE_MS)return to;
 const t=Math.max(0,(now-start)/ALTIMETER_EASE_MS),delta=to-from;
 return from+delta*t*t*(3-2*t)+tangent*t*(1-t)*(1-t);
}
/** How fast a tween's price is changing at `now`, per millisecond. */
export function tweenVelocity(state:AltimeterTweenState,now:number):number{
 const {from,to,start,tangent}=state;
 if(!Number.isFinite(to)||from===to||now<start||now-start>=ALTIMETER_EASE_MS)return 0;
 const t=(now-start)/ALTIMETER_EASE_MS;
 return ((to-from)*6*t*(1-t)+tangent*(1-t)*(1-3*t))/ALTIMETER_EASE_MS;
}

/** One cubic of trail as (time, price) control points: start, two handles, end. */
export type TrailSegment=readonly [number,number,number,number,number,number,number,number];
/** A tween state and the chart time it took effect. */
export interface TweenChange {at:number;state:AltimeterTweenState}

const level=(from:number,to:number,price:number):TrailSegment=>[from,price,from+(to-from)/3,price,to-(to-from)/3,price,to,price];
/**
 * The price the chart displayed from `from` to `until` as exact cubics. The tween is a cubic in time and the trail is
 * linear in time, so each stretch of a tween is one cubic. `log` begins with the state in effect at `from`; the last
 * state is taken to hold until `until`, which is how the trail is drawn ahead of the pill.
 */
export function liveSegments(log:readonly TweenChange[],from:number,until:number):TrailSegment[]{
 const segments:TrailSegment[]=[];
 for(let i=0;i<log.length;i++){
  const {state}=log[i];
  let a=i===0?from:Math.max(from,log[i].at);
  const b=i+1<log.length?Math.min(until,log[i+1].at):until;
  if(!(b>a)||!Number.isFinite(state.to))continue;
  if(state.from!==state.to){
   // Before its start a tween holds its first price.
   if(a<state.start){const hold=Math.min(b,state.start);segments.push(level(a,hold,state.from));a=hold;}
   const rest=state.start+ALTIMETER_EASE_MS;
   if(b>a&&a<rest){
    const c=Math.min(b,rest),third=(c-a)/3,y0=tweenValue(state,a),y1=tweenValue(state,c);
    segments.push([a,y0,a+third,y0+tweenVelocity(state,a)*third,c-third,y1-tweenVelocity(state,c)*third,c,y1]);
    a=c;
   }
  }
  if(b>a)segments.push(level(a,b,state.to));
 }
 return segments;
}

/** A piece of trail to draw once: a canvas of `width` by `height` at (`left`, `top`) in its space, and the path inside it in the canvas's own coordinates. */
export interface TrailPatch {space:number;left:number;top:number;width:number;height:number;d:string}
/** A tile of settled history. A key is handed on once its tile has left the chart, so a renderer can keep the views. */
export interface TrailTile extends TrailPatch {key:number;/** Chart time at the tile's right edge. */until:number;/** The tile holds one level line. */level?:boolean}
/** The area between the trail and break-even. `from` and `to` are the canvas y of the strongest shade and of none. */
export interface TrailArea extends TrailPatch {from:number;to:number}
export interface TrailView {
 /** Settled history, oldest first. The array is replaced only when a tile is added or dropped. */
 tiles:readonly TrailTile[];
 /** The part that still changes: the newest samples, the tween in flight and the line it will follow, drawn past the pill. */
 live:TrailPatch|null;
 area:TrailArea|null;
}
export interface TrailViewport {
 /** Visible length of the trail in pixels, from the chart's left inset to the pill. */
 span:number;
 /** Chart height in pixels. */
 height:number;
 /** The price at the pill now. */
 display:number;
 /** Break-even price; the area is drawn only for a valid one. */
 basis?:number;
}
export interface TrailOptions {
 /** Tile width in layout pixels. A whole number of device pixels, so neighbouring tiles meet without a seam. */
 tile:number;
 /** Device pixels per layout pixel. */
 pixel:number;
 /** How far ahead of the pill the patch is drawn, in ms. Default 2000. */
 lookahead?:number;
 /** The patch is drawn again when the pill comes within this many ms of its end. Default 500. */
 reserve?:number;
}

const STROKE=2;       // Room above and below a path for half the 2.5px line and its antialiasing.
const OVERLAP=4;      // Each canvas draws this far past its edges so the line's joins cross them unbroken.
const round=(value:number)=>{const rounded=Math.round(value*100)/100;return rounded===0?0:rounded;};
const flat=(s:TrailSegment)=>s[1]===s[3]&&s[1]===s[5]&&s[1]===s[7];

/**
 * Cuts the trail into drawn-once pieces. Call `start` with the first space and `seed` with the first price, `retarget`
 * whenever the tween's state changes and `view` for the pieces. `view` returns the same object, so nothing is drawn, until
 * the price has changed course or the pill has nearly reached the end of what was drawn ahead of it. `flip` moves new
 * pieces to the other of the two spaces and leaves the tiles already drawn where they are.
 */
export function trailTiles({tile,pixel,lookahead=2000,reserve=500}:TrailOptions){
 const tileMs=tile*1000/ALTIMETER_FLOW_PX,overlapMs=OVERLAP*1000/ALTIMETER_FLOW_PX;
 const floor=(value:number)=>Math.floor(value*pixel+1e-6)/pixel,ceil=(value:number)=>Math.ceil(value*pixel-1e-6)/pixel;
 // The tween states since the last piece of history was cut, the first of them in effect at `settledUntil`.
 let log:TweenChange[]=[];
 // The path already followed that is still on the chart, oldest first, and the chart time it reaches.
 let settled:TrailSegment[]=[],settledUntil=NaN;
 // Frozen tiles, the chart time at the left edge of the next one, and the chart time the patch is drawn up to.
 let tiles:TrailTile[]=[],edge=NaN,drawnUntil=-Infinity;
 const spaces:[TrailSpace|undefined,TrailSpace|undefined]=[undefined,undefined];
 let current=0,dirty=true,shown:TrailView|undefined,port:TrailViewport|undefined;

 const liveAt=(t:number)=>{
  let state=log[0]?.state;
  for(const change of log){if(change.at<=t)state=change.state;else break;}
  return state?tweenValue(state,t):NaN;
 };
 const within=(segments:readonly TrailSegment[],from:number,until:number)=>segments.filter(segment=>segment[6]>from&&segment[0]<until);
 /** Highest and lowest y of the segments' control points, which bound the curve. */
 const extent=(frame:TrailSpace,segments:readonly TrailSegment[])=>{
  let top=Infinity,bottom=-Infinity;
  for(const segment of segments)for(let i=1;i<8;i+=2){const y=trailY(frame,segment[i]);if(y<top)top=y;if(y>bottom)bottom=y;}
  return {top,bottom};
 };
 /** One subpath through the segments, which run on from one another, in a canvas at (`left`, `top`). */
 const path=(frame:TrailSpace,segments:readonly TrailSegment[],left:number,top:number)=>{
  const x=(t:number)=>round(trailX(frame,t)-left),y=(price:number)=>round(trailY(frame,price)-top);
  let d='';
  for(let i=0;i<segments.length;i++){
   const s=segments[i];
   if(i===0)d=`M${x(s[0])} ${y(s[1])}`;
   d+=flat(s)?`H${x(s[6])}`:`C${x(s[2])} ${y(s[3])} ${x(s[4])} ${y(s[5])} ${x(s[6])} ${y(s[7])}`;
  }
  return d;
 };
 /** The canvas that holds the line through `segments` between `left` and `right`. */
 const patch=(space:number,frame:TrailSpace,segments:readonly TrailSegment[],left:number,right:number):TrailPatch|null=>{
  if(!segments.length||!(right>left))return null;
  const bounds=extent(frame,segments),top=floor(bounds.top-STROKE);
  return {space,left,top,width:right-left,height:ceil(bounds.bottom+STROKE)-top,d:path(frame,segments,left,top)};
 };
 /** The lowest key no tile holds. */
 const freeKey=()=>{const held=new Set(tiles.map(item=>item.key));let key=0;while(held.has(key))key++;return key;};

 function build(now:number,viewport:TrailViewport):TrailView{
  const frame=spaces[current];
  if(!frame||!log.length)return {tiles,live:null,area:null};
  // Everything up to now has happened: it joins the history, and the states that only shaped it are forgotten.
  if(now>settledUntil){
   for(const segment of liveSegments(log,settledUntil,now)){
    const last=settled[settled.length-1];
    // A level run carries on as one segment however many times it is cut.
    if(last&&flat(last)&&flat(segment)&&last[7]===segment[1]&&last[6]===segment[0])settled[settled.length-1]=level(last[0],segment[6],segment[1]);
    else settled.push(segment);
   }
   settledUntil=now;
   let active=0;
   for(let i=0;i<log.length;i++)if(log[i].at<=now)active=i;
   if(active>0)log=log.slice(active);
  }
  const visibleFrom=now-viewport.span*1000/ALTIMETER_FLOW_PX;
  let changed=false;
  // Drop the tiles that have left the chart, then freeze every tile the history now covers. A new tile takes a key a
  // dropped one held, so its views are reused.
  const kept=tiles.findIndex(item=>item.until+overlapMs>visibleFrom);
  if(kept!==0){tiles=kept<0?[]:tiles.slice(kept);changed=true;}
  if(!Number.isFinite(edge))edge=Math.max(visibleFrom,settled[0]?.[0]??visibleFrom);
  let fresh:TrailTile|undefined;
  for(;;){
   // A space that took over part-way through a tile starts with the whole of that tile: an overlap, never a gap.
   const index=Math.floor(trailX(frame,edge)/tile+1e-6),until=frame.t0+(index+1)*tileMs;
   if(!(settledUntil>=until+overlapMs))break;
   if(until+overlapMs>visibleFrom){
    const begin=frame.t0+index*tileMs,parts=within(settled,begin-overlapMs,until+overlapMs);
    const drawn=patch(current,frame,parts,floor(index*tile),floor((index+1)*tile));
    if(drawn){
     if(!changed){tiles=tiles.slice();changed=true;}
     // Tiles frozen together that hold the same level line become one wide tile: a quiet price draws one canvas for
     // a second and a half of trail, and a chart that starts or resumes draws one for all of it.
     const even=parts.every(flat);
     if(fresh&&fresh.level&&even&&fresh.top===drawn.top&&fresh.height===drawn.height&&fresh.left+fresh.width===drawn.left){
      fresh={...fresh,width:fresh.width+drawn.width,until,d:`M${-OVERLAP} ${round(fresh.height/2)}H${round(fresh.width+drawn.width+OVERLAP)}`};
      tiles[tiles.length-1]=fresh;
     }else{
      fresh={...drawn,key:freeKey(),until,level:even};
      if(even)fresh.d=`M${-OVERLAP} ${round(fresh.height/2)}H${round(fresh.width+OVERLAP)}`;
      tiles.push(fresh);
     }
    }
   }
   edge=until;
  }
  let stale=0;
  while(stale<settled.length&&settled[stale][6]<Math.min(visibleFrom,edge)-2*overlapMs)stale++;
  if(stale)settled=settled.slice(stale);

  // The patch beside the pill: what has not reached a tile edge yet, the tween in flight and the level it ends on.
  const ahead=now+lookahead,index=Math.floor(trailX(frame,edge)/tile+1e-6),begin=frame.t0+index*tileMs;
  const coming=liveSegments(log,now,ahead);
  const right=ceil(trailX(frame,ahead));
  const live=patch(current,frame,[...within(settled,begin-overlapMs,Infinity),...coming],floor(index*tile),right);
  drawnUntil=ahead;

  let area:TrailArea|null=null;
  const {basis,display,height}=viewport;
  if(basis!=null&&Number.isFinite(basis)&&basis>0&&Number.isFinite(display)&&basis!==display){
   // The chart shows half its height either side of the pill. The area is clipped to that, with room for the price to
   // travel to the tween's end. Its shade is strongest where the pill is heading, which is where it will be for all
   // but the tween's 300ms.
   const tip=trailY(frame,display),target=trailY(frame,liveAt(ahead)),room=height/2+ALTIMETER_TICK_PX,line=trailY(frame,basis);
   const low=Math.min(tip,target)-room,high=Math.max(tip,target)+room;
   const curve=[...within(settled,visibleFrom-overlapMs,Infinity),...coming],bounds=extent(frame,curve);
   const left=floor(trailX(frame,visibleFrom)-OVERLAP);
   const top=floor(Math.max(low,Math.min(bounds.top,line))),bottom=ceil(Math.min(high,Math.max(bounds.bottom,line)));
   if(curve.length&&bottom>top&&right>left&&line!==target){
    // Close the outline along break-even, or just outside the canvas when break-even is beyond it.
    const close=round(Math.max(-OVERLAP,Math.min(bottom-top+OVERLAP,line-top)));
    const shadeEnd=Math.max(target-height/2,Math.min(target+height/2,line));
    area={space:current,left,top,width:right-left,height:bottom-top,
     d:`${path(frame,curve,left,top)}V${close}H${round(trailX(frame,curve[0][0])-left)}Z`,from:round(target-top),to:round(shadeEnd-top)};
   }
  }
  return {tiles,live,area};
 }

 return {
  reset(){log=[];settled=[];settledUntil=NaN;tiles=[];edge=NaN;drawnUntil=-Infinity;spaces[0]=spaces[1]=undefined;current=0;dirty=true;shown=undefined;},
  /** Whether a first price has been given since the last reset. */
  get seeded(){return log.length>0;},
  /** The space new pieces are drawn in: 0 or 1. */
  get current(){return current;},
  /** Chart time at the left edge of the next tile, where a new space takes over from the one before. */
  get edge(){return edge;},
  /** Draw in `space`, as the first (default) or second of the two. Call after `reset`, before `seed`. */
  start(space:TrailSpace,index:0|1=0){spaces[0]=spaces[1]=undefined;spaces[index]=space;current=index;dirty=true;},
  /** Draw every later piece in the other space, and return its index. Tiles already drawn stay in theirs until they leave the chart. */
  flip(space:TrailSpace):number{
   current=1-current;spaces[current]=space;
   // Tiles this space still held from an earlier turn would move with its new origin.
   if(tiles.some(item=>item.space===current))tiles=tiles.filter(item=>item.space!==current);
   dirty=true;return current;
  },
  /** A level trail `keep` ms long ending at `now`, as the chart shows before it has any history. */
  seed(now:number,price:number,keep:number){
   log=[{at:now,state:{from:price,to:price,start:now,tangent:0}}];
   settled=[level(now-keep,now,price)];settledUntil=now;tiles=[];edge=NaN;drawnUntil=-Infinity;dirty=true;
  },
  /** The tween changed course at `at`: the line ahead of the pill is drawn again. */
  retarget(state:AltimeterTweenState,at:number){log.push({at,state});dirty=true;},
  view(now:number,viewport:TrailViewport):TrailView{
   if(shown&&!dirty&&now+reserve<=drawnUntil&&port&&port.span===viewport.span&&port.height===viewport.height&&port.basis===viewport.basis)return shown;
   dirty=false;port={...viewport};
   return shown=build(now,viewport);
  },
 };
}
