/** Native ConfirmBlock: header, the amount and ticker, the address and network rows, the warning, then Cancel beside Confirm. */
const React=require('react');
const {create:render,act}=require('react-test-renderer');
const {nativeSrgb}=require('@bloxwap/hig/tokens');
const {StyleSheet}=require('react-native');
const {HIGProvider}=require('../../packages/hig/native/src/provider');
const {ConfirmBlock}=require('../../packages/hig/native/src/confirm-block');
const blocks=require('../../packages/hig/native/src/blocks');
const {Button}=require('../../packages/hig/native/src/button');
const {ListRow}=require('../../packages/hig/native/src/list-group');
const labels=view=>host(view,'confirm-details').children.map(line=>line.props.accessibilityLabel);
const {AnimatedNumberReadout}=require('../../packages/hig/native/src/animated-number');
const h=React.createElement;
let root;
const address='0x1111111111111111111111111111111111111111';
const base={amount:2.5,symbol:'HYPE',address,network:'HyperEVM',onConfirm:()=>{}};
function mount(props={},provider={}){if(root)act(()=>root.unmount());act(()=>{root=render(h(HIGProvider,{reducedMotion:true,...provider},h(ConfirmBlock,{...base,...props})));});return root.root;}
const all=(view,id)=>view.findAll(node=>node.props.testID===id);
const host=(view,id)=>all(view,id).find(node=>typeof node.type==='string');
const has=(view,id)=>all(view,id).length>0;
const text=node=>typeof node==='string'?node:node.children.map(text).join('');
const flat=node=>StyleSheet.flatten(node.props.style)??{};
const button=(view,id)=>view.findAllByType(Button).find(node=>node.props.testID===id);
afterEach(()=>{if(root)act(()=>root.unmount());root=undefined;});

it('shows the heading, the amount with its ticker, the address in full, the network and the warning',()=>{
 const view=mount();
 expect(text(host(view,'confirm-title'))).toBe('Confirm Send');expect(has(view,'confirm-back')).toBe(false);
 expect(view.findAllByType(AnimatedNumberReadout)[0].props).toMatchObject({value:2.5,options:{maximumFractionDigits:6}});expect(text(host(view,'confirm-amount'))).toBe('2.5');expect(text(host(view,'confirm-symbol'))).toBe('HYPE');
 expect(text(host(view,'confirm-to'))).toBe('0x1111111111111111111\n111111111111111111111');
 // First six and last four in the text colour, the rest muted.
 expect(host(view,'confirm-to').findAll(node=>typeof node.type==='string'&&typeof node.props.children==='string').map(node=>[node.props.children,flat(node).color])).toEqual([['0x1111',nativeSrgb.text],['111111111111111',nativeSrgb.muted],['11111111111111111',nativeSrgb.muted],['1111',nativeSrgb.text]]);expect(text(host(view,'confirm-network'))).toBe('HyperEVM');expect(labels(view)).toEqual([`To, ${address}`,'Network, HyperEVM']);
 // The details are read-only text: no rows and nothing to press.
 expect(view.findAllByType(ListRow)).toHaveLength(0);
 expect(text(host(view,'confirm-warning-title'))).toBe('Double-check the address.');expect(flat(host(view,'confirm-warning-title')).color).toBe(nativeSrgb.warning);
 expect(text(host(view,'confirm-warning-body'))).toBe("HYPE moves to this address on HyperEVM instantly — there's no clawback if the address is wrong.");
 expect(button(view,'confirm-confirm').props.intent??'primary').toBe('primary');expect(has(view,'confirm-cancel')).toBe(false);
});

