// #66: a plain CSS consumer styles with the radius/type/motion/density roles from the packed
// @bloxwap/hig-tokens/css alone. The page has no script and never reads the manifest; expectations
// come from packages/tokens/source.json so a new role is checked as soon as it is generated.
import {execFileSync} from 'node:child_process';
import {createServer} from 'node:http';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,readdirSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,normalize,extname} from 'node:path';
import assert from 'node:assert/strict';
import {chromium,firefox,webkit} from '@playwright/test';

const source=JSON.parse(readFileSync('packages/tokens/source.json','utf8'));
const engines=(process.env.HIG_PACKED_CSS_BROWSERS??'chromium,firefox,webkit').split(',').map(s=>s.trim()).filter(Boolean);
const port=Number(process.env.HIG_PACKED_CSS_PORT??4181);
const px=value=>`${value}px`;

mkdirSync('artifacts',{recursive:true});
const [pack]=JSON.parse(execFileSync('npm',['pack','./packages/tokens','--json','--ignore-scripts','--pack-destination',resolve('artifacts')],{encoding:'utf8'}));
const dir=mkdtempSync(join(tmpdir(),'hig-plain-css-consumer-'));
writeFileSync(join(dir,'package.json'),JSON.stringify({private:true,name:'hig-plain-css-consumer'},null,2));
execFileSync('npm',['install','--ignore-scripts','--no-audit','--no-fund',resolve('artifacts',pack.filename)],{cwd:dir,stdio:'pipe'});
assert.deepEqual(readdirSync(join(dir,'node_modules/@bloxwap')),['hig-tokens'],'the plain CSS consumer installs only the tokens tarball');
const installed=JSON.parse(readFileSync(join(dir,'node_modules/@bloxwap/hig-tokens/package.json'),'utf8'));
const cssExport=installed.exports['./css'];assert.equal(typeof cssExport,'string','@bloxwap/hig-tokens exposes ./css');
const cssPath=`node_modules/@bloxwap/hig-tokens/${cssExport.replace(/^\.\//,'')}`;assert.ok(existsSync(join(dir,cssPath)),`${cssPath} is packed`);

// Consumer stylesheet: only role variables, no literal HIG values.
const radius=Object.keys(source.radius),type=Object.keys(source.type),motion=Object.keys(source.motion),densityKeys=Object.keys(source.density.comfortable);
const rules=[
 `@import url('./${cssPath}');`,
 'body { margin: 0; background: var(--hig-background); color: var(--hig-text); font: var(--hig-type-body); }',
 ...radius.map(k=>`.radius-${k} { border-radius: var(--hig-radius-${k}); }`),
 ...type.map(k=>`.type-${k} { font-size: var(--hig-type-${k}-size); line-height: var(--hig-type-${k}-line-height); font-weight: var(--hig-type-${k}-weight); }\n.font-${k} { font: var(--hig-type-${k}); }`),
 ...motion.map(k=>`.motion-${k} { transition: opacity var(--hig-motion-duration-${k}) var(--hig-motion-easing-standard); }`),
 '.density { display: flex; min-height: var(--hig-density-control); min-width: var(--hig-density-target); gap: var(--hig-density-gap); }',
 ...Object.keys(source.density).map(mode=>`.density-${mode} { display: flex; min-height: var(--hig-density-${mode}-control); min-width: var(--hig-density-${mode}-target); gap: var(--hig-density-${mode}-gap); }`),
];
const block=prefix=>[
 ...radius.map(k=>`<div id="${prefix}radius-${k}" class="radius-${k}">radius ${k}</div>`),
 ...type.map(k=>`<p id="${prefix}type-${k}" class="type-${k}">${k}</p><p id="${prefix}font-${k}" class="font-${k}">${k}</p>`),
 ...motion.map(k=>`<div id="${prefix}motion-${k}" class="motion-${k}">${k}</div>`),
 `<div id="${prefix}density" class="density"><span>a</span><span>b</span></div>`,
 ...Object.keys(source.density).map(mode=>`<div id="${prefix}density-${mode}" class="density-${mode}"><span>a</span><span>b</span></div>`),
].join('\n');
writeFileSync(join(dir,'app.css'),rules.join('\n')+'\n');
writeFileSync(join(dir,'index.html'),`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>HIG plain CSS roles</title><link rel="icon" href="data:,"><link rel="stylesheet" href="./app.css"></head><body>
<main id="default">${block('')}</main>
<section id="compact" data-hig-density="compact">${block('compact-')}</section>
<section id="reduced" data-hig-motion="reduced">${block('reduced-')}</section>
</body></html>\n`);

const requests=[];
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8'};
const server=createServer((req,res)=>{const path=decodeURIComponent(new URL(req.url,'http://x').pathname);requests.push(path);const file=normalize(join(dir,path==='/'?'index.html':path));if(!file.startsWith(dir)||!existsSync(file)||!types[extname(file)]){res.writeHead(404).end();return;}res.writeHead(200,{'content-type':types[extname(file)]}).end(readFileSync(file));});
await new Promise((ok,fail)=>{server.once('error',fail);server.listen(port,'127.0.0.1',ok);});
const url=`http://127.0.0.1:${port}/`;

