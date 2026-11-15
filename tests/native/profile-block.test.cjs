/** Native ProfileBlock: the address and close controls, the avatar with its status, the name, then the host's sections of rows. */
const React=require('react');
const {create:render,act}=require('react-test-renderer');
const {StyleSheet,View,Image}=require('react-native');
const {nativeSrgb:colors}=require('@bloxwap/hig/tokens');
const {HIGProvider}=require('../../packages/hig/native/src/provider');
const {ProfileBlock}=require('../../packages/hig/native/src/profile-block');
const blocks=require('../../packages/hig/native/src/blocks');
const {ListGroup,ListRow}=require('../../packages/hig/native/src/list-group');
const {addressColor}=require('../../packages/hig/native/src/swap-shared');
const h=React.createElement;
let root;
const sections=[{id:'money',rows:[{id:'accounts',label:'Accounts',value:'$1,042.09',onSelect:()=>{}},{id:'history',label:'History',onSelect:()=>{}}]},{id:'settings',title:'Settings',rows:[{id:'live',label:'Live Mode',checked:false,onCheckedChange:()=>{}},{id:'signals',label:'Signals',onSelect:()=>{}}]}];
const base={name:'5459····6263',sections};
function mount(props={},provider={}){if(root)act(()=>root.unmount());act(()=>{root=render(h(HIGProvider,{reducedMotion:true,...provider},h(ProfileBlock,{...base,...props})));});return root.root;}
const all=(view,id)=>view.findAll(node=>node.props.testID===id);
const host=(view,id)=>all(view,id).find(node=>typeof node.type==='string');
const has=(view,id)=>all(view,id).length>0;
const flat=node=>StyleSheet.flatten(typeof node.props.style==='function'?node.props.style({pressed:false}):node.props.style)??{};
const text=node=>typeof node==='string'?node:node.children.map(text).join('');
const button=(view,id)=>all(view,id).find(node=>node.props.accessibilityRole==='button'||node.props.accessibilityRole==='switch');
afterEach(()=>{if(root)act(()=>root.unmount());root=undefined;});

