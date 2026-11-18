import {staticClient} from 'fumadocs-core/search/client/orama-static';
import type {SortedResult} from 'fumadocs-core/search';

export interface SearchRequest {id:number; query:string; from:string}
export type SearchReply = {id:number; results:SortedResult[]} | {id:number; error:string};

async function answer({id,query,from}:SearchRequest){
  let reply:SearchReply;
  try {
    const results=await staticClient({from}).search(query);
    reply={id,results:waiting?[]:results};
  } catch(error) {
    reply={id,error:error instanceof Error?error.message:String(error)};
  }
  self.postMessage(reply);
}

let running=false;
let waiting:SearchRequest|undefined;

self.onmessage=async({data}:{data:SearchRequest})=>{
  if(running){
    // The dialog already discarded the previous query. Settle its promise without searching.
    if(waiting)self.postMessage({id:waiting.id,results:[]} satisfies SearchReply);
    waiting=data;
    return;
  }

  running=true;
  try{
    let next:SearchRequest|undefined=data;
    while(next){
      await answer(next);
      next=waiting;
      waiting=undefined;
    }
  }finally{
    running=false;
  }
};
