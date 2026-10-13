const React=require('react');
const {create,act}=require('react-test-renderer');
const {TextInput,Modal}=require('react-native');
const {Button}=require('../../packages/native/src/button');
const {Field,AmountInput}=require('../../packages/native/src/field');
const {Checkbox,RadioGroup}=require('../../packages/native/src/selection');
const {Dialog}=require('../../packages/native/src/overlay');
const {NumberReadout}=require('../../packages/native/src/data');
let root;
afterEach(()=>{if(root)act(()=>root.unmount());root=null;});
function mount(element){act(()=>{root=create(element);});return root.root;}
it('native busy button exposes blocked action/progress state',()=>{const tree=mount(React.createElement(Button,{busy:true},'Confirm'));const button=tree.findAll(n=>n.props.accessibilityRole&&typeof n.props.onPress==='function')[0];expect(button.props.disabled).toBe(true);expect(button.props.accessibilityState).toEqual({disabled:true,busy:true});});
it('native checkbox updates state on accepted activation',()=>{const change=jest.fn();const tree=mount(React.createElement(Checkbox,{label:'Sound',onCheckedChange:change}));act(()=>tree.findAll(n=>n.props.accessibilityRole&&typeof n.props.onPress==='function')[0].props.onPress());expect(change).toHaveBeenCalledWith(true);expect(tree.findAll(n=>n.props.accessibilityRole&&typeof n.props.onPress==='function')[0].props.accessibilityState.checked).toBe(true);});
it('native controlled radio ignores repeated current values',()=>{const change=jest.fn();const tree=mount(React.createElement(RadioGroup,{label:'Side',value:'buy',onValueChange:change,options:[{value:'buy',label:'Buy'},{value:'sell',label:'Sell'}]}));act(()=>tree.findAll(n=>n.props.accessibilityRole==='radio'&&typeof n.props.onPress==='function')[0].props.onPress());expect(change).not.toHaveBeenCalled();act(()=>tree.findAll(n=>n.props.accessibilityRole==='radio'&&typeof n.props.onPress==='function')[1].props.onPress());expect(change).toHaveBeenCalledWith('sell');});
it('native amount entry keeps raw decimal string and labeled error hint',()=>{const tree=mount(React.createElement(Field,{label:'Amount',description:'Available: 1 BTC',error:'Precision exceeded'},React.createElement(AmountInput,{value:'0,001'})));const input=tree.findByType(TextInput);expect(input.props.value).toBe('0,001');expect(input.props.accessibilityLabel).toBe('Amount');expect(input.props.accessibilityHint).toContain('Precision exceeded');expect(input.props.keyboardType).toBe('decimal-pad');});
it('native Modal handles Android back without DOM imports',()=>{const close=jest.fn();const tree=mount(React.createElement(Dialog,{open:true,onOpenChange:close,title:'Review',description:'Verify amount'},null));act(()=>tree.findByType(Modal).props.onRequestClose());expect(close).toHaveBeenCalledWith(false);});
it('native unknown financial values stay distinct from zero',()=>{mount(React.createElement(NumberReadout,{value:null}));expect(JSON.stringify(root.toJSON())).toContain('—');});
