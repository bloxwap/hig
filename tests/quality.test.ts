import {it,expect} from 'vitest';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync} from 'node:fs';
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
 expect(pkg.exports['./react/chart']).toBeUndefined();expect(pkg.exports['./chart']).toEqual({types:'./chart/dist/index.d.ts',import:'./chart/dist/index.js'});
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
