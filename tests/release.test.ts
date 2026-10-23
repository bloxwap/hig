import {it,expect} from 'vitest';
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
it('release automation rejects publication/tag/release flags before any operation',()=>{for(const flag of ['--publish','--tag','--release']){const result=spawnSync(process.execPath,['scripts/release-dry-run.mjs',flag],{encoding:'utf8'});expect(result.status).not.toBe(0);expect(result.stderr).toContain('Dry-run only');}});
it('keeps local release automation dry-run only and records physical acceptance as an owner exception',()=>{
 const source=readFileSync('scripts/release-dry-run.mjs','utf8');expect(source).not.toContain("['publish'");expect(source).not.toContain("['tag'");
 const gates=JSON.parse(readFileSync('planning/release-blockers.json','utf8')) as {id:string;status:string;approvedBy?:string;approval?:string;reviewBy?:string;reason:string}[];
 const physical=gates.find(gate=>gate.id==='physical-devices');
 expect(physical).toMatchObject({status:'approved-exception',approvedBy:'joeblau',approval:'https://github.com/bloxwap/hig/pull/131'});
 expect(physical!.reviewBy).toMatch(/^\d{4}-\d{2}-\d{2}$/);expect(physical!.reason).toContain('owner attestation');
});
