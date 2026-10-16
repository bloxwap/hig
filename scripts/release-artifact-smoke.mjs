import {execFileSync} from 'node:child_process';
import {mkdtempSync,readFileSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import assert from 'node:assert/strict';
const channel=process.argv[2]??'candidate';if(!['candidate','stable-simulation'].includes(channel))throw Error('Only local dry-run channels are supported');
const artifactDirectory=resolve(`artifacts/release-${channel}`);const report=JSON.parse(readFileSync(join(artifactDirectory,'report.json')));
assert.equal(report.dryRun,true);assert.equal(report.published,false);assert.equal(report.tagsCreated,false);assert.equal(report.releasesCreated,false);
const directory=mkdtempSync(join(tmpdir(),'hig-release-smoke-'));writeFileSync(join(directory,'package.json'),JSON.stringify({private:true,type:'module'}));
const packages=report.artifacts.filter(p=>p.package!=='@bloxwap/hig-native');
execFileSync('npm',['install','--ignore-scripts','--no-audit','--no-fund',...packages.map(p=>join(artifactDirectory,p.file)),'react@19.1.0','react-dom@19.1.0','@bloxwap/chart@0.3.0'],{cwd:directory,stdio:'pipe'});
for(const artifact of packages){const manifest=JSON.parse(readFileSync(join(directory,'node_modules',artifact.package,'package.json')));assert.equal(manifest.version,report.artifactVersion);for(const field of ['dependencies','peerDependencies'])for(const [name,version] of Object.entries(manifest[field]??{}))if(name.startsWith('@bloxwap/hig-'))assert.equal(version,report.artifactVersion);}
writeFileSync(join(directory,'smoke.mjs'),"import React from 'react';import {renderToString} from 'react-dom/server';import {Button} from '@bloxwap/hig-react/button';import {FeedbackController} from '@bloxwap/hig-feedback';import {PriceChart} from '@bloxwap/hig-chart';new FeedbackController().dispose();if(!renderToString(React.createElement(Button,null,'Review')).includes('Review'))throw Error('Packed release SSR failed');if(!renderToString(React.createElement(PriceChart,{summary:'BTC summary',data:[]})).includes('BTC summary'))throw Error('Packed release hig-chart SSR failed');");
execFileSync(process.execPath,[join(directory,'smoke.mjs')],{cwd:directory,stdio:'inherit'});
writeFileSync(`evidence/m5-${channel}-install.json`,JSON.stringify({channel,sourceCommit:report.sourceCommit,version:report.artifactVersion,packages:packages.map(p=>p.package),install:'clean temporary consumer',internalVersions:'matched',ssr:'passed',feedbackRoot:'passed',native:'Exact runtime separately verified in clean stable-version packed Metro consumer; no physical output claim',published:false,tagsCreated:false,releasesCreated:false},null,2)+'\n');
console.log(`${channel}: clean installed ${packages.length} staged artifacts, matching versions and SSR/feedback passed`);
