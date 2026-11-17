import {expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
// @ts-expect-error Executable registry consumer plan.
import {registryChecks,selectRegistryChecks} from '../scripts/registry-checks.mjs';

const workflow=readFileSync('.github/workflows/publish.yml','utf8');
const registryWorkflow=readFileSync('.github/workflows/registry.yml','utf8');
it('covers every registry consumer once and rejects unknown lanes',()=>{
 const names=registryWorkflow.match(/consumer: \[([^\]]+)\]/)![1].split(', ');
 expect(names).toEqual(Object.keys(registryChecks));
 expect(names).toEqual(['web','next','rn-0.81','rn-0.83','rn-0.88']);
 expect(names.flatMap(name=>selectRegistryChecks(name))).toEqual(selectRegistryChecks());
 expect(selectRegistryChecks('rn-0.83')[0].args).toEqual(['--profile','rn-0.83']);
 expect(()=>selectRegistryChecks('typo')).toThrow('Unknown registry check');
});
it('publishes only artifacts from successful exact-commit tag CI without rebuilding',()=>{
 expect(workflow).not.toMatch(/npm ci|release:dry-run|ci-quality-tasks|smoke:registry/);
 expect(workflow).toContain('--commit "$release_sha" --event workflow_dispatch --status success');
 expect(workflow).toContain('.expired == false');
 expect(workflow).toContain('artifact-ids: ${{ needs.prerequisites.outputs.artifact-id }}');
 expect(workflow).toContain('run-id: ${{ needs.prerequisites.outputs.quality-run }}');
 expect(workflow).toContain('test "$(git rev-parse HEAD)" = "$RELEASE_SHA"');
 expect(workflow.indexOf('node scripts/verify-release.mjs')).toBeLessThan(workflow.indexOf('npm publish'));
 expect(workflow).toContain('npm publish "$archive" --access public --provenance');
 expect(registryWorkflow).toContain('workflow_run:');
 expect(registryWorkflow).toContain("github.event.workflow_run.conclusion == 'success'");
 expect(registryWorkflow).toContain('github.event.workflow_run.head_repository.full_name == github.repository');
 expect(registryWorkflow).not.toContain('id-token: write');
 expect(registryWorkflow).toContain('fail-fast: false');
 expect(registryWorkflow).not.toMatch(/^\s+max-parallel:/m);
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
