import {it,expect} from 'vitest';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {headings,rewriteLinks,markdownFiles} from '../scripts/docs-content.mjs';
import {checkAnchors} from '../scripts/check-docs-citations.mjs';
import {checkDocsLinks} from '../scripts/check-docs-links.mjs';

it('uses Fumadocs heading text, punctuation, duplicate IDs and explicit IDs',()=>{
 expect(headings('# Title\n\n## `@bloxwap/hig` & **charts**\n\n## Repeat\n\n## Repeat\n\n## Kept [#old-id]\n').map(h=>h.id)).toEqual(['bloxwaphig--charts','repeat','repeat-1','old-id']);
});
it('rewrites inline and reference links, preserving code samples',()=>{
 const input='[chart](../components/chart.md#move)\n\n[chart][ref]\n\n[ref]: ../components/chart.md#move\n\n`[chart](../components/chart.md)`';
 const output=rewriteLinks(input,'docs/migration/sdk-docs.md','/hig');
 expect(output.match(/\/hig\/docs\/guides\/components\/chart\/#move/g)).toHaveLength(2);
 expect(output).toContain('`[chart](../components/chart.md)`');
 expect(()=>rewriteLinks('[bad](../../missing.md)','docs/components/chart.md')).toThrow('no docs route');
});
it('chapter version stamps, if present, match the package version',()=>{
 const {version}=JSON.parse(readFileSync('package.json','utf8'));
 for(const file of markdownFiles()){
  const stamp=readFileSync(file,'utf8').match(/^# .* · HIG (.+)$/m)?.[1];
  if(stamp)expect(stamp,file).toBe(version);
 }
});
it('rejects a removed published anchor and requires a documented existing replacement',()=>{
 const before={'/docs/guides/test/':['old']},after={'/docs/guides/test/':['new']};
 expect(()=>checkAnchors(before,after,{})).toThrow('Removed published anchor');
 expect(()=>checkAnchors(before,after,{'/docs/guides/test/#old':{to:'/docs/guides/test/#missing',note:'Renamed'}})).toThrow('Invalid renamedAnchors');
 expect(()=>checkAnchors(before,after,{'/docs/guides/test/#old':{to:'/docs/guides/test/#new',note:'Renamed for clarity'}})).not.toThrow();
});
it('checks built HTML targets, decoded fragments, raw md URLs, base paths and TOC IDs',()=>{
 const dist=mkdtempSync(join(tmpdir(),'hig-docs-links-'));
 try{
  mkdirSync(`${dist}/docs/start`,{recursive:true});mkdirSync(`${dist}/docs/target`,{recursive:true});
  writeFileSync(`${dist}/docs/target/index.html`,'<h2 id="café">Target</h2>');
  const check=()=>checkDocsLinks({dist,base:'/custom',pages:[]});
  const link=(href:string)=>writeFileSync(`${dist}/docs/start/index.html`,`<a href="${href}">Link</a>`);
  link('../target/#caf%C3%A9');expect(check).not.toThrow();
  link('../target/#wrong');expect(check).toThrow('missing anchor');
  link('../missing/');expect(check).toThrow('missing target');
  link('../target.md');expect(check).toThrow('raw Markdown href');
  link('/docs/target/');expect(check).toThrow('escapes site base');
  link('../target/');expect(()=>checkDocsLinks({dist,base:'/custom',pages:[{route:'target',toc:[{id:'wrong'}]}]})).toThrow('TOC id');
 }finally{rmSync(dist,{recursive:true,force:true});}
});
