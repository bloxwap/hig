import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const manifest=JSON.parse(readFileSync('planning/examples.json','utf8'));
const symbols=JSON.parse(readFileSync('planning/example-symbols.json','utf8'));
for(const platform of ['react','native']){
 const modules=[...new Set(Object.values(symbols[platform]))].sort();
 const namespace=m=>m.replace(/(^|-)([a-z])/g,(_,prefix,letter)=>letter.toUpperCase());
 const imports=modules.map(module=>`import * as ${namespace(module)} from '@bloxwap/hig-${platform}/${module}';`).join('\n');
 const object=modules.map(m=>`...${namespace(m)}`).join(',');
 const cases=manifest.examples.map(e=>`case ${JSON.stringify(e.name)}:return ${e[platform==='react'?'web':'native']};`).join('\n');
 const state=`${platform==='native'?'const trigger=useRef<View>(null);':''}const empty=state==='empty';const [checked,setChecked]=useState(false);const [value,setValue]=useState('buy');const [range,setRange]=useState(25);const [open,setOpen]=useState(false);const [amount,setAmount]=useState('0.01');const [message,setMessage]=useState('');const [notices,setNotices]=useState([{id:'1',message:'Demo copied',severity:'success' as const}]);const choices=[{value:'buy',label:'Buy'},{value:'sell',label:'Sell'}];const rows=empty?[]:[{id:'btc',label:'Bitcoin (BTC)',value:67234.56}];const busy=state==='busy',disabled=state==='disabled',error=state==='error'?'Data unavailable. Retry when connected.':undefined;`;
 const source=`// Generated from planning/examples.json.\nimport React,{useState${platform==='native'?',useRef':''}} from 'react';\n${platform==='native'?"import {View} from 'react-native';\n":''}${imports}\nconst C={${object}};\nexport function Example({name,state='default'}:{name:string;state?:string}){${state}\nfunction preview(){switch(name){${cases}\ndefault:return <C.Text>Platform example unavailable.</C.Text>;}}return <C.Stack${platform==='native'?" style={['List','Table','PriceChart','ActivityList'].includes(name)?{flex:1}:undefined}":''}>{preview()}{message&&<C.Text>{message}</C.Text>}</C.Stack>;}\n`;
 const target=platform==='react'?'apps/docs/src/examples.tsx':'fixtures/native/gallery.tsx';mkdirSync(target.slice(0,target.lastIndexOf('/')),{recursive:true});writeFileSync(target,source);
}
writeFileSync('fixtures/native/gallery-manifest.json',JSON.stringify({version:manifest.version,examples:manifest.examples.map(e=>({name:e.name,states:e.states,support:e.nativeSupport}))},null,2)+'\n');
