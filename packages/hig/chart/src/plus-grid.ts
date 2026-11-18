import {tokens} from '@bloxwap/hig/tokens';
import {ALTIMETER_FLOW_PX,ALTIMETER_MARK_ARM} from './altimeter-model.js';

/** The mono face as the page loads it (a font loader's variable, else the family name), for DOM text. */
export const monoFont=`var(--hig-font-mono, "${tokens.font.mono.family}", ${tokens.font.mono.fallback.join(', ')})`;
/** The mono face by name, for a canvas before the page's own font stack is read. */
export const monoFallback=`"${tokens.font.mono.family}", ${tokens.font.mono.fallback.join(', ')}`;
const tiles=new WeakMap<CanvasRenderingContext2D,{width:number;height:number;rows?:readonly number[];path:Path2D}>();
function gridMarks(sink:Path2D|CanvasRenderingContext2D,width:number,height:number,phase:number,rows?:readonly number[]){
 const half=ALTIMETER_FLOW_PX/2,arm=ALTIMETER_MARK_ARM;
 const mark=(x:number,y:number)=>{
  sink.moveTo(x-arm,y);sink.lineTo(x+arm,y);sink.moveTo(x,y-arm);sink.lineTo(x,y+arm);
 };
 for(let x=phase+half;x<width+arm;x+=ALTIMETER_FLOW_PX){
  if(rows){for(const y of rows)mark(x,y);}
  else for(let y=half;y<height+arm;y+=ALTIMETER_FLOW_PX)mark(x,y);
 }
}
/** Cache an extra column so scrolling the grid never exposes an empty edge. */
export function drawPlusGrid(ctx:CanvasRenderingContext2D,width:number,height:number,phase:number,color:string,rows?:readonly number[]):void{
 ctx.lineCap='round';ctx.strokeStyle=color;ctx.lineWidth=1;
 if(typeof Path2D==='undefined'){
  ctx.beginPath();gridMarks(ctx,width,height,phase,rows);ctx.stroke();return;
 }
 let tile=tiles.get(ctx);
 if(!tile||tile.width!==width||tile.height!==height||tile.rows?.length!==rows?.length||rows?.some((y,i)=>tile?.rows?.[i]!==y)){
  const path=new Path2D();gridMarks(path,width+ALTIMETER_FLOW_PX,height,0,rows);
  tile={width,height,rows,path};tiles.set(ctx,tile);
 }
 ctx.save();ctx.translate(phase,0);ctx.stroke(tile.path);ctx.restore();
}
