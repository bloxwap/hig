import {it,expect} from 'vitest';
import {readFileSync,existsSync,readdirSync} from 'node:fs';
import data from '../apps/docs/src/content.json';
import examples from '../planning/examples.json';
it('every catalog component has both platform code and a real versioned chapter',()=>{expect(data.catalog).toHaveLength(examples.examples.length);for(const entry of data.catalog){expect(existsSync(entry.source)).toBe(true);expect(examples.examples.find(e=>e.name===entry.name)?.native).toContain('C.');expect(data.pages.some(p=>p.route===entry.route)).toBe(true);}});
it('every generated static route is reachable with base-safe assets and metadata',()=>{for(const page of data.pages){const html=readFileSync(`apps/docs/dist/${page.route}/index.html`,'utf8');expect(html).toContain('/hig/docs/');expect(html).toContain(page.route+'/');}expect(existsSync('apps/docs/dist/catalog/index.html')).toBe(true);expect(readFileSync('apps/docs/dist/sitemap.xml','utf8')).toContain('components/button/');});
it('LLM/Markdown exports derive from the actual normative source',()=>{const text=readFileSync('docs/foundations/principles.md','utf8');expect(readFileSync('apps/docs/public/markdown/foundations/principles.md','utf8')).toBe(text);expect(readFileSync('apps/docs/public/llms.txt','utf8')).toContain(text);});
it('Fumadocs exports every canonical guide and API page with static search',()=>{for(const page of data.pages){const html=readFileSync(`apps/docs/dist/docs/${page.route}/index.html`,'utf8');expect(html).toContain('/hig/_next/');expect(html).toContain('nd-docs-layout');expect(html).toContain(`https://bloxwap.github.io/hig/docs/${page.route}/`);expect(html).toContain(page.title.replace(/ · HIG.*$/,'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'));}expect(existsSync('apps/docs/dist/search.json')).toBe(true);expect(readFileSync('apps/docs/dist/docs/components/button/index.html','utf8')).toContain('API reference');});
it('adoption inventory includes every currently visible active repository with dated ownership decisions',()=>{
 const latest=readdirSync('planning').filter(f=>/^org-inventory-\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort().at(-1)!;
 const inventory=JSON.parse(readFileSync(`planning/${latest}`,'utf8')) as {name:string;isArchived:boolean}[];
 type Exception={scope:string;reason:string;owner:string;expires:string;tracking:string};
 const adoption=JSON.parse(readFileSync('planning/adoption.json','utf8')) as {inventoryEvidence:string;repositories:{name:string;applicability:string;owner:string;status:string;higVersion:string;exceptionExpires:string;mergedPRs:string[];openPRs:string[];exceptions:Exception[]}[];surfaces:{name:string;status:string;mergedPRs:string[]}[]};
 expect(adoption.inventoryEvidence).toBe(`planning/${latest}`);
 for(const repo of inventory.filter(r=>!r.isArchived)){const row=adoption.repositories.find(r=>r.name===repo.name);expect(row,repo.name).toBeTruthy();expect(row?.applicability).toBeTruthy();expect(row?.owner).toBeTruthy();expect(row?.status).toBeTruthy();expect(row?.higVersion).toBeTruthy();expect(row?.exceptionExpires).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  for(const e of row!.exceptions){expect(e.reason&&e.owner&&e.scope,`${repo.name} exception`).toBeTruthy();expect(e.expires).toMatch(/^\d{4}-\d{2}-\d{2}$/);expect(e.tracking).toMatch(/^https:\/\/github\.com\/bloxwap\//);}
  for(const pr of [...row!.mergedPRs,...row!.openPRs])expect(pr).toMatch(/^https:\/\/github\.com\/bloxwap\/[^/]+\/pull\/\d+$/);}
 for(const name of ['bloxwap.app','bloxwap.pro','bloxwap.com','React Native app','Hyperliquid docs','Chart docs','Font docs','SFX docs','Haptic docs'])expect(adoption.surfaces.find(s=>s.name===name),name).toBeTruthy();
});
