import {it,expect} from 'vitest';
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
it('release automation rejects publication/tag/release flags before any operation',()=>{for(const flag of ['--publish','--tag','--release']){const result=spawnSync(process.execPath,['scripts/release-dry-run.mjs',flag],{encoding:'utf8'});expect(result.status).not.toBe(0);expect(result.stderr).toContain('Dry-run only');}});
it('release workflow declares only read/artifact operations and explicit pending device gates',()=>{const source=readFileSync('scripts/release-dry-run.mjs','utf8');expect(source).not.toContain("['publish'");expect(source).not.toContain("['tag'");expect(JSON.parse(readFileSync('planning/release-blockers.json','utf8')).some((b:{id:string;status:string})=>b.id==='physical-devices'&&b.status==='blocked')).toBe(true);});
