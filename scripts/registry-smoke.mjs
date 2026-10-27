import assert from 'node:assert/strict';
import {requiresRegistryProvenance,verifyRegistryProvenance} from './registry-provenance.mjs';
import {readFileSync,writeFileSync,rmSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {scratchDir} from './scratch.mjs';
import {readRegistryDist} from './registry-metadata.mjs';

const report=JSON.parse(readFileSync('artifacts/release-stable-simulation/report.json','utf8'));
const version=report.artifactVersion;
assert.equal(version,JSON.parse(readFileSync('package.json','utf8')).version);
// The workflow supplies an explicit (possibly empty) manifest of successful publishes.
const published=new Set(process.env.HIG_PROVENANCE_PACKAGES_FILE
 ?readFileSync(process.env.HIG_PROVENANCE_PACKAGES_FILE,'utf8').split(/\r?\n/).filter(Boolean)
 :[]);
for(const spec of published)assert(report.artifacts.some(artifact=>spec===`${artifact.package}@${version}`),`Unknown published package: ${spec}`);
const results=[];
const provenanceRequired=[];
for(const artifact of report.artifacts){
 const dist=await readRegistryDist(artifact.package,version);
 const response=await fetch(dist.tarball);assert(response.ok,`${artifact.package}: registry tarball is available`);
 const bytes=Buffer.from(await response.arrayBuffer());
 const hash=createHash('sha256').update(bytes).digest('hex');
 assert.equal(hash,artifact.sha256,`${artifact.package}: registry bytes match the reviewed artifact`);
 const required=requiresRegistryProvenance(artifact,report.sourceCommit);
 if(required)provenanceRequired.push(`${artifact.package}@${version}`);
 const provenance=await verifyRegistryProvenance(dist,{...artifact,sha512:createHash('sha512').update(bytes).digest('hex')},report.sourceCommit,required);
 results.push({package:artifact.package,version,sha256:hash,provenance});
}
// Use npm's maintained Sigstore verifier for the actual downloaded release set.
// Peers are irrelevant to signature validation; independent consumer smokes below
// install their full web/native dependency graphs.
const signaturesDir=scratchDir('hig-registry-signatures-');
try{
 writeFileSync(join(signaturesDir,'package.json'),JSON.stringify({private:true,dependencies:Object.fromEntries(report.artifacts.map(artifact=>[artifact.package,version]))}));
 execFileSync('npm',['install','--ignore-scripts','--legacy-peer-deps','--no-audit','--no-fund'],{cwd:signaturesDir,stdio:'inherit'});
 execFileSync('npm',['audit','signatures'],{cwd:signaturesDir,stdio:'inherit'});
}finally{rmSync(signaturesDir,{recursive:true,force:true});}
const env={...process.env,HIG_REGISTRY_VERSION:version};
for(const [script,args] of [['packed-smoke',[]],['packed-next-smoke',[]],['packed-native-smoke',['--profile','rn-0.81']],['packed-native-smoke',['--profile','rn-0.83']]]){
 execFileSync(process.execPath,[`scripts/${script}.mjs`,...args],{stdio:'inherit',env});
}
writeFileSync('evidence/registry-install.json',JSON.stringify({kind:'registry consumer validation',sourceCommit:report.sourceCommit,version,results,published:[...published],provenanceRequired,checks:['registry tarball SHA-256 equality','npm registry signatures and provenance signature validation','web/SSR','Next production hydration/font binding','RN 0.81 and RN 0.83 Metro/Expo exports'],physicalDevices:'not observed by these checks'},null,2)+'\n');
console.log(`Registry consumers: ${results.length} package hashes, ${provenanceRequired.length} provenance attestations and web/Next/native consumers passed`);
