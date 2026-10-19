import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

const report=JSON.parse(readFileSync('artifacts/release-stable-simulation/report.json','utf8'));
const version=report.artifactVersion;
assert.equal(version,JSON.parse(readFileSync('package.json','utf8')).version);
const results=[];
for(const artifact of report.artifacts){
 const dist=JSON.parse(execFileSync('npm',['view',`${artifact.package}@${version}`,'dist','--json'],{encoding:'utf8'}));
 const response=await fetch(dist.tarball);assert(response.ok,`${artifact.package}: registry tarball is available`);
 const hash=createHash('sha256').update(Buffer.from(await response.arrayBuffer())).digest('hex');
 assert.equal(hash,artifact.sha256,`${artifact.package}: registry bytes match the reviewed artifact`);
 assert(dist.attestations?.url,`${artifact.package}: provenance attestation is present`);
 const attestation=await fetch(dist.attestations.url);assert(attestation.ok);
 const payloads=[];
 function collect(node){if(!node||typeof node!=='object')return;for(const [key,value] of Object.entries(node)){if(key==='payload'&&typeof value==='string')payloads.push(Buffer.from(value,'base64').toString('utf8'));else collect(value);}}
 collect(await attestation.json());
 assert(payloads.some(payload=>payload.includes(report.sourceCommit)&&payload.includes('github.com/bloxwap/hig')),`${artifact.package}: provenance references this source commit`);
 results.push({package:artifact.package,version,sha256:hash,provenance:dist.attestations.url});
}
const env={...process.env,HIG_REGISTRY_VERSION:version};
for(const [script,args] of [['packed-smoke',[]],['packed-next-smoke',[]],['packed-native-smoke',['--profile','rn-0.81']],['packed-native-smoke',['--profile','rn-0.83']]]){
 execFileSync(process.execPath,[`scripts/${script}.mjs`,...args],{stdio:'inherit',env});
}
writeFileSync('evidence/registry-install.json',JSON.stringify({kind:'registry consumer validation',sourceCommit:report.sourceCommit,version,results,checks:['registry hashes and provenance','web/SSR','Next production hydration/font binding','RN 0.81 and RN 0.83 Metro/Expo exports'],physicalDevices:'not observed by these checks'},null,2)+'\n');
console.log(`Registry consumers: ${results.length} package hashes/provenance and web/Next/native consumers passed`);
