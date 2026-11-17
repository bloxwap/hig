// SwapPanelBlock block: one panel for send, swap and bridge. The host owns tokens, prices, quote and wallet; the panel owns the entry.
// Pickers and settings are views pushed inside the panel, never a dialog; SwapSheet presents the panel in the gesture sheet.
jest.mock('@gorhom/bottom-sheet',()=>{
 const React=require('react'),{View,ScrollView,FlatList}=require('react-native');
 const methods={present:jest.fn(),dismiss:jest.fn(),snapToIndex:jest.fn()};
 const BottomSheetModal=React.forwardRef((props,ref)=>{React.useImperativeHandle(ref,()=>methods);return React.createElement(View,{...props,testID:'backend'},props.children);});
 const BottomSheetFlatList=props=>React.createElement(FlatList,{...props,sheetList:true});
 return {__esModule:true,default:View,methods,BottomSheetModal,BottomSheetView:View,BottomSheetScrollView:ScrollView,BottomSheetBackdrop:View,BottomSheetFlatList};
});
const React=require('react');
const {create,act}=require('react-test-renderer');
const {StyleSheet,View,Modal,BackHandler,Animated}=require('react-native');
const {nativeSrgb:colors}=require('@bloxwap/hig/tokens');
const {HIGProvider}=require('../../packages/hig/native/src/provider');
const {SwapPanelBlock,swapAction}=require('../../packages/hig/native/src/blocks');
const {SwapSheet}=require('../../packages/hig/native/src/swap-sheet');
const shared=require('../../packages/hig/native/src/swap-shared');
const {AnimatedNumberReadout}=require('../../packages/hig/native/src/animated-number');
const h=React.createElement;
const eth={id:'1-eth',symbol:'ETH',name:'Ether',chain:'Ethereum',chainId:1,balance:0.5,price:2000};
const usdc={id:'1-usdc',symbol:'USDC',name:'USD Coin',chain:'Ethereum',chainId:1,balance:100,price:1};
const baseUsdc={id:'8453-usdc',symbol:'USDC',name:'USD Coin',chain:'Base',chainId:8453,price:1};
const baseEth={id:'8453-eth',symbol:'ETH',name:'Ether',chain:'Base',chainId:8453,price:2000};
const tokens=[eth,usdc,baseUsdc,baseEth];
const event={stopPropagation(){},isDefaultPrevented:()=>false,preventDefault(){}};
let root;
function mount(props){if(root)act(()=>root.unmount());act(()=>{root=create(h(HIGProvider,{reducedMotion:true},h(SwapPanelBlock,{tokens,onSubmit:jest.fn(),...props})));});return root.root;}
afterEach(()=>{if(root)act(()=>root.unmount());root=null;jest.useRealTimers();jest.restoreAllMocks();});
const all=(tree,id)=>tree.findAll(node=>node.props.testID===id&&typeof node.type!=='string');
const node=(tree,id)=>{const hits=all(tree,id);if(!hits.length)throw new Error(`No ${id}`);return hits[0];};
const has=(tree,id)=>all(tree,id).length>0;
const name=(tree,id)=>all(tree,id).map(hit=>hit.props.accessibilityLabel).find(Boolean);
const press=(tree,id)=>act(()=>{node(tree,id).props.onPress(event);});
const type=(tree,keys)=>{for(const key of keys)press(tree,`swap-key-${key==='<'?'back':key}`);};
const amount=(tree,side='from')=>node(tree,`swap-amount-${side}`).props.accessibilityValue.text;
// What an element reads as: its accessible name when it has one (a sentence around a live number), else its own text.
const read=(tree,id)=>{const hit=all(tree,id).find(found=>found.props.accessibilityLabel||found.props.children!==undefined);if(!hit)throw new Error(`No reading for ${id}`);return hit.props.accessibilityLabel??[].concat(hit.props.children).join('');};
// Live numbers: the readouts under an element (or the element itself when it is one).
const flows=(tree,id)=>[...new Set(all(tree,id).flatMap(hit=>hit.type===AnimatedNumberReadout?[hit]:hit.findAllByType(AnimatedNumberReadout)))];
const update=props=>{act(()=>{root.update(h(HIGProvider,{reducedMotion:true},h(SwapPanelBlock,{tokens,onSubmit:jest.fn(),...props})));});return root.root;};
const conversion=(tree,side='from')=>read(tree,`swap-conversion-${side}`);
const action=tree=>node(tree,'swap-action');
const actionText=tree=>[].concat(action(tree).props.children).join('');
const pick=(tree,side,token)=>{press(tree,`swap-slot-${side}`);press(tree,`swap-token-${token.id}`);};
const flat=target=>StyleSheet.flatten(typeof target.props.style==='function'?target.props.style({pressed:false}):target.props.style);

