import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';

function isNotYetVisible(error){
 if(error?.status!==1||error.signal)return false;
 try{return JSON.parse(String(error.stdout)).error?.code==='E404';}catch{return false;}
}

/** Newly published exact versions can briefly return E404 while registry metadata propagates. */
export async function readRegistryDist(name,version,{exec=execFileSync,wait=delay,onRetry=console.warn,maxAttempts=31,retryDelayMs=10000}={}){
 assert.match(version,/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/,'Registry verification requires an exact package version');
 assert(Number.isInteger(maxAttempts)&&maxAttempts>0,'maxAttempts must be a positive integer');
 assert(Number.isFinite(retryDelayMs)&&retryDelayMs>=0,'retryDelayMs must be nonnegative');
 const specifier=`${name}@${version}`;
 for(let attempt=1;;attempt++){
  let output;
  try{output=exec('npm',['view',specifier,'dist','--json'],{encoding:'utf8',stdio:['ignore','pipe','pipe'],timeout:15000});}
  catch(error){
   if(!isNotYetVisible(error)||attempt===maxAttempts)throw error;
   onRetry(`${specifier}: metadata returned E404; retrying in ${retryDelayMs} ms (${attempt}/${maxAttempts}).`);
   await wait(retryDelayMs);
   continue;
  }
  return JSON.parse(output);
 }
}
