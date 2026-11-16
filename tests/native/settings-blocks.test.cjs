/** Native SoundHapticsBlock, SignalsBlock and NotificationsBlock: a header, then settings as cards built from one switch row. */
const React=require('react');
const {create:render,act}=require('react-test-renderer');
const {View}=require('react-native');
const {HIGProvider}=require('../../packages/hig/native/src/provider');
const {SoundHapticsBlock,soundLevel}=require('../../packages/hig/native/src/sound-haptics-block');
const {SignalsBlock}=require('../../packages/hig/native/src/signals-block');
const {NotificationsBlock}=require('../../packages/hig/native/src/notifications-block');
const blocks=require('../../packages/hig/native/src/blocks');
const {Button}=require('../../packages/hig/native/src/button');
const {nativeSrgb}=require('../../packages/hig/tokens/src/index');
const h=React.createElement;
let root;
function mount(Block,props,provider={}){if(root)act(()=>root.unmount());act(()=>{root=render(h(HIGProvider,{reducedMotion:true,...provider},h(Block,props)));});return root.root;}
const all=(view,id)=>view.findAll(node=>node.props.testID===id);
const host=(view,id)=>all(view,id).find(node=>typeof node.type==='string');
const has=(view,id)=>all(view,id).length>0;
const text=node=>typeof node==='string'?node:node.children.map(text).join('');
const flat=node=>Object.assign({},...[].concat(node.props.style??[]).flat(Infinity).filter(Boolean));
const press=(view,id)=>act(()=>{all(view,id).find(node=>'onPress' in node.props&&!node.props.disabled)?.props.onPress({});});
const button=(view,id)=>view.findAllByType(Button).find(node=>node.props.testID===id);
const noop=()=>{};
afterEach(()=>{if(root)act(()=>root.unmount());root=undefined;});

const sections=(over={})=>[
 {id:'effects',label:'Effects',checked:true,onCheckedChange:noop,volume:{label:'Volume',value:0.25,onValueChange:noop},...over},
 {id:'mic',label:'Mic input',checked:true,onCheckedChange:noop,source:'iPhone Microphone',level:0.17,volume:{label:'Mic volume',value:1,onValueChange:noop}},
 {id:'haptics',label:'Haptics',checked:false,onCheckedChange:noop},
];
it('SoundHapticsBlock: one card per channel with a switch, and the volume steps of a channel that is on',()=>{
 expect([0.17,1.4,-2,null,undefined,Number.NaN].map(soundLevel)).toEqual([0.17,1,0,0,0,0]);
 const back=jest.fn(),flip=jest.fn(),volume=jest.fn();
 const view=mount(SoundHapticsBlock,{title:'Sound & Haptics',onBack:back,sections:sections({onCheckedChange:flip,volume:{label:'Volume',value:0.25,onValueChange:volume}})});
 expect(text(host(view,'sound-title'))).toBe('Sound & Haptics');expect(host(view,'sound-title').props.accessibilityRole).toBe('header');press(view,'sound-back');expect(back).toHaveBeenCalledTimes(1);
 expect(flat(host(view,'sound-sections'))).toMatchObject({gap:8,marginTop:16});expect(flat(host(view,'sound-effects'))).toMatchObject({borderRadius:20,paddingHorizontal:20,backgroundColor:nativeSrgb.surface});
 // The whole row is the switch, named by its label; the track shows its state.
 const row=host(view,'sound-effects-switch');expect(row.props.accessibilityRole).toBe('switch');expect(row.props.accessibilityLabel).toBe('Effects');expect(row.props.accessibilityState).toMatchObject({checked:true,disabled:false});
 expect(flat(host(view,'sound-effects-switch-track'))).toMatchObject({backgroundColor:nativeSrgb.action,alignItems:'flex-end'});expect(flat(host(view,'sound-haptics-switch-track'))).toMatchObject({backgroundColor:nativeSrgb.nested,alignItems:'flex-start'});
 press(view,'sound-effects-switch');expect(flip).toHaveBeenCalledWith(false);
 const group=host(view,'sound-effects-volume');expect(group.props.accessibilityRole).toBe('radiogroup');expect(group.props.accessibilityLabel).toBe('Volume');
 const steps=[0.25,0.5,0.75,1].map(step=>button(view,`sound-effects-volume-${step}`));
 expect(steps.map(step=>[step.props.children,step.props.intent,step.props.accessibilityState.selected])).toEqual([['25%','primary',true],['50%','secondary',false],['75%','secondary',false],['100%','secondary',false]]);
 act(()=>{steps[2].props.onPress({});});expect(volume).toHaveBeenCalledWith(0.75);
 // A channel without extras, or one that is off, is a switch alone.
 expect(has(view,'sound-haptics-body')).toBe(false);
});
it('SoundHapticsBlock: the device and a live meter for an input channel; extras hide while off; a disabled channel is dimmed and blocked',()=>{
 let view=mount(SoundHapticsBlock,{title:'Sound',sections:sections()});
 expect(text(host(view,'sound-mic-source'))).toBe('iPhone Microphone');expect(flat(host(view,'sound-mic-level'))).toMatchObject({width:'17%',backgroundColor:nativeSrgb.action});
 expect(flat(host(view,'sound-mic-meter'))).toMatchObject({height:4});expect(host(view,'sound-mic-meter').props.importantForAccessibility).toBe('no-hide-descendants');
 expect(button(view,'sound-mic-volume-1').props.intent).toBe('primary');
 view=mount(SoundHapticsBlock,{title:'Sound',sections:sections({checked:false})});expect(has(view,'sound-effects-body')).toBe(false);
 view=mount(SoundHapticsBlock,{title:'Sound',sections:[{id:'mic',label:'Mic',checked:true,onCheckedChange:noop,level:null,volume:{label:'Gain',options:[0.5,1],value:1,onValueChange:noop}}]});
 expect(flat(host(view,'sound-mic-level')).width).toBe('0%');expect(has(view,'sound-mic-volume-0.25')).toBe(false);expect(button(view,'sound-mic-volume-0.5').props.children).toBe('50%');
 const flip=jest.fn();view=mount(SoundHapticsBlock,{title:'Sound',sections:sections({disabled:true,onCheckedChange:flip})});
 expect(host(view,'sound-effects-switch').props.accessibilityState).toMatchObject({disabled:true});expect(flat(host(view,'sound-effects-switch')).opacity).toBe(0.5);expect(button(view,'sound-effects-volume-0.5').props.disabled).toBe(true);
 press(view,'sound-effects-switch');expect(flip).not.toHaveBeenCalled();
 view=mount(SoundHapticsBlock,{title:'Sound',sections:[]});expect(has(view,'sound-sections')).toBe(false);
 expect(blocks.SoundHapticsBlock).toBe(SoundHapticsBlock);expect(blocks.soundLevel).toBe(soundLevel);
});

