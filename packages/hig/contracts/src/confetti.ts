/**
 * Confetti physics shared by the web canvas and the native views, so a burst flies the same on both. It follows
 * canvas-confetti's arithmetic, restated as a function of time: a piece's place at tick `t` is computed directly instead of
 * being stepped frame by frame, so a renderer may ask for any `t` (a 120 Hz display asks for half ticks) and a dropped frame
 * never slows the burst down. A tick is 1/60 s. Distances are CSS pixels on web and points on native; `y` grows downwards.
 * The flight functions carry a `'worklet'` directive, so native runs them on the UI thread.
 */
export type ConfettiShape='square'|'circle'|'star';
/** The options of one burst, modelled on canvas-confetti's so a call maps over. */
export interface ConfettiOptions {
 /** How many pieces the burst launches. Default 50. */
 particleCount?:number;
 /** Launch direction in degrees: 90 is straight up, 0 is towards the right edge, 180 towards the left. Default 90. */
 angle?:number;
 /** How far, in degrees, pieces may stray from `angle` in total. Default 45. */
 spread?:number;
 /** Launch speed in pixels per tick. Each piece starts between half and one and a half times this. Default 45. `startVelocity`, `gravity`, `drift`, `scalar` and `ticks` are kept within a million either way, so no input can place a piece at infinity. */
 startVelocity?:number;
 /** The share of its launch speed a piece keeps each tick, from 0 to 1; above 1 a piece gains speed. Default 0.9. */
 decay?:number;
 /** Pull downwards: 1 falls at full speed, 0 floats and a negative value rises. Default 1. */
 gravity?:number;
 /** Sideways push in pixels per tick; positive is towards the right edge. Default 0. */
 drift?:number;
 /** How long the burst lasts, in ticks of 1/60 s. Pieces fade out over it. Default 200. */
 ticks?:number;
 /** Where the burst starts, as a share of the layer: `x` 0 is the left edge and 1 the right in both text directions, `y` 0 is the top and 1 the bottom. Default the centre, `{x:0.5,y:0.5}`. */
 origin?:{x?:number;y?:number};
 /** Colours, dealt to the pieces in turn (repeat one to weight it). Web takes any CSS colour, native any React Native colour. Default: the provider's `action`, `info`, `down`, `warning` and `up` roles. */
 colors?:readonly string[];
 /** Shapes, picked at random for each piece. Default `['square','circle']`. */
 shapes?:readonly ConfettiShape[];
 /** Scales every piece; below 0 reads as 0. Default 1. */
 scalar?:number;
 /** Pieces neither tumble nor wobble. Default false. */
 flat?:boolean;
 /** Draws nothing when reduced motion is on. Default true; canvas-confetti defaults to false. */
 disableForReducedMotion?:boolean;
 /** Web only: the stacking order of the canvas, read from the burst that creates it. Default 100. Native stacks by where `Confetti` is mounted. */
 zIndex?:number;
}
/** One piece as launched. Everything it does later follows from these numbers and the tick. */
export interface ConfettiParticle {
 /** Launch velocity in pixels per tick, split by axis. */
 readonly dx:number;
 readonly dy:number;
 /** Where its wobble starts, in radians, and how far it turns each tick. */
 readonly wobble:number;
 readonly wobbleSpeed:number;
 /** Where its tumble starts, in radians. It turns 0.1 each tick. */
 readonly tilt:number;
 /** Seeds the flutter each piece redraws with every tick. */
 readonly seed:number;
 /** Index into the burst's `colors`. */
 readonly color:number;
 readonly shape:ConfettiShape;
}
/** What every piece of a burst shares. Small on purpose: native copies it to the UI thread once. */
export interface ConfettiPhysics {
 readonly ticks:number;
 readonly decay:number;
 /** Fall in pixels per tick (three times the `gravity` option, as in canvas-confetti). */
 readonly gravity:number;
 readonly drift:number;
 /** Edge of a square piece in pixels: 10 times `scalar`. */
 readonly size:number;
 readonly flat:boolean;
}
/** A launched burst: its pieces, the colours they index and where it starts as a share of the layer. */
export interface ConfettiBurst {
 readonly particles:readonly ConfettiParticle[];
 readonly colors:readonly string[];
 readonly origin:{readonly x:number;readonly y:number};
 readonly physics:ConfettiPhysics;
}
/** A piece at one tick: `x`,`y` from the burst's origin, and the two edges (`ux`,`uy`) and (`vx`,`vy`) of the parallelogram canvas-confetti draws from that point. `wobble` is the wobble angle. */
export interface ConfettiFlight {x:number;y:number;ux:number;uy:number;vx:number;vy:number;wobble:number}
/** A piece as one box a view can draw: its centre from the burst's origin, a rotation in radians and its width and height as a share of `confettiBox`. */
export interface ConfettiPose {x:number;y:number;rotate:number;scaleX:number;scaleY:number}
/** Ticks per second, and so the length of a tick. */
export const CONFETTI_TICKS_PER_SECOND=60;
/** The tick a burst is first drawn at, as canvas-confetti's first frame is: its pieces have already left the origin. A renderer runs `t` from here to `physics.ticks`. */
export const CONFETTI_FIRST_TICK=1;
/** canvas-confetti's defaults, apart from `colors` (the renderer's token roles) and `disableForReducedMotion` (true here). */
export const confettiDefaults={particleCount:50,angle:90,spread:45,startVelocity:45,decay:0.9,gravity:1,drift:0,ticks:200,origin:{x:0.5,y:0.5},shapes:['square','circle'] as readonly ConfettiShape[],scalar:1,flat:false,disableForReducedMotion:true,zIndex:100} as const;
/** The furthest an option may reach either way, and the furthest a launch speed may carry a piece, in ticks' worth of it. Far beyond any screen, and small enough that every place computed from them is a finite number. */
const REACH=1e6,TRAVEL=1e9;
/** A finite number within `low` and `high`; anything else is the default. */
const finite=(value:unknown,fallback:number,low=-REACH,high=REACH):number=>typeof value==='number'&&Number.isFinite(value)?Math.min(high,Math.max(low,value)):fallback;
const list=<T,>(value:readonly T[]|undefined):readonly T[]=>Array.isArray(value)?value:[];
const shapes:readonly ConfettiShape[]=['square','circle','star'];
/** canvas-confetti's star for a piece of size 1: five outer points this far from its centre and five inner points between them, the first outer point straight up. */
export const CONFETTI_STAR_OUTER=0.8,CONFETTI_STAR_INNER=0.4;
/** The star's outline for a piece of size 1, around its centre: ten points, alternately outer and inner. A renderer with paths joins them. */
export const confettiStarPoints:readonly (readonly [number,number])[]=Array.from({length:10},(_,index)=>{const angle=Math.PI*1.5+index*Math.PI/5,radius=index%2?CONFETTI_STAR_INNER:CONFETTI_STAR_OUTER;return [Math.cos(angle)*radius,Math.sin(angle)*radius] as const;});
/**
 * The same star for a renderer without paths: five equal triangles, each with its apex on an outer point, its sides along
 * the star's two edges there and its base through the centre. Turned a fifth of a turn apart they cover the star exactly,
 * with nothing outside it. `width` is the base and `height` the apex above it, for a piece of size 1.
 */
