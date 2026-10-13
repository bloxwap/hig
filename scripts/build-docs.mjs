import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
execFileSync(process.execPath,['scripts/generate-examples.mjs'],{stdio:'inherit'});
execFileSync(process.execPath,['scripts/generate-docs.mjs'],{stdio:'inherit'});
execFileSync('npx',['vite','build','apps/docs'],{stdio:'inherit'});
const {pages,version}=JSON.parse(readFileSync('apps/docs/src/content.json','utf8'));
const shell=readFileSync('apps/docs/dist/index.html','utf8');const base=process.env.HIG_BASE_PATH??'/hig/';const origin=process.env.HIG_DOCS_ORIGIN??'https://bloxwap.github.io';
for(const page of pages){const dir=`apps/docs/dist/${page.route}`;mkdirSync(dir,{recursive:true});writeFileSync(`${dir}/index.html`,shell.replace(/<title>.*?<\/title>/,`<title>${page.title.replaceAll('&','&amp;').replaceAll('<','&lt;')} · Bloxwap HIG ${version}</title>`).replace(/<link rel="canonical" href="[^"]*">/,`<link rel="canonical" href="${origin}${base}${page.route}/">`));}
writeFileSync('apps/docs/dist/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['',...pages.map(p=>p.route+'/')].map(route=>`<url><loc>${origin}${base}${route}</loc></url>`).join('')}</urlset>`);
console.log(`Static route shells and sitemap: ${pages.length+1}`);
