import {readFileSync} from 'node:fs';
import {assertCSSDeclarations} from './css-exports.mjs';
const directory='packages/hig';
assertCSSDeclarations(JSON.parse(readFileSync(`${directory}/package.json`,'utf8')),directory);
console.log('Every CSS export has an included declaration');
