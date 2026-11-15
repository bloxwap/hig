/** Native ScreenHeader: the block header on its own entry, the deprecated recipes path as a real file, and 48dp targets on block controls. */
const React=require('react');
const {existsSync,readFileSync}=require('node:fs');
const {create:render,act}=require('react-test-renderer');
const {StyleSheet}=require('react-native');
const {HIGProvider}=require('../../packages/hig/native/src/provider');
const header=require('../../packages/hig/native/src/screen-header');
const {SettingHeader}=require('../../packages/hig/native/src/setting-switch');
const icons=require('../../packages/hig/native/src/icons');
const {ProfileBlock}=require('../../packages/hig/native/src/profile-block');
const {SignalsBlock}=require('../../packages/hig/native/src/signals-block');
const {AccountBlock}=require('../../packages/hig/native/src/account-block');
const {IconButton}=require('../../packages/hig/native/src/button');
const h=React.createElement;
let root;
function mount(element,provider={}){if(root)act(()=>root.unmount());act(()=>{root=render(h(HIGProvider,{reducedMotion:true,...provider},element));});return root.root;}
const all=(view,id)=>view.findAll(node=>node.props.testID===id);
const pressable=(view,id)=>all(view,id).find(node=>node.props.accessibilityRole==='button'&&typeof node.props.onPress==='function'&&typeof node.type!=='string');
const flat=node=>StyleSheet.flatten(typeof node.props.style==='function'?node.props.style({pressed:false}):node.props.style)??{};
const text=node=>typeof node==='string'?node:node.children.map(text).join('');
afterEach(()=>{if(root)act(()=>root.unmount());root=undefined;});

it('publishes the block header as ScreenHeader with its chevron, the same component the settings blocks draw',()=>{
 expect(header.ScreenHeader).toBe(SettingHeader);expect(header.ChevronIcon).toBe(icons.ChevronIcon);
 const exportsMap=JSON.parse(readFileSync('packages/hig/package.json','utf8')).exports;
 expect(exportsMap['./native/screen-header']).toEqual({types:'./native/dist/screen-header.d.ts',import:'./native/dist/screen-header.js',default:'./native/dist/screen-header.js'});
});
it('draws Back leading, the title centred as a header, and the host control trailing',()=>{
 const back=jest.fn();
 const view=mount(h(header.ScreenHeader,{testID:'keypad',title:'Edit target',onBack:back,action:h(IconButton,{label:'Done',testID:'done',onPress:()=>{}},null)}));
 const title=all(view,'keypad-title').find(node=>node.props.accessibilityRole==='header');
 expect(text(title)).toBe('Edit target');expect(flat(title)).toMatchObject({flex:1,textAlign:'center',fontSize:17,lineHeight:24,fontWeight:'600'});
 expect(flat(all(view,'keypad-header')[0])).toMatchObject({flexDirection:'row',alignItems:'center',minHeight:44});
 const backButton=all(view,'keypad-back').find(node=>node.props.onPress);expect(backButton.props.accessibilityLabel??backButton.props.label).toBe('Back');
 act(()=>{pressable(view,'keypad-back').props.onPress({stopPropagation(){},isDefaultPrevented:()=>false});});expect(back).toHaveBeenCalledTimes(1);
 expect(all(view,'done').length).toBeGreaterThan(0);
});
it('sets test IDs only when the host names a prefix, and the blocks keep theirs',()=>{
 let view=mount(h(header.ScreenHeader,{title:'Pane',onBack:()=>{}}));
 expect(view.findAll(node=>typeof node.props.testID==='string'&&/-(header|back|title)$/.test(node.props.testID))).toHaveLength(0);
 view=mount(h(SignalsBlock,{title:'Signals',groups:[],onBack:()=>{}}));
 expect(['signals-header','signals-back','signals-title'].filter(id=>all(view,id).length===0)).toEqual([]);
});
it('keeps the deprecated recipes path as a real module, so a Jest moduleNameMapper to native/dist/<entry>.js resolves it',()=>{
 const recipes=require('../../packages/hig/native/src/recipes'),blocks=require('../../packages/hig/native/src/blocks');
 expect(Object.keys(recipes).sort()).toEqual(Object.keys(blocks).sort());for(const key of Object.keys(blocks))expect(recipes[key]).toBe(blocks[key]);
 expect(readFileSync('packages/hig/native/src/recipes.ts','utf8')).toContain('@deprecated');
 // After a build the file exists next to blocks.js.
 if(existsSync('packages/hig/native/dist/blocks.js'))expect(existsSync('packages/hig/native/dist/recipes.js')).toBe(true);
});
it('gives every block header and profile control a 48dp target without changing its drawn size',()=>{
 const slop={top:2,bottom:2,left:2,right:2};
 let view=mount(h(ProfileBlock,{name:'Joe',sections:[],onShowAddress:()=>{},onClose:()=>{},onEditName:()=>{}}));
 for(const id of ['profile-address','profile-close','profile-edit']){const control=pressable(view,id);expect([id,control.props.hitSlop]).toEqual([id,slop]);expect(flat(control)).toMatchObject({width:44,height:44});}
 view=mount(h(AccountBlock,{assets:[],onBack:()=>{},onShowAddress:()=>{},onDeposit:()=>{}}));
 for(const id of ['account-back','account-address'])expect([id,pressable(view,id).props.hitSlop]).toEqual([id,slop]);
 expect(flat(pressable(view,'account-back'))).toMatchObject({minWidth:44,minHeight:44});
 // Text buttons keep the vertical reach they had; a host hitSlop still wins.
 expect(pressable(view,'account-deposit').props.hitSlop).toEqual({top:2,bottom:2});
 view=mount(h(IconButton,{label:'Wide',testID:'wide',hitSlop:8,onPress:()=>{}},null));expect(pressable(view,'wide').props.hitSlop).toBe(8);
});
it('reaches 48dp around the 32dp signals help pill, and leaves the swap card capsules as they were',()=>{
 const view=mount(h(SignalsBlock,{title:'Signals',groups:[{id:'trend',title:'Trend',help:{label:'How it works',onSelect:()=>{}},items:[]}]}));
 const pill=pressable(view,'signals-trend-help');expect(pill.props.hitSlop).toEqual({top:8,bottom:8,left:8,right:8});expect(flat(pill).minHeight).toBe(32);
 expect(flat(pill).minHeight+pill.props.hitSlop.top+pill.props.hitSlop.bottom).toBe(48);
 const {SwapCapsule}=require('../../packages/hig/native/src/swap-parts');
 const capsule=mount(h(SwapCapsule,{testID:'max',onPress:()=>{}},'Max'));expect(pressable(capsule,'max').props.hitSlop).toEqual({top:6,bottom:6});
});
