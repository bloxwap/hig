// Geometry and easing for AltimeterChart, shared with the Bloxwap app's live chart: a 50px grid and trail that flow
// left one tile per second, a price ladder with 44px between ticks, and a 300ms ease-in-out price tween.

/** One sampled price. `t` is in milliseconds on the chart's clock. */
export type AltimeterTick={t:number;p:number};
/** Keep one sample before the cutoff so the trail can interpolate its left edge. Called before appending the next sample. */
export function firstRetainedTick(ticks:readonly AltimeterTick[],cutoff:number):number{
 let index=0;
 while(index+1<ticks.length&&ticks[index+1].t<cutoff)index++;
 return index;
}

/** Grid tile size, and the pixels the grid and trail travel each second. */
export const ALTIMETER_FLOW_PX=50;
/** Vertical pixels between ladder ticks. */
export const ALTIMETER_TICK_PX=44;
/** Trail sampling cadence, so the line keeps flowing on a quiet market. */
export const ALTIMETER_SAMPLE_MS=200;
/** Duration of the price tween. */
export const ALTIMETER_EASE_MS=300;
/** Half the length of a grid mark's arm. */
export const ALTIMETER_MARK_ARM=3;

/** Price between two ladder ticks: about one basis point, rounded to whole cents or a 1/2/5 step below a cent. */
export function tickSpacingFor(price:number):number{
 if(!Number.isFinite(price)||price<=0)return 0.01;
 const raw=price/10_000;
 if(raw>=0.01)return Math.ceil(raw*100)/100;
 const magnitude=Math.pow(10,Math.floor(Math.log10(raw))),normalized=raw/magnitude;
 return (normalized<=1?1:normalized<=2?2:normalized<=5?5:10)*magnitude;
}
/** Fraction digits that tell neighboring ladder ticks apart: at least two, at least four below $1, at most 20. */
export function labelDecimalsFor(spacing:number,price:number):number{
 const subDollar=price>0&&price<1?4:0;
 if(!Number.isFinite(spacing)||spacing<=0)return Math.max(2,subDollar);
 return Math.max(2,Math.min(20,Math.max(0,Math.ceil(-Math.log10(spacing)-1e-9))),subDollar);
}
/** Horizontal offset of the grid at `now`, within (-50, 0]: one tile left per second. */
export function gridPhase(now:number):number{
 const phase=-((now*ALTIMETER_FLOW_PX)/1000)%ALTIMETER_FLOW_PX;
 return phase===0?0:phase;
}
/** The tween's cubic-bezier(0.42, 0, 0.58, 1) at time fraction `t`. */
export function easeInOut(t:number):number{
 if(t<=0)return 0;
 if(t>=1)return 1;
 const p1x=0.42,p2x=0.58;
 let u=t;
 for(let i=0;i<6;i++){
  const v=1-u,x=3*v*v*u*p1x+3*v*u*u*p2x+u*u*u,dx=3*v*v*p1x+6*v*u*(p2x-p1x)+3*u*u*(1-p2x);
  if(Math.abs(dx)<1e-6)break;
  u=Math.min(1,Math.max(0,u-(x-t)/dx));
 }
 // The y control points are 0 and 1, so only the last two Bernstein terms remain.
 return 3*(1-u)*u*u+u*u*u;
}

/** A 300ms monotone Hermite tween: retarget from the current position and retain forward velocity without overshoot. */
export function priceTween(){
 let from=NaN,to=NaN,start=0,tangent=0;
 return {
  reset(){from=to=NaN;tangent=0;},
  update(target:number,now:number,snap=false):number{
   if(snap||!Number.isFinite(to)){from=to=target;start=now;tangent=0;return target;}
   if(from===to||now-start>=ALTIMETER_EASE_MS){
    const settled=to;
    if(target!==to){from=settled;to=target;start=now;tangent=0;}
    return settled;
   }
   const t=Math.max(0,(now-start)/ALTIMETER_EASE_MS),delta=to-from;
   const value=from+delta*t*t*(3-2*t)+tangent*t*(1-t)*(1-t);
   if(target!==to){
    const velocity=(delta*6*t*(1-t)+tangent*(1-t)*(1-3*t))/ALTIMETER_EASE_MS;
    from=value;to=target;start=now;
    const next=to-from,direction=Math.sign(next);
    // A reversal starts from rest. A nearer endpoint limits the tangent so it cannot overshoot a target.
    tangent=direction*Math.min(3*Math.abs(next),Math.max(0,direction*velocity*ALTIMETER_EASE_MS));
   }
   return value;
  },
 };
}

