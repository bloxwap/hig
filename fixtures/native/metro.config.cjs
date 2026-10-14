const {getDefaultConfig}=require('expo/metro-config');
const {dirname,resolve}=require('node:path');
const config=getDefaultConfig(__dirname);
// Expo 54's native renderer requires React 19.1. Resolve every workspace
// package through this consumer's React, while the Fumadocs host uses 19.2.
const roots=Object.fromEntries(['react','react-dom'].map(name=>[name,dirname(require.resolve(`${name}/package.json`,{paths:[__dirname]}))]));
config.resolver.resolveRequest=(context,name,platform)=>{
 const base=name.split('/')[0];
 if(roots[base])return context.resolveRequest(context,resolve(roots[base],name.slice(base.length+1)||'index.js'),platform);
 return context.resolveRequest(context,name,platform);
};
module.exports=config;
