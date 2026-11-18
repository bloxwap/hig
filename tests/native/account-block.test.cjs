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
it('updates the total independently of holdings and refreshes rows when the holdings change',()=>{
 const value=jest.fn(()=>20);
 const holdings=[{...sol,get value(){return value();}}];
 mount({assets:holdings,balance:20});
 expect(value).toHaveBeenCalled();
 value.mockClear();
 const update=(assets,balance)=>act(()=>root.update(h(HIGProvider,{reducedMotion:true},h(AccountBlock,{assets,balance}))));
 update(holdings,21);
 expect(total(root.root).props.value).toBe(21);
 expect(value).not.toHaveBeenCalled();
 update([hype],759);
 expect(rows(root.root).map(node=>node.props.name)).toContain(hype.name);
});

it('windows a large sticky portfolio and preserves the summary and pinned holding',()=>{
 const portfolio=Array.from({length:1000},(_,i)=>({id:String(i),name:'Holding '+i,symbol:i===500?'USDC':'A'+i,value:i}));
 const select=jest.fn(),view=mount({assets:portfolio,stickyHeader:true,onAssetSelect:select});
 const list=view.findByType(require('react-native').VirtualizedList);
 expect(list.props.getItemCount(list.props.data)).toBe(1001);
 expect(list.props.getItem(list.props.data,0)).toBeNull();
 expect(list.props.data.every(asset=>portfolio[Number(asset.id)]===asset)).toBe(true);
 expect(list.props.getItem(list.props.data,1)).toBe(portfolio[500]);
 expect(rows(view).slice(0,2).map(row=>row.props.testID)).toEqual(['account-asset-500','account-asset-999']);
 expect(rows(view).length).toBeLessThan(30);
 expect(has(view,'account-balance')).toBe(true);
 expect(list.props.stickyHeaderIndices).toEqual([0]);
 act(()=>rows(view)[1].props.onSelect());
 expect(select).toHaveBeenCalledWith(portfolio[999]);
});

it('windows holdings across sections and preserves section totals, order and selection',()=>{
 const assets=Array.from({length:40},(_,i)=>({id:String(i),name:'Holding '+i,symbol:'A'+i,value:i,balance:i}));
 const sections=[
  {id:'first',title:'First',pinnedId:'3',total:100,assets:assets.slice(0,2).concat(assets[3])},
  {id:'empty',title:'Hidden',assets:[]},
  ...Array.from({length:25},(_,i)=>({id:'wallet'+i,title:'Wallet '+i,pinnedId:'7',order:'given',assets})),
 ];
 const select=jest.fn(),view=mount({sections,stickyHeader:true,onAssetSelect:select});
 const list=view.findByType(require('react-native').VirtualizedList);
 expect(rows(view).length).toBeLessThan(30);
 const count=list.props.getItemCount(list.props.data);
 expect(count).toBe(1+26+1003);
 const allKeys=Array.from({length:count},(_,i)=>list.props.keyExtractor(list.props.getItem(list.props.data,i)));
 expect(new Set(allKeys).size).toBe(count);
 const pairs=[[undefined,'abc'],['','abc'],['a','bc'],['ab','c'],['a:',':b'],['a::','b']];
 const keys=pairs.map(([sectionId,id])=>list.props.keyExtractor({kind:'asset',sectionId,asset:{id}}));
 expect(new Set(keys).size).toBe(pairs.length);
 expect(has(view,'account-section-empty-title')).toBe(false);
 expect(all(view,'account-section-wallet0-title').some(node=>node.props.accessibilityRole==='header')).toBe(true);
 const sectionTotal=id=>all(view,'account-section-'+id+'-total').find(node=>node.type===AnimatedNumberReadout).props.value;
 expect(sectionTotal('first')).toBe(100);
 expect(sectionTotal('wallet0')).toBe(780);
 expect(total(view).props.value).toBe(19600);
 expect(rows(view).slice(0,5).map(row=>row.props.testID)).toEqual(['account-section-first-asset-3','account-section-first-asset-1','account-section-first-asset-0','account-section-wallet0-asset-7','account-section-wallet0-asset-0']);
 act(()=>rows(view)[3].props.onSelect());
 expect(select).toHaveBeenCalledWith(assets[7],sections[2]);
});

it('reads each holding value once when ranking and skips it for host order',()=>{
 const read=jest.fn(i=>i%3===0?null:i);
 const holdings=Array.from({length:1000},(_,i)=>({id:String(i),symbol:'A',name:'Asset '+i,get value(){return read(i);}}));
 const {rest}=accountRows(holdings);
 expect(rest[0]).toBe(holdings[998]);
 expect(read).toHaveBeenCalledTimes(holdings.length);
 read.mockClear();
 expect(accountRows(holdings,'USDC',{order:'given'}).rest).toEqual(holdings);
 expect(read).not.toHaveBeenCalled();
});

