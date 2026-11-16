/** Native ListRow, ListGroup and small-primitive slots the app panes asked for. */
const React=require('react');
const {create:render,act}=require('react-test-renderer');
const {StyleSheet,View,Text:RNText,ScrollView,ActivityIndicator,Platform}=require('react-native');
const {nativeSrgb:colors}=require('@bloxwap/hig/tokens');
const {HIGProvider}=require('../../packages/hig/native/src/provider');
const {ListGroup,ListRow}=require('../../packages/hig/native/src/list-group');
const {Text}=require('../../packages/hig/native/src/surface');
const {Field,SearchInput}=require('../../packages/hig/native/src/field');
const {Switch,SegmentedControl,Filter}=require('../../packages/hig/native/src/selection');
const {Alert,Progress}=require('../../packages/hig/native/src/status');
const h=React.createElement;
let root;
function mount(element,provider={}){if(root)act(()=>root.unmount());act(()=>{root=render(h(HIGProvider,provider,element));});return root.root;}
const flat=node=>StyleSheet.flatten(typeof node.props.style==='function'?node.props.style({pressed:false}):node.props.style)??{};
const host=(tree,testID)=>tree.findAll(node=>node.props.testID===testID&&typeof node.type==='string')[0];
const pressable=(tree,testID)=>tree.findAll(node=>node.props.testID===testID&&typeof node.props.onPress==='function')[0];
const text=node=>typeof node==='string'?node:node.children.map(text).join('');
const texts=tree=>tree.findAll(node=>node.type==='Text').map(text);
afterEach(()=>{if(root)act(()=>root.unmount());root=undefined;jest.restoreAllMocks();});

