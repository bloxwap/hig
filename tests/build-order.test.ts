import {it,expect} from 'vitest';
import {cpSync,mkdtempSync,mkdirSync,readdirSync,rmSync,symlinkSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
// @ts-expect-error Build-order derivation (plain ESM, no types).
import {buildOrder,entryGraph,higEntries,orderViolations} from '../scripts/build-order.mjs';

const tsconfigDirs=readdirSync('packages/hig',{withFileTypes:true}).filter(d=>d.isDirectory()&&readdirSync(join('packages/hig',d.name)).includes('tsconfig.json')).map(d=>d.name).sort();
// Copies packages/hig sources (no dist) into a scratch root that higEntries/entryGraph can scan.
const scratch=()=>{const root=mkdtempSync(join(tmpdir(),'hig-build-order-'));cpSync('packages/hig',join(root,'packages/hig'),{recursive:true,filter:src=>!/[/\\](dist|node_modules|fonts|assets)$/.test(src)});return root;};

it('the build covers every packages/hig/*/tsconfig.json in a valid dependency order (#182)',()=>{
  const graph=entryGraph();const order=buildOrder(graph);
  expect([...order].sort()).toEqual(tsconfigDirs);
  expect(higEntries()).toEqual(tsconfigDirs);
  expect(orderViolations(order,graph)).toEqual([]);
  // The cross-entry imports the issue relies on are seen.
  expect(graph.chart).toEqual(expect.arrayContaining(['contracts','react','tokens']));
  expect(graph.react).toEqual(expect.arrayContaining(['contracts','tokens']));
  expect(graph.native).toEqual(expect.arrayContaining(['contracts','tokens']));
});
it('moving react after chart, or dropping an entry, is rejected',()=>{
  const graph=entryGraph();const order=buildOrder(graph).filter((e:string)=>e!=='react');
  expect(orderViolations([...order,'react'],graph)).toContain('chart is built before react, which it imports');
  expect(orderViolations(order,graph)).toContain('react is never built');
});
it('import cycles, including self-imports, fail the derivation',()=>{
  expect(()=>buildOrder({contracts:['feedback'],feedback:['contracts']})).toThrow('HIG entry import cycle: contracts -> feedback -> contracts');
  expect(()=>buildOrder({react:['react']})).toThrow('HIG entry import cycle: react -> react');
});
it('a new entry is picked up and ordered from its imports; comments are not imports',()=>{
  const root=scratch();
  mkdirSync(join(root,'packages/hig/extra/src'),{recursive:true});
  writeFileSync(join(root,'packages/hig/extra/tsconfig.json'),'{}');
  writeFileSync(join(root,'packages/hig/extra/src/index.ts'),"// import x from '@bloxwap/hig/native'\nexport type {HIGProviderProps} from '@bloxwap/hig/react/provider';\n");
  const graph=entryGraph(root);const order=buildOrder(graph);
  expect(graph.extra).toEqual(['react']);
  expect(order.indexOf('extra')).toBeGreaterThan(order.indexOf('react'));
  rmSync(root,{recursive:true,force:true});
});
it('a contracts -> feedback import is reported as a cycle',()=>{
  const root=scratch();
  writeFileSync(join(root,'packages/hig/contracts/src/cycle.ts'),"export * from '@bloxwap/hig/feedback';\n");
  expect(()=>buildOrder(entryGraph(root))).toThrow('HIG entry import cycle: contracts -> feedback -> contracts');
  rmSync(root,{recursive:true,force:true});
});
it('an entry without tsconfig.json, or an import of an unknown entry, fails',()=>{
  const root=scratch();
  rmSync(join(root,'packages/hig/chart/tsconfig.json'));
  expect(()=>higEntries(root)).toThrow('HIG entries without packages/hig/<entry>/tsconfig.json or src/: chart');
  rmSync(join(root,'packages/hig/chart'),{recursive:true});
  // chart is still named by packages/hig/package.json exports.
  expect(()=>higEntries(root)).toThrow('chart');
  rmSync(root,{recursive:true,force:true});
  const other=scratch();
  writeFileSync(join(other,'packages/hig/tokens/src/ghost.ts'),"export * from '@bloxwap/hig/ghost';\n");
  expect(()=>entryGraph(other)).toThrow('ghost is not a HIG entry');
  rmSync(other,{recursive:true,force:true});
});
it('build.mjs fails loudly when a listed entry has no tsconfig.json',()=>{
  const root=scratch();
  mkdirSync(join(root,'scripts'));
  for(const f of ['build.mjs','build-order.mjs','compiler.mjs'])cpSync(join('scripts',f),join(root,'scripts',f));
  symlinkSync(resolve('node_modules'),join(root,'node_modules'),'dir');
  rmSync(join(root,'packages/hig/native/tsconfig.json'));
  const run=spawnSync(process.execPath,[join(root,'scripts/build.mjs')],{cwd:root,encoding:'utf8'});
  expect(run.status).not.toBe(0);
  expect(run.stderr).toContain('packages/hig/<entry>/tsconfig.json or src/: native');
  rmSync(root,{recursive:true,force:true});
});
