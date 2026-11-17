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
