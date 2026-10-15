import {readFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
import ts from 'typescript';
import {it,expect} from 'vitest';
// #62: every user-visible or accessible string in the renderers comes from HIGProvider messages or a prop.
// Technical literals (class names, roles, layout values, key names) are allowed by context; anything else fails.
const roots=['packages/react/src','packages/native/src'];
const files=roots.flatMap(root=>readdirSync(root,{recursive:true,encoding:'utf8'}).filter(f=>/\.tsx?$/.test(f)).map(f=>join(root,f)));
/** JSX attributes whose values are never shown or spoken. */
const technicalAttributes=new Set(['className','role','type','intent','id','key','htmlFor','name','dir','lang','inputMode','autoComplete','autoCapitalize','autoCorrect','keyboardType','textContentType','returnKeyType','enterKeyHint','accessibilityRole','accessibilityLiveRegion','importantForAccessibility','aria-live','aria-current','aria-sort','aria-haspopup','aria-orientation','aria-autocomplete','pointerEvents','animationType','behavior','keyboardShouldPersistTaps','keyboardBehavior','keyboardBlurBehavior','android_keyboardInputMode','pressBehavior','stackBehavior','resizeMode','ellipsizeMode','severity','state','density','direction','sizes','loading','decoding','target','rel','method','scope','fill','stroke','viewBox','d','fillRule','clipRule','strokeLinecap','strokeLinejoin','xmlns','preserveAspectRatio','testID','nativeID','data-testid','href','src','mode','variant','textAlign','placement','side','align','collapsable','textAlignVertical','monoFamily']);
/** Object keys whose values are layout, style, platform or protocol values. */
const technicalKeys=new Set(['style','className','fontFamily','monoFamily','currency','notation','compactDisplay','signDisplay','fontWeight','fontStyle','fontFamily','fontVariant','position','display','flexDirection','flexWrap','alignItems','alignSelf','alignContent','justifyContent','textAlign','textAlignVertical','writingDirection','direction','overflow','textDecorationLine','textTransform','borderStyle','resizeMode','intent','origin','source','severity','state','ios','android','web','default','native','role','type','unit','unitDisplay','hourCycle','timeZone','timeZoneName','maximumSignificantDigits']);
function context(node:ts.Node):string|null{
 let child:ts.Node=node;let parent=node.parent;
 while(parent&&(ts.isParenthesizedExpression(parent)||ts.isAsExpression(parent)||ts.isConditionalExpression(parent)&&child!==parent.condition||ts.isBinaryExpression(parent)&&parent.operatorToken.kind===ts.SyntaxKind.QuestionQuestionToken||ts.isBinaryExpression(parent)&&parent.operatorToken.kind===ts.SyntaxKind.BarBarToken)){child=parent;parent=parent.parent;}
 if(!parent)return 'technical';
 if(ts.isTemplateSpan(parent)||ts.isJsxExpression(parent)&&(ts.isJsxElement(parent.parent)||ts.isJsxFragment(parent.parent)))return 'visible';
 if(ts.isImportDeclaration(parent)||ts.isExportDeclaration(parent)||ts.isExternalModuleReference(parent)||ts.isLiteralTypeNode(parent)||ts.isExpressionStatement(parent))return 'technical';
 if(ts.isCallExpression(parent)&&/^(require|import|createElement|querySelector|matches|closest|getElementById|addEventListener|removeEventListener|matchMedia|sendAccessibilityEvent|getPropertyValue|requireNativeComponent|hasViewManagerConfig|setProperty)$/.test(parent.expression.getText().split('.').pop()!.replace('?','')))return 'technical';
 if(ts.isBinaryExpression(parent)&&[ts.SyntaxKind.EqualsEqualsEqualsToken,ts.SyntaxKind.ExclamationEqualsEqualsToken,ts.SyntaxKind.EqualsEqualsToken,ts.SyntaxKind.ExclamationEqualsToken].includes(parent.operatorToken.kind))return 'technical';
 if(ts.isCaseClause(parent)||ts.isElementAccessExpression(parent))return 'technical';
 const spoken=/^aria-(label|description|roledescription|valuetext|placeholder)$/;
 if(ts.isJsxAttribute(parent)){const name=parent.name.getText();if(name.startsWith('aria-')&&!spoken.test(name))return 'technical';return technicalAttributes.has(name)||name.startsWith('data-')||name.startsWith('on')?'technical':`attribute ${name}`;}
 if(ts.isJsxExpression(parent)&&ts.isJsxAttribute(parent.parent)){const name=parent.parent.name.getText();if(name.startsWith('aria-')&&!spoken.test(name))return 'technical';return technicalAttributes.has(name)||name.startsWith('data-')||name.startsWith('on')?'technical':`attribute ${name}`;}
 if(ts.isPropertyAssignment(parent)&&child===parent.name)return 'technical';
 if(ts.isPropertyAssignment(parent)&&child===parent.initializer){const key=parent.name.getText().replace(/['"]/g,'');if(technicalKeys.has(key))return 'technical';let owner:ts.Node|undefined=parent.parent;while(owner&&!ts.isJsxAttribute(owner)&&!ts.isPropertyAssignment(owner)&&!ts.isSourceFile(owner))owner=owner.parent;if(owner&&(ts.isJsxAttribute(owner)||ts.isPropertyAssignment(owner))&&/^(style|.*Style|contentContainerStyle|backgroundStyle|handleIndicatorStyle|accessibilityState|accessibilityValue|options|supportedOrientations)$/.test(owner.name.getText()))return technicalKeys.has(key)||owner.name.getText()!=='accessibilityValue'?'technical':null;return null;}
 if(ts.isArrayLiteralExpression(parent)&&ts.isVariableDeclaration(parent.parent)&&/Orientations$/.test(parent.parent.name.getText()))return 'technical';
 return null;
}
function findings(file:string){
 const source=ts.createSourceFile(file,readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);const found:string[]=[];
 const report=(node:ts.Node,text:string)=>found.push(`${file}:${source.getLineAndCharacterOfPosition(node.getStart()).line+1} ${JSON.stringify(text.trim())}`);
 const visit=(node:ts.Node)=>{
  if(ts.isJsxText(node)&&/\p{L}/u.test(node.text))report(node,node.text);
  else if((ts.isStringLiteral(node)||ts.isNoSubstitutionTemplateLiteral(node))&&/\p{L}/u.test(node.text)&&node.text!=='use client'){
   const where=context(node);
   // Lower-case single tokens ('center', 'secondary') are identifiers unless they flow into a template or an accessible attribute.
   const identifier=where===null&&/^[a-z][\w-]*$/.test(node.text);
   if(where!=='technical'&&!identifier)report(node,node.text);
  }else if(ts.isTemplateExpression(node)){
   const parts=[node.head.text,...node.templateSpans.map(s=>s.literal.text)].join('${}');
   if(/\p{L}{2,}/u.test(parts)&&/\p{Lu}|\s|[:(]/u.test(parts.replaceAll('${}',''))&&context(node)!=='technical')report(node,parts);
  }
  ts.forEachChild(node,visit);
 };
 visit(source);return found;
}
it('renderers contain no hard-coded user-facing English (use HIGProvider messages or a prop override)',()=>{
 expect(files.length).toBeGreaterThan(20);
 expect(files.flatMap(findings)).toEqual([]);
});
it('the literal scanner catches visible text, accessible names and composed templates',()=>{
 const probe=join('tests','fixtures-localization-probe.tsx');
 const sample=`export const A=()=><button aria-label='Close dialog' title={busy?'Working':label}>Close{' '}<span>{\`\${count} results\`}</span>{n===1?'result':'results'}</button>;`;
 const source=ts.createSourceFile(probe,sample,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 const found:string[]=[];const visit=(node:ts.Node)=>{if(ts.isJsxText(node)&&/\p{L}/u.test(node.text))found.push(node.text);else if((ts.isStringLiteral(node)||ts.isNoSubstitutionTemplateLiteral(node))&&/\p{L}/u.test(node.text)){const where=context(node);const identifier=where===null&&/^[a-z][\w-]*$/.test(node.text);if(where!=='technical'&&!identifier)found.push(node.text);}else if(ts.isTemplateExpression(node))found.push('template');ts.forEachChild(node,visit);};visit(source);
 expect(found).toEqual(expect.arrayContaining(['Close dialog','Working','Close','template','result','results']));
});
