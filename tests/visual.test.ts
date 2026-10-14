import {it,expect} from 'vitest';
// @ts-expect-error Executable JavaScript comparator.
import {compareVisual} from '../scripts/visual-diff.mjs';
// @ts-expect-error Dev-only PNG fixture writer has no TypeScript declarations.
import {PNG} from 'pngjs';
it('fails a material visual change and geometry regression while tolerating minor antialiasing',()=>{
 const baseline=new PNG({width:10,height:10});baseline.data.fill(100);const bytes=PNG.sync.write(baseline);
 const actual=new PNG({width:10,height:10});actual.data.fill(110);expect(compareVisual(PNG.sync.write(actual),bytes).changedRatio).toBe(0);
 actual.data.fill(200);expect(()=>compareVisual(PNG.sync.write(actual),bytes)).toThrow('Visual pixel regression');
 expect(()=>compareVisual(PNG.sync.write(new PNG({width:11,height:10})),bytes)).toThrow('Visual geometry regression');
});
