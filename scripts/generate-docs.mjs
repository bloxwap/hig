import {readFileSync,writeFileSync,mkdirSync,readdirSync,rmSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {marked} from 'marked';
import ts from 'typescript';
import {posix} from 'node:path';
import {exampleCode,examples} from './example-code.mjs';
execFileSync(process.execPath,['scripts/generate-glossary.mjs'],{stdio:'inherit'});
mkdirSync('apps/docs/public',{recursive:true});
writeFileSync('apps/docs/public/localization.json',readFileSync('docs/foundations/localization.json'));
const version='0.1.0';const pages=[];
const groups=JSON.parse(readFileSync('apps/docs/src/component-groups.json','utf8'));
for(const entry of examples)if(!groups.some(group=>group.family===entry.family))throw new Error(`Missing docs component group: ${entry.family}`);
function files(path){return readdirSync(path,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(`${path}/${e.name}`):e.name.endsWith('.md')?[`${path}/${e.name}`]:[]);}
const slug=s=>s.toLowerCase().replace(/<[^>]*>/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
function html(markdown){return marked.parse(markdown,{async:false}).replace(/<h([1-6])>(.*?)<\/h\1>/g,(_,n,text)=>`<h${n} id="${slug(text)}">${text}</h${n}>`);}
const sourcefiles=files('docs');
for(const file of sourcefiles){const markdown=readFileSync(file,'utf8');const title=markdown.match(/^# (.+)/)?.[1]??file;const route='guides/'+file.slice(5,-3);pages.push({route,title,source:file,markdown,html:html(markdown),toc:[...markdown.matchAll(/^## (.+)$/gm)].map(m=>({label:m[1],id:slug(m[1])})),section:file.split('/')[1]});}
// A declaration belongs to its own file when that file is a public entry, otherwise to the public entry that re-exports it.
function declarations(path){const parsed=ts.createSourceFile(path,readFileSync(path,'utf8'),ts.ScriptTarget.Latest,true);const found=[];for(const statement of parsed.statements){if(ts.isExportDeclaration(statement)&&statement.moduleSpecifier&&statement.exportClause&&ts.isNamedExports(statement.exportClause)){/* Package re-exports (e.g. HIGMessages from @bloxwap/hig-contracts/messages) are documented by that package. */if(!statement.moduleSpecifier.text.startsWith('.'))continue;const target=declarations(posix.join(posix.dirname(path),statement.moduleSpecifier.text.replace(/\.js$/,'.d.ts')));for(const element of statement.exportClause.elements){const source=(element.propertyName??element.name).getText(parsed);found.push(...target.filter(d=>d.name===source).map(d=>({...d,name:element.name.getText(parsed)})));}continue;}if(!statement.modifiers?.some(m=>m.kind===ts.SyntaxKind.ExportKeyword))continue;const names=ts.isVariableStatement(statement)?statement.declarationList.declarations.map(d=>d.name.getText(parsed)):statement.name?[statement.name.getText(parsed)]:[];for(const name of names)found.push({name,signature:statement.getText(parsed),origin:path});}return found;}
// #96: the chart adapter is its own package; its exports are listed under api.chart with the package name as the entry.
const api={};for(const platform of ['react','native','chart']){api[platform]={};const exported=Object.values(JSON.parse(readFileSync(`packages/${platform}/package.json`,'utf8')).exports).map(t=>t?.types).filter(t=>t?.startsWith('./dist/')).map(t=>t.slice(7));const top=readdirSync(`packages/${platform}/dist`).filter(f=>f.endsWith('.d.ts')),files=[...new Set([...top.filter(f=>exported.includes(f)),...exported,...top])];for(const file of files)for(const {name,signature,origin} of declarations(`packages/${platform}/dist/${file}`)){const own=origin.slice(`packages/${platform}/dist/`.length);api[platform][name]??={entry:platform==='chart'?'@bloxwap/hig-chart':(exported.includes(own)?own:file).slice(0,-5),signature};}}
const familySource={brand:'docs/foundations/platform.md',provider:'docs/architecture/platform-matrix.md'};
const catalog=examples.map(e=>{const source=familySource[e.family]??`docs/components/${e.family}.md`;const chapter=readFileSync(source,'utf8');const webCode=Object.fromEntries(e.states.map(s=>[s,exampleCode(e.name,'react','comfortable',s)]));const nativeCode=Object.fromEntries(e.states.map(s=>[s,exampleCode(e.name,'native','comfortable',s)]));const route=`components/${e.slug}`;pages.push({route,title:e.name,source,toc:[],section:'components',component:e.name});return {...e,route,source,code:{react:webCode,native:nativeCode},api:{react:api.react[e.name]??api.chart[e.name]??null,native:api.native[e.name]??null}};});
const codes=Object.fromEntries(catalog.map(e=>[e.name,e.code]));writeFileSync('apps/docs/src/code.json',JSON.stringify(codes,null,2)+'\n');for(const e of catalog){delete e.code;delete e.web;delete e.native;}
const data={version,status:'review candidate · device validation pending',pages:pages.map(({markdown,...page})=>page),catalog};mkdirSync('apps/docs/src',{recursive:true});mkdirSync('apps/docs/public/markdown',{recursive:true});writeFileSync('apps/docs/src/content.json',JSON.stringify(data,null,2)+'\n');writeFileSync('planning/api-manifest.json',JSON.stringify({version,api},null,2)+'\n');
// Interactive previews need routing labels and choices. Full chapters and API signatures
// already render on the server; shipping them again to every preview wastes the docs budget.
writeFileSync('apps/docs/src/demo-content.json',JSON.stringify({pages:pages.map(({route,title})=>({route,title})),catalog:catalog.map(({name,route,nativeSupport,states})=>({name,route,nativeSupport,states}))},null,2)+'\n');
for(const p of pages.filter(p=>!p.component)){const target=`apps/docs/public/markdown/${p.source.slice(5)}`;mkdirSync(target.slice(0,target.lastIndexOf('/')),{recursive:true});writeFileSync(target,p.markdown);}
writeFileSync('apps/docs/public/llms.txt',`# Bloxwap HIG ${version} candidate\n\n${pages.filter(p=>!p.component).map(p=>`## ${p.title}\nSource: ${p.source}\n\n${p.markdown}`).join('\n\n')}`);
writeFileSync('apps/docs/public/catalog.json',JSON.stringify({version,components:catalog.map(({name,route,entry,nativeSupport,states})=>({name,route,entry,nativeSupport,states}))},null,2)+'\n');
console.log(`Docs: ${pages.length} routes; ${catalog.length} components; ${sourcefiles.length} Markdown chapters`);
// Generated Fumadocs collection. docs/ remains the only authored guide source.
const contentRoot='apps/docs/content/docs';
rmSync(contentRoot,{recursive:true,force:true});
const write=(path,text)=>{mkdirSync(path.slice(0,path.lastIndexOf('/')),{recursive:true});writeFileSync(path,text);};
for(const page of pages){
 const entry=catalog.find(e=>e.route===page.route);
 const markdown=entry?`## API reference\n\n\`\`\`ts\n${entry.api.react?.signature??'See source declarations.'}\n\`\`\`\n\n### React Native API\n\n\`\`\`ts\n${entry.api.native?.signature??'See documented native alternative.'}\n\`\`\`\n\n## Usage & accessibility\n\n${entry.a11y}.\n\nFeedback: ${entry.feedback}.\n\n[Read the usage guide](/docs/guides/${entry.source.slice(5,-3)})` : page.markdown.replace(/^# .+\n/,'');
 // .md uses CommonMark rather than interpreting guide prose as JSX.
 write(`${contentRoot}/${page.route}.md`,`---\ntitle: ${JSON.stringify(page.title.replace(/ · HIG.*$/,''))}\n---\n\n${markdown}\n`);
}
write(`${contentRoot}/index.mdx`,'---\ntitle: Human interface guidelines\n---\n\nVersion 0.1.0 candidate.\n\n[Install HIG](/docs/guides/installation) · [Component catalog](/docs/catalog) · [Website and migration shell](/docs/guides/website)\n');
write(`${contentRoot}/catalog.mdx`,`---\ntitle: Component catalog\ndescription: Reusable building blocks for clear interfaces on web and native.\n---\n\n${groups.map(group=>`## ${group.title}\n\n${group.description}\n\n<ComponentGroup family="${group.family}" />`).join('\n\n')}\n`);
write(`${contentRoot}/meta.json`,JSON.stringify({title:'HIG 0.1.0',pages:['index','catalog','guides','components']},null,2));
write(`${contentRoot}/guides/meta.json`,JSON.stringify({title:'Guidelines',pages:['installation','foundations','components','feedback','architecture','governance','migration','website','ci-runners']},null,2));
write(`${contentRoot}/components/meta.json`,JSON.stringify({title:'Component reference'},null,2));
write(`${contentRoot}/guides/components/meta.json`,JSON.stringify({title:'Component guidelines',pages:groups.filter(group=>sourcefiles.includes(`docs/components/${group.family}.md`)).map(group=>group.family)},null,2));