it.each([false,true])('keeps visible holdings when the selection handler changes (sticky=%s)',stickyHeader=>{
 const read=jest.fn(i=>i);
 const holdings=Array.from({length:stickyHeader?1000:40},(_,i)=>({id:String(i),symbol:'A',name:'Asset '+i,get value(){return read(i);}}));
 const section={id:'wallet',title:'Wallet',assets:holdings},sections=[section];
 const first=jest.fn(),second=jest.fn();
 const update=onAssetSelect=>act(()=>root.update(h(HIGProvider,{reducedMotion:true},h(AccountBlock,{sections,stickyHeader,onAssetSelect}))));
 mount({sections,stickyHeader,onAssetSelect:first});
 read.mockClear();
 update(second);
 expect(read).not.toHaveBeenCalled();
 act(()=>rows(root.root)[0].props.onSelect());
 expect(second).toHaveBeenCalledWith(holdings[holdings.length-1],section);
 expect(first).not.toHaveBeenCalled();
 update(undefined);
 expect(rows(root.root)[0].props.onSelect).toBeUndefined();
});

it('reuses each section valuation for its heading and the account balance',()=>{
 const read=jest.fn(()=>9);
 const assets=Array.from({length:1000},(_,i)=>({id:String(i),name:'Token '+i,symbol:'T',get value(){return read();}}));
 const sections=[{id:'wallet',title:'Wallet',order:'given',assets}];
 const view=mount({sections,stickyHeader:true});
 expect(read).toHaveBeenCalledTimes(assets.length+rows(view).length);
 expect(total(view).props.value).toBe(9000);
 const update=props=>act(()=>root.update(h(HIGProvider,{reducedMotion:true},h(AccountBlock,{...props,stickyHeader:true}))));
 read.mockClear();
 update({sections,balance:20});
 expect(read).not.toHaveBeenCalled();
 update({sections:[{...sections[0],assets:[{...usdc,value:13}]}]});
 expect(total(root.root).props.value).toBe(13);
 expect(all(root.root,'account-section-wallet-total').find(node=>node.type===AnimatedNumberReadout).props.value).toBe(13);
});

it('defers an offscreen section valuation when a sticky account has an explicit balance',()=>{
 const read=jest.fn(()=>25);
 const assets=Array.from({length:100},(_,i)=>({id:String(i),name:'Asset '+i,symbol:'A',value:i}));
 const sections=[{id:'first',title:'First',order:'given',assets},{id:'last',title:'Last',order:'given',assets:[{id:'last',name:'Last',symbol:'L',get value(){return read();}}]}];
 const view=mount({sections,stickyHeader:true,balance:42});
 expect(total(view).props.value).toBe(42);
 expect(has(view,'account-section-last-title')).toBe(false);
 expect(read).not.toHaveBeenCalled();
});

it.each([false,true])('updates a wallet without reading holdings in an unchanged wallet (sticky=%s)',stickyHeader=>{
 const read=jest.fn(i=>i);
 const assets=Array.from({length:stickyHeader?1000:40},(_,i)=>({id:String(i),name:'Holding '+i,symbol:'A',get value(){return read(i);}}));
 const stable={id:'stable',title:'Stable',assets};
 const wallet={id:'wallet',title:'Wallet',assets:[sol],total:10};
 const view=mount({sections:[stable,wallet],stickyHeader});
 const before=total(view).props.value;
 const update=sections=>act(()=>root.update(h(HIGProvider,{reducedMotion:true},h(AccountBlock,{sections,stickyHeader}))));
 expect(read).toHaveBeenCalled();
 read.mockClear();
 update([stable,{...wallet,total:20}]);
 expect(read).not.toHaveBeenCalled();
 expect(total(root.root).props.value).toBe(before+10);
 update([{...stable,pinnedId:'8'},wallet]);
 expect(rows(root.root)[0].props.name).toBe('Holding 8');
});

