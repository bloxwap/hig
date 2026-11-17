/**
 * What every HIG toast host agrees on. On web Sonner is the engine and takes these values as props; on native HIG's own
 * host runs the same arithmetic as worklets on the UI thread, so it is tested here as plain functions. The figures are
 * Sonner's, read from sonner 2.0.8, except where a comment says otherwise.
 */
export type ToastSeverity='info'|'success'|'warning'|'error';
export type ToastId=string|number;
export type ToastPosition='top-left'|'top-center'|'top-right'|'bottom-left'|'bottom-center'|'bottom-right';
export type ToastSwipeDirection='top'|'right'|'bottom'|'left';
/** Options `toast()` takes on every platform. Each platform adds `action`, a node of its own renderer. */
export interface ToastBaseOptions {
 /** Picks the symbol and its token role. Where the platform can interrupt, an `error` is announced at once and everything else waits its turn. Default `info`. */
 severity?:ToastSeverity;
 /** A second line under the message, in regular weight. */
 description?:string;
 /** Accessible name of the close control; defaults to the provider's `dismissNotice` wording. */
 dismissName?:string;
 /** Milliseconds before the notice leaves by itself; the Toaster's `duration` when omitted. `Infinity` keeps it until dismissed. */
 duration?:number;
 /** Raising a notice with the id of one that is showing replaces it in place and restarts its time. */
 id?:ToastId;
 /** Called once when the notice is dismissed: its close control, a swipe, or `dismissToast`. */
 onDismiss?:()=>void;
 /** Called once when the notice's time runs out. */
 onAutoClose?:()=>void;
}
/** Milliseconds a notice stays without a `duration`. */
export const TOAST_DURATION=4000;
/** Notices drawn at once; older ones wait behind them. */
export const TOAST_VISIBLE=3;
/** Points between notices in an expanded stack, and how far each one behind the front peeks out of a collapsed stack. */
export const TOAST_GAP=14;
/** Width of the stack on a wide window, in points. A narrow window gives it the full width between the offsets. */
export const TOAST_WIDTH=356;
/** Windows narrower than this are narrow. */
export const TOAST_NARROW=600;
/** Distance from the screen edge on a wide and on a narrow window, added to the safe-area inset. */
export const TOAST_OFFSET=24;
export const TOAST_NARROW_OFFSET=16;
/** How much smaller each notice behind the front is drawn in a collapsed stack. */
export const TOAST_STACK_SCALE=0.05;
/** Entering and restacking: 400ms on the CSS `ease` curve. */
export const TOAST_MOTION={duration:400,curve:[0.25,0.1,0.25,1]} as const;
/** Leaving, and the swipe out: 200ms on the CSS `ease-out` curve. */
export const TOAST_EXIT={duration:200,curve:[0,0,0.58,1]} as const;
/** Reduced motion: nothing slides or scales, and opacity changes over this long. HIG's own figure; Sonner cuts to the end state. */
export const TOAST_REDUCED_FADE=150;
/** A swipe released this far from rest dismisses. */
export const TOAST_SWIPE_THRESHOLD=45;
/** A swipe released faster than this (points per second) dismisses whatever its distance. HIG's own figure: Sonner divides the distance by the time since the pointer went down, which a hold before the flick defeats. */
export const TOAST_FLICK=500;
/** Notices the store keeps; past it the oldest timed ones are dropped. HIG's own figure, bounding a burst. */
export const TOAST_QUEUE_LIMIT=16;
/** The spring a released swipe returns on: critically damped, so it settles without a bounce. */
export const TOAST_SPRING={damping:36,stiffness:320,mass:1,overshootClamping:true} as const;

