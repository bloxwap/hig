import {readFileSync,writeFileSync,mkdirSync,readdirSync} from 'node:fs';
import {marked} from 'marked';
import ts from 'typescript';
import {exampleCode,examples} from './example-code.mjs';
const version='0.1.0';const pages=[];
function files(path){return readdirSync(path,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(`${path}/${e.name}`):e.name.endsWith('.md')?[`${path}/${e.name}`]:[]);}
const slug=s=>s.toLowerCase().replace(/<[^>]*>/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
function html(markdown){return marked.parse(markdown,{async:false}).replace(/<h([1-6])>(.*?)<\/h\1>/g,(_,n,text)=>`<h${n} id="${slug(text)}">${text}</h${n}>`);}
const sourcefiles=files('docs');
for(const file of sourcefiles){const markdown=readFileSync(file,'utf8');const title=markdown.match(/^# (.+)/)?.[1]??file;const route='guides/'+file.slice(5,-3);pages.push({route,title,source:file,markdown,html:html(markdown),toc:[...markdown.matchAll(/^## (.+)$/gm)].map(m=>({label:m[1],id:slug(m[1])})),section:file.split('/')[1]});}
const api={};for(const platform of ['react','native']){api[platform]={};for(const file of readdirSync(`packages/${platform}/dist`).filter(f=>f.endsWith('.d.ts'))){const text=readFileSync(`packages/${platform}/dist/${file}`,'utf8'),parsed=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true);for(const statement of parsed.statements){if(!statement.modifiers?.some(m=>m.kind===ts.SyntaxKind.ExportKeyword))continue;const names=ts.isVariableStatement(statement)?statement.declarationList.declarations.map(d=>d.name.getText(parsed)):statement.name?[statement.name.getText(parsed)]:[];for(const name of names)api[platform][name]={entry:file.slice(0,-5),signature:statement.getText(parsed)};}}}
const familySource={brand:'docs/foundations/platform.md',provider:'docs/architecture/platform-matrix.md'};
const catalog=examples.map(e=>{const source=familySource[e.family]??`docs/components/${e.family}.md`;const chapter=readFileSync(source,'utf8');const webCode=Object.fromEntries(e.states.map(s=>[s,exampleCode(e.name,'react','comfortable',s)]));const nativeCode=Object.fromEntries(e.states.map(s=>[s,exampleCode(e.name,'native','comfortable',s)]));const route=`components/${e.slug}`;pages.push({route,title:e.name,source,toc:[],section:'components',component:e.name});return {...e,route,source,code:{react:webCode,native:nativeCode},api:{react:api.react[e.name]??null,native:api.native[e.name]??null}};});
const codes=Object.fromEntries(catalog.map(e=>[e.name,e.code]));writeFileSync('apps/docs/src/code.json',JSON.stringify(codes,null,2)+'\n');for(const e of catalog){delete e.code;delete e.web;delete e.native;}
const data={version,status:'review candidate · device validation pending',pages:pages.map(({markdown,...page})=>page),catalog};mkdirSync('apps/docs/src',{recursive:true});mkdirSync('apps/docs/public/markdown',{recursive:true});writeFileSync('apps/docs/src/content.json',JSON.stringify(data,null,2)+'\n');writeFileSync('planning/api-manifest.json',JSON.stringify({version,api},null,2)+'\n');
for(const p of pages.filter(p=>!p.component)){const target=`apps/docs/public/markdown/${p.source.slice(5)}`;mkdirSync(target.slice(0,target.lastIndexOf('/')),{recursive:true});writeFileSync(target,p.markdown);}
writeFileSync('apps/docs/public/llms.txt',`# Bloxwap HIG ${version} candidate\n\n${pages.filter(p=>!p.component).map(p=>`## ${p.title}\nSource: ${p.source}\n\n${p.markdown}`).join('\n\n')}`);
writeFileSync('apps/docs/public/catalog.json',JSON.stringify({version,components:catalog.map(({name,route,entry,nativeSupport,states})=>({name,route,entry,nativeSupport,states}))},null,2)+'\n');
console.log(`Docs: ${pages.length} routes; ${catalog.length} components; ${sourcefiles.length} Markdown chapters`);
