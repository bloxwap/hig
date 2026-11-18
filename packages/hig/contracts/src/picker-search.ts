import {rankPickerTokens} from './rank-picker-tokens.js';

interface SearchToken {
 id:string;
 name:string;
 symbol:string;
 chain:string;
 chainId:string|number;
 keywords?:string;
}

const normalizeQuery=(query:string)=>query.toLowerCase().replace(/\s+/g,'');

function containsSubsequence(text:string,needle:string){
 let offset=0;
 for(let i=0;i<needle.length;i++){
  const found=text.indexOf(needle[i],offset);
  if(found<0)return false;
  offset=found+1;
 }
 return true;
}

export function fuzzyMatch(query:string,text:string){
 return containsSubsequence(text.toLowerCase(),normalizeQuery(query));
}

/** Reuse searchable text across queries until the host supplies a new catalog. */
export function createPickerSearch<T extends SearchToken>(catalog:readonly T[]){
 const searchText:string[]=[];
 return (query:string,chainId:string|number|null,hotIds?:readonly string[])=>{
  const needle=normalizeQuery(query);
  if(!needle&&chainId===null)return rankPickerTokens(catalog,hotIds);
  const rows=catalog.filter((token,index)=>{
   if(chainId!==null&&token.chainId!==chainId)return false;
   if(!needle)return true;
   const text=searchText[index]??=(`${token.name} ${token.symbol} ${token.chain} ${token.keywords??''}`).toLowerCase();
   return containsSubsequence(text,needle);
  });
  return {rows,hotCount:0};
 };
}
