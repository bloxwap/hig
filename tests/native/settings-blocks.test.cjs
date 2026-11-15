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
