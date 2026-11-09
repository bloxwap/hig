import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';

// Hosts must not need their own sticky-hover overrides: an override keyed to HIG class names silently stops matching
// when a release renames a class or raises a rule's specificity. HIG owns the gate, and this suite keeps it closed.
const read=(file:string)=>readFileSync(`packages/hig/react/src/${file}`,'utf8').replace(/\/\*[\s\S]*?\*\//g,'');
function styleRules(source:string){
 const rules:{selector:string;at:string[];body:string}[]=[];const stack:string[]=[];let buffer='';
 for(const char of source){
  if(char==='{'){stack.push(buffer.trim());buffer='';}
  else if(char==='}'){const prelude=stack.pop()??'';if(!prelude.startsWith('@'))rules.push({selector:prelude,at:stack.filter(p=>p.startsWith('@')),body:buffer});buffer='';}
  else buffer+=char;
 }
 return rules;
}
const hoverGate=/^@media\s*\(hover:\s*hover\)\s*and\s*\(pointer:\s*fine\)$/;

describe('touch-safe component CSS',()=>{
 it.each(['styles.css','base.css'])('keeps every :hover rule in %s behind (hover: hover) and (pointer: fine)',file=>{
  const ungated=styleRules(read(file)).filter(rule=>rule.selector.includes(':hover')&&!rule.at.some(at=>hoverGate.test(at)));
  expect(ungated.map(rule=>rule.selector)).toEqual([]);
 });
 it('gates the hover states hosts used to override (button, ghost button, table sort)',()=>{
  const gated=styleRules(read('styles.css')).filter(rule=>rule.at.some(at=>hoverGate.test(at))).map(rule=>rule.selector);
  for(const selector of ['.hig-button:hover:not(:disabled)',".hig-button[data-intent='ghost']:hover:not(:disabled)",'.hig-table-sort:hover'])expect(gated).toContain(selector);
 });
 it('gives HIG controls touch behaviour without styling the page',()=>{
  const rules=styleRules(read('styles.css'));
  const touch=rules.find(rule=>rule.selector.startsWith(':where(')&&rule.body.includes('touch-action:manipulation'));
  expect(touch?.selector).toMatch(/\.hig-button/);
  for(const declaration of ['-webkit-tap-highlight-color:transparent','user-select:none','-webkit-touch-callout:none'])expect(touch?.body).toContain(declaration);
  expect(rules.filter(rule=>/(^|[\s,>])(html|body)\b/.test(rule.selector)).map(rule=>rule.selector)).toEqual([]);
 });
});
