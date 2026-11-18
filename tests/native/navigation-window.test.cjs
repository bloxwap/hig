const React=require('react');
const {act,create}=require('react-test-renderer');
const {FlatList,ScrollView}=require('react-native');
const NativeScrollView=jest.requireActual('react-native/Libraries/Components/ScrollView/ScrollView').default;
ScrollView.Context=NativeScrollView.Context;
const {Navigation}=require('../../packages/hig/native/src/navigation');
const {Button}=require('../../packages/hig/native/src/button');
const {HIGProvider}=require('../../packages/hig/native/src/provider');

it('bounds standalone navigation above 50 destinations and respects the parent scroll view',()=>{
 const onNavigate=jest.fn();
 const items=Array.from({length:1000},(_,i)=>({id:String(i),label:'Page '+i,onNavigate,active:i===1}));
 const view=(count,nested=false)=>{
  const nav=React.createElement(Navigation,{label:'Pages',items:items.slice(0,count)});
  return React.createElement(HIGProvider,null,nested?React.createElement(NativeScrollView,null,nav):nav);
 };
 let root;
 act(()=>{root=create(view(50))});
 try{
  const buttons=()=>root.root.findAllByType(Button);
  expect(buttons()).toHaveLength(50);
  act(()=>root.update(view(51)));expect(root.root.findByType(FlatList)).toBeTruthy();
  act(()=>root.update(view(1000)));
  const list=root.root.findByType(FlatList);
  expect(buttons()).toHaveLength(list.props.initialNumToRender);
  expect(buttons().length).toBeLessThan(40);
  expect(buttons()[1].props.accessibilityState.selected).toBe(true);
  act(()=>buttons()[1].props.onPress());
  expect(onNavigate).toHaveBeenCalledTimes(1);
  const unchangedStyle=buttons()[0].props.style;
  const replacement=jest.fn();
  items[1]={...items[1],active:false,onNavigate:replacement};
  items[2]={...items[2],active:true,label:'Renamed page'};
  act(()=>root.update(view(1000)));
  expect(buttons()[0].props.style).toBe(unchangedStyle);
  expect(buttons()[1].props.accessibilityState.selected).toBe(false);
  expect(buttons()[2].props.accessibilityState.selected).toBe(true);
  expect(buttons()[2].props.children).toBe('Renamed page');
  act(()=>buttons()[1].props.onPress());
  expect(replacement).toHaveBeenCalledTimes(1);
  act(()=>root.update(view(51,true)));expect(buttons()).toHaveLength(51);
  expect(root.root.findAllByType(FlatList)).toHaveLength(0);
 }finally{act(()=>root.unmount())}
});
