/** Keep the catalog order unless a proper subset of tokens has a host-supplied rank. */
export function rankPickerTokens<T extends {id:string}>(tokens:readonly T[],hotIds?:readonly string[]){
 if(!hotIds?.length)return {rows:tokens,hotCount:0};
 const ranked=new Map<string,T|undefined>();
 for(const id of hotIds)ranked.set(id,undefined);
 const rest:T[]=[];
 for(const token of tokens){
  const id=token.id;
  if(ranked.has(id))ranked.set(id,token);
  else rest.push(token);
 }
 if(!rest.length||rest.length===tokens.length)return {rows:tokens,hotCount:0};
 const hot:T[]=[];
 for(const token of ranked.values())if(token!==undefined)hot.push(token);
 return {rows:hot.concat(rest),hotCount:hot.length};
}
