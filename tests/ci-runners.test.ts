import {it,expect} from 'vitest';
import {readFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
// @ts-expect-error Executable JavaScript baseline path helper.
import {visualBaselinePath} from '../scripts/visual-baseline.mjs';

const workflows=readdirSync('.github/workflows').filter(name=>/\.ya?ml$/.test(name)&&name!=='publish.yml').map(name=>[name,readFileSync(join('.github/workflows',name),'utf8')] as const);

it('jobs other than publishing and Linux visuals use self-hosted macOS ARM64',()=>{
 for(const [name,workflow] of workflows){
  const linux=name==='quality.yml'?workflow.match(/^  linux-visual:\n[\s\S]*?(?=^  # Same job name)/m)?.[0]:undefined;
  if(name==='quality.yml'){
   expect(linux).toBeDefined();
   expect(linux).toContain('runs-on: ubuntu-latest');
   expect(linux).toContain("HIG_VISUAL_ONLY: '1'");
   expect(linux).toContain('playwright install --with-deps chromium');
   expect(linux).toContain('node scripts/run-browser-gates.mjs');
   expect(linux).not.toMatch(/self-hosted|webkit|HIG_UPDATE_VISUALS/);
   expect(workflow).toContain('needs: [paths-filter, quality, native, browser, linux-visual]');
   expect(workflow).toContain('"linux-visual:$LINUX_VISUAL"');
  }
  const text=linux?workflow.replace(linux,''):workflow;
  expect(text,name).toMatch(/runs-on: (?:\[self-hosted, macOS, ARM64\]|'\["self-hosted","macOS","ARM64"\]')/);
  expect(text,name).not.toMatch(/ubuntu-|--with-deps|\bapt-get\b|\bsudo /);
  expect(text,name).not.toContain('runner.temp');
  // Reusable-workflow callers pass the same runner as a JSON string input: runs-on: '["self-hosted","macOS","ARM64"]'.
  expect(text.match(/runs-on:/g)?.length,name).toBe(text.match(/runs-on: (?:\[self-hosted, macOS, ARM64\]|'\["self-hosted","macOS","ARM64"\]')/g)?.length);
 }
 expect(readFileSync('.github/workflows/quality.yml','utf8')).toContain('~/Library/Caches/ms-playwright');
 expect(readFileSync('.github/workflows/quality.yml','utf8')).not.toMatch(/path:\s*~\/Library\/Caches\/ms-playwright/);
 expect(readFileSync('.github/workflows/quality.yml','utf8')).toContain('TMPDIR=$RUNNER_TEMP');
 expect(readFileSync('.github/workflows/quality.yml','utf8')).toContain('bunx playwright install chromium webkit');
 expect(readFileSync('.github/workflows/quality.yml','utf8')).not.toContain('firefox');
 expect(readFileSync('.github/workflows/quality.yml','utf8')).not.toContain('actions/setup-python');
 expect(readFileSync('.github/workflows/quality.yml','utf8').match(/ci-setup-python\.sh/g)?.length).toBe(3);
 expect(readFileSync('.github/workflows/docs.yml','utf8')).toContain('command -v gtar');
 expect(readFileSync('.github/workflows/docs.yml','utf8')).toContain('TMPDIR=$RUNNER_TEMP');
 expect(readFileSync('docs/ci-runners.md','utf8')).toContain('playwright install chromium webkit');
 expect(readFileSync('docs/ci-runners.md','utf8')).toContain('do not save that folder with `actions/cache`');
 expect(readFileSync('docs/ci-runners.md','utf8')).not.toContain('install chromium firefox');
 expect(readFileSync('scripts/run-browser-gates.mjs','utf8')).toContain("['chromium','webkit']");
 expect(readFileSync('scripts/run-browser-gates.mjs','utf8')).not.toContain('firefox');
 expect(readFileSync('scripts/packed-css-smoke.mjs','utf8')).toContain("'chromium,webkit'");
 expect(readFileSync('scripts/packed-css-smoke.mjs','utf8')).not.toContain('firefox');
 expect(readFileSync('scripts/packed-react-css-smoke.mjs','utf8')).not.toContain('firefox');
 expect(readFileSync('scripts/acceptance-browser-smoke.mjs','utf8')).not.toContain('firefox');
 expect(readFileSync('scripts/feedback-browser-smoke.mjs','utf8')).not.toContain('firefox');
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

});

it('uses Ubuntu for trusted publishing within the publishing workflow',()=>{
 const text=readFileSync('.github/workflows/publish.yml','utf8');
 const jobs=text.split('jobs:')[1];
 expect([...jobs.matchAll(/^ {2}([\w-]+):$/gm)].map(match=>match[1])).toEqual(['security','prerequisites','publish']);
 expect(text.match(/runs-on: ubuntu-24\.04/g)).toHaveLength(1);
 expect(text.split('  prerequisites:')[1].split('  publish:')[0]).toContain('runs-on: [self-hosted, macOS, ARM64]');
 expect(text.match(/runs-on:/g)).toHaveLength(3);
 expect(text).toContain(`runs-on: '["self-hosted","macOS","ARM64"]'`);
 expect(text).toContain('needs: [security, prerequisites]');
 expect(text).toContain('npx playwright install --with-deps chromium');
 expect(text).toContain('actions/setup-python@');
});
