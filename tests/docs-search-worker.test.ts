import {afterEach,expect,it,vi} from 'vitest';
import type {SearchRequest,SearchReply} from '../apps/docs/components/search.worker';

const search=vi.hoisted(()=>vi.fn());
vi.mock('fumadocs-core/search/client/orama-static',()=>({staticClient:()=>({search})}));
afterEach(()=>{vi.unstubAllGlobals();vi.resetModules();search.mockReset();});

it('runs only the newest waiting query and settles every request during a cold index load',async()=>{
 const postMessage=vi.fn<(reply:SearchReply)=>void>();
 const worker={postMessage,onmessage:undefined as unknown as (event:{data:SearchRequest})=>void};
 vi.stubGlobal('self',worker);
 let release!:()=>void;
 const loading=new Promise<void>(resolve=>{release=resolve;});
 search.mockImplementation(async(query:string)=>{await loading;return [{content:query}];});
 await import('../apps/docs/components/search.worker');
 for(const [id,query] of ['p','pr','pre','prec','precision'].entries()){
  worker.onmessage({data:{id,query,from:'/search.json'}});
 }
 release();
 await vi.waitFor(()=>expect(postMessage).toHaveBeenCalledTimes(5));
 expect(search.mock.calls.map(([query])=>query)).toEqual(['p','precision']);
 const replies=postMessage.mock.calls.map(([reply])=>reply).sort((a,b)=>a.id-b.id);
 expect(replies.map(reply=>'results' in reply?reply.results.length:-1)).toEqual([0,0,0,0,1]);
 expect(replies[4]).toEqual({id:4,results:[{content:'precision'}]});
 search.mockRejectedValueOnce(new Error('Index unavailable'));
 worker.onmessage({data:{id:5,query:'account',from:'/search.json'}});
 await vi.waitFor(()=>expect(postMessage).toHaveBeenCalledWith({id:5,error:'Index unavailable'}));
 worker.onmessage({data:{id:6,query:'holdings',from:'/search.json'}});
 await vi.waitFor(()=>expect(postMessage).toHaveBeenCalledWith({id:6,results:[{content:'holdings'}]}));
});
