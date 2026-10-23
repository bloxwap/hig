const React=require('react');
const {act,create}=require('react-test-renderer');
const RN=require('react-native');
const {HIGProvider,useColors}=require('../../packages/native/src/provider');
const {Button,Link}=require('../../packages/native/src/button');
const {Switch}=require('../../packages/native/src/switch');
const {BrandMark}=require('../../packages/native/src/brand');
const {nativeSrgb,nativeDisplayP3}=require('../../packages/tokens/dist/index.js');

let root;
afterEach(()=>{if(root)act(()=>root.unmount());root=null;});
function withOS(os,run){const descriptor=Object.getOwnPropertyDescriptor(RN.Platform,'OS');Object.defineProperty(RN.Platform,'OS',{value:os,configurable:true});try{run();}finally{Object.defineProperty(RN.Platform,'OS',descriptor);}}
const h=React.createElement;

test('primary accent inherits and overrides independently of colour space and status roles',()=>withOS('ios',()=>{
 const seen={};const Probe=({id})=>{seen[id]=useColors();return null;};
 act(()=>{root=create(h(React.Fragment,null,h(Probe,{id:'default'}),h(HIGProvider,{primaryColor:'#f00'},h(Probe,{id:'red'}),h(HIGProvider,{density:'compact'},h(Probe,{id:'nested'})),h(HIGProvider,{colorSpace:'display-p3'},h(Probe,{id:'p3'})),h(HIGProvider,{primaryColor:'#123456'},h(Probe,{id:'override'})))));});
 expect(seen.default).toBe(nativeSrgb);
 expect(seen.red).toEqual({...nativeSrgb,action:'#ff0000',focus:'#ff0000',onAction:'#000000'});
 expect(seen.nested).toEqual(seen.red);
 expect(seen.p3).toEqual({...nativeDisplayP3,action:'#ea3323',focus:'#ea3323',onAction:'#000000'});
 expect(seen.override.action).toBe('#123456');expect(seen.override.onAction).toBe('#ffffff');
}));

test.each(['android','web'])('%s paints custom colours in sRGB even with display-p3 selected',os=>withOS(os,()=>{
 let colors;const Probe=()=>{colors=useColors();return null;};
 act(()=>{root=create(h(HIGProvider,{primaryColor:'#f00',colorSpace:'display-p3'},h(Probe)));});
 expect(colors).toEqual({...nativeSrgb,action:'#ff0000',focus:'#ff0000',onAction:'#000000'});
}));

test('buttons, links and switches paint the accent while the approved Bloxwap mark stays green',()=>{
 act(()=>{root=create(h(HIGProvider,{primaryColor:'#f00'},h(Button,null,'Watch live'),h(Link,{href:'https://example.com'},'TV'),h(Switch,{label:'Live',checked:true}),h(BrandMark)));});
 const pressable=root.root.findAll(n=>n.props.accessibilityRole==='button'&&typeof n.props.style==='function')[0];
 expect(RN.StyleSheet.flatten(pressable.props.style({pressed:false})).backgroundColor).toBe('#ff0000');
 const label=root.root.findAllByType(RN.Text).find(n=>n.props.children==='Watch live');
 expect(RN.StyleSheet.flatten(label.props.style).color).toBe('#000000');
 const link=root.root.findAllByType(RN.Text).find(n=>n.props.children==='TV');
 expect(RN.StyleSheet.flatten(link.props.style).color).toBe('#ff0000');
 expect(root.root.findByType(RN.Switch).props.trackColor.true).toBe('#ff0000');
 expect(root.root.findByType(require('react-native-svg').Rect).props.fill).toBe(nativeSrgb.action);
});

test('changing and removing primaryColor updates mounted controls',()=>{
 let colors;const Probe=()=>{colors=useColors();return null;};
 act(()=>{root=create(h(HIGProvider,{primaryColor:'#f00'},h(Probe)));});
 act(()=>root.update(h(HIGProvider,{primaryColor:'#123456'},h(Probe))));
 expect(colors.action).toBe('#123456');expect(colors.onAction).toBe('#ffffff');
 act(()=>root.update(h(HIGProvider,null,h(Probe))));
 expect(colors).toBe(nativeSrgb);
});

test('a dark primary colour uses white action labels while destructive labels retain contrast',()=>{
 act(()=>{root=create(h(HIGProvider,{primaryColor:'#123456'},h(Button,null,'Watch live'),h(Button,{intent:'destructive'},'Delete')));});
 const labels=root.root.findAllByType(RN.Text);
 expect(RN.StyleSheet.flatten(labels.find(n=>n.props.children==='Watch live').props.style).color).toBe('#ffffff');
 expect(RN.StyleSheet.flatten(labels.find(n=>n.props.children==='Delete').props.style).color).toBe(nativeSrgb.onAction);
});
