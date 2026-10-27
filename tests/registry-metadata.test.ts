import {it,expect,vi} from 'vitest';
// @ts-expect-error Executable release helper.
import {readRegistryDist} from '../scripts/registry-metadata.mjs';

const dist={tarball:'https://registry.npmjs.org/@bloxwap/hig-chart/-/hig-chart-0.1.1.tgz'};
const npmError=(code:string)=>Object.assign(new Error(`npm view failed: ${code}`),{status:1,signal:null,stdout:JSON.stringify({error:{code}})});

it('retries an exact newly published version after E404 and returns its eventual dist metadata',async()=>{
 const missing=npmError('E404');
 const exec=vi.fn().mockImplementationOnce(()=>{throw missing;}).mockImplementationOnce(()=>{throw missing;}).mockReturnValue(JSON.stringify(dist));
 const wait=vi.fn(),onRetry=vi.fn();
 await expect(readRegistryDist('@bloxwap/hig-chart','0.1.1',{exec,wait,onRetry})).resolves.toEqual(dist);
 expect(exec).toHaveBeenCalledTimes(3);
 for(const call of exec.mock.calls)expect(call).toEqual(['npm',['view','@bloxwap/hig-chart@0.1.1','dist','--json'],{encoding:'utf8',stdio:['ignore','pipe','pipe'],timeout:15000}]);
 expect(wait.mock.calls).toEqual([[10000],[10000]]);
 expect(onRetry).toHaveBeenCalledTimes(2);
});

it('exhausts the bounded E404 retry budget and preserves the final npm failure',async()=>{
 const missing=npmError('E404'),exec=vi.fn(()=>{throw missing;}),wait=vi.fn();
 await expect(readRegistryDist('@bloxwap/hig-chart','0.1.1',{exec,wait,onRetry:vi.fn()})).rejects.toBe(missing);
 expect(exec).toHaveBeenCalledTimes(31);
 expect(wait.mock.calls).toEqual(Array.from({length:30},()=>[10000]));
});

it.each(['E401','E403','E500','ETIMEDOUT'])('fails immediately for %s without a metadata retry',async code=>{
 const failure=Object.assign(npmError(code),{stderr:'Earlier request: npm error code E404'});
 const exec=vi.fn(()=>{throw failure;}),wait=vi.fn(),onRetry=vi.fn();
 await expect(readRegistryDist('@bloxwap/hig-chart','0.1.1',{exec,wait,onRetry})).rejects.toBe(failure);
 expect(exec).toHaveBeenCalledOnce();expect(wait).not.toHaveBeenCalled();expect(onRetry).not.toHaveBeenCalled();
});

it('does not retry malformed metadata or a terminated process containing E404 output',async()=>{
 const wait=vi.fn(),onRetry=vi.fn(),exec=vi.fn(()=>'{invalid json');
 await expect(readRegistryDist('@bloxwap/hig-chart','0.1.1',{exec,wait,onRetry})).rejects.toBeInstanceOf(SyntaxError);
 expect(exec).toHaveBeenCalledOnce();expect(wait).not.toHaveBeenCalled();
 const failure=Object.assign(npmError('E404'),{signal:'SIGTERM'}),terminated=vi.fn(()=>{throw failure;});
 await expect(readRegistryDist('@bloxwap/hig-chart','0.1.1',{exec:terminated,wait,onRetry})).rejects.toBe(failure);
 expect(terminated).toHaveBeenCalledOnce();expect(wait).not.toHaveBeenCalled();expect(onRetry).not.toHaveBeenCalled();
});

it.each(['latest','^0.1.1','0.1'])('rejects a non-exact version %s before contacting npm',async version=>{
 const exec=vi.fn(),wait=vi.fn();
 await expect(readRegistryDist('@bloxwap/hig-chart',version,{exec,wait})).rejects.toThrow('exact package version');
 expect(exec).not.toHaveBeenCalled();expect(wait).not.toHaveBeenCalled();
});