export type AltimeterPoint=readonly [number,number];
export interface AltimeterPathSink{moveTo(x:number,y:number):void;lineTo(x:number,y:number):void;bezierCurveTo(c1x:number,c1y:number,c2x:number,c2y:number,x:number,y:number):void}
const slope=(points:readonly AltimeterPoint[],i:number)=>{const dx=points[i+1][0]-points[i][0];return dx===0?0:(points[i+1][1]-points[i][1])/dx;};
/** Draws a monotone cubic (Fritsch-Carlson) through `points`, so the trail never overshoots a sampled price. */
export function smoothTrail(points:readonly AltimeterPoint[],sink:AltimeterPathSink):void{
 const count=points.length;
 if(count===0)return;
 sink.moveTo(points[0][0],points[0][1]);
 if(count===1)return;
 if(count===2){sink.lineTo(points[1][0],points[1][1]);return;}
 const tangents=new Array<number>(count);
 let delta=slope(points,0);
 tangents[0]=delta;
 for(let i=0;i<count-1;i++){
  const hasNext=i+2<count;
  const nextDelta=hasNext?slope(points,i+1):delta;
  tangents[i+1]=hasNext?(delta*nextDelta<=0?0:(delta+nextDelta)/2):delta;
  if(delta===0){tangents[i]=0;tangents[i+1]=0;}
  else{
   const a=tangents[i]/delta,b=tangents[i+1]/delta,size=a*a+b*b;
   if(size>9){const scale=3/Math.sqrt(size);tangents[i]=scale*a*delta;tangents[i+1]=scale*b*delta;}
  }
  delta=nextDelta;
 }
 for(let i=0;i<count-1;i++){
  const [x0,y0]=points[i],[x1,y1]=points[i+1],dx=x1-x0;
  sink.bezierCurveTo(x0+dx/3,y0+(tangents[i]*dx)/3,x1-dx/3,y1-(tangents[i+1]*dx)/3,x1,y1);
 }
}
/**
 * Trail points for the samples still on screen. The newest price sits at `trailEnd`; a sample `age` ms old sits
 * `age * 50 / 1000` px to its left. The first point is interpolated onto the left edge so the line enters cleanly.
 */
export function trailPoints(ticks:readonly AltimeterTick[],now:number,trailStart:number,trailEnd:number,yFor:(price:number)=>number,compactFlat=false):AltimeterPoint[]{
 const xFor=(t:number)=>trailEnd-((now-t)/1000)*ALTIMETER_FLOW_PX;
 const edge=now-((trailEnd-trailStart)/ALTIMETER_FLOW_PX)*1000;
 const points:[number,number][]=[];
 for(let i=0;i<ticks.length;i++){
  const tick=ticks[i];
  if(tick.t<edge)continue;
  if(points.length===0&&i>0){
   const previous=ticks[i-1],span=tick.t-previous.t,fraction=span>0?(edge-previous.t)/span:0;
   points.push([trailStart,yFor(previous.p+fraction*(tick.p-previous.p))]);
  }
  const x=xFor(tick.t),y=yFor(tick.p),last=points.length-1;
  // The two ends of a horizontal run fix the same zero tangents as every sample in between.
  if(compactFlat&&last>0){
   const endpoint=points[last],previous=points[last-1];
   if(endpoint[1]===y&&previous[1]===y&&previous[0]<=endpoint[0]&&endpoint[0]<=x){
    endpoint[0]=x;endpoint[1]=y;
    continue;
   }
  }
  points.push([x,y]);
 }
 return points;
}
/** Ladder prices from `anchor` in steps of `spacing` that cover `low` to `high`. */
export function ladderPrices(anchor:number,spacing:number,low:number,high:number):number[]{
 if(!(spacing>0)||!Number.isFinite(anchor)||!(high>=low))return [];
 const first=Math.ceil((low-anchor)/spacing),last=Math.floor((high-anchor)/spacing),prices:number[]=[];
 for(let i=first;i<=last&&prices.length<200;i++)prices.push(anchor+i*spacing);
 return prices;
}
