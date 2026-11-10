// The deployment defaults and validation belong here, shared by Next and Node tools.
export const basePath=process.env.NEXT_PUBLIC_BASE_PATH??(process.env.NODE_ENV==='development'?'':'/hig');
export const origin=process.env.HIG_DOCS_ORIGIN??'https://bloxwap.github.io';
if(!/^(|\/[a-z0-9-]+)$/.test(basePath)){
 throw new Error('NEXT_PUBLIC_BASE_PATH must be empty or a lowercase /segment with no trailing slash');
}
let url;
try{url=new URL(origin);}catch{throw new Error('HIG_DOCS_ORIGIN must be an HTTP(S) origin with no path or trailing slash');}
if(!['http:','https:'].includes(url.protocol)||url.origin!==origin){
 throw new Error('HIG_DOCS_ORIGIN must be an HTTP(S) origin with no credentials, path, query, fragment or trailing slash');
}
