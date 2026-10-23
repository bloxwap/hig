// #93: HIGProvider `colorSpace` selects one of HIG's own native colour tables, and every component paints from it.
const React=require('react');
const {readFileSync,readdirSync}=require('node:fs');
const {create,act}=require('react-test-renderer');
const RN=require('react-native');
const {nativeSrgb,nativeColors,nativeDisplayP3}=require('../../packages/tokens/dist/index.js');
const {HIGProvider,colorTable,useColors}=require('../../packages/native/src/provider');
const {Text,Surface,Separator}=require('../../packages/native/src/surface');
const {Button,Link}=require('../../packages/native/src/button');
const {Switch}=require('../../packages/native/src/switch');
const {Alert,Badge,Spinner,Skeleton}=require('../../packages/native/src/status');
const {Slider}=require('../../packages/native/src/slider');
const {Field,Input}=require('../../packages/native/src/field');
const {Dialog}=require('../../packages/native/src/overlay');
const {BrandMark,CheckIcon}=require('../../packages/native/src/brand');
const p3=nativeColors.iosDisplayP3;
let root;
afterEach(()=>{if(root)act(()=>root.unmount());root=null;});
function withOS(os,run){const descriptor=Object.getOwnPropertyDescriptor(RN.Platform,'OS');Object.defineProperty(RN.Platform,'OS',{value:os,configurable:true});try{return run();}finally{Object.defineProperty(RN.Platform,'OS',descriptor);}}
function mount(element,props={colorSpace:'display-p3'}){if(root)act(()=>root.unmount());act(()=>{root=create(React.createElement(HIGProvider,props,element));});return root.root;}
const flat=node=>RN.StyleSheet.flatten(node.props.style);
/** Every colour a render paints, keyed by where it was found. */
function painted(tree){const found=[];for(const node of tree.findAll(n=>typeof n.type!=='string'))for(const [key,value] of Object.entries(node.props)){if(key==='children')continue;const style=key==='style'&&typeof value!=='function'?RN.StyleSheet.flatten(value):null;const entries=style?Object.entries(style):[[key,value]];for(const [k,v] of entries){if(typeof v==='string'&&/^#[0-9a-f]{3,8}$/i.test(v))found.push([k,v]);else if(v&&typeof v==='object'&&!Array.isArray(v)&&!React.isValidElement(v))for(const [kk,vv] of Object.entries(v))if(typeof vv==='string'&&/^#[0-9a-f]{3,8}$/i.test(vv))found.push([`${k}.${kk}`,vv]);}}return found;}

describe('provider colour table selection',()=>{
 it('display-p3 selects HIG’s iosDisplayP3 table on iOS only; Android, web and unknown values stay sRGB',()=>{
  expect(colorTable('display-p3','ios')).toBe(p3);expect(nativeDisplayP3).toBe(p3);
  expect(colorTable('srgb','ios')).toBe(nativeSrgb);
  expect(colorTable(undefined,'ios')).toBe(nativeSrgb);
  expect(colorTable('display-p3','android')).toBe(nativeSrgb);
  expect(colorTable('display-p3','web')).toBe(nativeSrgb);
  // Untyped JS cannot smuggle a raw table or another space through the prop.
  expect(colorTable('p3','ios')).toBe(nativeSrgb);expect(colorTable({action:'#123456'},'ios')).toBe(nativeSrgb);
 });
 it('defaults to sRGB, follows the nearest provider and is inherited by nested providers',()=>{
  const seen={};const Probe=({id})=>{seen[id]=useColors();return null;};
  withOS('ios',()=>{
   act(()=>{root=create(React.createElement(React.Fragment,null,React.createElement(Probe,{id:'none'}),React.createElement(HIGProvider,null,React.createElement(Probe,{id:'default'})),React.createElement(HIGProvider,{colorSpace:'display-p3'},React.createElement(Probe,{id:'p3'}),React.createElement(HIGProvider,{direction:'rtl'},React.createElement(Probe,{id:'nested'})),React.createElement(HIGProvider,{colorSpace:'srgb'},React.createElement(Probe,{id:'override'})))));});
  });
  expect(seen).toEqual({none:nativeSrgb,default:nativeSrgb,p3,nested:p3,override:nativeSrgb});
 });
 it('the iosDisplayP3 values the issue names differ from the sRGB numbers (#93 table)',()=>{
  expect({action:p3.action,positive:p3.positive,warning:p3.warning,negative:p3.negative,info:p3.info}).toEqual({action:'#00ff3d',positive:'#00ff3d',warning:'#fffa2e',negative:'#ff3d9e',info:'#2eb8ff'});
  for(const role of ['action','warning','negative','info'])expect(p3[role]).not.toBe(nativeSrgb[role]);
 });
});

describe('display-p3 renders the iosDisplayP3 values on iOS',()=>{
 it('Alert accent for info, warning and error (negative), and tone action',()=>withOS('ios',()=>{
  const accent=props=>flat(mount(React.createElement(Alert,{title:'Result',announce:false,...props})).findAll(n=>n.type===RN.View&&n.props.style)[0]).borderColor;
  expect(accent({})).toBe(p3.info);
  expect(accent({severity:'warning'})).toBe(p3.warning);
  expect(accent({severity:'error'})).toBe(p3.negative);
  expect(accent({severity:'success'})).toBe(p3.positive);
  expect(accent({severity:'error',tone:'action'})).toBe(p3.action);
  expect(accent({severity:'warning',tone:'#fffb38'})).toBe(p3.warning);
 }));
 it('Switch track for action and every tone role',()=>withOS('ios',()=>{
  const sw=props=>mount(React.createElement(Switch,{label:'Sound',...props})).findByType(RN.Switch).props;
  expect(sw({}).trackColor).toEqual({true:p3.action,false:p3.nested});expect(sw({}).ios_backgroundColor).toBe(p3.nested);
  for(const tone of ['positive','negative','warning','info','buy','sell'])expect(sw({tone}).trackColor.true).toBe(p3[tone]);
 }));
 it('Text, Surface, Separator, Button, Link, Slider, Spinner, Badge, Skeleton, Field and brand paint from the P3 table',()=>withOS('ios',()=>{
  expect(flat(mount(React.createElement(Text,null,'Prose')).findByType(RN.Text)).color).toBe(p3.text);
  expect(flat(mount(React.createElement(Surface,{testID:'s'})).findAll(n=>n.type===RN.View&&n.props.testID==='s')[0]).backgroundColor).toBe(p3.surface);
  expect(flat(mount(React.createElement(Separator)).findByType(RN.View)).backgroundColor).toBe(p3.border);
  const fill=intent=>{const pressable=mount(React.createElement(Button,{intent},'Go')).findAll(n=>n.props.accessibilityRole==='button'&&typeof n.props.style==='function')[0];return RN.StyleSheet.flatten(pressable.props.style({pressed:false})).backgroundColor;};
  expect(fill('primary')).toBe(p3.action);expect(fill('destructive')).toBe(p3.negative);expect(fill('secondary')).toBe(p3.nested);
  expect(flat(mount(React.createElement(Button,null,'Go')).findAllByType(RN.Text).at(-1)).color).toBe(p3.onAction);
  expect(flat(mount(React.createElement(Link,{href:'https://example.com'},'Docs')).findByType(RN.Text)).color).toBe(p3.action);
  expect(mount(React.createElement(Slider,{label:'Volume',value:20})).findAll(n=>n.props.minimumTrackTintColor)[0].props.minimumTrackTintColor).toBe(p3.action);
  expect(mount(React.createElement(Spinner)).findByType(RN.ActivityIndicator).props.color).toBe(p3.action);
  expect(flat(mount(React.createElement(Badge,null,'New')).findByType(RN.Text)).backgroundColor).toBe(p3.nested);
  expect(flat(mount(React.createElement(Skeleton)).findAll(n=>n.type===RN.View&&n.props.style)[0]).backgroundColor).toBe(p3.nested);
  const field=mount(React.createElement(Field,{label:'Amount',error:'Too precise'},React.createElement(Input)));
  expect(flat(field.findAllByType(RN.Text).find(t=>t.props.children==='Too precise')).color).toBe(p3.negative);
  const input=field.findByType(RN.TextInput);expect(input.props.placeholderTextColor).toBe(p3.muted);expect(flat(input)).toMatchObject({color:p3.text,backgroundColor:p3.surface,borderColor:p3.border});
  const {Rect,Path}=require('react-native-svg');
  const mark=mount(React.createElement(BrandMark));expect(mark.findByType(Rect).props.fill).toBe(p3.action);expect(mark.findAll(n=>n.props.strokeWidth==='16')[0].props.stroke).toBe(p3.background);
  expect(mount(React.createElement(CheckIcon)).findByType(Path).props.stroke).toBe(p3.text);
 }));
 it('Dialog surface paints from the P3 table',()=>withOS('ios',()=>{
  const sheet=mount(React.createElement(Dialog,{open:true,onOpenChange:jest.fn(),title:'Review',description:'Verify amount'},null)).findByType(RN.ScrollView);
  expect(RN.StyleSheet.flatten(sheet.props.contentContainerStyle).backgroundColor).toBe(p3.surface);
 }));
 it('no sRGB-only value leaks into a P3 render, and Android ignores display-p3',()=>{
  const gallery=React.createElement(React.Fragment,null,React.createElement(Alert,{title:'Warning',severity:'warning',announce:false}),React.createElement(Alert,{title:'Error',severity:'error',announce:false}),React.createElement(Alert,{title:'Info',announce:false}),React.createElement(Switch,{label:'On',checked:true}),React.createElement(Button,{intent:'destructive'},'Delete'),React.createElement(Button,null,'Go'),React.createElement(Spinner),React.createElement(BrandMark));
  const srgbOnly=new Set(Object.values(nativeSrgb).filter(v=>!Object.values(p3).includes(v)));
  const ios=withOS('ios',()=>painted(mount(gallery)));
  expect(ios.filter(([,v])=>srgbOnly.has(v))).toEqual([]);
  for(const role of ['action','warning','negative','info'])expect(ios.map(([,v])=>v)).toContain(p3[role]);
  const android=withOS('android',()=>painted(mount(gallery)));
  const p3Only=new Set(Object.values(p3).filter(v=>!Object.values(nativeSrgb).includes(v)));
  expect(android.filter(([,v])=>p3Only.has(v))).toEqual([]);
  for(const role of ['action','warning','negative','info'])expect(android.map(([,v])=>v)).toContain(nativeSrgb[role]);
 });
 it('without colorSpace components keep the sRGB table on iOS',()=>withOS('ios',()=>{
  const accent=flat(mount(React.createElement(Alert,{title:'Result',severity:'warning',announce:false}),{}).findAll(n=>n.type===RN.View&&n.props.style)[0]).borderColor;
  expect(accent).toBe(nativeSrgb.warning);
  expect(mount(React.createElement(BrandMark),{}).findByType(require('react-native-svg').Rect).props.fill).toBe(readFileSync('packages/tokens/assets/bloxwap-icon.svg','utf8').match(/<rect[^>]*fill="([^"]+)"/)[1]);
 }));
});

describe('components never bypass the provider table',()=>{
 const dir='packages/native/src';
 // provider.tsx owns table selection; every other module paints through useColors().
 const owner='provider.tsx';
 // Pure black has the same channels in sRGB and Display P3, so the modal scrim needs no table entry.
 const invariant=new Set(['#000b']);
 const violations=source=>{const found=[];for(const m of source.matchAll(/import\s*\{([^}]*)\}\s*from\s*['"]@bloxwap\/hig-tokens['"]/g))for(const name of m[1].split(',').map(s=>s.trim().split(/\s+as\s+/)[0]))if(/^native(Srgb|Colors|DisplayP3)$/.test(name))found.push(`imports ${name}`);if(/@bloxwap\/hig-tokens\/[^'"]*colors?|require\(['"]@bloxwap\/hig-tokens['"]\)/.test(source))found.push('reads tokens outside a named import');for(const m of source.matchAll(/['"](#[0-9a-fA-F]{3,8})['"]/g))if(!invariant.has(m[1].toLowerCase()))found.push(`hex literal ${m[1]}`);return found;};
 it('the guard catches a direct table import and a raw hex colour',()=>{
  expect(violations("import {nativeSrgb as colors,nativeMetrics as tokens} from '@bloxwap/hig-tokens';")).toEqual(['imports nativeSrgb']);
  expect(violations("import {nativeColors} from '@bloxwap/hig-tokens';")).toEqual(['imports nativeColors']);
  expect(violations("import {nativeDisplayP3 as p3} from '@bloxwap/hig-tokens';")).toEqual(['imports nativeDisplayP3']);
  expect(violations("<Rect fill='#00ff3f'/>")).toEqual(['hex literal #00ff3f']);
  expect(violations("import {nativeMetrics as tokens} from '@bloxwap/hig-tokens';const c=useColors();")).toEqual([]);
 });
 it('no native component imports nativeSrgb/nativeColors or paints a raw hex colour',()=>{
  const files=readdirSync(dir).filter(f=>/\.tsx?$/.test(f)&&f!==owner);
  expect(files.length).toBeGreaterThan(15);
  const report=Object.fromEntries(files.map(f=>[f,violations(readFileSync(`${dir}/${f}`,'utf8'))]).filter(([,v])=>v.length));
  expect(report).toEqual({});
  expect(readFileSync(`${dir}/${owner}`,'utf8')).toMatch(/nativeDisplayP3/);
 });
});
