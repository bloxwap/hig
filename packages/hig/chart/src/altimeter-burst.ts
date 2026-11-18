import {tokens} from '@bloxwap/hig/tokens';

/** Coalesce noisy crossings into at most one burst per cooldown, with no queued effects. */
export {ALTIMETER_BURST_COOLDOWN_MS} from './altimeter-core.js';
import {sparkGeometry} from './altimeter-core.js';
const easing=`cubic-bezier(${tokens.easing.standard.join(',')})`;

/** A bounded, compositor-driven burst radiating from the price pill. No frame loop or motion dependency. */
export function burstAtPill(pill:HTMLElement,layer:HTMLElement,color:string,direction:'up'|'down'):()=>void{
 if(typeof pill.animate!=='function')return ()=>{};
 // Measure once, before the shake, so the origin follows the pill's actual size and position.
 const width=pill.offsetWidth,height=pill.offsetHeight;
 const x=pill.offsetLeft+width/2,y=pill.offsetTop+height/2;
 const burst=document.createElement('span');
 burst.dataset.higAltimeterBurst='';
 Object.assign(burst.style,{position:'absolute',left:`${x}px`,top:`${y}px`,color});
 layer.append(burst);
 const animations:Animation[]=[];
 animations.push(pill.animate([
  {transform:'translate(0, 0)'},{transform:'translate(-4px, -2px)',offset:.18},
  {transform:'translate(3px, 1px)',offset:.36},{transform:'translate(-2px, 1px)',offset:.58},
  {transform:'translate(1px, -1px)',offset:.78},{transform:'translate(0, 0)'},
 ],{duration:tokens.motion.base,easing:'linear'}));
 const ring=document.createElement('span');
 Object.assign(ring.style,{position:'absolute',left:`${-width/2}px`,top:`${-height/2}px`,width:`${width}px`,height:`${height}px`,border:'2px solid currentColor',boxShadow:'0 0 8px currentColor',borderRadius:`${tokens.radius.pill}px`,boxSizing:'border-box'});
 burst.append(ring);
 animations.push(ring.animate([{transform:'scale(.95)',opacity:.95},{transform:'scale(1.6)',opacity:0}],{duration:tokens.motion.base,easing,fill:'forwards'}));
 for(let i=0;i<24;i++){
  const {dx,dy,distance,size}=sparkGeometry(i,direction);
  const spark=document.createElement('span');
  // Begin just inside the capsule, then travel outward from its perimeter.
  const startX=dx*Math.max(0,width/2-3),startY=dy*Math.max(0,height/2-3);
  Object.assign(spark.style,{position:'absolute',left:`${-size/2}px`,top:`${-size/2}px`,width:`${size}px`,height:`${size}px`,background:'currentColor',borderRadius:'50%',boxShadow:'inset 0 0 2px #fff, 0 0 6px currentColor'});
  burst.append(spark);
  animations.push(spark.animate([
   {transform:`translate(${startX}px, ${startY}px)`,opacity:1},
   {opacity:1,offset:.65},
   {transform:`translate(${startX+dx*distance}px, ${startY+dy*distance}px)`,opacity:0},
  ],{duration:tokens.motion.base*2,easing,fill:'forwards'}));
 }
 const clear=()=>{for(const animation of animations)animation.cancel();burst.remove();};
 void Promise.all(animations.map(animation=>animation.finished)).then(clear,clear);
 return clear;
}