it('reports Confirm, Cancel and Back, and blocks all three while busy',()=>{
 const confirm=jest.fn(),cancel=jest.fn(),back=jest.fn();
 let view=mount({onConfirm:confirm,onCancel:cancel,onBack:back});
 act(()=>button(view,'confirm-confirm').props.onPress({}));act(()=>button(view,'confirm-cancel').props.onPress({}));
 act(()=>all(view,'confirm-back').find(node=>'onPress' in node.props).props.onPress({}));
 expect(confirm).toHaveBeenCalledTimes(1);expect(cancel).toHaveBeenCalledTimes(1);expect(back).toHaveBeenCalledTimes(1);
 expect(button(view,'confirm-cancel').props.intent).toBe('secondary');
 // Cancel leads and Confirm trails, sharing the row.
 expect(flat(host(view,'confirm-actions')).flexDirection).toBe('row');expect(view.findAllByType(Button).filter(node=>/^confirm-(cancel|confirm)$/.test(node.props.testID)).map(node=>node.props.testID)).toEqual(['confirm-cancel','confirm-confirm']);
 view=mount({onConfirm:confirm,onCancel:cancel,onBack:back,busy:true});
 expect(button(view,'confirm-confirm').props.busy).toBe(true);expect(button(view,'confirm-cancel').props.disabled).toBe(true);
 expect(all(view,'confirm-back').some(node=>node.props.accessibilityState?.disabled===true)).toBe(true);
 view=mount({confirmDisabled:true,onCancel:cancel});expect(button(view,'confirm-confirm').props.disabled).toBe(true);expect(button(view,'confirm-cancel').props.disabled).toBeFalsy();
});

it('adds detail rows, takes host text, drops the warning on null, and prefixes test IDs',()=>{
 let view=mount({title:'Review',confirmLabel:'Send HYPE',cancelLabel:'Not now',onCancel:()=>{},warningTitle:'Check it',warning:'This cannot be undone.',details:[{label:'Network fee',value:'0.0001 HYPE'}],headingId:'send-title'});
 expect(text(host(view,'confirm-title'))).toBe('Review');expect(host(view,'confirm-title').props.nativeID).toBe('send-title');
 expect(labels(view)).toEqual([`To, ${address}`,'Network, HyperEVM','Network fee, 0.0001 HYPE']);expect(text(host(view,'confirm-detail-0'))).toBe('0.0001 HYPE');
 expect(text(host(view,'confirm-warning-title'))).toBe('Check it');expect(text(host(view,'confirm-warning-body'))).toBe('This cannot be undone.');
 expect(button(view,'confirm-confirm').props.children).toBe('Send HYPE');expect(button(view,'confirm-cancel').props.children).toBe('Not now');
 view=mount({warning:null});expect(has(view,'confirm-warning')).toBe(false);
 view=mount({testID:'send'});expect(has(view,'send-amount')).toBe(true);expect(has(view,'send-confirm')).toBe(true);expect(has(view,'confirm-amount')).toBe(false);
});

it('takes translated messages, pins its header with stickyHeader, and is exported from the blocks aggregate',()=>{
 expect(blocks.ConfirmBlock).toBe(ConfirmBlock);
 let view=mount({onCancel:()=>{}},{messages:{confirmSend:'Confirmer',sendTo:'À',sendNetwork:'Réseau',sendWarningTitle:'Vérifiez.',sendWarning:(symbol,network)=>`${symbol} sur ${network}`,cancel:'Annuler'}});
 expect(text(host(view,'confirm-title'))).toBe('Confirmer');expect(labels(view)).toEqual([`À, ${address}`,'Réseau, HyperEVM']);
 expect(text(host(view,'confirm-warning-body'))).toBe('HYPE sur HyperEVM');expect(button(view,'confirm-cancel').props.children).toBe('Annuler');
 view=mount({stickyHeader:true});expect(has(view,'confirm-sticky-header')).toBe(true);expect(text(host(view,'confirm-title'))).toBe('Confirm Send');
});

it('draws the lines after the address on one line with oneLineDetails, and wraps by default',()=>{
 const details=[{label:'Network fee',value:'0.0001 HYPE'}];
 let view=mount({details});
 expect(host(view,'confirm-network').props.numberOfLines).toBeUndefined();expect(host(view,'confirm-detail-0').props.numberOfLines).toBeUndefined();
 view=mount({details,oneLineDetails:true});
 expect(host(view,'confirm-network').props.numberOfLines).toBe(1);expect(host(view,'confirm-detail-0').props.numberOfLines).toBe(1);
 // The address keeps its two rows, and every line is still read in full.
 expect(host(view,'confirm-to').props.numberOfLines).toBeUndefined();expect(text(host(view,'confirm-to'))).toBe('0x1111111111111111111\n111111111111111111111');
 expect(labels(view)).toEqual([`To, ${address}`,'Network, HyperEVM','Network fee, 0.0001 HYPE']);
});

