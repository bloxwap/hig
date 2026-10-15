// Scoped anti-drift check for HIG and for repositories that adopt it.
//
//   node scripts/drift.mjs                                  # this repository (planning/drift-exceptions.json)
//   node <hig>/scripts/drift.mjs --root . --config hig-drift.json   # an adopting repository
//   ... --json                                              # machine-readable report
//
// Zero dependencies (Node built-ins only), so an adopting repository can run it from a pinned HIG
// checkout in CI without copying it. See docs/governance/new-repository.md.
import {readFileSync,readdirSync,existsSync,statSync} from 'node:fs';
import {resolve,relative,join,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';

const SOURCE=/\.(?:[cm]?[jt]sx?|css|scss)$/;
const FONT=/\.(?:ttf|otf|woff2?)$/i;
const SKIP=new Set(['node_modules','dist','out','.next','.turbo','.expo','coverage','artifacts','.source','.git']);
const MAX_EXCEPTION_DAYS=180;

/** Content rules. `canonical` rules do not apply inside paths HIG itself owns. */
export const rules=[
  {id:'obsolete-import',description:'imports a retired fork or a copied HIG folder instead of a versioned @bloxwap/hig-* package',
    test:(source,path,{obsoleteImports=[]}={})=>/from\s*['"]@workspace\/(?:tokens|ui(?:-native)?)['"/]/.test(source)
      ||/(?:from\s*|import\s*|@import\s+(?:url\()?)['"][^'"]*(?:vendor\/hig\/|styles\/hig\/)/.test(source)
      ||obsoleteImports.some(pattern=>new RegExp(`(?:from\\s*|import\\s*|@import\\s+(?:url\\()?)['"]${pattern}`).test(source))},
  {id:'copied-palette',description:'hard-codes a Bloxwap brand colour that belongs to @bloxwap/hig-tokens',
    test:source=>/#(?:00ff3f|ff5c5c|171717|262626)\b/i.test(source)},
  {id:'copied-token-definition',canonical:true,description:'assigns a literal value to a --hig-* token; import @bloxwap/hig-tokens/css (remapping one role to another with var() is allowed)',
    test:(source,path)=>/\.(?:css|scss)$/.test(path)&&/(?:^|[;{\s])--hig-[a-z0-9-]+\s*:\s*(?!var\()[^;}\s]/im.test(source)},
  {id:'copied-primitive-css',canonical:true,description:'re-implements a HIG primitive (paint/geometry on a bare .hig-* selector); import @bloxwap/hig-react/css and override layout only',
    test:(source,path)=>{if(!/\.(?:css|scss)$/.test(path))return false;const css=source.replace(/\/\*[\s\S]*?\*\//g,'');for(const m of css.matchAll(/(?:^|\})\s*(\.hig-[a-z][\w-]*)\s*\{([^}]*)\}/gm)){if(/(?:^|;)\s*(?:background(?:-color)?|border(?:-radius)?|min-height)\s*:/.test(m[2]))return true;}return false;}},
];
/** File rules, applied to file names rather than contents. */
export const fileRules=[
  {id:'copied-font-binary',canonical:true,description:'commits a font binary; install @bloxwap/font (web) or the HIG native font manifest instead',test:path=>FONT.test(path)},
];

const posix=path=>path.split(sep).join('/');
const matches=(exception,path)=>exception.path===path||(exception.path.endsWith('/')&&path.startsWith(exception.path));
const active=(exception,now)=>Boolean(exception.reason&&exception.owner)&&new Date(exception.expires)>now;

/** Returns the violated rule ids for one file's contents (kept compatible with the original API). */
export function driftViolations(source,path,exceptions=[],{canonical=[],obsoleteImports=[],now=new Date()}={}){
  const owned=canonical.some(prefix=>path===prefix||path.startsWith(prefix));
  return rules.filter(rule=>!(rule.canonical&&owned)&&rule.test(source,path,{obsoleteImports})&&!exceptions.some(e=>matches(e,path)&&e.rule===rule.id&&active(e,now))).map(rule=>({path,rule:rule.id}));
}

/** Rejects exceptions that cannot be reviewed: missing owner/reason, unknown rule, bad or open-ended expiry. */
export function validateExceptions(exceptions,now=new Date()){
  const known=new Set([...rules,...fileRules].map(r=>r.id)),errors=[];
  for(const [i,e] of exceptions.entries()){
    const where=`exceptions[${i}] (${e.path??'?'})`,expires=new Date(e.expires);
    if(!e.path||!e.rule||!e.owner||!e.reason)errors.push(`${where}: path, rule, owner and reason are required`);
    if(e.rule&&!known.has(e.rule))errors.push(`${where}: unknown rule ${e.rule}`);
    if(!/^\d{4}-\d{2}-\d{2}$/.test(String(e.expires))||Number.isNaN(expires.getTime()))errors.push(`${where}: expires must be YYYY-MM-DD`);
    else if((expires-now)/864e5>MAX_EXCEPTION_DAYS)errors.push(`${where}: expires more than ${MAX_EXCEPTION_DAYS} days ahead; exceptions must be reviewed`);
  }
  return errors;
}

function walk(root,dir){
  const absolute=join(root,dir);if(!existsSync(absolute))return [];
  if(statSync(absolute).isFile())return [posix(dir)];
  return readdirSync(absolute,{withFileTypes:true}).flatMap(e=>SKIP.has(e.name)?[]:e.isDirectory()?walk(root,join(dir,e.name)):[posix(join(dir,e.name))]);
}

/** Scans `config.paths` under `root`. Returns violations, expired exceptions and unused exceptions. */
export function scan(root,config,now=new Date()){
  const exceptions=config.exceptions??[],canonical=config.canonical??[],obsoleteImports=config.obsoleteImports??[];
  const configErrors=validateExceptions(exceptions,now);
  // Drift is about committed copies: inside a git work tree only tracked files count (build output and ignored caches do not).
  let tracked=null;try{tracked=new Set(execFileSync('git',['ls-files','-z','--cached'],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','ignore']}).split('\0').filter(Boolean));}catch{tracked=null;}
  const files=(config.paths??[]).flatMap(path=>walk(root,path)).filter(path=>!tracked||tracked.has(path));
  const violations=[];
  for(const path of files){
    const owned=canonical.some(prefix=>path===prefix||path.startsWith(prefix));
    for(const rule of fileRules)if(!(rule.canonical&&owned)&&rule.test(path)&&!exceptions.some(e=>matches(e,path)&&e.rule===rule.id&&active(e,now)))violations.push({path,rule:rule.id});
    if(SOURCE.test(extname(path)))violations.push(...driftViolations(readFileSync(join(root,path),'utf8'),path,exceptions,{canonical,obsoleteImports,now}));
  }
  const used=e=>files.some(path=>matches(e,path));
  const expired=exceptions.filter(e=>!(new Date(e.expires)>now)).map(e=>({path:e.path,rule:e.rule,owner:e.owner,expires:e.expires}));
  const unused=exceptions.filter(e=>!used(e)).map(e=>({path:e.path,rule:e.rule}));
  return {root,files:files.length,violations,expired,unused,configErrors};
}

export function checkDrift(argv=process.argv.slice(2)){
  const arg=name=>{const i=argv.indexOf(name);return i>=0?argv[i+1]:undefined;};
  const root=resolve(arg('--root')??'.');
  const configPath=resolve(root,arg('--config')??'planning/drift-exceptions.json');
  const config=JSON.parse(readFileSync(configPath,'utf8'));
  const report=scan(root,config);
  if(argv.includes('--json'))console.log(JSON.stringify(report,null,2));
  for(const e of report.unused)console.warn(`Unused drift exception (remove it): ${e.path} ${e.rule}`);
  const problems=[...report.configErrors.map(m=>`config: ${m}`),...report.expired.map(e=>`expired exception: ${e.path} ${e.rule} (owner ${e.owner}, expired ${e.expires})`),...report.violations.map(v=>`${v.path}: ${v.rule} — ${[...rules,...fileRules].find(r=>r.id===v.rule).description}`)];
  if(problems.length)throw Error(`Design drift in ${posix(relative(process.cwd(),root))||'.'}:\n${problems.join('\n')}`);
  if(!argv.includes('--json'))console.log(`Scoped anti-drift: passed (${report.files} files, ${(config.exceptions??[]).length} dated exceptions)`);
  return report;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){try{checkDrift();}catch(error){console.error(error.message);process.exitCode=1;}}
