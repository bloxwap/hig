// Every contract from one module. Inside HIG, import the specific module instead (`@bloxwap/hig/contracts/environment`,
// `@bloxwap/hig/contracts/format`, ...): a bundler without unused-export removal, such as Metro, ships all of this file's imports.
export * from './environment.js';
export * from './format.js';
export interface FontManifest { version: string; faces: ReadonlyArray<{family:string; weight:number; asset:string; script:string; registration?:string}> }
export function nativeFont(manifest: FontManifest, family: string, weight: number, script = 'latin'): string {
 const face = manifest.faces.find(f=>f.family===family && f.weight===weight && f.script===script);
 if (!face) throw new Error(`Register a pinned ${family} ${weight} ${script} native face`);
 return face.registration??face.family;
}

export {assertUniqueKeys,numericRange,progressValue,paginationValue} from './invariants.js';
export {decimal,decimalMultiply,decimalDivide,decimalCompare,localizeDecimal} from './decimal.js';

export {filterLanguages} from './language-search.js';

export {rankPickerTokens} from './rank-picker-tokens.js';

export {createPickerSearch,fuzzyMatch} from './picker-search.js';
