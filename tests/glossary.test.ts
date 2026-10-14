import {it,expect} from 'vitest';
import {readFileSync,existsSync} from 'node:fs';
import {formatNumber} from '../packages/contracts/src/index';
const glossary=JSON.parse(readFileSync('docs/foundations/glossary.json','utf8'));
const localization=JSON.parse(readFileSync('docs/foundations/localization.json','utf8'));
const markdown=readFileSync('docs/foundations/glossary.md','utf8');
const required=['perp','leverage','margin','position','liquidation-price','funding','pnl','long','short','stop','take-profit','notional','builder-fee'];
it('locks required trading terms with definition, usage, examples and untranslated policy',()=>{
 expect(glossary.canonicalLocale).toBe('en-US');
 expect(glossary.requiredTermIds).toEqual(required);
 expect(glossary.locales).toEqual([expect.objectContaining({id:'en-US',status:'approved'})]);
 const ids=glossary.terms.map((t:{id:string})=>t.id);
 expect(ids).toEqual(expect.arrayContaining(required));
 expect(new Set(ids).size).toBe(ids.length);
 for(const term of glossary.terms){
  expect(term.definition.length).toBeGreaterThan(40);
  expect(term.usageNotes.length).toBeGreaterThan(20);
  expect(term.do.length).toBeGreaterThan(0);
  expect(term.dont.length).toBeGreaterThan(0);
  expect(['never','short-form','always']).toContain(term.untranslated);
  expect(Object.keys(term.translations)).toEqual(['en-US']);
  expect(term.translations['en-US'].term).toBeTruthy();
  expect(term.translations['en-US'].definition).toBe(term.definition);
  expect(markdown).toContain(`\`${term.id}\``);
  expect(markdown.toLowerCase()).toContain(term.term.toLowerCase());
 }
});
it('leaves unapproved locales as todo instead of guessed translations',()=>{
 for(const locale of glossary.pendingLocales){
  expect(locale.status).toBe('todo');
  expect(locale.note).toMatch(/do not guess/i);
 }
 expect(markdown).toMatch(/Change process/);
 expect(markdown).toContain('docs/foundations/glossary.json');
 const localizationGuide=readFileSync('docs/foundations/localization.md','utf8');
 expect(localizationGuide).toContain('glossary.json');
 for(const needle of ['Number','Currency','Date','Leverage','RTL','Intl.NumberFormat','signDisplay','compact'])expect(localizationGuide).toContain(needle);
 expect(localization.glossary).toBe('docs/foundations/glossary.json');
 expect(existsSync('apps/docs/public/glossary.json')).toBe(true);
 expect(readFileSync('apps/docs/public/glossary.json','utf8')).toBe(readFileSync('docs/foundations/glossary.json','utf8'));
});
it('pins Intl format examples so compact/currency/percent are not hand-rolled',()=>{
 for(const [locale,profile] of Object.entries(localization.locales) as [string,{examples:Record<string,{value:number;options:Intl.NumberFormatOptions;formatted:string}>}][]){
  for(const example of Object.values(profile.examples)){
   expect(formatNumber(example.value,locale,example.options)).toBe(example.formatted);
  }
 }
 expect(formatNumber(null)).toBe('—');
 expect(localization.rules.usdcCurrencyCode).toBeNull();
 expect(localization.rules.leverageSuffix).toBe('×');
 expect(localization.helper.function).toBe('formatNumber');
});
