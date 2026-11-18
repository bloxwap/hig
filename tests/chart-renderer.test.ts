import {afterEach,expect,it,vi} from 'vitest';
import {appendLiveTail,beginTrail,fillTrail,historyPath} from '../packages/hig/chart/src/chart-renderer';

class RecordingPath {
 constructor(readonly source?:RecordingPath){}
 moveTo=vi.fn();lineTo=vi.fn();bezierCurveTo=vi.fn();closePath=vi.fn();
}
afterEach(()=>vi.unstubAllGlobals());

it('reuses historical stroke and area paths as the viewport scrolls and keeps the live connector and fade anchored',()=>{
 vi.stubGlobal('Path2D',RecordingPath);
 const gradient={addColorStop:vi.fn()};
 const operations={beginPath:vi.fn(),moveTo:vi.fn(),lineTo:vi.fn(),bezierCurveTo:vi.fn(),closePath:vi.fn(),
  save:vi.fn(),restore:vi.fn(),rect:vi.fn(),clip:vi.fn(),translate:vi.fn(),stroke:vi.fn(),fill:vi.fn(),createLinearGradient:vi.fn(()=>gradient)};
 const ctx=operations as unknown as CanvasRenderingContext2D;
 const ticks=[{t:0,p:20},{t:1000,p:40},{t:2000,p:75}];
 const first=historyPath(ctx,ticks,2000,0,160,p=>p,0,1)!;
 beginTrail(ctx,first,ticks,0,160,'#ff0000');appendLiveTail(ctx,first.last,160,75);
 fillTrail(ctx,first,160,75,30,30,90);ctx.restore();
 const line=operations.stroke.mock.calls[0][0],area=operations.fill.mock.calls[0][0];
 expect(area.source).toBe(line);
 // Ten pixels of horizontal scrolling and five pixels of ladder movement.
 const next=historyPath(ctx,ticks,2200,0,160,p=>p+5,5,1)!;
 beginTrail(ctx,next,ticks,0,160,'#ff0000');
 appendLiveTail(ctx,next.last,160-next.dx,82-next.dy);fillTrail(ctx,next,160-next.dx,82-next.dy,35-next.dy,30,90);ctx.restore();
 expect(operations.stroke).toHaveBeenLastCalledWith(line);expect(operations.fill.mock.calls[2][0]).toBe(area);
 expect(operations.translate).toHaveBeenLastCalledWith(-10,5);
 expect(operations.rect).toHaveBeenLastCalledWith(10,-5,160,90);
 expect(operations.createLinearGradient).toHaveBeenLastCalledWith(10,0,170,0);
 expect(operations.bezierCurveTo).toHaveBeenLastCalledWith(160+10/3,75,170-10/3,77,170,77);
 // Moving the position's break-even line rebuilds just the area.
 fillTrail(ctx,next,170,77,45-next.dy,40,90);
 expect(operations.fill.mock.calls[4][0]).not.toBe(area);
 expect(operations.fill.mock.calls[4][0].source).toBe(line);
});
