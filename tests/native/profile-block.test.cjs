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
 expect(text(host(view,'profile-title'))).toBe('Profile');
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
it('draws an optional full-width primary action 16 under the name, and the name may be left out for it',()=>{
 const login=jest.fn();let view=mount({name:undefined,action:{label:'Log in',onSelect:login}});
 expect(has(view,'profile-name')).toBe(false);expect(text(host(view,'profile-avatar'))).toBe('');
 const {Button}=require('../../packages/hig/native/src/button');
 const action=view.findAllByType(Button).find(node=>node.props.testID==='profile-action');expect(action.props.fullWidth).toBe(true);expect(action.props.intent).toBe('primary');expect(text(action)).toContain('Log in');
 expect(flat(host(view,'profile-action-row'))).toMatchObject({marginTop:16});
 act(()=>{button(view,'profile-action').props.onPress({stopPropagation(){},isDefaultPrevented:()=>false});});expect(login).toHaveBeenCalledTimes(1);
 view=mount({action:{label:'Log in',onSelect:login,intent:'secondary',disabled:true}});expect(view.findAllByType(Button).find(node=>node.props.testID==='profile-action').props).toMatchObject({intent:'secondary',disabled:true});
 view=mount();expect(has(view,'profile-action')).toBe(false);
});
it('puts a name accessory beside the name and keeps it accessible',()=>{
 const view=mount({nameAccessory:h(View,{testID:'badge',accessible:true,accessibilityLabel:'Genesis member'}),onEditName:()=>{}});
 const accessory=host(view,'profile-name-accessory');expect(has(accessory,'badge')).toBe(true);expect(accessory.props.accessible).not.toBe(false);expect(accessory.props.importantForAccessibility).toBeUndefined();
 const order=view.findAll(node=>typeof node.type==='string'&&['profile-name','profile-name-accessory','profile-edit'].includes(node.props.testID)).map(node=>node.props.testID);
 expect(order.filter((id,index)=>order.indexOf(id)===index)).toEqual(['profile-name','profile-name-accessory','profile-edit']);
});
it('makes the avatar a named button with onAvatarPress, the status dot outside it',()=>{
 const choose=jest.fn();let view=mount({onAvatarPress:choose,avatarLabel:'Change profile picture',status:{label:'Demo'}});
 const avatar=button(view,'profile-avatar-button');expect(avatar.props.accessibilityLabel).toBe('Change profile picture');expect(has(avatar,'profile-avatar')).toBe(true);expect(has(avatar,'profile-status')).toBe(false);
 act(()=>{avatar.props.onPress({});});expect(choose).toHaveBeenCalledTimes(1);
 view=mount({onAvatarPress:choose});expect(button(view,'profile-avatar-button').props.accessibilityLabel).toBe('5459····6263');
 // Signed out with no name and no avatarLabel, the button still has a name: the built-in one, which the host can translate.
 view=mount({name:undefined,action:{label:'Log in',onSelect:()=>{}},onAvatarPress:choose});expect(button(view,'profile-avatar-button').props.accessibilityLabel).toBe('Change profile picture');
 view=mount({name:undefined,action:{label:'Log in',onSelect:()=>{}},onAvatarPress:choose},{messages:{changeProfilePicture:'Changer la photo'}});expect(button(view,'profile-avatar-button').props.accessibilityLabel).toBe('Changer la photo');
 view=mount();expect(has(view,'profile-avatar-button')).toBe(false);
});
it('draws a live figure value and a toned value, read with the label',()=>{
 const {NumberFlow}=require('../../packages/hig/native/src/animated-number');
 const view=mount({sections:[{id:'s',rows:[
  {id:'accounts',label:'Accounts',value:{value:1042.09,options:{style:'currency',currency:'USD'}},onSelect:()=>{}},
  {id:'history',label:'History',value:'Live',tone:'positive',onSelect:()=>{}},
  {id:'demo',label:'Mode',value:'Demo',tone:'warning'},
  {id:'plain',label:'Version',value:'1.0'}]}]});
 expect(button(view,'profile-row-accounts').props.accessibilityLabel).toBe('Accounts, $1,042.09');
 const figure=view.findAllByType(NumberFlow).find(node=>node.props.testID==='profile-row-accounts-value');expect(figure.props).toMatchObject({value:1042.09,tone:'muted'});
 expect(button(view,'profile-row-history').props.accessibilityLabel).toBe('History, Live');expect(flat(host(view,'profile-row-history-value')).color).toBe(colors.positive);
 expect(flat(host(view,'profile-row-demo-value')).color).toBe(colors.warning);
 expect(view.findAllByType(ListRow).find(row=>row.props.testID==='profile-row-plain').props.value).toBe('1.0');
 // A toned value keeps the plain value's layout: it shrinks and truncates at half the row instead of squeezing the label.
 for(const id of ['history','demo','plain'])expect(flat(host(view,`profile-row-${id}-value`))).toMatchObject({flexShrink:1,maxWidth:'50%'});
 expect(host(view,'profile-row-demo-value').props.numberOfLines).toBe(1);expect(flat(host(view,'profile-row-plain-value')).color).toBe(colors.muted);
 const toned=mount({sections:[{id:'s',rows:[{id:'pnl',label:'PnL',value:{value:-4.2},tone:'negative'}]}]});
 expect(toned.findAllByType(NumberFlow).find(node=>node.props.testID==='profile-row-pnl-value').props.tone).toBe('negative');
});
it('draws a footer under the sections on the block inset, 24 below',()=>{
 let view=mount({footer:h(View,{testID:'legal'})});
 const footer=host(view,'profile-footer');expect(has(footer,'legal')).toBe(true);expect(flat(footer)).toMatchObject({marginTop:24});
 const blockChildren=footer.parent.children.map(child=>child.props.testID);expect(blockChildren[blockChildren.length-1]).toBe('profile-footer');expect(blockChildren.indexOf('profile-sections')).toBeLessThan(blockChildren.indexOf('profile-footer'));
 view=mount();expect(has(view,'profile-footer')).toBe(false);
});
it('switch rows are already whole-row targets on native',()=>{
 const change=jest.fn();const view=mount({sections:[{id:'s',rows:[{id:'live',label:'Live Mode',checked:false,onCheckedChange:change}]}]});
 const row=button(view,'profile-row-live');expect(row.props.accessibilityRole).toBe('switch');expect(flat(host(view,'profile-row-live'))).toMatchObject({minHeight:56});
 act(()=>{row.props.onPress({});});expect(change).toHaveBeenCalledWith(true);
});
