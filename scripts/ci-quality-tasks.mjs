import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';

// Each lane owns its checkout, build outputs, evidence and packed tarball.
export const qualityTasks = {
  checks: ['lint', 'typecheck', 'examples:check', 'quality', 'smoke:ssr'],
  'unit-web': ['test:web'],
  'unit-native': ['test:native'],
  packed: ['smoke:packed'],
  'packed-compat': ['smoke:packed-compat'],
  'packed-og': ['smoke:packed-og'],
  'packed-boundaries': ['smoke:packed-boundaries'],
  'packed-chart-workspace': ['smoke:packed-chart-workspace'],
  'packed-fumadocs': ['smoke:packed-fumadocs'],
  'packed-examples': ['smoke:packed-examples'],
  'packed-next': ['smoke:packed-next'],
  'packed-css': ['smoke:packed-css'],
  'packed-react-css': ['smoke:packed-react-css'],
  release: ['release:dry-run', 'smoke:release-artifact'],
};

export function qualityPlan(task, channel = 'candidate') {
  if (!['candidate', 'stable-simulation'].includes(channel)) throw Error(`Unknown release channel: ${channel}`);
  if (!Object.hasOwn(qualityTasks, task)) throw Error(`Unknown quality task: ${task}`);
  // release:dry-run rebuilds packages and docs itself before staging.
  const plan = task === 'release' ? [] : ['checks', 'unit-web'].includes(task)
    ? [['npm', ['run', 'build']], [process.execPath, ['scripts/check-generated-drift.mjs']]]
    : [['npm', ['run', 'generate']], [process.execPath, ['scripts/build.mjs']]];
  if (task.startsWith('packed')) plan.push(['npm', ['pack', './packages/hig', '--ignore-scripts', '--pack-destination', 'artifacts']]);
  for (const script of qualityTasks[task]) plan.push(['npm', ['run', script, ...(script === 'release:dry-run' ? ['--', '--channel', channel] : script === 'smoke:release-artifact' ? ['--', channel] : [])]]);
  return plan;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const {mkdirSync} = await import('node:fs');
  const plan = qualityPlan(process.env.HIG_QUALITY_TASK, process.env.HIG_RELEASE_CHANNEL);
  mkdirSync('artifacts', {recursive: true});
  for (const [command, args] of plan) execFileSync(command, args, {stdio: 'inherit'});
}
