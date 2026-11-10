import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';
// @ts-expect-error Executable package export guard.
import {assertCSSDeclarations} from '../scripts/css-exports.mjs';

const directory='packages/hig';
const manifest=JSON.parse(readFileSync(`${directory}/package.json`,'utf8'));
describe('shipped stylesheet declarations',()=>{
 it('covers every CSS target in the export map',()=>{
  expect(assertCSSDeclarations(manifest,directory).length).toBeGreaterThan(0);
 });
 it('rejects a new CSS export without a declaration',()=>{
  const broken=structuredClone(manifest);
  broken.exports['./future/css']='./react/dist/future.css';
  expect(()=>assertCSSDeclarations(broken,directory)).toThrow('stylesheet export needs a first types condition');
 });
 it('rejects a declaration omitted from the package files',()=>{
  const broken=structuredClone(manifest);
  broken.files=broken.files.filter((file:string)=>file!=='css.d.ts');
  expect(()=>assertCSSDeclarations(broken,directory)).toThrow('declaration must be included in files');
 });
});
