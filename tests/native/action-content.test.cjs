const React=require('react');
const {create,act}=require('react-test-renderer');
const RN=require('react-native');
const {Button,Link}=require('../../packages/native/src/button');
const {HIGProvider}=require('../../packages/native/src/provider');
let root;
afterEach(()=>{if(root)act(()=>root.unmount());root=null;jest.restoreAllMocks();});
function mount(component,props,children,feedback){act(()=>{const next=React.createElement(HIGProvider,{feedback},React.createElement(component,props,children));if(root)root.update(next);else root=create(next);});return root.root.findAll(node=>node.props.accessibilityRole&&typeof node.props.onPress==='function')[0];}
const event=()=>({stopPropagation:jest.fn(),isDefaultPrevented:()=>false});
it('a custom card action preserves direct identity/trailing siblings and one canonical activation owner',()=>{
 const changed=jest.fn(),feedback={emit:jest.fn()},parts=[React.createElement(RN.Text,{key:'identity',testID:'identity'},'Account'),React.createElement(RN.View,{key:'trailing',testID:'trailing'})];
 const button=mount(Button,{contentMode:'custom',accessibilityLabel:'Open account',style:{flexDirection:'row',justifyContent:'space-between'},onPress:changed},parts,feedback);
 expect(React.Children.toArray(button.props.children).map(node=>node.props.testID)).toEqual(['identity','trailing']);
 expect(RN.StyleSheet.flatten(button.props.style({pressed:false}))).toMatchObject({minHeight:48,flexDirection:'row',justifyContent:'space-between'});
 const press=event();act(()=>button.props.onPress(press));expect(changed).toHaveBeenCalledTimes(1);expect(press.stopPropagation).toHaveBeenCalledTimes(1);expect(feedback.emit).toHaveBeenCalledTimes(1);
});
it('custom busy content keeps disabled/busy state and suppresses queued activation without adding visible copy',()=>{
 const changed=jest.fn(),feedback={emit:jest.fn()},content=React.createElement(RN.Text,null,'Saving account');
 const button=mount(Button,{contentMode:'custom',busy:true,onPress:changed},content,feedback);
 expect(button.props.children).toBe(content);expect(button.props.accessibilityState).toEqual({busy:true,disabled:true});
 act(()=>button.props.onPress(event()));expect(changed).not.toHaveBeenCalled();expect(feedback.emit).not.toHaveBeenCalled();
});
it('custom link navigation replaces Linking once and retains host identity, state and pressed style',()=>{
 const open=jest.spyOn(RN.Linking,'openURL').mockResolvedValue(undefined),navigate=jest.fn(),focus=jest.fn(),content=React.createElement(RN.Text,null,'Terms');
 const link=mount(Link,{href:'https://example.test/terms',contentMode:'custom',onPress:navigate,onFocus:focus,accessibilityLabel:'Terms',accessibilityHint:'Open in browser',accessibilityState:{busy:true},testID:'terms',hitSlop:8,style:({pressed})=>({opacity:pressed?0.7:1})},content);
 expect(link.props.children).toBe(content);expect(link.props).toMatchObject({accessibilityRole:'link',accessibilityLabel:'Terms',accessibilityHint:'Open in browser',testID:'terms',hitSlop:8,accessibilityState:{busy:true,disabled:false}});
 expect(RN.StyleSheet.flatten(link.props.style({pressed:true}))).toMatchObject({minHeight:48,minWidth:48,opacity:0.7});
 const press=event();act(()=>{link.props.onFocus();link.props.onPress(press);});expect(navigate).toHaveBeenCalledWith(press);expect(navigate).toHaveBeenCalledTimes(1);expect(open).not.toHaveBeenCalled();expect(focus).toHaveBeenCalledTimes(1);
});
it('disabled links reject direct queued callbacks and the default link keeps native navigation error handling',async()=>{
 const error=new Error('No native handler'),open=jest.spyOn(RN.Linking,'openURL').mockRejectedValue(error),navigate=jest.fn(),onError=jest.fn();
 const disabled=mount(Link,{href:'example://terms',disabled:true,onPress:navigate},'Terms');act(()=>disabled.props.onPress(event()));expect(navigate).not.toHaveBeenCalled();expect(open).not.toHaveBeenCalled();
 const native=mount(Link,{href:'example://terms',onError},'Terms');await act(async()=>{native.props.onPress(event());await Promise.resolve();});expect(open).toHaveBeenCalledWith('example://terms');expect(open).toHaveBeenCalledTimes(1);expect(onError).toHaveBeenCalledWith(error);
});
