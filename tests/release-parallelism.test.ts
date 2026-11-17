import {expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
// @ts-expect-error Executable registry consumer plan.
import {registryChecks,selectRegistryChecks} from '../scripts/registry-checks.mjs';

const workflow=readFileSync('.github/workflows/publish.yml','utf8');
it('covers every registry consumer once and rejects unknown lanes',()=>{
 const names=workflow.match(/consumer: \[([^\]]+)\]/)![1].split(', ');
 expect(names).toEqual(Object.keys(registryChecks));
 expect(names).toEqual(['web','next','rn-0.81','rn-0.83','rn-0.88']);
 expect(names.flatMap(name=>selectRegistryChecks(name))).toEqual(selectRegistryChecks());
 expect(selectRegistryChecks('rn-0.83')[0].args).toEqual(['--profile','rn-0.83']);
 expect(()=>selectRegistryChecks('typo')).toThrow('Unknown registry check');
});
it('gates publication on every validation lane and preserves report and source verification',()=>{
 expect(workflow).toContain('task: [checks, unit-web, unit-native]');
 expect(workflow.match(/fail-fast: false/g)).toHaveLength(2);
 expect(workflow).not.toMatch(/^\s+max-parallel:/m);
 expect(workflow).toContain('needs: [security, prerequisites, validation, prepare]');
 expect(workflow).toContain('needs: [prerequisites, prepare, publish]');
 const publish=workflow.split('  publish:')[1].split('  registry:')[0];
 expect(publish).toContain('REPORT_SHA256: ${{ needs.prepare.outputs.report-sha256 }}');
 expect(publish).toContain('process.env.REPORT_SHA256');
 expect(publish).toContain('test "$(git rev-parse HEAD)" = "$RELEASE_SHA"');
 expect(publish.indexOf('node scripts/verify-release.mjs')).toBeLessThan(publish.indexOf('npm publish'));
 expect(publish).toContain('npm publish "$archive" --access public --provenance');
 expect(publish).not.toContain('continue-on-error');
});
it('runs hash and signature verification before every selected registry consumer',()=>{
 const script=readFileSync('scripts/registry-smoke.mjs','utf8');
 const consumer=script.indexOf('for(const {script,args} of checks)');
 for(const check of ["assert.equal(hash,artifact.sha256",'await verifyRegistryProvenance','audit\',\'signatures']){
  const position=script.indexOf(check);
  expect(position).toBeGreaterThan(-1);
  expect(position).toBeLessThan(consumer);
 }
 expect(script).toContain('selectRegistryChecks(mode)');
 expect(script).toContain('registry-install-${mode}.json');
});
