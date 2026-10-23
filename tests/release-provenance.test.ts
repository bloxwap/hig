import {it,expect} from 'vitest';
// @ts-expect-error Executable registry provenance verifier.
import {verifyRegistryProvenance} from '../scripts/registry-provenance.mjs';

it('requires source-linked attestations for new publishes while allowing skipped legacy versions',async()=>{
 const artifact={package:'@bloxwap/hig-react'};
 const commit='a'.repeat(40);
 const dist={attestations:{url:'https://registry.example/attestations'}};
 const response=(payload:string)=>async()=>({ok:true,json:async()=>({attestations:[{bundle:{dsseEnvelope:{payload:Buffer.from(payload).toString('base64')}}}]})});
 await expect(verifyRegistryProvenance({},artifact,commit,false)).resolves.toBeNull();
 await expect(verifyRegistryProvenance({},artifact,commit,true)).rejects.toThrow('attestation is present');
 await expect(verifyRegistryProvenance(dist,artifact,commit,true,async()=>({ok:false}))).rejects.toThrow('attestation is available');
 for(const payload of ['',`github.com/other/repo ${commit}`,`github.com/bloxwap/hig ${'b'.repeat(40)}`]){
  await expect(verifyRegistryProvenance(dist,artifact,commit,true,response(payload))).rejects.toThrow('references this source commit');
 }
 await expect(verifyRegistryProvenance(dist,artifact,commit,true,response(`github.com/bloxwap/hig ${commit}`))).resolves.toBe(dist.attestations.url);
});
