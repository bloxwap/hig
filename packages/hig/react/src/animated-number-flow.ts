import {numberFlowEasingCSS,numberFlowGlyph,type NumberFlowTimings} from '@bloxwap/hig/contracts/number-flow';
import {numberFlowAnchorSide} from './animated-number-model.js';

/** One timing as the Web Animations API takes it. `fallback` is the curve for a browser without `linear()`. */
export interface NumberFlowWebTiming {duration:number;easing:string;fallback:string}
export interface NumberFlowWebMotion {spin:NumberFlowWebTiming;transform:NumberFlowWebTiming;opacity:NumberFlowWebTiming}
/** One place's turn: how many glyphs, around a reel of what length, starting from which digit when the place is not already turning. */
export interface NumberFlowSpin {delta:number;length:number;from:number}
export function numberFlowWebMotion(timings:NumberFlowTimings):NumberFlowWebMotion{
 const web=({duration,easing}:NumberFlowTimings['spin']):NumberFlowWebTiming=>({duration,easing:numberFlowEasingCSS(easing),fallback:numberFlowEasingCSS(easing,false)});
 return {spin:web(timings.spin),transform:web(timings.transform),opacity:web(timings.opacity)};
}

interface Before {element:HTMLElement;left:number;top:number;opacity:number;text:string}
interface Extent {left:number;right:number}
/**
 * A movement in flight on one element: a strip's turn or a part's slide. `frames` are its keyframes as an additive animation;
 * `alone` is one that runs with nothing else on its element, as a plain animation between two positions.
 */
interface Turn {delta:number;frames:[string,string];animation:Animation;timing:NumberFlowWebTiming;alone:boolean;landed:()=>void}
interface Reel {frame:HTMLElement;strip:HTMLElement;origin:number;target:number;length:number;glyphs:Map<number,HTMLElement>;active:Turn[]}
const part='[data-hig-flow-key]',drawnDigit='.hig-number-flow-digit';
// A browser without `linear()` throws on the first animation that asks for it; from then on every animation takes the fallback.
let sampledEasing=true;
// Rolls and slides are added to a transform that already holds the resting position. A browser from before 2023 ignores
// `composite: 'add'` and would replace that transform, rolling the wrong glyphs through the window, so there nothing moves and
// every value is drawn at once. (No `KeyframeEffect` at all is a test double for `animate`, which is taken at its word.)
const additive=()=>typeof KeyframeEffect==='undefined'||'composite' in KeyframeEffect.prototype;
// A turn or a slide that is alone on its element does not need to be added to anything: it is the same motion written as a
// plain animation from where the element is to where it rests. That matters in Chromium, which keeps additive animations on
// the main thread (a style recalculation every frame) and hands plain ones to the compositor, where a busy page cannot make
// them stutter. When a second movement joins it, the first is swapped for its additive twin on the same clock, which takes a
// start time that can be set; where an animation has none (a test double), every movement is additive from the start.
const retimable=()=>typeof Animation!=='undefined'&&'startTime' in Animation.prototype;
// One commit can change many figures, and each reads where its parts are before it moves them. Taken figure by figure, every
// read that follows another figure's writes lays the page out again: forty figures, forty layouts. So a figure that is about to
// change says so before the commit (`expect`), what it would write is held, and when the last of them has read (`done`)
// everything held is written in the order it was asked for: one layout for the commit, however many figures changed. A figure
// that never reports back costs only the wait, since a microtask (still before the next paint) writes what is held.
let expected=0,scheduled=false,held:(()=>void)[]=[];
function release(){expected=0;scheduled=false;const writes=held;held=[];for(const write of writes)write();}
export const numberFlowCommit={
 /** A figure will read and write in the commit that is starting. */
 expect(){expected++;},
 /** That figure has read all it needs: the last one to say so writes for all of them. */
 done(){if(expected>0&&--expected===0)release();}};

