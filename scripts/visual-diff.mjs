import {PNG} from 'pngjs';
/** Ignore small antialias differences, but fail geometry and material pixel changes. */
export function compareVisual(actualBytes,baselineBytes,{channelTolerance=24,maxChangedRatio=.02}={}){
 const actual=PNG.sync.read(actualBytes),baseline=PNG.sync.read(baselineBytes);
 if(actual.width!==baseline.width||actual.height!==baseline.height)throw Error(`Visual geometry regression: ${actual.width}x${actual.height} versus ${baseline.width}x${baseline.height}`);
 let changed=0;
 for(let i=0;i<actual.data.length;i+=4)if([0,1,2,3].some(c=>Math.abs(actual.data[i+c]-baseline.data[i+c])>channelTolerance))changed++;
 const changedRatio=changed/(actual.width*actual.height);
 if(changedRatio>maxChangedRatio)throw Error(`Visual pixel regression: ${(changedRatio*100).toFixed(2)}% exceeds ${maxChangedRatio*100}%`);
 return {changedRatio,maxChangedRatio,channelTolerance};
}
