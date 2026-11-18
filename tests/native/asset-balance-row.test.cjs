/** Native AssetBalanceRow: one holding as a capsule row with live numbers. */
const React=require('react');
const {create:render,act}=require('react-test-renderer');
const {StyleSheet,View,Image}=require('react-native');
const {HIGProvider}=require('../../packages/hig/native/src/provider');
const {AssetBalanceRow}=require('../../packages/hig/native/src/asset-balance-row');
const {NumberFlow}=require('../../packages/hig/native/src/animated-number');
const h=React.createElement;
let root;
const tree=props=>h(HIGProvider,{reducedMotion:true},h(AssetBalanceRow,{name:'Solana',symbol:'SOL',testID:'row',...props}));
function mount(props){if(root)act(()=>root.unmount());act(()=>{root=render(tree(props));});return root.root;}
const update=props=>{act(()=>{root.update(tree(props));});return root.root;};
const flat=node=>StyleSheet.flatten(typeof node.props.style==='function'?node.props.style({pressed:false}):node.props.style)??{};
const host=(view,testID)=>view.findAll(node=>node.props.testID===testID&&typeof node.type==='string')[0];
const outer=(view,testID)=>view.findAll(node=>node.props.testID===testID&&node.props.accessibilityLabel!==undefined)[0];
const flows=view=>view.findAllByType(NumberFlow);
afterEach(()=>{if(root)act(()=>root.unmount());root=undefined;});

it('is a capsule concentric with its 40dp avatar, laid out by writing direction',()=>{
 const view=mount({value:203,balance:1.25});const style=flat(host(view,'row'));
 expect(style).toMatchObject({flexDirection:'row',minHeight:56,borderRadius:28,paddingVertical:8,paddingStart:8,paddingEnd:16,gap:12});
 expect(style.paddingLeft).toBeUndefined();expect(style.paddingRight).toBeUndefined();
});
it('draws the avatar from a URL, a host element, or the first letters of the symbol',()=>{
 let view=mount({value:1,icon:'https://example.com/sol.png'});
 expect(view.findAllByType(Image)[0].props.source).toEqual({uri:'https://example.com/sol.png'});expect(flat(view.findAllByType(Image)[0])).toMatchObject({width:40,height:40,borderRadius:20});
 view=mount({value:1,icon:h(View,{testID:'art'})});expect(host(view,'art')).toBeDefined();expect(view.findAllByType(Image)).toHaveLength(0);
 view=mount({value:1,symbol:'HYPE'});expect(view.findAll(node=>node.type==='Text'&&node.props.children==='HYP')).not.toHaveLength(0);
});
it('shows the value alone, or the value over the units, as live numbers that keep their instance',()=>{
 let view=mount({value:100.33});
 expect(flows(view)).toHaveLength(1);expect(flows(view)[0].props).toMatchObject({value:100.33,options:{style:'currency',currency:'USD'}});
 view=mount({value:203,balance:1.25});
 const [value,units]=flows(view);expect(flows(view)).toHaveLength(2);expect(units.props).toMatchObject({value:1.25,tone:'muted',options:{maximumFractionDigits:6}});
 view=update({value:210.5,balance:1.3});
 expect(flows(view)[0]).toBe(value);expect(flows(view)[1]).toBe(units);expect(flows(view).map(flow=>flow.props.value)).toEqual([210.5,1.3]);
 // A null balance is an unknown holding, still drawn; a custom format reaches the units line.
 view=mount({value:null,balance:null,balanceOptions:{maximumFractionDigits:2}});expect(flows(view)).toHaveLength(2);expect(flows(view)[1].props.options).toEqual({maximumFractionDigits:2});
});
it('is a button that reads the whole holding when it can be selected, and a labelled group otherwise',()=>{
 const select=jest.fn();let view=mount({value:203,balance:1.25,onSelect:select});
 const button=outer(view,'row');expect(button.props.accessibilityRole).toBe('button');expect(button.props.accessibilityLabel).toBe('Solana, SOL, $203.00, 1.25');
 act(()=>{button.props.onPress();});expect(select).toHaveBeenCalledTimes(1);
 view=mount({value:100.33});const group=outer(view,'row');
 expect(group.props.accessibilityRole).toBeUndefined();expect(group.props.accessible).toBe(true);expect(group.props.accessibilityLabel).toBe('Solana, SOL, $100.33');expect(group.props.onPress).toBeUndefined();
});
it('headline units puts the units on the headline line and reads them in place of the value',()=>{
 let view=mount({name:'Bloxwap',symbol:'BLOX',value:null,balance:1234.5,headline:'units',balanceOptions:{maximumFractionDigits:2}});
 expect(flows(view)).toHaveLength(1);expect(flows(view)[0].props).toMatchObject({value:1234.5,options:{maximumFractionDigits:2}});expect(flows(view)[0].props.tone).toBeUndefined();
 expect(StyleSheet.flatten(flows(view)[0].props.style)).toMatchObject({fontSize:16,fontWeight:'600'});
 expect(outer(view,'row').props.accessibilityLabel).toBe('Bloxwap, BLOX, 1,234.5');
 view=mount({name:'Bloxwap',symbol:'BLOX',value:null,balance:1234.5});expect(flows(view)).toHaveLength(2);expect(outer(view,'row').props.accessibilityLabel).toBe('Bloxwap, BLOX, —, 1,234.5');
});