it('reads the amount with amountLabel and draws a notice between the warning and the actions',()=>{
 const {View,Text}=require('react-native');
 let view=mount();
 expect(host(view,'confirm-amount').props.accessibilityLabel).toBeUndefined();expect(has(view,'fee-error')).toBe(false);
 view=mount({amountLabel:'Amount',notice:h(View,{testID:'fee-error',accessibilityRole:'alert'},h(Text,null,'Fee unavailable'))});
 expect(host(view,'confirm-amount').props.accessibilityLabel).toBe('Amount: 2.5');
 const order=host(view,'confirm').children.map(child=>child.props.testID);
 expect(order.slice(order.indexOf('confirm-warning'),order.indexOf('confirm-warning')+3)).toEqual(['confirm-warning','fee-error','confirm-actions']);
});

it('truncates a value that is not text with an ellipsis under oneLineDetails, and reads its valueLabel',()=>{
 const {Text}=require('react-native');
 const details=[{label:'Network fee',value:h(Text,{style:{color:'#0a0'}},'0.0001 HYPE ($0.01)'),valueLabel:'0.0001 HYPE'}];
 let view=mount({details});
 // Off: the node sits in a plain View and may wrap.
 expect(host(view,'confirm-detail-0').type).toBe('View');expect(host(view,'confirm-detail-0').props.numberOfLines).toBeUndefined();
 view=mount({details,oneLineDetails:true});
 // On: the node is set inside one tail-ellipsized line of text.
 const value=host(view,'confirm-detail-0');expect(value.type).toBe('Text');expect(value.props.numberOfLines).toBe(1);expect(value.props.ellipsizeMode).toBe('tail');
 expect(text(value)).toBe('0.0001 HYPE ($0.01)');expect(labels(view)).toEqual([`To, ${address}`,'Network, HyperEVM','Network fee, 0.0001 HYPE']);
});

it('confirms something that is not a send: no amount, lines or warning, the body and points, a destructive Confirm and a tertiary action',()=>{
 const anyway=jest.fn(),confirm=jest.fn();
 if(root)act(()=>root.unmount());
 act(()=>{root=render(h(HIGProvider,{reducedMotion:true},h(ConfirmBlock,{title:'Delete account?',confirmLabel:'Delete',confirmIntent:'destructive',onConfirm:confirm,onCancel:()=>{},points:['Keys are erased','Profile is removed'],tertiaryAction:{label:'Delete anyway',tone:'destructive',onSelect:anyway}},h('Text',{testID:'host-body'},'This cannot be undone.'))));});
 const view=root.root;
 expect(text(host(view,'confirm-title'))).toBe('Delete account?');
 for(const part of ['confirm-amount','confirm-symbol','confirm-details','confirm-to','confirm-network','confirm-warning'])expect(has(view,part)).toBe(false);
 expect(has(view,'host-body')).toBe(true);expect(text(host(view,'confirm-point-1'))).toContain('Profile is removed');
 expect(button(view,'confirm-confirm').props.intent).toBe('destructive');
 const tertiary=button(view,'confirm-tertiary');expect(tertiary.props.intent).toBe('ghost');expect(tertiary.props.accessibilityLabel).toBe('Delete anyway');
 expect(flat(tertiary.findAll(node=>node.type==='Text'&&node.props.children==='Delete anyway')[0]).color).toBe(nativeSrgb.negative);
 act(()=>tertiary.props.onPress({stopPropagation(){},isDefaultPrevented:()=>false}));expect(anyway).toHaveBeenCalledTimes(1);
 // Busy holds the tertiary action.
 act(()=>root.update(h(HIGProvider,{reducedMotion:true},h(ConfirmBlock,{title:'Delete account?',busy:true,onConfirm:confirm,tertiaryAction:{label:'Delete anyway',onSelect:anyway}}))));
 expect(button(root.root,'confirm-tertiary').props.disabled).toBe(true);
 // cancelWhileBusy keeps Back, Cancel and the tertiary action while the confirm spins.
 act(()=>root.update(h(HIGProvider,{reducedMotion:true},h(ConfirmBlock,{title:'Enable',busy:true,cancelWhileBusy:true,onBack:()=>{},onCancel:()=>{},onConfirm:confirm,tertiaryAction:{label:'Delete anyway',onSelect:anyway}}))));
 expect(button(root.root,'confirm-tertiary').props.disabled).toBe(false);expect(button(root.root,'confirm-cancel').props.disabled).toBe(false);expect(button(root.root,'confirm-confirm').props.busy).toBe(true);
});

