// HIG entries import each other through `@bloxwap/hig/<entry>` self-references that resolve to
// dist/, so build.mjs compiles every entry after the entries it imports (#182). The order is
// derived from the source imports; cycles, unknown entries and missing tsconfig.json files throw.
import {existsSync,readdirSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
import ts from 'typescript';
const sourceFile=/\.(?:[cm]?ts|tsx)$/;
const filesUnder=dir=>readdirSync(dir,{withFileTypes:true}).flatMap(d=>d.isDirectory()?filesUnder(join(dir,d.name)):sourceFile.test(d.name)?[join(dir,d.name)]:[]);
/** Every entry directory under packages/hig (has src/ or tsconfig.json, or is named by `exports`). */
export function higEntries(root='.'){
  const base=join(root,'packages/hig');
  const dirs=readdirSync(base,{withFileTypes:true}).filter(d=>d.isDirectory()&&(existsSync(join(base,d.name,'src'))||existsSync(join(base,d.name,'tsconfig.json')))).map(d=>d.name);
  const exported=Object.keys(JSON.parse(readFileSync(join(base,'package.json'),'utf8')).exports??{}).map(k=>k.split('/')[1]).filter(e=>e&&e!=='package.json');
  const entries=[...new Set([...dirs,...exported])].sort();
  const missing=entries.filter(e=>!existsSync(join(base,e,'tsconfig.json'))||!existsSync(join(base,e,'src')));
  if(missing.length)throw new Error(`HIG entries without packages/hig/<entry>/tsconfig.json or src/: ${missing.join(', ')}`);
  return entries;
}
/** entry -> sorted entries it imports through `@bloxwap/hig/<entry>`. */
export function entryGraph(root='.'){
  const entries=higEntries(root);const graph={};
  for(const entry of entries){
    const deps=new Set();
    for(const file of filesUnder(join(root,'packages/hig',entry,'src'))){
      for(const {fileName} of ts.preProcessFile(readFileSync(file,'utf8'),true,true).importedFiles){
        const match=/^@bloxwap\/hig\/([^/]+)/.exec(fileName);if(!match)continue;
        if(!entries.includes(match[1]))throw new Error(`${file} imports ${fileName}, but ${match[1]} is not a HIG entry`);
        deps.add(match[1]);
      }
    }
    graph[entry]=[...deps].sort();
  }
  return graph;
}
/** Dependency-first order of every entry in the graph; throws on a cycle (self-imports included). */
export function buildOrder(graph){
  const order=[];const state={};
  const visit=(entry,path)=>{
    if(state[entry]==='done')return;
    if(state[entry]==='active')throw new Error(`HIG entry import cycle: ${[...path.slice(path.indexOf(entry)),entry].join(' -> ')}`);
    if(!(entry in graph))throw new Error(`${path.at(-1)} imports unknown HIG entry ${entry}`);
    state[entry]='active';
    for(const dep of graph[entry])visit(dep,[...path,entry]);
    state[entry]='done';order.push(entry);
  };
  for(const entry of Object.keys(graph).sort())visit(entry,[]);
  return order;
}
/** Problems with a proposed order: entries missing or duplicated, or built before something they import. */
export function orderViolations(order,graph){
  const problems=[];const position=new Map(order.map((e,i)=>[e,i]));
  for(const entry of Object.keys(graph))if(!position.has(entry))problems.push(`${entry} is never built`);
  if(position.size!==order.length)problems.push('an entry is built twice');
  for(const entry of order){
    if(!(entry in graph)){problems.push(`${entry} is not a HIG entry`);continue;}
    for(const dep of graph[entry])if(!(position.get(dep)<position.get(entry)))problems.push(`${entry} is built before ${dep}, which it imports`);
  }
  return problems;
}
