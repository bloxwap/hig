// @vitest-environment jsdom
// Host options the app conversions asked for on the asset rows, the account and token blocks, the pickers, WalletAddress and MarketRow.
import React,{createRef} from 'react';
import {readFileSync} from 'node:fs';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {HIGProvider} from '../packages/hig/react/src/provider';
import {AssetBalanceRow} from '../packages/hig/react/src/asset-balance-row';
import {AccountBlock,accountRows,type AccountAsset} from '../packages/hig/react/src/blocks/account-block';
import {TokenActionBlock} from '../packages/hig/react/src/blocks/token-action-block';
import {FromPickerBlock,ToPickerBlock} from '../packages/hig/react/src/blocks/pickers';
import {WalletAddress as WalletAddressCore} from '../packages/hig/react/src/wallet-address-core';
import {WalletAddress} from '../packages/hig/react/src/wallet-address';
import {MarketRow} from '../packages/hig/react/src/blocks/market-row';
afterEach(cleanup);
const spoken=(element:Element)=>{const copy=element.cloneNode(true) as Element;for(const visual of copy.querySelectorAll('.hig-animated-number-visual'))visual.remove();return copy.textContent;};
const css=readFileSync('packages/hig/react/src/styles.css','utf8').split('\n');
const rule=(start:string)=>css.find(line=>line.startsWith(start))??'';
describe('AssetBalanceRow host options',()=>{
 it('marks the row in use with a check and aria-current, and dims and blocks a disabled row',async()=>{
  const select=vi.fn();
  const view=render(<AssetBalanceRow name='Solana' symbol='SOL' value={203} balance={1.42} selected onSelect={select}/>);
  const button=screen.getByRole('button');expect(button.getAttribute('aria-current')).toBe('true');expect(button.querySelector('.hig-asset-row-check')?.getAttribute('aria-hidden')).toBe('true');
  view.rerender(<AssetBalanceRow name='Solana' symbol='SOL' value={0} balance={0} disabled onSelect={select}/>);
  expect((screen.getByRole('button') as HTMLButtonElement).disabled).toBe(true);expect(screen.getByRole('button').hasAttribute('aria-current')).toBe(false);
  await userEvent.click(screen.getByRole('button'));expect(select).not.toHaveBeenCalled();
  view.rerender(<AssetBalanceRow name='Solana' symbol='SOL' value={0} disabled/>);expect(document.querySelector('.hig-asset-row')!.getAttribute('aria-disabled')).toBe('true');
  expect(rule('.hig-asset-row:is(:disabled,[aria-disabled=\'true\']) strong {')).toContain('color:var(--hig-muted)');
 });
 it('draws no figures for an item to pick, a muted tag under the figures, a units suffix and a trailing slot',()=>{
  const view=render(<AssetBalanceRow name='Card' symbol='Instant' amounts={false}/>);
  expect(document.querySelector('.hig-asset-row-amounts')).toBeNull();expect(spoken(document.querySelector('.hig-asset-row')!)).toBe('InsCardInstant');
  view.rerender(<AssetBalanceRow name='USD Coin' symbol='USDC' value={500} tag='Perp' trailing={<span data-testid='trail'>!</span>}/>);
  expect(spoken(document.querySelector('.hig-asset-row-amounts')!)).toBe('$500.00Perp');expect(document.querySelector('.hig-asset-row-tag')?.tagName).toBe('SMALL');
  expect(screen.getByTestId('trail').closest('.hig-asset-row-trailing')).toBeTruthy();
  view.rerender(<AssetBalanceRow name='Hyperliquid' symbol='HYPE' value={57.97} balance={1.005} unitsSuffix=' HYPE'/>);expect(spoken(document.querySelector('.hig-asset-row-amounts')!)).toBe('$57.971.005 HYPE');
  view.rerender(<AssetBalanceRow name='Hyperliquid' symbol='HYPE' value={null} balance={null} unitsSuffix=' HYPE'/>);expect(spoken(document.querySelector('.hig-asset-row-amounts')!)).toBe('——');
  expect(rule('.hig-asset-row-tag {')).toContain('font-size:.75rem');
 });
});
describe('AccountBlock host options',()=>{
 const perp:AccountAsset={id:'perp',name:'USD Coin',symbol:'USDC',value:500,units:false,tag:'Perp'};
 const spot:AccountAsset={id:'spot',name:'USD Coin',symbol:'USDC',value:20,units:false,tag:'Spot'};
 const hypeSpot:AccountAsset={id:'hype-spot',name:'Hyperliquid',symbol:'HYPE',balance:2,price:40,tag:'Spot'};
 const hypeStaked:AccountAsset={id:'hype-staked',name:'Hyperliquid',symbol:'HYPE',balance:10,price:40,tag:'Staked'};
 it('keeps the given order on the block or per section, pins by id, and draws each tag',()=>{
  expect(accountRows([hypeStaked,spot,perp,hypeSpot],'USDC',{order:'given',pinnedId:'perp'})).toEqual({pinned:perp,rest:[hypeStaked,spot,hypeSpot]});
  const view=render(<AccountBlock sections={[{id:'exchange',title:'Exchange',order:'given',pinnedId:'perp',assets:[spot,hypeStaked,perp,hypeSpot]},{id:'wallet',title:'Wallet',assets:[hypeSpot,hypeStaked]}]}/>);
  const [exchange,wallet]=[...document.querySelectorAll('.hig-account-section')];
  expect([...exchange.querySelectorAll('li')].map(spoken)).toEqual(['USDUSD CoinUSDC$500.00Perp','USDUSD CoinUSDC$20.00Spot','HYPHyperliquidHYPE$400.0010Staked','HYPHyperliquidHYPE$80.002Spot']);
  expect(exchange.querySelector('li')!.getAttribute('data-pinned')).toBe('true');
  // The other section keeps value order.
  expect([...wallet.querySelectorAll('li')].map(item=>spoken(item.querySelector('.hig-asset-row-amounts')!))).toEqual(['$400.0010Staked','$80.002Spot']);
  view.rerender(<AccountBlock order='given' assets={[hypeSpot,hypeStaked]}/>);expect(screen.getAllByRole('listitem').map(item=>spoken(item.querySelector('.hig-asset-row-amounts')!))).toEqual(['$0.00','$80.002Spot','$400.0010Staked']);
  // A row pinned by id keeps its units; the block pinnedId reaches sections that set none.
  view.rerender(<AccountBlock pinnedId='hype-spot' assets={[hypeStaked,hypeSpot]}/>);expect(spoken(screen.getAllByRole('listitem')[0])).toBe('HYPHyperliquidHYPE$80.002Spot');
 });
 it('shows the unknown dash over the units when an asset asks for it, and the units headline by default',()=>{
  const paper:AccountAsset={id:'paper',name:'Paper',symbol:'PAPER',balance:1000,value:null,unitsSuffix:' PAPER'};
  const view=render(<AccountBlock assets={[{...paper,unknownValue:'dash'}]}/>);
  expect(spoken(screen.getAllByRole('listitem')[1].querySelector('.hig-asset-row-amounts')!)).toBe('—1,000 PAPER');
  view.rerender(<AccountBlock assets={[paper]}/>);expect(spoken(screen.getAllByRole('listitem')[1].querySelector('.hig-asset-row-amounts')!)).toBe('1,000 PAPER');
 });
});
describe('TokenActionBlock units headline',()=>{
 it('headlines the units with their suffix when the token has no dollar value, and the dollar total otherwise',()=>{
  const assets=[{label:'Wallet',value:1200}];
  const view=render(<TokenActionBlock symbol='BLOX' name='Bloxwap' units={1234.5} unitsSuffix=' BLOX' assets={assets} actions={[]}/>);
  expect(spoken(document.querySelector('.hig-bar-mark-description, .hig-token-bars')!)).toContain('1,234.5 BLOX');
  view.rerender(<TokenActionBlock symbol='BLOX' name='Bloxwap' value={null} units={null} assets={assets} actions={[]}/>);expect(spoken(document.querySelector('.hig-token-bars')!)).toContain('—');
  view.rerender(<TokenActionBlock symbol='HYPE' name='Hyperliquid' value={759} units={13.2} unitsSuffix=' HYPE' assets={assets} actions={[]}/>);expect(spoken(document.querySelector('.hig-token-bars')!)).toContain('$759.00');expect(spoken(document.querySelector('.hig-token-bars')!)).not.toContain('HYPE');
 });
});
describe('Picker host options',()=>{
 const hype={id:'hype',symbol:'HYPE',name:'Hyperliquid',chain:'Hyperliquid',chainId:999,balance:0,unitsSuffix:' HYPE',detail:'HYPE'};
 const usdc={id:'usdc',symbol:'USDC',name:'USD Coin',chain:'Hyperliquid',chainId:999,balance:12.5,unitsSuffix:' USDC'};
 it('leaves out the search, shows zero balances with their suffix, and reads a detail line in place of the chain',()=>{
  const view=render(<FromPickerBlock tokens={[hype,usdc]} search={false} zeroBalances onSelect={()=>{}}/>);
  expect(screen.queryByRole('searchbox')).toBeNull();expect(document.querySelector('.hig-search-input')).toBeNull();
  const items=screen.getAllByRole('listitem');expect(spoken(items[0])).toContain('Hyperliquid');expect(spoken(items[0])).toContain('0 HYPE');expect(spoken(items[1])).toContain('12.5 USDC');
  expect(items[0].querySelector('.hig-swap-row-text > span')!.textContent).toBe('HYPE');expect(items[1].querySelector('.hig-swap-row-text > span')!.textContent).toBe('Hyperliquid');
  // No arrow-key cursor without a search field.
  expect(document.querySelector('.hig-swap-row[data-active="true"]')).toBeNull();
  view.rerender(<FromPickerBlock tokens={[hype,usdc]} onSelect={()=>{}}/>);expect(spoken(screen.getAllByRole('listitem')[0])).not.toContain('HYPE0');expect(screen.getAllByRole('listitem')[0].querySelector('.hig-swap-row-balance')).toBeNull();
  expect(screen.getByRole('searchbox')).toBeTruthy();
 });
 it('passes attributes, a ref and focus handlers to the search and address inputs, and can label them visibly',async()=>{
  const searchRef=createRef<HTMLInputElement>(),addressRef=createRef<HTMLInputElement>(),focus=vi.fn(),keys=vi.fn(),select=vi.fn();
  render(<ToPickerBlock address='' onAddressChange={()=>{}} addressLabel='Recipient' addressRef={addressRef} addressInputProps={{name:'recipient','data-1p-ignore':true,'data-lpignore':'true',autoComplete:'off',onFocus:focus}}
   tokens={[hype,usdc]} onSelect={select} searchLabel='Asset' searchRef={searchRef} searchInputProps={{name:'asset-search',onKeyDown:keys}}/>);
  const address=screen.getByRole('textbox',{name:'Recipient'}) as HTMLInputElement;
  expect(address).toBe(addressRef.current);expect(address.name).toBe('recipient');expect(address.getAttribute('data-1p-ignore')).toBe('true');expect(address.getAttribute('data-lpignore')).toBe('true');expect(address.hasAttribute('aria-label')).toBe(false);
  expect(screen.getByText('Recipient').tagName).toBe('LABEL');
  fireEvent.focus(address);expect(focus).toHaveBeenCalledTimes(1);
  const search=screen.getByRole('searchbox',{name:'Asset'}) as HTMLInputElement;expect(search).toBe(searchRef.current);expect(search.name).toBe('asset-search');
  // The host key handler runs first; HIG's arrow keys and Enter still drive the list.
  await userEvent.type(search,'{ArrowDown}{Enter}');expect(keys).toHaveBeenCalled();expect(select).toHaveBeenCalledWith(usdc);
 });
});
describe('WalletAddress host options',()=>{
 const eth='0x9e0fD0622874ca1cBf79DA087BaF4622Faf77688';
 it('draws the host QR without cuer from the core entry, and the main entry takes the same qr',()=>{
  const view=render(<WalletAddressCore address={eth} qr={<svg data-testid='host-qr' aria-hidden='true'/>} size={140}/>);
  const img=screen.getByRole('img',{name:'QR code'});expect(within(img).getByTestId('host-qr')).toBeTruthy();expect(img.querySelector('[data-cuer]')).toBeNull();
  view.rerender(<WalletAddress address={eth} qr={<svg data-testid='host-qr' aria-hidden='true'/>}/>);expect(screen.getByTestId('host-qr')).toBeTruthy();
  expect(readFileSync('packages/hig/react/src/wallet-address-core.tsx','utf8')).not.toMatch(/from 'cuer'/);
 });
 it('draws the press decoration in its copy button, and announce={false} raises no notice',async()=>{
  const copy=vi.fn();
  const view=render(<HIGProvider pressDecoration={({kind})=><i data-testid={`decoration-${kind}`}/>}><WalletAddress address={eth} onCopy={copy} announce={false}/></HIGProvider>);
  const button=screen.getByRole('button',{name:`Copy address: ${eth}`});expect(within(button).getByTestId('decoration-row')).toBeTruthy();
  await userEvent.click(button);await Promise.resolve();expect(copy).toHaveBeenCalledTimes(1);expect(screen.queryByRole('status')).toBeNull();
  view.rerender(<WalletAddress address={eth} onCopy={copy}/>);expect(screen.getByRole('status')).toBeTruthy();
 });
});
describe('MarketRow host options',()=>{
 it('draws no dashes when price and change are left out, and carries an icon, detail, trailing content and states',async()=>{
  const select=vi.fn(),down=vi.fn(),ref=createRef<HTMLDivElement>();
  const view=render(<MarketRow ref={ref} symbol='BTC' name='Bitcoin' icon={<img alt='' src='/btc.svg'/>} detail='40×' trailing={<span data-testid='pnl'>+$12.00</span>} selected active data-testid='market-btc' onPointerDown={down} onSelect={select}/>);
  const row=screen.getByTestId('market-btc');expect(row).toBe(ref.current);
  expect(row.querySelector('.hig-market-price')).toBeNull();expect(row.querySelector('.hig-market-change')).toBeNull();expect(row.textContent).not.toContain('—');
  const button=screen.getByRole('button',{name:'Bitcoin (BTC) 40×'});expect(button.getAttribute('aria-current')).toBe('true');
  expect(row.getAttribute('data-active')).toBe('true');expect(row.getAttribute('data-flow')).toBe('true');expect(row.querySelector('.hig-market-check')).toBeTruthy();expect(within(row).getByTestId('pnl').closest('.hig-market-trailing')).toBeTruthy();
  fireEvent.pointerDown(button);expect(down).toHaveBeenCalledTimes(1);await userEvent.click(button);expect(select).toHaveBeenCalledTimes(1);
  view.rerender(<MarketRow symbol='BTC' name='Bitcoin' disabled onSelect={select}/>);expect((screen.getByRole('button') as HTMLButtonElement).disabled).toBe(true);
  view.rerender(<MarketRow mode='presentation' symbol='BTC' name='Bitcoin' selected disabled data-testid='p'/>);
  expect(screen.getByTestId('p').getAttribute('aria-current')).toBe('true');expect(screen.getByTestId('p').getAttribute('aria-disabled')).toBe('true');
  // The default row is unchanged: price and change, no flow, no states.
  view.rerender(<MarketRow symbol='BTC' name='Bitcoin' price={null} change={2.5} onSelect={select}/>);
  const plain=document.querySelector('.hig-market-row')!;expect(plain.hasAttribute('data-flow')).toBe(false);expect(plain.querySelector('.hig-market-price')!.textContent).toBe('—');
  expect(rule('.hig-market-row[data-mode=\'presentation\'][data-flow] {')).toContain('grid-auto-flow:column');
 });
});
