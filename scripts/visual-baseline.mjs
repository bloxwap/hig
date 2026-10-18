import {join} from 'node:path';
/** Per-OS catalog captures. Linux and Darwin Chromium pixels can differ; thresholds stay 2%/24-channel. */
export function visualBaselineDir(platform=process.platform){return join('tests/visual-baselines',platform);}
export function visualBaselinePath(slug,platform=process.platform){return join(visualBaselineDir(platform),`${slug}.png`);}
