// @vitest-environment jsdom
import React from 'react';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {cleanup,render,screen,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {readFileSync} from 'node:fs';
import {HIGProvider} from '../packages/hig/react/src/provider';
import {AssetBalanceRow} from '../packages/hig/react/src/asset-balance-row';
import {AccountBlock,accountRows,assetValue,type AccountAsset} from '../packages/hig/react/src/blocks/account-block';
afterEach(cleanup);
/** What is read and drawn once: the text without the decorative copy of each animated number. */
const spoken=(element:Element)=>{const copy=element.cloneNode(true) as Element;for(const visual of copy.querySelectorAll('.hig-animated-number-visual'))visual.remove();return copy.textContent;};
const usdc:AccountAsset={id:'usdc',name:'USD Coin',symbol:'USDC',balance:100.33,price:1};
const sol:AccountAsset={id:'sol',name:'Solana',symbol:'SOL',balance:1.42,price:142.96};
const hype:AccountAsset={id:'hype',name:'Hyperliquid',symbol:'HYPE',balance:13.2,price:57.5};
const eth:AccountAsset={id:'eth',name:'Ether',symbol:'ETH',balance:0.05,price:3521.12};
describe('accountRows',()=>{
 it('pins the dollar asset first and sorts the rest by value, largest first',()=>{
  const input=[sol,eth,usdc,hype];const {pinned,rest}=accountRows(input);
  expect(pinned).toBe(usdc);expect(rest.map(asset=>asset.id)).toEqual(['hype','sol','eth']);expect(input.map(asset=>asset.id)).toEqual(['sol','eth','usdc','hype']);
 });
 it('shows a zero placeholder when the pinned asset is not held, matches the symbol in any case, and takes another symbol',()=>{
  expect(accountRows([sol]).pinned).toEqual({id:'USDC',name:'USD Coin',symbol:'USDC',balance:0,value:0});
  expect(accountRows([{...usdc,symbol:'usdc'},sol]).pinned.id).toBe('usdc');
  expect(accountRows([usdc,sol],'SOL')).toEqual({pinned:sol,rest:[usdc]});expect(accountRows([],'USDT').pinned.name).toBe('USDT');
 });
 it('puts unknown values last, breaks ties by name, and prefers an explicit value over balance × price',()=>{
  const unknown:AccountAsset={id:'x',name:'Xeno',symbol:'XEN',balance:5},a:AccountAsset={id:'a',name:'Alpha',symbol:'AAA',value:10},b:AccountAsset={id:'b',name:'Beta',symbol:'BBB',balance:1,price:10};
  expect(accountRows([unknown,b,a]).rest.map(asset=>asset.id)).toEqual(['a','b','x']);
  expect(assetValue(unknown)).toBeNull();expect(assetValue(b)).toBe(10);expect(assetValue({...b,value:3})).toBe(3);expect(assetValue({...b,value:null})).toBeNull();
 });
});
describe('AssetBalanceRow',()=>{
 it('reads name, symbol, value and units; a row without units shows the value alone',()=>{
  const view=render(<AssetBalanceRow name='Hyperliquid' symbol='HYPE' value={759} balance={13.2}/>);
  const row=document.querySelector('.hig-asset-row')!;expect(row.tagName).toBe('DIV');expect(spoken(row)).toBe('HYPHyperliquidHYPE$759.0013.2');
  view.rerender(<AssetBalanceRow name='USD Coin' symbol='USDC' value={100.33}/>);expect(spoken(document.querySelector('.hig-asset-row-amounts')!)).toBe('$100.33');expect(document.querySelectorAll('.hig-asset-row-amounts > *')).toHaveLength(1);
  view.rerender(<AssetBalanceRow name='Mystery' symbol='MYS' value={null} balance={null}/>);expect(document.querySelectorAll('.hig-asset-row-amounts .hig-animated-number-visual')).toHaveLength(2);
 });
 it('draws an image URL, a host element, or the symbol letters as artwork, hidden from assistive technology',()=>{
  const view=render(<AssetBalanceRow name='Ether' symbol='ETHER' value={1} icon='/eth.png'/>);const icon=()=>document.querySelector('.hig-asset-row-icon')!;
  expect(icon().getAttribute('aria-hidden')).toBe('true');expect(icon().querySelector('img')?.getAttribute('src')).toBe('/eth.png');
  view.rerender(<AssetBalanceRow name='Ether' symbol='ETHER' value={1} icon={<svg data-testid='art'/>}/>);expect(within(icon() as HTMLElement).getByTestId('art')).toBeTruthy();
  view.rerender(<AssetBalanceRow name='Ether' symbol='ETHER' value={1}/>);expect(icon().textContent).toBe('ETH');
 });
 it('is a button only when it can be selected, and its numbers update place by place',async()=>{
  const select=vi.fn();Object.defineProperty(HTMLElement.prototype,'animate',{value:()=>({cancel(){}}),configurable:true});
  const view=render(<AssetBalanceRow name='Solana' symbol='SOL' value={203} balance={1.42} onSelect={select}/>);
  await userEvent.click(screen.getByRole('button',{name:/Solana/}));expect(select).toHaveBeenCalledTimes(1);
  view.rerender(<AssetBalanceRow name='Solana' symbol='SOL' value={215.5} balance={1.5} onSelect={select}/>);
  expect(spoken(document.querySelector('.hig-asset-row-amounts')!)).toBe('$215.501.5');expect(document.querySelectorAll('.hig-asset-row .hig-number-flow-strip').length).toBeGreaterThan(1);
  delete (HTMLElement.prototype as {animate?:unknown}).animate;
 });
});
describe('AccountBlock',()=>{
 it('shows a QR button on the trailing edge of the header that asks the host for the account address; headerAction replaces it',async()=>{
  const show=vi.fn();const view=render(<AccountBlock assets={[usdc]} onShowAddress={show} onDeposit={()=>{}}/>);
  const side=()=>document.querySelectorAll('.hig-screen-header-side')[1] as HTMLElement;
  const button=within(side()).getByRole('button',{name:'Show account address'});expect(button.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  expect(button.compareDocumentPosition(screen.getByRole('button',{name:'Deposit'}))&Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  await userEvent.click(button);expect(show).toHaveBeenCalledTimes(1);
  view.rerender(<AccountBlock assets={[usdc]} onShowAddress={show} headerAction={<button type='button'>Scan</button>}/>);
  expect(within(side()).queryByRole('button',{name:'Show account address'})).toBeNull();expect(within(side()).getByRole('button',{name:'Scan'})).toBeTruthy();
  view.rerender(<AccountBlock assets={[usdc]}/>);expect(side().children).toHaveLength(0);
  view.rerender(<HIGProvider messages={{showAddress:'Afficher l’adresse'}}><AccountBlock assets={[usdc]} onShowAddress={show}/></HIGProvider>);expect(screen.getByRole('button',{name:'Afficher l’adresse'})).toBeTruthy();
 });
 it('lays out the header, the total with Deposit, the pinned dollar row, then the holdings by value',async()=>{
  const back=vi.fn(),deposit=vi.fn(),select=vi.fn();
  render(<AccountBlock assets={[sol,eth,usdc,hype]} onBack={back} onDeposit={deposit} onAssetSelect={select} headerAction={<button type='button'>Scan</button>}/>);
  expect(screen.getByRole('heading',{name:'Account'})).toBeTruthy();
  const sides=document.querySelectorAll('.hig-screen-header-side');expect(within(sides[0] as HTMLElement).getByRole('button',{name:'Back'})).toBeTruthy();expect(within(sides[1] as HTMLElement).getByRole('button',{name:'Scan'})).toBeTruthy();
  // 100.33 + 1.42 × 142.96 + 13.2 × 57.5 + 0.05 × 3521.12
  expect(spoken(document.querySelector('.hig-account-balance')!)).toBe('Total balance: $1,238.39');
  const rows=screen.getAllByRole('listitem');expect(rows.map(spoken)).toEqual(['USDUSD CoinUSDC$100.33','HYPHyperliquidHYPE$759.0013.2','SOLSolanaSOL$203.001.42','ETHEtherETH$176.060.05']);
  expect(rows[0].getAttribute('data-pinned')).toBe('true');expect(rows[1].hasAttribute('data-pinned')).toBe(false);
  await userEvent.click(screen.getByRole('button',{name:'Back'}));await userEvent.click(screen.getByRole('button',{name:'Deposit'}));await userEvent.click(within(rows[1]).getByRole('button'));
  expect(back).toHaveBeenCalledTimes(1);expect(deposit).toHaveBeenCalledTimes(1);expect(select).toHaveBeenCalledWith(hype);
 });
 it('always shows the pinned row, and leaves out Back, Deposit and row buttons the host did not ask for',()=>{
  render(<AccountBlock assets={[]}/>);
  expect(screen.getAllByRole('listitem').map(spoken)).toEqual(['USDUSD CoinUSDC$0.00']);expect(spoken(document.querySelector('.hig-account-balance')!)).toBe('Total balance: $0.00');
  expect(screen.queryByRole('button')).toBeNull();expect(document.querySelectorAll('.hig-screen-header-side')).toHaveLength(2);
 });
 it('takes a host total, title, deposit text, pinned symbol and translations',()=>{
  const view=render(<AccountBlock assets={[usdc,sol]} balance={5000} title='Trading' depositLabel='Add funds' onDeposit={()=>{}} pinnedSymbol='SOL'/>);
  expect(screen.getByRole('heading',{name:'Trading'})).toBeTruthy();expect(screen.getByRole('button',{name:'Add funds'})).toBeTruthy();expect(spoken(document.querySelector('.hig-account-balance')!)).toBe('Total balance: $5,000.00');
  expect(screen.getAllByRole('listitem').map(spoken)).toEqual(['SOLSolanaSOL$203.00','USDUSD CoinUSDC$100.33100.33']);
  view.rerender(<AccountBlock assets={[usdc]} balance={null}/>);expect(spoken(document.querySelector('.hig-account-balance')!)).toBe('Total balance: —');
  view.rerender(<HIGProvider messages={{account:'Compte',deposit:'Déposer',accountBalance:'Solde total',back:'Retour'}}><AccountBlock assets={[usdc]} onBack={()=>{}} onDeposit={()=>{}}/></HIGProvider>);
  expect(screen.getByRole('heading',{name:'Compte'})).toBeTruthy();expect(screen.getByRole('button',{name:'Déposer'})).toBeTruthy();expect(screen.getByRole('button',{name:'Retour'})).toBeTruthy();expect(spoken(document.querySelector('.hig-account-balance')!)).toBe('Solde total: $100.33');
 });
 it('rows are concentric capsules 8 apart and the layout follows the writing direction',()=>{
  const css=readFileSync('packages/hig/react/src/styles.css','utf8').split('\n');const rule=(start:string)=>css.find(line=>line.startsWith(start)||(start.endsWith(' {')&&line.includes(' { ')&&line.slice(0,line.indexOf(' { ')).split(',').includes(start.slice(0,-2))))??'';
  expect(rule('.hig-asset-row {')).toMatch(/min-height:56px;.*padding:8px;padding-inline-end:16px;.*border-radius:28px/);expect(rule('.hig-asset-row-icon {')).toMatch(/width:40px;height:40px/);
  expect(rule('.hig-account-assets {')).toContain('gap:8px');expect(css.filter(line=>/^\.hig-(asset-row|account)/.test(line)).join('\n')).not.toMatch(/\b(left|right)\b/);
 });
});
describe('AccountBlock host options',()=>{
 const perp:AccountAsset={id:'perp-usdc',name:'USD Coin',symbol:'USDC',value:500,units:false};
 const bloxwap:AccountAsset={id:'blox',name:'Bloxwap',symbol:'BLOX',balance:1234.5,value:null};
 it('draws titled sections with their own totals in the order given, 24 apart, in place of the flat list',async()=>{
  const select=vi.fn();
  render(<AccountBlock sections={[
   {id:'exchange',title:'Exchange',assets:[perp,{...hype,id:'perp-hype'}]},
   {id:'empty',title:'Nothing',assets:[]},
   {id:'wallet',title:'Wallet',total:999,assets:[sol,usdc,bloxwap]},
  ]} onAssetSelect={select}/>);
  const groups=[...document.querySelectorAll('.hig-account-section')];expect(groups).toHaveLength(2);
  expect(groups.map(group=>group.querySelector('h3')!.textContent)).toEqual(['Exchange','Wallet']);
  expect(screen.getByRole('region',{name:'Wallet'})).toBe(groups[1]);
  expect(groups.map(group=>spoken(group.querySelector('.hig-account-section-total')!))).toEqual(['$1,259.00','$999.00']);
  // The block total sums the section totals.
  expect(spoken(document.querySelector('.hig-account-balance')!)).toBe('Total balance: $2,258.00');
  // A section's pinned asset leads when it holds one; no zero placeholder is added.
  expect([...groups[0].querySelectorAll('li')].map(spoken)).toEqual(['USDUSD CoinUSDC$500.00','HYPHyperliquidHYPE$759.0013.2']);
  expect([...groups[1].querySelectorAll('li')].map(item=>item.getAttribute('data-pinned'))).toEqual(['true',null,null]);
  await userEvent.click(within(groups[1] as HTMLElement).getAllByRole('button')[1]);expect(select).toHaveBeenCalledWith(sol,expect.objectContaining({id:'wallet'}));
  const css=readFileSync('packages/hig/react/src/styles.css','utf8').split('\n');const rule=(start:string)=>css.find(line=>line.startsWith(start)||(start.endsWith(' {')&&line.includes(' { ')&&line.slice(0,line.indexOf(' { ')).split(',').includes(start.slice(0,-2))))??'';
  expect(rule('.hig-account-sections {')).toContain('gap:24px');expect(rule('.hig-account-section {')).toContain('gap:8px');
 });
 it('totals only the sections it draws, and the total is unknown when a drawn section total is unknown',()=>{
  const balance=()=>spoken(document.querySelector('.hig-account-balance')!);
  const view=render(<AccountBlock sections={[{id:'stake',title:'Staking',total:500,assets:[]},{id:'wallet',title:'Wallet',assets:[usdc]}]}/>);
  expect(screen.queryByRole('region',{name:'Staking'})).toBeNull();expect(balance()).toBe('Total balance: $100.33');
  view.rerender(<AccountBlock sections={[{id:'perps',title:'Perps',total:null,assets:[perp]},{id:'wallet',title:'Wallet',assets:[usdc]}]}/>);expect(balance()).toBe('Total balance: —');
  view.rerender(<AccountBlock sections={[{id:'perps',title:'Perps',total:null,assets:[]},{id:'wallet',title:'Wallet',assets:[usdc]}]}/>);expect(balance()).toBe('Total balance: $100.33');
 });
 it('hides a units line, makes a row plain, formats units, and headlines units when the value is unknown',async()=>{
  const select=vi.fn();
  render(<AccountBlock assets={[usdc,{...sol,selectable:false},perp,{...eth,unitsOptions:{minimumFractionDigits:4,maximumFractionDigits:4}},bloxwap]} onAssetSelect={select}/>);
  const rows=screen.getAllByRole('listitem');
  expect(rows.map(spoken)).toEqual(['USDUSD CoinUSDC$100.33','USDUSD CoinUSDC$500.00','SOLSolanaSOL$203.001.42','ETHEtherETH$176.060.0500','BLOBloxwapBLOX1,234.5']);
  expect(rows[4].querySelectorAll('.hig-asset-row-amounts > *')).toHaveLength(1);expect(rows[4].querySelector('.hig-asset-row-amounts > strong')).toBeTruthy();
  expect(rows[1].querySelectorAll('.hig-asset-row-amounts > *')).toHaveLength(1);
  expect(rows[2].querySelector('button')).toBeNull();expect(rows[2].querySelector('.hig-asset-row')!.tagName).toBe('DIV');
  await userEvent.click(within(rows[4]).getByRole('button'));expect(select).toHaveBeenCalledWith(bloxwap);
 });
 it('AssetBalanceRow headline units puts the units on the headline line; the default stays value over units',()=>{
  const view=render(<AssetBalanceRow name='Bloxwap' symbol='BLOX' value={null} balance={1234.5} headline='units'/>);
  expect(spoken(document.querySelector('.hig-asset-row-amounts')!)).toBe('1,234.5');expect(document.querySelectorAll('.hig-asset-row-amounts > *')).toHaveLength(1);
  view.rerender(<AssetBalanceRow name='Bloxwap' symbol='BLOX' value={null} balance={1234.5}/>);expect(spoken(document.querySelector('.hig-asset-row-amounts')!)).toBe('—1,234.5');
 });
});
it('updates the total independently of holdings and refreshes rows when the holdings change',()=>{
 const value=vi.fn(()=>20);
 const holdings=[{...sol,get value(){return value();}}];
 const view=render(<AccountBlock assets={holdings} balance={20}/>);
 expect(value).toHaveBeenCalled();
 value.mockClear();
 view.rerender(<AccountBlock assets={holdings} balance={21}/>);
 expect(spoken(view.container.querySelector('.hig-account-balance')!)).toContain('21');
 expect(value).not.toHaveBeenCalled();
 view.rerender(<AccountBlock assets={[hype]} balance={759}/>);
 expect(screen.getByText(hype.name)).toBeTruthy();
});

it.each([false,true])('windows 1,000 holdings and tabs past non-selectable rows (sectioned=%s)',async(sectioned)=>{
 const assets=Array.from({length:1000},(_,i)=>({id:String(i),name:'Holding '+i,symbol:i===0?'USDC':'A'+i,value:i,selectable:i===10||i===900||i===990}));
 const section={id:'wallet',title:'Wallet',assets,order:'given' as const};
 const select=vi.fn();
 render(<AccountBlock {...(sectioned?{sections:[section]}:{assets})} order='given' onAssetSelect={select}/>);
 const rows=await screen.findAllByRole('listitem');
 expect(rows.length).toBeLessThan(25);
 expect(rows[0].getAttribute('aria-setsize')).toBe('1000');
 expect(rows[0].getAttribute('data-pinned')).toBe('true');
 const user=userEvent.setup();
 await user.tab();expect(document.activeElement?.textContent).toContain('Holding 10');
 await user.tab();expect(document.activeElement?.textContent).toContain('Holding 900');
 await user.keyboard('{Enter}');
 expect(select.mock.calls[0]).toEqual(sectioned?[assets[900],section]:[assets[900]]);
 await user.tab();expect(document.activeElement?.textContent).toContain('Holding 990');
 await user.tab({shift:true});expect(document.activeElement?.textContent).toContain('Holding 900');
});

it('windows the initial server render when small sections collectively exceed 50 holdings',async()=>{
 const {renderToStaticMarkup}=await import('react-dom/server');
 const assets=Array.from({length:40},(_,i)=>({id:String(i),name:'Holding '+i,symbol:'A'+i,value:i}));
 const sections=Array.from({length:25},(_,i)=>({id:String(i),title:'Wallet '+i,assets}));
 const html=renderToStaticMarkup(<AccountBlock sections={sections} order='given'/>);
 expect((html.match(/<li\b/g)??[]).length).toBe(16);
 expect((html.match(/<h3\b/g)??[]).length).toBe(25);
});

it('reads each holding value once when ranking and skips it for host order',()=>{
 const read=vi.fn((i:number)=>i%3===0?null:i);
 const holdings=Array.from({length:1000},(_,i)=>({id:String(i),symbol:'A',name:'Asset '+i,get value(){return read(i);}}));
 const {rest}=accountRows(holdings);
 expect(rest[0]).toBe(holdings[998]);
 expect(read).toHaveBeenCalledTimes(holdings.length);
 read.mockClear();
 expect(accountRows(holdings,'USDC',{order:'given'}).rest).toEqual(holdings);
 expect(read).not.toHaveBeenCalled();
});

it.each([false,true])('keeps holdings when the selection handler changes (sectioned=%s)',async(sectioned)=>{
 const read=vi.fn((i:number)=>i);
 const holdings=Array.from({length:1000},(_,i)=>({id:String(i),symbol:'A',name:'Asset '+i,get value(){return read(i);}}));
 const section={id:'wallet',title:'Wallet',assets:holdings};
 const data=sectioned?{sections:[section]}:{assets:holdings};
 const first=vi.fn(),second=vi.fn();
 const {rerender}=render(<AccountBlock {...data} onAssetSelect={first}/>);
 await screen.findByRole('button',{name:/Asset 999/});
 read.mockClear();
 rerender(<AccountBlock {...data} onAssetSelect={second}/>);
 expect(read).not.toHaveBeenCalled();
 await userEvent.click(screen.getByRole('button',{name:/Asset 999/}));
 expect(second.mock.calls).toEqual([sectioned?[holdings[999],section]:[holdings[999]]]);
 expect(first).not.toHaveBeenCalled();
 rerender(<AccountBlock {...data}/>);
 expect(screen.queryByRole('button',{name:/Asset 999/})).toBeNull();
});

it('reuses each section valuation for its heading and the account balance',async()=>{
 const read=vi.fn(()=>9);
 const assets=Array.from({length:1000},(_,i)=>({id:String(i),name:'Token '+i,symbol:'T',get value(){return read();}}));
 const sections=[{id:'wallet',title:'Wallet',order:'given' as const,assets}];
 const {container,rerender}=render(<AccountBlock sections={sections}/>);
 const rows=await screen.findAllByRole('listitem');
 expect(read).toHaveBeenCalledTimes(assets.length+rows.length);
 expect(spoken(container.querySelector('.hig-account-section-total')!)).toContain('9,000');
 read.mockClear();
 rerender(<AccountBlock sections={sections} balance={20}/>);
 expect(read).not.toHaveBeenCalled();
 rerender(<AccountBlock sections={[{...sections[0],assets:[{...usdc,value:13}]}]}/>);
 expect(spoken(container.querySelector('.hig-account-section-total')!)).toContain('13');
 expect(spoken(container.querySelector('.hig-account-balance')!)).toContain('13');
});

it('updates a wallet without reading holdings in an unchanged wallet',async()=>{
 const read=vi.fn((i:number)=>i);
 const assets=Array.from({length:1000},(_,i)=>({id:String(i),name:'Holding '+i,symbol:'A',get value(){return read(i);}}));
 const stable={id:'stable',title:'Stable',assets};
 const wallet={id:'wallet',title:'Wallet',assets:[sol],total:10};
 const {rerender,container}=render(<AccountBlock sections={[stable,wallet]}/>);
 await screen.findByText('Holding 999');
 expect(read).toHaveBeenCalled();
 read.mockClear();
 rerender(<AccountBlock sections={[stable,{...wallet,total:20}]}/>);
 expect(read).not.toHaveBeenCalled();
 expect(spoken(container.querySelectorAll('.hig-account-section-total')[1])).toContain('20');
 rerender(<AccountBlock sections={[{...stable,pinnedId:'800'},wallet]}/>);
 expect(container.querySelector('[data-pinned]')?.textContent).toContain('Holding 800');
});

it('updates an explicit wallet total without ranking unchanged holdings again',async()=>{
 const read=vi.fn((i:number)=>i),select=vi.fn();
 const assets=Array.from({length:1000},(_,i)=>({id:String(i),name:'Token '+i,symbol:'T',get value(){return read(i);}}));
 const wallet={id:'wallet',title:'Wallet',total:20,assets};
 const {rerender}=render(<AccountBlock sections={[wallet]} onAssetSelect={select}/>);
 await screen.findByRole('button',{name:/Token 999/});
 read.mockClear();
 const updated={...wallet,total:30};
 rerender(<AccountBlock sections={[updated]} onAssetSelect={select}/>);
 expect(read).not.toHaveBeenCalled();
 await userEvent.click(screen.getByRole('button',{name:/Token 999/}));
 expect(select.mock.calls[0][1]).toBe(updated);
});

it('preserves holding order for equal names, unknown values and numeric extremes',()=>{
 const names=['é','e\u0301','ß','SS','한','東京','A','a','A2','😀'];
 const values=[Number.MAX_VALUE,-Number.MAX_VALUE,Number.MIN_VALUE,-0,0,1.25,-4.5,null,NaN,Infinity,-Infinity];
 const holdings=Array.from({length:441},(_,i)=>({id:String(i),symbol:'T',name:names[i*7%names.length],value:values[i*5%values.length]}));
 const expected=[...holdings].sort((a,b)=>{
  const x=assetValue(a),y=assetValue(b);
  return x===y?a.name.localeCompare(b.name):x===null?1:y===null?-1:y-x;
 });
 const actual=accountRows(holdings).rest;
 expect(actual).toHaveLength(expected.length);
 expect(actual.every((asset,i)=>asset===expected[i])).toBe(true);
});

it('finds the tab boundaries without indexing every selectable holding on open',()=>{
 const selectable=vi.fn(()=>true);
 const assets=Array.from({length:10000},(_,i)=>({id:String(i),name:'Holding '+i,symbol:'T',value:i,get selectable(){return selectable();}}));
 const {container}=render(<AccountBlock balance={1} assets={assets} order='given' onAssetSelect={()=>{}}/>);
 const mounted=container.querySelectorAll('li').length;
 expect(selectable.mock.calls.length).toBeLessThanOrEqual(mounted+2);
});

it('includes the initial window of a large unsectioned wallet in server HTML',async()=>{
 const {renderToString}=await import('react-dom/server');
 const assets=Array.from({length:1000},(_,i)=>({id:String(i),name:'Asset '+i,symbol:'T'+i,value:i}));
 const html=renderToString(<AccountBlock assets={assets}/>);
 expect(html).toContain('Asset 999');
 expect(html).toContain('aria-setsize="1001"');
 expect(html.match(/<li\b/g)?.length).toBeLessThan(50);
});

it('reuses a calculated wallet balance after an explicit override clears',async()=>{
 const read=vi.fn(()=>2);
 const assets=Array.from({length:1000},(_,i)=>({id:String(i),name:'Asset '+i,symbol:'T',get value(){return read();}}));
 const view=render(<AccountBlock assets={assets} order="given"/>);
 await screen.findAllByRole('listitem');
 view.rerender(<AccountBlock assets={assets} order="given" balance={42}/>);
 read.mockClear();
 view.rerender(<AccountBlock assets={assets} order="given"/>);
 expect(spoken(view.container.querySelector('.hig-account-balance')!)).toContain('2,000');
 expect(read).not.toHaveBeenCalled();
});
