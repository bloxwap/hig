import {basePath as base,origin} from '../apps/docs/site-config.mjs';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,cpSync,rmSync} from 'node:fs';
import {useTsc} from './compiler.mjs';
execFileSync(process.execPath,['scripts/generate-examples.mjs'],{stdio:'inherit'});
execFileSync(process.execPath,['scripts/generate-docs.mjs'],{stdio:'inherit'});
execFileSync('npm',['run',useTsc?'build:tsc':'build','-w','hig-docs'],{stdio:'inherit'});
// Static hosting has no redirect engine: export explicit legacy redirect documents.
const {pages}=JSON.parse(readFileSync('apps/docs/src/content.json','utf8'));
for(const {route} of [...pages,{route:'catalog'}]){const target=`${base}/docs/${route}/`;const dir=`apps/docs/out/${route}`;mkdirSync(dir,{recursive:true});writeFileSync(`${dir}/index.html`,`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Moved · Bloxwap HIG</title><link rel="canonical" href="${target}"><meta http-equiv="refresh" content="0;url=${target}"></head><body><a href="${target}">Continue to documentation</a><script>location.replace(${JSON.stringify(target)}+location.search+location.hash)</script></body></html>`);}
writeFileSync('apps/docs/out/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['','docs/',...pages.map(p=>`docs/${p.route}/`),'docs/catalog/'].map(route=>`<url><loc>${origin}${base}/${route}</loc></url>`).join('')}</urlset>`);
rmSync('apps/docs/dist',{recursive:true,force:true});cpSync('apps/docs/out','apps/docs/dist',{recursive:true});

execFileSync(process.execPath,['scripts/check-docs-links.mjs'],{stdio:'inherit'});
execFileSync(process.execPath,['scripts/check-docs-citations.mjs'],{stdio:'inherit'});
