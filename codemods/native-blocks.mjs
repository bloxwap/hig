import ts from 'typescript';
import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
const aggregates=new Set(['@bloxwap/hig/native/blocks','@bloxwap/hig/native/recipes']);
/** Export name -> entry, read from the aggregate module itself so the map cannot drift from what it gathers. */
export function nativeBlockEntries(source=readFileSync(new URL('../packages/hig/native/src/blocks.tsx',import.meta.url),'utf8')){
 const file=ts.createSourceFile('blocks.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);const entries=new Map();
 for(const statement of file.statements){
  if(!ts.isExportDeclaration(statement)||!statement.moduleSpecifier||!statement.exportClause||!ts.isNamedExports(statement.exportClause))continue;
  const entry=/^\.\/(.+)\.js$/.exec(statement.moduleSpecifier.text)?.[1];if(!entry)continue;
  for(const element of statement.exportClause.elements)entries.set(element.name.text,entry);
 }
 return entries;
}
/**
 * Moves named imports and re-exports of `@bloxwap/hig/native/blocks` to each block's own entry, so Metro ships the blocks a file
 * uses instead of all of them. Names, aliases and `type` modifiers are kept. Statements it cannot split are left and reported.
 */
export function splitNativeBlockImports(source,entries=nativeBlockEntries()){
 const file=ts.createSourceFile('consumer.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);const edits=[],warnings=[];
 const visit=node=>{
  if(ts.isCallExpression(node)&&node.arguments.some(argument=>ts.isStringLiteralLike(argument)&&aggregates.has(argument.text)))warnings.push(`${node.expression.getText(file)}('${node.arguments.find(argument=>ts.isStringLiteralLike(argument)&&aggregates.has(argument.text)).text}') needs a manual change: name the entry of each block it loads or mocks`);
  ts.forEachChild(node,visit);
 };
 visit(file);
 for(const statement of file.statements){
  const isImport=ts.isImportDeclaration(statement),isExport=ts.isExportDeclaration(statement);
  if(!isImport&&!isExport)continue;
  const specifier=statement.moduleSpecifier;if(!specifier||!ts.isStringLiteral(specifier)||!aggregates.has(specifier.text))continue;
  const clause=isImport?statement.importClause:null;
  const bindings=isImport?clause?.namedBindings:statement.exportClause;
  if(!bindings||(isImport&&clause.name)||!(isImport?ts.isNamedImports(bindings):ts.isNamedExports(bindings))){warnings.push(`Default, namespace or star use of ${specifier.text} keeps every block; import the blocks by name`);continue;}
  const typeOnly=isImport?clause.isTypeOnly:statement.isTypeOnly;
  const groups=new Map();let unknown=null;
  for(const element of bindings.elements){
   const name=(element.propertyName??element.name).text,entry=entries.get(name);
   if(!entry){unknown=name;break;}
   if(!groups.has(entry))groups.set(entry,[]);groups.get(entry).push(element.getText(file));
  }
  if(unknown){warnings.push(`${unknown} is not exported by ${specifier.text}; statement left unchanged`);continue;}
  const quote=source[specifier.getStart(file)],semicolon=source[statement.end-1]===';'?';':'';
  const keyword=`${isImport?'import':'export'}${typeOnly?' type':''}`;
  edits.push({start:statement.getStart(file),end:statement.end,value:[...groups].map(([entry,names])=>`${keyword} { ${names.join(', ')} } from ${quote}@bloxwap/hig/native/${entry}${quote}${semicolon}`).join('\n')});
 }
 let code=source;for(const edit of edits.sort((x,y)=>y.start-x.start))code=code.slice(0,edit.start)+edit.value+code.slice(edit.end);
 return {code,changed:edits.length>0,replacements:edits.length,warnings};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2),write=args.includes('--write'),paths=args.filter(argument=>!argument.startsWith('--'));
 if(!paths.length)throw Error('Usage: node codemods/native-blocks.mjs [--write] file.tsx ... (default: preview)');
 for(const path of paths){const result=splitNativeBlockImports(readFileSync(path,'utf8'));console.log(JSON.stringify({path,write,replacements:result.replacements,warnings:result.warnings}));if(write&&result.changed)writeFileSync(path,result.code);else if(result.changed)console.log(result.code);}
}