it('backWhileBusy frees Back alone while busy',()=>{
 const anyway=jest.fn();
 const view=mount({busy:true,backWhileBusy:true,onBack:()=>{},onCancel:()=>{},tertiaryAction:{label:'Delete anyway',onSelect:anyway}});
 expect(all(view,'confirm-back').some(node=>node.props.accessibilityState?.disabled===true)).toBe(false);
 expect(all(view,'confirm-back').some(node=>node.props.disabled===false)).toBe(true);
 expect(button(view,'confirm-cancel').props.disabled).toBe(true);expect(button(view,'confirm-tertiary').props.disabled).toBe(true);expect(button(view,'confirm-confirm').props.busy).toBe(true);
});

it('takes a test ID per action, Pressable props for Back, and cancelDisabled holds Cancel without busy',()=>{
 const exported=jest.fn(),withdraw=jest.fn(),anyway=jest.fn(),back=jest.fn(),pressIn=jest.fn();
 // The delete-account funds refusal: Export account beside Withdraw first, then Delete anyway, under the host's own prefix.
 const props={amount:undefined,symbol:undefined,address:undefined,network:undefined,testID:'delete-account',title:'Move your funds first',confirmLabel:'Withdraw first',cancelLabel:'Export account',onConfirm:withdraw,onCancel:exported,confirmTestID:'delete-account-withdraw',cancelTestID:'delete-account-export',tertiaryAction:{label:'Delete anyway',onSelect:anyway,testID:'delete-account-anyway'},onBack:back,backProps:{android_disableSound:true,onPressIn:pressIn}};
 const view=mount(props);
 expect(has(view,'delete-account-confirm')).toBe(false);expect(has(view,'delete-account-cancel')).toBe(false);expect(has(view,'delete-account-tertiary')).toBe(false);
 act(()=>button(view,'delete-account-withdraw').props.onPress());act(()=>button(view,'delete-account-export').props.onPress());act(()=>button(view,'delete-account-anyway').props.onPress());
 const backButton=all(view,'delete-account-back').find(node=>typeof node.props.onPressIn==='function'&&node.props.android_disableSound===true);
 expect(backButton).toBeTruthy();act(()=>backButton.props.onPressIn());act(()=>backButton.props.onPress());
 expect([withdraw,exported,anyway,back,pressIn].map(fn=>fn.mock.calls.length)).toEqual([1,1,1,1,1]);
 const held=mount({...props,cancelDisabled:true});
 expect(button(held,'delete-account-export').props.disabled).toBe(true);expect(button(held,'delete-account-withdraw').props.disabled).toBeFalsy();expect(button(held,'delete-account-anyway').props.disabled).toBe(false);
});

it('fills the confirming action in the warning role with a dark label for confirmIntent warning',()=>{
 if(root)act(()=>root.unmount());
 act(()=>{root=render(h(HIGProvider,{reducedMotion:true},h(ConfirmBlock,{title:'Send anyway?',confirmLabel:'Send anyway',confirmIntent:'warning',warning:'This address is new to you.',onConfirm:()=>{},onCancel:()=>{}})));});
 const confirm=button(root.root,'confirm-confirm');expect(confirm.props.intent).toBe('warning');
 const pressable=confirm.findAll(node=>typeof node.props.style==='function')[0];expect(StyleSheet.flatten(pressable.props.style({pressed:false})).backgroundColor).toBe(nativeSrgb.warning);
 expect(flat(confirm.findAll(node=>node.type==='Text'&&node.props.children==='Send anyway')[0]).color).toBe(nativeSrgb.background);
});