export const confettiStarWedge={width:2*CONFETTI_STAR_OUTER*CONFETTI_STAR_INNER*Math.sin(Math.PI/5)/(CONFETTI_STAR_OUTER-CONFETTI_STAR_INNER*Math.cos(Math.PI/5)),height:CONFETTI_STAR_OUTER} as const;
/**
 * Launches a burst: `particleCount` pieces, each with its own direction, speed, wobble and tumble drawn from `random`
 * (seven draws a piece, in the order shape, wobble, wobble speed, speed, direction, tumble, flutter seed). Invalid numbers
 * read as the default, and `colors` or `shapes` that are not a list as none given. `fallbackColors` (a list, or a function asked only when needed) are used when `options.colors` holds
 * no colour. Pass a seeded `random` for a repeatable burst.
 */
export function createConfettiBurst(options:ConfettiOptions|undefined,fallbackColors:readonly string[]|(()=>readonly string[]),random:()=>number=Math.random):ConfettiBurst{
 const o=options??{},d=confettiDefaults;
 const count=Math.floor(finite(o.particleCount,d.particleCount,0,500));
 const angle=finite(o.angle,d.angle)*Math.PI/180,spread=finite(o.spread,d.spread)*Math.PI/180,velocity=finite(o.startVelocity,d.startVelocity);
 const own=list(o.colors).filter(color=>typeof color==='string'&&color!=='');const colors=own.length?own:typeof fallbackColors==='function'?fallbackColors():fallbackColors;
 const picked=list(o.shapes).filter(shape=>shapes.includes(shape));const pool=picked.length?picked:d.shapes;
 const particles:ConfettiParticle[]=[];
 for(let index=count-1;index>=0&&colors.length>0;index--){
  const shape=pool[Math.min(pool.length-1,Math.floor(random()*pool.length))];
  const wobble=random()*10,wobbleSpeed=Math.min(0.11,random()*0.1+0.05),speed=velocity*0.5+random()*velocity;
  const direction=-angle+(0.5*spread-random()*spread),tilt=(random()*0.5+0.25)*Math.PI,seed=random()*1000;
  particles.push({dx:Math.cos(direction)*speed,dy:Math.sin(direction)*speed,wobble,wobbleSpeed,tilt,seed,color:index%colors.length,shape});
 }
 return {particles,colors,origin:{x:finite(o.origin?.x,d.origin.x),y:finite(o.origin?.y,d.origin.y)},
  physics:{ticks:finite(o.ticks,d.ticks,1),decay:finite(o.decay,d.decay,0),gravity:finite(o.gravity,d.gravity)*3,drift:finite(o.drift,d.drift),size:10*finite(o.scalar,d.scalar,0),flat:o.flat===true}};
}
/** True when the burst should not be drawn: reduced motion is on and the call did not opt out with `disableForReducedMotion: false`. */
export function confettiSkipped(options:ConfettiOptions|undefined,reducedMotion:boolean|undefined):boolean{return reducedMotion===true&&options?.disableForReducedMotion!==false;}
/** The same burst seen in a mirror: for a cannon that should fire from the leading edge in right-to-left text. Confetti itself is physical and never mirrors on its own. */
export function mirrorConfetti(options?:ConfettiOptions):ConfettiOptions{
 const o=options??{},d=confettiDefaults;
 return {...o,angle:180-finite(o.angle,d.angle),drift:0-finite(o.drift,d.drift),origin:{...o.origin,x:1-finite(o.origin?.x,d.origin.x)}};
}
/** One burst, several or none as a list: what `Confetti` fires for its `options`. Nothing given is one default burst. */
export function confettiBursts(options:ConfettiOptions|readonly ConfettiOptions[]|undefined):readonly (ConfettiOptions|undefined)[]{return Array.isArray(options)?options as readonly ConfettiOptions[]:[options as ConfettiOptions|undefined];}
/** How long a burst is drawn for, in milliseconds: from `CONFETTI_FIRST_TICK` to its last tick. */
export function confettiDuration(physics:ConfettiPhysics):number{'worklet';return Math.max(0,physics.ticks-CONFETTI_FIRST_TICK)*1000/CONFETTI_TICKS_PER_SECOND;}
/** How visible a burst is at tick `t`: every piece fades in a straight line over the burst, from 1 on its first tick, as in canvas-confetti, towards 0 one tick after its last. */
export function confettiOpacity(physics:ConfettiPhysics,t:number):number{'worklet';return Math.max(0,Math.min(1,1-(t-CONFETTI_FIRST_TICK)/physics.ticks));}
/**
 * How far its launch speed has carried a piece by tick `t`, in ticks' worth of that speed: the sum of `decay` to the power
 * of each tick so far. Every piece of a burst shares it, so a renderer may compute it once a frame. With a `decay` above 1
 * it grows without end, so it stops at a distance far off any screen and stays a finite number.
 */
