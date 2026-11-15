/** Native AccountBlock: header, total with deposit, the pinned asset, then holdings by value. */
const React=require('react');
const {create:render,act}=require('react-test-renderer');
const {View}=require('react-native');
const {HIGProvider}=require('../../packages/hig/native/src/provider');
const {AccountBlock,accountRows,assetValue}=require('../../packages/hig/native/src/account-block');
const blocks=require('../../packages/hig/native/src/blocks');
const {AssetBalanceRow}=require('../../packages/hig/native/src/asset-balance-row');
const {AnimatedNumberReadout}=require('../../packages/hig/native/src/animated-number');
const h=React.createElement;
let root;
function mount(props,provider={}){if(root)act(()=>root.unmount());act(()=>{root=render(h(HIGProvider,{reducedMotion:true,...provider},h(AccountBlock,props)));});return root.root;}
const all=(view,id)=>view.findAll(node=>node.props.testID===id);
const has=(view,id)=>all(view,id).length>0;
const text=node=>typeof node==='string'?node:node.children.map(text).join('');
const usdc={id:'usdc',name:'USD Coin',symbol:'USDC',balance:100.33,price:1};
const sol={id:'sol',name:'Solana',symbol:'SOL',balance:1.25,price:162.4};
const hype={id:'hype',name:'Hyperliquid',symbol:'HYPE',balance:13.2,value:759};
const assets=[sol,usdc,hype];
const rows=view=>view.findAllByType(AssetBalanceRow);
const total=view=>all(view,'account-balance').flatMap(hit=>hit.type===AnimatedNumberReadout?[hit]:hit.findAllByType(AnimatedNumberReadout))[0];
afterEach(()=>{if(root)act(()=>root.unmount());root=undefined;});

