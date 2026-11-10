import {join} from 'node:path';
/** Per-OS catalog captures. Linux and Darwin Chromium pixels can differ; thresholds stay 2%/24-channel. */
export function visualBaselineDir(platform=process.platform){return join('tests/visual-baselines',platform);}
export function visualBaselinePath(slug,platform=process.platform){return join(visualBaselineDir(platform),`${slug}.png`);}

// Shared with the capture loop and baseline inventory test.
export const baselineNames=new Set(['Button','Field','Input']);
export const focusBaselineNames=new Set(['Slider']);
export const focusDensities=['comfortable','compact'];
export function visualBaselineSlugs(catalog){return catalog.flatMap(entry=>[
 ...(baselineNames.has(entry.name)?entry.states.map(state=>`${entry.slug}-${state}`):[]),
 ...(focusBaselineNames.has(entry.name)?focusDensities.map(density=>`${entry.slug}-focus-${density}`):[]),
]);}
