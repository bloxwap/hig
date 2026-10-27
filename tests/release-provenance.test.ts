import {it,expect} from 'vitest';
// @ts-expect-error Executable registry provenance verifier.
import {requiresRegistryProvenance,verifyRegistryProvenance} from '../scripts/registry-provenance.mjs';

const artifact={package:'@bloxwap/hig-react',version:'0.1.1',sha512:'c'.repeat(128)};
const commit='a'.repeat(40);
const dist={attestations:{url:'https://registry.example/attestations'}};
const predicateType='https://slsa.dev/provenance/v1';
function statement(){
 return {
  _type:'https://in-toto.io/Statement/v1',predicateType,
  subject:[{name:'pkg:npm/%40bloxwap/hig-react@0.1.1',digest:{sha512:artifact.sha512}}],
  predicate:{buildDefinition:{
   buildType:'https://slsa-framework.github.io/github-actions-buildtypes/workflow/v1',
   externalParameters:{workflow:{repository:'https://github.com/bloxwap/hig',path:'.github/workflows/publish.yml',ref:'refs/tags/v0.1.1'}},
   resolvedDependencies:[{uri:'git+https://github.com/bloxwap/hig@refs/tags/v0.1.1',digest:{gitCommit:commit}}]
  }}
 };
}
const response=(payload:unknown,kind=predicateType)=>async()=>({ok:true,json:async()=>({attestations:[{predicateType:kind,bundle:{dsseEnvelope:{payloadType:'application/vnd.in-toto+json',payload:Buffer.from(JSON.stringify(payload)).toString('base64')}}}]})});

it('exempts only the recorded token releases, including when a later publication is resumed',()=>{
 expect(requiresRegistryProvenance({...artifact,version:'0.1.0'},'bdf8d07014fea5e69ea51a061b82707661a9d701')).toBe(false);
 expect(requiresRegistryProvenance(artifact,'6f4dd060e0985be644d255154aa7a0277cdde27f')).toBe(false);
 expect(requiresRegistryProvenance({...artifact,version:'0.1.2'},'6f4dd060e0985be644d255154aa7a0277cdde27f')).toBe(true);
 expect(requiresRegistryProvenance({...artifact,version:'0.1.0'},commit)).toBe(true);
 expect(requiresRegistryProvenance(artifact,commit)).toBe(true);
});

it('requires available provenance and binds its source, workflow and subject to the reviewed artifact',async()=>{
 await expect(verifyRegistryProvenance({},artifact,commit,false)).resolves.toBeNull();
 await expect(verifyRegistryProvenance({},artifact,commit,true)).rejects.toThrow('attestation is present');
 await expect(verifyRegistryProvenance(dist,artifact,commit,true,async()=>({ok:false}))).rejects.toThrow('attestation is available');
 await expect(verifyRegistryProvenance(dist,artifact,commit,true,response(statement()))).resolves.toBe(dist.attestations.url);
 const invalid=[statement(),statement(),statement(),statement(),statement(),statement(),statement(),statement(),statement()];
 invalid[0].predicate.buildDefinition.externalParameters.workflow.repository='https://github.com/bloxwap/hig-impersonator';
 invalid[1].predicate.buildDefinition.resolvedDependencies[0].digest.gitCommit='b'.repeat(40);
 invalid[2].subject[0].name='pkg:npm/%40bloxwap/hig-native@0.1.1';
 invalid[3].subject[0].digest.sha512='d'.repeat(128);
 invalid[4].predicate.buildDefinition.externalParameters.workflow.path='.github/workflows/other.yml';
 invalid[5].predicate.buildDefinition.externalParameters.workflow.ref='refs/heads/main';
 invalid[6].predicate.buildDefinition.resolvedDependencies[0].uri='git+https://github.com/other/repo@refs/tags/v0.1.1';
 invalid[7].predicateType='https://example.com/other';
 invalid[8].predicate.buildDefinition.buildType='https://example.com/other';
 for(const payload of [...invalid,`github.com/bloxwap/hig ${commit}`,{note:`github.com/bloxwap/hig ${commit}`}]){
  await expect(verifyRegistryProvenance(dist,artifact,commit,true,response(payload))).rejects.toThrow('matches the release source');
 }
 await expect(verifyRegistryProvenance(dist,artifact,commit,true,response(statement(),'https://github.com/npm/attestation/tree/main/specs/publish/v0.1'))).rejects.toThrow('matches the release source');
});
