import {execFileSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,realpathSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import assert from 'node:assert/strict';

const directory=mkdtempSync(join(tmpdir(),'hig-chart-workspace-'));
const packDirectory=join(directory,'tarballs');mkdirSync(packDirectory);
const dependencies={};
for(const name of ['tokens','contracts','react']){
 const [packed]=JSON.parse(execFileSync('npm',['pack',`./packages/${name}`,'--ignore-scripts','--json','--pack-destination',packDirectory],{encoding:'utf8'}));
 dependencies[`@bloxwap/hig-${name}`]=`file:${join(packDirectory,packed.filename)}`;
}
mkdirSync(join(directory,'apps/docs'),{recursive:true});mkdirSync(join(directory,'packages/chart'),{recursive:true});
writeFileSync(join(directory,'package.json'),JSON.stringify({private:true,workspaces:['apps/*','packages/*'],dependencies:{react:'19.2.0','react-dom':'19.2.0'}}));
writeFileSync(join(directory,'packages/chart/package.json'),JSON.stringify({name:'@bloxwap/chart',version:'0.3.0',type:'module',exports:'./index.js'}));
writeFileSync(join(directory,'packages/chart/index.js'),"export const workspaceIdentity='local-chart';\n");
writeFileSync(join(directory,'apps/docs/package.json'),JSON.stringify({name:'chart-docs',private:true,type:'module',dependencies:{...dependencies,'@bloxwap/chart':'*'}}));
const args=['--strict-peer-deps','--ignore-scripts','--no-audit','--no-fund'];
execFileSync('npm',['install',...args],{cwd:directory,stdio:'pipe'});
const lock=JSON.parse(readFileSync(join(directory,'package-lock.json'),'utf8'));
assert.equal(lock.packages['node_modules/@bloxwap/chart'].link,true);
assert.equal(realpathSync(join(directory,'node_modules/@bloxwap/chart')),realpathSync(join(directory,'packages/chart')));
execFileSync('npm',['ci',...args],{cwd:directory,stdio:'pipe'});
writeFileSync(join(directory,'apps/docs/smoke.mjs'),"import assert from 'node:assert/strict';import React from 'react';import {renderToString} from 'react-dom/server';import {workspaceIdentity} from '@bloxwap/chart';import {Button} from '@bloxwap/hig-react/button';assert.equal(workspaceIdentity,'local-chart');assert.match(renderToString(React.createElement(Button,null,'Review')),/Review/);\n");
execFileSync(process.execPath,[join(directory,'apps/docs/smoke.mjs')],{cwd:directory,stdio:'inherit'});
writeFileSync('evidence/packed-chart-workspace.json',JSON.stringify({issue:96,kind:'clean packed consumer',npm:execFileSync('npm',['--version'],{encoding:'utf8'}).trim(),checks:['fresh lockfile with strict peers and no legacy-peer-deps','chart workspace symlink retained','npm ci preserves workspace imports','HIG Button SSR'],chartAdapter:'explicit host dependency; no chart peer on the shared renderer'},null,2)+'\n');
console.log('Packed chart workspace: fresh strict-peer lockfile and npm ci preserve the local chart package');
