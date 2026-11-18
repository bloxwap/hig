import type React from 'react';
import {SHEET_CLOSE,SHEET_THROW,SHEET_TRAVEL,backdropProgress,detentHeight,detentHeights,dragPosition,releaseTarget,type SheetSnapPoint} from '@bloxwap/hig/contracts/gesture-sheet';

/**
 * The drag and travel engine of the web GestureSheet. It moves the sheet with `transform` and the overlay with `opacity`
 * and nothing else, on CSS transitions, so a travel can be retargeted or caught where it is, and it takes every number and
 * every release decision from the shared model. The behaviour follows Vaul (https://github.com/emilkowalski/vaul).
 */
export type SheetDirection='bottom'|'top'|'left'|'right';
/** A detent as the host writes it: a number is a share of the viewport (`0.4` is 40%), a string is CSS pixels (`'320px'`) or a percentage (`'40%'`). */
export type SheetPoint=number|string;
type SheetPointer=React.PointerEvent<HTMLDivElement>;
export interface SheetEngineOptions {
 open:boolean;
 direction:SheetDirection;
 snapPoints?:readonly SheetPoint[];
 activeSnapPoint?:SheetPoint|null;
 fadeFromIndex?:number;
 snapToSequentialPoint:boolean;
 handleOnly:boolean;
 dismissible:boolean;
 closeThreshold:number;
 scrollLockTimeout:number;
 container?:HTMLElement|null;
 reducedMotion:boolean;
 shouldScaleBackground:boolean;
 setBackgroundColorOnScale:boolean;
 noBodyStyles:boolean;
 repositionInputs:boolean;
 fixed:boolean;
 preventScroll:boolean;
 preventScrollRestoration:boolean;
 onDrag?:(event:SheetPointer,percentageDragged:number)=>void;
 onRelease?:(event:SheetPointer,open:boolean)=>void;
 /** Ask the host to close. The sheet waits where it is until `open` answers. */
 requestClose:()=>void;
 /** A release settled on this detent. */
 selectSnapPoint:(point:SheetPoint)=>void;
 /** The sheet came to rest open, or finished closing. */
 onSettled:(open:boolean)=>void;
}
const digits=(value:number)=>String(value).replace(/^(-?)0\./,'$1.');
/** A number as CSS is written here, without a leading zero. */
export const cssNumber=digits;
export const cssCurve=(curve:readonly number[])=>`cubic-bezier(${curve.map(digits).join(',')})`;
const TRAVEL=`${SHEET_TRAVEL.duration}ms ${cssCurve(SHEET_TRAVEL.curve)}`;
// A travel whose transition never reports its end, in a hidden tab or on a hidden element, still comes to rest.
const TRAVEL_GRACE=250;
// A press becomes a drag past this many pixels (Vaul).
const SLOP_TOUCH=10,SLOP_MOUSE=2;
// The release velocity is read over this much of the end of the drag, in milliseconds.
const VELOCITY_WINDOW=100;
// The page behind a sheet that scales it: narrower by this many pixels, lowered and rounded (Vaul).
const BACKGROUND_INSET=26,BACKGROUND_SHIFT=14,BACKGROUND_RADIUS=8;
// A visual viewport this much shorter than the layout viewport has the software keyboard up, and a short sheet keeps this clear above it (Vaul).
const KEYBOARD=60,KEYBOARD_INSET=26,KEYBOARD_BUFFER=24;
const KEYLESS=new Set(['checkbox','radio','range','color','file','image','button','submit','reset']);
/** Focusing this element raises the software keyboard. */
const typed=(element:Element)=>element instanceof HTMLTextAreaElement||(element instanceof HTMLInputElement&&!KEYLESS.has(element.type))||(element instanceof HTMLElement&&element.isContentEditable===true);
/** A press here belongs to the control or to the host: text fields, selects, sliders and `data-hig-sheet-no-drag`. */
function guarded(target:Element,sheet:Element){
 for(let node:Element|null=target;node;node=node===sheet?null:node.parentElement){
  if(node.hasAttribute('data-hig-sheet-no-drag')||node.tagName==='SELECT'||typed(node)||(node instanceof HTMLInputElement&&node.type==='range'))return true;
 }
 return false;
}
/** Vaul's snap point forms in the shared model's. */
export function sharedPoint(point:SheetPoint):SheetSnapPoint{
 if(typeof point==='number')return `${point*100}%`;
 const text=point.trim();
 return text.endsWith('%')?text as SheetSnapPoint:parseFloat(text);
}
const safari=()=>typeof navigator!=='undefined'&&/safari/i.test(navigator.userAgent)&&!/chrome|android/i.test(navigator.userAgent);
const ios=()=>typeof navigator!=='undefined'&&(/^iP(hone|ad|od)/.test(navigator.platform)||(/^Mac/.test(navigator.platform)&&navigator.maxTouchPoints>1));
// Safari scrolls the page under a fixed sheet and moves its toolbar as it does. Pinning the body in place stops both;
// every open sheet shares one pin, and the last to close puts the page back where it was (Vaul's position-fixed workaround).
const PIN=['position','top','left','right','height'],PINNED=['position','fixed','important'] as const,HINT='will-change';
let pinned:{style:string[];x:number;y:number;href:string}|null=null,pins=0;
function pinBody(){
 if(pins++>0)return;
 const style=document.body.style,{scrollX:x,scrollY:y}=window;
 pinned={style:PIN.map(name=>style.getPropertyValue(name)),x,y,href:location.href};
 style.setProperty(...PINNED);style.top=`${-y}px`;style.left=`${-x}px`;style.right='0px';style.height='auto';
}
function unpinBody(keepScroll:boolean){
 if(--pins>0||!pinned)return;
 const {style,x,y,href}=pinned;pinned=null;
 PIN.forEach((name,index)=>{if(style[index])document.body.style.setProperty(name,style[index]);else document.body.style.removeProperty(name);});
 if(!keepScroll||href===location.href)window.scrollTo(x,y);
}
// iOS scrolls the page to a focused field even under a scroll lock. The field is focused while moved off screen, so the
// page has nowhere to go, and is then brought into view inside the sheet (the technique of React Aria's usePreventScroll, as in Vaul).
function guardFocus(dragged:()=>boolean){
 const {scrollX:x,scrollY:y}=window;
 const away=(field:HTMLElement,then?:()=>void)=>{field.style.transform='translateY(-2000px)';requestAnimationFrame(()=>{field.style.transform='';then?.();});};
 const reveal=(field:HTMLElement)=>{
  for(let node=field.parentElement;node&&node!==document.body;node=node.parentElement){
   if(!/auto|scroll/.test(getComputedStyle(node).overflowY))continue;
   const box=node.getBoundingClientRect(),rect=field.getBoundingClientRect();
   if(rect.bottom>box.bottom)node.scrollTop+=rect.bottom-box.bottom+KEYBOARD_BUFFER;
   else if(rect.top<box.top)node.scrollTop-=box.top-rect.top+KEYBOARD_BUFFER;
  }
 };
 const touched=(event:TouchEvent)=>{
  const field=event.target;
  if(dragged()||!(field instanceof HTMLElement)||!typed(field)||field===document.activeElement)return;
  event.preventDefault();away(field);field.focus();
 };
 const focused=(event:FocusEvent)=>{
  const field=event.target,view=window.visualViewport;
  if(!(field instanceof HTMLElement)||!typed(field))return;
  away(field,()=>{
   if(!view)return;
   if(view.height<window.innerHeight)requestAnimationFrame(()=>reveal(field));
   else view.addEventListener('resize',()=>reveal(field),{once:true});
  });
 };
 const scrolled=()=>{if(window.scrollX!==x||window.scrollY!==y)window.scrollTo(x,y);};
 document.addEventListener('touchend',touched,{capture:true,passive:false});
 document.addEventListener('focus',focused,true);
 window.addEventListener('scroll',scrolled);
 return ()=>{document.removeEventListener('touchend',touched,{capture:true});document.removeEventListener('focus',focused,true);window.removeEventListener('scroll',scrolled);};
}
export class SheetEngine {
 /** The latest props, replaced on every render. */
 options!:SheetEngineOptions;
 /** The last press moved the sheet, so the click that ends it is not a tap. */
 dragged=false;
 private sheet:HTMLElement|null=null;
 private overlay:HTMLElement|null=null;
 private wrapper:HTMLElement|null=null;
 private phase:'idle'|'open'|'closing'='idle';
 // Offsets along the closing axis: 0 is the sheet at its full height and `closed` is off its edge. `detents` follow the
 // host's snap points, `stops` are the same offsets from the tallest down, as the release rules read them.
 private position=0;
 private index=0;
 private closed=0;
 private room=0;
 private flush=false;
 private detents=[0];
 private stops=[0];
 private travel:{timer:ReturnType<typeof setTimeout>}|null=null;
 private settled:(()=>void)|null=null;
 private press:{id:number;x:number;y:number;target:Element;touch:boolean;scrolled:boolean}|null=null;
 private drag:{start:number;origin:number;scrolled:boolean;samples:{time:number;at:number}[]}|null=null;
 private scrolledAt=Number.NEGATIVE_INFINITY;
 private overshoot=false;
 private lift:{height:string;bottom:string}|null=null;
 private early:(()=>void)[]=[];
 private undo:(()=>void)[]=[];

