import {it,expect} from 'vitest';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,cpSync,rmSync,symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {join,resolve} from 'node:path';
// @ts-expect-error Executable JavaScript gate tested through its public functions.
import {checkExports,assertBudget,checkPlatformImports,checkChartBoundary} from '../scripts/quality.mjs';
// @ts-expect-error Executable anti-drift gate.
import {driftViolations} from '../scripts/drift.mjs';
it('fails invalid package exports',()=>{const directory=mkdtempSync(join(tmpdir(),'hig-invalid-export-'));writeFileSync(join(directory,'package.json'),JSON.stringify({name:'invalid',exports:{'.':'./missing.js'}}));expect(()=>checkExports(directory)).toThrow('Invalid export');});
it('fails a deliberate budget regression',()=>{expect(()=>assertBudget('button',101,100)).toThrow('Budget regression');expect(()=>assertBudget('button',100,100)).not.toThrow();});
it('fails cross-platform imports instead of silently skipping native checks',()=>{const directory=mkdtempSync(join(tmpdir(),'hig-invalid-platform-'));mkdirSync(join(directory,'dist'));writeFileSync(join(directory,'dist','button.js'),"import {View} from 'react-native';");expect(()=>checkPlatformImports(directory,'web')).toThrow('Invalid web platform import');});
it('rejects copied tokens/obsolete imports and expired exceptions',()=>{const copied="import { Button } from '@workspace/ui/button'; const green='#00ff3f';";expect(driftViolations(copied,'surface.tsx',[])).toHaveLength(2);expect(driftViolations(copied,'surface.tsx',[{path:'surface.tsx',rule:'copied-palette',owner:'maintainer',reason:'approved',expires:'2000-01-01'}])).toHaveLength(2);});
it('a deliberately stale generated token artifact fails the real anti-drift command',()=>{const directory=mkdtempSync(join(tmpdir(),'hig-stale-token-'));mkdirSync(join(directory,'packages/hig/tokens'),{recursive:true});writeFileSync(join(directory,'packages/hig/tokens/source.json'),readFileSync('packages/hig/tokens/source.json'));writeFileSync(join(directory,'packages/hig/tokens/upstream-palette.json'),readFileSync('packages/hig/tokens/upstream-palette.json'));const generator=resolve('scripts/generate.mjs');expect(spawnSync(process.execPath,[generator],{cwd:directory}).status).toBe(0);writeFileSync(join(directory,'packages/hig/tokens/generated/tokens.css'),'stale');const check=spawnSync(process.execPath,[resolve('scripts/check-drift.mjs')],{cwd:directory,encoding:'utf8'});expect(check.status).not.toBe(0);expect(check.stderr).toContain('Stale generated artifact');});
it('a stale radius/type/motion/density role fails the real anti-drift command (#66)',()=>{const directory=mkdtempSync(join(tmpdir(),'hig-stale-role-'));mkdirSync(join(directory,'packages/hig/tokens'),{recursive:true});writeFileSync(join(directory,'packages/hig/tokens/source.json'),readFileSync('packages/hig/tokens/source.json'));writeFileSync(join(directory,'packages/hig/tokens/upstream-palette.json'),readFileSync('packages/hig/tokens/upstream-palette.json'));const generator=resolve('scripts/generate.mjs');expect(spawnSync(process.execPath,[generator],{cwd:directory}).status).toBe(0);const css=join(directory,'packages/hig/tokens/generated/tokens.css');writeFileSync(css,readFileSync(css,'utf8').replace('--hig-motion-duration-fast: 180ms;','--hig-motion-duration-fast: 200ms;'));const check=spawnSync(process.execPath,[resolve('scripts/check-drift.mjs')],{cwd:directory,encoding:'utf8'});expect(check.status).not.toBe(0);expect(check.stderr).toContain('Stale generated artifact');});
it('@bloxwap/hig names @bloxwap/chart only as a required peer and has no ./react/chart entry (#96)',()=>{
 const pkg=JSON.parse(readFileSync('packages/hig/package.json','utf8'));
 expect(pkg.name).toBe('@bloxwap/hig');expect(pkg.version).toBe(JSON.parse(readFileSync('package.json','utf8')).version);
 expect(pkg.exports['./react/chart']).toBeUndefined();expect(pkg.exports['./chart']).toEqual({types:'./chart/dist/index.d.ts',import:'./chart/dist/index.js',default:'./chart/dist/index.js'});
 expect(pkg.peerDependencies['@bloxwap/chart']).toBe('^0.3.0 || ^0.4.0');expect(pkg.peerDependenciesMeta['@bloxwap/chart']).toBeUndefined();
 expect(pkg.dependencies).toBeUndefined();
 expect(()=>checkChartBoundary()).not.toThrow();
});

