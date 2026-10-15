import {it,expect} from 'vitest';
import {mkdtempSync,mkdirSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
// @ts-expect-error Executable anti-drift gate (plain ESM, no types).
import {driftViolations,validateExceptions,scan} from '../scripts/drift.mjs';

const now=new Date('2026-10-15T00:00:00Z');
const rulesOf=(found:{rule:string}[])=>found.map(v=>v.rule).sort();

it('flags literal --hig-* token definitions but allows role remapping with var()',()=>{
  expect(rulesOf(driftViolations(':root{--hig-action:#0f0;}','app/global.css',[],{now}))).toEqual(['copied-token-definition']);
  expect(driftViolations("[data-hig-density='compact']{--hig-control:var(--hig-control-compact);}",'app/global.css',[],{now})).toHaveLength(0);
});

it('flags re-implemented primitives on bare .hig-* selectors but allows contextual layout overrides',()=>{
  expect(rulesOf(driftViolations('.hig-button{min-height:48px;background:green}','styles.css',[],{now}))).toEqual(['copied-primitive-css']);
  expect(driftViolations('.hero .hig-button{background:none}\n.hig-button{font-size:.875rem}','styles.css',[],{now})).toHaveLength(0);
});

it('flags copied HIG folders and retired forks, with repository-specific obsolete imports from config',()=>{
  expect(rulesOf(driftViolations("@import '../vendor/hig/tokens.css';",'app/global.css',[],{now}))).toEqual(['obsolete-import']);
  expect(rulesOf(driftViolations("import {Button} from '@workspace/ui/button';",'a.tsx',[],{now}))).toEqual(['obsolete-import']);
  const local="import {Toaster} from '@/components/ui/toast';";
  expect(driftViolations(local,'a.tsx',[],{now})).toHaveLength(0);
  expect(rulesOf(driftViolations(local,'a.tsx',[],{now,obsoleteImports:['@/components/ui/']}))).toEqual(['obsolete-import']);
});

it('canonical HIG paths are exempt from copy rules but not from obsolete imports',()=>{
  const css=":root{--hig-action:#0f0}\n@import '../vendor/hig/x.css';";
  expect(rulesOf(driftViolations(css,'packages/tokens/generated/tokens.css',[],{now,canonical:['packages/tokens/']}))).toEqual(['obsolete-import']);
});

it('exceptions need owner, reason, a known rule and a bounded expiry; prefix exceptions cover a folder',()=>{
  const ok={path:'legacy/',rule:'copied-palette',owner:'pro maintainers',reason:'rollback renderer until flag removal',expires:'2026-12-01'};
  expect(validateExceptions([ok],now)).toEqual([]);
  expect(driftViolations("const c='#00ff3f'",'legacy/old.tsx',[ok],{now})).toHaveLength(0);
  expect(validateExceptions([{...ok,owner:''}],now)[0]).toContain('owner');
  expect(validateExceptions([{...ok,rule:'anything-goes'}],now)[0]).toContain('unknown rule');
  expect(validateExceptions([{...ok,expires:'2030-01-01'}],now)[0]).toContain('reviewed');
  expect(driftViolations("const c='#00ff3f'",'legacy/old.tsx',[{...ok,expires:'2026-01-01'}],{now})).toHaveLength(1);
});

it('scans a consumer root: font binaries, expired and unused exceptions, and the CLI exits non-zero',()=>{
  const root=mkdtempSync(join(tmpdir(),'hig-drift-consumer-'));
  mkdirSync(join(root,'apps/docs/fonts'),{recursive:true});mkdirSync(join(root,'apps/docs/app'),{recursive:true});
  writeFileSync(join(root,'apps/docs/fonts/BloxwapSans-Bold.ttf'),'binary');
  writeFileSync(join(root,'apps/docs/app/page.tsx'),"export const ok='uses @bloxwap/hig-react';");
  const config={paths:['apps/docs'],exceptions:[{path:'apps/docs/old.css',rule:'copied-palette',owner:'docs',reason:'gone',expires:'2026-01-01'}]};
  const report=scan(root,config,now);
  expect(report.violations).toEqual([{path:'apps/docs/fonts/BloxwapSans-Bold.ttf',rule:'copied-font-binary'}]);
  expect(report.expired).toHaveLength(1);expect(report.unused).toHaveLength(1);
  writeFileSync(join(root,'hig-drift.json'),JSON.stringify(config));
  const cli=spawnSync(process.execPath,[resolve('scripts/drift.mjs'),'--root',root,'--config','hig-drift.json'],{encoding:'utf8'});
  expect(cli.status).toBe(1);expect(cli.stderr).toContain('copied-font-binary');expect(cli.stderr).toContain('expired exception');
});

it('this repository passes its own scoped configuration',()=>{
  const cli=spawnSync(process.execPath,[resolve('scripts/drift.mjs')],{encoding:'utf8'});
  expect(cli.stderr).toBe('');expect(cli.status).toBe(0);
});
