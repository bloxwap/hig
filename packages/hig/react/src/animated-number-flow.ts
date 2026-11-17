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
interface Turn {delta:number;animation:Animation}
interface Reel {frame:HTMLElement;strip:HTMLElement;origin:number;target:number;length:number;glyphs:Map<number,HTMLElement>;active:Turn[]}
const part='[data-hig-flow-key]',drawnDigit='.hig-number-flow-digit';
// A browser without `linear()` throws on the first animation that asks for it; from then on every animation takes the fallback.
let sampledEasing=true;

/**
 * NumberFlow's motion over elements React drew. React owns the final text of every part; this adds what moves, and removes it
 * when it lands, so nothing here survives into a render:
 * - a window over a turning place and, inside it, a strip of glyphs that rolls through every digit between the old and the new;
 * - a sideways slide for each part whose position changed (first, last, invert, play), so a figure that gains or loses a
 *   place closes up instead of jumping;
 * - a fade for parts that arrive, and a fading copy of each part that left;
 * - a clip on the digits (first digit to last, with the separators between) that travels from their old edges to their new
 *   ones, so a place arriving or leaving passes under the edge rather than over the sign or the text beside it.
 * Every roll and slide is an additive animation on `transform`, so a new value joins the motion in flight instead of restarting
 * it, and the compositor runs it: after the commit that starts it there is no script, no style recalculation and no layout
 * per frame. Fades animate `opacity`, and the clip animates `clip-path` only while the figure changes width.
 */
export class NumberFlowEngine {
 private root:HTMLElement|null=null;private before:Map<string,Before>|null=null;private extent:Extent|null=null;private clip:Animation|null=null;
 private readonly reels=new Map<HTMLElement,Reel>();private readonly running=new Set<Animation>();private readonly fades=new Map<Element,Animation>();private ghosts=0;
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
  const root=this.root,before=this.before,extent=this.extent;this.before=null;this.extent=null;if(!root||!before)return;
  const core=root.querySelector<HTMLElement>('.hig-number-flow-digits'),layers={digits:core?.querySelector<HTMLElement>(':scope > .hig-number-flow-ghosts')??null,around:root.querySelector<HTMLElement>(':scope > .hig-number-flow-ghosts')};
  // Read everything first, then write, so the commit costs one layout.
  const now=Array.from(root.querySelectorAll<HTMLElement>(part)),keys=now.map(element=>element.dataset.higFlowKey as string),present=new Set(keys),rects=now.map(element=>element.getBoundingClientRect()),edges=core?.getBoundingClientRect(),origins={digits:layers.digits?.getBoundingClientRect(),around:layers.around?.getBoundingClientRect()};
  const shift=new Map<string,number>();
  now.forEach((_,index)=>{const prior=before.get(keys[index]);if(prior&&!keys[index].startsWith('ghost:'))shift.set(keys[index],prior.left-rects[index].left);});
  // A part with no place of its own in both readings travels with its nearest neighbour that has one, on the side it is anchored to.
  const travel=(order:readonly string[],index:number,side:-1|1)=>{for(const direction of [side,-side])for(let at=index+direction;at>=0&&at<order.length;at+=direction){const dx=shift.get(order[at]);if(dx!==undefined)return dx;}return 0;};
  const slide=(element:HTMLElement,dx:number)=>{if(Math.abs(dx)>0.01)this.play(element,{transform:[`translateX(${dx}px)`,'translateX(0px)']},motion.transform,{composite:'add'});};
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
 }
 /** Turn the places whose digits changed. `glyphs` are the ten digits of the reading's numbering system, zero first. */
 spin(spins:ReadonlyMap<string,NumberFlowSpin>,glyphs:readonly string[],timing:NumberFlowWebTiming){
  const root=this.root;if(!root||!spins.size)return;
  for(const place of root.querySelectorAll<HTMLElement>('[data-hig-flow-digit]')){
   const spin=spins.get(place.dataset.higFlowKey as string);if(!spin||!spin.delta)continue;
   let reel=this.reels.get(place);
   if(reel&&reel.length!==spin.length){this.settle(place,reel);reel=undefined;}
   if(!reel){const frame=document.createElement('span'),strip=document.createElement('span');frame.className='hig-number-flow-window';strip.className='hig-number-flow-strip';frame.appendChild(strip);place.appendChild(frame);place.dataset.spinning='';reel={frame,strip,origin:spin.from,target:spin.from,length:spin.length,glyphs:new Map(),active:[]};this.reels.set(place,reel);}
   const turning=reel,target=turning.target+spin.delta;
   // The strip holds the glyphs between wherever the place can be drawn right now (its target less what is still in flight) and
   // its new target. A place that keeps turning the same way faster than it settles would grow without bound, so past four
   // turns of the reel the turns in flight land at once and this one starts from the last target.
   let low=turning.target,high=turning.target;for(const turn of turning.active){if(turn.delta>0)low-=turn.delta;else high-=turn.delta;}
   low=Math.min(low,target);high=Math.max(high,target);
   if(high-low>turning.length*4){for(const turn of turning.active)this.stop(turn.animation);turning.active=[];low=Math.min(turning.target,target);high=Math.max(turning.target,target);}
   for(const [position,glyph] of turning.glyphs)if(position<low||position>high){glyph.remove();turning.glyphs.delete(position);}
   for(let position=low;position<=high;position++)if(!turning.glyphs.has(position)){const glyph=document.createElement('span');glyph.className='hig-number-flow-glyph';glyph.textContent=glyphs[numberFlowGlyph(position,turning.length)]??'';glyph.style.top=`${(position-turning.origin)*100}%`;turning.strip.appendChild(glyph);turning.glyphs.set(position,glyph);}
   turning.target=target;turning.strip.style.transform=`translateY(${-(target-turning.origin)*100}%)`;
   const turn:{delta:number;animation:Animation|null}={delta:spin.delta,animation:null};
   turn.animation=this.play(turning.strip,{transform:[`translateY(${spin.delta*100}%)`,'translateY(0%)']},timing,{composite:'add'},()=>{turning.active=turning.active.filter(other=>other!==turn);if(!turning.active.length&&this.reels.get(place)===turning)this.settle(place,turning);});
   if(turn.animation)turning.active.push(turn as Turn);else if(!turning.active.length)this.settle(place,turning);
  }
 }
 /** Stop everything where it is going: the parts are left exactly as React drew them. */
 cancel(){
  this.before=null;this.extent=null;this.clip=null;
  for(const [place,reel] of Array.from(this.reels))this.settle(place,reel);
  for(const animation of Array.from(this.running))this.stop(animation);
  this.fades.clear();for(const layer of this.root?.querySelectorAll('.hig-number-flow-ghosts')??[])layer.replaceChildren();
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
