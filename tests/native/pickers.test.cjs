// FromPicker and ToPicker recipes: where assets come from and where they go. The host owns the wallet, the token data,
// the scanner and any generated address; the pickers own search, the chain filter and the list.
const React=require('react');
const {create,act}=require('react-test-renderer');
const {FlatList,TextInput}=require('react-native');
const {HIGProvider}=require('../../packages/hig/native/src/provider');
const {FromPicker,ToPicker}=require('../../packages/hig/native/src/recipes');
const pickers=require('../../packages/hig/native/src/pickers');
const {AnimatedNumberReadout}=require('../../packages/hig/native/src/animated-number');
const {SwapHostContext}=require('../../packages/hig/native/src/swap-parts');
const h=React.createElement;
const eth={id:'1-eth',symbol:'ETH',name:'Ether',chain:'Ethereum',chainId:1,balance:0.5,price:2000};
const usdc={id:'1-usdc',symbol:'USDC',name:'USD Coin',chain:'Ethereum',chainId:1,keywords:'0xa0b8'};
const baseUsdc={id:'8453-usdc',symbol:'USDC',name:'USD Coin',chain:'Base',chainId:8453};
const baseEth={id:'8453-eth',symbol:'ETH',name:'Ether',chain:'Base',chainId:8453};
const tokens=[eth,usdc,baseUsdc,baseEth];
const address='0x71C7656EC7ab88b098defB751B7401B5f6d8976F';
const event={stopPropagation(){},isDefaultPrevented:()=>false,preventDefault(){}};
let root;
function mount(element){if(root)act(()=>root.unmount());act(()=>{root=create(h(HIGProvider,{reducedMotion:true},element));});return root.root;}
afterEach(()=>{if(root)act(()=>root.unmount());root=null;});
const all=(tree,id)=>tree.findAll(node=>node.props.testID===id&&typeof node.type!=='string');
const node=(tree,id)=>{const hits=all(tree,id);if(!hits.length)throw new Error(`No ${id}`);return hits[0];};
const has=(tree,id)=>all(tree,id).length>0;
const name=(tree,id)=>all(tree,id).map(hit=>hit.props.accessibilityLabel).find(Boolean);
const press=(tree,id)=>act(()=>{node(tree,id).props.onPress(event);});
// A Text's children may be a string or several pieces; join the pieces so each Text reads as one string.
const texts=tree=>tree.findAll(n=>n.type==='Text').map(n=>[].concat(n.props.children).filter(piece=>typeof piece==='string').join('')).filter(Boolean);
const rows=(tree,side)=>node(tree,`swap-list-${side}`).props.data.map(token=>token.id);
const chain=(tree,label)=>tree.findAll(n=>n.props.accessibilityRole==='radio'&&n.props.accessibilityLabel===label&&typeof n.props.onPress==='function')[0];
// Composite and host layers both carry the role, so count distinct group names.
const groups=tree=>[...new Set(tree.findAll(n=>n.props.accessibilityRole==='radiogroup').map(n=>n.props.accessibilityLabel))];
const search=(tree,side)=>tree.findAll(n=>n.props.testID===`swap-search-${side}`&&n.props.onChangeText)[0];
it('exports both recipes from recipes and from their own module',()=>{
 expect(pickers.FromPicker).toBe(FromPicker);expect(pickers.ToPicker).toBe(ToPicker);
});
it('ToPicker on its own is the destination address field, with a scan button only when the host can scan',()=>{
 const onAddressChange=jest.fn(),onScan=jest.fn();
 let tree=mount(h(ToPicker,{address:'',onAddressChange,addressPlaceholder:'DMzeeN…Xb32'}));
 expect(node(tree,'to-picker').props.accessibilityLabel).toBe('To');
 const field=tree.findAll(n=>n.props.testID==='picker-address'&&n.props.onChangeText)[0];
 expect(field.props.accessibilityLabel).toBe('Recipient address');expect(field.props.placeholder).toBe('DMzeeN…Xb32');expect(field.props.autoCapitalize).toBe('none');expect(field.props.autoCorrect).toBe(false);
 act(()=>field.props.onChangeText('0xabc'));expect(onAddressChange).toHaveBeenCalledWith('0xabc');
 // Address only: no search, no chain filter, no list, no scan button.
 expect(has(tree,'picker-scan')).toBe(false);expect(has(tree,'swap-list-to')).toBe(false);expect(search(tree,'to')).toBeUndefined();expect(groups(tree)).toHaveLength(0);
 tree=mount(h(ToPicker,{address:address,onAddressChange,onScan}));
 expect(tree.findByType(TextInput).props.placeholder).toBe('Recipient address');expect(tree.findByType(TextInput).props.value).toBe(address);
 expect(name(tree,'picker-scan')).toBe('Scan QR code');press(tree,'picker-scan');expect(onScan).toHaveBeenCalledTimes(1);
 // Without an address handler there is no address row.
 tree=mount(h(ToPicker,{tokens,onSelect:jest.fn()}));expect(has(tree,'picker-address-row')).toBe(false);expect(has(tree,'swap-list-to')).toBe(true);
});
it('ToPicker with tokens lists them under the address, with the chain filter or without it',()=>{
 const onSelect=jest.fn();
 let tree=mount(h(ToPicker,{address:'',onAddressChange:jest.fn(),tokens,onSelect,selected:usdc,hotTokenIds:['8453-eth']}));
 expect(has(tree,'picker-address-row')).toBe(true);expect(search(tree,'to').props.placeholder).toBe('Search name or paste address');expect(search(tree,'to').props.accessibilityLabel).toBe('Search name or paste address');
 // Chains are derived from the tokens, in first-seen order, behind an All option.
 expect(groups(tree)).toEqual(['Chains']);expect(chain(tree,'All').props.accessibilityState.checked).toBe(true);expect(chain(tree,'Ethereum')).toBeTruthy();expect(chain(tree,'Base')).toBeTruthy();
 // Hot tokens lead the unfiltered list under their own heading; the selected row is marked and dimmed.
 expect(rows(tree,'to')).toEqual(['8453-eth','1-eth','1-usdc','8453-usdc']);expect(texts(tree)).toEqual(expect.arrayContaining(['Hot','All tokens']));
 expect(node(tree,'swap-token-1-usdc').props.accessibilityState).toEqual({selected:true});expect(texts(node(tree,'swap-token-1-usdc'))).toContain('Ethereum · Selected');
 act(()=>chain(tree,'Base').props.onPress(event));expect(rows(tree,'to')).toEqual(['8453-usdc','8453-eth']);expect(texts(tree)).not.toContain('Hot');
 act(()=>chain(tree,'All').props.onPress(event));
 act(()=>search(tree,'to').props.onChangeText('0xa0b8'));expect(rows(tree,'to')).toEqual(['1-usdc']);
 act(()=>search(tree,'to').props.onChangeText(''));press(tree,'swap-token-8453-eth');expect(onSelect).toHaveBeenCalledWith(baseEth);
 // Balance and its dollar value show on the trailing side when the host knows them.
 expect(texts(node(tree,'swap-token-1-eth'))).toEqual(expect.arrayContaining(['0.5','$1,000.00']));
 // Without the chain filter the same list has no radio group.
 tree=mount(h(ToPicker,{tokens,onSelect,chainFilter:false}));expect(groups(tree)).toHaveLength(0);expect(rows(tree,'to')).toEqual(['1-eth','1-usdc','8453-usdc','8453-eth']);
 // One chain needs no filter either, and explicit chains replace the derived ones.
 tree=mount(h(ToPicker,{tokens:[eth,usdc],onSelect}));expect(groups(tree)).toHaveLength(0);
 tree=mount(h(ToPicker,{tokens,onSelect,chains:[{chainId:8453,name:'Base'},{chainId:1,name:'Mainnet'}]}));expect(chain(tree,'Mainnet')).toBeTruthy();expect(chain(tree,'Ethereum')).toBeUndefined();
});
it('shows the empty text, or the loading text while the host is still fetching',()=>{
 let tree=mount(h(ToPicker,{tokens:[],onSelect:jest.fn()}));
 let empty=node(tree,'swap-list-to').props.ListEmptyComponent;expect(empty.props.children).toBe('No tokens found');
 tree=mount(h(ToPicker,{tokens:[],onSelect:jest.fn(),loading:true}));
 empty=node(tree,'swap-list-to').props.ListEmptyComponent;expect(empty.props.children).toBe('Loading…');
 tree=mount(h(FromPicker,{tokens,onSelect:jest.fn()}));act(()=>search(tree,'from').props.onChangeText('zzz'));expect(rows(tree,'from')).toEqual([]);
});
it('FromPicker with a connected wallet shows its address, and the disconnect button only when the host offers it',()=>{
 const onDisconnect=jest.fn(),onSelect=jest.fn();
 let tree=mount(h(FromPicker,{wallet:{connected:true,address},onDisconnect,tokens:[eth],onSelect}));
 expect(node(tree,'from-picker').props.accessibilityLabel).toBe('From');
 expect(texts(node(tree,'picker-wallet'))).toContain('0x71C7…976F');expect(has(tree,'picker-connect-row')).toBe(false);
 expect(name(tree,'picker-disconnect')).toBe('Disconnect wallet');press(tree,'picker-disconnect');expect(onDisconnect).toHaveBeenCalledTimes(1);
 expect(rows(tree,'from')).toEqual(['1-eth']);press(tree,'swap-token-1-eth');expect(onSelect).toHaveBeenCalledWith(eth);
 // Where signing out does not belong, the host leaves the handler out and the button is gone.
 tree=mount(h(FromPicker,{wallet:{connected:true,address},tokens:[eth],onSelect}));
 expect(has(tree,'picker-wallet')).toBe(true);expect(has(tree,'picker-disconnect')).toBe(false);
});
it('FromPicker with no wallet offers Connect wallet and a Generate address switch that only reports',()=>{
 const onConnect=jest.fn(),onGenerateAddressChange=jest.fn(),onSelect=jest.fn();
 const props={wallet:{connected:false},onConnect,onGenerateAddressChange,tokens,onSelect};
 let tree=mount(h(FromPicker,props));
 expect(has(tree,'picker-wallet')).toBe(false);
 expect(texts(node(tree,'picker-connect'))).toContain('Connect wallet');press(tree,'picker-connect');expect(onConnect).toHaveBeenCalledTimes(1);
 const toggle=()=>tree.findAll(n=>n.props.testID==='picker-generate'&&typeof n.props.onPress==='function')[0];
 expect(toggle().props.accessibilityRole).toBe('switch');expect(toggle().props.accessibilityLabel).toBe('Generate address');expect(toggle().props.accessibilityState.checked).toBe(false);
 // The switch reports the new value and nothing else: no token is chosen, and the list stays for picking a chain and asset.
 act(()=>toggle().props.onPress(event));expect(onGenerateAddressChange).toHaveBeenLastCalledWith(true);expect(onSelect).not.toHaveBeenCalled();expect(rows(tree,'from')).toHaveLength(4);
 act(()=>root.update(h(HIGProvider,{reducedMotion:true},h(FromPicker,{...props,generateAddress:true}))));
 expect(toggle().props.accessibilityState.checked).toBe(true);act(()=>toggle().props.onPress(event));expect(onGenerateAddressChange).toHaveBeenLastCalledWith(false);
 // Either control alone, or neither.
 tree=mount(h(FromPicker,{wallet:{connected:false},onConnect,tokens,onSelect}));expect(has(tree,'picker-connect')).toBe(true);expect(toggle()).toBeUndefined();
 tree=mount(h(FromPicker,{wallet:{connected:false},onGenerateAddressChange,tokens,onSelect}));expect(has(tree,'picker-connect')).toBe(false);expect(toggle()).toBeTruthy();
 tree=mount(h(FromPicker,{wallet:{connected:false},tokens,onSelect}));expect(has(tree,'picker-connect-row')).toBe(false);
});
it('FromPicker with no wallet prop is a plain whitelist: no wallet row at all',()=>{
 const tree=mount(h(FromPicker,{tokens:[usdc,baseUsdc],onSelect:jest.fn(),onConnect:jest.fn(),onGenerateAddressChange:jest.fn()}));
 expect(has(tree,'picker-wallet')).toBe(false);expect(has(tree,'picker-connect-row')).toBe(false);expect(rows(tree,'from')).toEqual(['1-usdc','8453-usdc']);
});
it('uses the host surface\'s list component so the list scrolls inside a sheet, and never focuses the search on mount',()=>{
 const SheetList=props=>h(FlatList,{...props,sheetList:true});
 const tree=mount(h(SwapHostContext.Provider,{value:{listComponent:SheetList}},h(ToPicker,{tokens,onSelect:jest.fn(),autoFocus:true})));
 expect(tree.findAll(n=>n.props.sheetList===true&&n.props.testID==='swap-list-to').length).toBeGreaterThan(0);
 expect(search(tree,'to').props.autoFocus).toBeFalsy();
});
// Number flow: a row's balance and its dollar value are live numbers, so a balance that changes while the list is open moves its digits.
it('picker rows show the balance and its value as live numbers that follow the token',()=>{
 const flow=(tree,id)=>tree.findAll(n=>n.type===AnimatedNumberReadout&&n.props.testID===id);
 const reading=(tree,id)=>[].concat(tree.findAll(n=>n.type==='Text'&&n.props.testID===id)[0].props.children).join('');
 const list=held=>h(FromPicker,{tokens:[{...eth,balance:held},usdc],onSelect:jest.fn()});
 let tree=mount(list(0.5));
 expect(flow(tree,'swap-token-balance-1-eth')).toHaveLength(1);expect(reading(tree,'swap-token-balance-1-eth')).toBe('0.5');
 expect(flow(tree,'swap-token-value-1-eth')[0].props.value).toBe(1000);expect(reading(tree,'swap-token-value-1-eth')).toBe('$1,000.00');
 // No balance: no number at all.
 expect(flow(tree,'swap-token-balance-1-usdc')).toHaveLength(0);
 const before=flow(tree,'swap-token-balance-1-eth')[0];
 act(()=>{root.update(h(HIGProvider,{reducedMotion:true},list(0.75)));});tree=root.root;
 expect(flow(tree,'swap-token-balance-1-eth')[0]).toBe(before);expect(reading(tree,'swap-token-balance-1-eth')).toBe('0.75');expect(reading(tree,'swap-token-value-1-eth')).toBe('$1,500.00');
});