 private get vertical(){return this.options.direction==='bottom'||this.options.direction==='top';}
 private get sign(){return this.options.direction==='bottom'||this.options.direction==='right'?1:-1;}
 private offset(position:number){
  const distance=`${Math.round(position*this.sign*100)/100}px`;
  return this.vertical?`translate3d(0,${distance},0)`:`translate3d(${distance},0,0)`;
 }
 /** The overlay's strength: full from the fade detent up, none at the detent below it, or at closed when it is the lowest. */
 private fade(position:number){
  const {snapPoints,fadeFromIndex}=this.options;
  if(!snapPoints?.length)return backdropProgress(position,0,this.closed);
  const index=Math.max(0,Math.min(snapPoints.length-1,fadeFromIndex??snapPoints.length-1));
  return backdropProgress(position,this.detents[index],index>0?this.detents[index-1]:this.closed);
 }
 /** The page behind recedes while the sheet is at any detent and comes back as the sheet leaves its lowest one. */
 private recede(position:number){
  const depth=backdropProgress(position,this.stops[this.stops.length-1],this.closed),scale=1-BACKGROUND_INSET/Math.max(window.innerWidth,1)*depth;
  const shift=`calc((env(safe-area-inset-top) + ${BACKGROUND_SHIFT}px)*${depth})`;
  return this.vertical?`scale(${scale}) translate3d(0,${shift},0)`:`scale(${scale}) translate3d(${shift},0,0)`;
 }
 private activeIndex(){
  const {snapPoints,activeSnapPoint}=this.options;
  return snapPoints?.length?Math.max(0,snapPoints.indexOf(activeSnapPoint as SheetPoint)):0;
 }
 /** Where the sheet is drawn now: where it rests, or the point a travel has reached. */
 private visual(){
  if(!this.travel||!this.sheet)return this.position;
  const value=getComputedStyle(this.sheet).transform,matrix=/^matrix(3d)?\((.+)\)$/.exec(value??'');
  if(!matrix)return this.position;
  const numbers=matrix[2].split(',').map(Number),moved=matrix[1]?numbers[this.vertical?13:12]:numbers[this.vertical?5:4];
  return Number.isFinite(moved)?moved*this.sign:this.position;
 }
 /** One layout read, taken when the sheet opens, closes, is picked up or the viewport changes: never while it moves. */
 private measure(at=this.visual()){
  const sheet=this.sheet;if(!sheet)return;
  const {container,snapPoints}=this.options,{vertical,sign}=this;
  const rect=sheet.getBoundingClientRect(),box=container?.getBoundingClientRect();
  const origin=box?(vertical?box.top:box.left):0;
  this.room=box?(vertical?box.height:box.width):(vertical?window.innerHeight:window.innerWidth);
  const edge=(sign>0?(vertical?rect.bottom:rect.right):(vertical?rect.top:rect.left))-at*sign;
  const gap=Math.max(0,sign>0?origin+this.room-edge:edge-origin);
  this.flush=gap<.5;
  // Closed is the sheet's own extent plus the space a floating sheet keeps from its edge.
  this.closed=(vertical?rect.height:rect.width)+gap;
  if(!snapPoints?.length){this.detents=this.stops=[0];return;}
  const points=snapPoints.map(sharedPoint);
  this.detents=points.map(point=>Math.max(0,this.closed-detentHeight(point,this.room)));
  const stops=[...new Set(detentHeights(points,this.room).map(height=>Math.max(0,this.closed-height)))].sort((a,b)=>a-b);
  this.stops=stops.length?stops:[0];
 }
 private draw(position:number,motion:boolean){
  const {sheet,overlay,wrapper}=this,timing=(property:string)=>motion?`${property} ${TRAVEL}`:'none';
  if(sheet){sheet.style.transition=timing('transform');sheet.style.transform=this.offset(position);}
  if(overlay){overlay.style.transition=timing('opacity');overlay.style.opacity=String(this.fade(position));}
  if(wrapper){wrapper.style.transition=timing('transform');wrapper.style.transform=this.recede(position);}
 }
 private hint(moving:boolean){
  const {sheet,overlay,wrapper}=this;
  for(const [layer,property] of [[sheet,'transform'],[overlay,'opacity'],[wrapper,'transform']] as const){
   if(!layer)continue;
   if(moving)layer.style.setProperty(HINT,property);else layer.style.removeProperty(HINT);
  }
 }
 private halt(){if(this.travel){clearTimeout(this.travel.timer);this.travel=null;}}
 /** Travel to a position from wherever the sheet is drawn. A travel under way is retargeted, not restarted. */
 private glide(position:number){
  const {sheet,overlay,wrapper}=this;
  this.halt();this.position=position;
  if(!sheet)return;
  const motion=!this.options.reducedMotion&&typeof sheet.getAnimations==='function';
  if(motion){
   this.hint(true);
   // Commit where each layer is drawn, so the transition starts there and not from an earlier frame.
   for(const layer of [sheet,overlay,wrapper])if(layer)void getComputedStyle(layer).opacity;
  }
  this.draw(position,motion);
  const running=motion?sheet.getAnimations().find(animation=>(animation as CSSTransition).transitionProperty==='transform'&&animation.playState!=='finished'):undefined;
  if(!running){this.rest();return;}
  const finish=()=>{if(this.travel===travel)this.rest();},travel={timer:setTimeout(finish,SHEET_TRAVEL.duration+TRAVEL_GRACE)};
  this.travel=travel;running.onfinish=finish;
 }
 /** The sheet has arrived: drop the transition and the compositing hints, and report a finished open or close. */
 private rest(){
  const {sheet,overlay,wrapper,position}=this;
  this.halt();this.hint(false);
  if(sheet){
   sheet.style.transition='';sheet.style.transform=position===0?'':this.offset(position);
   if(this.overshoot&&position>=0){this.overshoot=false;sheet.removeAttribute('data-hig-sheet-overshoot');}
  }
  if(overlay){const fade=this.fade(position);overlay.style.transition='';overlay.style.opacity=fade===1?'':String(fade);}
  if(wrapper)wrapper.style.transition='';
  const settled=this.settled;this.settled=null;settled?.();
 }
 attach(sheet:HTMLElement|null){
  if(sheet===this.sheet)return;
  if(this.sheet)this.release();
  this.sheet=sheet;this.sync();
 }
 attachOverlay(overlay:HTMLElement){
  if(overlay===this.overlay)return;
  this.overlay=overlay;
  if(this.phase!=='idle'&&!this.travel)overlay.style.opacity=String(this.fade(this.position));
 }
 /** Forget the sheet: its elements are gone. */
 release(){
  this.halt();this.press=this.drag=null;this.settled=null;
  for(const stop of [...this.early.splice(0),...this.undo.splice(0)])stop();
  this.phase='idle';this.sheet=this.overlay=null;this.position=this.index=0;this.overshoot=false;
 }
 /** Follow `open`: present a sheet that should be open, dismiss one that should not, and keep an open one on its detent. */
 sync(){
  const sheet=this.sheet;if(!sheet)return;
  if(this.options.open){
   if(this.phase==='open'){this.settle();return;}
   // A sheet reopened while it closes turns round where it is; a new one starts from closed.
   const fresh=this.phase==='idle';
   this.phase='open';this.measure();
   if(fresh){this.arm();this.position=this.closed;this.draw(this.closed,false);}
   this.hold();
   this.index=this.activeIndex();this.settled=()=>this.options.onSettled(true);
   this.glide(this.detents[this.index]);
  }else if(this.phase==='open'){
   this.phase='closing';this.press=this.drag=null;sheet.removeAttribute('data-hig-sheet-dragging');
   // The page is let go as the close starts, the sheet's own listeners when it ends.
   for(const stop of this.early.splice(0))stop();
   this.measure();
   this.settled=()=>{this.phase='idle';for(const stop of this.undo.splice(0))stop();this.options.onSettled(false);};
   this.glide(this.closed);
  }else if(this.phase==='idle')this.options.onSettled(false);
 }
 /**
  * Travel to the detent the host names when the sheet is anywhere else: a controlled detent change, a close the host
  * declined, or a detent it declined.
  */
 settle(){
  if(this.phase!=='open'||this.drag||!this.sheet)return;
  this.measure();
  const index=this.activeIndex(),target=this.detents[index];
  if(index===this.index&&target===this.position)return;
  this.index=index;this.glide(target);
 }
 /** What an open sheet holds on the page until its close starts: Safari's body pin and the iOS focus guard. */
 private hold(){
  const {noBodyStyles,repositionInputs,preventScroll,preventScrollRestoration}=this.options;
  if(this.early.length)return;
  if(repositionInputs&&preventScroll&&ios())this.early.push(guardFocus(()=>this.dragged));
  if(!noBodyStyles&&safari()&&!window.matchMedia?.('(display-mode: standalone)')?.matches){pinBody();this.early.push(()=>unpinBody(preventScrollRestoration));}
 }
 /** What the sheet's element holds until it has closed: its listeners and the page it scales. */
 private arm(){
  const sheet=this.sheet!,{shouldScaleBackground,setBackgroundColorOnScale,noBodyStyles}=this.options;
  const stamp=()=>{this.scrolledAt=performance.now();};
  sheet.addEventListener('touchmove',this.touch,{passive:false});
  sheet.addEventListener('scroll',stamp,{capture:true,passive:true});
  window.addEventListener('resize',this.resize);
  window.visualViewport?.addEventListener('resize',this.keyboard);
  this.undo.push(()=>{
   sheet.removeEventListener('touchmove',this.touch);sheet.removeEventListener('scroll',stamp,{capture:true});
   window.removeEventListener('resize',this.resize);window.visualViewport?.removeEventListener('resize',this.keyboard);
   if(this.lift){sheet.style.height=this.lift.height;sheet.style.bottom=this.lift.bottom;this.lift=null;}
  });
  const wrapper=shouldScaleBackground?document.querySelector<HTMLElement>('[data-hig-sheet-wrapper]'):null;
  if(wrapper){
   const owned=['transform','transition','transform-origin','border-radius','overflow','will-change'],before=owned.map(name=>wrapper.style.getPropertyValue(name));
   const body=document.body.style,background=setBackgroundColorOnScale&&!noBodyStyles?body.background:null;
   this.wrapper=wrapper;
   // The radius is set once and does not animate: only the transform changes while the page recedes.
   wrapper.style.transformOrigin=this.vertical?'top':'left';wrapper.style.borderRadius=`${BACKGROUND_RADIUS}px`;wrapper.style.overflow='hidden';
   if(background!==null)body.background='black';
   this.undo.push(()=>{
    owned.forEach((name,index)=>{if(before[index])wrapper.style.setProperty(name,before[index]);else wrapper.style.removeProperty(name);});
    if(background!==null)body.background=background;
    this.wrapper=null;
   });
  }
 }
 private resize=()=>{
  if(this.phase!=='open'||this.drag||!this.sheet)return;
  this.measure();
  const target=this.detents[this.index]??0;
  if(this.travel)this.glide(target);
  else if(target!==this.position){this.position=target;this.draw(target,false);this.rest();}
 };
 /** `repositionInputs`: keep a bottom sheet above the software keyboard while a field in it is focused. */
 private keyboard=()=>{
  const sheet=this.sheet,view=window.visualViewport,{repositionInputs,fixed,direction,snapPoints}=this.options;
  if(!sheet||!view||!repositionInputs||direction!=='bottom'||this.phase!=='open')return;
  const cover=window.innerHeight-view.height,focused=document.activeElement;
  const raised=cover>KEYBOARD&&(!!this.lift||(!!focused&&sheet.contains(focused)&&typed(focused)));
  // Back to the resting layout before it is measured or left alone.
  if(this.lift){sheet.style.height=this.lift.height;sheet.style.bottom=this.lift.bottom;}
  if(!raised){this.lift=null;return;}
  this.lift??={height:sheet.style.height,bottom:sheet.style.bottom};
  const rect=sheet.getBoundingClientRect(),resting=parseFloat(getComputedStyle(sheet).bottom)||0;
  sheet.style.bottom=`${resting+cover}px`;
  if(snapPoints?.length)return;
  // `fixed` keeps the top edge where it is and shortens the sheet by the keyboard. Otherwise the sheet rides up, and is
  // shortened only when it would leave the screen: a tall sheet keeps its top edge, a short one keeps a small inset.
  const limit=fixed?rect.height-cover:view.height-(rect.height>window.innerHeight*.8?Math.max(rect.top,0):KEYBOARD_INSET);
  if(fixed||rect.height>limit)sheet.style.height=`${Math.max(0,limit)}px`;
 };
 // A touch the sheet is dragged by must not also scroll: the decision is made by the first touch move, before the browser
 // starts a scroll it will not hand back.
 private touch=(event:TouchEvent)=>{
  const press=this.press,point=event.touches[0];
  if(!press?.touch||!event.cancelable)return;
  if(!this.drag&&point&&event.touches.length===1)this.begin(point.clientX,point.clientY,event.timeStamp,0);
  if(this.drag)event.preventDefault();
 };
 down(event:SheetPointer){
  const sheet=this.sheet,target=event.target;
  if(event.isPrimary===false||(event.pointerType==='mouse'&&event.button!==0))return;
  // A new primary press ends one whose release never arrived.
  if(this.press)this.cancel();
  this.dragged=false;
  if(!sheet||this.phase!=='open'||!(target instanceof Element)||!sheet.contains(target))return;
  if(this.options.handleOnly&&!target.closest('[data-hig-sheet-handle]'))return;
  if(guarded(target,sheet))return;
  this.press={id:event.pointerId,x:event.clientX,y:event.clientY,target,touch:event.pointerType==='touch',scrolled:false};
 }
 move(event:SheetPointer){
  const press=this.press;
  if(!press||event.pointerId!==press.id)return;
  if(!this.drag&&!this.begin(event.clientX,event.clientY,event.timeStamp,press.touch?SLOP_TOUCH:SLOP_MOUSE))return;
  this.follow(event);
 }
 up(event:SheetPointer){
  const press=this.press,drag=this.drag,sheet=this.sheet;
  if(!press||event.pointerId!==press.id)return;
  this.press=this.drag=null;
  if(!drag||!sheet)return;
  sheet.removeAttribute('data-hig-sheet-dragging');
  const {stops}=this,lowest=stops[stops.length-1],{snapPoints,closeThreshold,snapToSequentialPoint,dismissible}=this.options;
  let velocity=this.velocity(drag,event.timeStamp);
  // Sequential detents: a throw is read as a flick, so it steps one detent and never skips to the end.
  if(snapToSequentialPoint)velocity=Math.max(1-SHEET_THROW,Math.min(SHEET_THROW-1,velocity));
  // The shared rule closes past SHEET_CLOSE of the way from the lowest detent to closed; `closeThreshold` moves that line.
  const line=lowest+(this.closed-lowest)*closeThreshold/SHEET_CLOSE;
  const stop=releaseTarget(this.position,velocity,stops,line,dismissible,drag.start,drag.scrolled,this.room);
  this.options.onRelease?.(event,stop!==-1);
  // A closing release leaves the sheet where it was let go: an accepted close travels on from there, a declined one returns.
  if(stop===-1){this.options.requestClose();return;}
  this.index=Math.max(0,this.detents.indexOf(stops[stop]));
  this.glide(stops[stop]);
  if(snapPoints?.length)this.options.selectSnapPoint(snapPoints[this.index]);
 }
 /** The browser took the pointer away, for a scroll or a system gesture: the sheet goes back to its detent. */
 cancel(event?:SheetPointer){
  const press=this.press,drag=this.drag;
  if(event&&press&&event.pointerId!==press.id)return;
  this.press=this.drag=null;
  if(!drag||!this.sheet)return;
  this.sheet.removeAttribute('data-hig-sheet-dragging');
  this.index=this.activeIndex();this.glide(this.detents[this.index]);
 }
 /** Whether the press has become a drag of the sheet, deciding it once the pointer has left `slop`. */
 private begin(x:number,y:number,time:number,slop:number){
  const press=this.press!,{vertical}=this;
  const along=(vertical?y-press.y:x-press.x)*this.sign,across=Math.abs(vertical?x-press.x:y-press.y);
  if(Math.abs(along)<=slop&&across<=slop)return false;
  // A gesture across the sheet's axis belongs to the content.
  if(across>Math.abs(along)){this.press=null;return false;}
  if(!this.allows(press.target,along)){press.scrolled=true;return false;}
  const sheet=this.sheet!,from=this.visual(),at=vertical?y:x;
  // Pick the sheet up where it is drawn, in the middle of a travel or at rest.
  this.halt();this.measure(from);this.position=from;this.draw(from,false);this.hint(true);
  sheet.toggleAttribute('data-hig-sheet-dragging',true);
  // The sheet keeps the pointer for the rest of the drag, outside its own box and the window too.
  try{sheet.setPointerCapture?.(press.id);}catch{/* The pointer is already gone. */}
  this.dragged=true;
  this.drag={start:from,origin:at,scrolled:press.scrolled,samples:[{time,at}]};
  return true;
 }
 /**
  * Scroll handoff, as in Vaul. The handle always drags, and so does a sheet below its tallest detent or caught on the way.
  * At the tallest detent the content comes first: a move toward open, selected text, content scrolled away from the edge
  * the sheet closes toward, and the moments after any of those leave the sheet where it is.
  */
 private allows(target:Element,along:number){
  const sheet=this.sheet!,now=performance.now();
  if(!this.vertical||target.closest('[data-hig-sheet-handle]'))return true;
  if(this.visual()>this.stops[0]+.5)return true;
  if(window.getSelection?.()?.toString())return false;
  if(now-this.scrolledAt<this.options.scrollLockTimeout||along<0){this.scrolledAt=now;return false;}
  for(let node:Element|null=target;node;node=node===sheet?null:node.parentElement){
   if(node.scrollHeight>node.clientHeight&&(this.sign>0?node.scrollTop>0:node.scrollTop+node.clientHeight<node.scrollHeight-1)){this.scrolledAt=now;return false;}
  }
  return true;
 }
 private follow(event:SheetPointer){
  const drag=this.drag!,sheet=this.sheet!,{stops}=this,at=this.vertical?event.clientY:event.clientX;
  const position=dragPosition(drag.start+(at-drag.origin)*this.sign,stops[0],stops[stops.length-1],this.closed,this.options.dismissible);
  this.position=position;this.draw(position,false);
  // A flush sheet pulled past its full height trails its fill behind it.
  const overshoot=position<0&&this.flush;
  if(overshoot!==this.overshoot){this.overshoot=overshoot;sheet.toggleAttribute('data-hig-sheet-overshoot',overshoot);}
  const {samples}=drag;
  samples.push({time:event.timeStamp,at});
  while(samples.length>2&&event.timeStamp-samples[1].time>VELOCITY_WINDOW)samples.shift();
  this.options.onDrag?.(event,1-this.fade(position));
 }
 /** Pixels per second toward closed over the last of the drag, or none when the pointer rested before letting go. */
 private velocity(drag:NonNullable<SheetEngine['drag']>,time:number){
  const {samples}=drag,last=samples[samples.length-1];
  if(time-last.time>VELOCITY_WINDOW)return 0;
  let first=last;
  for(let index=samples.length-1;index>=0&&last.time-samples[index].time<=VELOCITY_WINDOW;index--)first=samples[index];
  const elapsed=last.time-first.time;
  return elapsed>0?(last.at-first.at)*this.sign/elapsed*1000:0;
 }
}