const rem=value=>px(value);
function expected(scope){
 const reduced=scope==='reduced'||scope==='os-reduced',mode=scope==='compact'?'compact':'comfortable';
 const out={};
 for(const k of radius)out[`radius-${k}`]={borderTopLeftRadius:rem(source.radius[k])};
 for(const k of type){const t=source.type[k];out[`type-${k}`]={fontSize:rem(t.size),lineHeight:rem(t.lineHeight),fontWeight:String(t.weight)};out[`font-${k}`]={fontSize:rem(t.size),lineHeight:rem(t.lineHeight),fontWeight:String(t.weight),family:source.font.sans.family};}
 for(const k of motion)out[`motion-${k}`]={transitionDuration:reduced?'0s':`${source.motion[k]/1000}s`,transitionTimingFunction:`cubic-bezier(${source.easing.standard.join(', ')})`};
 const d=source.density[mode];out.density={minHeight:px(d.control),minWidth:px(d.target),columnGap:px(d.gap)};
 for(const m of Object.keys(source.density)){const dm=source.density[m];out[`density-${m}`]={minHeight:px(dm.control),minWidth:px(dm.target),columnGap:px(dm.gap)};}
 return out;
}
async function read(page,prefix,ids){
 return page.evaluate(({prefix,ids})=>Object.fromEntries(ids.map(id=>{const el=document.getElementById(prefix+id);if(!el)return [id,null];const s=getComputedStyle(el);return [id,{borderTopLeftRadius:s.borderTopLeftRadius,fontSize:s.fontSize,lineHeight:s.lineHeight,fontWeight:s.fontWeight,family:s.fontFamily.split(',')[0].trim().replace(/^["']|["']$/g,''),transitionDuration:s.transitionDuration,transitionTimingFunction:s.transitionTimingFunction,minHeight:s.minHeight,minWidth:s.minWidth,columnGap:s.columnGap}];})),{prefix,ids});
}
function compare(actual,want,label){for(const [id,props] of Object.entries(want)){assert.ok(actual[id],`${label}: #${id} renders`);for(const [prop,value] of Object.entries(props))assert.equal(actual[id][prop],value,`${label}: #${id} ${prop}`);}}

const results=[];
try{
 for(const engine of engines){
  const launcher={chromium,firefox,webkit}[engine];if(!launcher)throw Error(`Unsupported browser ${engine}`);
  const browser=await launcher.launch({headless:true,args:engine==='chromium'?['--no-sandbox','--disable-dev-shm-usage']:[]});
  try{
   for(const reducedMotion of ['no-preference','reduce']){
    const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion});const page=await context.newPage();
    const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    requests.length=0;await page.goto(url,{waitUntil:'load'});
    assert.equal(await page.evaluate(()=>document.scripts.length),0,'the consumer page runs no script');
    const scopes=reducedMotion==='reduce'?[['','os-reduced']]:[['','default'],['compact-','compact'],['reduced-','reduced']];
    for(const [prefix,scope] of scopes){const want=expected(scope);compare(await read(page,prefix,Object.keys(want)),want,`${engine} ${reducedMotion} ${scope}`);}
    assert.deepEqual(errors,[],`${engine}: no page errors`);
    const fetched=[...new Set(requests)].sort();
    assert.deepEqual(fetched,['/','/app.css',`/${cssPath}`].sort(),`${engine}: only the page, its stylesheet and @bloxwap/hig-tokens/css are fetched (no manifest, no JS)`);
    results.push({engine,browser:browser.version(),reducedMotion,scopes:scopes.map(s=>s[1]),fetched});
    await context.close();
   }
  }finally{await browser.close();}
 }
}finally{server.close();}

mkdirSync('evidence',{recursive:true});
writeFileSync('evidence/packed-css-roles.json',JSON.stringify({version:'0.1.0',issue:'bloxwap/hig#66',kind:'automated browser (headless Playwright); no physical-device claim',platform:`${process.platform} ${process.arch}`,consumer:'plain HTML + CSS, only the packed @bloxwap/hig-tokens tarball installed, no script, no manifest read',stylesheet:`@import ./${cssPath} (exports["./css"])`,roles:{radius,type,motion,density:densityKeys},checks:['radius roles compute to source.json px','type size/line-height/weight longhands and font shorthand (Bloxwap Sans first)','motion durations and standard easing','motion durations 0s under prefers-reduced-motion: reduce and [data-hig-motion=reduced]','density control/target/gap follow [data-hig-density=compact]','only page, consumer CSS and token CSS requested'],results},null,2)+'\n');
console.log(`Packed plain CSS consumer: radius/type/motion/density roles verified in ${engines.join(', ')} from ${pack.filename} alone`);
