import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
import postcss from 'postcss';

// Require explicit paired stops even for token durations: this also covers hosts
// importing component CSS without tokens and catches accidentally deleted selectors.
describe('reduced motion for every shipped CSS declaration',()=>{
 it.each(['styles.css','base.css'])('%s stops motion in both preference paths',file=>{
  const root=postcss.parse(readFileSync(`packages/hig/react/src/${file}`,'utf8'));
  const stops={media:new Set<string>(),provider:new Set<string>()};
  root.walkDecls(/^(transition|animation)$/,decl=>{
   if(decl.value!=='none')return;
   const rule=decl.parent as postcss.Rule;
   for(const selector of rule.selectors){
    if(rule.parent?.type==='atrule'&&/prefers-reduced-motion:\s*reduce/.test((rule.parent as postcss.AtRule).params))stops.media.add(`${selector}|${decl.prop}`);
    if(selector.startsWith("[data-hig-motion='reduced'] "))stops.provider.add(`${selector.replace("[data-hig-motion='reduced'] ",'')}|${decl.prop}`);
   }
  });
  root.walkDecls(/^(transition|animation)(-|$)/,decl=>{
   if(/^(none|0s|0ms)$/.test(decl.value))return;
   const rule=decl.parent as postcss.Rule;
   for(const selector of rule.selectors){
    for(const path of ['media','provider'] as const)expect(stops[path].has(`${selector}|${decl.prop.split('-')[0]}`),`${file}: ${selector} ${decl.prop}: ${decl.value} missing ${path} stop`).toBe(true);
   }
   const withoutTokens=decl.value.replace(/var\(--hig-motion-duration-[\w-]+(?:,[^)]+)?\)/g,'');
   // Infinite loading indicators intentionally have slower, legible loop periods.
   if(!/animation/.test(decl.prop)||!decl.value.includes('infinite'))expect(withoutTokens).not.toMatch(/(?:\d*\.)?\d+m?s\b/);
   else expect(rule.selector).toMatch(/^\.hig-(spinner-indicator|progress progress:not\(\[value\]\))$/);
  });
 });
});
