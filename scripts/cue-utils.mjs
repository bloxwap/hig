import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {presets} from '../packages/hig/feedback/src/presets.ts';

export const cueDirectory='packages/hig/feedback/assets';
export const cueNames=[...new Set(Object.values(presets).map(p=>p.sound).filter(Boolean))];
export const installedVersion=JSON.parse(readFileSync('node_modules/@bloxwap/sfx/package.json','utf8')).version;
export const noiseSeed='mulberry32:0x183';
export const exportFlags=['--sample-rate','48000','--bit-depth','16','--channels','1','--trim'];
// Allow stochastic noise and cross-platform rendering variation, but not audible retuning.
export const tolerances={durationMs:2,peakDbFS:0.75,rmsDbFS:0.75};
export function renderCues(directory,names,flags){
 execFileSync(process.execPath,['--import',resolve('scripts/cue-random.mjs'),resolve('node_modules/@bloxwap/sfx/dist/cli/sfx-wav.js'),'--out',directory,'--sounds',names.join(','),...flags],{stdio:'pipe',timeout:60000});
}
export function measureCue(file){
 const bytes=readFileSync(file);
 if(bytes.toString('ascii',0,4)!=='RIFF'||bytes.toString('ascii',8,12)!=='WAVE')throw Error(`Invalid WAV: ${file}`);
 let format,data;
 for(let i=12;i+8<=bytes.length;){
  const id=bytes.toString('ascii',i,i+4),size=bytes.readUInt32LE(i+4);
  if(i+8+size>bytes.length)throw Error(`Truncated WAV: ${file}`);
  if(id==='fmt '){
   if(size<16||bytes.readUInt16LE(i+8)!==1)throw Error(`Unsupported WAV encoding: ${file}`);
   format={channels:bytes.readUInt16LE(i+10),sampleRate:bytes.readUInt32LE(i+12),bitDepth:bytes.readUInt16LE(i+22)};
  }
  if(id==='data')data=bytes.subarray(i+8,i+8+size);
  i+=8+size+(size%2);
 }
 if(!format||!data?.length||format.bitDepth!==16||!format.channels||!format.sampleRate||data.length%(2*format.channels))throw Error(`Unsupported WAV: ${file}`);
 let peak=0,sum=0;
 for(let i=0;i<data.length;i+=2){const sample=data.readInt16LE(i)/32768;peak=Math.max(peak,Math.abs(sample));sum+=sample**2;}
 const durationMs=data.length/(format.channels*format.sampleRate*2)*1000;
 if(peak<=0||peak>=1||durationMs<10||durationMs>1500)throw Error(`Invalid envelope/peak: ${file}`);
 return {...format,durationMs:Number(durationMs.toFixed(2)),peakDbFS:Number((20*Math.log10(peak)).toFixed(2)),rmsDbFS:Number((10*Math.log10(sum/(data.length/2))).toFixed(2)),bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')};
}
export function compareCue(expected,actual,limits=tolerances){
 for(const key of ['channels','sampleRate','bitDepth'])if(actual[key]!==expected[key])throw Error(`${expected.name}: ${key} differs`);
 for(const [metric,tolerance] of Object.entries(limits)){
  if(!Number.isFinite(expected[metric])||!Number.isFinite(actual[metric])||Math.abs(actual[metric]-expected[metric])>tolerance)throw Error(`${expected.name}: ${metric} drift (${actual[metric]} vs ${expected[metric]}, tolerance ${tolerance}); run npm run generate:cues`);
 }
}