it('SignalsBlock: each group has a heading, an optional verified mark and help capsule, and switches sharing one container',()=>{
 const flip=jest.fn(),help=jest.fn();
 const groups=[
  {id:'trend',title:'Trend',help:{label:'How it works',onSelect:help},items:[{id:'trend',label:'Trend',description:'Direction marks on markets that just moved hard.',checked:true,onCheckedChange:flip},{id:'feed',label:'Live Activity Feed',checked:true,onCheckedChange:flip}]},
  {id:'swing',title:'Swing',verified:true,items:[{id:'swing',label:'Swing',checked:false,onCheckedChange:flip,disabled:true}]},
 ];
 let view=mount(SignalsBlock,{title:'Signals',verifiedLabel:'Verified',groups});
 expect(text(host(view,'signals-title'))).toBe('Signals');expect(has(view,'signals-back')).toBe(false);
 expect(host(view,'signals-trend-title').props).toMatchObject({accessibilityRole:'header',accessibilityLabel:'Trend'});expect(host(view,'signals-swing-title').props.accessibilityLabel).toBe('Swing, Verified');
 expect(has(view,'signals-swing-verified')).toBe(true);expect(has(view,'signals-trend-verified')).toBe(false);
 expect(flat(host(view,'signals-trend-items'))).toMatchObject({gap:2,borderRadius:20,overflow:'hidden'});expect(flat(host(view,'signals-trend-trend'))).toMatchObject({borderRadius:0,backgroundColor:nativeSrgb.surface});
 // The description is the switch's hint.
 const row=host(view,'signals-trend-trend-switch');expect(row.props).toMatchObject({accessibilityRole:'switch',accessibilityLabel:'Trend',accessibilityHint:'Direction marks on markets that just moved hard.'});
 press(view,'signals-trend-trend-switch');expect(flip).toHaveBeenCalledWith(false);
 // The help control is the small capsule, not a full-size button.
 const {SwapCapsule}=require('../../packages/hig/native/src/swap-parts');const pills=view.findAllByType(SwapCapsule);expect(pills.map(pill=>pill.props.testID)).toEqual(['signals-trend-help']);expect(text(pills[0])).toBe('How it works');expect(button(view,'signals-trend-help')).toBeUndefined();
 act(()=>{pills[0].props.onPress();});expect(help).toHaveBeenCalledTimes(1);
 expect(host(view,'signals-swing-swing-switch').props.accessibilityState).toMatchObject({checked:false,disabled:true});
 // Without a name the mark is not read; a group without items is a heading alone.
 view=mount(SignalsBlock,{title:'Signals',groups:[{id:'swing',title:'Swing',verified:true,items:[]}]});expect(host(view,'signals-swing-title').props.accessibilityLabel).toBe('Swing');expect(has(view,'signals-swing-items')).toBe(false);
 expect(blocks.SignalsBlock).toBe(SignalsBlock);
});

