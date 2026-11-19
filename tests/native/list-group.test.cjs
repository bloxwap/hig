/** Native ListGroup and ListRow: a grouped list for menus and settings. */
const React=require('react');
const {create:render,act}=require('react-test-renderer');
const {StyleSheet,View}=require('react-native');
const {nativeSrgb:colors}=require('@bloxwap/hig/tokens');
const {HIGProvider}=require('../../packages/hig/native/src/provider');
const {ListGroup,ListRow}=require('../../packages/hig/native/src/list-group');
const {InlineNotice}=require('../../packages/hig/native/src/status');
const h=React.createElement;
let root;
function mount(element,provider={}){if(root)act(()=>root.unmount());act(()=>{root=render(h(HIGProvider,provider,element));});return root.root;}
const flat=node=>StyleSheet.flatten(typeof node.props.style==='function'?node.props.style({pressed:false}):node.props.style)??{};
const all=(tree,testID)=>tree.findAll(node=>node.props.testID===testID);
const host=(tree,testID)=>tree.findAll(node=>node.props.testID===testID&&typeof node.type==='string')[0];
const text=node=>typeof node==='string'?node:node.children.map(text).join('');
afterEach(()=>{if(root)act(()=>root.unmount());root=undefined;});

it('shows an optional heading over rows that share one rounded container',()=>{
 let tree=mount(h(ListGroup,{title:'Settings',testID:'group'},h(ListRow,{label:'Signals',testID:'signals',onSelect(){}}),h(ListRow,{label:'Language',value:'English',testID:'language',onSelect(){}})));
 const title=host(tree,'group-title');expect(text(title)).toBe('Settings');expect(all(tree,'group-title')[0].props.accessibilityRole).toBe('header');
 expect(flat(host(tree,'group-rows'))).toMatchObject({gap:2,borderRadius:20,overflow:'hidden'});expect(host(tree,'group-rows').children).toHaveLength(2);
 tree=mount(h(ListGroup,{testID:'group'},h(ListRow,{label:'Experiments',onSelect(){}})));expect(host(tree,'group-title')).toBeUndefined();
});
it('makes a row with onSelect one button named by its label and value, with a chevron that mirrors in RTL',()=>{
 const select=jest.fn();
 let tree=mount(h(ListRow,{label:'Notifications',value:'Off',testID:'row',onSelect:select}));
 const button=all(tree,'row').find(node=>node.props.onPress);expect(button.props.accessibilityRole).toBe('button');expect(button.props.accessibilityLabel).toBe('Notifications, Off');
 expect(flat(host(tree,'row'))).toMatchObject({minHeight:56,paddingHorizontal:20,backgroundColor:colors.surface});
 act(()=>{button.props.onPress({});});expect(select).toHaveBeenCalledTimes(1);
 expect(flat(host(tree,'row-chevron')).transform).toEqual([{rotate:'-90deg'}]);
 tree=mount(h(ListRow,{label:'Notifications',testID:'row',onSelect:select}),{direction:'rtl'});expect(flat(host(tree,'row-chevron')).transform).toEqual([{rotate:'90deg'}]);
});
it('leaves a row without onSelect static so a trailing control is its only target, and blocks a disabled row',()=>{
 let tree=mount(h(ListRow,{label:'Live Mode',testID:'row',trailing:h(View,{testID:'control'})}));
 expect(all(tree,'row').some(node=>node.props.onPress)).toBe(false);expect(host(tree,'row-chevron')).toBeUndefined();expect(host(tree,'control')).toBeDefined();
 tree=mount(h(ListRow,{label:'Signals',testID:'row',disabled:true,onSelect(){}}));
 const button=all(tree,'row').find(node=>node.props.onPress);expect(button.props.disabled).toBe(true);expect(button.props.accessibilityState).toEqual({disabled:true});expect(flat(host(tree,'row')).opacity).toBe(0.5);
});
it('aligns the label, value, trailing control and chevron to the first line, so a switch stays at the top when the label wraps',()=>{
 const tree=mount(h(ListRow,{label:'Notifications',value:'Off',testID:'row',trailing:h(View,{testID:'control'})}));
 expect(flat(host(tree,'row'))).toMatchObject({alignItems:'flex-start',minHeight:56,paddingVertical:8});
 // The label's first line is centred on the same 40-unit band the trailing control is centred in.
 const texts=host(tree,'row').findAll(node=>node.type==='Text');expect(texts.map(node=>flat(node).paddingVertical)).toEqual([8,8]);
 const band=host(tree,'row').findAll(node=>typeof node.type==='string'&&node.props.testID!=='row'&&flat(node).minHeight===40&&node.findAll(child=>child.props.testID==='control').length>0);
 expect(band.length).toBeGreaterThan(0);expect(flat(band[0])).toMatchObject({minHeight:40,alignItems:'center',flexDirection:'row'});
});
it('reads an element value as valueLabel on a selectable row and tones a text value, as web does',()=>{
 let tree=mount(h(ListRow,{label:'Balance',value:h(View,{testID:'live'}),valueLabel:'$1,042.09',testID:'row',onSelect(){}}));
 expect(host(tree,'row').props.accessibilityLabel).toBe('Balance, $1,042.09');
 // On a static row the element is one accessible node read as valueLabel, as web reads it in the element's place.
 tree=mount(h(ListRow,{label:'Balance',value:h(View,{testID:'live'}),valueLabel:'$1,042.09',testID:'row'}));
 const wrapper=host(tree,'row').findAll(node=>typeof node.type==='string'&&node.findAll(child=>child.props.testID==='live').length>0&&node.props.testID!=='row'&&node.props.testID!=='live')[0];
 expect(wrapper.props).toMatchObject({accessible:true,accessibilityLabel:'$1,042.09'});
 tree=mount(h(ListRow,{label:'Balance',value:h(View,{testID:'live'}),testID:'row'}));
 expect(host(tree,'row').findAll(node=>node.props.accessibilityLabel!=null)).toHaveLength(0);
 tree=mount(h(ListRow,{label:'PnL',value:'+$12.50',valueTone:'positive',testID:'row'}));
 expect(flat(host(tree,'row-value')).color).toBe(colors.positive);expect(text(host(tree,'row-value'))).toBe('+$12.50');
 tree=mount(h(ListRow,{label:'PnL',value:'+$12.50',testID:'row'}));expect(flat(host(tree,'row-value')).color).toBe(colors.muted);
});