export function confettiTravel(physics:ConfettiPhysics,t:number):number{
 'worklet';
 const decay=physics.decay;
 return Math.min(TRAVEL,decay===1?t:(1-Math.pow(decay,t))/(1-decay));
}
/**
 * Where a piece is at tick `t` and the parallelogram it is drawn as, written into `out`. `travel` is `confettiTravel` for the
 * same tick. The flutter (canvas-confetti redraws each piece with a new random width every tick) is a hash of the piece's
 * seed and the whole tick, so it stays at 60 changes a second on any display and is the same on both platforms.
 */
export function confettiFlight(particle:ConfettiParticle,physics:ConfettiPhysics,t:number,travel:number,out:ConfettiFlight):ConfettiFlight{
 'worklet';
 const size=physics.size;
 out.x=particle.dx*travel+physics.drift*t;out.y=particle.dy*travel+physics.gravity*t;
 if(physics.flat){out.ux=size;out.uy=0;out.vx=0;out.vy=size;out.wobble=0;return out;}
 const wobble=particle.wobble+particle.wobbleSpeed*t,tilt=particle.tilt+0.1*t;
 const noise=Math.sin((particle.seed+Math.floor(t))*12.9898)*43758.5453,flutter=2+noise-Math.floor(noise);
 out.ux=size*Math.cos(wobble);out.uy=flutter*Math.sin(tilt);out.vx=flutter*Math.cos(tilt);out.vy=size*Math.sin(wobble);out.wobble=wobble;
 return out;
}
/** The untransformed box a piece is drawn in, in pixels: a square's edge, a circle's diameter, or the square around a star. */
export function confettiBox(shape:ConfettiShape,physics:ConfettiPhysics):number{'worklet';return shape==='circle'?physics.size*1.2:shape==='star'?physics.size*1.6:physics.size;}
/**
 * A piece at tick `t` for a renderer that moves boxes and cannot draw a slanted one (React Native drops skew on Android).
 * A circle is exact: canvas-confetti draws it as a turning ellipse. A square's parallelogram becomes the rectangle with the
 * same centre, the same area and the same long and short axes (its singular values), turned to the long axis; a flat square
 * is exact. A star keeps its size and does not turn: the renderer fills its box with `confettiStarWedge` triangles.
 */
