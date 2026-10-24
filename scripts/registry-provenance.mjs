import assert from 'node:assert/strict';

const repository='https://github.com/bloxwap/hig';
const predicateType='https://slsa.dev/provenance/v1';
// Only this recorded token-published release predates trusted publishing. A skipped
// package in a resumed release still requires provenance for every later version.
export function requiresRegistryProvenance(artifact,sourceCommit){
 return !(artifact.version==='0.1.0'&&sourceCommit==='bdf8d07014fea5e69ea51a061b82707661a9d701');
}

// npm audit signatures verifies the signature/certificate/transparency bundle in
// registry-smoke.mjs. Here we bind that statement to this exact reviewed artifact.
export async function verifyRegistryProvenance(dist,artifact,sourceCommit,required,fetchAttestation=fetch){
 if(!required)return null;
 assert(dist.attestations?.url,`${artifact.package}: provenance attestation is present`);
 const response=await fetchAttestation(dist.attestations.url);
 assert(response.ok,`${artifact.package}: provenance attestation is available`);
 const attestations=(await response.json()).attestations;
 assert(Array.isArray(attestations),`${artifact.package}: registry attestations are present`);
 const matched=attestations.some(attestation=>{
  if(attestation.predicateType!==predicateType)return false;
  const envelope=attestation.bundle?.dsseEnvelope;
  if(envelope?.payloadType!=='application/vnd.in-toto+json'||typeof envelope.payload!=='string')return false;
  let statement;
  try{statement=JSON.parse(Buffer.from(envelope.payload,'base64').toString('utf8'));}catch{return false;}
  const definition=statement.predicate?.buildDefinition;
  const workflow=definition?.externalParameters?.workflow;
  const ref=`refs/tags/v${artifact.version}`;
  return statement._type==='https://in-toto.io/Statement/v1'
   &&statement.predicateType===predicateType
   &&definition?.buildType==='https://slsa-framework.github.io/github-actions-buildtypes/workflow/v1'
   &&workflow?.repository===repository&&workflow.path==='.github/workflows/publish.yml'&&workflow.ref===ref
   &&definition.resolvedDependencies?.some(dependency=>dependency.uri===`git+${repository}@${ref}`&&dependency.digest?.gitCommit===sourceCommit)
   &&statement.subject?.some(subject=>subject.name===`pkg:npm/${artifact.package.replace('@','%40')}@${artifact.version}`&&subject.digest?.sha512===artifact.sha512);
 });
 assert(matched,`${artifact.package}: provenance matches the release source, workflow, package and tarball digest`);
 return dist.attestations.url;
}
