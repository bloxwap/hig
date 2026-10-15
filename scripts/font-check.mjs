import assert from 'node:assert/strict';
// #65: resolve the element's computed first family, load it and require a loaded FontFace of that family.
// document.fonts.check alone also returns true when no face matches, so the FontFace status is asserted too.
export async function assertLoadedFace(page,selector,expected){
 const result=await page.evaluate(async selector=>{
  await document.fonts.ready;const element=document.querySelector(selector);if(!element)return {missing:true};
  const style=getComputedStyle(element),family=style.fontFamily.split(',')[0].trim().replace(/^["']|["']$/g,'');
  const spec=`${style.fontStyle} ${style.fontWeight} ${style.fontSize} "${family}"`;await document.fonts.load(spec,element.textContent||'0');
  const faces=[...document.fonts].filter(face=>face.family.replace(/^["']|["']$/g,'')===family);
  return {fontFamily:style.fontFamily,family,spec,check:document.fonts.check(spec,element.textContent||'0'),loaded:faces.some(face=>face.status==='loaded')};
 },selector);
 assert.ok(!result.missing,`${selector} renders`);
 assert.match(result.family,expected,`${selector} uses a Bloxwap face: ${result.fontFamily}`);
 assert.equal(result.check,true,`document.fonts.check(${result.spec})`);
 assert.equal(result.loaded,true,`${selector} face ${result.family} is loaded, not a system fallback`);
 return result;
}
