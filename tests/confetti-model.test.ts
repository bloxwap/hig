import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';
import {CONFETTI_FIRST_TICK,CONFETTI_TICKS_PER_SECOND,confettiBox,confettiBursts,confettiDefaults,confettiDuration,confettiFlight,confettiOpacity,confettiPose,confettiSkipped,confettiTravel,createConfettiBurst,mirrorConfetti,type ConfettiFlight,type ConfettiParticle,type ConfettiPhysics} from '../packages/hig/contracts/src/confetti';
const palette=['red','green','blue'];
/** A repeatable random source (mulberry32), so every burst in this file is the same on every run. */
const seeded=(seed:number)=>()=>{seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};
/** Returns the listed values in turn, then 0.5. */
const scripted=(...values:number[])=>{let index=0;return()=>values[index++]??0.5;};
const blank=():ConfettiFlight=>({x:0,y:0,ux:0,uy:0,vx:0,vy:0,wobble:0});
const flight=(particle:ConfettiParticle,physics:ConfettiPhysics,t:number)=>confettiFlight(particle,physics,t,confettiTravel(physics,t),blank());
describe('confetti physics',()=>{
 it('launches canvas-confetti\'s default burst: 50 pieces from the centre, squares and circles, 200 ticks',()=>{
  const burst=createConfettiBurst(undefined,palette,seeded(1));
  expect(burst.particles).toHaveLength(50);expect(burst.origin).toEqual({x:0.5,y:0.5});expect(burst.colors).toBe(palette);
  expect(burst.physics).toEqual({ticks:200,decay:0.9,gravity:3,drift:0,size:10,flat:false});
  expect(new Set(burst.particles.map(p=>p.shape))).toEqual(new Set(['square','circle']));
  // Up is negative y: with the default 90 degree angle and 45 degree spread every piece launches upwards, within 22.5 degrees of vertical.
  for(const p of burst.particles){
   const speed=Math.hypot(p.dx,p.dy),off=Math.abs(Math.atan2(-p.dy,p.dx)-Math.PI/2);
   expect(speed).toBeGreaterThanOrEqual(22.5);expect(speed).toBeLessThan(67.5);expect(off).toBeLessThanOrEqual(Math.PI/8+1e-9);
   expect(p.wobble).toBeGreaterThanOrEqual(0);expect(p.wobble).toBeLessThan(10);expect(p.wobbleSpeed).toBeGreaterThanOrEqual(0.05);expect(p.wobbleSpeed).toBeLessThanOrEqual(0.11);
   expect(p.tilt).toBeGreaterThanOrEqual(Math.PI/4);expect(p.tilt).toBeLessThan(Math.PI*3/4);
  }
 });
 it('is repeatable from a seeded random source and differs between seeds',()=>{
  const a=createConfettiBurst({particleCount:12},palette,seeded(7)),b=createConfettiBurst({particleCount:12},palette,seeded(7)),c=createConfettiBurst({particleCount:12},palette,seeded(8));
  expect(a).toEqual(b);expect(a.particles).not.toEqual(c.particles);
 });
 it('draws seven numbers a piece, in a fixed order',()=>{
  // shape, wobble, wobble speed, speed, direction, tumble, flutter seed
  const [piece]=createConfettiBurst({particleCount:1,angle:0,spread:90,startVelocity:20,shapes:['square','circle','star']},palette,scripted(0.99,0.3,0.2,0.75,0.5,0.5,0.25)).particles;
  expect(piece.shape).toBe('star');expect(piece.wobble).toBeCloseTo(3);expect(piece.wobbleSpeed).toBeCloseTo(0.07);
  // Speed 10 + 0.75 * 20; the middle draw of the spread is the angle itself, here towards the right edge.
  expect(piece.dx).toBeCloseTo(25);expect(piece.dy).toBeCloseTo(0);expect(piece.tilt).toBeCloseTo(Math.PI/2);expect(piece.seed).toBeCloseTo(250);
  let draws=0;createConfettiBurst({particleCount:9},palette,()=>{draws++;return 0.5;});expect(draws).toBe(63);
 });
 it('deals colours in turn and falls back when the call names none',()=>{
  const burst=createConfettiBurst({particleCount:7,colors:['a','b']},palette,seeded(2));
  expect(burst.colors).toEqual(['a','b']);expect(burst.particles.map(p=>p.color)).toEqual([0,1,0,1,0,1,0]);
  expect(createConfettiBurst({particleCount:4,colors:[]},palette,seeded(2)).colors).toBe(palette);
  expect(createConfettiBurst({particleCount:4,colors:['']},palette,seeded(2)).particles.map(p=>p.color)).toEqual([0,2,1,0]);
  expect(createConfettiBurst({particleCount:4},[],seeded(2)).particles).toEqual([]);
  // A fallback given as a function is asked only when the call names no colour.
  let asked=0;const lazy=()=>{asked++;return palette;};
  expect(createConfettiBurst({particleCount:2,colors:['a']},lazy,seeded(2)).colors).toEqual(['a']);expect(asked).toBe(0);
  expect(createConfettiBurst({particleCount:2},lazy,seeded(2)).colors).toBe(palette);expect(asked).toBe(1);
 });
 it('reads invalid numbers as the default and never launches a fraction of a piece',()=>{
  expect(createConfettiBurst({particleCount:9.9},palette,seeded(3)).particles).toHaveLength(9);
  expect(createConfettiBurst({particleCount:-4},palette,seeded(3)).particles).toHaveLength(0);
  const burst=createConfettiBurst({particleCount:Number.NaN,ticks:Number.POSITIVE_INFINITY,decay:-1,scalar:'2' as unknown as number,origin:{y:0.7},shapes:['hexagon' as 'star']},palette,seeded(3));
  expect(burst.particles).toHaveLength(confettiDefaults.particleCount);expect(burst.physics.ticks).toBe(200);expect(burst.physics.decay).toBe(0);expect(burst.physics.size).toBe(10);expect(burst.origin).toEqual({x:0.5,y:0.7});
  expect(burst.particles.every(p=>p.shape!=='star')).toBe(true);
  expect(createConfettiBurst({ticks:0},palette,seeded(3)).physics.ticks).toBe(1);
 });
 it('at every whole tick a piece is where canvas-confetti\'s frame-by-frame update puts it',()=>{
  const burst=createConfettiBurst({particleCount:6,spread:120,startVelocity:55,decay:0.91,gravity:0.8,drift:1.5,scalar:1.2},palette,seeded(11));
  for(const particle of burst.particles){
   // canvas-confetti: x += cos * velocity + drift; y += sin * velocity + gravity; velocity *= decay; wobble += wobbleSpeed; tiltAngle += 0.1.
   let x=0,y=0,vx=particle.dx,vy=particle.dy,wobble=particle.wobble;
   for(let tick=1;tick<=120;tick++){
    x+=vx+burst.physics.drift;y+=vy+burst.physics.gravity;vx*=burst.physics.decay;vy*=burst.physics.decay;wobble+=particle.wobbleSpeed;
    const now=flight(particle,burst.physics,tick);
    expect(now.x).toBeCloseTo(x,6);expect(now.y).toBeCloseTo(y,6);expect(now.wobble).toBeCloseTo(wobble,9);
    // The long edges swing with the wobble; the short ones are the tumble times a flutter between 2 and 3.
    expect(now.ux).toBeCloseTo(12*Math.cos(wobble),9);expect(now.vy).toBeCloseTo(12*Math.sin(wobble),9);
    const flutter=Math.hypot(now.uy,now.vx);expect(flutter).toBeGreaterThanOrEqual(2);expect(flutter).toBeLessThan(3);
    expect(Math.atan2(now.uy,now.vx)).toBeCloseTo(Math.atan2(Math.sin(particle.tilt+0.1*tick),Math.cos(particle.tilt+0.1*tick)),9);
   }
  }
 });
 it('moves between ticks, and without decay travels in a straight line',()=>{
  const physics=createConfettiBurst({decay:0.9},palette,seeded(4)).physics;
  expect(confettiTravel(physics,0)).toBe(0);expect(confettiTravel(physics,1)).toBeCloseTo(1);expect(confettiTravel(physics,2)).toBeCloseTo(1.9);
  expect(confettiTravel(physics,1.5)).toBeGreaterThan(confettiTravel(physics,1));expect(confettiTravel(physics,1.5)).toBeLessThan(confettiTravel(physics,2));
  // The speed runs out: a piece never travels more than 1 / (1 - decay) ticks' worth of its launch speed.
  expect(confettiTravel(physics,2000)).toBeCloseTo(10);
  expect(confettiTravel({...physics,decay:1},37.5)).toBe(37.5);
 });
 it('flutters on whole ticks only, the same way every time',()=>{
  const burst=createConfettiBurst({particleCount:1},palette,seeded(5)),[piece]=burst.particles;
  const at=(t:number)=>{const f=flight(piece,burst.physics,t);return Math.hypot(f.uy,f.vx);};
  expect(at(3.2)).toBeCloseTo(at(3.9),12);expect(at(3)).not.toBeCloseTo(at(4),6);expect(at(40)).toBe(at(40));
 });
 it('fades in a straight line over the burst and lasts its ticks at 60 a second',()=>{
  const physics=createConfettiBurst({ticks:120},palette,seeded(6)).physics;
  expect(confettiOpacity(physics,0)).toBe(1);expect(confettiOpacity(physics,30)).toBeCloseTo(0.75);expect(confettiOpacity(physics,120)).toBe(0);expect(confettiOpacity(physics,500)).toBe(0);expect(confettiOpacity(physics,-5)).toBe(1);
  // A burst is drawn from tick 1, so it lasts one tick less than `ticks`.
  expect(CONFETTI_TICKS_PER_SECOND).toBe(60);expect(CONFETTI_FIRST_TICK).toBe(1);expect(confettiDuration(physics)).toBeCloseTo(119*1000/60,9);expect(confettiDuration(createConfettiBurst(undefined,palette).physics)).toBeCloseTo(3316.67,1);expect(confettiDuration({...physics,ticks:1})).toBe(0);
 });
 it('a flat piece is an upright square that only moves',()=>{
  const burst=createConfettiBurst({particleCount:1,flat:true,scalar:2,shapes:['square']},palette,seeded(9)),[piece]=burst.particles;
  for(const t of [0,10.5,80]){
   const now=flight(piece,burst.physics,t);expect([now.ux,now.uy,now.vx,now.vy,now.wobble]).toEqual([20,0,0,20,0]);
   const pose=confettiPose(piece,burst.physics,t);expect(pose.rotate).toBeCloseTo(0);expect(pose.scaleX).toBeCloseTo(1);expect(pose.scaleY).toBeCloseTo(1);expect(pose.x).toBeCloseTo(now.x+10);expect(pose.y).toBeCloseTo(now.y+10);
  }
 });
 it('poses a square as the rectangle with the parallelogram\'s centre, area and axes',()=>{
  const burst=createConfettiBurst({particleCount:20,shapes:['square'],scalar:1.5},palette,seeded(12)),{physics}=burst;
  for(const piece of burst.particles)for(const t of [0,1,17.25,60,150]){
   const now=flight(piece,physics,t),pose=confettiPose(piece,physics,t),width=pose.scaleX*physics.size,height=pose.scaleY*physics.size;
   expect(pose.x).toBeCloseTo(now.x+(now.ux+now.vx)/2,9);expect(pose.y).toBeCloseTo(now.y+(now.uy+now.vy)/2,9);
   // Same area as the parallelogram, and the same sum of squared edges (the two invariants of its singular values).
   expect(width*height).toBeCloseTo(Math.abs(now.ux*now.vy-now.uy*now.vx),6);
   expect(width*width+height*height).toBeCloseTo(now.ux*now.ux+now.uy*now.uy+now.vx*now.vx+now.vy*now.vy,6);
   expect(width).toBeGreaterThanOrEqual(height);
   // The long axis points where the parallelogram is stretched most: no unit direction is stretched further.
   const stretch=(angle:number)=>Math.hypot(now.ux*Math.cos(angle)+now.vx*Math.sin(angle),now.uy*Math.cos(angle)+now.vy*Math.sin(angle));
   let longest=0,toward=0;for(let step=0;step<3600;step++){const angle=step*Math.PI/3600,length=stretch(angle);if(length>longest){longest=length;toward=Math.atan2(now.uy*Math.cos(angle)+now.vy*Math.sin(angle),now.ux*Math.cos(angle)+now.vx*Math.sin(angle));}}
   expect(width).toBeCloseTo(longest,3);
   if(width-height>0.5)expect(Math.abs(Math.sin(pose.rotate-toward))).toBeLessThan(0.02);
  }
 });
 it('poses a circle as canvas-confetti\'s turning ellipse and a star as a fixed box',()=>{
  const burst=createConfettiBurst({particleCount:1,shapes:['circle']},palette,seeded(13)),[circle]=burst.particles,{physics}=burst;
  const now=flight(circle,physics,25),pose=confettiPose(circle,physics,25);
  expect(confettiBox('circle',physics)).toBe(12);expect(pose.x).toBe(now.x);expect(pose.y).toBe(now.y);expect(pose.rotate).toBeCloseTo(Math.PI/10*now.wobble);
  // Radii 0.6 * |edge|, as a share of the 12 pixel box.
  expect(pose.scaleX*12/2).toBeCloseTo(0.6*Math.abs(now.ux));expect(pose.scaleY*12/2).toBeCloseTo(0.6*Math.abs(now.vy));
  const star={...circle,shape:'star' as const};
  expect(confettiBox('star',physics)).toBe(16);expect(confettiBox('square',physics)).toBe(10);expect(confettiPose(star,physics,25)).toEqual({x:now.x,y:now.y,rotate:0,scaleX:1,scaleY:1});
  expect(confettiPose(circle,{...physics,size:0},25)).toMatchObject({scaleX:0,scaleY:0});
 });
 it('reads options as a list of bursts',()=>{
  const one={particleCount:3},two=[{spread:26},{spread:60}];
  expect(confettiBursts(one)).toEqual([one]);expect(confettiBursts(two)).toBe(two);expect(confettiBursts(undefined)).toEqual([undefined]);expect(confettiBursts([])).toEqual([]);
 });
 it('skips under reduced motion unless the call opts out',()=>{
  expect(confettiSkipped(undefined,true)).toBe(true);expect(confettiSkipped({},true)).toBe(true);expect(confettiSkipped({disableForReducedMotion:true},true)).toBe(true);
  expect(confettiSkipped({disableForReducedMotion:false},true)).toBe(false);expect(confettiSkipped(undefined,false)).toBe(false);expect(confettiSkipped(undefined,undefined)).toBe(false);
 });
 it('is published as a contracts entry beside one web and one native entry',()=>{
  const exportsMap=JSON.parse(readFileSync('packages/hig/package.json','utf8')).exports as Record<string,{types:string;import:string}>;
  expect(exportsMap['./contracts/confetti']).toMatchObject({types:'./contracts/dist/confetti.d.ts',import:'./contracts/dist/confetti.js'});
  expect(exportsMap['./react/confetti']).toMatchObject({types:'./react/dist/confetti.d.ts',import:'./react/dist/confetti.js'});
  expect(exportsMap['./native/confetti']).toMatchObject({types:'./native/dist/confetti.d.ts',import:'./native/dist/confetti.js'});
  // The flight functions run on the native UI thread, so each carries the worklet directive; the launch runs in JavaScript.
  const source=readFileSync('packages/hig/contracts/src/confetti.ts','utf8');
  for(const name of ['confettiDuration','confettiOpacity','confettiTravel','confettiFlight','confettiBox','confettiPose'])expect(source,name).toMatch(new RegExp(`export function ${name}\\([^\\n]*\\{\\s*'worklet';`));
  // Neither renderer depends on a confetti package.
  for(const file of ['packages/hig/react/src/confetti.tsx','packages/hig/native/src/confetti.tsx'])expect(readFileSync(file,'utf8')).not.toMatch(/from 'canvas-confetti'|from 'react-native-confetti/);
 });
 it('mirrors a burst for right-to-left: origin, direction and drift flip, the rest stays',()=>{
  expect(mirrorConfetti({angle:60,drift:2,origin:{x:0,y:0.7},spread:55,particleCount:20})).toEqual({angle:120,drift:-2,origin:{x:1,y:0.7},spread:55,particleCount:20});
  expect(mirrorConfetti()).toEqual({angle:90,drift:0,origin:{x:0.5}});
  // With no spread every piece flies along the angle, so the mirrored burst is the mirror image piece for piece.
  const options={particleCount:5,angle:30,spread:0,drift:1,origin:{x:0.2}};
  const left=createConfettiBurst(options,palette,seeded(14)),right=createConfettiBurst(mirrorConfetti(options),palette,seeded(14));
  expect(right.origin.x).toBeCloseTo(0.8);expect(right.physics.drift).toBe(-1);
  left.particles.forEach((piece,index)=>{expect(piece.dx).toBeGreaterThan(0);expect(right.particles[index].dx).toBeCloseTo(-piece.dx,9);expect(right.particles[index].dy).toBeCloseTo(piece.dy,9);});
 });
});
