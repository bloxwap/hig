const {getDefaultConfig}=require('expo/metro-config');
const {dirname,resolve}=require('node:path');
const config=getDefaultConfig(__dirname);
// The RN renderer requires its exact React (RN 0.81.5/Expo 54: 19.1.0; RN 0.83.10/Expo 55: 19.2.0).
// Resolve every workspace package through this consumer's React, never the web hosts' copy.
const roots=Object.fromEntries(['react','react-dom'].map(name=>[name,dirname(require.resolve(`${name}/package.json`,{paths:[__dirname]}))]));
config.resolver.resolveRequest=(context,name,platform)=>{
 const base=name.split('/')[0];
 if(roots[base])return context.resolveRequest(context,resolve(roots[base],name.slice(base.length+1)||'index.js'),platform);
 return context.resolveRequest(context,name,platform);
};
config.resolver.blockList=[...(Array.isArray(config.resolver.blockList)?config.resolver.blockList:config.resolver.blockList?[config.resolver.blockList]:[]),/[/\\]\.validation-tmp[/\\]android[/\\]/];
module.exports=config;