describe('ListRow',()=>{
 it('draws a muted description under the label and reads it with the label',()=>{
  const tree=mount(h(ListRow,{label:'Card',description:'Instant card deposit',value:'$5',testID:'row',onSelect(){}}));
  expect(host(tree,'row').props.accessibilityLabel).toBe('Card, Instant card deposit, $5');
  expect(flat(host(tree,'row-description'))).toMatchObject({fontSize:14,lineHeight:20,color:colors.muted});
  expect(text(host(tree,'row-description'))).toBe('Instant card deposit');
 });
 it('tones the label destructive or muted',()=>{
  let tree=mount(h(ListRow,{label:'Delete account',tone:'destructive',testID:'row',onSelect(){}}));
  const label=tree.findAll(node=>node.type==='Text'&&text(node)==='Delete account')[0];expect(flat(label).color).toBe(colors.negative);
  tree=mount(h(ListRow,{label:'Done',tone:'muted',testID:'row'}));expect(flat(tree.findAll(node=>node.type==='Text'&&text(node)==='Done')[0]).color).toBe(colors.muted);
 });
 it('draws the check instead of the chevron on a selected row and exposes selected; an unselected choice draws neither',()=>{
  let tree=mount(h(ListRow,{label:'Embedded',selected:true,testID:'row',onSelect(){}}));
  expect(host(tree,'row').props.accessibilityState).toEqual({disabled:false,selected:true});expect(host(tree,'row-check')).toBeDefined();expect(host(tree,'row-chevron')).toBeUndefined();
  tree=mount(h(ListRow,{label:'External',selected:false,testID:'row',onSelect(){}}));
  expect(host(tree,'row').props.accessibilityState).toEqual({disabled:false,selected:false});expect(host(tree,'row-check')).toBeUndefined();expect(host(tree,'row-chevron')).toBeUndefined();
  tree=mount(h(ListRow,{label:'External',selected:false,disclosure:'chevron',testID:'row',onSelect(){}}));expect(host(tree,'row-chevron')).toBeDefined();
 });
 it('shows a spinner while busy, reads busy and ignores the press without dimming',()=>{
  const select=jest.fn();
  const tree=mount(h(ListRow,{label:'Link account',busy:true,testID:'row',onSelect:select}));
  const row=host(tree,'row');expect(row.props.accessibilityState).toEqual({disabled:false,busy:true});
  expect(row.props.accessibilityLabel).toBe(Platform.OS==='android'?'Link account':'Link account · Working');
  expect(host(tree,'row-busy')).toBeDefined();expect(host(tree,'row-chevron')).toBeUndefined();expect(flat(row).opacity).toBe(1);
  expect(tree.findAll(node=>node.props.testID==='row'&&typeof node.props.onPress==='function')).toHaveLength(0);expect(select).not.toHaveBeenCalled();
 });
 it('draws the external arrow, mirrored in RTL, or nothing through disclosure',()=>{
  let tree=mount(h(ListRow,{label:'Docs',disclosure:'external',testID:'row',onSelect(){}}));expect(flat(host(tree,'row-external')).transform).toBeUndefined();
  tree=mount(h(ListRow,{label:'Docs',disclosure:'external',testID:'row',onSelect(){}}),{direction:'rtl'});expect(flat(host(tree,'row-external')).transform).toEqual([{scaleX:-1}]);
  tree=mount(h(ListRow,{label:'Docs',disclosure:'none',testID:'row',onSelect(){}}));expect(host(tree,'row-chevron')).toBeUndefined();expect(host(tree,'row-external')).toBeUndefined();
 });
 it('forwards its ref and passes Pressable props through',()=>{
  const ref=React.createRef(),long=jest.fn();
  const tree=mount(h(ListRow,{ref,label:'Signals',testID:'row',android_disableSound:true,hitSlop:4,onLongPress:long,accessibilityHint:'Opens signals',onSelect(){}}));
  const row=pressable(tree,'row');expect(row.props).toMatchObject({android_disableSound:true,hitSlop:4,accessibilityHint:'Opens signals'});expect(row.props.onLongPress).toBe(long);
  expect(ref.current).toBeTruthy();
  const plain=React.createRef();mount(h(ListRow,{ref:plain,label:'Version',value:'0.6.0'}));expect(plain.current).toBeTruthy();
 });
 it('is a whole-row switch with checked and onCheckedChange, drawing the track and reading its description as the hint',()=>{
  const change=jest.fn();
  let tree=mount(h(ListRow,{label:'Swing alerts',description:'Daily at most',checked:false,onCheckedChange:change,testID:'row',android_disableSound:true}));
  const row=pressable(tree,'row');expect(row.props).toMatchObject({accessibilityRole:'switch',accessibilityLabel:'Swing alerts',accessibilityHint:'Daily at most',android_disableSound:true});
  expect(row.props.accessibilityState).toMatchObject({checked:false,disabled:false});expect(flat(host(tree,'row-track')).backgroundColor).not.toBe(colors.action);
  act(()=>{row.props.onPress({});});expect(change).toHaveBeenCalledWith(true);
  tree=mount(h(ListRow,{label:'Swing alerts',defaultChecked:true,testID:'row'}));expect(flat(host(tree,'row-track')).backgroundColor).toBe(colors.action);
  act(()=>{pressable(tree,'row').props.onPress({});});expect(flat(host(tree,'row-track')).backgroundColor).not.toBe(colors.action);expect(pressable(tree,'row').props.accessibilityState.checked).toBe(false);
  tree=mount(h(ListRow,{label:'Swing alerts',checked:true,busy:true,onCheckedChange:change,testID:'row'}));
  expect(pressable(tree,'row').props.accessibilityState).toMatchObject({busy:true,disabled:true});act(()=>{pressable(tree,'row').props.onPress({});});expect(change).toHaveBeenCalledTimes(1);
 });
 it('keeps the 0.6.0 tree when none of the new props are given',()=>{
  const tree=mount(h(ListRow,{label:'Notifications',value:'Off',testID:'row',onSelect(){}}));
  const row=host(tree,'row');expect(row.props.accessibilityLabel).toBe('Notifications, Off');expect(row.props.accessibilityState).toEqual({disabled:false});
  expect(host(tree,'row-chevron')).toBeDefined();expect(tree.findAllByType(ActivityIndicator)).toHaveLength(0);
 });
});
describe('ListGroup',()=>{
 it('takes a node title, a title accessory and a heading action with a 48dp target',()=>{
  const cancel=jest.fn();
  let tree=mount(h(ListGroup,{title:h(Text,null,'Tasks'),titleAccessory:'2/3',action:{label:'Cancel all',onSelect:cancel},testID:'group'},h(ListRow,{label:'Verify email'})));
  expect(host(tree,'group-title').props).toMatchObject({accessible:true,accessibilityRole:'header'});expect(text(host(tree,'group-title-accessory'))).toBe('2/3');
  const action=pressable(tree,'group-action');expect(action.props).toMatchObject({accessibilityRole:'button',accessibilityLabel:'Cancel all',hitSlop:{top:12,bottom:12,left:8,right:8}});
  act(()=>{action.props.onPress({});});expect(cancel).toHaveBeenCalledTimes(1);
  tree=mount(h(ListGroup,{title:'Orders',action:{label:'Cancel all',onSelect:cancel,disabled:true},testID:'group'}));expect(pressable(tree,'group-action').props.disabled).toBe(true);
 });
 it('holds host content under the title, with no row container when there are no rows',()=>{
  let tree=mount(h(ListGroup,{title:'Custom code',intro:h(Text,null,'Unlocks at 10 referrals'),testID:'group'}));
  expect(text(host(tree,'group-intro'))).toBe('Unlocks at 10 referrals');expect(host(tree,'group-rows')).toBeUndefined();
  tree=mount(h(ListGroup,{title:'Settings',testID:'group'},h(ListRow,{label:'Code'})));
  expect(flat(host(tree,'group-title'))).toMatchObject({paddingHorizontal:4});expect(host(tree,'group-header')).toBeUndefined();expect(host(tree,'group-rows')).toBeDefined();
 });
});
describe('Small primitives',()=>{
 it('Text takes a muted tone and the caption size, and a style still wins',()=>{
  let tree=mount(h(Text,{tone:'muted',size:'caption',testID:'t'},'Note'));expect(flat(host(tree,'t'))).toMatchObject({color:colors.muted,fontSize:12,lineHeight:18});
  tree=mount(h(Text,{tone:'muted',testID:'t',style:{color:colors.text}},'Note'));expect(flat(host(tree,'t')).color).toBe(colors.text);
 });
 it('Field draws a positive description as a polite live success line',()=>{
  const tree=mount(h(Field,{label:'Code',description:'Available',descriptionTone:'positive'},h(View)));
  const line=tree.findAll(node=>node.type==='Text'&&text(node)==='Available')[0];expect(flat(line).color).toBe(colors.positive);expect(line.props.accessibilityLiveRegion).toBe('polite');
 });
 it('SearchInput draws a trailing slot and a named clear button',()=>{
  const clear=jest.fn();
  let tree=mount(h(SearchInput,{testID:'search',value:'btc',onChangeText(){},onClear:clear,trailing:h(View,{testID:'extra'})}));
  const button=pressable(tree,'search-clear');expect(button.props).toMatchObject({accessibilityRole:'button',accessibilityLabel:'Clear search'});expect(host(tree,'extra')).toBeDefined();
  act(()=>{button.props.onPress({});});expect(clear).toHaveBeenCalledTimes(1);
  tree=mount(h(SearchInput,{testID:'search',value:'',onChangeText(){},onClear:clear}),{messages:{clearSearch:'Effacer'}});expect(pressable(tree,'search-clear')).toBeUndefined();
  tree=mount(h(SearchInput,{testID:'search',value:'e',onChangeText(){},onClear:clear}),{messages:{clearSearch:'Effacer'}});expect(pressable(tree,'search-clear').props.accessibilityLabel).toBe('Effacer');
 });
 it('Switch takes a testID and can hide its visible label',()=>{
  const tree=mount(h(Switch,{label:'Live Mode',hideLabel:true,testID:'live'}));
  expect(pressable(tree,'live').props).toMatchObject({accessibilityRole:'switch',accessibilityLabel:'Live Mode'});expect(texts(tree)).not.toContain('Live Mode');
 });
 it('SegmentedControl can hide its visible label and keeps it as the group name',()=>{
  const tree=mount(h(SegmentedControl,{label:'Chain',hideLabel:true,testID:'seg',options:[{value:'a',label:'Base'},{value:'b',label:'Solana'}],defaultValue:'a'}));
  expect(host(tree,'seg').props).toMatchObject({accessibilityRole:'radiogroup',accessibilityLabel:'Chain'});expect(texts(tree)).not.toContain('Chain');
 });
 it('Filter draws in a host scroll component',()=>{
  const Host=jest.fn(props=>h(ScrollView,props));
  const tree=mount(h(Filter,{label:'Chains',options:[{value:'',label:'All'},{value:'1',label:'Base'}],scrollComponent:Host}));
  expect(Host).toHaveBeenCalled();expect(Host.mock.calls[0][0]).toMatchObject({horizontal:true,accessibilityRole:'radiogroup',accessibilityLabel:'Chains'});
  expect(tree.findAll(node=>node.props.accessibilityRole==='radio'&&typeof node.props.onPress==='function')).toHaveLength(2);
 });
 it('Progress can hide the value suffix and still reads the value',()=>{
  const tree=mount(h(Progress,{label:'Tasks',value:2,max:3,hideValue:true}));
  expect(texts(tree)).toContain('Tasks');expect(texts(tree).join('')).not.toContain('2/3');
  expect(tree.findAll(node=>node.props.accessibilityRole==='progressbar')[0].props.accessibilityValue).toMatchObject({min:0,max:3,now:2});
 });
 it('Alert wraps string children in Text',()=>{
  const tree=mount(h(Alert,{title:'Heads up',announce:false},'Network fees are high'));
  expect(tree.findAll(node=>node.type==='Text').some(node=>text(node)==='Network fees are high')).toBe(true);
  expect(tree.findAllByType(RNText).length).toBeGreaterThan(1);
 });
});
