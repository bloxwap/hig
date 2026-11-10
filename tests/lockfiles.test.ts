import {it,expect} from 'vitest';
import {existsSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
// @ts-expect-error Executable lockfile gate (plain ESM, no types).
import {compareLockfiles,parseBunLock} from '../scripts/check-lockfiles.mjs';

const load=()=>({
  bun:parseBunLock(readFileSync('bun.lock','utf8')),
  npm:JSON.parse(readFileSync('package-lock.json','utf8')),
  manifests:new Map<string,unknown>(),
});
const run=({bun,npm,manifests}:ReturnType<typeof load>)=>compareLockfiles({bun,npm,manifest:(path:string)=>{if(manifests.has(path))return manifests.get(path);const file=join(path,'package.json');return existsSync(file)?JSON.parse(readFileSync(file,'utf8')):undefined;}});

it('bun.lock, package-lock.json and every workspace package.json agree on direct dependencies (#181)',()=>{
  expect(run(load())).toEqual([]);
});
it('a package.json + bun.lock change without package-lock.json fails',()=>{
  const state=load();const pkg=JSON.parse(readFileSync('package.json','utf8'));
  const locked=state.npm.packages['node_modules/jsdom'].version;
  pkg.devDependencies.jsdom='0.0.1';state.manifests.set('',pkg);
  state.bun.workspaces[''].devDependencies.jsdom='0.0.1';state.bun.packages.jsdom=['jsdom@0.0.1'];
  expect(run(state)).toEqual([`(root) devDependencies jsdom: package.json 0.0.1 but package-lock.json ${state.npm.packages[''].devDependencies.jsdom}`,`(root) jsdom: bun.lock resolves 0.0.1 but package-lock.json resolves ${locked}`]);
});
it('lockfiles resolving a direct dependency to different versions fail',()=>{
  const state=load();state.npm.packages['node_modules/esbuild'].version='0.0.1';
  expect(run(state)).toEqual([`(root) esbuild: bun.lock resolves ${state.bun.packages.esbuild[0].split('@').pop()} but package-lock.json resolves 0.0.1`]);
});
it('a workspace-scoped resolution is compared against the nested npm install',()=>{
  const state=load();const [path,name]=['apps/docs','typescript'];
  expect(state.bun.packages[`hig-docs/${name}`]).toBeDefined();
  state.npm.packages[`${path}/node_modules/${name}`].version='0.0.0';
  expect(run(state)).toEqual([`${path} ${name}: bun.lock resolves ${state.bun.packages[`hig-docs/${name}`][0].split('@').pop()} but package-lock.json resolves 0.0.0`]);
});
it('a workspace missing from package-lock.json fails',()=>{
  const state=load();delete state.npm.packages['fixtures/ssr'];
  expect(run(state)).toEqual(['fixtures/ssr: workspace missing from package-lock.json']);
});
it('the quality job checks package-lock.json with npm before installing with Bun',()=>{
  const workflow=readFileSync('.github/workflows/quality.yml','utf8');
  expect(workflow.indexOf('node scripts/check-lockfiles.mjs --npm')).toBeGreaterThan(-1);
  expect(workflow.indexOf('node scripts/check-lockfiles.mjs --npm')).toBeLessThan(workflow.indexOf('bun install --frozen-lockfile'));
  expect(JSON.parse(readFileSync('package.json','utf8')).scripts.lint).toContain('node scripts/check-lockfiles.mjs');
});
