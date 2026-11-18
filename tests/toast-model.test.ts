import {describe,expect,it} from 'vitest';
import {notificationDelta,type NotificationMessage} from '../packages/hig/contracts/src/announcements';
import {readFileSync} from 'node:fs';
import {TOAST_DURATION,TOAST_EXIT,TOAST_FLICK,TOAST_GAP,TOAST_HOLD,TOAST_MAX_DURATION,TOAST_MOTION,TOAST_NARROW_OFFSET,TOAST_OFFSET,TOAST_QUEUE_LIMIT,TOAST_SPRING,TOAST_STACK_SCALE,TOAST_SWIPE_THRESHOLD,TOAST_VISIBLE,TOAST_WIDTH,toastCap,toastClockPause,toastClockRun,toastDrag,toastDuration,toastEdge,toastEnterFrom,toastExitTo,toastGrab,toastLeave,toastOrder,toastRemove,toastSlot,toastSwipeAxis,toastSwipeDirections,toastSwipeDismisses,toastSwipeOut,toastUpsert,type ToastEntry} from '../packages/hig/contracts/src/toast';
const add=(list:readonly ToastEntry<string>[],key:number,value:string,options:{id?:string|number;duration?:number}={},limit?:number)=>toastUpsert(list,{key,id:options.id??key,duration:options.duration,value},limit);
const keys=(list:readonly ToastEntry<string>[])=>list.map(entry=>entry.key);
describe('toast contract',()=>{
 it('carries the figures of the Sonner version it was read from',()=>{
  const source=readFileSync('node_modules/sonner/dist/index.mjs','utf8'),css=readFileSync('node_modules/sonner/dist/styles.css','utf8');
  const constant=(name:string)=>Number(new RegExp(`const ${name} = '?(\\d+)`).exec(source)?.[1]);
  expect(constant('VISIBLE_TOASTS_AMOUNT')).toBe(TOAST_VISIBLE);expect(constant('TOAST_LIFETIME')).toBe(TOAST_DURATION);expect(constant('GAP')).toBe(TOAST_GAP);expect(constant('TOAST_WIDTH')).toBe(TOAST_WIDTH);
  expect(constant('VIEWPORT_OFFSET')).toBe(TOAST_OFFSET);expect(constant('MOBILE_VIEWPORT_OFFSET')).toBe(TOAST_NARROW_OFFSET);expect(constant('SWIPE_THRESHOLD')).toBe(TOAST_SWIPE_THRESHOLD);expect(constant('TIME_BEFORE_UNMOUNT')).toBe(TOAST_EXIT.duration);
  expect(css).toContain(`transition: transform ${TOAST_MOTION.duration}ms, opacity ${TOAST_MOTION.duration}ms`);expect(css).toContain(`--scale: var(--toasts-before) * ${TOAST_STACK_SCALE} + 1`);expect(css).toContain(`animation-duration: ${TOAST_EXIT.duration}ms`);
  // Critically damped: damping = 2·√(stiffness·mass), so a released swipe returns without a bounce.
  expect(TOAST_SPRING.damping).toBeCloseTo(2*Math.sqrt(TOAST_SPRING.stiffness*TOAST_SPRING.mass),0);
  // HIG's own figures, where Sonner has none or a pointer does the work.
  expect([TOAST_HOLD,TOAST_FLICK]).toEqual([200,500]);
 });
 it('reads the edge a position hangs from and the swipes that dismiss towards it',()=>{
  expect(toastEdge('top-center')).toEqual({y:'top',x:'center',lift:1});expect(toastEdge('bottom-right')).toEqual({y:'bottom',x:'right',lift:-1});
  expect(toastSwipeDirections('bottom-center')).toEqual(['bottom']);expect(toastSwipeDirections('top-center')).toEqual(['top']);expect(toastSwipeDirections('top-left')).toEqual(['top','left']);expect(toastSwipeDirections('bottom-right')).toEqual(['bottom','right']);
 });
});
describe('toast store',()=>{
 it('adds the newest at the front and replaces a live notice with the same id where it stands',()=>{
  let list=add(add(add([],1,'a'),2,'b',{id:'copy'}),3,'c');
  expect(toastOrder(list).map(entry=>entry.value)).toEqual(['c','b','a']);
  list=add(list,4,'b2',{id:'copy',duration:9000});
  // Same slot and key, so nothing restacks; the revision tells the host to start its time over.
  expect(toastOrder(list).map(entry=>entry.value)).toEqual(['c','b2','a']);expect(keys(list)).toEqual([1,2,3]);
  expect(list[1]).toMatchObject({key:2,id:'copy',revision:1,duration:9000,leaving:false});expect(list[0].revision).toBe(0);
 });
 it('marks notices as leaving without dropping them, and does not revive one that is on its way out',()=>{
  let list=add(add([],1,'a',{id:'x'}),2,'b');
  const same=toastLeave(list,'missing');expect(same).toBe(list);
  list=toastLeave(list,'x');expect(list.map(entry=>entry.leaving)).toEqual([true,false]);expect(toastOrder(list).map(entry=>entry.key)).toEqual([2]);
  expect(toastLeave(list,'x')).toBe(list);
  // Raised again under the same id while the old one leaves: a new notice, the old one finishes its exit.
  list=add(list,3,'a again',{id:'x'});expect(keys(list)).toEqual([1,2,3]);expect(list[2]).toMatchObject({id:'x',revision:0,leaving:false});
  list=toastLeave(list);expect(list.every(entry=>entry.leaving)).toBe(true);
  list=toastRemove(list,1);expect(keys(list)).toEqual([2,3]);expect(toastRemove(list,1)).toBe(list);
 });
 it('bounds a burst: the oldest timed notices go first, persistent ones last, and leaving ones are not counted',()=>{
  expect(TOAST_QUEUE_LIMIT).toBe(16);
  let list:readonly ToastEntry<string>[]=[];
  list=add(list,1,'keep',{duration:Infinity},3);list=add(list,2,'b',{},3);list=add(list,3,'c',{},3);list=add(list,4,'d',{},3);
  expect(keys(list)).toEqual([1,3,4]);
  list=add(add(list,5,'e',{duration:Infinity},3),6,'f',{duration:Infinity},3);expect(keys(list)).toEqual([1,5,6]);
  // Only persistent notices are left, so the oldest of those goes.
  list=add(list,7,'g',{duration:Infinity},3);expect(keys(list)).toEqual([5,6,7]);
  const leaving=toastLeave(list,5);expect(toastCap(leaving,2)).toBe(leaving);expect(keys(add(leaving,8,'h',{},2))).toEqual([5,7,8]);
 });
});
describe('toast stack arithmetic',()=>{
 const heights=[44,62,44,44];
 it('lists an expanded stack one notice after another, away from its edge',()=>{
  expect(toastSlot(0,heights,true,14,3,1)).toEqual({y:0,scaleX:1,scaleY:1,opacity:1,content:1});
  expect(toastSlot(1,heights,true,14,3,1)).toEqual({y:58,scaleX:1,scaleY:1,opacity:1,content:1});
  expect(toastSlot(2,heights,true,14,3,1)).toMatchObject({y:44+62+28,opacity:1});
  // From the bottom the same distances point up.
  expect(toastSlot(2,heights,true,14,3,-1).y).toBe(-(44+62+28));
  // Past the visible ones it is placed but transparent.
  expect(toastSlot(3,heights,true,14,3,1)).toMatchObject({y:44+62+44+42,opacity:0});
 });
 it('collapses the stack behind the front: each notice smaller, a gap further out, as tall as the front and without content',()=>{
  expect(toastSlot(0,heights,false,14,3,1)).toEqual({y:0,scaleX:1,scaleY:1,opacity:1,content:1});
  const second=toastSlot(1,heights,false,14,3,1);
  expect(second.scaleX).toBeCloseTo(0.95);expect(second.content).toBe(0);expect(second.opacity).toBe(1);
  // Drawn height is the front's, scaled: 62 · scaleY = 44 · 0.95.
  expect(62*second.scaleY).toBeCloseTo(44*0.95);
  // Its centre sits one gap beyond the front's centre (44/2 + 14), so only its far edge shows: 14 − 44·0.025 ≈ 12.9 points.
  expect(62/2+second.y).toBeCloseTo(44/2+14);
  const farEdge=62/2+second.y+62*second.scaleY/2;expect(farEdge-44).toBeCloseTo(14-44*0.025);
  const third=toastSlot(2,heights,false,14,3,1);expect(third.scaleX).toBeCloseTo(0.9);expect(third.y).toBe(28);expect(third.scaleY).toBeCloseTo(0.9);
  expect(toastSlot(3,heights,false,14,3,1).opacity).toBe(0);
  // Mirrored for a stack that hangs from the bottom.
  expect(toastSlot(1,heights,false,14,3,-1).y).toBeCloseTo(-second.y);
  // Not in the stack yet: nothing to draw.
  expect(toastSlot(-1,heights,false,14,3,1)).toMatchObject({y:0,opacity:0});
 });
 it('enters from its own height towards the edge and leaves the same way, or fades in place from behind a collapsed stack',()=>{
  expect(toastEnterFrom(0,44,1)).toBe(-44);expect(toastEnterFrom(0,44,-1)).toBe(44);expect(toastEnterFrom(58,62,1)).toBe(-4);
  expect(toastExitTo(0,44,1,true)).toBe(-44);expect(toastExitTo(0,44,-1,true)).toBe(44);expect(toastExitTo(28,44,1,false)).toBe(28);
 });
});
describe('toast swipe arithmetic',()=>{
 it('locks the drag to the axis it starts along',()=>{
  expect(toastSwipeAxis(9,2)).toBe('x');expect(toastSwipeAxis(-3,-9)).toBe('y');expect(toastSwipeAxis(4,4)).toBe('y');
 });
 it('follows the finger in an allowed direction and resists in the other, never passing 20 points',()=>{
  expect(toastDrag(-30,true,false)).toBe(-30);expect(toastDrag(30,false,true)).toBe(30);
  const against=toastDrag(30,true,false);expect(against).toBeGreaterThan(0);expect(against).toBeLessThan(30);expect(against).toBeCloseTo(30/(1.5+30/20));
  expect(Math.abs(toastDrag(100000,true,false))).toBeLessThan(20);
  // Small movements are damped from the start, so the notice never jumps when it crosses rest.
  expect(Math.abs(toastDrag(1,true,false))).toBeLessThan(1);
  // An axis nothing dismisses along does not move at all.
  expect(toastDrag(40,false,false)).toBe(0);expect(toastDrag(0,true,true)).toBe(0);
 });
 it('picks a notice up where it is: the grab undoes the drag in both directions',()=>{
  expect(toastGrab(-30,true,false)).toBe(-30);expect(toastGrab(0,true,false)).toBe(0);expect(toastGrab(12,false,false)).toBe(0);
  for(const delta of [1,8,30,120])expect(toastGrab(toastDrag(delta,true,false),true,false)).toBeCloseTo(delta);
  for(const delta of [-1,-30])expect(toastGrab(toastDrag(delta,false,true),false,true)).toBeCloseTo(delta);
  // Past what the resistance can reach it stays finite.
  expect(Number.isFinite(toastGrab(25,true,false))).toBe(true);
 });
 it('dismisses a release that is far enough or fast enough, only in an allowed direction',()=>{
  expect(toastSwipeDismisses(-TOAST_SWIPE_THRESHOLD,0,true,false)).toBe(true);expect(toastSwipeDismisses(-44,0,true,false)).toBe(false);
  // A short flick the allowed way.
  expect(toastSwipeDismisses(-12,-TOAST_FLICK,true,false)).toBe(true);expect(toastSwipeDismisses(-12,-TOAST_FLICK+1,true,false)).toBe(false);
  // Dragged out and thrown back: the velocity points home, so it stays.
  expect(toastSwipeDismisses(-12,900,true,false)).toBe(false);
  // The damped direction never dismisses, however fast.
  expect(toastSwipeDismisses(18,4000,true,false)).toBe(false);expect(toastSwipeDismisses(60,0,true,false)).toBe(false);
  expect(toastSwipeDismisses(60,0,false,true)).toBe(true);expect(toastSwipeDismisses(0,5000,true,true)).toBe(false);
 });
 it('swipes out by its own size, faster for a fast flick so it does not slow as it leaves the finger',()=>{
  expect(toastSwipeOut(-50,0,44)).toEqual({to:-94,duration:TOAST_EXIT.duration});expect(toastSwipeOut(60,0,300)).toEqual({to:360,duration:200});
  // 300 points at 3000 points/s: the ease-out curve starts 1.72× its average speed, so 172ms carries the release velocity on.
  expect(toastSwipeOut(60,3000,300).duration).toBeCloseTo(172);
  expect(toastSwipeOut(60,100000,300).duration).toBe(100);expect(toastSwipeOut(60,200,300).duration).toBe(200);
  // Velocity against the swipe is ignored.
  expect(toastSwipeOut(-60,800,300)).toEqual({to:-360,duration:200});
 });
});
describe('toast duration',()=>{
 it('is a positive number of milliseconds; anything else takes the default, and a time past the timer range persists',()=>{
  expect(toastDuration(undefined)).toBeUndefined();expect(toastDuration(0)).toBeUndefined();expect(toastDuration(-1)).toBeUndefined();expect(toastDuration(NaN)).toBeUndefined();
  expect(toastDuration(1)).toBe(1);expect(toastDuration(4000)).toBe(4000);expect(toastDuration(Infinity)).toBe(Infinity);
  // setTimeout holds a signed 32-bit delay: one millisecond more would fire at once.
  expect(TOAST_MAX_DURATION).toBe(2**31-1);expect(toastDuration(TOAST_MAX_DURATION)).toBe(TOAST_MAX_DURATION);expect(toastDuration(TOAST_MAX_DURATION+1)).toBe(Infinity);
 });
});
describe('toast clock',()=>{
 it('counts only while it runs, so a held notice keeps what it had left',()=>{
  let clock=toastClockRun({remaining:4000,startedAt:null},1000);expect(clock).toEqual({remaining:4000,startedAt:1000});
  expect(toastClockRun(clock,1500)).toBe(clock);
  clock=toastClockPause(clock,2500);expect(clock).toEqual({remaining:2500,startedAt:null});expect(toastClockPause(clock,9000)).toBe(clock);
  clock=toastClockPause(toastClockRun(clock,10000),99999);expect(clock.remaining).toBe(0);
 });
});

it('uses the final content and first position of duplicate announcement IDs',()=>{
 const notices:NotificationMessage[]=[
  {id:'a',message:'Transient error',severity:'error'},
  {id:'b',message:'Still failed',severity:'error'},
  {id:'a',message:'Recovered',severity:'success'},
  {id:'c',message:'Another failure',severity:'error'},
 ];
 const first=notificationDelta(new Map(),notices);
 expect(first.id).toBe('b');
 expect([...first.next.keys()]).toEqual(['a','b','c']);
 expect(first.next.get('a')).toBe(JSON.stringify(['Recovered','success']));
 expect(notificationDelta(first.next,notices).message).toBeUndefined();
});
