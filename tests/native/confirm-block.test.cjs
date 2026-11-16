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
 expect(text(host(view,'confirm-to'))).toBe(address);expect(text(host(view,'confirm-network'))).toBe('HyperEVM');expect(labels(view)).toEqual([`To, ${address}`,'Network, HyperEVM']);
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
