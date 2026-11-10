import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,rmSync,readdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {cueDirectory,cueNames,installedVersion,noiseSeed,renderCues,measureCue,compareCue} from './cue-utils.mjs';

export function checkCueManifest(manifest){
 assert.deepEqual(manifest.cues.map(c=>c.name).sort(),[...cueNames].sort(),'Preset and manifest cue names must match exactly');
 assert.equal(manifest.noiseSeed,noiseSeed,'Offline noise seed changed; run npm run generate:cues');
 assert.ok(Array.isArray(manifest.flags),'Manifest must record exporter flags');
 for(const cue of manifest.cues){
  assert.equal(cue.package,'@bloxwap/sfx');
  assert.equal(cue.packageVersion,installedVersion,'sfx version changed; run npm run generate:cues');
  assert.equal(cue.recipe,cue.name);
  assert.equal(cue.file,`${cue.name}.wav`);
 }
}
export function checkCues(){
 const manifest=JSON.parse(readFileSync(`${cueDirectory}/manifest.json`,'utf8'));
 checkCueManifest(manifest);
 assert.deepEqual(readdirSync(cueDirectory).filter(f=>f.endsWith('.wav')).sort(),manifest.cues.map(c=>c.file).sort(),'Native WAV files must match the manifest');
 // Keep temporary renders in the worktree and always remove them.
 const temporary=mkdtempSync('.cue-parity-');
 try{
  renderCues(temporary,manifest.cues.map(c=>c.recipe),manifest.flags);
  for(const cue of manifest.cues){
   const committed=measureCue(`${cueDirectory}/${cue.file}`);
   assert.equal(committed.sha256,cue.sha256,`Native cue artifact drift: ${cue.file}`);
   assert.equal(committed.bytes,cue.bytes);
   compareCue(cue,committed,{durationMs:0,peakDbFS:0,rmsDbFS:0});
   compareCue(cue,measureCue(`${temporary}/${cue.file}`));
  }
 }finally{rmSync(temporary,{recursive:true,force:true});}
 return manifest.cues.length;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(`Native/web cue parity passed: ${checkCues()} cues`);
