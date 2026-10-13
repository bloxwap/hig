import ts from 'typescript';
import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
const map=JSON.parse(readFileSync(new URL('./import-map.json',import.meta.url),'utf8'));
/** Import-only preview. Preserve host business logic and demand manual API/variant review. */
export function transformImports(source,platform='web'){
 if(!['web','native'].includes(platform))throw Error('Platform must be web or native');
 const file=ts.createSourceFile('consumer.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);const edits=[],warnings=[];
 for(const statement of file.statements){
  if(!ts.isImportDeclaration(statement)||!ts.isStringLiteral(statement.moduleSpecifier))continue;
  const old=statement.moduleSpecifier.text,rule=map.sources[old];if(!rule)continue;
  if((rule.nativeOnly||old.includes('ui-native'))&&platform!=='native'){warnings.push(`Native import ${old} needs explicit --platform native`);continue;}
  const bindings=statement.importClause?.namedBindings;
  if(statement.importClause?.name||!bindings||!ts.isNamedImports(bindings)){warnings.push(`Default/namespace import ${old} requires manual mapping`);continue;}
  const names=bindings.elements.map(e=>e.propertyName?.text??e.name.text);
  if(!names.every(name=>rule.exports.includes(name))){warnings.push(`Unapproved exports in ${old}: ${names.join(', ')}; no rewrite`);continue;}
  const entry=platform==='native'&&rule.entry==='surface'?'surface':rule.entry;
  const target=`@bloxwap/hig-${platform==='native'?'native':'react'}/${entry}`;
  const start=statement.moduleSpecifier.getStart(file),end=statement.moduleSpecifier.end,quote=source[start];edits.push({start,end,value:quote+target+quote});
  warnings.push(`Review ${names.join(', ')} props, refs, density, accessibility and feedback before accepting ${old} → ${target}`);
 }
 let code=source;for(const edit of edits.sort((a,b)=>b.start-a.start))code=code.slice(0,edit.start)+edit.value+code.slice(edit.end);
 if(edits.length&&/\bvariant\s*=/.test(source))warnings.push('Legacy variant retained: map brand→primary, danger→destructive, ghost/link/outline/secondary only after source/behavior review. Buy/sell direction is not destructive intent.');
 return {code,changed:edits.length>0,replacements:edits.length,warnings};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2),write=args.includes('--write');const index=args.indexOf('--platform');const platform=index>=0?args[index+1]:'web';const paths=args.filter((a,i)=>!a.startsWith('--')&&!(index>=0&&i===index+1));
 if(!paths.length)throw Error('Usage: node codemods/imports.mjs --platform web|native [--write] file.tsx ... (default: preview)');
 for(const path of paths){const result=transformImports(readFileSync(path,'utf8'),platform);console.log(JSON.stringify({path,write,replacements:result.replacements,warnings:result.warnings}));if(write&&result.changed)writeFileSync(path,result.code);else if(result.changed)console.log(result.code);}
}
