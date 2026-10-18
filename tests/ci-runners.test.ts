import {it,expect} from 'vitest';
import {readFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
// @ts-expect-error Executable JavaScript baseline path helper.
import {visualBaselinePath} from '../scripts/visual-baseline.mjs';

const workflows=['quality.yml','docs.yml'].map(name=>[name,readFileSync(join('.github/workflows',name),'utf8')] as const);

it('every GitHub Actions job runs on self-hosted macOS ARM64 without apt, sudo or Playwright --with-deps',()=>{
 for(const [name,text] of workflows){
  expect(text,name).toContain('runs-on: [self-hosted, macOS, ARM64]');
  expect(text,name).not.toMatch(/ubuntu-|--with-deps|\bapt-get\b|\bsudo /);
  expect(text,name).not.toContain('runner.temp');
  expect(text.match(/runs-on:/g)?.length,name).toBe(text.match(/\[self-hosted, macOS, ARM64\]/g)?.length);
 }
 expect(readFileSync('.github/workflows/quality.yml','utf8')).toContain('~/Library/Caches/ms-playwright');
 expect(readFileSync('.github/workflows/quality.yml','utf8')).toContain('TMPDIR=$RUNNER_TEMP');
 expect(readFileSync('.github/workflows/quality.yml','utf8')).not.toContain('actions/setup-python');
 expect(readFileSync('.github/workflows/quality.yml','utf8').match(/ci-setup-python\.sh/g)?.length).toBe(3);
 expect(readFileSync('.github/workflows/docs.yml','utf8')).toContain('command -v gtar');
 expect(readFileSync('.github/workflows/docs.yml','utf8')).toContain('TMPDIR=$RUNNER_TEMP');
 expect(readFileSync('docs/ci-runners.md','utf8')).toContain('LaunchAgent');
 expect(readFileSync('docs/ci-runners.md','utf8')).toContain('plugin-container.app');
 const python=readFileSync('scripts/ci-setup-python.sh','utf8');
 expect(python).toContain('RUNNER_TEMP');
 expect(python).toContain('/Users/runner/hostedtoolcache');
 expect(python).toContain('uv-aarch64-apple-darwin');
 expect(python).toContain('cfe454573412ff7380d15fc7dae5997ab53ffce72fce0a78e91ddbc84001acd2');
 expect(python).not.toMatch(/\bapt-get\b|\bsudo /);
});

it('keeps Linux visual baselines under tests/visual-baselines/linux and names Darwin separately',()=>{
 expect(visualBaselinePath('button-default','linux')).toBe('tests/visual-baselines/linux/button-default.png');
 expect(visualBaselinePath('slider-focus-compact','darwin')).toBe('tests/visual-baselines/darwin/slider-focus-compact.png');
 expect(readdirSync('tests/visual-baselines/linux').filter(f=>f.endsWith('.png')).sort()).toEqual([
  'button-busy.png','button-default.png','button-disabled.png','field-default.png','field-error.png',
  'input-default.png','input-disabled.png','input-error.png','slider-focus-comfortable.png','slider-focus-compact.png'
 ]);
});