/** The edge a position hangs from: `lift` is 1 when the stack grows down from the top and -1 when it grows up from the bottom. */
export function toastEdge(position:ToastPosition):{y:'top'|'bottom';x:'left'|'center'|'right';lift:1|-1}{
 const [y,x]=position.split('-') as ['top'|'bottom','left'|'center'|'right'];
 return {y,x,lift:y==='top'?1:-1};
}
/** Directions a swipe dismisses in when the host names none: towards the edges the stack sits against. */
export function toastSwipeDirections(position:ToastPosition):ToastSwipeDirection[]{
 const {y,x}=toastEdge(position);
 return x==='center'?[y]:[y,x];
}

/** One notice in the store. `key` never changes and is never reused; `revision` counts in-place replacements. */
export interface ToastEntry<T> {key:number;id:ToastId;revision:number;duration?:number;leaving:boolean;value:T}
const persistent=<T>(entry:ToastEntry<T>)=>entry.duration===Infinity;
/** Keeps at most `limit` live notices: the oldest timed ones go first, then the oldest of any kind, and the newest is the last to go. Notices already leaving are not counted. */
export function toastCap<T>(list:readonly ToastEntry<T>[],limit:number=TOAST_QUEUE_LIMIT):readonly ToastEntry<T>[]{
 let overflow=list.filter(entry=>!entry.leaving).length-limit;
 if(overflow<=0)return list;
 const newest=list.length-1;
 let kept=list.filter((entry,index)=>{if(overflow<=0||index===newest||entry.leaving||persistent(entry))return true;overflow-=1;return false;});
 if(overflow>0)kept=kept.filter(entry=>{if(overflow<=0||entry.leaving)return true;overflow-=1;return false;});
 return kept;
}
/** Adds a notice as the newest, or replaces the live notice with the same id where it stands. A notice that is already leaving is not revived: the new one is added. */
export function toastUpsert<T>(list:readonly ToastEntry<T>[],next:{key:number;id:ToastId;duration?:number;value:T},limit:number=TOAST_QUEUE_LIMIT):readonly ToastEntry<T>[]{
 const index=list.findIndex(entry=>entry.id===next.id&&!entry.leaving);
 if(index<0)return toastCap([...list,{...next,revision:0,leaving:false}],limit);
 const copy=list.slice();copy[index]={...list[index],duration:next.duration,value:next.value,revision:list[index].revision+1};
 return copy;
}
/** Marks the live notice with this id, or every live notice when the id is omitted, as leaving. Returns the same list when nothing changed. */
export function toastLeave<T>(list:readonly ToastEntry<T>[],id?:ToastId):readonly ToastEntry<T>[]{
 if(!list.some(entry=>!entry.leaving&&(id===undefined||entry.id===id)))return list;
 return list.map(entry=>!entry.leaving&&(id===undefined||entry.id===id)?{...entry,leaving:true}:entry);
}
/** Drops one notice for good, once it has left. Returns the same list when the key is gone already. */
export function toastRemove<T>(list:readonly ToastEntry<T>[],key:number):readonly ToastEntry<T>[]{
 return list.some(entry=>entry.key===key)?list.filter(entry=>entry.key!==key):list;
}
/** The stack: live notices, newest (the front) first. */
export function toastOrder<T>(list:readonly ToastEntry<T>[]):ToastEntry<T>[]{
 return list.filter(entry=>!entry.leaving).reverse();
}

/** Where a notice rests: a translation along the stack, its scale about its centre, its opacity and the opacity of what it holds. */
export interface ToastSlot {y:number;scaleX:number;scaleY:number;opacity:number;content:number}
/**
 * The resting place of the notice `index` places behind the front (0 is the front). `heights` are the laid-out heights of
 * the stack, front first. Expanded, notices sit one after another `gap` apart. Collapsed, each notice behind the front is
 * drawn at the front's height, a little smaller and `gap` further out, with its content hidden: only its far edge shows.
 * Every notice is anchored at the stack's edge and scales about its own centre, so the translation carries the difference
 * in height. A notice past `visible`, or not in the stack (`index` below 0), is transparent.
 */