it.each([true,false])('updates an explicit wallet total without ranking unchanged holdings again (sticky=%s)',stickyHeader=>{
 const read=jest.fn(i=>i),select=jest.fn();
 const assets=Array.from({length:stickyHeader?1000:40},(_,i)=>({id:String(i),name:'Token '+i,symbol:'T',get value(){return read(i);}}));
 const wallet={id:'wallet',title:'Wallet',total:20,assets};
 mount({sections:[wallet],stickyHeader,onAssetSelect:select});
 read.mockClear();
 const updated={...wallet,total:30};
 act(()=>root.update(h(HIGProvider,{reducedMotion:true},h(AccountBlock,{sections:[updated],stickyHeader,onAssetSelect:select}))));
 expect(read).not.toHaveBeenCalled();
 expect(total(root.root).props.value).toBe(30);
 act(()=>rows(root.root)[0].props.onSelect());
 expect(select.mock.calls[0][1]).toBe(updated);
});

it('keeps the virtualized ledger data when wallet metadata changes and updates it when holdings move',()=>{
 const assets=Array.from({length:1000},(_,i)=>({id:String(i),symbol:'T',name:'Token '+i,value:i}));
 const wallet={id:'wallet',title:'Wallet',total:1,order:'given',assets};
 const another={id:'other',title:'Other',total:2,assets:[usdc]};
 mount({sections:[wallet,another],stickyHeader:true});
 const data=()=>root.root.findByType(require('react-native').VirtualizedList).props.data;
 const update=sections=>act(()=>root.update(h(HIGProvider,{reducedMotion:true},h(AccountBlock,{sections,stickyHeader:true}))));
 const first=data();
 const changed={...wallet,title:'Updated wallet',total:8};
 update([changed,another]);
 expect(data().filter((cell,index)=>cell!==first[index])).toHaveLength(0);
 expect(data()===first).toBe(true);
 expect(text(all(root.root,'account-section-wallet-title')[0])).toBe('Updated wallet');
 expect(total(root.root).props.value).toBe(10);
 update([another,{...changed,pinnedId:'900'}]);
 expect(data()===first).toBe(false);
 expect(rows(root.root).slice(0,2).map(row=>row.props.name)).toEqual(['USD Coin','Token 900']);
});

it('matches value-first ordering for fractional and extreme values, unknowns and locale-equivalent names',()=>{
 const names=['é','e\u0301','ß','SS','한','東京','A','a','A2','😀'];
 const values=[Number.MAX_VALUE,-Number.MAX_VALUE,Number.MIN_VALUE,-0,0,1.25,-4.5,null,NaN,Infinity,-Infinity];
 const holdings=Array.from({length:441},(_,i)=>({id:String(i),symbol:'A',name:names[(i*7)%names.length],value:values[(i*5)%values.length]}));
 const expected=[...holdings].sort((a,b)=>{
  const x=assetValue(a),y=assetValue(b);
  return x===y?a.name.localeCompare(b.name):x===null?1:y===null?-1:y-x;
 });
 const actual=accountRows(holdings).rest;
 expect(actual.map(asset=>asset.id)).toEqual(expected.map(asset=>asset.id));
 expect(actual.every((asset,i)=>asset===expected[i])).toBe(true);
});

it('reuses a calculated wallet balance after an explicit override clears',()=>{
 const read=jest.fn(()=>2);
 const assets=Array.from({length:1000},(_,i)=>({id:String(i),name:'Asset '+i,symbol:'T',get value(){return read();}}));
 const props={assets,order:'given',stickyHeader:true};
 const view=mount(props);
 const update=balance=>act(()=>root.update(h(HIGProvider,{reducedMotion:true},h(AccountBlock,{...props,balance}))));
 update(42);
 read.mockClear();
 update(undefined);
 expect(total(view).props.value).toBe(2000);
 expect(read).not.toHaveBeenCalled();
});

it('ranks a distant ledger only when the list requests one of its holdings',()=>{
 const read=jest.fn(i=>i);
 const assets=Array.from({length:1000},(_,i)=>({id:String(i),name:'Token '+i,symbol:'T',get value(){return read(i);}}));
 const first=assets.map((_,i)=>({id:String(i),name:'Spot '+i,symbol:'S',value:i}));
 const view=mount({stickyHeader:true,balance:42,sections:[{id:'spot',title:'Spot',assets:first},{id:'funding',title:'Funding',assets}]});
 expect(read).not.toHaveBeenCalled();
 const {data,getItem}=view.findByType(require('react-native').VirtualizedList).props;
 expect(getItem(data,1002).kind).toBe('heading');
 expect(read).not.toHaveBeenCalled();
 const top=getItem(data,1003);
 expect(top.asset).toBe(assets[999]);
 expect(getItem(data,1003)).toBe(top);
 expect(read).toHaveBeenCalledTimes(1000);
 expect(getItem(data,1004).asset).toBe(assets[998]);
 expect(read).toHaveBeenCalledTimes(1000);
});
