import {expect, it} from 'vitest';
import {readFileSync} from 'node:fs';
// @ts-expect-error Executable CI plan.
import {qualityTasks, qualityPlan} from '../scripts/ci-quality-tasks.mjs';
// @ts-expect-error Executable browser plan.
import {browserGates, selectBrowserGates} from '../scripts/browser-gates.mjs';

const workflow = readFileSync('.github/workflows/quality.yml', 'utf8');
const matrix = (key: string) => workflow.match(new RegExp(`        ${key}: \\[([^\\]]+)\\]`))![1].split(', ');

it('schedules every quality and browser lane exactly once, with every result required', () => {
 expect(matrix('task').sort()).toEqual(Object.keys(qualityTasks).sort());
 expect(matrix('gate').sort()).toEqual(browserGates.map((gate: {name: string}) => gate.name).sort());
 expect(new Set(matrix('gate')).size).toBe(18);
 expect(matrix('profile')).toEqual(['rn-0.81', 'rn-0.83', 'rn-0.88']);
 expect(workflow.match(/fail-fast: false/g)).toHaveLength(3);
 expect(workflow).not.toMatch(/^\s+max-parallel:/m);
 expect(workflow).toContain('needs: [paths-filter, compiler, quality, native, browser, linux-visual, release-security]');
 for (const family of ['QUALITY', 'NATIVE', 'BROWSER']) expect(workflow).toContain(`$${family}`);
 expect(workflow).toContain('if [ "$result" != success ]');
 for (const key of ['task', 'profile', 'gate']) expect(workflow).toMatch(new RegExp(`name: hig-candidate-.*\\$\\{\\{ matrix\\.${key} \\}\\}`));
});

it('retains all checks and builds their inputs before running consumers', () => {
 const scripts = Object.values(qualityTasks).flat();
 for (const script of ['lint','typecheck','test:web','test:native','examples:check','quality','smoke:ssr','smoke:packed','smoke:packed-compat','smoke:packed-og','smoke:packed-boundaries','smoke:packed-chart-workspace','smoke:packed-fumadocs','smoke:packed-examples','smoke:packed-next','smoke:packed-css','smoke:packed-react-css','release:dry-run','smoke:release-artifact']) expect(scripts.filter(value => value === script)).toHaveLength(1);
 for (const name of Object.keys(qualityTasks)) {
  const plan = qualityPlan(name);
  if (name.startsWith('packed')) {
   const build = plan.findIndex(([, args]: [string, string[]]) => args.includes('scripts/build.mjs'));
   const pack = plan.findIndex(([, args]: [string, string[]]) => args[0] === 'pack');
   expect(build).toBeGreaterThanOrEqual(0);
   expect(pack).toBeGreaterThan(build);
   expect(plan.at(-1)[1]).toEqual(['run', `smoke:${name}`]);
  }
 }
 expect(qualityPlan('unit-web')[0][1]).toEqual(['run', 'build']);
 expect(qualityPlan('release').map(([, args]: [string, string[]]) => args)).toEqual([
  ['run','release:dry-run','--','--channel','candidate'], ['run','smoke:release-artifact','--','candidate'],
 ]);
 expect(() => qualityPlan('typo')).toThrow('Unknown quality task');
});

it('selects only the required preview and fails closed on a missing browser suite', () => {
 expect(selectBrowserGates()).toEqual(browserGates);
 for (const gate of browserGates) expect(selectBrowserGates(gate.name)).toEqual([gate]);
 expect(selectBrowserGates('next')[0].server).toBe('next');
 expect(selectBrowserGates('native-action')[0].server).toBeUndefined();
 expect(selectBrowserGates('confetti')[0].server).toBe('expo');
 expect(selectBrowserGates(undefined, true)[0].name).toBe('catalog');
 expect(() => selectBrowserGates('typo')).toThrow('Unknown browser gate');
 expect(() => selectBrowserGates('next', true)).toThrow('Visual-only');
});

it('preserves the branch-required quality context and propagates candidate failures', () => {
 const aggregate = workflow.split('  quality-result:')[1];
 expect(aggregate).toContain('name: quality');
 expect(aggregate).toContain('needs: candidate');
 expect(aggregate).toContain('always() && !cancelled()');
 expect(aggregate).toContain('RESULT: ${{ needs.candidate.result }}');
 expect(aggregate).toContain('run: test "$RESULT" = success');
});

it('isolates Bun executables between runner services sharing a home directory', () => {
 expect(workflow).not.toContain('uses: oven-sh/setup-bun');
 expect(readFileSync('.github/workflows/docs.yml', 'utf8')).not.toContain('uses: oven-sh/setup-bun');
 const setup = readFileSync('.github/actions/setup-bun/setup.sh', 'utf8');
 expect(setup).toContain('mktemp -d "$RUNNER_TEMP/hig-bun.XXXXXX"');
 expect(setup).toContain('--ignore-scripts');
 expect(setup).toContain('"$package@1.4.2"');
 expect(setup).toContain('>> "$GITHUB_PATH"');
});
