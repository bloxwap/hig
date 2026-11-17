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
it('sets nativeID on the title only when the host passes headingId, for accessibilityLabelledBy',()=>{
 const headers=view=>view.findAll(node=>node.props.accessibilityRole==='header');
 let view=mount(h(header.ScreenHeader,{title:'Pane'}));
 expect(headers(view).every(node=>node.props.nativeID===undefined)).toBe(true);
 view=mount(h(header.ScreenHeader,{title:'Pane',headingId:'pane-title'}));
 expect(headers(view).some(node=>node.props.nativeID==='pane-title')).toBe(true);
});
it('draws a host badge beside the title, read with it as one header (Unreleased)',()=>{
 const view=mount(h(header.ScreenHeader,{title:'Trade',badge:'Demo',testID:'pane',headingId:'pane-title'}));
 const heading=view.findAll(node=>node.props.accessibilityRole==='header'&&typeof node.type==='string');
 expect(heading).toHaveLength(1);expect(heading[0].props).toMatchObject({accessible:true,accessibilityLabel:'Trade, Demo',nativeID:'pane-title'});
 expect(text(all(view,'pane-badge').find(node=>typeof node.type==='string'))).toBe('Demo');
 const plain=mount(h(header.ScreenHeader,{title:'Trade',testID:'pane'}));expect(all(plain,'pane-badge')).toHaveLength(0);
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
describe('host slots (Unreleased)',()=>{
 const {nativeSrgb}=require('../../packages/hig/tokens/src/index');
 const {ScrollView,View}=require('react-native');
 it('draws Back unavailable and passes Pressable props through to it',()=>{
  const back=jest.fn();
  const view=mount(h(header.ScreenHeader,{testID:'pane',title:'Close position',onBack:back,backDisabled:true,backProps:{android_disableSound:true}}));
  const control=pressable(view,'pane-back');
  expect(control.props.disabled).toBe(true);expect(control.props.accessibilityState).toMatchObject({disabled:true});expect(control.props.android_disableSound).toBe(true);
  act(()=>{control.props.onPress({stopPropagation(){},isDefaultPrevented:()=>false});});expect(back).not.toHaveBeenCalled();
  const glyph=view.findByType(icons.ChevronIcon);expect(glyph.props.color).toBe(nativeSrgb.faint);
 });
 it('gives the host a ref to the heading and hides the title visually while it stays the accessible heading',()=>{
  const ref=React.createRef();
  let view=mount(h(header.ScreenHeader,{testID:'pane',title:'Log in',titleRef:ref,hideTitle:true}));
  const title=all(view,'pane-title').find(node=>typeof node.type==='string');
  expect(title.props.accessibilityRole).toBe('header');expect(flat(title).color).toBe('#ffffff00');expect(ref.current).toBeTruthy();
  view=mount(h(header.ScreenHeader,{testID:'pane',title:'Trade',badge:'Demo',hideTitle:true,titleRef:ref}));
  expect(all(view,'pane-badge')).toHaveLength(0);expect(view.findAll(node=>node.props.accessibilityLabel==='Trade, Demo'&&typeof node.type==='string')).toHaveLength(1);
 });
 it('reads description after the heading as its accessibility hint, never drawn',()=>{
  let view=mount(h(header.ScreenHeader,{testID:'pane',title:'Log in',description:'Choose a sign-in method'}));
  const title=all(view,'pane-title').find(node=>typeof node.type==='string');
  expect(title.props.accessibilityRole).toBe('header');expect(title.props.accessibilityHint).toBe('Choose a sign-in method');
  expect(view.findAll(node=>typeof node.type==='string'&&node.children.includes('Choose a sign-in method'))).toHaveLength(0);
  view=mount(h(header.ScreenHeader,{testID:'pane',title:'Trade',badge:'Demo',description:'Practice money'}));
  expect(view.findAll(node=>typeof node.type==='string'&&node.props.accessibilityRole==='header'&&node.props.accessibilityHint==='Practice money')).toHaveLength(1);
  view=mount(h(header.ScreenHeader,{testID:'pane',title:'Pane'}));
  expect(all(view,'pane-title').find(node=>typeof node.type==='string').props.accessibilityHint).toBeUndefined();
 });
 it('fills a pinned header only once its scroller reports content under it',()=>{
  const fill=view=>flat(all(view,'pane-header')[0]).backgroundColor;
  let view=mount(h(header.ScreenHeader,{testID:'pane',title:'Pane'}));expect(fill(view)).toBeUndefined();
  view=mount(h(header.ScreenHeader,{testID:'pane',title:'Pane',stickyHeader:true}));expect(fill(view)).toBe('transparent');
  view=mount(h(header.ScreenHeader,{testID:'pane',title:'Pane',stickyHeader:true,scrolled:true,stickyHeaderBackground:'#111111'}));expect(fill(view)).toBe('#111111');
  function Pane(){const scroll=header.useStickyHeaderScroll();return h(ScrollView,{testID:'scroller',stickyHeaderIndices:[0],onScroll:scroll.onScroll,scrollEventThrottle:scroll.scrollEventThrottle},h(header.ScreenHeader,{testID:'pane',title:'Pane',stickyHeader:true,scrolled:scroll.scrolled}),h(View,null));}
  view=mount(h(Pane));expect(fill(view)).toBe('transparent');
  act(()=>{view.findByType(ScrollView).props.onScroll({nativeEvent:{contentOffset:{y:12}}});});expect(fill(view)).toBe(nativeSrgb.background);
  act(()=>{view.findByType(ScrollView).props.onScroll({nativeEvent:{contentOffset:{y:0}}});});expect(fill(view)).toBe('transparent');
 });
 it('pins every block header the same way with stickyHeader',()=>{
  const {SoundHapticsBlock}=require('../../packages/hig/native/src/sound-haptics-block');
  const {NotificationsBlock}=require('../../packages/hig/native/src/notifications-block');
  const {PositionBlock}=require('../../packages/hig/native/src/position-block');
  const {TargetBlock}=require('../../packages/hig/native/src/target-block');
  const target={title:'Take Profit',submit:'Set',entry:'Entry',trigger:'Trigger',custom:'Custom',unit:'Unit',units:{dollar:'$',price:'Price',percent:'%'}};
  for(const [element,id] of [[h(SoundHapticsBlock,{title:'Sound',sections:[],stickyHeader:true}),'sound-sticky-header'],[h(SignalsBlock,{title:'Signals',groups:[],stickyHeader:true}),'signals-sticky-header'],[h(NotificationsBlock,{title:'Notifications',stickyHeader:true}),'notifications-sticky-header'],[h(PositionBlock,{title:'Position',details:[],groups:[],stickyHeader:true,stickyHeaderBackground:'#222222'}),'position-sticky-header'],[h(TargetBlock,{kind:'take-profit',labels:target,entry:1,unit:'dollar',value:1,stickyHeader:true}),'target-sticky-header']]){
   const view=mount(element);const scroll=view.findByType(ScrollView);expect([id,scroll.props.stickyHeaderIndices]).toEqual([id,[0]]);
   const wrapper=all(view,id).find(node=>typeof node.type==='string');expect([id,flat(wrapper).backgroundColor]).toEqual([id,'transparent']);
   act(()=>{scroll.props.onScroll({nativeEvent:{contentOffset:{y:40}}});});
   expect([id,flat(all(view,id).find(node=>typeof node.type==='string')).backgroundColor]).toEqual([id,id==='position-sticky-header'?'#222222':nativeSrgb.background]);
  }
  expect(mount(h(SignalsBlock,{title:'Signals',groups:[]})).findAllByType(ScrollView)).toHaveLength(0);
 });
 it('keeps provider feedback on setting actions unless feedback is false',()=>{
  const {SoundHapticsBlock}=require('../../packages/hig/native/src/sound-haptics-block');
  const {NotificationsBlock}=require('../../packages/hig/native/src/notifications-block');
  const {Button}=require('../../packages/hig/native/src/button');
  const action=(view,id)=>view.findAllByType(Button).find(node=>node.props.testID===id);
  let view=mount(h(NotificationsBlock,{title:'Notifications',items:[{id:'push',label:'Push',checked:false,onCheckedChange:()=>{},action:{label:'Open Settings',onSelect:()=>{},feedback:false}}]}));
  expect(action(view,'notifications-push-action').props.suppressFeedback).toBe(true);
  view=mount(h(NotificationsBlock,{title:'Notifications',items:[{id:'push',label:'Push',checked:false,onCheckedChange:()=>{},action:{label:'Open Settings',onSelect:()=>{}}}]}));
  expect(action(view,'notifications-push-action').props.suppressFeedback).toBe(false);
  view=mount(h(SoundHapticsBlock,{title:'Sound',sections:[{id:'mic',label:'Mic',checked:false,onCheckedChange:()=>{},action:{label:'Open Settings',onSelect:()=>{},feedback:false}}]}));
  expect(action(view,'sound-mic-action').props.suppressFeedback).toBe(true);
 });
 it('passes Pressable props to the PositionBlock header controls and fills PositionBlockHeader once scrolled',()=>{
  const {PositionBlock,PositionBlockHeader}=require('../../packages/hig/native/src/position-block');
  let view=mount(h(PositionBlock,{title:'Position',details:[],groups:[],onBack:()=>{},onClose:()=>{},backProps:{android_disableSound:true},closeProps:{android_disableSound:true}}));
  expect(pressable(view,'position-back').props.android_disableSound).toBe(true);expect(pressable(view,'position-close').props.android_disableSound).toBe(true);
  const pinned=view=>flat(all(view,'pinned').find(node=>typeof node.type==='string')).backgroundColor;
  view=mount(h(PositionBlockHeader,{title:'Position',testID:'pinned',scrolled:false}));expect(pinned(view)).toBe('transparent');
  view=mount(h(PositionBlockHeader,{title:'Position',testID:'pinned',scrolled:true}));expect(pinned(view)).toBe(nativeSrgb.background);
  view=mount(h(PositionBlockHeader,{title:'Position',testID:'pinned'}));expect(pinned(view)).toBeUndefined();
 });
});
it('reaches 48dp around the 32dp signals help pill, and leaves the swap card capsules as they were',()=>{
 const view=mount(h(SignalsBlock,{title:'Signals',groups:[{id:'trend',title:'Trend',help:{label:'How it works',onSelect:()=>{}},items:[]}]}));
 const pill=pressable(view,'signals-trend-help');expect(pill.props.hitSlop).toEqual({top:8,bottom:8,left:8,right:8});expect(flat(pill).minHeight).toBe(32);
 expect(flat(pill).minHeight+pill.props.hitSlop.top+pill.props.hitSlop.bottom).toBe(48);
 const {SwapCapsule}=require('../../packages/hig/native/src/swap-parts');
 const capsule=mount(h(SwapCapsule,{testID:'max',onPress:()=>{}},'Max'));expect(pressable(capsule,'max').props.hitSlop).toEqual({top:6,bottom:6});
});

it('HeaderClose takes disabled in closeProps: a faint glyph, read as disabled, not pressable; Pressable props still reach it',()=>{
 const close=jest.fn();
 let view=mount(h(header.HeaderClose,{testID:'pane-close',label:'Close',onClose:close,closeProps:{disabled:true,android_disableSound:true}}));
 const control=pressable(view,'pane-close');expect(control.props.disabled).toBe(true);expect(control.props.accessibilityState).toMatchObject({disabled:true});expect(control.props.android_disableSound).toBe(true);
 expect(view.findByType(icons.CloseIcon).props.color).toBe(require('@bloxwap/hig/tokens').nativeSrgb.faint);
 view=mount(h(header.HeaderClose,{testID:'pane-close',label:'Close',onClose:close}));
 const open=pressable(view,'pane-close');expect(open.props.disabled).toBeFalsy();act(()=>{open.props.onPress({stopPropagation(){},isDefaultPrevented:()=>false});});expect(close).toHaveBeenCalledTimes(1);
});

it('draws an eyebrow over the title, centred and muted, and grows the header to fit it',()=>{
 const view=mount(h(header.ScreenHeader,{testID:'pane',title:'Keep the lights on.',eyebrow:'Builder fee'}));
 const eyebrow=all(view,'pane-eyebrow').find(node=>typeof node.type==='string');expect(text(eyebrow)).toBe('Builder fee');expect(flat(eyebrow)).toMatchObject({textAlign:'center',textTransform:'uppercase'});
 const title=all(view,'pane-title').find(node=>typeof node.type==='string');expect(title.props.accessibilityRole).toBe('header');expect(flat(title).flex).toBeUndefined();
 const plain=mount(h(header.ScreenHeader,{testID:'pane',title:'Plain'}));expect(all(plain,'pane-eyebrow')).toHaveLength(0);expect(flat(all(plain,'pane-title').find(node=>typeof node.type==='string')).flex).toBe(1);
});
