const React=require('react');
const {create,act}=require('react-test-renderer');
const {Text:RNText,ScrollView,View,StyleSheet,Platform,AccessibilityInfo,Dimensions}=require('react-native');
const {Toast}=require('../../packages/native/src/status');
const {Button}=require('../../packages/native/src/button');
const {Heading}=require('../../packages/native/src/surface');
const {HIGProvider}=require('../../packages/native/src/provider');
const h=React.createElement;
let root;
function mount(node){act(()=>{root=create(node);});return root.root;}
afterEach(()=>{if(root)act(()=>root.unmount());root=null;});

it('renders all notices with body typography inside a bounded scrolling viewport (#120)',()=>{
 const notices=Array.from({length:6},(_,i)=>({id:String(i),message:`Notice ${i}`,description:`Details ${i}`,severity:'info'}));
 const tree=mount(h(Toast,{notices,onDismiss:jest.fn(),testID:'notices'}));
 expect(tree.findAllByType(Heading)).toHaveLength(0);
 const viewport=tree.findAllByType(View).find(node=>node.props.testID==='notices');
 expect(StyleSheet.flatten(viewport.props.style).maxHeight).toBe(Dimensions.get('window').height*.6);
 const scroll=tree.findByType(ScrollView);
 expect(scroll.props.nestedScrollEnabled).toBe(true);
 expect(StyleSheet.flatten(scroll.props.style)).toMatchObject({flexGrow:0,flexShrink:1});
 for(const notice of notices){
  for(const text of [notice.message,notice.description]){
   const run=tree.findAllByType(RNText).find(node=>node.props.children===text);
   expect(StyleSheet.flatten(run.props.style)).toMatchObject({fontSize:16,lineHeight:24});
   expect(run.props.allowFontScaling).not.toBe(false);
   expect(run.props.numberOfLines).toBeUndefined();
  }
 }
 act(()=>root.update(h(Toast,{notices,maxHeight:180,testID:'notices'})));
 expect(StyleSheet.flatten(root.root.findAllByType(View).find(node=>node.props.testID==='notices').props.style).maxHeight).toBe(180);
 expect(root.root.findAllByType(Button)).toHaveLength(0);
});

it('keeps host recovery actions and localized dismissal, respecting non-closable notices (#120)',()=>{
 const dismissed=jest.fn(),retry=jest.fn();
 const notices=[{id:'persistent',message:'Keep this',severity:'error',closable:false,action:h(Button,{onPress:retry},'Retry')},{id:'dismissible',message:'Copied',severity:'success'}];
 const tree=mount(h(HIGProvider,{messages:{dismiss:'Fermer'}},h(Toast,{notices,onDismiss:dismissed})));
 const buttons=tree.findAllByType(Button);
 expect(buttons).toHaveLength(2);
 const dismiss=buttons.find(node=>node.props.children==='Fermer');
 expect(dismiss.props.accessibilityLabel).toContain('Fermer');
 act(()=>dismiss.props.onPress());expect(dismissed).toHaveBeenCalledWith('dismissible');
 act(()=>buttons.find(node=>node.props.children==='Retry').props.onPress());expect(retry).toHaveBeenCalledTimes(1);
 expect(JSON.stringify(root.toJSON())).toContain('Keep this');
});

it('announces description changes once and coalesces duplicate ids with error priority (#120)',()=>{
 const descriptor=Object.getOwnPropertyDescriptor(Platform,'OS'),original=AccessibilityInfo.announceForAccessibilityWithOptions;
 Object.defineProperty(Platform,'OS',{value:'ios',configurable:true});
 const announce=AccessibilityInfo.announceForAccessibilityWithOptions=jest.fn();
 try{
  const notices=[{id:'error',message:'Failed',description:'Try again',severity:'error'},{id:'copy',message:'Copied',severity:'info'},{id:'copy',message:'Copied',severity:'info'}];
  mount(h(Toast,{notices}));
  expect(announce).toHaveBeenCalledTimes(1);expect(announce).toHaveBeenLastCalledWith('Failed. Try again',{queue:false});
  act(()=>root.update(h(Toast,{notices:[...notices]})));expect(announce).toHaveBeenCalledTimes(1);
  act(()=>root.update(h(Toast,{notices:[{...notices[0],description:'Retry now'}]})));
  expect(announce).toHaveBeenCalledTimes(2);expect(announce).toHaveBeenLastCalledWith('Failed. Retry now',{queue:false});
 }finally{Object.defineProperty(Platform,'OS',descriptor);AccessibilityInfo.announceForAccessibilityWithOptions=original;}
});
