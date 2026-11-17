import {readFileSync} from 'node:fs';
const manifest=JSON.parse(readFileSync('planning/examples.json','utf8'));
export function exampleCode(name,platform='react',density='comfortable',state='default'){
 const example=manifest.examples.find(e=>e.name===name);if(!example)throw Error('Unknown example');
 // A state may carry its own example (`variants[state]`); otherwise every state shares the entry's `web` / `native` body.
 const body=(example.variants?.[state]??example)[platform==='react'?'web':'native'];
 // The build generator supplies symbol entry maps, source is authoritative.
 const mapping=JSON.parse(readFileSync('planning/example-symbols.json','utf8'))[platform];
 const needed=new Set([...body.matchAll(/C\.([A-Za-z]\w+)/g)].map(m=>m[1]));needed.add('HIGProvider');needed.add('Stack');needed.add('Text');
 // An example that raises a toast is only complete with the host that draws it, mounted once beside the screen.
 const toaster=needed.has('toast');if(toaster)needed.add('Toaster');
 const grouped={};for(const symbol of needed){const entry=mapping[symbol];if(!entry)throw Error(`Missing ${platform} export ${symbol}`);(grouped[entry]??=[]).push(symbol);}
 // An entry is either a subpath of @bloxwap/hig/<platform> or a full package name (AltimeterChart lives in @bloxwap/hig/chart, #96).
 const imports=Object.entries(grouped).map(([entry,symbols])=>`import {${symbols.join(',')}} from '${entry.startsWith('@')?entry:`@bloxwap/hig/${platform}/${entry}`}';`).join('\n');
 const gesture=platform==='native'&&name==='GestureSheet';
 const toastPosition=name==='Toaster'&&["top-left", "top-center", "top-right", "bottom-left", "bottom-center", "bottom-right"].includes(state)?state:'bottom-center';
 const content=`<HIGProvider density=${JSON.stringify(platform==='native'?'comfortable':density)}><Stack>${body.replaceAll('C.','')}<Text>{message}</Text></Stack>${toaster?`<Toaster position="${toastPosition}"/>`:''}</HIGProvider>`;
 // The native Toaster reads the finger and the safe area, so its sample shows the two roots it needs.
 const roots=platform==='native'&&toaster;
 const tree=gesture?`<GestureHandlerRootView style={{flex:1}}><SafeAreaProvider><BottomSheetModalProvider>${content}</BottomSheetModalProvider></SafeAreaProvider></GestureHandlerRootView>`:roots?`<GestureHandlerRootView style={{flex:1}}><SafeAreaProvider>${content}</SafeAreaProvider></GestureHandlerRootView>`:content;
 return `import React,{useState${platform==='native'?',useRef':''}} from 'react';\n${platform==='native'?"import {View} from 'react-native';\n":''}${gesture?"import {GestureHandlerRootView} from 'react-native-gesture-handler';\nimport {SafeAreaProvider} from 'react-native-safe-area-context';\nimport {BottomSheetModalProvider} from '@gorhom/bottom-sheet';\n":roots?"import {GestureHandlerRootView} from 'react-native-gesture-handler';\nimport {SafeAreaProvider} from 'react-native-safe-area-context';\n":''}${imports}\n${platform==='react'?"import '@bloxwap/hig/tokens/css';\nimport '@bloxwap/hig/react/css';":''}
export default function Example(){
const [checked,setChecked]=useState(false),[value,setValue]=useState('buy'),[range,setRange]=useState(25),[open,setOpen]=useState(false),[amount,setAmount]=useState('0.01'),[message,setMessage]=useState('');
const [notices,setNotices]=useState([{id:'1',message:'Demo copied',severity:'success' as const}]);
const choices=[{value:'buy',label:'Buy'},{value:'sell',label:'Sell'}];${platform==='native'?'const trigger=useRef<React.ComponentRef<typeof View>>(null);':''}const rows:{id:string;label:string;value:number}[]=${state==='empty'?'[]':"[{id:'btc',label:'Bitcoin (BTC)',value:67234.56}]"};
const empty=${state==='empty'},busy=${state==='busy'},disabled=${state==='disabled'},error=${state==='error'?JSON.stringify('Data unavailable. Retry when connected.'):'undefined'};
return ${tree};
}`;
}
export const examples=manifest.examples;