it('the chart boundary gate rejects an optional or missing @bloxwap/chart peer and chart imports outside ./chart',()=>{
 const fixture=(manifest:object)=>{const root=mkdtempSync(join(tmpdir(),'hig-chart-boundary-'));writeFileSync(join(root,'package.json'),JSON.stringify({name:'@bloxwap/hig',...manifest}));return root;};
 const required={peerDependencies:{'@bloxwap/chart':'^0.3.0'}};
 expect(()=>checkChartBoundary(fixture(required))).not.toThrow();
 expect(()=>checkChartBoundary(fixture({}))).toThrow('required peer only');
 expect(()=>checkChartBoundary(fixture({...required,peerDependenciesMeta:{'@bloxwap/chart':{optional:true}}}))).toThrow('required peer only');
 expect(()=>checkChartBoundary(fixture({...required,dependencies:{'@bloxwap/chart':'^0.3.0'}}))).toThrow('required peer only');
 const adapter=fixture(required);mkdirSync(join(adapter,'chart/dist'),{recursive:true});writeFileSync(join(adapter,'chart/dist/index.js'),"export const load=()=>import('@bloxwap/chart/react');");
 expect(()=>checkChartBoundary(adapter)).not.toThrow();
 const leaked=fixture(required);mkdirSync(join(leaked,'react/dist'),{recursive:true});writeFileSync(join(leaked,'react/dist/chart.js'),"export const load=()=>import('@bloxwap/chart/react');");
 expect(()=>checkChartBoundary(leaked)).toThrow('react dist/chart.js imports @bloxwap/chart');
});

// Exercise the exact post-build CI gate in isolated repositories. Tiny public
// declarations keep this independent of a prior package build.
it.each(['chapter', 'examples'])('post-build drift gate rejects stale %s outputs (#172)', (source) => {
 const directory=mkdtempSync(join(tmpdir(),'hig-generated-drift-'));
 const run=(command:string,args:string[])=>spawnSync(command,args,{cwd:directory,encoding:'utf8'});
 const node=(script:string)=>run(process.execPath,[`scripts/${script}.mjs`]);
 try {
  for(const path of ['scripts','docs','planning','package.json','.gitignore','apps/docs/src/component-groups.json']) {
   const target=join(directory,path);mkdirSync(resolve(target,'..'),{recursive:true});cpSync(path,target,{recursive:true});
  }
  symlinkSync(resolve('node_modules'),join(directory,'node_modules'),'dir');
  mkdirSync(join(directory,'packages/hig'),{recursive:true});
  writeFileSync(join(directory,'packages/hig/package.json'),JSON.stringify({exports:{}}));
  for(const platform of ['react','native','chart']) {
   const dist=join(directory,`packages/hig/${platform}/dist`);mkdirSync(dist,{recursive:true});
   writeFileSync(join(dist,'index.d.ts'),'export declare const Text: unknown;');
  }
  const generate=()=>{
   for(const script of ['generate-examples','generate-docs']) {
    const result=node(script);expect(result.stderr).toBe('');expect(result.status).toBe(0);
   }
  };
  generate();
  expect(run('git',['init']).status).toBe(0);
  expect(run('git',['add','.']).status).toBe(0);
  expect(run('git',['-c','user.name=Drift test','-c','user.email=drift@example.invalid','-c','commit.gpgsign=false','commit','-m','Generated baseline']).status).toBe(0);
  expect(node('check-generated-drift').status).toBe(0);
  if(source==='chapter') {
   const chapter=join(directory,'docs/installation.md');
   writeFileSync(chapter,readFileSync(chapter,'utf8')+'\nA deliberately changed chapter.\n');
  } else {
   const path=join(directory,'planning/examples.json');const manifest=JSON.parse(readFileSync(path,'utf8'));
   manifest.examples[0].web='<C.Text>Deliberately changed example</C.Text>';
   writeFileSync(path,JSON.stringify(manifest,null,2)+'\n');
  }
  generate(); // npm run check also overwrites the stale committed artifacts.
  const stale=node('check-generated-drift');
  expect(stale.status).toBe(1);expect(stale.stderr).toContain('Stale generated artifacts');
  expect(stale.stderr).toContain(source==='chapter'?'apps/docs/public/markdown/installation.md':'apps/docs/src/examples.tsx');
  expect(run('git',['add','.']).status).toBe(0);
  // Staging regenerated files alone must not hide a difference from the commit.
  expect(node('check-generated-drift').status).toBe(1);
  expect(run('git',['reset','--hard','HEAD']).status).toBe(0);
  generate();expect(node('check-generated-drift').status).toBe(0);
  const extra=join(directory,'apps/docs/public/markdown/new-chapter.md');
  writeFileSync(extra,'New generated export');expect(node('check-generated-drift').status).toBe(1);
  rmSync(extra);rmSync(join(directory,'apps/docs/public/catalog.json'));
  expect(node('check-generated-drift').status).toBe(1);
 } finally {rmSync(directory,{recursive:true,force:true});}
},30000);
