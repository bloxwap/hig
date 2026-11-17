/** Gaps the app conversions found: small optional props on shared components (native). */
const React=require('react');
const {create:render,act}=require('react-test-renderer');
const {StyleSheet,TextInput}=require('react-native');
const {nativeSrgb}=require('../../packages/hig/tokens/src/index');
const {HIGProvider}=require('../../packages/hig/native/src/provider');
const {Field,Input}=require('../../packages/hig/native/src/field');
const h=React.createElement;
let root;
function mount(element,provider={}){if(root)act(()=>root.unmount());act(()=>{root=render(h(HIGProvider,{reducedMotion:true,...provider},element));});return root.root;}
const all=(view,id)=>view.findAll(node=>node.props.testID===id);
const host=(view,id)=>all(view,id).find(node=>typeof node.type==='string');
const flat=node=>StyleSheet.flatten(typeof node.props.style==='function'?node.props.style({pressed:false}):node.props.style)??{};
const text=node=>typeof node==='string'?node:node.children.map(text).join('');
afterEach(()=>{if(root)act(()=>root.unmount());root=undefined;});

describe('Input prefix',()=>{
 it('draws the prefix muted on the leading edge, starts the text after it once measured, and leads the hint with it',()=>{
  const view=mount(h(Field,{label:'Username',description:'Letters and digits.'},h(Input,{prefix:'@',testID:'handle',value:'joe'})));
  const input=view.findByType(TextInput);expect(input.props.value).toBe('joe');expect(input.props.accessibilityLabel).toBe('Username');expect(input.props.accessibilityHint).toBe('@. Letters and digits.');
  const prefix=host(view,'handle-prefix');expect(text(prefix)).toBe('@');expect(flat(prefix).color).toBe(nativeSrgb.muted);
  // The prefix is hidden from assistive technology: the hint already says it.
  let node=prefix;while(node&&!node.props.accessibilityElementsHidden)node=node.parent;expect(node).toBeTruthy();
  expect(flat(input).paddingStart).toBe(20+10+4);
  act(()=>prefix.props.onLayout({nativeEvent:{layout:{width:13.2}}}));expect(flat(view.findByType(TextInput)).paddingStart).toBe(20+14+4);
 });
 it('leaves an input without a prefix as before, and keeps a host hint',()=>{
  let view=mount(h(Field,{label:'Name',description:'Shown on your profile.'},h(Input,{testID:'name'})));
  const input=view.findByType(TextInput);expect(input.props.accessibilityHint).toBe('Shown on your profile.');expect(flat(input).paddingStart).toBeUndefined();expect(all(view,'name-prefix')).toHaveLength(0);
  view=mount(h(Input,{prefix:'$',accessibilityHint:'Amount in dollars'}));expect(view.findByType(TextInput).props.accessibilityHint).toBe('Amount in dollars');
 });
});

describe('ListRow accessibilityLabel and a rich description',()=>{
 const {ListRow}=require('../../packages/hig/native/src/list-group');
 const {Text}=require('../../packages/hig/native/src/surface');
 const {View}=require('react-native');
 const rich=h(View,{testID:'rich',style:{flexDirection:'row'}},h(View,{testID:'arrow'}),h(Text,{style:{color:'#0f0'}},'10×'),h(Text,null,' • 0.5'));
 it('draws a description of several nodes as given in a View, and names a pressable row with accessibilityLabel',()=>{
  const select=jest.fn();
  const view=mount(h(ListRow,{testID:'btc',label:'BTC',description:rich,value:'+$12',onSelect:select,accessibilityLabel:'Long BTC, 10×, 0.5 BTC, up $12'}));
  const description=host(view,'btc-description');expect(description.type).toBe('View');expect(all(description,'rich').length).toBeGreaterThan(0);expect(all(description,'arrow').length).toBeGreaterThan(0);
  const row=view.findAll(node=>node.props.accessibilityRole==='button'&&typeof node.props.onPress==='function'&&typeof node.type!=='string')[0];
  expect(row.props.accessibilityLabel).toBe('Long BTC, 10×, 0.5 BTC, up $12');
  act(()=>row.props.onPress());expect(select).toHaveBeenCalledTimes(1);
 });
 it('keeps a string or a single Text description in the muted line, read with the label as before',()=>{
  let view=mount(h(ListRow,{testID:'a',label:'Wallet',description:'0x12…34',onSelect:()=>{}}));
  const line=host(view,'a-description');expect(line.type).toBe('Text');expect(flat(line).color).toBe(nativeSrgb.muted);
  expect(view.findAll(node=>node.props.accessibilityLabel==='Wallet, 0x12…34'&&typeof node.type!=='string').length).toBeGreaterThan(0);
  view=mount(h(ListRow,{testID:'b',label:'Wallet',description:h(Text,null,'Pending'),onSelect:()=>{}}));expect(host(view,'b-description').type).toBe('Text');
 });
 it('makes a static row one element named by accessibilityLabel, and keeps a trailing control its own target',()=>{
  let view=mount(h(ListRow,{testID:'s',label:'Withdrawal',description:rich,value:'$40',accessibilityLabel:'Withdrawal, $40, pending'}));
  const row=host(view,'s');expect(row.props.accessible).toBe(true);expect(row.props.accessibilityLabel).toBe('Withdrawal, $40, pending');
  const press=jest.fn();
  view=mount(h(ListRow,{testID:'t',label:'Withdrawal',value:'$40',accessibilityLabel:'Withdrawal, $40, pending',trailing:h(require('../../packages/hig/native/src/button').Button,{testID:'t-cancel',onPress:press},'Cancel')}));
  expect(host(view,'t').props.accessible).toBeUndefined();
  expect(view.findAll(node=>node.props.accessible===true&&node.props.accessibilityLabel==='Withdrawal, $40, pending'&&typeof node.type==='string')).toHaveLength(1);
  const value=host(view,'t-value');expect(value.props.accessibilityElementsHidden).toBe(true);
  const cancel=view.findAll(node=>node.props.testID==='t-cancel'&&node.props.accessibilityRole==='button'&&typeof node.type==='string')[0];let node=cancel;let hiddenAbove=false;while(node){if(node.props.accessibilityElementsHidden)hiddenAbove=true;node=node.parent;}expect(hiddenAbove).toBe(false);
 });
 it('names a switch row with accessibilityLabel, its description staying the hint',()=>{
  const view=mount(h(ListRow,{testID:'sw',label:'Alerts',description:'Price moves',checked:true,onCheckedChange:()=>{},accessibilityLabel:'Price alerts'}));
  const control=view.findAll(node=>node.props.accessibilityRole==='switch'&&typeof node.type==='string')[0];expect(control.props.accessibilityLabel).toBe('Price alerts');expect(control.props.accessibilityHint).toBe('Price moves');
 });
});
