import {glob, readFile, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import Beasties from 'beasties';
import {basePath} from '../site-config.mjs';

const output = new URL('../out/', import.meta.url);
const optimizer = new Beasties({
  path: fileURLToPath(output),
  publicPath: basePath + '/',
  preload: 'media',
  preloadFonts: false,
  inlineFonts: true,
  pruneSource: false,
  // These relational selectors reserve the header, sidebar and TOC grid tracks.
  allowRules: [/:has\(\.[^)]*--fd-/],
});
// Beasties keeps URL-backed fonts and drops local() faces. Keep the metric-matched
// fallback in the critical stylesheet to preserve text metrics while Sans downloads.
const fallbackFace = await readFile(new URL('../src/font-fallback.css', import.meta.url), 'utf8');

for await (const page of glob(['index.html', 'docs/**/index.html'], {cwd: fileURLToPath(output)})) {
  const file = new URL(page, output);
  const html = await readFile(file, 'utf8');
  const optimized = await optimizer.process(html);
  // Preserve the original body, including MDX whitespace and React hydration data.
  const headEnd = optimized.indexOf('</head>');
  const head = optimized.slice(0, headEnd).replace('</style>', () => fallbackFace + '</style>');
  await writeFile(file, head + html.slice(html.indexOf('</head>')));
}