it('renders information as static text with a decorative leading icon',()=>{
 const props={title:'Transfer timing',description:'Allow three days.'};
 const tree=mount(h(InlineNotice,props));
 expect(text(tree)).toContain('Transfer timingAllow three days.');
 expect(tree.findAll(node=>node.props.onPress)).toHaveLength(0);
 const {SeverityIcon}=require('../../packages/hig/native/src/icons');
 for(const severity of ['info','success','warning','error']){
  const card=mount(h(InlineNotice,{...props,severity}));
  const symbol=card.findByType(SeverityIcon);expect(symbol.props.kind).toBe(severity);
  const disc=symbol.parent;const surface=card.findByType(require('../../packages/hig/native/src/surface').Surface);
  expect(flat(surface).borderRadius).toBe(flat(surface).padding+flat(disc).borderRadius);
  expect(flat(surface)).toMatchObject({flexDirection:'row',alignItems:'flex-start'});
  const copy=surface.findAll(node=>node.type===View&&flat(node).flex===1&&text(node)===props.title+props.description);
  expect(copy).toHaveLength(1);
 }
 const custom=mount(h(InlineNotice,{...props,icon:h(View,{testID:'custom'})}));
 expect(custom.findAll(node=>node.props.accessibilityElementsHidden&&node.findAll(child=>child.props.testID==='custom').length>0).length).toBeGreaterThan(0);
});

it('keeps a row\'s resting and pressed fills at every elevation',()=>{
 const {Raised}=require('../../packages/hig/native/src/provider');
 const fills=tree=>{const press=all(tree,'row').find(node=>typeof node.props.style==='function');return [false,true].map(pressed=>StyleSheet.flatten(press.props.style({pressed})).backgroundColor);};
 const row=h(ListRow,{label:'Signals',testID:'row',onSelect:()=>{}});
 expect(fills(mount(row))).toEqual([colors.surface,colors.nested]);
 // One elevation up, as in a sheet, wells step a shade; rows do not.
 expect(fills(mount(h(Raised,null,row)))).toEqual([colors.surface,colors.nested]);
});

it('centres the leading mark and the trailing glyph on a two-line label',()=>{
 const slot=(tree,id)=>{let node=host(tree,id).parent;while(node&&typeof node.type!=='string')node=node.parent;return flat(node);};
 const marks={leading:h(View,{testID:'lead'}),trailing:h(View,{testID:'trail'}),testID:'row',onSelect:()=>{}};
 let tree=mount(h(ListRow,{label:'Bank transfer',description:'One to three days',...marks}));
 expect(slot(tree,'lead').alignSelf).toBe('center');
 tree=mount(h(ListRow,{label:'Bank transfer',...marks}));
 expect(slot(tree,'lead').alignSelf).toBeUndefined();
});
