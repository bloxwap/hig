import {readFileSync} from 'node:fs';
import {expect,it,expectTypeOf} from 'vitest';
import {presets} from '../packages/hig/feedback/src/contract';
import type {CueAssets} from '../packages/hig/feedback/src/native';
// @ts-expect-error Node-only build tooling is plain JavaScript.
import {checkCues,checkCueManifest} from '../scripts/check-cues.mjs';
// @ts-expect-error Node-only build tooling is plain JavaScript.
import {compareCue,tolerances} from '../scripts/cue-utils.mjs';

it('keeps CueAssets keys derived from the semantic preset sounds',()=>{
 expectTypeOf<keyof CueAssets>().toEqualTypeOf<NonNullable<(typeof presets)[keyof typeof presets]['sound']>>();
 const manifest=JSON.parse(readFileSync('packages/hig/feedback/assets/manifest.json','utf8'));
 checkCueManifest(manifest);
});
it('keeps committed native WAVs equivalent to the installed web recipes',()=>{
 expect(checkCues()).toBeGreaterThan(0);
},90000);
it('rejects stale exporter versions and missing or extra cues',()=>{
 const manifest=JSON.parse(readFileSync('packages/hig/feedback/assets/manifest.json','utf8'));
 const stale=structuredClone(manifest);stale.cues[0].packageVersion='0.0.0';
 expect(()=>checkCueManifest(stale)).toThrow(/version changed/);
 expect(()=>checkCueManifest({...manifest,cues:manifest.cues.slice(1)})).toThrow(/cue names/);
 expect(()=>checkCueManifest({...manifest,cues:[...manifest.cues,{name:'warning'}]})).toThrow(/cue names/);
});
it.each(['durationMs','peakDbFS','rmsDbFS'])('rejects retuned %s beyond tolerance',metric=>{
 const cue=JSON.parse(readFileSync('packages/hig/feedback/assets/manifest.json','utf8')).cues[0];
 expect(()=>compareCue(cue,{...cue,[metric]:cue[metric]+tolerances[metric]+0.1})).toThrow(new RegExp(metric));
 expect(()=>compareCue(cue,{...cue,[metric]:NaN})).toThrow(new RegExp(metric));
});
