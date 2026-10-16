// #96: a host shaped like bloxwap/chart keeps its workspace @bloxwap/chart when it regenerates package-lock.json
// from scratch with strict peers. The host is an npm workspace whose packages/chart provides @bloxwap/chart 0.3.0
// and whose apps/docs depends on @bloxwap/chart plus the packed HIG tarballs through file: specs, as chart's docs
// site does. npm (10.9 through 12.2, including chart's 11.6.1) dropped that workspace while @bloxwap/hig-react declared an optional @bloxwap/chart peer; the
// adapter now lives in @bloxwap/hig-chart with a required peer, and hig-react names no @bloxwap/chart at all.
//
// Scenarios (each starts with no package-lock.json and no node_modules, legacy-peer-deps off, strict-peer-deps on):
//   react-only:        apps/docs uses hig-react, tokens and contracts (chart#56 today).
//   react-and-chart:   apps/docs also uses @bloxwap/hig-chart (PriceChart).
//   legacy-control:    hig-react repacked with the pre-#96 optional @bloxwap/chart peer. Recorded, not asserted, so
//                      the evidence shows whether this npm still reproduces the original bug.
// Every scenario runs with the ambient npm (CI: the one bundled with Node 22.22) and with the npm pinned in this
// repository's packageManager (11.6.1, the version chart reported), installed into a scratch prefix.
import {execFileSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,existsSync,cpSync,rmSync,realpathSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,relative} from 'node:path';
import assert from 'node:assert/strict';
import {build} from 'esbuild';

const tarball=name=>resolve(`artifacts/bloxwap-hig-${name}-0.1.0.tgz`);
for(const name of ['react','chart','tokens','contracts'])assert.ok(existsSync(tarball(name)),`Run smoke:packed first: missing ${tarball(name)}`);
// The workspace copy of @bloxwap/chart is the published 0.3.0 build that HIG itself develops against.
const chartSource=resolve('node_modules/@bloxwap/chart');
const chartVersion=JSON.parse(readFileSync(join(chartSource,'package.json'),'utf8')).version;
assert.equal(chartVersion,'0.3.0','root devDependency @bloxwap/chart must be 0.3.0');
const env={...process.env,npm_config_legacy_peer_deps:'false',npm_config_strict_peer_deps:'true'};
delete env.npm_config_force;
const pinnedNpm=JSON.parse(readFileSync('package.json','utf8')).packageManager.replace(/^npm@/,'');
const ambientNpm=execFileSync('npm',['--version'],{encoding:'utf8'}).trim();
function npmClients(scratch){
 const clients=[{version:ambientNpm,source:'ambient',command:['npm']}];
 if(pinnedNpm!==ambientNpm){
  const prefix=join(scratch,`npm-${pinnedNpm}`);mkdirSync(prefix,{recursive:true});
  execFileSync('npm',['install','--prefix',prefix,'--no-audit','--no-fund','--ignore-scripts',`npm@${pinnedNpm}`],{stdio:'pipe'});
  const cli=join(prefix,'node_modules/npm/bin/npm-cli.js'),version=execFileSync(process.execPath,[cli,'--version'],{encoding:'utf8'}).trim();
  assert.equal(version,pinnedNpm);clients.push({version,source:'packageManager',command:[process.execPath,cli]});
 }
 return clients;
}

function legacyReactTarball(directory){
 // Re-add exactly the peer that hig-react declared before #96.
 const work=join(directory,'legacy-react');mkdirSync(work,{recursive:true});
 execFileSync('tar',['xzf',tarball('react'),'-C',work]);
 const path=join(work,'package/package.json'),manifest=JSON.parse(readFileSync(path,'utf8'));
 manifest.peerDependencies={...manifest.peerDependencies,'@bloxwap/chart':'^0.3.0'};
 manifest.peerDependenciesMeta={...manifest.peerDependenciesMeta,'@bloxwap/chart':{optional:true}};
 writeFileSync(path,JSON.stringify(manifest,null,2));
 const [packed]=JSON.parse(execFileSync('npm',['pack',join(work,'package'),'--json','--ignore-scripts','--pack-destination',work],{encoding:'utf8'}));
 return join(work,packed.filename);
}

