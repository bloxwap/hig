import {transformSync} from 'esbuild';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const manifest=JSON.parse(readFileSync('planning/examples.json','utf8'));
const symbols=JSON.parse(readFileSync('planning/example-symbols.json','utf8'));
// Let the TSX parser distinguish example variables from prop names and callback parameters.
function exampleState(cases,platform){
 const hooks={checked:'false',value:"'buy'",range:'25',open:platform==='react'?'Boolean(previewDialog)':'false',amount:"'0.01'",message:"''",notices:"[{id:'1',message:'Demo copied',severity:'success' as const}]"};
 const values={choices:"[{value:'buy',label:'Buy'},{value:'sell',label:'Sell'}]",rows:"state==='empty'?[]:[{id:'btc',label:'Bitcoin (BTC)',value:67234.56}]",empty:"state==='empty'",busy:"state==='busy'",disabled:"state==='disabled'",error:"state==='error'?'Data unavailable. Retry when connected.':undefined"};
 const setter=name=>'set'+name[0].toUpperCase()+name.slice(1);
 const names=[...Object.keys(hooks),...Object.keys(hooks).map(setter),...Object.keys(values),'state','previewDialog','trigger'];
 const define=Object.fromEntries(names.map(name=>[name,'exampleScope.'+name]));
 const {code}=transformSync(`function preview(){switch(name){${cases}}}`,{loader:'tsx',define});
 const used=new Set(Array.from(code.matchAll(/exampleScope\.(\w+)/g),match=>match[1]));
 if(used.has('setMessage'))used.add('message');
 const lines=[];
 if(platform==='native'&&used.has('trigger'))lines.push('const trigger=useRef<React.ComponentRef<typeof View>>(null);');
 for(const [name,initial] of Object.entries(hooks)){
  const update=setter(name);
  if(!used.has(name)&&!used.has(update))continue;
  if(name==='open'&&platform==='react')used.add('previewDialog');
  lines.push(`const [${used.has(name)?name:''}${used.has(update)?','+update:''}]=useState(${initial});`);
 }
 for(const [name,initial] of Object.entries(values)){
  if(!used.has(name))continue;
  lines.push(`const ${name}=${initial};`);
  if(initial.includes('state==='))used.add('state');
 }
 return {lines:lines.join('\n'),used};
}
for(const platform of ['react','native']){
 const modules=[...new Set(Object.values(symbols[platform]))].sort();
 // A module is a subpath of @bloxwap/hig/<platform> or a full package name such as @bloxwap/hig/chart (#96).
 const specifier=m=>m.startsWith('@')?m:`@bloxwap/hig/${platform}/${m}`;
 const entries=Object.entries(symbols[platform]);
 const side=platform==='react'?'web':'native';
 // A state with its own example (`variants[state]`) renders that; every other state renders the entry's shared body.
 const renderCases=examples=>examples.map(e=>`case ${JSON.stringify(e.name)}:return ${Object.entries(e.variants??{}).map(([state,variant])=>`state===${JSON.stringify(state)}?${variant[side]}:`).join('')}${e[side]};`).join('\n');
 const renderWebSource=(imports,object,cases,overrideDialog,scope)=>`// Generated from planning/examples.json.\nimport React${scope.lines.includes('useState(')?',{useState}':''} from 'react';\n${imports}\nconst components={${object}};\nexport function Example({name${scope.used.has('state')?",state='default'":''}${overrideDialog||scope.used.has('previewDialog')?',previewDialog':''}}:{name:string;state?:string;previewDialog?:typeof import('@bloxwap/hig/react/overlay').Dialog}){${overrideDialog?'const C=previewDialog?{...components,Dialog:previewDialog}:components;':'const C=components;'}${scope.lines}\nfunction preview(){switch(name){${cases}\ndefault:return <C.Text>Platform example unavailable.</C.Text>;}}return <C.Stack>{preview()}${scope.used.has('message')?'{message&&<C.Text>{message}</C.Text>}':''}</C.Stack>;}\n`;
 if(platform==='react'){
  const directory='apps/docs/src/example-groups';
  mkdirSync(directory,{recursive:true});
  const groups=Map.groupBy(manifest.examples,example=>{
   const module=symbols.react[example.name]??'blocks';
   // Dialog, sheet and alert dialog share their implementation. The other overlays load distinct primitives.
   if(module==='overlay'&&['Menu','Popover','Tooltip'].includes(example.name))return 'overlay-'+example.slug;
   return module==='blocks'?'blocks-'+example.slug:module;
  });
  const loaders=[],registry=[];
  for(const [module,examples] of groups){
   const file=module.replace(/^@bloxwap\/hig\//,'').replaceAll('/','-');
   const cases=renderCases(examples);
   const used=new Set(['Stack','Text',...Array.from(cases.matchAll(/\bC\.(\w+)/g),match=>match[1])]);
   const groupImports=modules.flatMap(source=>{
    const names=entries.filter(([name,from])=>from===source&&used.has(name)).map(([name])=>name);
    return names.length?[`import {${names.join(',')}} from '${specifier(source)}';`]:[];
   }).join('\n');
   writeFileSync(`${directory}/${file}.tsx`,renderWebSource(groupImports,[...used].join(','),cases,used.has('Dialog'),exampleState(cases,platform)));
   const loader=file.split('-').map(part=>part[0].toUpperCase()+part.slice(1)).join('')+'Examples';
   loaders.push(`const ${loader}=lazy(()=>import('./example-groups/${file}').then(module=>({default:module.Example})));`);
   registry.push(...examples.map(example=>`  ${JSON.stringify(example.name)}: ${loader},`));
  }
  writeFileSync('apps/docs/src/examples.tsx',`// Generated from planning/examples.json.
import React,{lazy} from 'react';
import type {Dialog} from '@bloxwap/hig/react/overlay';
interface Props {name:string;state?:string;previewDialog?:typeof Dialog}
${loaders.join('\n')}
const previews:Record<string,React.ComponentType<Props>>={
${registry.join('\n')}
};
export const Example=React.memo(function Example(props:Props){
 const Preview=previews[props.name];
 return Preview?<Preview {...props}/>:<p>Platform example unavailable.</p>;
});
`);
  continue;
 }
 const imports=modules.map(module=>{
  const names=entries.filter(([,source])=>source===module).map(([name])=>name);
  return `import {${names.join(',')}} from '${specifier(module)}';`;
 }).join('\n');
 const object=entries.map(([name])=>name).join(',');
 // A component has a fixed hook order. Dispatch to one renderer per hook set so static previews allocate no state.
 const groups=Map.groupBy(manifest.examples,example=>{
  const scope=exampleState(renderCases([example]),platform);
  return scope.lines.split('\n').filter(line=>line.includes('useState(')||line.includes('useRef<')).join('\n');
 });
 const renderers=[],registry=[];
 for(const examples of groups.values()){
  const cases=renderCases(examples),scope=exampleState(cases,platform);
  const renderer='Preview'+examples[0].name;
  renderers.push(`function ${renderer}({name${scope.used.has('state')?",state='default'":''}}:ExampleProps){
${scope.lines}
function preview(){switch(name){${cases}
default:return <C.Text>Platform example unavailable.</C.Text>;}}
return <C.Stack style={['List','Table','OutcomeChart'].includes(name)?{flex:1}:undefined}>{preview()}${scope.used.has('message')?'{message&&<C.Text>{message}</C.Text>}':''}</C.Stack>;}`);
  registry.push(...examples.map(example=>`  ${JSON.stringify(example.name)}: ${renderer},`));
 }
 const source=`// Generated from planning/examples.json.
import React,{useRef,useState} from 'react';
import {View} from 'react-native';
${imports}
const C={${object}};
interface ExampleProps {name:string;state?:string}
${renderers.join('\n')}
const previews:ReadonlyMap<string,React.ComponentType<ExampleProps>>=new Map(Object.entries({
${registry.join('\n')}
}));
export const Example=React.memo(function GalleryExample(props:ExampleProps){
 const Preview=previews.get(props.name);
 return Preview?<Preview {...props}/>:<C.Stack><C.Text>Platform example unavailable.</C.Text></C.Stack>;
});
`;
 const target='fixtures/native/gallery.tsx';mkdirSync(target.slice(0,target.lastIndexOf('/')),{recursive:true});writeFileSync(target,source);
}
writeFileSync('fixtures/native/gallery-manifest.json',JSON.stringify({version:manifest.version,examples:manifest.examples.map(e=>({name:e.name,states:e.states,support:e.nativeSupport}))},null,2)+'\n');
