import {it,expect} from 'vitest';
import {readFileSync,existsSync} from 'node:fs';
import data from '../apps/docs/src/content.json';
import examples from '../planning/examples.json';
it('every catalog component has both platform code and a real versioned chapter',()=>{expect(data.catalog).toHaveLength(examples.examples.length);for(const entry of data.catalog){expect(existsSync(entry.source)).toBe(true);expect(examples.examples.find(e=>e.name===entry.name)?.native).toContain('C.');expect(data.pages.some(p=>p.route===entry.route)).toBe(true);}});
it('every generated static route is reachable with base-safe assets and metadata',()=>{for(const page of data.pages){const html=readFileSync(`apps/docs/dist/${page.route}/index.html`,'utf8');expect(html).toContain('/hig/assets/');expect(html).toContain(page.route+'/');}expect(existsSync('apps/docs/dist/catalog/index.html')).toBe(true);expect(readFileSync('apps/docs/dist/sitemap.xml','utf8')).toContain('components/button/');});
it('LLM/Markdown exports derive from the actual normative source',()=>{const text=readFileSync('docs/foundations/principles.md','utf8');expect(readFileSync('apps/docs/public/markdown/foundations/principles.md','utf8')).toBe(text);expect(readFileSync('apps/docs/public/llms.txt','utf8')).toContain(text);});