/**
 * NumberFlow's motion over elements React drew. React owns the final text of every part; this adds what moves, and removes it
 * when it lands, so nothing here survives into a render:
 * - a window over a turning place and, inside it, a strip of glyphs that rolls through every digit between the old and the new;
 * - a sideways slide for each part whose position changed (first, last, invert, play), so a figure that gains or loses a
 *   place closes up instead of jumping;
 * - a fade for parts that arrive, and a fading copy of each part that left;
 * - a clip on the digits (first digit to last, with the separators between) that travels from their old edges to their new
 *   ones, so a place arriving or leaving passes under the edge rather than over the sign or the text beside it.
 * A roll or a slide that joins another in flight on the same element is an additive animation on `transform`, so a new value
 * joins the motion instead of restarting it. After the commit that starts it there is no script and no layout per frame.
 * Chromium does not hand an additive animation to its compositor, though: it runs on the main thread, one style recalculation
 * a frame for the parts that move (55 for one 900 ms roll against 6 for a plain one), so a movement that is alone on its
 * element, which is most of them, is written as a plain animation instead (see `retimable`). Fades animate `opacity`, and
 * the clip animates `clip-path` only while the figure changes width.
 */
export class NumberFlowEngine {
 private root:HTMLElement|null=null;private before:Map<string,Before>|null=null;private extent:Extent|null=null;private clip:Animation|null=null;
 private readonly reels=new Map<HTMLElement,Reel>();private readonly slides=new Map<HTMLElement,Turn[]>();private readonly running=new Set<Animation>();private readonly fades=new Map<Element,Animation>();private ghosts=0;private epoch=0;
 /** The element holding the parts. Fading copies are drawn in the empty layers React left in it: one inside the digits, clipped with them, and one for the signs and affixes around them. */
 attach(root:HTMLElement|null){this.root=root;}
 /** Whether anything is still moving. */
 get busy(){return this.running.size>0||this.reels.size>0;}
 /** First: where every part is now, read before the commit that changes them. */
 measure(){
  const root=this.root;if(!root){this.before=null;return;}
  const before=new Map<string,Before>(),core=root.querySelector<HTMLElement>('.hig-number-flow-digits')?.getBoundingClientRect();this.extent=core?{left:core.left,right:core.right}:null;
  for(const element of root.querySelectorAll<HTMLElement>(part)){const rect=element.getBoundingClientRect(),shown=element.querySelector(drawnDigit)??element;
   before.set(element.dataset.higFlowKey as string,{element,left:rect.left,top:rect.top,opacity:this.fades.has(element)?Number(getComputedStyle(element).opacity)||0:1,text:shown.textContent??''});}
  this.before=before;
 }
 /** Last, invert, play: slide every part from where it was, fade in what arrived and fade out a copy of what left. Does nothing without a `measure` since the last call. */
 flip(motion:NumberFlowWebMotion){
  const root=this.root,before=this.before,extent=this.extent;this.before=null;this.extent=null;if(!root||!before||!additive())return;
  const core=root.querySelector<HTMLElement>('.hig-number-flow-digits'),layers={digits:core?.querySelector<HTMLElement>(':scope > .hig-number-flow-ghosts')??null,around:root.querySelector<HTMLElement>(':scope > .hig-number-flow-ghosts')};
  // Read everything first, then write, so the commit costs one layout.
  const now=Array.from(root.querySelectorAll<HTMLElement>(part)),keys=now.map(element=>element.dataset.higFlowKey as string),present=new Set(keys),rects=now.map(element=>element.getBoundingClientRect()),edges=core?.getBoundingClientRect(),origins={digits:layers.digits?.getBoundingClientRect(),around:layers.around?.getBoundingClientRect()};
  const shift=new Map<string,number>();
  now.forEach((_,index)=>{const prior=before.get(keys[index]);if(prior&&!keys[index].startsWith('ghost:'))shift.set(keys[index],prior.left-rects[index].left);});
  // Everything from here on writes.
  this.write(()=>{
  // A part with no place of its own in both readings travels with its nearest neighbour that has one, on the side it is anchored to.
  const travel=(order:readonly string[],index:number,side:-1|1)=>{for(const direction of [side,-side])for(let at=index+direction;at>=0&&at<order.length;at+=direction){const dx=shift.get(order[at]);if(dx!==undefined)return dx;}return 0;};
  const slide=(element:HTMLElement,dx:number)=>{if(Math.abs(dx)<=0.01)return;
   const frames:[string,string]=[`translateX(${dx}px)`,'translateX(0px)'],flight=this.join(element,this.slides.get(element)??[]),alone=!flight.length&&retimable();
   const move:Omit<Turn,'animation'>&{animation:Animation|null}={delta:dx,frames,animation:null,timing:motion.transform,alone,landed:()=>{const rest=(this.slides.get(element)??[]).filter(other=>other!==move);if(rest.length)this.slides.set(element,rest);else this.slides.delete(element);}};
   // A part rests where the layout puts it, so alone its slide is these same keyframes without the addition.
   move.animation=this.play(element,{transform:frames},motion.transform,alone?{}:{composite:'add'},move.landed);
   if(move.animation)flight.push(move as Turn);
   if(flight.length)this.slides.set(element,flight);else this.slides.delete(element);
  };
  now.forEach((element,index)=>{const key=keys[index],prior=before.get(key);
   if(prior){slide(element,prior.left-rects[index].left);return;}
   slide(element,travel(keys,index,numberFlowAnchorSide(key)));
   const fade=this.play(element,{opacity:[0,1]},motion.opacity,{},()=>this.fades.delete(element));if(fade)this.fades.set(element,fade);
  });
  const order=Array.from(before.keys());
  order.forEach((key,index)=>{const prior=before.get(key) as Before;if(present.has(key))return;
   const reel=this.reels.get(prior.element);if(reel)this.settle(prior.element,reel);
   const kind=/^(?:digit|sep):/.test(key)?'digits':'around',layer=layers[kind],origin=origins[kind];
   if(key.startsWith('ghost:')||!prior.text||!layer||!origin)return;
   const dx=travel(order,index,numberFlowAnchorSide(key)),ghost=document.createElement('span');
   ghost.className=`${prior.element.className} hig-number-flow-ghost`;ghost.dataset.higFlowKey=`ghost:${++this.ghosts}`;ghost.textContent=prior.text;
   ghost.style.left=`${prior.left-origin.left-dx}px`;ghost.style.top=`${prior.top-origin.top}px`;layer.appendChild(ghost);
   slide(ghost,dx);
   if(!this.play(ghost,{opacity:[prior.opacity,0]},motion.opacity,{fill:'forwards'},()=>ghost.remove()))ghost.remove();
  });
  // The digits' clip starts at their old edges and travels to their new ones with the parts.
  if(core&&edges&&extent){const left=extent.left-edges.left,right=edges.right-extent.right;
   if(Math.abs(left)>0.01||Math.abs(right)>0.01){if(this.clip)this.stop(this.clip);this.clip=this.play(core,{clipPath:[`inset(-1em ${right}px -1em ${left}px)`,'inset(-1em 0px -1em 0px)']},motion.transform,{},()=>{this.clip=null;});}}
  });
 }
 /** Turn the places whose digits changed. `glyphs` are the ten digits of the reading's numbering system, zero first. */
 spin(spins:ReadonlyMap<string,NumberFlowSpin>,glyphs:readonly string[],timing:NumberFlowWebTiming){
  const root=this.root;if(!root||!spins.size||!additive())return;
  this.write(()=>{for(const place of root.querySelectorAll<HTMLElement>('[data-hig-flow-digit]')){
   const spin=spins.get(place.dataset.higFlowKey as string);if(!spin||!spin.delta)continue;
   let reel=this.reels.get(place);
   if(reel&&reel.length!==spin.length){this.settle(place,reel);reel=undefined;}
   if(!reel){const frame=document.createElement('span'),strip=document.createElement('span');frame.className='hig-number-flow-window';strip.className='hig-number-flow-strip';frame.appendChild(strip);place.appendChild(frame);place.dataset.spinning='';reel={frame,strip,origin:spin.from,target:spin.from,length:spin.length,glyphs:new Map(),active:[]};this.reels.set(place,reel);}
   const turning=reel,target=turning.target+spin.delta;
   // A glyph is put on its row with a transform, the unit the strip travels in: WebKit resolves a transform's percentages against
   // the box snapped to device pixels and `top` against the unsnapped one, so rows placed with `top` drift from the strip's
   // travel by up to half a device pixel a glyph, and the digit would jump by that much when the reel is taken away.
   // The strip holds the glyphs between wherever the place can be drawn right now (its target less what is still in flight) and
   // its new target. A place that keeps turning the same way faster than it settles would grow without bound, so past four
   // turns of the reel the turns in flight land at once and this one starts from the last target.
   let low=turning.target,high=turning.target;for(const turn of turning.active){if(turn.delta>0)low-=turn.delta;else high-=turn.delta;}
   low=Math.min(low,target);high=Math.max(high,target);
   if(high-low>turning.length*4){for(const turn of turning.active)this.stop(turn.animation);turning.active=[];low=Math.min(turning.target,target);high=Math.max(turning.target,target);}
   for(const [position,glyph] of turning.glyphs)if(position<low||position>high){glyph.remove();turning.glyphs.delete(position);}
   for(let position=low;position<=high;position++)if(!turning.glyphs.has(position)){const glyph=document.createElement('span');glyph.className='hig-number-flow-glyph';glyph.textContent=glyphs[numberFlowGlyph(position,turning.length)]??'';glyph.style.transform=`translateY(${(position-turning.origin)*100}%)`;turning.strip.appendChild(glyph);turning.glyphs.set(position,glyph);}
   turning.target=target;turning.strip.style.transform=`translateY(${-(target-turning.origin)*100}%)`;
   turning.active=this.join(turning.strip,turning.active);
   const rest=-(target-turning.origin)*100,frames:[string,string]=[`translateY(${spin.delta*100}%)`,'translateY(0%)'],alone=!turning.active.length&&retimable();
   const turn:Omit<Turn,'animation'>&{animation:Animation|null}={delta:spin.delta,frames,animation:null,timing,alone,landed:()=>{turning.active=turning.active.filter(other=>other!==turn);if(!turning.active.length&&this.reels.get(place)===turning)this.settle(place,turning);}};
   // Alone, the turn is written from where the strip is to where it rests; in company it is added to the strip's resting place.
   turn.animation=alone?this.play(turning.strip,{transform:[`translateY(${rest+spin.delta*100}%)`,`translateY(${rest}%)`]},timing,{},turn.landed):this.play(turning.strip,{transform:frames},timing,{composite:'add'},turn.landed);
   if(turn.animation)turning.active.push(turn as Turn);else if(!turning.active.length)this.settle(place,turning);
  }});
 }
 /** Stop everything where it is going: the parts are left exactly as React drew them. */
 cancel(){
  this.before=null;this.extent=null;this.clip=null;this.epoch++;this.slides.clear();
  for(const [place,reel] of Array.from(this.reels))this.settle(place,reel);
  for(const animation of Array.from(this.running))this.stop(animation);
  this.fades.clear();for(const layer of this.root?.querySelectorAll('.hig-number-flow-ghosts')??[])layer.replaceChildren();
 }
 /** Writes now, or with the rest of the commit when other figures are still to read. A `cancel` in between drops it. */
 private write(change:()=>void){
  if(expected<=0){change();return;}
  const epoch=this.epoch;held.push(()=>{if(this.epoch===epoch)change();});
  if(!scheduled){scheduled=true;void Promise.resolve().then(release);}
 }
 /** Makes room on an element for another movement: one in flight alone becomes its additive twin, where it is and on the same clock. Returns what is still in flight. */
 private join(element:HTMLElement,flight:Turn[]):Turn[]{
  return flight.filter(first=>{
   if(!first.alone)return true;
   const twin=this.play(element,{transform:first.frames},first.timing,{composite:'add'},first.landed);
   if(twin){const started=first.animation.startTime,elapsed=first.animation.currentTime;if(started!==null)twin.startTime=started;else if(elapsed!==null)twin.currentTime=elapsed;}
   this.stop(first.animation);first.alone=false;if(twin)first.animation=twin;
   return !!twin;
  });
 }
 private stop(animation:Animation){this.running.delete(animation);animation.onfinish=null;animation.cancel();}
 private settle(place:HTMLElement,reel:Reel){for(const turn of reel.active)this.stop(turn.animation);reel.active=[];reel.frame.remove();delete place.dataset.spinning;this.reels.delete(place);}
 private play(element:HTMLElement,keyframes:PropertyIndexedKeyframes,timing:NumberFlowWebTiming,options:KeyframeAnimationOptions,done?:()=>void):Animation|null{
  // No duration is no motion: the part is simply where it ends.
  if(timing.duration<=0||typeof element.animate!=='function')return null;
  let animation:Animation;
  try{animation=element.animate(keyframes,{...options,duration:timing.duration,easing:sampledEasing?timing.easing:timing.fallback});}
  catch{if(!sampledEasing)return null;sampledEasing=false;try{animation=element.animate(keyframes,{...options,duration:timing.duration,easing:timing.fallback});}catch{return null;}}
  this.running.add(animation);animation.onfinish=()=>{this.running.delete(animation);done?.();};
  return animation;
 }
}