it('values an asset by its own value, else balance × price, else unknown',()=>{
 expect(assetValue(hype)).toBe(759);expect(assetValue(sol)).toBeCloseTo(203);expect(assetValue({id:'x',name:'X',symbol:'X',balance:2})).toBeNull();expect(assetValue({id:'x',name:'X',symbol:'X',value:0,balance:2,price:5})).toBe(0);
});
it('pins the asset, sorts the rest by value with unknown last and ties by name, and leaves the input alone',()=>{
 const unknown={id:'u',name:'Unknown',symbol:'UNK',balance:5},a={id:'a',name:'Alpha',symbol:'AAA',value:10},b={id:'b',name:'Beta',symbol:'BBB',value:10},other=[unknown,b,sol,usdc,a,hype],copy=[...other];
 const {pinned,rest}=accountRows(other);
 expect(pinned).toBe(usdc);expect(rest.map(asset=>asset.id)).toEqual(['hype','sol','a','b','u']);expect(other).toEqual(copy);
 // Case does not matter, the first match wins, and another symbol can be pinned.
 expect(accountRows([{...usdc,symbol:'usdc'}]).pinned.symbol).toBe('usdc');expect(accountRows(assets,'SOL').pinned).toBe(sol);expect(accountRows(assets,'SOL').rest.map(asset=>asset.id)).toEqual(['hype','usdc']);
 // An account without the pinned asset still shows it, at zero.
 expect(accountRows([sol]).pinned).toEqual({id:'USDC',name:'USD Coin',symbol:'USDC',balance:0,value:0});expect(accountRows([sol],'HYPE').pinned).toEqual({id:'HYPE',name:'HYPE',symbol:'HYPE',balance:0,value:0});
 expect(accountRows([]).rest).toEqual([]);
});
it('shows a QR button on the trailing edge of the header that asks the host for the account address; headerAction replaces it',()=>{
 const show=jest.fn();let view=mount({assets,onShowAddress:show});
 const button=all(view,'account-address')[0];expect(button.props.label??button.props.accessibilityLabel).toBe('Show account address');
 act(()=>{all(view,'account-address').find(node=>node.props.onPress).props.onPress({});});expect(show).toHaveBeenCalledTimes(1);
 view=mount({assets,onShowAddress:show,headerAction:h(View,{testID:'history'})});expect(has(view,'account-address')).toBe(false);expect(has(view,'history')).toBe(true);
 expect(has(mount({assets}),'account-address')).toBe(false);
});
it('shows the header: the localized title by default, Back only with onBack, and the host action on the trailing edge',()=>{
 let view=mount({assets});
 expect(text(all(view,'account-title').find(node=>typeof node.type==='string'))).toBe('Account');expect(all(view,'account-title')[0].props.accessibilityRole).toBe('header');expect(has(view,'account-back')).toBe(false);
 const back=jest.fn();view=mount({assets,title:'Papertrade',onBack:back,headerAction:h(View,{testID:'history'})});
 expect(text(all(view,'account-title').find(node=>typeof node.type==='string'))).toBe('Papertrade');expect(has(view,'history')).toBe(true);
 const button=all(view,'account-back')[0];expect(button.props.label??button.props.accessibilityLabel).toBe('Back');act(()=>{all(view,'account-back').find(node=>node.props.onPress).props.onPress({});});expect(back).toHaveBeenCalledTimes(1);
 view=mount({assets},{messages:{account:'Compte'}});expect(text(all(view,'account-title').find(node=>typeof node.type==='string'))).toBe('Compte');
});
it('totals the asset values unless the host gives the balance, and null is unknown',()=>{
 let view=mount({assets});expect(total(view).props.value).toBeCloseTo(100.33+203+759);expect(total(view).props).toMatchObject({label:'Total balance',options:{style:'currency',currency:'USD'}});
 view=mount({assets,balance:12456});expect(total(view).props.value).toBe(12456);
 view=mount({assets,balance:null});expect(total(view).props.value).toBeNull();
 view=mount({assets:[]});expect(total(view).props.value).toBe(0);
});
it('offers Deposit only when the host handles it',()=>{
 let view=mount({assets});expect(has(view,'account-deposit')).toBe(false);
 const deposit=jest.fn();view=mount({assets,onDeposit:deposit});
 const button=all(view,'account-deposit').find(node=>node.props.onPress);expect(text(all(view,'account-deposit').find(node=>typeof node.type==='string'))).toBe('Deposit');
 act(()=>{button.props.onPress({});});expect(deposit).toHaveBeenCalledTimes(1);
 view=mount({assets,onDeposit:deposit,depositLabel:'Add funds'});expect(text(all(view,'account-deposit').find(node=>typeof node.type==='string'))).toBe('Add funds');
});
it('lists the pinned asset first with its value alone, then the rest by value with their units',()=>{
 const view=mount({assets});const list=rows(view);
 expect(list.map(row=>row.props.testID)).toEqual(['account-asset-usdc','account-asset-hype','account-asset-sol']);
 expect(list[0].props.balance).toBeUndefined();expect(list[0].props.value).toBeCloseTo(100.33);
 expect(list[1].props).toMatchObject({name:'Hyperliquid',symbol:'HYPE',value:759,balance:13.2});expect(list[2].props.balance).toBe(1.25);
 expect(list.every(row=>row.props.onSelect===undefined)).toBe(true);
 // Always visible: an account with no USDC still leads with it.
 expect(rows(mount({assets:[sol]})).map(row=>[row.props.name,row.props.value])).toEqual([['USD Coin',0],['Solana',expect.closeTo(203)]]);
});
it('reports the asset when a row is selected, and the blocks entry exports the card',()=>{
 const select=jest.fn(),view=mount({assets,onAssetSelect:select});
 act(()=>{rows(view)[1].props.onSelect();});expect(select).toHaveBeenCalledWith(hype);act(()=>{rows(view)[0].props.onSelect();});expect(select).toHaveBeenLastCalledWith(usdc);
 expect(blocks.AccountBlock).toBe(AccountBlock);expect(blocks.accountRows).toBe(accountRows);expect(blocks.AssetBalanceRow).toBe(AssetBalanceRow);
});
const perp={id:'perp-usdc',name:'USD Coin',symbol:'USDC',value:500,units:false};
const blox={id:'blox',name:'Bloxwap',symbol:'BLOX',balance:1234.5,value:null};
it('draws titled sections with their own totals, 24 apart, in place of the flat list, and reports the section with a row',()=>{
 const select=jest.fn();
 const sections=[{id:'exchange',title:'Exchange',assets:[perp,{...hype,id:'perp-hype'}]},{id:'empty',title:'Nothing',assets:[]},{id:'wallet',title:'Wallet',total:999,assets:[sol,usdc,blox]}];
 const view=mount({sections,onAssetSelect:select});
 expect(has(view,'account-assets')).toBe(false);expect(has(view,'account-section-empty')).toBe(false);
 const group=all(view,'account-sections').find(node=>typeof node.type==='string');expect(Object.assign({},...[].concat(group.props.style))).toMatchObject({gap:24,marginTop:16});
 const title=id=>all(view,`account-section-${id}-title`).find(node=>node.props.accessibilityRole==='header');expect(text(title('exchange'))).toBe('Exchange');expect(text(title('wallet'))).toBe('Wallet');
 const sectionTotal=id=>all(view,`account-section-${id}-total`).find(node=>node.type===AnimatedNumberReadout);
 expect(sectionTotal('exchange').props.value).toBe(1259);expect(sectionTotal('wallet').props.value).toBe(999);expect(total(view).props.value).toBe(2258);
 expect(rows(view).map(row=>row.props.testID)).toEqual(['account-section-exchange-asset-perp-usdc','account-section-exchange-asset-perp-hype','account-section-wallet-asset-usdc','account-section-wallet-asset-sol','account-section-wallet-asset-blox']);
 act(()=>{rows(view)[3].props.onSelect();});expect(select).toHaveBeenCalledWith(sol,sections[2]);
 expect(blocks.accountSectionRows).toBeDefined();expect(blocks.accountSectionTotal(sections[0])).toBe(1259);
});
it('totals only the sections it draws, and the total is unknown when a drawn section total is unknown',()=>{
 let view=mount({sections:[{id:'stake',title:'Staking',total:500,assets:[]},{id:'wallet',title:'Wallet',assets:[usdc]}]});
 expect(has(view,'account-section-stake')).toBe(false);expect(total(view).props.value).toBeCloseTo(100.33);
 view=mount({sections:[{id:'perps',title:'Perps',total:null,assets:[perp]},{id:'wallet',title:'Wallet',assets:[usdc]}]});expect(total(view).props.value).toBeNull();
 view=mount({sections:[{id:'perps',title:'Perps',total:null,assets:[]},{id:'wallet',title:'Wallet',assets:[usdc]}]});expect(total(view).props.value).toBeCloseTo(100.33);
});
it('hides units per asset, makes a row plain, passes the units format, and headlines units when the value is unknown',()=>{
 const select=jest.fn();
 const view=mount({assets:[usdc,{...sol,selectable:false,unitsOptions:{minimumFractionDigits:4}},perp,blox],onAssetSelect:select});
 const byId=id=>rows(view).find(row=>row.props.testID===`account-asset-${id}`);
 expect(byId('perp-usdc').props.balance).toBeUndefined();
 expect(byId('sol').props.onSelect).toBeUndefined();expect(byId('sol').props.balanceOptions).toEqual({minimumFractionDigits:4});
 expect(byId('blox').props).toMatchObject({headline:'units',balance:1234.5,value:null});expect(byId('hype')).toBeUndefined();
 act(()=>{byId('blox').props.onSelect();});expect(select).toHaveBeenCalledWith(blox);
 // Without the new fields the rows take the same props as before.
 expect(byId('usdc').props.headline).toBeUndefined();
});
