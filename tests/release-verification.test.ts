import {it,expect} from 'vitest';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
// @ts-expect-error Executable release verifier.
import {verifyReleaseArtifacts,releasePackages,releaseGateIds} from '../scripts/verify-release.mjs';

it('rejects blockers, wrong commits, missing packages, path changes and tampered release bytes before publication',()=>{
 const directory=mkdtempSync(join(tmpdir(),'hig-release-verification-'));
 try{
  const artifacts=(releasePackages as string[]).map(name=>{
   const file=`bloxwap-${name.slice('@bloxwap/'.length)}-0.1.0.tgz`;const bytes=Buffer.from(name);
   writeFileSync(join(directory,file),bytes);return {package:name,file,version:'0.1.0',sha256:createHash('sha256').update(bytes).digest('hex')};
  });
  const blockers=(releaseGateIds as string[]).map(id=>({id,status:'cleared'}));
  const withPhysicalGate=(gate:object)=>({...report,blockers:report.blockers.map(blocker=>blocker.id==='physical-devices'?{...blocker,...gate}:blocker)});
  const report={dryRun:true,channel:'stable-simulation',published:false,tagsCreated:false,releasesCreated:false,sourceCommit:'a'.repeat(40),sourceVersion:'0.1.0',artifactVersion:'0.1.0',blockers,artifacts};
  const options={directory,sourceCommit:'a'.repeat(40),sourceVersion:'0.1.0',tag:'v0.1.0',today:'2026-10-16'};
  expect(verifyReleaseArtifacts(report,options)).toHaveLength(8);
  expect(()=>verifyReleaseArtifacts(withPhysicalGate({status:'blocked'}),options)).toThrow('Release gates remain');
  expect(()=>verifyReleaseArtifacts({...report,blockers:blockers.slice(1)},options)).toThrow('All six release gates');
  expect(()=>verifyReleaseArtifacts({...report,sourceCommit:'b'.repeat(40)},options)).toThrow('immutable release tag');
  expect(()=>verifyReleaseArtifacts({...report,artifacts:artifacts.slice(1)},options)).toThrow('complete approved package set');
  expect(()=>verifyReleaseArtifacts({...report,artifacts:[{...artifacts[0],file:'../outside.tgz'},...artifacts.slice(1)]},options)).toThrow('expected tarball filename');
  expect(()=>verifyReleaseArtifacts({...report,artifacts:[{...artifacts[0],file:'hig-contracts-0.1.0.tgz'},...artifacts.slice(1)]},options)).toThrow('expected tarball filename');
  const exception={status:'approved-exception',approvedBy:'owner',approval:'https://github.com/bloxwap/hig/issues/55#issuecomment-1',reviewBy:'2026-10-17'};
  expect(verifyReleaseArtifacts(withPhysicalGate(exception),options)).toHaveLength(8);
  for(const reviewBy of ['2026-10-15','tomorrow','2026-99-99','2026-02-30'])expect(()=>verifyReleaseArtifacts(withPhysicalGate({...exception,reviewBy}),options)).toThrow('Release gates remain');
  writeFileSync(join(directory,artifacts[0].file),'changed');expect(()=>verifyReleaseArtifacts(report,options)).toThrow('tarball hash mismatch');
 }finally{rmSync(directory,{recursive:true,force:true});}
});
