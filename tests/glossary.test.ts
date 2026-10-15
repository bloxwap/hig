import {it,expect} from 'vitest';
import {readFileSync,existsSync} from 'node:fs';
import {formatNumber,formatLeverage,formatTicker,formatZonedTime} from '../packages/contracts/src/index';
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
it('ships shared helpers for leverage, ticker amounts and zoned funding clocks',()=>{
 const ws=(s:string)=>s.replace(/\s/g,' ');
 expect(formatLeverage(10)).toBe('10×');
 expect(formatLeverage(2.5,'de-DE')).toBe('2,5×');
 expect(formatLeverage(10,'ar-EG')).toBe('١٠×');
 expect(formatLeverage(10,'en-US',{style:'percent'})).toBe('10×');
 expect(formatLeverage(null)).toBe('—');
 expect(formatLeverage(Number.NaN)).toBe('—');
 expect(formatTicker(1234.5,'USDC','en-US',{minimumFractionDigits:2})).toBe('1,234.50\u00a0USDC');
 expect(formatTicker(12.34,'USDC','en-US',{signDisplay:'exceptZero'})).toBe('+12.34\u00a0USDC');
 expect(formatTicker(-12.34,'USDC','de-DE',{signDisplay:'exceptZero'})).toBe('-12,34\u00a0USDC');
 expect(formatTicker(5,'USDC','en-US',{style:'currency',currency:'USD'})).not.toContain('$');
 expect(formatTicker(undefined,'USDC')).toBe('—');
 const funding=Date.UTC(2026,9,14,16,0);
 expect(ws(formatZonedTime(funding,'en-US','UTC'))).toBe('4:00 PM UTC');
 expect(ws(formatZonedTime(new Date(funding),'de-DE','UTC'))).toBe('16:00 UTC');
 expect(ws(formatZonedTime(funding,'en-US','America/New_York'))).toBe('12:00 PM EDT');
 expect(formatZonedTime(null,'en-US','UTC')).toBe('—');
 expect(formatZonedTime(new Date(Number.NaN),'en-US','UTC')).toBe('—');
 for(const name of localization.helper.functions)expect(['formatNumber','formatLeverage','formatTicker','formatZonedTime']).toContain(name);
});
