// npm may install a Radix helper under each primitive that uses it. Share
// the client module only when its version, dependencies and peers agree.
import {createRequire} from 'node:module';
import {dirname,join} from 'node:path';
import {readFileSync} from 'node:fs';

export function shareRadixResolution(webpack){
 const entries=new Map(),graphs=new Map(),issuers=new Map();
 function visit(entry,issuer,register){
  if(entries.has(entry))return entries.get(entry);
  const manifest=JSON.parse(readFileSync(join(dirname(dirname(entry)),'package.json'),'utf8'));
  if(!manifest.name.startsWith('@radix-ui/'))return entry;
  const resolve=createRequire(entry).resolve;
  const names=Object.keys({...manifest.dependencies,...manifest.optionalDependencies,...manifest.peerDependencies}).sort();
  const dependencies=names.map(name=>{
   let target;
   try{target=resolve(name);}catch{return [name,null];}
   return [name,name.startsWith('@radix-ui/')?visit(target,dirname(entry),register):target];
  });
  const key=JSON.stringify([manifest.name,manifest.version,dependencies]);
  if(!graphs.has(key))graphs.set(key,graphs.size);
  const id=graphs.get(key);
  entries.set(entry,id);
  if(register&&!issuers.has(id))issuers.set(id,issuer);
  return id;
 }

 // Visit the shell's dependencies in a stable order so asynchronous webpack
 // resolution cannot change the canonical module path between builds.
 const docs=createRequire(import.meta.url).resolve('fumadocs-ui/package.json');
 const resolve=createRequire(docs).resolve;
 const names=Object.keys(JSON.parse(readFileSync(docs,'utf8')).dependencies).sort();
 for(const name of names.filter(name=>name.startsWith('@radix-ui/'))){
  try{visit(resolve(name),dirname(docs),true);}catch{/* Leave unrecognized package layouts to webpack. */}
 }
 return new webpack.NormalModuleReplacementPlugin(/^@radix-ui\/[^/]+$/,request=>{
  try{
   const entry=createRequire(join(request.context,'package.json')).resolve(request.request);
   const issuer=issuers.get(visit(entry,request.context,false));
   if(issuer)request.context=issuer;
  }catch{/* Webpack may resolve an import that has no CommonJS entry point. */}
 });
}
