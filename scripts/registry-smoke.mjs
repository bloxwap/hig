import assert from 'node:assert/strict';
import {verifyRegistryProvenance} from './registry-provenance.mjs';
import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

const report=JSON.parse(readFileSync('artifacts/release-stable-simulation/report.json','utf8'));
const version=report.artifactVersion;
assert.equal(version,JSON.parse(readFileSync('package.json','utf8')).version);
// The workflow supplies an explicit (possibly empty) manifest of successful publishes.
const published=new Set(process.env.HIG_PROVENANCE_PACKAGES_FILE
 ?readFileSync(process.env.HIG_PROVENANCE_PACKAGES_FILE,'utf8').split(/\r?\n/).filter(Boolean)
 :[]);
for(const spec of published)assert(report.artifacts.some(artifact=>spec===`${artifact.package}@${version}`),`Unknown published package: ${spec}`);
const results=[];
for(const artifact of report.artifacts){
 const dist=JSON.parse(execFileSync('npm',['view',`${artifact.package}@${version}`,'dist','--json'],{encoding:'utf8'}));
 const response=await fetch(dist.tarball);assert(response.ok,`${artifact.package}: registry tarball is available`);
 const hash=createHash('sha256').update(Buffer.from(await response.arrayBuffer())).digest('hex');
 assert.equal(hash,artifact.sha256,`${artifact.package}: registry bytes match the reviewed artifact`);
 const provenance=await verifyRegistryProvenance(dist,artifact,report.sourceCommit,published.has(`${artifact.package}@${version}`));
 results.push({package:artifact.package,version,sha256:hash,provenance});
}
const env={...process.env,HIG_REGISTRY_VERSION:version};
for(const [script,args] of [['packed-smoke',[]],['packed-next-smoke',[]],['packed-native-smoke',['--profile','rn-0.81']],['packed-native-smoke',['--profile','rn-0.83']]]){
 execFileSync(process.execPath,[`scripts/${script}.mjs`,...args],{stdio:'inherit',env});
}
writeFileSync('evidence/registry-install.json',JSON.stringify({kind:'registry consumer validation',sourceCommit:report.sourceCommit,version,results,provenanceRequired:[...published],checks:['registry tarball SHA-256 equality','web/SSR','Next production hydration/font binding','RN 0.81 and RN 0.83 Metro/Expo exports'],physicalDevices:'not observed by these checks'},null,2)+'\n');
console.log(`Registry consumers: ${results.length} package hashes, ${published.size} provenance attestations and web/Next/native consumers passed`);
