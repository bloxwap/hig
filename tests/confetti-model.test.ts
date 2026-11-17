import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';
import {CONFETTI_FIRST_TICK,CONFETTI_STAR_INNER,CONFETTI_STAR_OUTER,CONFETTI_TICKS_PER_SECOND,confettiBox,confettiBursts,confettiDefaults,confettiDuration,confettiFlight,confettiOpacity,confettiPose,confettiSkipped,confettiStarPoints,confettiStarWedge,confettiTravel,createConfettiBurst,mirrorConfetti,type ConfettiFlight,type ConfettiParticle,type ConfettiPhysics} from '../packages/hig/contracts/src/confetti';
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
  // A piece cannot have a negative size: a negative scalar is no size at all.
  expect(createConfettiBurst({scalar:-2},palette,seeded(3)).physics.size).toBe(0);
 });
 it('reads colours or shapes that are not a list as none given, and no options at all as the defaults',()=>{
  const burst=createConfettiBurst({particleCount:6,colors:'red' as unknown as string[],shapes:'star' as unknown as ['star']},palette,seeded(3));
  expect(burst.colors).toBe(palette);expect(burst.particles).toHaveLength(6);expect(burst.particles.every(p=>p.shape!=='star')).toBe(true);
  expect(createConfettiBurst(null as unknown as undefined,palette,seeded(3)).particles).toHaveLength(50);
  expect(mirrorConfetti(null as unknown as undefined)).toEqual({angle:90,drift:0,origin:{x:0.5}});
 });
 it('keeps every piece at a finite place, whatever the options',()=>{
  // Each of these overflowed to Infinity or NaN: a transform React Native cannot apply.
  const extremes=[{decay:2,ticks:5000},{decay:1e300},{startVelocity:1e308},{startVelocity:-1e308},{gravity:1e308},{gravity:-1e308},{drift:1e308},{scalar:1e308},{scalar:5e-324},{ticks:1e308,decay:1.5},{angle:1e308,spread:1e308},{origin:{x:1e308,y:-1e308}}];
  for(const options of extremes)for(const shape of ['square','circle','star'] as const){
   const burst=createConfettiBurst({...options,particleCount:4,shapes:[shape]},palette,seeded(21)),{physics}=burst;
   expect(Object.values(physics).every(value=>typeof value==='boolean'||Number.isFinite(value)),JSON.stringify(options)).toBe(true);expect(Number.isFinite(burst.origin.x)&&Number.isFinite(burst.origin.y)).toBe(true);
   expect(Number.isFinite(confettiDuration(physics))).toBe(true);expect(Number.isFinite(confettiBox(shape,physics))).toBe(true);expect(confettiBox(shape,physics)).toBeGreaterThanOrEqual(0);
   for(const piece of burst.particles)for(const t of [1,1.5,60,physics.ticks/2,physics.ticks]){
    const pose=confettiPose(piece,physics,t),now=flight(piece,physics,t);
    for(const value of [...Object.values(pose),...Object.values(now),confettiOpacity(physics,t)])expect(Number.isFinite(value),`${JSON.stringify(options)} ${shape} at ${t}`).toBe(true);
    expect(pose.scaleX).toBeGreaterThanOrEqual(0);expect(pose.scaleY).toBeGreaterThanOrEqual(0);
   }
  }
  // Within the limits nothing changes: a decay above 1 still gains speed, as in canvas-confetti.
  const faster=createConfettiBurst({decay:1.05},palette,seeded(21)).physics;expect(faster.decay).toBe(1.05);expect(confettiTravel(faster,20)).toBeCloseTo((Math.pow(1.05,20)-1)/0.05,9);
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
  // canvas-confetti draws its first frame, tick 1, at full strength and its last, tick 120, at 1/120.
  expect(confettiOpacity(physics,CONFETTI_FIRST_TICK)).toBe(1);expect(confettiOpacity(physics,31)).toBeCloseTo(0.75);expect(confettiOpacity(physics,120)).toBeCloseTo(1/120);expect(confettiOpacity(physics,121)).toBe(0);expect(confettiOpacity(physics,500)).toBe(0);expect(confettiOpacity(physics,-5)).toBe(1);
  // The same numbers as canvas-confetti's own counter, which reads the tick before it adds one.
  for(let tick=0,frame=1;frame<=120;frame++){const progress=(tick++)/120;expect(confettiOpacity(physics,frame)).toBeCloseTo(1-progress,12);}
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
 it('poses every shape with exactly the numbers of the flight, worked out without a flight object',()=>{
  // confettiPose repeats confettiFlight's sums in local variables, so native allocates no flight object for every piece every
  // frame. This is the pose built from confettiFlight itself: the two must agree to the last bit, not just closely.
  const fromFlight=(particle:ConfettiParticle,physics:ConfettiPhysics,t:number)=>{
   const now=flight(particle,physics,t),size=physics.size;
   if(size<=0)return {x:now.x,y:now.y,rotate:0,scaleX:0,scaleY:0};
   if(particle.shape==='star')return {x:now.x,y:now.y,rotate:0,scaleX:1,scaleY:1};
   if(particle.shape==='circle')return {x:now.x,y:now.y,rotate:Math.PI/10*now.wobble,scaleX:Math.abs(now.ux)/size,scaleY:Math.abs(now.vy)/size};
   const e=(now.ux+now.vy)/2,f=(now.ux-now.vy)/2,g=(now.uy+now.vx)/2,h=(now.uy-now.vx)/2,q=Math.sqrt(e*e+h*h),r=Math.sqrt(f*f+g*g);
   return {x:now.x+(now.ux+now.vx)/2,y:now.y+(now.uy+now.vy)/2,rotate:(Math.atan2(h,e)+Math.atan2(g,f))/2,scaleX:Math.min(1e6,(q+r)/size),scaleY:Math.min(1e6,Math.abs(q-r)/size)};
  };
  let compared=0;
  for(const options of [{},{flat:true},{scalar:0},{scalar:5e-324},{scalar:2.5,decay:0.93,drift:1.5,gravity:0.6,startVelocity:30},{decay:1},{decay:1.05,ticks:400}])for(const shape of ['square','circle','star'] as const){
   const burst=createConfettiBurst({...options,particleCount:12,shapes:[shape]},palette,seeded(31));
   for(const piece of burst.particles)for(const t of [0,1,1.5,17.25,60,120.75,burst.physics.ticks]){
    const pose=confettiPose(piece,burst.physics,t),expected=fromFlight(piece,burst.physics,t);
    for(const key of ['x','y','rotate','scaleX','scaleY'] as const)expect(Object.is(pose[key],expected[key]),`${JSON.stringify(options)} ${shape} ${key} at ${t}: ${pose[key]} is not ${expected[key]}`).toBe(true);
    compared++;
   }
  }
  expect(compared).toBe(7*3*12*7);
  // The flight itself is written into the object it is given, which a renderer keeps for every piece and frame.
  const burst=createConfettiBurst({particleCount:1},palette,seeded(32)),out=blank();
  expect(confettiFlight(burst.particles[0],burst.physics,9,confettiTravel(burst.physics,9),out)).toBe(out);
 });
 it('gives the star as canvas-confetti\'s ten-point outline, and as five triangles that cover exactly the same shape',()=>{
  expect(CONFETTI_STAR_OUTER).toBe(0.8);expect(CONFETTI_STAR_INNER).toBe(0.4);expect(confettiStarPoints).toHaveLength(10);
  // canvas-confetti: rot starts at 3/2 pi and steps by pi/5, alternately on the outer radius (8 * scalar) and the inner (4 * scalar).
  let rot=Math.PI/2*3;const step=Math.PI/5;
  for(let spike=0;spike<5;spike++){
   expect(confettiStarPoints[spike*2][0]).toBeCloseTo(Math.cos(rot)*0.8,12);expect(confettiStarPoints[spike*2][1]).toBeCloseTo(Math.sin(rot)*0.8,12);rot+=step;
   expect(confettiStarPoints[spike*2+1][0]).toBeCloseTo(Math.cos(rot)*0.4,12);expect(confettiStarPoints[spike*2+1][1]).toBeCloseTo(Math.sin(rot)*0.4,12);rot+=step;
  }
  // The first outer point is straight up, and a triangle's sides run along the star's two edges at its apex.
  expect(confettiStarPoints[0][0]).toBeCloseTo(0,12);expect(confettiStarPoints[0][1]).toBeCloseTo(-0.8,12);
  const {width,height}=confettiStarWedge;expect(height).toBe(0.8);
  const [innerX,innerY]=confettiStarPoints[1];expect(width/2/height).toBeCloseTo(innerX/(innerY+0.8),12);
  const inside=(point:readonly [number,number],outline:readonly (readonly [number,number])[])=>{let within=false;for(let i=0,j=outline.length-1;i<outline.length;j=i++){const [xi,yi]=outline[i],[xj,yj]=outline[j];if((yi>point[1])!==(yj>point[1])&&point[0]<(xj-xi)*(point[1]-yi)/(yj-yi)+xi)within=!within;}return within;};
  const wedges=[0,1,2,3,4].map(fifth=>{const turn=fifth*Math.PI*2/5,place=(x:number,y:number)=>[x*Math.cos(turn)-y*Math.sin(turn),x*Math.sin(turn)+y*Math.cos(turn)] as const;return [place(0,-height),place(-width/2,0),place(width/2,0)];});
  let filled=0,differ=0;
  for(let x=-0.85;x<=0.85;x+=0.0037)for(let y=-0.85;y<=0.85;y+=0.0037){const star=inside([x,y],confettiStarPoints),drawn=wedges.some(wedge=>inside([x,y],wedge));if(star)filled++;if(star!==drawn)differ++;}
  expect(filled).toBeGreaterThan(40000);expect(differ).toBe(0);
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
