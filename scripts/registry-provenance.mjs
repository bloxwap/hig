import assert from 'node:assert/strict';

// A resumed release may include legacy versions published before OIDC was enabled.
export async function verifyRegistryProvenance(dist,artifact,sourceCommit,required,fetchAttestation=fetch){
 if(!required)return null;
 assert(dist.attestations?.url,`${artifact.package}: provenance attestation is present`);
 const response=await fetchAttestation(dist.attestations.url);
 assert(response.ok,`${artifact.package}: provenance attestation is available`);
 const payloads=[];
 function collect(node){
  if(!node||typeof node!=='object')return;
  for(const [key,value] of Object.entries(node)){
   if(key==='payload'&&typeof value==='string')payloads.push(Buffer.from(value,'base64').toString('utf8'));
   else collect(value);
  }
 }
 collect(await response.json());
 assert(payloads.some(payload=>payload.includes(sourceCommit)&&payload.includes('github.com/bloxwap/hig')),`${artifact.package}: provenance references this source commit`);
 return dist.attestations.url;
}
