import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const manifest=JSON.parse(readFileSync('planning/examples.json','utf8'));
const symbols=JSON.parse(readFileSync('planning/example-symbols.json','utf8'));
for(const platform of ['react','native']){
 const modules=[...new Set(Object.values(symbols[platform]))].sort();
 // A module is a subpath of @bloxwap/hig/<platform> or a full package name such as @bloxwap/hig/chart (#96).
 // A nested subpath such as blocks/screen-header joins its parts: BlocksScreenHeader.
 const namespace=m=>m.replace(/^@bloxwap\/hig\//,'').replace(/(^|[-/])([a-z])/g,(_,prefix,letter)=>letter.toUpperCase());
 const specifier=m=>m.startsWith('@')?m:`@bloxwap/hig/${platform}/${m}`;
 const imports=modules.map(module=>`import * as ${namespace(module)} from '${specifier(module)}';`).join('\n');
 // A component named after its own entry comes from that entry, whichever module is spread last: native `status` also exports an
 // Avatar, the build without the generated face and without the SVG peer, and it would otherwise replace the one from `avatar`.
 const own=Object.entries(symbols[platform]).filter(([symbol,module])=>namespace(module.split('/').at(-1))===symbol).map(([symbol,module])=>`${symbol}:${namespace(module)}.${symbol}`);
 const object=[...modules.map(m=>`...${namespace(m)}`),...own].join(',');
 const side=platform==='react'?'web':'native';
 // A state with its own example (`variants[state]`) renders that; every other state renders the entry's shared body.
 const cases=manifest.examples.map(e=>`case ${JSON.stringify(e.name)}:return ${Object.entries(e.variants??{}).map(([state,variant])=>`state===${JSON.stringify(state)}?${variant[side]}:`).join('')}${e[side]};`).join('\n');
 const state=`${platform==='native'?'const trigger=useRef<React.ComponentRef<typeof View>>(null);':''}const empty=state==='empty';const [checked,setChecked]=useState(false);const [value,setValue]=useState('buy');const [range,setRange]=useState(25);const [open,setOpen]=useState(${platform==='react'?'Boolean(previewDialog)':'false'});const [amount,setAmount]=useState('0.01');const [message,setMessage]=useState('');const [notices,setNotices]=useState([{id:'1',message:'Demo copied',severity:'success' as const}]);const choices=[{value:'buy',label:'Buy'},{value:'sell',label:'Sell'}];const rows=empty?[]:[{id:'btc',label:'Bitcoin (BTC)',value:67234.56}];const busy=state==='busy',disabled=state==='disabled',error=state==='error'?'Data unavailable. Retry when connected.':undefined;`;
 const source=`// Generated from planning/examples.json.\nimport React,{useState${platform==='native'?',useRef':''}} from 'react';\n${platform==='native'?"import {View} from 'react-native';\n":''}${imports}\nconst ${platform==='react'?'components':'C'}={${object}};\nexport function Example({name,state='default'${platform==='react'?',previewDialog':''}}:{name:string;state?:string${platform==='react'?';previewDialog?:typeof components.Dialog':''}}){${platform==='react'?'const C=previewDialog?{...components,Dialog:previewDialog}:components;':''}${state}\nfunction preview(){switch(name){${cases}\ndefault:return <C.Text>Platform example unavailable.</C.Text>;}}return <C.Stack${platform==='native'?" style={['List','Table','OutcomeChart'].includes(name)?{flex:1}:undefined}":''}>{preview()}{message&&<C.Text>{message}</C.Text>}</C.Stack>;}\n`;
 const target=platform==='react'?'apps/docs/src/examples.tsx':'fixtures/native/gallery.tsx';mkdirSync(target.slice(0,target.lastIndexOf('/')),{recursive:true});writeFileSync(target,source);
}
writeFileSync('fixtures/native/gallery-manifest.json',JSON.stringify({version:manifest.version,examples:manifest.examples.map(e=>({name:e.name,states:e.states,support:e.nativeSupport}))},null,2)+'\n');
