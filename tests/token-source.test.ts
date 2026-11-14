import {describe,it,expect} from 'vitest';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,copyFileSync,existsSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
import {spawnSync} from 'node:child_process';
import source from '../packages/hig/tokens/source.json';

describe('token source validation (#187)',()=>{
 function generate(mutate:(tokens:{colors:Record<string,Record<string,unknown>>;density:Record<string,Record<string,number>>;motion:Record<string,unknown>;space:Record<string,unknown>})=>void){
  const cwd=mkdtempSync(join(tmpdir(),'hig-token-source-'));
  try{
   const dir=join(cwd,'packages/hig/tokens');
   mkdirSync(dir,{recursive:true});
   const tokens=structuredClone(source);mutate(tokens);
   writeFileSync(join(dir,'source.json'),JSON.stringify(tokens));
   copyFileSync('packages/hig/tokens/upstream-palette.json',join(dir,'upstream-palette.json'));
   const result=spawnSync(process.execPath,[resolve('scripts/generate.mjs')],{cwd,encoding:'utf8'});
   return {status:result.status,stderr:result.stderr,wroteOutput:existsSync(join(dir,'generated'))};
  }finally{rmSync(cwd,{recursive:true,force:true});}
 }
 it('accepts the current source, including srgb-only and oklch-only colours',()=>{
  expect(generate(tokens=>{delete tokens.colors.background.srgb;})).toMatchObject({status:0,wroteOutput:true});
 });
 it.each([{}, {p3:[0,1,0]}, {srgb:'',oklch:' '}, {srgb:123}])('rejects colours without a fallback: %j',color=>{
  expect(generate(tokens=>{tokens.colors.action=color;})).toMatchObject({status:1,stderr:expect.stringContaining('colors.action requires srgb or oklch'),wroteOutput:false});
 });
 it.each(['missing','extra','new mode'])('rejects mismatched density keys: %s',kind=>{
  expect(generate(tokens=>{
   if(kind==='missing')delete tokens.density.compact.gap;
   else if(kind==='extra')tokens.density.compact.extra=4;
   else tokens.density.dense={control:24};
  })).toMatchObject({status:1,stderr:expect.stringContaining('must have the same keys as density.comfortable'),wroteOutput:false});
 });
 for(const group of ['motion','space'] as const)it.each([0,-1,'12',null])(`rejects non-positive/non-numeric ${group}: %j`,value=>{
  expect(generate(tokens=>{tokens[group][Object.keys(tokens[group])[0]]=value;})).toMatchObject({status:1,stderr:expect.stringContaining('must be a positive finite number'),wroteOutput:false});
 });
});

describe('React density mirrors source tokens (#187)',()=>{
 const css=readFileSync('packages/hig/react/src/styles.css','utf8');
 for(const mode of ['comfortable','compact'] as const)it(`matches ${mode} control and gap in pixels`,()=>{
  const selector=mode==='comfortable'?':root':"[data-hig-density='compact']";
  const rule=css.slice(css.indexOf(selector)).split('}')[0];
  for(const metric of ['control','gap'] as const){
   const value=rule.match(new RegExp(`--hig-${metric}:\\s*([^;]+);`))?.[1];
   expect(value).toBe(`${source.density[mode][metric]}px`);
  }
 });
});
