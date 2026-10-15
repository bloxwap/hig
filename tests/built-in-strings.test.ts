import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
// @ts-expect-error Executable built-in string gate (plain ESM, no types).
import {findBuiltInStrings,scanPackages} from '../scripts/check-built-in-strings.mjs';
import {defaultMessages,messageKeys,resolveMessages,type HIGMessages} from '../packages/contracts/src/messages';
type Hit={file?:string;line:number;text:string;reason:string};
const scan=(source:string):Hit[]=>findBuiltInStrings(source,'probe.tsx');
const guide=readFileSync('docs/foundations/localization.md','utf8');
const profile=JSON.parse(readFileSync('docs/foundations/localization.json','utf8'));
const glossary=JSON.parse(readFileSync('docs/foundations/glossary.json','utf8'));
const english=(key:keyof HIGMessages):string=>{const value=defaultMessages[key] as unknown;return typeof value==='string'?value:'';};

describe('hard-coded built-in strings (#62)',()=>{
 it('React and React Native sources contain no user-visible or accessible literal',()=>{
  const hits:Hit[]=scanPackages();
  expect(hits.map(h=>`${h.file}:${h.line} ${h.reason}: ${h.text}`)).toEqual([]);
 });
 it.each([
  ['JSX text','export const A=()=><button>Close</button>;'],
  ['visible attribute','export const A=()=><nav aria-label=\'Pagination\'/>;'],
  ['native accessibility label','export const A=({m}:{m:string})=><View accessibilityLabel={`Dismiss ${m}`}/>;'],
  ['conditional child','export const A=({busy}:{busy:boolean})=><Text>{busy?\'Working\':null}</Text>;'],
  ['nested child template','export const A=({s}:{s:boolean})=><span>{s?\' (stale)\':\'\'}</span>;'],
  ['label default prop','export function S({label=\'Loading\'}:{label?:string}){return <span>{label}</span>;}'],
  ['status setter','export function C(){const [s,setStatus]=useState(\'\');return <button onClick={()=>setStatus(\'Copied\')}>{s}</button>;}'],
  ['accessibility value text','export const P=()=><View accessibilityValue={{text:\'In progress\'}}/>;'],
  ['non-English literal','export const A=()=><button>Fermer</button>;'],
 ])('flags %s',(_,source)=>{expect(scan(source).length).toBeGreaterThan(0);});
 it('ignores code-only literals',()=>{
  const source=["'use client';","import React from 'react';","import {x} from '@bloxwap/hig-contracts';",
   "export function B({intent='primary',type='button'}:{intent?:string;type?:string}){",
   " if(typeof intent==='string'&&intent==='ghost')return null;",
   " return <button type={type} className='hig-button' role='status' data-intent={intent} style={{fontVariant:['tabular-nums']}} aria-hidden='true'>{x?'●':'○'} {intent==='primary'?1:2}</button>;}",
   "export const chartTheme={theme:{fontFamily:'Bloxwap Sans, system-ui'}};"].join('\n');
  expect(scan(source)).toEqual([]);
 });
});

describe('HIGMessages catalog',()=>{
 it('documents every key with its English default in the localization guide and profile',()=>{
  expect([...messageKeys]).toEqual(Object.keys(defaultMessages));
  expect(profile.messages.keys).toEqual([...messageKeys]);
  for(const key of messageKeys){
   const row=guide.split('\n').find(line=>line.startsWith(`| \`${key}\``));
   expect(row,`docs/foundations/localization.md row for ${key}`).toBeTruthy();
   const value=english(key);
   if(value)expect(row!.split(' | ')[1]).toBe(value);
  }
  expect(guide).toContain('## Built-in component strings');
  for(const prop of ['closeLabel','cancelLabel','dismissLabel','busyLabel'])expect(guide).toContain(`\`${prop}\``);
 });
 it('keeps glossary trading terms out of the default copy',()=>{
  const escape=(s:string)=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const terms:string[]=glossary.terms.flatMap((t:{term:string;aliases?:string[];untranslatedForms?:string[]})=>[t.term,...(t.aliases??[]),...(t.untranslatedForms??[])]);
  const copy=messageKeys.map(key=>{const value=defaultMessages[key] as unknown;return typeof value==='function'?(value as (...a:unknown[])=>string)(...(key==='resultCount'?[3,'en-US']:['{a}','{b}'])):String(value);}).join('\n');
  for(const term of terms)expect(copy,`glossary term ${term}`).not.toMatch(new RegExp(`(^|[^\\p{L}])${escape(term)}([^\\p{L}]|$)`,'iu'));
 });
 it('formats interpolated English defaults',()=>{
  expect(defaultMessages.dismissNotice('Copied','Dismiss')).toBe('Dismiss Copied');
  expect(defaultMessages.pageOf('2','10')).toBe('Page 2 of 10');
  expect(defaultMessages.resultCount(1,'en-US')).toBe('1 result');
  expect(defaultMessages.resultCount(1200,'en-US')).toBe('1,200 results');
  expect(defaultMessages.progressValue('3','10')).toBe('3 of 10');
  expect(defaultMessages.reviewAssetOrder('BTC')).toBe('Review BTC order');
 });
 it('merges partial catalogs without blanking labels',()=>{
  const fr=resolveMessages(defaultMessages,{close:'Fermer',dismiss:undefined,busy:'En cours'});
  expect(fr.close).toBe('Fermer');expect(fr.dismiss).toBe('Dismiss');expect(fr.busy).toBe('En cours');
  expect(defaultMessages.close).toBe('Close');
  const nested=resolveMessages(fr,{busy:''});
  expect(nested.close).toBe('Fermer');expect(nested.busy).toBe('');
  const wrong=resolveMessages(defaultMessages,{close:42 as unknown as string,pageOf:'Seite' as unknown as HIGMessages['pageOf']});
  expect(wrong.close).toBe('Close');expect(wrong.pageOf('1','2')).toBe('Page 1 of 2');
  expect(resolveMessages(defaultMessages)).toBe(defaultMessages);
 });
});