it('starts empty: named token slots, zero amounts, a keypad, and a disabled action that asks for a token',()=>{
 const tree=mount({});
 expect(node(tree,'swap-slot-from').props.accessibilityLabel).toBe('Select From token');expect(node(tree,'swap-slot-to').props.accessibilityLabel).toBe('Select To token');
 expect(node(tree,'swap-amount-from').props.accessibilityLabel).toBe('From amount');expect(amount(tree)).toBe('$0');expect(amount(tree,'to')).toBe('$0');
 expect(name(tree,'swap-mode-from')).toBe('Switch between dollars and token units');expect(node(tree,'swap-flip').props.accessibilityLabel).toBe('Swap direction');
 expect(actionText(tree)).toBe('Select a token');expect(action(tree).props.disabled).toBe(true);
 expect(node(tree,'swap-flip').props.disabled).toBe(true);expect(node(tree,'swap-reset').props.disabled).toBe(true);
 expect(has(tree,'swap-keypad')).toBe(true);expect(node(tree,'swap-key-back').props.accessibilityLabel).toBe('Delete');
 const card=flat(tree.findAll(n=>n.type===View&&n.props.testID==='swap-card-from')[0]);expect(card).toMatchObject({backgroundColor:colors.surface,borderRadius:24});expect(card.borderWidth).toBeUndefined();
 expect(has(mount({keypad:'never'}),'swap-keypad')).toBe(false);
});
it('builds the amount from keypad keys, caps dollars at two decimals, and reports token units',()=>{
 const onAmountChange=jest.fn();const tree=mount({defaultFrom:eth,defaultTo:usdc,onAmountChange});
 type(tree,'12.5');expect(amount(tree)).toBe('$12.5');expect(conversion(tree)).toBe('0.00625 ETH');expect(onAmountChange).toHaveBeenLastCalledWith('0.00625');
 type(tree,'09');expect(amount(tree)).toBe('$12.50');
 type(tree,'<<<<<');expect(amount(tree)).toBe('$0');expect(onAmountChange).toHaveBeenLastCalledWith('0');
 type(tree,'..');expect(amount(tree)).toBe('$0.');
});
it('several keys in one batch each build on the last',()=>{
 const tree=mount({defaultFrom:eth,defaultTo:usdc});
 act(()=>{for(const key of ['1','2','3'])node(tree,`swap-key-${key}`).props.onPress(event);});
 expect(amount(tree)).toBe('$123');
});
it('picks tokens through the picker, uncontrolled and controlled',()=>{
 const onFromChange=jest.fn(),onToChange=jest.fn();let tree=mount({onFromChange,onToChange});
 pick(tree,'from',eth);expect(onFromChange).toHaveBeenLastCalledWith(eth);expect(has(tree,'swap-test')).toBe(true);
 pick(tree,'to',baseUsdc);expect(onToChange).toHaveBeenLastCalledWith(baseUsdc);expect(actionText(tree)).toBe('Enter an amount');
 // Controlled: the panel shows only what the host passes back.
 const controlled=jest.fn();tree=mount({from:null,to:null,onFromChange:controlled});
 pick(tree,'from',eth);expect(controlled).toHaveBeenCalledWith(eth);expect(has(tree,'swap-test')).toBe(false);expect(actionText(tree)).toBe('Select a token');
});
it('filters the picker by search and chain, marks the selected row, and sections hot tokens',()=>{
 const tree=mount({defaultTo:usdc,hotTokenIds:['8453-eth']});press(tree,'swap-slot-to');
 const list=()=>node(tree,'swap-list-to').props.data.map(token=>token.id);
 expect(list()).toEqual(['8453-eth','1-eth','1-usdc','8453-usdc']);
 expect(node(tree,'swap-token-1-usdc').props.accessibilityState).toEqual({selected:true});
 // The chain chips are the Filter component: one radio per chain plus All, inside a named radiogroup.
 const chain=label=>tree.findAll(n=>n.props.accessibilityRole==='radio'&&n.props.accessibilityLabel===label&&typeof n.props.onPress==='function')[0];
 expect(tree.findAll(n=>n.props.accessibilityRole==='radiogroup'&&n.props.accessibilityLabel==='Chains').length).toBeGreaterThan(0);
 expect(chain('All').props.accessibilityState).toEqual({checked:true,disabled:false});
 act(()=>chain('Base').props.onPress(event));expect(list()).toEqual(['8453-usdc','8453-eth']);expect(chain('Base').props.accessibilityState).toEqual({checked:true,disabled:false});expect(chain('All').props.accessibilityState.checked).toBe(false);
 act(()=>chain('All').props.onPress(event));
 const search=tree.findAll(n=>n.props.accessibilityLabel==='Search name or paste address'&&n.props.onChangeText)[0];act(()=>search.props.onChangeText('usdbase'));
 expect(list()).toEqual(['8453-usdc']);
 act(()=>search.props.onChangeText('zzz'));expect(list()).toEqual([]);
});
it('names the action from the pair and blocks an amount above the balance',()=>{
 expect(swapAction(eth,eth)).toBe('send');expect(swapAction(eth,baseEth)).toBe('bridge');expect(swapAction(eth,usdc)).toBe('swap');expect(swapAction(eth,baseUsdc)).toBe('bridge');expect(swapAction(null,usdc)).toBe('send');
 for(const [to,label] of [[baseEth,'Bridge'],[usdc,'Swap'],[baseUsdc,'Bridge']]){const tree=mount({defaultFrom:eth,defaultTo:to});type(tree,'5');expect(actionText(tree)).toBe(label);expect(action(tree).props.disabled).toBe(false);}
 const tree=mount({defaultFrom:eth,defaultTo:usdc});type(tree,'1001');expect(actionText(tree)).toBe('Insufficient ETH');expect(action(tree).props.disabled).toBe(true);
});
it('submits the action once ready and not while submitting',()=>{
 const onSubmit=jest.fn();let tree=mount({defaultFrom:eth,defaultTo:baseUsdc,onSubmit});
 press(tree,'swap-action');expect(onSubmit).not.toHaveBeenCalled();
 type(tree,'5');press(tree,'swap-action');expect(onSubmit).toHaveBeenCalledWith('bridge');
 const blocked=jest.fn();tree=mount({defaultFrom:eth,defaultTo:baseUsdc,onSubmit:blocked,submitting:true});type(tree,'5');
 expect(action(tree).props.busy).toBe(true);press(tree,'swap-action');expect(blocked).not.toHaveBeenCalled();
});
it('flips the pair and keeps the entry',()=>{
 const onFromChange=jest.fn(),onToChange=jest.fn();const tree=mount({defaultFrom:eth,defaultTo:usdc,onFromChange,onToChange});type(tree,'20');
 press(tree,'swap-flip');expect(onFromChange).toHaveBeenLastCalledWith(usdc);expect(onToChange).toHaveBeenLastCalledWith(eth);
 expect(amount(tree)).toBe('$20');expect(conversion(tree)).toBe('20 USDC');expect(conversion(tree,'to')).toBe('0.01 ETH');
});
it('Max enters the balance and Test a small trial amount, in the active denomination',()=>{
 const onAmountChange=jest.fn();const tree=mount({defaultFrom:eth,defaultTo:usdc,onAmountChange});
 press(tree,'swap-max');expect(amount(tree)).toBe('$1000');expect(onAmountChange).toHaveBeenLastCalledWith('0.5');expect(actionText(tree)).toBe('Swap');
 press(tree,'swap-test');expect(amount(tree)).toBe('$1');expect(onAmountChange).toHaveBeenLastCalledWith('0.0005');
 press(tree,'swap-mode-from');press(tree,'swap-max');expect(amount(tree)).toBe('0.5');
 expect(shared.testAmount(usdc)).toBe(1);expect(shared.testAmount(baseUsdc)).toBe(0);expect(shared.unitsToEntry(0.004220,'usd',2369.99)).toBe('10');
});
it('switching the denomination converts the entry and keeps its value',()=>{
 const onAmountChange=jest.fn();const onDenominationChange=jest.fn();const tree=mount({defaultFrom:eth,defaultTo:usdc,onAmountChange,onDenominationChange});
 type(tree,'50');press(tree,'swap-mode-from');
 expect(amount(tree)).toBe('0.025');expect(conversion(tree)).toBe('$50.00');expect(onAmountChange).toHaveBeenLastCalledWith('0.025');
 press(tree,'swap-mode-to');expect(amount(tree,'to')).toBe('50');
 // The settings default switches both sides at once.
 press(tree,'swap-settings-button');const control=tree.findAll(n=>n.props.onValueChange&&n.props.options?.some?.(option=>option.value==='token'))[0];
 act(()=>control.props.onValueChange('token'));expect(onDenominationChange).toHaveBeenLastCalledWith('token');press(tree,'swap-back');expect(amount(tree)).toBe('0.025');
 press(tree,'swap-settings-button');act(()=>tree.findAll(n=>n.props.onValueChange&&n.props.options?.some?.(option=>option.value==='token'))[0].props.onValueChange('usd'));
 expect(onDenominationChange).toHaveBeenLastCalledWith('usd');press(tree,'swap-back');expect(amount(tree)).toBe('$50');expect(amount(tree,'to')).toBe('$50');
});
it('shows the host quote when it arrives and an estimate until then',()=>{
 let tree=mount({defaultFrom:eth,defaultTo:usdc});type(tree,'40');expect(amount(tree,'to')).toBe('$40');
 tree=mount({defaultFrom:eth,defaultTo:usdc,received:39.5,fee:0.27,slippage:0.01});type(tree,'40');expect(amount(tree,'to')).toBe('$39.5');
 expect(name(tree,'swap-slippage')).toBe('Slippage 1%');expect(read(tree,'swap-fee')).toBe('Fee $0.27');
});
it('pushes slippage and fees from settings, pops back to it, and reports a preset or custom slippage',()=>{
 const onSlippageChange=jest.fn();const tree=mount({defaultFrom:eth,defaultTo:usdc,onSlippageChange,fee:0.27,fees:[{label:'Network',usd:0.19},{label:'Relayer',usd:0.08}]});
 press(tree,'swap-slippage');
 const presets=tree.findAll(n=>n.props.onValueChange&&n.props.options?.some?.(option=>option.label==='0.1%'))[0];expect(presets.props.value).toBe('0.005');
 act(()=>presets.props.onValueChange('0.01'));expect(onSlippageChange).toHaveBeenLastCalledWith(0.01);
 const custom=tree.findAll(n=>n.props.keyboardType==='decimal-pad'&&n.props.onChangeText)[0];act(()=>custom.props.onChangeText('2.5'));expect(onSlippageChange).toHaveBeenLastCalledWith(0.025);
 act(()=>custom.props.onChangeText('80'));expect(onSlippageChange).toHaveBeenCalledTimes(2);
 expect(name(tree,'swap-back')).toBe('Back');press(tree,'swap-back');expect(has(tree,'swap-view-settings')).toBe(true);
 expect(node(tree,'swap-setting-fees').props.accessibilityLabel).toBe('Fees: $0.27');press(tree,'swap-setting-fees');
 const text=tree.findAll(n=>typeof n.type==='string'&&n.type==='Text').map(n=>[].concat(n.props.children).join(''));
 for(const expected of ['Network','$0.19','Relayer','$0.08','Total','$0.27'])expect(text).toContain(expected);
});
it('reset clears the entry, both tokens and the receive view',()=>{
 const onReset=jest.fn(),onFromChange=jest.fn(),onToChange=jest.fn();const tree=mount({defaultFrom:eth,defaultTo:usdc,onReset,onFromChange,onToChange});
 type(tree,'7');expect(node(tree,'swap-reset').props.disabled).toBe(false);press(tree,'swap-reset');
 expect(amount(tree)).toBe('$0');expect(onFromChange).toHaveBeenLastCalledWith(null);expect(onToChange).toHaveBeenLastCalledWith(null);expect(onReset).toHaveBeenCalledTimes(1);
 expect(actionText(tree)).toBe('Select a token');expect(node(tree,'swap-reset').props.disabled).toBe(true);
});
it('resyncs the entry when the host sets a different amount',()=>{
 const render=amount=>h(HIGProvider,null,h(SwapPanelBlock,{tokens,onSubmit:jest.fn(),defaultFrom:eth,defaultTo:usdc,amount}));
 act(()=>{root=create(render(undefined));});const tree=root.root;type(tree,'30');expect(amount(tree)).toBe('$30');
 act(()=>root.update(render('0')));expect(amount(tree)).toBe('$0');
 act(()=>root.update(render('0.25')));expect(amount(tree)).toBe('$500');
});
it('receive view: QR and address replace the amount, the keypad and To amount go, and copying is announced',async()=>{
 jest.useFakeTimers();
 const address='0x71C7656EC7ab88b098defB751B7401B5f6d8976F',onCopy=jest.fn(),onConnect=jest.fn(),onReceivingChange=jest.fn();
 const tree=mount({wallet:{connected:false},onConnect,receive:{address,qr:h(View,{testID:'qr'}),onCopy},onReceivingChange});
 press(tree,'swap-slot-from');
 // Generate address is a switch in the From picker. Turning it on does not leave the picker: the user still picks a chain and an asset there.
 const toggle=tree.findAll(n=>n.props.testID==='picker-generate'&&n.props.onPress)[0];expect(toggle.props.accessibilityRole).toBe('switch');expect(toggle.props.accessibilityLabel).toBe('Generate address');expect(toggle.props.accessibilityState.checked).toBe(false);
 act(()=>toggle.props.onPress(event));
 expect(onReceivingChange).toHaveBeenCalledWith(true);expect(has(tree,'swap-picker-from')).toBe(true);press(tree,'swap-back');
 expect(node(tree,'swap-receive').props.accessibilityLabel).toBe(`Copy address: ${address}`);expect(has(tree,'qr')).toBe(true);
 expect(has(tree,'swap-amount-from')).toBe(false);expect(has(tree,'swap-amount-to')).toBe(false);expect(has(tree,'swap-keypad')).toBe(false);
 expect(actionText(tree)).toBe('Send from your wallet');expect(action(tree).props.disabled).toBe(false);press(tree,'swap-action');expect(onConnect).toHaveBeenCalledTimes(1);
 await act(async()=>{node(tree,'swap-receive').props.onPress(event);await Promise.resolve();await Promise.resolve();});
 expect(onCopy).toHaveBeenCalledTimes(1);
 const copied=()=>tree.findAll(n=>typeof n.type==='string'&&n.type==='Text'&&[].concat(n.props.children).join('')==='Address copied').length;
 expect(copied()).toBeGreaterThan(0);act(()=>{jest.advanceTimersByTime(4000);});expect(copied()).toBe(0);
 const data=require('../../packages/hig/native/src/data');const rows=data.addressRows(address);expect(rows).toHaveLength(7);expect(rows[0].every(cell=>cell.anchor)).toBe(true);expect(rows[1].some(cell=>cell.anchor)).toBe(false);expect(rows[6].map(cell=>cell.anchor)).toEqual([false,false,true,true,true,true]);
 expect(data.addressRows('So11111111111111111111111111111111111111112')[0]).toHaveLength(4);
 // The receive view draws the shared VerticalAddress, one implementation for every address column.
 expect(tree.findAllByType(data.VerticalAddress)).toHaveLength(1);
});
it('wallet row and recipient field appear in the pickers when the host supplies them',()=>{
 const onDisconnect=jest.fn(),onRecipientChange=jest.fn(),onScanRecipient=jest.fn();
 const tree=mount({wallet:{connected:true,address:'0x71C7656EC7ab88b098defB751B7401B5f6d8976F'},onDisconnect,onRecipientChange,onScanRecipient,fromTokens:[eth]});
 press(tree,'swap-slot-from');expect(node(tree,'swap-list-from').props.data).toEqual([eth]);
 act(()=>tree.findAll(n=>n.props.accessibilityLabel==='Disconnect wallet'&&n.props.onPress)[0].props.onPress(event));expect(onDisconnect).toHaveBeenCalledTimes(1);
 press(tree,'swap-back');press(tree,'swap-slot-to');
 const field=tree.findAll(n=>n.props.accessibilityLabel==='Recipient address'&&n.props.onChangeText)[0];expect(field.props.placeholder).toBe('0x71C7…976F');act(()=>field.props.onChangeText('0xabc'));expect(onRecipientChange).toHaveBeenCalledWith('0xabc');
 act(()=>tree.findAll(n=>n.props.accessibilityLabel==='Scan QR code'&&n.props.onPress)[0].props.onPress(event));expect(onScanRecipient).toHaveBeenCalledTimes(1);
});
it('uses the provider translations and keeps helper behaviour in step with web',()=>{
 act(()=>{root=create(h(HIGProvider,{messages:{swapFrom:'De',swapChooseToken:'Choisir un jeton',swapSelectToken:side=>`Choisir le jeton ${side}`}},h(SwapPanelBlock,{tokens,onSubmit:jest.fn()})));});
 expect(node(root.root,'swap-slot-from').props.accessibilityLabel).toBe('Choisir le jeton De');expect(actionText(root.root)).toBe('Choisir un jeton');
 expect(shared.sanitizeAmount('00012.5.6abc')).toBe('12.56');expect(shared.sanitizeAmount('.')).toBe('0');
 expect(shared.applyAmountKey('1.25','3','usd')).toBe('1.25');expect(shared.applyAmountKey('1.25','3','token')).toBe('1.253');expect(shared.applyAmountKey('7','back','usd')).toBe('0');
 expect(shared.fuzzyMatch('usdbase','USD Coin USDC Base')).toBe(true);expect(shared.fuzzyMatch('xyz','USD Coin')).toBe(false);
 expect(shared.formatPercent(0.005)).toBe('0.5%');expect(shared.shortAddress('0x71C7656EC7ab88b098defB751B7401B5f6d8976F')).toBe('0x71C7…976F');expect(shared.trimNumber(0.1+0.2)).toBe('0.3');
});
it('shows exactly one view inside its own bounds, with Back and no dialog or close control',()=>{
 const onViewChange=jest.fn();const tree=mount({defaultFrom:eth,defaultTo:usdc,onViewChange,onSlippageChange:jest.fn()});
 const views=()=>['swap-view-main','swap-picker-from','swap-picker-to','swap-view-settings','swap-view-slippage','swap-view-fees'].filter(id=>has(tree,id));
 expect(views()).toEqual(['swap-view-main']);expect(has(tree,'swap-back')).toBe(false);
 press(tree,'swap-slot-to');expect(views()).toEqual(['swap-picker-to']);expect(onViewChange).toHaveBeenLastCalledWith('to');
 expect(tree.findAllByType(Modal)).toHaveLength(0);expect(tree.findAll(n=>n.props.accessibilityLabel==='Close')).toHaveLength(0);
 press(tree,'swap-back');expect(views()).toEqual(['swap-view-main']);expect(onViewChange).toHaveBeenLastCalledWith('main');
 press(tree,'swap-area-from');expect(views()).toEqual(['swap-picker-from']);press(tree,'swap-token-1-usdc');expect(views()).toEqual(['swap-view-main']);
 press(tree,'swap-slippage');expect(views()).toEqual(['swap-view-slippage']);press(tree,'swap-back');expect(views()).toEqual(['swap-view-settings']);
 press(tree,'swap-setting-fees');expect(views()).toEqual(['swap-view-fees']);press(tree,'swap-back');press(tree,'swap-back');expect(views()).toEqual(['swap-view-main']);
});
it('follows a controlled view and only reports the view it wants',()=>{
 const onViewChange=jest.fn();const render=view=>h(HIGProvider,{reducedMotion:true},h(SwapPanelBlock,{tokens,onSubmit:jest.fn(),view,onViewChange}));
 act(()=>{root=create(render('main'));});const tree=root.root;
 press(tree,'swap-slot-from');expect(onViewChange).toHaveBeenCalledWith('from');expect(has(tree,'swap-view-main')).toBe(true);
 act(()=>root.update(render('from')));expect(has(tree,'swap-picker-from')).toBe(true);
 press(tree,'swap-token-1-eth');expect(onViewChange).toHaveBeenLastCalledWith('main');expect(has(tree,'swap-picker-from')).toBe(true);
 act(()=>root.update(render('fees')));expect(has(tree,'swap-view-fees')).toBe(true);press(tree,'swap-back');expect(onViewChange).toHaveBeenLastCalledWith('settings');
});
it('Android back pops a pushed view and is not intercepted on the main view',()=>{
 const handlers=[];const remove=jest.fn();jest.spyOn(BackHandler,'addEventListener').mockImplementation((type,handler)=>{handlers.push(handler);return {remove};});
 const tree=mount({onSlippageChange:jest.fn()});expect(handlers).toHaveLength(0);
 press(tree,'swap-settings-button');expect(handlers).toHaveLength(1);press(tree,'swap-setting-slippage');expect(handlers).toHaveLength(1);
 let handled;act(()=>{handled=handlers[0]();});expect(handled).toBe(true);expect(has(tree,'swap-view-settings')).toBe(true);
 act(()=>{handlers[0]();});expect(has(tree,'swap-view-main')).toBe(true);expect(remove).toHaveBeenCalledTimes(1);
});
it('slides a pushed view in from the trailing side and a popped one from the leading side, and not at all with reduced motion',()=>{
 const timing=jest.spyOn(Animated,'timing').mockImplementation(()=>({start:jest.fn(),stop:jest.fn()}));
 const offset=tree=>{const stage=tree.findAll(n=>n.props.testID==='swap-stage'&&typeof n.type!=='string')[0];const inner=root.toJSON();void stage;const find=node=>{if(!node||typeof node==='string')return null;if(node.props?.testID==='swap-stage')return node.children[0];for(const child of node.children??[]){const hit=find(child);if(hit)return hit;}return null;};return StyleSheet.flatten(find(inner).props.style);};
 const render=direction=>h(HIGProvider,{reducedMotion:false,direction},h(SwapPanelBlock,{tokens,onSubmit:jest.fn()}));
 act(()=>{root=create(render('ltr'));});let tree=root.root;expect(timing).not.toHaveBeenCalled();
 press(tree,'swap-settings-button');expect(timing).toHaveBeenCalledTimes(1);expect(timing.mock.calls[0][1]).toMatchObject({toValue:1,duration:260});
 // The mocked animation never advances, so the view rests at its starting offset: trailing side for a push.
 expect(offset(tree).transform[0].translateX).toBe(48);expect(offset(tree).opacity).toBe(0);
 press(tree,'swap-back');expect(timing).toHaveBeenCalledTimes(2);expect(offset(tree).transform[0].translateX).toBe(-48);
 act(()=>root.unmount());act(()=>{root=create(render('rtl'));});tree=root.root;press(tree,'swap-settings-button');expect(offset(tree).transform[0].translateX).toBe(-48);
 timing.mockClear();tree=mount({});press(tree,'swap-settings-button');expect(timing).not.toHaveBeenCalled();expect(offset(tree).opacity).toBe(1);
});
it('SwapSheet presents the panel in the gesture sheet, pushes views inside it, and pops before it closes',()=>{
 const backend=require('@gorhom/bottom-sheet');const onOpenChange=jest.fn();
 // Like the platform, the most recently registered live handler runs first.
 const handlers=[];jest.spyOn(BackHandler,'addEventListener').mockImplementation((type,handler)=>{handlers.push(handler);return {remove:()=>{handlers.splice(handlers.indexOf(handler),1);}};});const back=()=>handlers[handlers.length-1]();
 const render=open=>h(HIGProvider,{reducedMotion:true},h(SwapSheet,{open,onOpenChange,title:'Swap',tokens,onSubmit:jest.fn(),onSlippageChange:jest.fn()}));
 act(()=>{root=create(render(true));});const tree=root.root;const sheet=()=>tree.findAll(n=>n.props.testID==='backend')[0];
 expect(backend.methods.present).toHaveBeenCalledTimes(1);expect(sheet().props.accessibilityLabel).toBe('Swap');expect(sheet().props.enableDynamicSizing).toBe(true);
 expect(tree.findAllByType(Modal)).toHaveLength(0);expect(has(tree,'swap-view-main')).toBe(true);
 press(tree,'swap-slot-to');expect(has(tree,'swap-picker-to')).toBe(true);expect(has(tree,'backend')||sheet()).toBeTruthy();
 // The token list is the sheet backend's list, so a drag at its edge moves the sheet.
 expect(tree.findAll(n=>n.props.sheetList===true&&n.props.testID==='swap-list-to').length).toBeGreaterThan(0);
 // A dismiss gesture or Android back pops the pushed view first.
 act(()=>{sheet().props.onChange(-1,0,0);});expect(onOpenChange).not.toHaveBeenCalled();expect(has(tree,'swap-view-main')).toBe(true);
 press(tree,'swap-settings-button');press(tree,'swap-setting-slippage');
 act(()=>{back();});expect(has(tree,'swap-view-settings')).toBe(true);act(()=>{back();});expect(has(tree,'swap-view-main')).toBe(true);expect(onOpenChange).not.toHaveBeenCalled();
 act(()=>{back();});expect(onOpenChange).toHaveBeenCalledWith(false);
 // Closing returns to the main form for the next open.
 press(tree,'swap-settings-button');expect(has(tree,'swap-view-settings')).toBe(true);
 act(()=>root.update(render(false)));act(()=>root.update(render(true)));expect(has(tree,'swap-view-main')).toBe(true);
});
it('keeps the sheet backend and Dialog out of the block: only swap-sheet imports them',()=>{
 const {readFileSync}=require('fs');
 for(const file of ['swap-block.tsx','swap-views.tsx','swap-parts.tsx','swap-shared.ts','blocks.tsx']){const source=readFileSync(`packages/hig/native/src/${file}`,'utf8');expect(source).not.toMatch(/gesture-sheet|bottom-sheet|swap-sheet/);if(file!=='blocks.tsx')expect(source).not.toMatch(/overlay\.js/);}
 expect(readFileSync('packages/hig/native/src/swap-sheet.tsx','utf8')).toContain("from './gesture-sheet.js'");
});
it('one-way mode shows a down arrow between the cards and offers no flip',()=>{
 const onFromChange=jest.fn();const tree=mount({from:eth,to:usdc,onFromChange,oneWay:true});
 expect(tree.findAll(n=>n.props.testID==='swap-flip')).toHaveLength(0);
 const mark=tree.findAll(n=>n.props.testID==='swap-one-way'&&typeof n.type==='string')[0];
 expect(mark).toBeTruthy();expect(mark.props.onPress).toBeUndefined();expect(onFromChange).not.toHaveBeenCalled();
});
it('fixes the denomination when the switch is turned off: no conversion capsules and no setting',()=>{
 const tree=mount({from:eth,to:usdc,denominationSwitch:false});
 expect(tree.findAll(n=>n.props.testID==='swap-mode-from'||n.props.testID==='swap-mode-to')).toHaveLength(0);
 press(tree,'swap-settings-button');
 expect(tree.findAll(n=>n.props.accessibilityLabel==='Units'||n.props.accessibilityLabel==='Dollars')).toHaveLength(0);
});
const texts=tree=>tree.findAll(n=>n.type==='Text'&&typeof n.props.children==='string').map(n=>n.props.children);
const exists=(tree,id)=>tree.findAll(n=>n.props.testID===id).length>0;
it('amount seeds the entry on first render, in the default denomination',()=>{
 let tree=mount({defaultFrom:{...eth,balance:5},defaultTo:usdc,amount:'0.5'});
 expect(node(tree,'swap-amount-from').props.accessibilityValue.text).toBe('$1000');expect(node(tree,'swap-action').props.disabled).toBeFalsy();
 tree=mount({defaultFrom:{...eth,balance:5},defaultTo:usdc,amount:'0.5',denomination:'token'});
 expect(node(tree,'swap-amount-from').props.accessibilityValue.text).toBe('0.5');expect(node(tree,'swap-action').props.disabled).toBeFalsy();
});
it('a fixed destination is a compact, non-interactive To card and makes the panel one-way',()=>{
 const address='0x71C7656EC7ab88b098defB751B7401B5f6d8976F';
 const tree=mount({defaultFrom:eth,destination:{title:'Savings wallet',subtitle:'Ethereum',address,detail:'Arrives in about 2 min'},fee:0.27});
 const card=node(tree,'swap-destination');expect(card.props.onPress).toBeUndefined();expect(card.props.accessibilityRole).toBeUndefined();
 const copy=texts(card);
 for(const text of ['Savings wallet','Ethereum','0x71C7…976F','Arrives in about 2 min'])expect(copy).toContain(text);expect(read(tree,'swap-destination-fee')).toBe('Fee $0.27');
 // No To token card: no amount, capsule or picker target for that side.
 for(const id of ['swap-card-to','swap-amount-to','swap-mode-to','swap-slot-to','swap-area-to','swap-flip'])expect(exists(tree,id)).toBe(false);
 expect(exists(tree,'swap-one-way')).toBe(true);
 // Without a fee prop there is no fee line.
 expect(exists(mount({defaultFrom:eth,destination:{title:'Savings wallet'}}),'swap-destination-fee')).toBe(false);
});
it('a destination with onPress is one button named by its title',()=>{
 const onPress=jest.fn();const tree=mount({defaultFrom:eth,destination:{title:'Lido staking',onPress}});
 const card=node(tree,'swap-destination');expect(card.props.accessibilityRole).toBe('button');expect(card.props.accessibilityLabel).toBe('Lido staking');
 press(tree,'swap-destination');expect(onPress).toHaveBeenCalledTimes(1);
});
it('a destination is ready with only the From side, names itself with actionLabel, and submits send',()=>{
 const onSubmit=jest.fn();
 let tree=mount({destination:{title:'Lido staking'},actionLabel:'Stake',onSubmit});
 expect(actionText(tree)).toBe('Select a token');
 tree=mount({defaultFrom:{...eth,balance:5},destination:{title:'Lido staking'},actionLabel:'Stake',onSubmit});
 expect(actionText(tree)).toBe('Enter an amount');expect(node(tree,'swap-action').props.disabled).toBe(true);
 tree=mount({defaultFrom:{...eth,balance:5},destination:{title:'Lido staking'},actionLabel:'Stake',amount:'0.5',onSubmit});
 expect(actionText(tree)).toBe('Stake');press(tree,'swap-action');expect(onSubmit).toHaveBeenCalledWith('send');
 // Over the balance, the reason still wins over the custom label.
 tree=mount({defaultFrom:eth,destination:{title:'Lido staking'},actionLabel:'Stake',amount:'2',onSubmit});
 expect(actionText(tree)).toBe('Insufficient ETH');
 // actionLabel also replaces Swap for a token pair.
 expect(actionText(mount({defaultFrom:{...eth,balance:5},defaultTo:usdc,amount:'0.5',actionLabel:'Withdraw'}))).toBe('Withdraw');
});
it('locked sides offer no picker, keep their token on reset and count as untouched',()=>{
 const onFromChange=jest.fn(),onToChange=jest.fn();
 let tree=mount({defaultFrom:{...eth,balance:5},defaultTo:usdc,lockFrom:true,lockTo:true,onFromChange,onToChange});
 for(const id of ['swap-slot-from','swap-area-from','swap-slot-to','swap-area-to'])expect(exists(tree,id)).toBe(false);
 expect(texts(tree)).toContain('Ether');expect(node(tree,'swap-reset').props.disabled).toBe(true);
 // Capsules still work on a locked side.
 press(tree,'swap-max');expect(node(tree,'swap-reset').props.disabled).toBeFalsy();
 press(tree,'swap-reset');expect(onFromChange).not.toHaveBeenCalled();expect(onToChange).not.toHaveBeenCalled();
 expect(texts(tree)).toContain('Ether');expect(node(tree,'swap-amount-from').props.accessibilityValue.text).toBe('$0');
 // Only the unlocked side clears.
 tree=mount({defaultFrom:{...eth,balance:5},defaultTo:usdc,lockFrom:true,onFromChange,onToChange});
 expect(exists(tree,'swap-slot-to')).toBe(true);press(tree,'swap-reset');expect(onToChange).toHaveBeenCalledWith(null);expect(onFromChange).not.toHaveBeenCalled();
});
it('an account (a token with a caption) reads name over caption beside one disc and offers Max only',()=>{
 const account={id:'acct',symbol:'USDC',name:'USDC on Hyperliquid',chain:'Hyperliquid',chainId:999,balance:234.68,price:1,caption:'$234.68 available'};
 let tree=mount({defaultFrom:account,wallet:{connected:true,address:'0x71C7656EC7ab88b098defB751B7401B5f6d8976F'}});
 const copy=texts(node(tree,'swap-card-from'));
 expect(copy).toContain('USDC on Hyperliquid');expect(copy).toContain('$234.68 available');
 // No chain line, wallet address, balance line or Test capsule; Max enters the balance.
 for(const text of ['Hyperliquid','0x71C7…976F','234.68 USDC'])expect(copy).not.toContain(text);
 expect(exists(tree,'swap-test')).toBe(false);expect(exists(tree,'swap-max')).toBe(true);press(tree,'swap-max');expect(amount(tree)).toBe('$234.68');
 // Selectable: a chevron follows the name. Locked: none. No balance: no Max.
 expect(exists(tree,'swap-account-chevron-from')).toBe(true);
 tree=mount({defaultFrom:{...account,balance:0},lockFrom:true});
 expect(exists(tree,'swap-account-chevron-from')).toBe(false);expect(exists(tree,'swap-max')).toBe(false);expect(exists(tree,'swap-slot-from')).toBe(false);
 // On the To side an account never offers Max.
 expect(exists(mount({defaultTo:account}),'swap-max')).toBe(false);
});
it('a pending destination is a placeholder that keeps the action asking for a destination',()=>{
 const onSubmit=jest.fn();const onPress=jest.fn();
 let tree=mount({destination:{title:'To',subtitle:'Pick a destination',pending:true,onPress},onSubmit});
 expect(actionText(tree)).toBe('Select a token');
 tree=mount({defaultFrom:{...eth,balance:5},amount:'0.5',destination:{title:'To',subtitle:'Pick a destination',pending:true,onPress},onSubmit});
 expect(actionText(tree)).toBe('Pick a destination');expect(action(tree).props.disabled).toBe(true);
 expect(flat(node(tree,'swap-destination-title')).fontWeight).toBe('500');expect(exists(tree,'swap-destination-chevron')).toBe(true);
 act(()=>{action(tree).props.onPress(event);});expect(onSubmit).not.toHaveBeenCalled();
 press(tree,'swap-destination');expect(onPress).toHaveBeenCalledTimes(1);
 // Chosen: the title is strong again, the title leads the subtitle and address, and the action is ready.
 tree=mount({defaultFrom:{...eth,balance:5},amount:'0.5',destination:{title:'Savings wallet',subtitle:'Ethereum',address:'0x71C7656EC7ab88b098defB751B7401B5f6d8976F'},onSubmit});
 expect(flat(node(tree,'swap-destination-title')).fontWeight).toBe('600');expect(exists(tree,'swap-destination-chevron')).toBe(false);
 const order=texts(node(tree,'swap-destination'));expect(order.indexOf('Savings wallet')).toBeLessThan(order.indexOf('Ethereum'));expect(order.indexOf('Ethereum')).toBeLessThan(order.indexOf('0x71C7…976F'));
 expect(actionText(tree)).toBe('Send');
});
it('details are the bottom card on their own (one-way, ready from the From side, submits send) or rows under a destination',()=>{
 const onSubmit=jest.fn();const details=[{label:'Staked',value:'11.0735 HYPE'},{label:'Fee tier',value:'Wood'}];
 let tree=mount({defaultFrom:{...eth,balance:5},amount:'0.5',details,actionLabel:'Stake',onSubmit});
 expect(exists(tree,'swap-card-to')).toBe(false);expect(exists(tree,'swap-one-way')).toBe(true);expect(exists(tree,'swap-destination-title')).toBe(false);
 const rows=texts(node(tree,'swap-details'));for(const text of ['Staked','11.0735 HYPE','Fee tier','Wood'])expect(rows).toContain(text);
 expect(actionText(tree)).toBe('Stake');press(tree,'swap-action');expect(onSubmit).toHaveBeenCalledWith('send');
 // Under a destination the rows share its card.
 tree=mount({defaultFrom:eth,destination:{title:'Ether staking'},details});
 expect(texts(node(tree,'swap-destination'))).toEqual(expect.arrayContaining(['Ether staking','Staked','Wood']));expect(flat(node(tree,'swap-details')).paddingTop).toBe(0);
 // With a To token the pair still drives the panel and the rows are not shown.
 tree=mount({defaultFrom:eth,defaultTo:usdc,details});expect(exists(tree,'swap-card-to')).toBe(true);expect(exists(tree,'swap-details')).toBe(false);expect(exists(tree,'swap-flip')).toBe(true);
});
it('shows a note under the cards: plain when muted, a tinted capsule for warning and negative',()=>{
 let tree=mount({note:'The minimum withdrawal is $10.00.'});
 expect(texts(node(tree,'swap-note'))).toContain('The minimum withdrawal is $10.00.');expect(flat(node(tree,'swap-note')).backgroundColor).toBeUndefined();
 expect(flat(node(tree,'swap-note').findAll(n=>n.type==='Text')[0]).color).toBe(colors.muted);
 tree=mount({note:'Transfer to spot afterwards.',noteTone:'negative'});
 expect(flat(node(tree,'swap-note'))).toMatchObject({borderRadius:16,paddingVertical:12,paddingHorizontal:16,backgroundColor:`${colors.negative}1a`});
 expect(flat(node(tree,'swap-note').findAll(n=>n.type==='Text')[0]).color).toBe(colors.negative);
 tree=mount({note:'Rates change.',noteTone:'warning'});expect(flat(node(tree,'swap-note')).backgroundColor).toBe(`${colors.warning}1a`);
 expect(exists(mount({}),'swap-note')).toBe(false);
});
it('a title heads the main view, with Back only when the host can go back',()=>{
 const onBack=jest.fn();let tree=mount({title:'Withdraw from Papertrade',onBack});
 expect(texts(node(tree,'swap-header'))).toContain('Withdraw from Papertrade');expect(name(tree,'swap-back')).toBe('Back');
 press(tree,'swap-back');expect(onBack).toHaveBeenCalledTimes(1);
 tree=mount({title:'Deposit'});expect(exists(tree,'swap-header')).toBe(true);expect(exists(tree,'swap-back')).toBe(false);
 expect(exists(mount({}),'swap-header')).toBe(false);
});
it('controls={false} leaves the action on its own, and actionIcon rides before its text',()=>{
 let tree=mount({controls:false});
 expect(exists(tree,'swap-settings-button')).toBe(false);expect(exists(tree,'swap-reset')).toBe(false);expect(exists(tree,'swap-action')).toBe(true);
 tree=mount({defaultFrom:{...eth,balance:5},defaultTo:usdc,amount:'0.5',actionLabel:'Stake (2 signatures)',actionIcon:h(View,{testID:'bank'})});
 expect(exists(tree,'swap-action-icon')).toBe(true);expect(exists(tree,'bank')).toBe(true);
 const children=[].concat(action(tree).props.children);expect(children[children.length-1]).toBe('Stake (2 signatures)');
 // The icon is decoration: it adds nothing to the busy name.
 tree=mount({defaultFrom:{...eth,balance:5},defaultTo:usdc,amount:'0.5',actionLabel:'Stake',actionIcon:h(View,{testID:'bank'}),submitting:true});
 expect(action(tree).props.busy).toBe(true);expect(name(tree,'swap-action')).toMatch(/^Stake/);
});
it('lets the host hold the action with its own reason, after the panel\'s own checks',()=>{
 let tree=mount({defaultFrom:usdc,destination:{title:'Papertrade'},denomination:'token',actionLabel:'Deposit',actionDisabled:true,actionStatus:'Below minimum'});
 // The panel's own reason comes first.
 expect(actionText(tree)).toBe('Enter an amount');
 type(tree,'5');expect(actionText(tree)).toBe('Below minimum');expect(action(tree).props.disabled).toBe(true);
 // Without a status the held action keeps its ready name.
 tree=mount({defaultFrom:usdc,destination:{title:'Papertrade'},denomination:'token',amount:'5',actionLabel:'Deposit',actionDisabled:true});
 expect(actionText(tree)).toBe('Deposit');expect(action(tree).props.disabled).toBe(true);
 tree=mount({defaultFrom:usdc,destination:{title:'Burn'},amount:'5',actionLabel:'Burn',actionIntent:'destructive'});
 expect(action(tree).props.intent).toBe('destructive');expect(action(tree).props.disabled).toBe(false);
});
it('caps typed decimals per token and refuses keys past the balance when asked',()=>{
 expect(shared.applyAmountKey('1.123456','7','token',6)).toBe('1.123456');expect(shared.applyAmountKey('1.123456','7','token')).toBe('1.1234567');expect(shared.applyAmountKey('1.12','3','usd',6)).toBe('1.12');
 let tree=mount({defaultFrom:{...usdc,decimals:2},destination:{title:'Papertrade'},denomination:'token'});
 type(tree,'1.234');expect(amount(tree)).toBe('1.23');
 // 100 USDC held: a third digit would read 100x, so it is refused; delete still works.
 tree=mount({defaultFrom:usdc,destination:{title:'Papertrade'},denomination:'token',limitToBalance:true});
 type(tree,'1000');expect(amount(tree)).toBe('100');type(tree,'<');expect(amount(tree)).toBe('10');
 // Without the cap the entry runs past the balance and the action says so.
 tree=mount({defaultFrom:usdc,destination:{title:'Papertrade'},denomination:'token'});
 type(tree,'1000');expect(amount(tree)).toBe('1000');expect(actionText(tree)).toBe('Insufficient USDC');
});
it('draws host artwork elements in place of image URLs, and host content above the cards and under the action',()=>{
 const tree=mount({defaultFrom:{...usdc,caption:'$100 available',icon:h(View,{testID:'usdc-art'})},destination:{title:'Papertrade',icon:h(View,{testID:'paper-art'})},banner:h(View,{testID:'pending'}),footer:h(View,{testID:'recent'})});
 expect(has(tree,'usdc-art')).toBe(true);expect(has(tree,'paper-art')).toBe(true);
 expect(has(node(tree,'swap-banner'),'pending')).toBe(true);expect(has(node(tree,'swap-footer'),'recent')).toBe(true);
});
// Number flow: every number that can change while the card is on screen is an AnimatedNumberReadout, so a new
// balance, quote, fee or slippage moves its digits instead of swapping the text.
it('balance, conversion, fee and slippage are live numbers that follow their props, and read as before',()=>{
 const base={from:eth,to:usdc,fee:0.27,slippage:0.01,amount:'0.01'};let tree=mount(base);
 expect(flows(tree,'swap-balance')).toHaveLength(1);expect(read(tree,'swap-balance')).toBe('0.5 ETH');
 expect(flows(tree,'swap-conversion-from')).toHaveLength(1);expect(flows(tree,'swap-conversion-to')).toHaveLength(1);
 expect(flows(tree,'swap-fee')).toHaveLength(1);expect(flows(tree,'swap-fee')[0].props.value).toBe(0.27);expect(read(tree,'swap-fee')).toBe('Fee $0.27');
 // The translated sentence is split around the number: its words stay text, and the whole sentence is the accessible name.
 expect(node(tree,'swap-fee').findAll(n=>n.type==='Text'&&n.props.children==='Fee ')).not.toHaveLength(0);
 expect(flows(tree,'swap-slippage')).toHaveLength(1);expect(flows(tree,'swap-slippage')[0].props).toMatchObject({value:1,formattedValue:'1',suffix:'%'});expect(name(tree,'swap-slippage')).toBe('Slippage 1%');
 const balance=flows(tree,'swap-balance')[0],fee=flows(tree,'swap-fee')[0];
 tree=update({...base,defaultFrom:undefined,from:{...eth,balance:0.75},to:usdc,fee:0.31,slippage:0.005});
 // Same readout instances, new values: the digits move in place.
 expect(flows(tree,'swap-balance')[0]).toBe(balance);expect(read(tree,'swap-balance')).toBe('0.75 ETH');
 expect(flows(tree,'swap-fee')[0].props.value).toBe(0.31);expect(read(tree,'swap-fee')).toBe('Fee $0.31');
 expect(flows(tree,'swap-slippage')[0].props.formattedValue).toBe('0.5');expect(name(tree,'swap-slippage')).toBe('Slippage 0.5%');
 expect(fee).toBeDefined();
});
it('a loading or unknown fee is plain text, not a number rolling from zero',()=>{
 let tree=mount({defaultFrom:eth,defaultTo:usdc,fee:0.27,quoteLoading:true});
 expect(flows(tree,'swap-fee')).toHaveLength(0);expect(read(tree,'swap-fee')).toBe('Fee …');
 tree=mount({defaultFrom:eth,defaultTo:usdc,fee:null});expect(flows(tree,'swap-fee')).toHaveLength(0);expect(read(tree,'swap-fee')).toBe('Fee —');
 tree=mount({defaultFrom:eth,destination:{title:'Savings wallet'},fee:0.27,quoteLoading:true});
 expect(flows(tree,'swap-destination-fee')).toHaveLength(0);expect(read(tree,'swap-destination-fee')).toBe('Fee …');
 tree=update({defaultFrom:eth,destination:{title:'Savings wallet'},fee:0.27});
 expect(flows(tree,'swap-destination-fee')).toHaveLength(1);expect(read(tree,'swap-destination-fee')).toBe('Fee $0.27');
});
it('a numeric detail row is a live number with its format and affixes; a text detail stays text',()=>{
 const details=staked=>[{label:'Staked',value:staked,options:{maximumFractionDigits:4},suffix:' HYPE'},{label:'Fee tier',value:'Wood'}];
 let tree=mount({defaultFrom:{...eth,balance:5},amount:'0.5',details:details(11.0735)});
 let live=flows(tree,'swap-details');expect(live).toHaveLength(1);expect(live[0].props).toMatchObject({value:11.0735,suffix:' HYPE'});
 const rows=()=>node(tree,'swap-details').findAll(n=>n.type==='Text').map(n=>[].concat(n.props.children).join(''));
 expect(rows()).toEqual(expect.arrayContaining(['Staked','11.0735 HYPE','Fee tier','Wood']));
 tree=update({defaultFrom:{...eth,balance:5},amount:'0.5',details:details(12.5)});
 expect(flows(tree,'swap-details')[0]).toBe(live[0]);expect(rows()).toContain('12.5 HYPE');expect(rows()).toContain('Wood');
});
it('settings show slippage, the fee total and each fee line as live numbers',()=>{
 const tree=mount({defaultFrom:eth,defaultTo:usdc,controls:true,fee:0.27,fees:[{label:'Network',usd:0.2},{label:'Provider',usd:0.07}],slippage:0.01,onSlippageChange:jest.fn()});
 press(tree,'swap-settings-button');
 expect(flows(tree,'swap-setting-slippage')[0].props).toMatchObject({value:1,suffix:'%'});expect(node(tree,'swap-setting-slippage').props.accessibilityLabel).toBe('Slippage: 1%');
 expect(flows(tree,'swap-setting-fees')[0].props.value).toBe(0.27);expect(node(tree,'swap-setting-fees').props.accessibilityLabel).toBe('Fees: $0.27');
 press(tree,'swap-setting-fees');
 expect(flows(tree,'swap-view-fees').map(flow=>flow.props.value)).toEqual([0.2,0.07,0.27]);expect(read(tree,'swap-fee-total')).toBe('$0.27');
});
it('an account caption and a destination detail can be live figures that update in place',()=>{
 const account=available=>({id:'acct',symbol:'USDC',name:'USDC on Hyperliquid',chain:'Hyperliquid',chainId:999,balance:available,price:1,caption:{value:available,options:{style:'currency',currency:'USD'},suffix:' available'}});
 const props=(available,minutes)=>({from:account(available),destination:{title:'Savings wallet',detail:{value:minutes,prefix:'About ',suffix:' min'}}});
 let tree=mount(props(234.68,2));
 const caption=flows(tree,'swap-caption');expect(caption).toHaveLength(1);expect(read(tree,'swap-caption')).toBe('$234.68 available');
 expect(flows(tree,'swap-destination-detail')).toHaveLength(1);expect(read(tree,'swap-destination-detail')).toBe('About 2 min');
 tree=update(props(250.1,3));
 expect(flows(tree,'swap-caption')[0]).toBe(caption[0]);expect(read(tree,'swap-caption')).toBe('$250.10 available');expect(read(tree,'swap-destination-detail')).toBe('About 3 min');
 // Text stays text.
 tree=mount({defaultFrom:{...account(5),caption:'$5.00 available'},destination:{title:'Savings wallet',detail:'Arrives soon'}});
 expect(flows(tree,'swap-caption')).toHaveLength(0);expect(flows(tree,'swap-destination-detail')).toHaveLength(0);
});


