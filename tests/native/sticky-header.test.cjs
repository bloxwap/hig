/** Native StickyHeaderLayout in a scroller's sticky slot: React Native moves the pinned child's style onto its own wrapper and gives the child flex:1, so the inset and fill must live on an inner view. */
const React=require('react');
const {readFileSync}=require('node:fs');
const {create:render,act}=require('react-test-renderer');
const {ScrollView,StyleSheet,Text,View}=require('react-native');
const {nativeSrgb}=require('@bloxwap/hig/tokens');
const {HIGProvider}=require('../../packages/hig/native/src/provider');
const {StickyHeaderLayout}=require('../../packages/hig/native/src/sticky-header');
const h=React.createElement;
let root;
function mount(element){if(root)act(()=>root.unmount());act(()=>{root=render(h(HIGProvider,{reducedMotion:true},element));});return root.root;}
afterEach(()=>{if(root)act(()=>root.unmount());root=undefined;});
const flat=style=>StyleSheet.flatten(style)??{};
// What ScrollViewStickyHeader does with the pinned child (react-native/Libraries/Components/ScrollView/ScrollViewStickyHeader.js).
function StickySlot({children}){const child=React.Children.only(children);return h(View,{testID:'rn-sticky-wrapper',style:[child.props.style,{zIndex:10}]},React.cloneElement(child,{style:{flex:1},onLayout:undefined}));}
// A scroll view that pins its stickyHeaderIndices the way React Native does.
const PinningScroll=React.forwardRef(function PinningScroll({stickyHeaderIndices=[],children,...props},ref){
 return h(ScrollView,{...props,ref,stickyHeaderIndices},React.Children.toArray(children).map((child,index)=>stickyHeaderIndices.includes(index)?h(StickySlot,{key:`sticky-${index}`},child):child));
});
describe('StickyHeaderLayout in a sticky slot',()=>{
 it('still matches React Native: the sticky wrapper takes the child style and the child gets flex:1',()=>{
  const source=readFileSync(require.resolve('react-native/Libraries/Components/ScrollView/ScrollViewStickyHeader.js'),'utf8');
  expect(source).toMatch(/child\.props\.style,/);expect(source).toMatch(/style:\s*styles\.fill/);expect(source).toMatch(/fill:\s*\{\s*flex:\s*1,?\s*\}/);
 });
 it('pins a child that carries only a row direction, with the inset and fill on the inner view',()=>{
  const view=mount(h(StickyHeaderLayout,{testID:'layout',headerTestID:'pinned',header:h(Text,null,'Title')},h(View,null)));
  const scroll=view.findByType(ScrollView);expect(scroll.props.stickyHeaderIndices).toEqual([0]);
  const pinned=view.findAll(node=>node.props.testID==='pinned'&&typeof node.type==='string')[0];
  let slot=pinned.parent;while(typeof slot.type!=='string')slot=slot.parent;expect(flat(slot.props.style)).toEqual({flexDirection:'row'});expect(slot.props.testID).toBeUndefined();
  const inner=flat(pinned.props.style);expect(inner).toMatchObject({flexGrow:1,paddingHorizontal:16,paddingTop:16,backgroundColor:'transparent'});expect(inner.flex).toBeUndefined();
 });
 it('keeps the inset and the scrolled fill on the header once React Native moves the pinned child style',()=>{
  const view=mount(h(StickyHeaderLayout,{testID:'layout',headerTestID:'pinned',scrollComponent:PinningScroll,header:h(Text,null,'Title')},h(View,null)));
  const wrapper=view.findAll(node=>node.props.testID==='rn-sticky-wrapper'&&typeof node.type==='string')[0];
  // The wrapper is a row, where the child's flex:1 fills the width and its height follows its content instead of measuring 0.
  expect(flat(wrapper.props.style)).toMatchObject({flexDirection:'row'});expect(flat(wrapper.props.style).paddingTop).toBeUndefined();expect(flat(wrapper.props.style).backgroundColor).toBeUndefined();
  const child=wrapper.children[0];const hostChild=typeof child.type==='string'?child:child.findAll(node=>typeof node.type==='string')[0];expect(flat(hostChild.props.style)).toEqual({flex:1});
  const pinned=()=>flat(view.findAll(node=>node.props.testID==='pinned'&&typeof node.type==='string')[0].props.style);
  expect(pinned()).toMatchObject({paddingTop:16,paddingHorizontal:16,backgroundColor:'transparent'});
  act(()=>{view.findByType(ScrollView).props.onScroll({nativeEvent:{contentOffset:{y:24}}});});
  expect(pinned()).toMatchObject({paddingTop:16,backgroundColor:nativeSrgb.background});expect(flat(wrapper.props.style).backgroundColor).toBeUndefined();
 });
});
describe('ScreenHeader with stickyHeader in a host sticky slot',()=>{
 const {ScreenHeader,useStickyHeaderScroll}=require('../../packages/hig/native/src/screen-header');
 const host=id=>view=>view.findAll(node=>node.props.testID===id&&typeof node.type==='string')[0];
 const header=host('pane-header');
 // The sticky child here is the ScreenHeader element itself, so what React Native moves is ScreenHeader's own `style` prop.
 function Pane({scroll:Scroll=ScrollView,style,inset=16}){const scroll=useStickyHeaderScroll();return h(Scroll,{testID:'scroller',stickyHeaderIndices:[0],onScroll:scroll.onScroll,scrollEventThrottle:scroll.scrollEventThrottle},h(ScreenHeader,{testID:'pane',title:'Pane',onBack:()=>{},action:h(Text,{testID:'pane-action'},'X'),stickyHeader:true,scrolled:scroll.scrolled,stickyHeaderBackground:'#111111',inset,style}),h(View,null));}
 const slotOf=row=>{let slot=row.parent;while(typeof slot.type!=='string')slot=slot.parent;return slot;};
 it('puts the row, the inset and the fill on the inner view, and only the host style and the row height on the pinned slot',()=>{
  const view=mount(h(Pane,{style:{marginBottom:4}}));
  const row=header(view),slot=slotOf(row);
  expect(flat(slot.props.style)).toEqual({minHeight:60,marginBottom:4});expect(slot.props.testID).toBeUndefined();
  expect(flat(row.props.style)).toEqual({flexDirection:'row',alignItems:'center',minHeight:60,paddingTop:16,paddingHorizontal:16,backgroundColor:'transparent'});
  for(const id of ['pane-back','pane-title','pane-action'])expect([id,!!host(id)(view)]).toEqual([id,true]);
  for(const id of ['pane-back','pane-title','pane-action']){let node=host(id)(view);while(node&&node!==row)node=node.parent;expect([id,node===row]).toEqual([id,true]);}
 });
 it('keeps the row, the inset and the scrolled fill on the header once React Native moves the pinned child style',()=>{
  const view=mount(h(Pane,{scroll:PinningScroll,style:{marginBottom:4}}));
  const wrapper=host('rn-sticky-wrapper')(view);
  // The host style travels to the wrapper; nothing HIG draws does.
  expect(flat(wrapper.props.style)).toEqual({marginBottom:4,zIndex:10});
  // The slot keeps the row's whole height whatever flex:1 does in the wrapper's column.
  expect(flat(slotOf(header(view)).props.style)).toEqual({minHeight:60,flex:1});
  const row=()=>flat(header(view).props.style);
  expect(row()).toEqual({flexDirection:'row',alignItems:'center',minHeight:60,paddingTop:16,paddingHorizontal:16,backgroundColor:'transparent'});
  act(()=>{view.findByType(ScrollView).props.onScroll({nativeEvent:{contentOffset:{y:24}}});});
  expect(row()).toMatchObject({flexDirection:'row',paddingTop:16,paddingHorizontal:16,backgroundColor:'#111111'});expect(flat(wrapper.props.style).backgroundColor).toBeUndefined();
 });
 it('keeps a 44dp slot without an inset, and leaves a header without stickyHeader as one view with the host style on it',()=>{
  let view=mount(h(Pane,{scroll:PinningScroll,inset:0}));
  expect(flat(slotOf(header(view)).props.style)).toEqual({minHeight:44,flex:1});expect(flat(header(view).props.style)).toEqual({flexDirection:'row',alignItems:'center',minHeight:44,backgroundColor:'transparent'});
  view=mount(h(ScreenHeader,{testID:'pane',title:'Pane',inset:16,style:{marginBottom:4}}));
  expect(flat(header(view).props.style)).toEqual({flexDirection:'row',alignItems:'center',minHeight:44,marginBottom:4});
  expect(view.findAll(node=>typeof node.type==='string'&&flat(node.props.style).minHeight===44&&node.props.testID===undefined&&node.children.some(child=>child.props?.testID==='pane-header'))).toHaveLength(0);
 });
});