export function toastSlot(index:number,heights:readonly number[],expanded:boolean,gap:number,visible:number,lift:1|-1):ToastSlot{
 'worklet';
 const opacity=index>=0&&index<visible?1:0;
 if(index<=0)return {y:0,scaleX:1,scaleY:1,opacity,content:1};
 if(expanded){let before=0;for(let place=0;place<index;place++)before+=heights[place]??0;return {y:lift*(before+index*gap),scaleX:1,scaleY:1,opacity,content:1};}
 const front=heights[0]??0,own=heights[index]??0,scale=Math.max(0,1-index*TOAST_STACK_SCALE);
 return {y:lift*(index*gap+(front-own)/2),scaleX:scale,scaleY:own>0&&front>0?scale*front/own:scale,opacity,content:0};
}
/** Where a notice starts its entrance: its own height before its slot, on the side the stack hangs from. */
export function toastEnterFrom(slotY:number,height:number,lift:1|-1):number{
 'worklet';
 return slotY-lift*height;
}
/** Where a notice goes as it leaves: back out by its own height when it is the front or the stack is expanded, and nowhere (it fades where it is) from behind a collapsed stack. */
export function toastExitTo(slotY:number,height:number,lift:1|-1,slides:boolean):number{
 'worklet';
 return slides?slotY-lift*height:slotY;
}

/** The axis a drag is locked to, from its first movement. */
export function toastSwipeAxis(dx:number,dy:number):'x'|'y'{
 'worklet';
 return Math.abs(dx)>Math.abs(dy)?'x':'y';
}
/**
 * How far the notice follows a drag of `delta` points along its locked axis. `backward` allows the negative direction
 * (left or up) and `forward` the positive one (right or down). An allowed direction follows the finger 1:1; the other
 * resists more the further it goes and never passes 20 points. An axis with no allowed direction does not move.
 */
export function toastDrag(delta:number,backward:boolean,forward:boolean):number{
 'worklet';
 if(!backward&&!forward)return 0;
 if(delta<0?backward:forward)return delta;
 return delta/(1.5+Math.abs(delta)/20);
}
/** Whether a release dismisses: in an allowed direction, and either far enough or fast enough that way. `velocity` is in points per second along the axis. */
export function toastSwipeDismisses(amount:number,velocity:number,backward:boolean,forward:boolean):boolean{
 'worklet';
 if(amount===0||!(amount<0?backward:forward))return false;
 return Math.abs(amount)>=TOAST_SWIPE_THRESHOLD||velocity*(amount<0?-1:1)>=TOAST_FLICK;
}
/**
 * The swipe out: on from where the finger let go by the notice's own `size` along the axis. It takes 200ms, or less for
 * a fast flick so the notice does not slow down as it leaves the finger: the `ease-out` curve starts 1.72 times faster
 * than its average speed, and the duration is chosen so that start matches the release velocity, no shorter than 100ms.
 */
export function toastSwipeOut(amount:number,velocity:number,size:number):{to:number;duration:number}{
 'worklet';
 const direction=amount<0?-1:1,speed=velocity*direction;
 const matched=speed>0?1.72*size/speed*1000:TOAST_EXIT.duration;
 return {to:amount+direction*size,duration:Math.max(100,Math.min(TOAST_EXIT.duration,matched))};
}

/** A notice's time: what is left, and when it last started running (`null` while paused). */
export interface ToastClock {remaining:number;startedAt:number|null}
/** Starts or keeps a clock running at `now`. */
export function toastClockRun(clock:ToastClock,now:number):ToastClock{return clock.startedAt===null?{remaining:clock.remaining,startedAt:now}:clock;}
/** Pauses a clock at `now`, keeping what is left. */
export function toastClockPause(clock:ToastClock,now:number):ToastClock{return clock.startedAt===null?clock:{remaining:Math.max(0,clock.remaining-(now-clock.startedAt)),startedAt:null};}
