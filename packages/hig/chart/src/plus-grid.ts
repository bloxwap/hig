import {tokens} from '@bloxwap/hig/tokens';
import {ALTIMETER_FLOW_PX,ALTIMETER_MARK_ARM} from './altimeter-model.js';

/** The mono face as the page loads it (a font loader's variable, else the family name), for DOM text. */
export const monoFont=`var(--hig-font-mono, "${tokens.font.mono.family}", ${tokens.font.mono.fallback.join(', ')})`;
/** The mono face by name, for a canvas before the page's own font stack is read. */
export const monoFallback=`"${tokens.font.mono.family}", ${tokens.font.mono.fallback.join(', ')}`;
/** Strokes plus marks on 50px columns. `phase` in (-50, 0] shifts them left. Rows are 50px apart unless `rows` names their vertical centers. */
export function drawPlusGrid(ctx:CanvasRenderingContext2D,width:number,height:number,phase:number,color:string,rows?:readonly number[]):void{
 const half=ALTIMETER_FLOW_PX/2,arm=ALTIMETER_MARK_ARM;
 let centers=rows;
 if(!centers){const tiled:number[]=[];for(let y=half;y<height+arm;y+=ALTIMETER_FLOW_PX)tiled.push(y);centers=tiled;}
 ctx.lineCap='round';
 ctx.beginPath();
 for(let x=phase+half;x<width+arm;x+=ALTIMETER_FLOW_PX)for(const y of centers){ctx.moveTo(x-arm,y);ctx.lineTo(x+arm,y);ctx.moveTo(x,y-arm);ctx.lineTo(x,y+arm);}
 ctx.strokeStyle=color;ctx.lineWidth=1;ctx.stroke();
}
