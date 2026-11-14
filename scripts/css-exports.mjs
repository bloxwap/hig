import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {join} from 'node:path';

const targets=value=>typeof value==='string'?[value]:Object.values(value??{}).flatMap(targets);
export const cssExports=manifest=>Object.entries(manifest.exports).filter(([,value])=>targets(value).some(target=>target.endsWith('.css')));

// Run against both the source package (lint) and the installed tarball (consumer smoke).
export function assertCSSDeclarations(manifest,directory){
 const entries=cssExports(manifest);
 assert.ok(entries.length,'Expected stylesheet exports');
 for(const [key,value] of entries){
  assert.equal(Object.keys(value)[0],'types',`${key}: stylesheet export needs a first types condition`);
  assert.match(value.types,/\.d\.ts$/,`${key}: types must name a declaration`);
  assert.ok(existsSync(join(directory,value.types)),`${key}: declaration ${value.types} is missing`);
  const relative=value.types.replace(/^\.\//,'');
  assert.ok(manifest.files.some(file=>relative===file||relative.startsWith(`${file}/`)),`${key}: declaration must be included in files`);
 }
 return entries;
}