it('keeps the action named while submitting with the amount cleared: the burn busy with no amount',()=>{
 let tree=mount({defaultFrom:{...eth,balance:5},destination:{title:'Burn'},actionLabel:'Burn',actionIntent:'destructive',amount:'0',submitting:true});
 expect(actionText(tree)).toBe('Burn');expect(action(tree).props.busy).toBe(true);
 tree=mount({defaultFrom:{...eth,balance:5},destination:{title:'Burn'},actionLabel:'Burn',amount:'0',submitting:true,submittingLabel:'Burning…'});
 expect(actionText(tree)).toBe('Burning…');
 tree=mount({defaultFrom:{...eth,balance:5},destination:{title:'Burn'},actionLabel:'Burn',amount:'0',submittingLabel:'Burning…'});
 expect(actionText(tree)).toBe('Enter an amount');
});

it('keeps a held action status while submitting, and leaves the amount alone until the submit settles',()=>{
 let tree=mount({defaultFrom:{...eth,balance:5},destination:{title:'Burn'},actionLabel:'Burn',amount:'0',submitting:true,actionDisabled:true,actionStatus:'Signing…'});
 expect(actionText(tree)).toBe('Signing…');
 tree=mount({defaultFrom:{...eth,balance:5},destination:{title:'Burn'},actionLabel:'Burn',amount:'0',submitting:true,submittingLabel:'Burning…',actionDisabled:true,actionStatus:'Signing…'});
 expect(actionText(tree)).toBe('Burning…');
 const onAmountChange=jest.fn();
 tree=mount({defaultFrom:eth,defaultTo:usdc,onAmountChange,submitting:true});
 type(tree,'12');press(tree,'swap-max');
 expect(amount(tree)).toBe('$0');expect(onAmountChange).not.toHaveBeenCalled();
});

it('rejects a known zero balance and preserves exact token input',()=>{
 const submit=jest.fn(),change=jest.fn();
 let tree=mount({from:{...eth,balance:0},to:eth,amount:'1',denomination:'token',onSubmit:submit});
 press(tree,'swap-action');expect(submit).not.toHaveBeenCalled();expect(action(tree).props.disabled).toBe(true);
 tree=mount({from:{...eth,decimals:18},to:eth,denomination:'token',onAmountChange:change});
 type(tree,'0.000000001');expect(change).toHaveBeenLastCalledWith('0.000000001');expect(amount(tree)).toBe('0.000000001');
});
it('does not mutate the pair or denomination during submission',()=>{
 const changed=jest.fn();const tree=mount({from:eth,to:usdc,amount:'1',denomination:'token',submitting:true,onFromChange:changed});
 press(tree,'swap-flip');press(tree,'swap-slot-from');press(tree,'swap-mode-from');
 expect(changed).not.toHaveBeenCalled();expect(amount(tree)).toBe('1');expect(has(tree,'swap-keypad')).toBe(true);
});