it('NotificationsBlock: one card per kind with a switch, and a failure under its card as an alert',()=>{
 const push=jest.fn(),back=jest.fn();
 const items=error=>[{id:'push',label:'Push notifications',description:'Delivered to your device.',checked:false,onCheckedChange:push,error},{id:'swing',label:'Swing notifications',checked:true,onCheckedChange:noop}];
 let view=mount(NotificationsBlock,{title:'Notifications',onBack:back,headerAction:h(View,{testID:'help'}),items:items()});
 expect(text(host(view,'notifications-title'))).toBe('Notifications');press(view,'notifications-back');expect(back).toHaveBeenCalledTimes(1);expect(has(view,'help')).toBe(true);
 expect(flat(host(view,'notifications-items'))).toMatchObject({gap:8,marginTop:16});expect(flat(host(view,'notifications-push'))).toMatchObject({borderRadius:20,backgroundColor:nativeSrgb.surface});
 expect(host(view,'notifications-push-switch').props.accessibilityState).toMatchObject({checked:false});expect(host(view,'notifications-swing-switch').props.accessibilityState).toMatchObject({checked:true});expect(has(view,'notifications-push-error')).toBe(false);
 press(view,'notifications-push-switch');expect(push).toHaveBeenCalledWith(true);
 view=mount(NotificationsBlock,{title:'Notifications',items:items('Push request timed out')});
 const alert=host(view,'notifications-push-error');expect(text(alert)).toBe('Push request timed out');expect(alert.props.accessibilityRole).toBe('alert');expect(flat(alert).color).toBe(nativeSrgb.negative);expect(has(view,'notifications-swing-error')).toBe(false);
 view=mount(NotificationsBlock,{title:'Notifications',items:[]});expect(has(view,'notifications-items')).toBe(false);
 expect(blocks.NotificationsBlock).toBe(NotificationsBlock);
});
describe('host slots (Unreleased)',()=>{
 const {RadioGroup}=require('../../packages/hig/native/src/radio-group');
 const {SwitchRow}=require('../../packages/hig/native/src/switch-row');
 const row=(view,id)=>view.findAllByType(SwitchRow).find(node=>node.props.testID===id);
 it('SoundHapticsBlock: device choices, a named level meter, an action, and volume kept disabled while off',()=>{
  const choose=jest.fn(),open=jest.fn();
  const mic={id:'mic',label:'Mic input',checked:true,onCheckedChange:noop,source:'USB Mic',level:0.426,levelLabel:'Input level',
   choices:{label:'Input',options:[{value:'auto',label:'Automatic'},{value:'usb',label:'USB Mic'}],value:'auto',onValueChange:choose},
   volume:{label:'Mic volume',value:1,onValueChange:noop},action:{label:'Open Settings',onSelect:open}};
  let view=mount(SoundHapticsBlock,{title:'Sound & Haptics',description:'How the app sounds and feels.',sections:[mic]});
  expect(text(host(view,'sound-description'))).toBe('How the app sounds and feels.');
  const radios=view.findByType(RadioGroup);expect(radios.props).toMatchObject({label:'Input',value:'auto'});act(()=>{radios.props.onValueChange('usb');});expect(choose).toHaveBeenCalledWith('usb');
  const meter=host(view,'sound-mic-meter');expect(meter.props).toMatchObject({accessible:true,accessibilityRole:'progressbar',accessibilityLabel:'Input level'});expect(meter.props.accessibilityValue).toEqual({min:0,max:100,now:43,text:'43%'});
  const action=button(view,'sound-mic-action');expect(action.props.intent).toBe('secondary');act(()=>{action.props.onPress();});expect(open).toHaveBeenCalledTimes(1);
  view=mount(SoundHapticsBlock,{title:'Sound & Haptics',sections:[{...mic,checked:false}]});
  expect(has(view,'sound-mic-source')).toBe(false);expect(has(view,'sound-mic-choices')).toBe(false);expect(has(view,'sound-mic-meter')).toBe(false);expect(has(view,'sound-mic-volume')).toBe(false);expect(has(view,'sound-mic-action')).toBe(true);
  view=mount(SoundHapticsBlock,{title:'Sound & Haptics',sections:[{...mic,checked:false,volumeWhenOff:'disabled'}]});
  expect([0.25,0.5,0.75,1].map(step=>button(view,`sound-mic-volume-${step}`).props.disabled)).toEqual([true,true,true,true]);
  view=mount(SoundHapticsBlock,{title:'Sound & Haptics',sections:[{...mic,levelLabel:undefined}]});expect(host(view,'sound-mic-meter').props.accessible).toBe(false);
 });
 it('SignalsBlock: locked switches stay on at full strength and read unavailable; hints, errors, accessories, a host mark and a help pill ref',()=>{
  const change=jest.fn();const pill=React.createRef();
  const view=mount(SignalsBlock,{title:'Signals',description:'Choose what you receive.',verifiedLabel:'Genesis',verifiedMark:h(View,{testID:'mark'}),groups:[{id:'trend',title:'Trend',verified:true,help:{label:'How it works',onSelect:noop,ref:pill},items:[
   {id:'trend',label:'Trend',checked:false,locked:true,onCheckedChange:change},
   {id:'feed',label:'Feed',checked:true,onCheckedChange:noop,hint:'Needs permission',error:'Request failed',labelAccessory:h(View,{testID:'badge'})}]}]});
  const locked=row(view,'signals-trend-trend-switch');expect(locked.props.checked).toBe(true);expect(locked.props.disabled).toBe(true);expect(flat(locked).opacity).toBe(1);
  expect(host(view,'signals-trend-trend-switch').props.accessibilityState).toMatchObject({checked:true,disabled:true});
  press(view,'signals-trend-trend-switch');expect(change).not.toHaveBeenCalled();
  expect(has(view,'badge')).toBe(true);expect(has(view,'signals-trend-feed-switch-label')).toBe(true);
  expect(text(host(view,'signals-trend-feed-hint'))).toBe('Needs permission');expect(flat(host(view,'signals-trend-feed-error')).color).toBe(nativeSrgb.negative);
  expect(has(view,'mark')).toBe(true);expect(pill.current).toBeTruthy();expect(text(host(view,'signals-description'))).toBe('Choose what you receive.');
  expect(host(view,'signals-trend-feed-switch').props.accessibilityLabel).toBe('Feed');
  // Host artwork stays inside the heading's one element.
  expect(host(view,'signals-trend-title').props).toMatchObject({accessible:true,accessibilityRole:'header',accessibilityLabel:'Trend, Genesis'});
  // An interactive mark stays in the accessibility tree (Unreleased): the heading moves to the title text, and the mark follows it.
  const live=mount(SignalsBlock,{title:'Signals',verifiedLabel:'Genesis',verifiedMarkInteractive:true,verifiedMark:h(View,{testID:'mark',accessible:true,accessibilityRole:'button'}),groups:[{id:'trend',title:'Trend',verified:true,items:[]}]});
  expect(host(live,'signals-trend-title').props.accessible).toBe(false);
  const title=live.findAll(node=>node.props.accessibilityRole==='header'&&typeof node.type==='string').find(node=>node.props.accessibilityLabel==='Trend, Genesis');expect(title).toBeTruthy();
  // labelAccessoryLabel names the accessory after the label and a pause, as on web (Unreleased); without it the switch reads the label alone.
  const named=mount(SignalsBlock,{title:'Signals',groups:[{id:'trend',title:'Trend',items:[{id:'feed',label:'Feed',checked:true,onCheckedChange:noop,labelAccessory:h(View,{testID:'badge'}),labelAccessoryLabel:'New'}]}]});
  expect(host(named,'signals-trend-feed-switch').props.accessibilityLabel).toBe('Feed, New');
  const plain=mount(SignalsBlock,{title:'Signals',verifiedLabel:'Genesis',groups:[{id:'trend',title:'Trend',verified:true,items:[]}]});
  expect(host(plain,'signals-trend-title').props).toMatchObject({accessible:true,accessibilityRole:'header',accessibilityLabel:'Trend, Genesis'});
 });
 it('NotificationsBlock: hints beside errors, an action under the card, locked items and groups with an optional heading',()=>{
  const settings=jest.fn();
  const view=mount(NotificationsBlock,{title:'Notifications',description:'Pick what reaches you.',items:[{id:'push',label:'Push',checked:false,onCheckedChange:noop,hint:'Registering this device',error:'Permission refused',action:{label:'Open Settings',onSelect:settings}}],
   groups:[{id:'alerts',title:'Alert types',items:[{id:'price',label:'Price',checked:false,locked:true,onCheckedChange:noop}]},{id:'plain',items:[{id:'news',label:'News',checked:false,onCheckedChange:noop}]}]});
  expect(flat(host(view,'notifications-push-hint')).color).toBe(nativeSrgb.muted);expect(host(view,'notifications-push-hint').props.accessibilityLiveRegion).toBe('polite');
  act(()=>{button(view,'notifications-push-action').props.onPress();});expect(settings).toHaveBeenCalledTimes(1);
  expect(text(host(view,'notifications-group-alerts-title'))).toBe('Alert types');expect(host(view,'notifications-group-alerts-title').props.accessibilityRole).toBe('header');
  expect(flat(host(view,'notifications-group-alerts')).marginTop).toBe(24);expect(has(view,'notifications-group-plain-title')).toBe(false);
  expect(row(view,'notifications-price-switch').props.checked).toBe(true);expect(text(host(view,'notifications-description'))).toBe('Pick what reaches you.');
  const groupsOnly=mount(NotificationsBlock,{title:'Notifications',groups:[{id:'a',items:[{id:'x',label:'X',checked:false,onCheckedChange:noop}]}]});expect(has(groupsOnly,'notifications-x')).toBe(true);
 });
});

