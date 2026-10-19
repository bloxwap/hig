const React=require('react');
const {create,act}=require('react-test-renderer');
const RN=require('react-native');
const {Dialog}=require('../../packages/native/src/overlay');
const {HIGProvider}=require('../../packages/native/src/provider');
let root,frames,next,os;
beforeEach(()=>{
 jest.clearAllMocks();
 frames=new Map();next=1;os=Object.getOwnPropertyDescriptor(RN.Platform,'OS');
 jest.spyOn(global,'requestAnimationFrame').mockImplementation(fn=>{const id=next++;frames.set(id,fn);return id;});
 jest.spyOn(global,'cancelAnimationFrame').mockImplementation(id=>frames.delete(id));
 jest.spyOn(RN,'findNodeHandle').mockImplementation(node=>node?._nativeTag??11);
 jest.spyOn(RN.AccessibilityInfo,'setAccessibilityFocus').mockImplementation(()=>{});
});
afterEach(()=>{if(root)act(()=>root.unmount());root=null;Object.defineProperty(RN.Platform,'OS',os);jest.restoreAllMocks();});
function flush(){const pending=[...frames.values()];frames.clear();act(()=>pending.forEach(fn=>fn(0)));}
const props={open:true,title:'Approve account',onOpenChange:jest.fn(),contentMode:'custom'};
function element(extra={},children=React.createElement(RN.Text,{testID:'caller-heading'},'Approve account'),reducedMotion=false){return React.createElement(HIGProvider,{reducedMotion},React.createElement(Dialog,{...props,...extra},children));}
function mount(extra,children,reducedMotion){act(()=>{root=create(element(extra,children,reducedMotion));});return root.root.findByType(RN.Modal);}
function update(extra,children,reducedMotion){act(()=>root.update(element(extra,children,reducedMotion)));return root.root.findByType(RN.Modal);}
it('custom content keeps one real modal, its caller stage/backdrop/surface and only the caller scroll view',()=>{
 const Stage=({children,...rest})=>React.createElement(RN.View,{...rest,testID:'gesture-root'},children);
 mount({stageComponent:Stage,stageStyle:{alignItems:'center'},contentStyle:{borderRadius:24,maxHeight:'92%'},testID:'host-surface',backdrop:React.createElement(RN.View,{testID:'host-backdrop'})},React.createElement(RN.ScrollView,{testID:'host-scroll'},React.createElement(RN.Text,null,'Caller actions')));
 expect(root.root.findAllByType(RN.Modal)).toHaveLength(1);
 expect(root.root.findAllByType(RN.ScrollView)).toHaveLength(1);
 const surface=root.root.findAllByType(RN.View).find(n=>n.props.testID==='host-surface');
 expect(RN.StyleSheet.flatten(surface.props.style)).toMatchObject({borderRadius:24,maxHeight:'92%'});
 expect(surface.props.accessible).toBe(false);expect(surface.props.accessibilityViewIsModal).toBe(true);expect(surface.props.accessibilityLabel).toBe('Approve account');
 expect(root.root.findAll(n=>n.props.accessibilityRole==='button')).toHaveLength(0);
 const heading=root.root.findAllByType(RN.Text).find(n=>n.props.accessibilityRole==='header');
 expect(heading.props.accessibilityLabel).toBe('Approve account');expect(RN.StyleSheet.flatten(heading.props.style)).toMatchObject({width:1,height:1,overflow:'hidden'});
 expect(root.root.findAllByProps({testID:'host-backdrop'}).length).toBeGreaterThan(0);
});
it('caller title receives initial focus without a duplicate heading and explicit initial focus wins',()=>{
 const titleRef=React.createRef(),initialFocusRef={current:{_nativeTag:22}};
 const children=React.createElement(RN.Text,{ref:titleRef,accessibilityRole:'header'},'Approve account');
 let modal=mount({titleRef},children);act(()=>modal.props.onShow());
 expect(root.root.findAllByType(RN.Text)).toHaveLength(1);
 expect(RN.findNodeHandle).toHaveBeenLastCalledWith(titleRef.current);
 modal=update({titleRef,initialFocusRef},children);act(()=>modal.props.onShow());
 expect(RN.AccessibilityInfo.setAccessibilityFocus).toHaveBeenLastCalledWith(22);
});
it('a rejected hardware/escape close retains the child state and never returns focus',()=>{
 const change=jest.fn(),returnFocusRef={current:{_nativeTag:33}};
 function Form(){const [text,setText]=React.useState('retained');return React.createElement(RN.TextInput,{value:text,onChangeText:setText,testID:'query'});}
 const child=React.createElement(Form);
 let modal=mount({onOpenChange:change,returnFocusRef,testID:'surface'},child);
 const input=root.root.findByType(RN.TextInput);act(()=>input.props.onChangeText('draft'));
 act(()=>{modal.props.onRequestClose();root.root.findAllByType(RN.View).find(n=>n.props.testID==='surface').props.onAccessibilityEscape();});modal=update({onOpenChange:change,returnFocusRef,testID:'surface'},child);flush();
 expect(change).toHaveBeenCalledWith(false);expect(modal.props.visible).toBe(true);expect(root.root.findByType(RN.TextInput)).toBe(input);
 expect(input.props.value).toBe('draft');expect(RN.AccessibilityInfo.setAccessibilityFocus).not.toHaveBeenCalled();
});
it('iOS fade returns focus once after native dismissal, and reopening cancels stale dismissal',()=>{
 Object.defineProperty(RN.Platform,'OS',{value:'ios',configurable:true});
 const returnFocusRef={current:{_nativeTag:33}};
 let modal=mount({animationType:'fade',returnFocusRef});
 modal=update({open:false,animationType:'fade',returnFocusRef});flush();expect(RN.AccessibilityInfo.setAccessibilityFocus).not.toHaveBeenCalled();
 act(()=>{modal.props.onDismiss();modal.props.onDismiss();});flush();expect(RN.AccessibilityInfo.setAccessibilityFocus).toHaveBeenCalledTimes(1);expect(RN.AccessibilityInfo.setAccessibilityFocus).toHaveBeenLastCalledWith(33);
 update({open:true,animationType:'fade',returnFocusRef});modal=update({open:false,animationType:'fade',returnFocusRef});
 update({open:true,animationType:'fade',returnFocusRef});act(()=>modal.props.onDismiss());flush();expect(RN.AccessibilityInfo.setAccessibilityFocus).toHaveBeenCalledTimes(1);
});
it('Android restores after accepted controlled close and reduced motion overrides a caller fade',()=>{
 Object.defineProperty(RN.Platform,'OS',{value:'android',configurable:true});
 const returnFocusRef={current:{_nativeTag:33}};
 expect(mount({animationType:'fade',returnFocusRef},undefined,true).props.animationType).toBe('none');
 update({open:false,animationType:'fade',returnFocusRef},undefined,true);flush();expect(RN.AccessibilityInfo.setAccessibilityFocus).toHaveBeenLastCalledWith(33);
 update({open:true,animationType:'fade',returnFocusRef},undefined,true);update({open:false,animationType:'fade',returnFocusRef},undefined,true);act(()=>root.unmount());root=null;flush();expect(RN.AccessibilityInfo.setAccessibilityFocus).toHaveBeenCalledTimes(1);
});
it('default mode retains its heading, supporting text, scroll and translated Close action',()=>{
 mount({contentMode:'default',description:'Verify this account',closeLabel:'Done'},React.createElement(RN.Text,null,'Body'));
 expect(root.root.findAllByType(RN.ScrollView)).toHaveLength(1);
 expect(JSON.stringify(root.toJSON())).toContain('Verify this account');expect(JSON.stringify(root.toJSON())).toContain('Done');
 expect(root.root.findByType(RN.Modal).props.animationType).toBe('none');
});
