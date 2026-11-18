import ts from 'typescript';
import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

/** Import paths HIG no longer publishes, each with the path that names the same module. */
export const supersededPaths={
 '@bloxwap/hig/react/recipes':'@bloxwap/hig/react/blocks',
 '@bloxwap/hig/react/recipes/market-row':'@bloxwap/hig/react/blocks/market-row',
 '@bloxwap/hig/react/recipes/trade-entry':'@bloxwap/hig/react/blocks/trade-entry',
 '@bloxwap/hig/react/recipes/swap-panel':'@bloxwap/hig/react/blocks/swap-block',
 '@bloxwap/hig/react/recipes/pickers':'@bloxwap/hig/react/blocks/pickers',
 '@bloxwap/hig/react/recipes/swap-sheet':'@bloxwap/hig/react/blocks/swap-sheet',
 '@bloxwap/hig/react/recipes/install-command':'@bloxwap/hig/react/blocks/install-command',
 '@bloxwap/hig/react/recipes/marketing-hero':'@bloxwap/hig/react/blocks/marketing-hero',
 '@bloxwap/hig/native/recipes':'@bloxwap/hig/native/blocks',
 '@bloxwap/hig/react/blocks/swap-panel-block':'@bloxwap/hig/react/blocks/swap-block',
 '@bloxwap/hig/react/blocks/swap-panel':'@bloxwap/hig/react/blocks/swap-block',
 '@bloxwap/hig/native/gesture-sheet-next':'@bloxwap/hig/native/gesture-sheet',
 '@bloxwap/hig/react/wallet-address-core':'@bloxwap/hig/react/wallet-address',
};
/** Export names HIG no longer publishes, each with the name of the same export. */
export const supersededNames={
 SwapPanelBlock:'SwapBlock',SwapPanel:'SwapBlock',SwapPanelBlockProps:'SwapBlockProps',SwapPanelProps:'SwapBlockProps',
 FromPicker:'FromPickerBlock',ToPicker:'ToPickerBlock',FromPickerProps:'FromPickerBlockProps',ToPickerProps:'ToPickerBlockProps',
};
// On web the core entry was the same module under a second props name. Native keeps its own core entry and props.
const webWalletAddress=new Set(['@bloxwap/hig/react/wallet-address-core','@bloxwap/hig/react/wallet-address']);

/**
 * Moves a host off the import paths and export names HIG removed. A path is rewritten wherever it is a string argument or a
 * module specifier (`import`, `export … from`, `import()`, `require()`, `jest.mock()`). A renamed export keeps the host's local
 * name (`SwapPanelBlock` becomes `SwapBlock as SwapPanelBlock`), so nothing below the imports changes.
 */
export function replaceSuperseded(source){
 const file=ts.createSourceFile('consumer.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);const edits=[],warnings=[];
 const fromHIG=specifier=>specifier.startsWith('@bloxwap/hig/');
 const rename=(element,specifier)=>{
  const imported=(element.propertyName??element.name).text;
  const next=supersededNames[imported]??(imported==='WalletAddressCoreProps'&&webWalletAddress.has(specifier)?'WalletAddressProps':undefined);
  if(!next)return;
  const local=element.name.text,typeOnly=element.isTypeOnly?'type ':'';
  edits.push({start:element.getStart(file),end:element.end,value:`${typeOnly}${next===local?next:`${next} as ${local}`}`});
 };
 const visit=node=>{
  if((ts.isImportDeclaration(node)||ts.isExportDeclaration(node))&&node.moduleSpecifier&&ts.isStringLiteral(node.moduleSpecifier)&&fromHIG(node.moduleSpecifier.text)){
   const bindings=ts.isImportDeclaration(node)?node.importClause?.namedBindings:node.exportClause;
   if(bindings&&(ts.isNamedImports(bindings)||ts.isNamedExports(bindings)))for(const element of bindings.elements)rename(element,node.moduleSpecifier.text);
   else if(bindings&&supersededPaths[node.moduleSpecifier.text])warnings.push(`Namespace use of ${node.moduleSpecifier.text}: check it for ${Object.keys(supersededNames).join(', ')}`);
  }
  if(ts.isStringLiteralLike(node)&&supersededPaths[node.text]){
   const quote=source[node.getStart(file)];edits.push({start:node.getStart(file),end:node.end,value:quote+supersededPaths[node.text]+quote});
  }
  if(ts.isJsxAttribute(node)&&node.name.getText(file)==='dgen')warnings.push('The chart prop `dgen` is now `degen`; rename it by hand');
  ts.forEachChild(node,visit);
 };
 visit(file);
 let code=source;for(const edit of edits.sort((x,y)=>y.start-x.start))code=code.slice(0,edit.start)+edit.value+code.slice(edit.end);
 return {code,changed:edits.length>0,replacements:edits.length,warnings};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2),write=args.includes('--write'),paths=args.filter(argument=>!argument.startsWith('--'));
 if(!paths.length)throw Error('Usage: node codemods/superseded.mjs [--write] file.tsx ... (default: preview)');
 for(const path of paths){const result=replaceSuperseded(readFileSync(path,'utf8'));console.log(JSON.stringify({path,write,replacements:result.replacements,warnings:result.warnings}));if(write&&result.changed)writeFileSync(path,result.code);else if(result.changed)console.log(result.code);}
}