function host(name,{withChart,reactTarball=tarball('react')}){
 const root=mkdtempSync(join(tmpdir(),`hig-chart-workspace-${name}-`));
 writeFileSync(join(root,'package.json'),JSON.stringify({name:'chart-shaped-host',private:true,type:'module',workspaces:['packages/*','apps/*']},null,2));
 // Strictness lives in the host too, so a plain `npm install` there behaves the same as this script.
 writeFileSync(join(root,'.npmrc'),'legacy-peer-deps=false\nstrict-peer-deps=true\n');
 const chart=join(root,'packages/chart');cpSync(chartSource,chart,{recursive:true,dereference:true,filter:s=>!s.includes('/node_modules/',chartSource.length)});
 const chartManifest=JSON.parse(readFileSync(join(chart,'package.json'),'utf8'));delete chartManifest.devDependencies;delete chartManifest.scripts;
 writeFileSync(join(chart,'package.json'),JSON.stringify(chartManifest,null,2));
 mkdirSync(join(root,'vendor'));
 const vendored={'@bloxwap/hig-react':reactTarball,'@bloxwap/hig-tokens':tarball('tokens'),'@bloxwap/hig-contracts':tarball('contracts'),...(withChart?{'@bloxwap/hig-chart':tarball('chart')}:{})};
 const dependencies={'@bloxwap/chart':chartVersion,react:'19.2.0','react-dom':'19.2.0'};
 for(const [pkg,file] of Object.entries(vendored)){const target=join(root,'vendor',`${pkg.slice(1).replace('/','-')}.tgz`);cpSync(file,target);dependencies[pkg]=`file:../../${relative(root,target)}`;}
 mkdirSync(join(root,'apps/docs'),{recursive:true});
 writeFileSync(join(root,'apps/docs/package.json'),JSON.stringify({name:'@bloxwap/chart-docs',version:'0.3.0',private:true,type:'module',dependencies},null,2));
 return root;
}

let client;
const npm=(root,args)=>execFileSync(client.command[0],[...client.command.slice(1),...args,'--ignore-scripts','--no-audit','--no-fund'],{cwd:root,env,stdio:'pipe',encoding:'utf8'});
function inspect(root){
 const lock=JSON.parse(readFileSync(join(root,'package-lock.json'),'utf8'));
 const workspace=lock.packages['packages/chart']??null,link=lock.packages['node_modules/@bloxwap/chart']??null;
 const copies=Object.keys(lock.packages).filter(k=>/(?:^|\/)node_modules\/@bloxwap\/chart$/.test(k));
 const linked=existsSync(join(root,'node_modules/@bloxwap/chart'))&&realpathSync(join(root,'node_modules/@bloxwap/chart'))===realpathSync(join(root,'packages/chart'));
 return {workspaceInLock:Boolean(workspace&&workspace.name==='@bloxwap/chart'&&workspace.version===chartVersion),link,lockCopies:copies,nodeModulesLink:linked};
}
function assertKept(root,label){
 const state=inspect(root);
 assert.ok(state.workspaceInLock,`${label}: package-lock.json lost the packages/chart workspace`);
 assert.deepEqual(state.link,{resolved:'packages/chart',link:true},`${label}: node_modules/@bloxwap/chart is not the workspace link`);
 assert.deepEqual(state.lockCopies,['node_modules/@bloxwap/chart'],`${label}: extra @bloxwap/chart copies in the lockfile: ${state.lockCopies}`);
 assert.ok(state.nodeModulesLink,`${label}: node_modules/@bloxwap/chart does not point at packages/chart`);
 // npm ls exits non-zero on missing, invalid or extraneous edges.
 const tree=JSON.parse(npm(root,['ls','@bloxwap/chart','--all','--json']));
 const app=tree.dependencies?.['@bloxwap/chart-docs'];assert.ok(app,`${label}: npm ls does not list the apps/docs workspace`);
 assert.match(tree.dependencies?.['@bloxwap/chart']?.resolved??'',/^file:(?:\.\.\/)*packages\/chart$/,`${label}: npm ls does not resolve @bloxwap/chart to the workspace`);
 assert.equal(app.dependencies?.['@bloxwap/chart']?.version,chartVersion,`${label}: npm ls shows apps/docs without @bloxwap/chart`);
 return state;
}
async function assertApp(root,label,withChart){
 const app=join(root,'apps/docs');
 // Node resolution from the app lands in the workspace, not a registry copy.
 writeFileSync(join(app,'resolve.mjs'),"import {fileURLToPath} from 'node:url';import {realpathSync} from 'node:fs';console.log(JSON.stringify(['@bloxwap/chart','@bloxwap/chart/react'].map(s=>realpathSync(fileURLToPath(import.meta.resolve(s))))));");
 const resolved=JSON.parse(execFileSync(process.execPath,['resolve.mjs'],{cwd:app,encoding:'utf8'}));
 for(const file of resolved)assert.ok(file.startsWith(realpathSync(join(root,'packages/chart'))+'/'),`${label}: app resolved ${file} outside packages/chart`);
 if(!withChart)return {resolved:resolved.map(f=>relative(realpathSync(root),f))};
 // One hig-react instance: the host's HIGProvider messages reach the adapter's Suspense fallback.
 writeFileSync(join(app,'ssr.mjs'),"import React from 'react';import {renderToString} from 'react-dom/server';import {HIGProvider} from '@bloxwap/hig-react/provider';import {PriceChart} from '@bloxwap/hig-chart';const h=React.createElement;const html=renderToString(h(HIGProvider,{messages:{loadingChart:'Diagramm wird geladen'}},h(PriceChart,{summary:'BTC up 1% today',data:[]})));for(const text of ['<figcaption>BTC up 1% today</figcaption>','Diagramm wird geladen'])if(!html.includes(text))throw Error('PriceChart SSR missing '+text+': '+html);");
 execFileSync(process.execPath,['ssr.mjs'],{cwd:app,stdio:'inherit'});
 // A browser bundle of the adapter resolves its lazy @bloxwap/chart/react import to the same workspace file as the app.
 const result=await build({stdin:{contents:"export {PriceChart} from '@bloxwap/hig-chart';export {Chart} from '@bloxwap/chart/react';",resolveDir:app,sourcefile:'entry.js'},absWorkingDir:root,bundle:true,write:false,metafile:true,format:'esm',platform:'browser',logLevel:'silent'});
 const inputs=Object.keys(result.metafile.inputs),adapter=inputs.find(p=>/hig-chart\/dist\/index\.js$/.test(p));
 assert.ok(adapter,`${label}: bundle has no @bloxwap/hig-chart input`);
 const lazy=result.metafile.inputs[adapter].imports.filter(i=>i.original==='@bloxwap/chart/react').map(i=>i.path);
 assert.deepEqual(lazy,['packages/chart/dist/react/index.js'],`${label}: hig-chart's @bloxwap/chart/react resolved to ${lazy}`);
 const chartInputs=inputs.filter(p=>p.includes('@bloxwap/chart')||p.includes('bloxwap-chart'));
 assert.deepEqual(chartInputs,[],`${label}: bundle pulled a non-workspace @bloxwap/chart: ${chartInputs}`);
 return {resolved:resolved.map(f=>relative(realpathSync(root),f)),ssr:'PriceChart summary and host-localized fallback',bundleLazyImport:lazy[0]};
}

