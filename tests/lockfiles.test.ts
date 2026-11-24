import {it,expect} from 'vitest';
import {existsSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
// @ts-expect-error Executable lockfile gate (plain ESM, no types).
import {compareLockfiles,parseBunLock} from '../scripts/check-lockfiles.mjs';

const load=()=>({
  bun:parseBunLock(readFileSync('bun.lock','utf8')),
  manifests:new Map<string,unknown>(),
});
const run=({bun,manifests}:ReturnType<typeof load>)=>compareLockfiles({bun,manifest:(path:string)=>{if(manifests.has(path))return manifests.get(path);const file=join(path,'package.json');return existsSync(file)?JSON.parse(readFileSync(file,'utf8')):undefined;}});

it('bun.lock and every workspace package.json agree on direct dependencies',()=>{
  expect(run(load())).toEqual([]);
});
it('a package.json change without bun.lock fails',()=>{
  const state=load();const pkg=JSON.parse(readFileSync('package.json','utf8'));
  pkg.devDependencies.jsdom='0.0.1';state.manifests.set('',pkg);
  expect(run(state)).toEqual([`(root) devDependencies jsdom: package.json 0.0.1 but bun.lock ${state.bun.workspaces[''].devDependencies.jsdom}`]);
});
it('a direct dependency missing from bun.lock fails',()=>{
  const state=load();
  delete state.bun.packages.esbuild;
  expect(run(state)).toEqual(['(root) esbuild: not resolved in bun.lock']);
});
it('the quality job checks bun.lock before installing',()=>{
  const full=readFileSync('.github/workflows/quality.yml','utf8');
  const start=full.indexOf('\n  quality:\n');
  expect(start).toBeGreaterThan(-1);
  const next=full.slice(start+1).search(/\n {2}[a-z][a-z-]*:\n/);
  const workflow=next===-1?full.slice(start):full.slice(start,start+1+next);
  expect(workflow.indexOf('node scripts/check-lockfiles.mjs')).toBeGreaterThan(-1);
  expect(workflow.indexOf('node scripts/check-lockfiles.mjs --npm')).toBe(-1);
  expect(workflow.indexOf('node scripts/check-lockfiles.mjs')).toBeLessThan(workflow.indexOf('bun install --frozen-lockfile'));
  expect(JSON.parse(readFileSync('package.json','utf8')).scripts.lint).toContain('node scripts/check-lockfiles.mjs');
});

it('rejects a local tarball in bun.lock',()=>{
  const state=load();state.bun.packages['@bloxwap/icons']=['@bloxwap/icons@0.1.0','file:vendor/bloxwap-icons-0.1.0.tgz',{},'sha512-dead'];
  expect(run(state)).toEqual(['@bloxwap/icons: local tarball resolution file:vendor/bloxwap-icons-0.1.0.tgz cannot be installed on a clean release runner; use the published registry package']);
});
