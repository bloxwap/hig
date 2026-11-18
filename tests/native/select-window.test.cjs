const React=require('react');
const {create,act}=require('react-test-renderer');
const {Select}=require('../../packages/hig/native/src/select');
const {HIGProvider}=require('../../packages/hig/native/src/provider');
const {Button}=require('../../packages/hig/native/src/button');

it('bounds mounted options and preserves radio labels, disabled states and selection',()=>{
 const options=Array.from({length:1000},(_,index)=>({value:String(index),label:'Choice '+index,disabled:index===1,description:'Description '+index,lang:'en'}));
 const dimensions=jest.spyOn(require('react-native'),'useWindowDimensions').mockReturnValue({width:400,height:800,scale:2,fontScale:1});
 const choose=jest.fn();
 let root;
 act(()=>{root=create(React.createElement(HIGProvider,{reducedMotion:true},React.createElement(Select,{label:'Choice',options,onValueChange:choose})));});
 const open=()=>act(()=>root.root.findAllByType(Button)[0].props.onPress());
 expect(dimensions).not.toHaveBeenCalled();
 open();
 const list=root.root.findByType(require('react-native').FlatList);
 expect(list.props.initialNumToRender).toBe(14);
 const rows=root.root.findAll(row=>row.props.accessibilityRole==='radio'&&typeof row.props.onPress==='function');
 expect(rows.length).toBeGreaterThan(2);
 expect(rows.length).toBeLessThan(40);
 expect(rows[0].props.accessibilityState.checked).toBe(true);
 expect(rows[1].props.disabled).toBe(true);
 expect(rows[2].props.accessibilityHint).toBe('Description 2');
 dimensions.mockClear();
 act(()=>rows[2].props.onAccessibilityAction({nativeEvent:{actionName:'activate'}}));
 expect(dimensions).not.toHaveBeenCalled();
 expect(choose).toHaveBeenCalledWith('2');
 expect(root.root.findAllByType(Button)[0].props.children.join('')).toBe('Choice: Choice 2');
 open();
 const selected=root.root.findAll(row=>row.props.accessibilityRole==='radio'&&row.props.accessibilityState?.checked);
 expect(selected[0].props.accessibilityLabel).toBe('Choice 2');
 act(()=>root.unmount());
 dimensions.mockRestore();
});

it('releases the large option list dimension subscription when dismissed',()=>{
 const {Dimensions}=require('react-native');
 const listener=jest.spyOn(Dimensions,'addEventListener');
 const options=Array.from({length:51},(_,i)=>({value:String(i),label:'Choice '+i}));
 let root;
 try{
  act(()=>{root=create(React.createElement(HIGProvider,{reducedMotion:true},React.createElement(Select,{label:'Choice',options})));});
  listener.mockClear();
  act(()=>root.root.findAllByType(Button)[0].props.onPress());
  const subscriptions=listener.mock.results.map(result=>jest.spyOn(result.value,'remove'));
  expect(subscriptions.length).toBeGreaterThan(0);
  act(()=>root.root.findAllByType(Button).at(-1).props.onPress());
  for(const remove of subscriptions)expect(remove).toHaveBeenCalled();
 }finally{if(root)act(()=>root.unmount());listener.mockRestore();}
});

it('indexes a closed large Select in one value pass, including an empty first enabled key',()=>{
 let reads=0,root;
 const options=Array.from({length:1000},(_,i)=>({get value(){reads++;return i===3?'':String(i);},label:'Choice '+i,disabled:i<3}));
 try{
  act(()=>{root=create(React.createElement(Select,{label:'Choice',options}));});
  expect(root.root.findByType(Button).props.children.join('')).toBe('Choice: Choice 3');
  expect(reads).toBeLessThanOrEqual(1001);
  expect(()=>act(()=>root.update(React.createElement(Select,{label:'Choice',options:[options[1],options[1]]})))).toThrow('Select requires unique keys: 1');
 }finally{if(root)act(()=>root.unmount());}
});