const scratch=mkdtempSync(join(tmpdir(),'hig-chart-workspace-tools-'));
const legacyTarball=legacyReactTarball(scratch);
const runs=[];
for(client of npmClients(scratch)){
 const scenarios=[];
 for(const [name,withChart] of [['react-only',false],['react-and-chart',true]]){
  const label=`npm ${client.version} ${name}`;
  const root=host(name,{withChart});
  assert.equal(existsSync(join(root,'package-lock.json')),false);
  npm(root,['install']);
  const fresh=assertKept(root,`${label} fresh lockfile`);const app=await assertApp(root,label,withChart);
  const lock=readFileSync(join(root,'package-lock.json'));
  rmSync(join(root,'node_modules'),{recursive:true,force:true});rmSync(join(root,'apps/docs/node_modules'),{recursive:true,force:true});
  npm(root,['ci']);assertKept(root,`${label} npm ci`);await assertApp(root,`${label} npm ci`,withChart);
  npm(root,['install']);assert.ok(readFileSync(join(root,'package-lock.json')).equals(lock),`${label}: a second npm install rewrote the lockfile`);
  scenarios.push({name,app:withChart?['@bloxwap/hig-react','@bloxwap/hig-tokens','@bloxwap/hig-contracts','@bloxwap/hig-chart']:['@bloxwap/hig-react','@bloxwap/hig-tokens','@bloxwap/hig-contracts'],freshLockfile:fresh,npmCi:'workspace link kept',reinstall:'lockfile byte-identical',...app});
  rmSync(root,{recursive:true,force:true});
 }
 const legacyRoot=host('legacy-control',{withChart:false,reactTarball:legacyTarball});
 npm(legacyRoot,['install']);
 const legacy=inspect(legacyRoot);
 const control={name:'legacy-control',hig:'hig-react repacked with the pre-#96 optional @bloxwap/chart peer',workspaceDropped:!legacy.workspaceInLock||!legacy.nodeModulesLink,...legacy};
 rmSync(legacyRoot,{recursive:true,force:true});
 if(!control.workspaceDropped)console.warn(`legacy-control: npm ${client.version} no longer drops the workspace with an optional peer; the regression checks still hold`);
 runs.push({npm:client.version,source:client.source,scenarios,control});
}
rmSync(scratch,{recursive:true,force:true});
assert.ok(runs.some(r=>r.npm===pinnedNpm),`no run used the pinned npm ${pinnedNpm}`);

const evidence={version:'0.1.0',issue:'bloxwap/hig#96',evidence:'automated (local tarballs, clean temporary npm workspaces); no publication',platform:`${process.platform} ${process.arch}`,node:process.version,
 host:{shape:'npm workspace like bloxwap/chart: packages/chart provides @bloxwap/chart, apps/docs depends on it by version and on HIG tarballs through file: specs',chart:`@bloxwap/chart ${chartVersion} (published build copied into packages/chart)`,install:'rm package-lock.json + node_modules; npm install with legacy-peer-deps=false, strict-peer-deps=true; then npm ci; then npm install (no lockfile change)'},
 runs};
writeFileSync('evidence/packed-chart-workspace-smoke.json',JSON.stringify(evidence,null,2)+'\n');
for(const run of runs)console.log(`Packed chart-shaped workspace, npm ${run.npm} (${run.source}): ${run.scenarios.map(s=>s.name).join(', ')} keep packages/chart linked after a from-scratch strict-peer lockfile, npm ci and reinstall; legacy optional peer ${run.control.workspaceDropped?'still drops':'no longer drops'} the workspace`);