it('shows the address and close controls only with their handlers, named by built-in text the host can translate',()=>{
 let view=mount();expect(has(view,'profile-address')).toBe(false);expect(has(view,'profile-close')).toBe(false);
 const show=jest.fn(),close=jest.fn();view=mount({onShowAddress:show,onClose:close});
 expect(button(view,'profile-address').props.accessibilityLabel).toBe('Show account address');expect(button(view,'profile-close').props.accessibilityLabel).toBe('Close');
 expect(flat(host(view,'profile-address'))).toMatchObject({width:44,height:44,borderRadius:22,backgroundColor:'transparent'});
 act(()=>{button(view,'profile-address').props.onPress({});button(view,'profile-close').props.onPress({});});expect(show).toHaveBeenCalledTimes(1);expect(close).toHaveBeenCalledTimes(1);
 view=mount({onShowAddress:show,onClose:close,onEditName:()=>{}},{messages:{showAddress:'Afficher l’adresse',close:'Fermer',editName:'Modifier le nom'}});
 expect(button(view,'profile-address').props.accessibilityLabel).toBe('Afficher l’adresse');expect(button(view,'profile-close').props.accessibilityLabel).toBe('Fermer');expect(button(view,'profile-edit').props.accessibilityLabel).toBe('Modifier le nom');
});
it('draws the avatar from a URL, a host element, the address colour, or the first letters of the name, hidden from accessibility',()=>{
 let view=mount({avatar:'https://example.com/a.png'});let avatar=host(view,'profile-avatar');
 expect(flat(avatar)).toMatchObject({width:144,height:144,borderRadius:72});expect(avatar.props.accessible).toBe(false);expect(avatar.findByType(Image).props.source).toEqual({uri:'https://example.com/a.png'});
 view=mount({avatar:h(View,{testID:'art'}),address:'0xabc'});expect(has(host(view,'profile-avatar'),'art')).toBe(true);expect(flat(host(view,'profile-avatar')).backgroundColor).toBe(colors.surface);
 view=mount({address:'0xabc'});expect(flat(host(view,'profile-avatar')).backgroundColor).toBe(addressColor('0xabc'));expect(text(host(view,'profile-avatar'))).toBe('');
 view=mount({name:'Joe Blau'});expect(text(host(view,'profile-avatar'))).toBe('Jo');expect(flat(host(view,'profile-avatar')).backgroundColor).toBe(colors.surface);
});
it('marks the status with a dot on the avatar: warning by default, another tone when asked, read by its label',()=>{
 let view=mount();expect(has(view,'profile-status')).toBe(false);
 view=mount({status:{label:'Demo'}});let dot=host(view,'profile-status');
 expect(flat(dot)).toMatchObject({position:'absolute',top:10,end:10,width:20,height:20,borderRadius:10,borderWidth:3,borderColor:colors.background,backgroundColor:colors.warning});
 expect(dot.props.accessible).toBe(true);expect(dot.props.accessibilityLabel).toBe('Demo');
 for(const tone of ['positive','negative','info']){view=mount({status:{label:'Live',tone}});expect(flat(host(view,'profile-status')).backgroundColor).toBe(colors[tone]);}
});
it('shows the name as the heading with an edit control only when the host can rename',()=>{
 let view=mount();const name=host(view,'profile-name');
 expect(text(name)).toBe('5459····6263');expect(name.props.accessibilityRole).toBe('header');expect(name.props.numberOfLines).toBe(1);expect(flat(name)).toMatchObject({fontSize:28,lineHeight:34,fontWeight:'700',color:colors.text});
 expect(has(view,'profile-edit')).toBe(false);
 const edit=jest.fn();view=mount({onEditName:edit});expect(button(view,'profile-edit').props.accessibilityLabel).toBe('Edit name');expect(flat(host(view,'profile-edit'))).toMatchObject({width:44,height:44});
 act(()=>{button(view,'profile-edit').props.onPress({});});expect(edit).toHaveBeenCalledTimes(1);
});
it('renders each section as a list group with its title and its rows in order, skipping an empty section',()=>{
 const view=mount({sections:[...sections,{id:'empty',title:'Nothing',rows:[]}]});
 const groups=view.findAllByType(ListGroup);expect(groups.map(group=>group.props.testID)).toEqual(['profile-section-money','profile-section-settings']);expect(groups.map(group=>group.props.title)).toEqual([undefined,'Settings']);
 expect(flat(host(view,'profile-sections'))).toMatchObject({gap:24,marginTop:24});expect(has(view,'profile-section-empty')).toBe(false);
 expect(view.findAllByType(ListRow).map(row=>[row.props.testID,row.props.label,row.props.value])).toEqual([['profile-row-accounts','Accounts','$1,042.09'],['profile-row-history','History',undefined],['profile-row-signals','Signals',undefined]]);
 // The switch row sits between them, in the order given.
 const ids=host(view,'profile-section-settings-rows').children.map(child=>child.props.testID??child.props.row?.id);expect(ids.length).toBe(2);
});
it('makes a row with onSelect one button with a chevron, and passes leading, trailing and disabled through',()=>{
 const select=jest.fn();
 const view=mount({sections:[{id:'s',rows:[{id:'go',label:'Accounts',value:'$10',leading:h(View,{testID:'lead'}),trailing:h(View,{testID:'trail'}),onSelect:select},{id:'off',label:'History',onSelect:select,disabled:true},{id:'plain',label:'Version',value:'1.0'}]}]});
 const go=button(view,'profile-row-go');expect(go.props.accessibilityLabel).toBe('Accounts, $10');expect(has(view,'profile-row-go-chevron')).toBe(true);expect(has(view,'lead')).toBe(true);expect(has(view,'trail')).toBe(true);
 act(()=>{go.props.onPress({});});expect(select).toHaveBeenCalledTimes(1);
 expect(button(view,'profile-row-off').props.disabled).toBe(true);expect(button(view,'profile-row-off').props.accessibilityState).toMatchObject({disabled:true});
 expect(button(view,'profile-row-plain')).toBeUndefined();expect(has(view,'profile-row-plain-chevron')).toBe(false);
});
it('makes a row with onCheckedChange one switch named by its label, with the track trailing and level with the first line',()=>{
 const change=jest.fn();
 let view=mount({sections:[{id:'s',rows:[{id:'live',label:'Live Mode',checked:false,onCheckedChange:change}]}]});
 const row=button(view,'profile-row-live');expect(row.props.accessibilityRole).toBe('switch');expect(row.props.accessibilityLabel).toBe('Live Mode');expect(row.props.accessibilityState).toMatchObject({checked:false,disabled:false});
 expect(flat(host(view,'profile-row-live'))).toMatchObject({minHeight:56,paddingVertical:8,paddingHorizontal:20,backgroundColor:colors.surface});
 expect(flat(host(view,'profile-row-live-track'))).toMatchObject({width:40,height:24,alignItems:'flex-start'});
 // The label is drawn once: the switch's name is not a second visible text.
 expect(host(view,'profile-row-live').findAll(node=>node.type==='Text').map(text)).toEqual(['Live Mode']);
 act(()=>{row.props.onPress({});});expect(change).toHaveBeenCalledWith(true);
 view=mount({sections:[{id:'s',rows:[{id:'live',label:'Live Mode',checked:true,disabled:true,onCheckedChange:change}]}]});
 expect(flat(host(view,'profile-row-live-track'))).toMatchObject({backgroundColor:colors.action,alignItems:'flex-end'});expect(button(view,'profile-row-live').props.accessibilityState).toMatchObject({checked:true,disabled:true});expect(flat(host(view,'profile-row-live')).opacity).toBe(0.5);
 act(()=>{button(view,'profile-row-live').props.onPress?.({});});expect(change).toHaveBeenCalledTimes(1);
});
it('is exported from the blocks aggregate',()=>{expect(blocks.ProfileBlock).toBe(ProfileBlock);});
