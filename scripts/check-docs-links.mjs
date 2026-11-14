import {readFileSync,readdirSync,existsSync,statSync} from 'node:fs';
import {resolve,relative,sep} from 'node:path';
import {pathToFileURL} from 'node:url';
import {JSDOM} from 'jsdom';
import {basePath as siteBase,origin as siteOrigin} from '../apps/docs/site-config.mjs';

export function checkDocsLinks({dist='apps/docs/dist',base=siteBase,origin=siteOrigin,pages=[...JSON.parse(readFileSync('apps/docs/src/content.json','utf8')).pages,...Object.entries(JSON.parse(readFileSync('planning/anchors.json','utf8'))).map(([route,ids])=>({route:route.slice(6,-1),toc:ids.map(id=>({id}))}))]}={}){
 const root=resolve(dist),cache=new Map(),errors=[];
 const files=dir=>readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(`${dir}/${e.name}`):e.name.endsWith('.html')?[`${dir}/${e.name}`]:[]);
 const read=path=>{if(!cache.has(path)){const dom=new JSDOM(readFileSync(path,'utf8'));cache.set(path,{ids:new Set([...dom.window.document.querySelectorAll('[id]')].map(n=>n.id)),hrefs:[...dom.window.document.querySelectorAll('a[href]')].map(n=>n.getAttribute('href'))});dom.window.close();}return cache.get(path);};
 for(const file of files(`${root}/docs`)){
  const pageUrl=new URL(`${base}/${relative(root,file).split(sep).join('/').replace(/index\.html$/,'')}`,origin);
  for(const href of read(file).hrefs){
   const url=new URL(href,pageUrl);
   if(url.origin!==pageUrl.origin||!['http:','https:'].includes(url.protocol))continue;
   const prefix=`${base}/`;
   if(!url.pathname.startsWith(prefix)){errors.push(`${pageUrl.pathname}: ${href} escapes site base ${base}`);continue;}
   if(url.pathname.endsWith('.md'))errors.push(`${pageUrl.pathname}: raw Markdown href ${href}`);
   let target=resolve(root,decodeURIComponent(url.pathname.slice(prefix.length)));
   if(!target.startsWith(`${root}/`)&&target!==root){errors.push(`${href}: outside export`);continue;}
   if(existsSync(target)&&statSync(target).isDirectory())target=resolve(target,'index.html');
   if(!existsSync(target)){errors.push(`${pageUrl.pathname}: missing target ${href}`);continue;}
   if(url.hash&&target.endsWith('.html')&&!read(target).ids.has(decodeURIComponent(url.hash.slice(1))))errors.push(`${pageUrl.pathname}: missing anchor ${href}`);
  }
 }
 for(const page of pages){
  const file=resolve(root,`docs/${page.route}/index.html`);
  for(const {id} of page.toc)if(!read(file).ids.has(id))errors.push(`${page.route}: TOC id #${id} differs from rendered HTML`);
 }
 if(errors.length)throw new Error(`Docs link check failed:\n${errors.join('\n')}`);
 console.log('Built docs links and TOC IDs passed');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)checkDocsLinks();
