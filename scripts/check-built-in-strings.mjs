// Fails when HIG React / React Native source hard-codes user-visible or accessible copy (bloxwap/hig#62).
// Built-in strings live in @bloxwap/hig-contracts `defaultMessages` and reach components through
// HIGProvider `messages` or a per-component label prop. Run directly or through `npm run lint`.
import ts from 'typescript';
import {readFileSync,readdirSync} from 'node:fs';
import {join,relative} from 'node:path';
import {fileURLToPath} from 'node:url';

/** Any run of two letters in any script is copy a translator would need. Symbols such as ☑ ● … — are allowed. */
const WORD=/\p{L}{2,}/u;
/** JSX attributes whose value is shown or announced. */
const VISIBLE_ATTRIBUTES=new Set(['aria-label','aria-description','aria-valuetext','aria-roledescription','aria-placeholder','accessibilityLabel','accessibilityHint','accessibilityValue','accessibilityLanguage','title','alt','placeholder','label','description','empty','content','summary','caption','cta','message','text','closeLabel','cancelLabel','dismissLabel','busyLabel']);
/** Object keys, destructured props and variables whose string value is shown or announced. */
const VISIBLE_NAMES=new Set(['label','title','description','empty','message','text','placeholder','summary','caption','cta','content','accessibilityLabel','accessibilityHint','closeLabel','cancelLabel','dismissLabel','busyLabel','status']);
const COMPARISONS=new Set([ts.SyntaxKind.EqualsEqualsEqualsToken,ts.SyntaxKind.ExclamationEqualsEqualsToken,ts.SyntaxKind.EqualsEqualsToken,ts.SyntaxKind.ExclamationEqualsToken]);
const nameOf=node=>node&&(ts.isIdentifier(node)||ts.isStringLiteral(node)||ts.isPrivateIdentifier(node)?node.text:ts.isJsxNamespacedName?.(node)?`${node.namespace.text}:${node.name.text}`:undefined);

/** Returns why a literal is user-facing, or null when it is code (ids, roles, styles, comparisons, imports). */
function context(node){
 let child=node;
 for(let parent=node.parent;parent;child=parent,parent=parent.parent){
  if(ts.isJsxAttribute(parent))return VISIBLE_ATTRIBUTES.has(nameOf(parent.name))?`${nameOf(parent.name)} attribute`:null;
  if(ts.isJsxExpression(parent)&&parent.parent&&(ts.isJsxElement(parent.parent)||ts.isJsxFragment(parent.parent)))return 'JSX child';
  if(ts.isBinaryExpression(parent)&&COMPARISONS.has(parent.operatorToken.kind))return null;
  if(ts.isElementAccessExpression(parent)&&parent.argumentExpression===child)return null;
  if(ts.isCaseClause(parent)||ts.isLiteralTypeNode(parent)||ts.isImportDeclaration(parent)||ts.isExportDeclaration(parent)||ts.isExternalModuleReference(parent)||ts.isTypeNode(parent))return null;
  if(ts.isCallExpression(parent)&&parent.arguments.includes(child)){const callee=ts.isIdentifier(parent.expression)?parent.expression.text:ts.isPropertyAccessExpression(parent.expression)?parent.expression.name.text:'';if(/^set[A-Z]/.test(callee))return `${callee}() argument`;if(callee==='require')return null;continue;}
  if(ts.isPropertyAssignment(parent)){if(parent.name===child)return null;const key=nameOf(parent.name);if(VISIBLE_NAMES.has(key))return `${key} property`;return null;}
  if((ts.isBindingElement(parent)||ts.isParameter(parent)||ts.isVariableDeclaration(parent))&&parent.initializer===child){const key=ts.isBindingElement(parent)?nameOf(parent.propertyName??parent.name):nameOf(parent.name);return VISIBLE_NAMES.has(key)||/(Label|Text|Title|Message)$/.test(key??'')?`${key} default`:null;}
 }
 return null;
}
function staticText(node){
 if(ts.isStringLiteral(node)||ts.isNoSubstitutionTemplateLiteral(node))return node.text;
 if(ts.isTemplateExpression(node))return [node.head.text,...node.templateSpans.map(s=>s.literal.text)].join(' ');
 if(ts.isJsxText(node))return node.text;
 return undefined;
}
/** Scans one source text; returns `{line,text,reason}` for each hard-coded user-facing literal. */
export function findBuiltInStrings(source,fileName='source.tsx'){
 const file=ts.createSourceFile(fileName,source,ts.ScriptTarget.Latest,true,fileName.endsWith('.tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
 const found=[];
 const visit=node=>{
  const text=staticText(node);
  if(text!==undefined&&WORD.test(text)){
   const reason=ts.isJsxText(node)?'JSX text':context(node);
   if(reason)found.push({line:file.getLineAndCharacterOfPosition(node.getStart(file)).line+1,text:text.trim(),reason});
  }
  ts.forEachChild(node,visit);
 };
 visit(file);
 return found;
}
const root=fileURLToPath(new URL('..',import.meta.url));
export const scannedDirectories=['packages/react/src','packages/chart/src','packages/native/src'];
/** Scans HIG React (including the @bloxwap/hig-chart adapter) and React Native sources. */
export function scanPackages(base=root){
 const results=[];
 for(const dir of scannedDirectories){
  for(const name of readdirSync(join(base,dir),{recursive:true}).map(String).filter(n=>/\.(ts|tsx)$/.test(n)&&!n.endsWith('.d.ts')).sort()){
   const path=join(base,dir,name);
   for(const hit of findBuiltInStrings(readFileSync(path,'utf8'),path))results.push({file:relative(base,path),...hit});
  }
 }
 return results;
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
 const hits=scanPackages();
 if(hits.length){
  for(const h of hits)console.error(`${h.file}:${h.line} ${h.reason}: ${JSON.stringify(h.text)}`);
  console.error(`\n${hits.length} hard-coded built-in string(s). Add a key to HIGMessages (packages/contracts/src/messages.ts), read it with useMessages(), and document it in docs/foundations/localization.md.`);
  process.exit(1);
 }
 console.log('Built-in string check passed: React and React Native copy comes from HIGProvider messages or props');
}