export function confettiPose(particle:ConfettiParticle,physics:ConfettiPhysics,t:number):ConfettiPose{
 'worklet';
 // confettiFlight's sums, kept in local variables and taken only as far as the shape needs them. Native runs this for every
 // piece every frame, and its engine allocates a flight object and a boxed number for each field written to it: a star needs
 // no angle at all and a circle no tumble or flutter. The results are the same numbers, bit for bit.
 const size=physics.size,travel=confettiTravel(physics,t),x=particle.dx*travel+physics.drift*t,y=particle.dy*travel+physics.gravity*t;
 if(size<=0)return {x,y,rotate:0,scaleX:0,scaleY:0};
 if(particle.shape==='star')return {x,y,rotate:0,scaleX:1,scaleY:1};
 const flat=physics.flat,wobble=flat?0:particle.wobble+particle.wobbleSpeed*t,ux=flat?size:size*Math.cos(wobble),vy=flat?size:size*Math.sin(wobble);
 if(particle.shape==='circle')return {x,y,rotate:Math.PI/10*wobble,scaleX:Math.abs(ux)/size,scaleY:Math.abs(vy)/size};
 let uy=0,vx=0;
 if(!flat){const tilt=particle.tilt+0.1*t,noise=Math.sin((particle.seed+Math.floor(t))*12.9898)*43758.5453,flutter=2+noise-Math.floor(noise);uy=flutter*Math.sin(tilt);vx=flutter*Math.cos(tilt);}
 // Singular values of [[ux,vx],[uy,vy]] and the rotation that follows the stretch; the rotation before it only turns a square onto itself.
 const e=(ux+vy)/2,f=(ux-vy)/2,g=(uy+vx)/2,h=(uy-vx)/2;
 const q=Math.sqrt(e*e+h*h),r=Math.sqrt(f*f+g*g);
 // The flutter does not shrink with the piece, so a piece far below a pixel would be stretched without end: the stretch stops at REACH.
 return {x:x+(ux+vx)/2,y:y+(uy+vy)/2,rotate:(Math.atan2(h,e)+Math.atan2(g,f))/2,scaleX:Math.min(REACH,(q+r)/size),scaleY:Math.min(REACH,Math.abs(q-r)/size)};
}
