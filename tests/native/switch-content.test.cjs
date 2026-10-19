const React=require('react');
const {create,act}=require('react-test-renderer');
const RN=require('react-native');
const {SwitchRow}=require('../../packages/native/src/switch');
let root;
afterEach(()=>{if(root)act(()=>root.unmount());root=null;});
function render(props){return React.createElement(SwitchRow,props,React.createElement(RN.View,null,React.createElement(RN.Text,null,'Notifications'),React.createElement(RN.Text,null,'Order updates'),React.createElement(RN.View,{testID:'host-track'})));}
function mount(props){act(()=>{if(root)root.update(render(props));else root=create(render(props));});return root.root.findAll(node=>node.props.accessibilityRole==='switch'&&typeof node.props.onPress==='function')[0];}
it('a host notification card has one switch owner with its description, busy state and pressed appearance',()=>{
 const changed=jest.fn(),focus=jest.fn();
 const row=mount({label:'Notifications',accessibilityHint:'Order updates',testID:'notifications',checked:false,onCheckedChange:changed,onFocus:focus,accessibilityState:{busy:true,checked:true,disabled:true},style:({pressed})=>({padding:16,opacity:pressed?.7:1})});
 expect(row.props.accessibilityLabel).toBe('Notifications');expect(row.props.accessibilityHint).toBe('Order updates');expect(row.props.testID).toBe('notifications');
 expect(row.props.accessibilityState).toEqual({busy:true,checked:false,disabled:false});
 expect(RN.StyleSheet.flatten(row.props.style({pressed:true}))).toMatchObject({minHeight:48,padding:16,opacity:.7});
 expect(root.root.findAllByType(RN.Switch)).toHaveLength(0);
 const visual=root.root.findAllByType(RN.View).find(view=>view.props.importantForAccessibility==='no-hide-descendants');
 expect(visual.props).toMatchObject({pointerEvents:'none',accessibilityElementsHidden:true});
 act(()=>{row.props.onFocus();row.props.onPress();});
 expect(focus).toHaveBeenCalledTimes(1);expect(changed.mock.calls).toEqual([[true]]);expect(row.props.accessibilityState.checked).toBe(false);
});
it('pending controlled settings reject activation until the host commits its result',()=>{
 const changed=jest.fn();let row=mount({label:'Signals',checked:false,disabled:true,accessibilityState:{busy:true},onCheckedChange:changed});
 act(()=>row.props.onPress());expect(changed).not.toHaveBeenCalled();
 row=mount({label:'Signals',checked:true,onCheckedChange:changed});expect(row.props.accessibilityState).toEqual({checked:true,disabled:false});
 act(()=>row.props.onPress());expect(changed.mock.calls).toEqual([[false]]);expect(row.props.accessibilityState.checked).toBe(true);
});
it('an uncontrolled custom switch retains its checked state across host rerenders',()=>{
 const changed=jest.fn();let row=mount({label:'Sounds',defaultChecked:false,onCheckedChange:changed});
 act(()=>row.props.onPress());row=root.root.findAll(node=>node.props.accessibilityRole==='switch'&&typeof node.props.onPress==='function')[0];expect(row.props.accessibilityState.checked).toBe(true);
 act(()=>root.update(React.createElement(SwitchRow,{label:'Sounds',defaultChecked:false,onCheckedChange:changed},React.createElement(RN.Text,null,'Sounds enabled'))));
 expect(root.root.findAll(node=>node.props.accessibilityRole==='switch'&&typeof node.props.onPress==='function')[0].props.accessibilityState.checked).toBe(true);expect(changed.mock.calls).toEqual([[true]]);
});
it('a custom Expo web switch consumes Space once and rejects repeated or disabled activation',()=>{
 const os=RN.Platform.OS;Object.defineProperty(RN.Platform,'OS',{value:'web',configurable:true});
 try{const changed=jest.fn();const row=mount({label:'Mode',checked:false,onCheckedChange:changed});
  const target={},event={key:' ',target,currentTarget:target,repeat:false,preventDefault:jest.fn(),stopPropagation:jest.fn()};
  act(()=>row.props.onKeyDown(event));expect(changed.mock.calls).toEqual([[true]]);expect(event.preventDefault).toHaveBeenCalledTimes(1);expect(event.stopPropagation).toHaveBeenCalledTimes(1);
  act(()=>row.props.onKeyDown({...event,repeat:true}));expect(changed).toHaveBeenCalledTimes(1);
  const disabled=mount({label:'Mode',disabled:true,onCheckedChange:changed});act(()=>disabled.props.onKeyDown(event));expect(changed).toHaveBeenCalledTimes(1);
 }finally{Object.defineProperty(RN.Platform,'OS',{value:os,configurable:true});}
});