it('lays a setting row out as web does: a 48dp switch with 12 above and below its text, in a card 4 above and below, 16 at the foot when content follows',()=>{
 // The row's own vertical geometry, summed as Yoga lays it out for one-line text: label 24, gap 2, description 21.
 const geometry=(view,card,sw)=>{
  const box=flat(host(view,card)),row=flat(host(view,sw));
  const content=host(view,sw).findAll(node=>typeof node.type==='string'&&flat(node).paddingVertical===12&&flat(node).flexDirection==='row')[0];
  return {top:box.paddingTop,bottom:box.paddingBottom,gap:box.gap,minHeight:row.minHeight,padding:flat(content).paddingVertical};
 };
 let view=mount(NotificationsBlock,{title:'Notifications',items:[{id:'push',label:'Push',checked:true,onCheckedChange:noop},{id:'price',label:'Price alerts',description:'When a market moves.',checked:false,onCheckedChange:noop}]});
 const plain=geometry(view,'notifications-push','notifications-push-switch');
 expect(plain).toEqual({top:4,bottom:4,gap:12,minHeight:48,padding:12});
 // Separate cards stay 8 apart, as on web (.hig-setting-cards).
 expect(flat(host(view,'notifications-items')).gap).toBe(8);
 // Plain row: 4 + max(48, 12 + 24 + 12) + 4 = 56. Described row: 4 + 12 + 24 + 2 + 21 + 12 + 4 = 79.
 expect(plain.top+Math.max(plain.minHeight,plain.padding*2+24)+plain.bottom).toBe(56);
 const described=geometry(view,'notifications-price','notifications-price-switch');
 expect(described.top+Math.max(described.minHeight,described.padding*2+24+2+21)+described.bottom).toBe(79);
 // A signal with a hint, and a sound channel with its body, end 16 above the card's foot.
 view=mount(SignalsBlock,{title:'Signals',groups:[{id:'trend',title:'Trend',items:[{id:'feed',label:'Feed',hint:'Registering',checked:true,onCheckedChange:noop},{id:'plain',label:'Plain',checked:false,onCheckedChange:noop}]}]});
 expect(flat(host(view,'signals-trend-feed'))).toMatchObject({paddingTop:4,paddingBottom:16});expect(flat(host(view,'signals-trend-plain'))).toMatchObject({paddingTop:4,paddingBottom:4});
 expect(flat(host(view,'signals-trend-items')).gap).toBe(2);
 view=mount(SoundHapticsBlock,{title:'Sound',sections:sections()});
 expect(flat(host(view,'sound-effects'))).toMatchObject({paddingTop:4,paddingBottom:16});expect(flat(host(view,'sound-haptics'))).toMatchObject({paddingTop:4,paddingBottom:4});
});
