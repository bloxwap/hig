import {execFileSync} from 'node:child_process';

// Run after the build: comparing to HEAD catches drift even when the build has
// already regenerated these files. Keep platform-dependent brand PNGs out of
// this text-only gate; their SVG source is covered by check-drift.mjs.
const paths = [
  'apps/docs/src/content.json', 'apps/docs/src/code.json',
  'apps/docs/src/demo-content.json', 'apps/docs/src/examples.tsx',
  'apps/docs/public/catalog.json', 'apps/docs/public/llms.txt',
  'apps/docs/public/localization.json', 'apps/docs/public/glossary.json',
  'apps/docs/public/markdown', 'docs/foundations/glossary.md',
  'planning/api-manifest.json', 'planning/anchors.json',
  'fixtures/native/gallery.tsx', 'fixtures/native/gallery-manifest.json',
];
const changed = execFileSync('git', ['diff', '--name-only', 'HEAD', '--', ...paths], {encoding: 'utf8'});
const added = execFileSync('git', ['ls-files', '--others', '--exclude-standard', '--', ...paths], {encoding: 'utf8'});
if (changed || added) {
  console.error(`Stale generated artifacts (regenerate and commit):\n${changed}${added}`);
  process.exitCode = 1;
} else {
  console.log('Committed docs and examples generation drift passed');
}
