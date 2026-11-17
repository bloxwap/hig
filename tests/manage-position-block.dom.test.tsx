// @vitest-environment jsdom
import React from 'react';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {readFileSync} from 'node:fs';
import {HIGProvider} from '../packages/hig/react/src/provider';
import {ManagePositionBlock,positionCorridor,type ManagePositionBlockProps} from '../packages/hig/react/src/blocks/manage-position-block';
import * as en from '../packages/hig/contracts/src/messages';
afterEach(cleanup);
const spoken=(element:Element)=>{const copy=element.cloneNode(true) as Element;for(const visual of copy.querySelectorAll('.hig-animated-number-visual'))visual.remove();return copy.textContent;};
const labels={title:'Manage Position',margin:'Margin',notional:'Notional',liquidation:'Liquidation',toLiquidation:(percent:string)=>`${percent} to liquidation`,mark:'Mark',entry:'Entry',long:'Long',short:'Short'};
const base:ManagePositionBlockProps={labels,mode:'Demo',side:'long',entry:64700,mark:64696,liquidation:63082,margin:10,notional:399.98,actions:[]};
const bar=(name:string)=>screen.getByRole('region',{name}),description=(name:string)=>spoken(bar(name).querySelector('.hig-bar-mark-description')!);
const grow=(name:string)=>[...bar(name).querySelectorAll<HTMLElement>('.hig-bar-mark-bar > span')].map(part=>[part.className.replace('hig-bar-mark-',''),part.dataset.tone,Number(Number(part.style.flexGrow).toFixed(4))]);
describe('positionCorridor',()=>{
 it('measures what is left between the mark and liquidation for a long and a short',()=>{
  expect(positionCorridor({side:'long',entry:100,mark:90,liquidation:60})).toEqual({total:40,buffer:30,drawdown:10,share:0.75});
  expect(positionCorridor({side:'short',entry:100,mark:110,liquidation:140})).toEqual({total:40,buffer:30,drawdown:10,share:0.75});
 });
 it('is full in profit, empty past liquidation, and unknown without both prices or with liquidation on the wrong side',()=>{
  expect(positionCorridor({side:'long',entry:100,mark:120,liquidation:60})).toEqual({total:40,buffer:40,drawdown:0,share:1});
  expect(positionCorridor({side:'long',entry:100,mark:50,liquidation:60})).toEqual({total:40,buffer:0,drawdown:40,share:0});
  const none={total:0,buffer:0,drawdown:0,share:null};
  expect(positionCorridor({side:'long',entry:100,mark:null,liquidation:60})).toEqual(none);expect(positionCorridor({side:'long',entry:100,mark:90})).toEqual(none);
  expect(positionCorridor({side:'long',entry:100,mark:90,liquidation:140})).toEqual(none);expect(positionCorridor({side:'short',entry:100,mark:90,liquidation:100})).toEqual(none);
 });
});
describe('ManagePositionBlock',()=>{
 it('titles the first card with the mode, reads the share to liquidation, and draws margin against notional',()=>{
  const view=render(<ManagePositionBlock {...base}/>);
  expect(screen.getByRole('heading',{name:'Manage Position'})).toBeTruthy();
  // 1618 of price between liquidation and entry; the mark has given up 4 of it.
  expect(description('Demo')).toBe('99.8% to liquidation');expect(bar('Demo').classList.contains('hig-surface')).toBe(false);
  expect(within(bar('Demo')).getAllByRole('listitem').map(item=>item.textContent)).toEqual(['Margin$10.002.5%','Notional$399.9897.5%']);
  expect(grow('Demo')).toEqual([['segment','info',0.025],['segment','positive',0.975]]);
  // Without a mode the title is the margin label; unknown prices read as the unknown dash in the same sentence.
  view.rerender(<ManagePositionBlock {...base} mode={undefined} mark={null}/>);expect(description('Margin')).toBe('— to liquidation');
 });
 it('draws the prices as a BarPnl under the margin bar, compact, with the host labels, and neither bar in a card',()=>{
  const view=render(<ManagePositionBlock {...base}/>);
  const bars=document.querySelector('.hig-token-bars')!;expect([...bars.children].map(child=>child.className)).toEqual(['hig-bar-mark','hig-bar-pnl']);
  // Read-only data sits on the screen: no surface on either bar, while the things to press keep theirs.
  expect([...bars.children].map(child=>(child as HTMLElement).dataset.surface)).toEqual(['false','false']);expect(bars.querySelector('.hig-surface')).toBeNull();
  const prices=()=>[...document.querySelectorAll('.hig-bar-pnl-readouts > div')].map(item=>[item.querySelector('dt')!.textContent,spoken(item.querySelector('dd')!)]);
  expect(prices()).toEqual([['Liquidation','$63,082'],['Mark','$64,696'],['Entry','$64,700']]);expect(document.querySelector('.hig-bar-pnl')!.getAttribute('data-result')).toBe('loss');
  expect(document.querySelector('.hig-bar-pnl-header,.hig-bar-pnl-title')).toBeNull();
  // A short in loss reads the other way round; compact keeps cents where they matter and the host can change the currency.
  view.rerender(<ManagePositionBlock {...base} side='short' entry={3500} mark={3710.5} liquidation={3780} priceOptions={{style:'currency',currency:'EUR'}}/>);
  expect(description('Demo')).toBe('24.8% to liquidation');expect(prices()).toEqual([['Entry','€3,500'],['Mark','€3,711'],['Liquidation','€3,780']]);
  view.rerender(<ManagePositionBlock {...base} entry={0.5} mark={0.4821} liquidation={0.3}/>);expect(prices().map(([,price])=>price)).toEqual(['$0.3','$0.4821','$0.5']);
  // Unknown prices read as the unknown dash in both elements.
  view.rerender(<ManagePositionBlock {...base} mark={null} liquidation={null}/>);expect(description('Demo')).toBe('— to liquidation');expect(prices().find(([label])=>label==='Entry')![1]).toBe('$64,700');
 });
 it('lists the host actions as one list group of rows in order, and reports presses only for enabled ones',async()=>{
  const stop=vi.fn(),take=vi.fn(),close=vi.fn(),back=vi.fn();
  render(<ManagePositionBlock {...base} onBack={back} actions={[{id:'stop-loss',label:'Stop Loss',onSelect:stop},{id:'take-profit',label:'Take Profit',onSelect:take,disabled:true},{id:'close',label:'Close',onSelect:close}]}/>);
  const group=document.querySelector('.hig-manage-actions')!;expect(group.classList.contains('hig-list-group')).toBe(true);expect(document.querySelectorAll('.hig-manage-position-block .hig-list-group')).toHaveLength(1);
  const rows=[...group.querySelectorAll<HTMLButtonElement>('.hig-list-group-rows > li > button.hig-list-row')];expect(rows.map(row=>row.textContent)).toEqual(['Stop Loss','Take Profit','Close']);expect(rows[1].disabled).toBe(true);expect(document.querySelector('.hig-manage-position-block .hig-swap-setting')).toBeNull();
  for(const row of rows)await userEvent.click(row);await userEvent.click(screen.getByRole('button',{name:'Back'}));
  expect(stop).toHaveBeenCalledTimes(1);expect(take).not.toHaveBeenCalled();expect(close).toHaveBeenCalledTimes(1);expect(back).toHaveBeenCalledTimes(1);
  expect(rows.every(row=>row.querySelector('svg')!==null)).toBe(true);
 });
 it('shows the position row with the side read out, leverage, size, and toned profit and loss',()=>{
  const view=render(<ManagePositionBlock {...base} position={{name:'Bitcoin',leverage:40,size:0.006182,pnl:-0.0247,pnlPercent:-0.0025}}/>);
  const row=()=>document.querySelector('.hig-position-row')!;
  expect(spoken(row())).toBe('BitBitcoin↑Long 40× · 0.006182-$0.0247-0.25%');
  // The leverage takes the arrow's colour: both are the side.
  expect(row().querySelector('.hig-position-leverage')!.getAttribute('data-side')).toBe('long');expect(row().querySelector('.hig-position-leverage')!.classList.contains('hig-position-side')).toBe(true);expect(row().querySelector('.hig-position-side')!.getAttribute('aria-hidden')).toBe('true');
  expect(row().querySelector('.hig-position-side')!.getAttribute('data-side')).toBe('long');expect(row().querySelector('.hig-asset-row-amounts strong')!.getAttribute('data-tone')).toBe('down');
  view.rerender(<ManagePositionBlock {...base} side='short' position={{name:'Ether',icon:'/eth.png',pnl:12.5,pnlPercent:0.05}}/>);
  expect(spoken(row())).toBe('Ether↓Short+$12.50+5.00%');expect(row().querySelector('img')?.getAttribute('src')).toBe('/eth.png');expect(row().querySelector('.hig-asset-row-amounts strong')!.getAttribute('data-tone')).toBe('up');
  view.rerender(<ManagePositionBlock {...base}/>);expect(document.querySelector('.hig-position-row')).toBeNull();expect(document.querySelector('.hig-manage-actions')).toBeNull();
 });
 it('ships no trading words of its own: every label is the host\'s, in any language',()=>{
  const fr={title:'Gérer la position',margin:'Marge',notional:'Notionnel',liquidation:'Liquidation',toLiquidation:(percent:string)=>`${percent} avant liquidation`,mark:'Marque',entry:'Entrée',long:'Achat',short:'Vente'};
  render(<HIGProvider locale='fr-FR'><ManagePositionBlock {...base} labels={fr} position={{name:'Bitcoin',pnl:1,pnlPercent:0.01}}/></HIGProvider>);
  expect(screen.getByRole('heading',{name:'Gérer la position'})).toBeTruthy();expect(description('Demo')).toBe('99,8% avant liquidation');expect([...bar('Demo').querySelectorAll('li > span:nth-child(2)')].map(label=>label.textContent)).toEqual(['Marge','Notionnel']);
  expect(document.querySelector('.hig-position-row .hig-sr-only')!.textContent).toBe('Achat');
  const source=readFileSync('packages/hig/react/src/blocks/manage-position-block.tsx','utf8');expect(source).not.toMatch(/messages\./);
  for(const key of ['margin','notional','liquidation','mark','entry','stopLoss','takeProfit','managePosition'])expect(key in en,key).toBe(false);
 });
});
describe('ManagePositionBlock host slots',()=>{
 it('puts a trailing value with an optional tone on an action row, as host text or a live figure',async()=>{
  const cancel=vi.fn();
  render(<ManagePositionBlock {...base} actions={[{id:'tp',label:'Take Profit',value:{value:66000,options:{style:'currency',currency:'USD',maximumFractionDigits:0}},tone:'positive',onSelect:cancel},{id:'sl',label:'Stop Loss',value:'$63,500',tone:'negative',onSelect:()=>{}},{id:'close',label:'Close',onSelect:()=>{}}]}/>);
  const rows=[...document.querySelectorAll<HTMLButtonElement>('.hig-manage-actions .hig-list-row')];
  expect(rows.map(row=>[spoken(row.querySelector('.hig-list-row-label')!),row.querySelector('.hig-list-row-value')?spoken(row.querySelector('.hig-list-row-value')!):null,row.querySelector('.hig-manage-action-value')?.getAttribute('data-tone')??null])).toEqual([['Take Profit','$66,000','positive'],['Stop Loss','$63,500','negative'],['Close',null,null]]);
  expect(rows[0].querySelector('.hig-animated-number-visual')).not.toBeNull();
  // The value sits before the chevron, and the whole row stays the one button.
  const order=[...rows[0].children].map(child=>[...child.classList].find(name=>name.startsWith('hig-')));expect(order.indexOf('hig-list-row-value')).toBeLessThan(order.indexOf('hig-list-row-chevron'));
  await userEvent.click(rows[0]);expect(cancel).toHaveBeenCalledTimes(1);
  const css=readFileSync('packages/hig/react/src/styles.css','utf8');expect(css).toContain(".hig-manage-action-value[data-tone='positive'] { color:var(--hig-positive); }");
 });
 it('adds a badge after the name and a caption under the row, and keeps the row static without onSelect',()=>{
  render(<ManagePositionBlock {...base} position={{name:'Bitcoin',badge:'Papertrade',caption:'Estimated, funding unavailable',pnl:1.5}}/>);
  const row=document.querySelector('.hig-position-row')!;expect(row.tagName).toBe('DIV');
  const badge=row.querySelector('.hig-position-name > .hig-badge.hig-position-badge')!;expect(badge.textContent).toBe('Papertrade');expect(badge.previousElementSibling!.textContent).toBe('Bitcoin');
  const caption=document.querySelector('.hig-position-caption')!;expect(caption.textContent).toBe('Estimated, funding unavailable');expect(caption.previousElementSibling).toBe(row);expect(caption.id).toBe('');
  const rule=readFileSync('packages/hig/react/src/styles.css','utf8').split('\n').find(line=>line.startsWith('.hig-position-caption {'))??'';expect(rule).toContain('margin:-8px 0 0');
 });
 it('makes the position row one button named by the host label and its figures, and described by its caption',async()=>{
  const open=vi.fn();
  render(<ManagePositionBlock {...base} position={{name:'Bitcoin',leverage:40,pnl:-0.0247,pnlPercent:-0.0025,caption:'Stale',label:'View Bitcoin',onSelect:open}}/>);
  const button=document.querySelector<HTMLButtonElement>('button.hig-position-row')!;
  const named=button.getAttribute('aria-labelledby')!.split(' ').map(id=>document.getElementById(id)!);
  expect(named[0].textContent).toBe('View Bitcoin,');expect(named.slice(1).map(node=>node.className)).toEqual(['hig-asset-row-identity','hig-asset-row-amounts']);expect(spoken(named[2])).toBe('-$0.0247-0.25%');
  expect(screen.getByRole('button',{name:/^View Bitcoin, Bitcoin/})).toBe(button);
  const described=button.getAttribute('aria-describedby')!.split(' ').map(id=>document.getElementById(id)!);
  expect(described.map(node=>node.className)).toEqual(['hig-position-caption']);expect(described[0].textContent).toBe('Stale');
  await userEvent.click(button);expect(open).toHaveBeenCalledTimes(1);
 });
 it('draws the symbol as the initials, and a host fallback when the icon fails (Unreleased)',()=>{
  const view=render(<ManagePositionBlock {...base} position={{name:'Bitcoin',symbol:'BTC'}}/>);
  expect(document.querySelector('.hig-asset-row-icon')!.textContent).toBe('BTC');
  view.rerender(<ManagePositionBlock {...base} position={{name:'Bitcoin',symbol:'BTC',icon:failed=><img data-testid='art' alt='' src='/btc.svg' onError={failed}/>,iconFallback:<span data-testid='fallback'/>}}/>);
  const art=screen.getByTestId('art');expect(screen.queryByTestId('fallback')).toBeNull();
  fireEvent.error(art);
  expect(screen.queryByTestId('art')).toBeNull();expect(screen.getByTestId('fallback')).toBeTruthy();
  view.rerender(<ManagePositionBlock {...base} position={{name:'Bitcoin',symbol:'BTC',icon:'/btc.png'}}/>);
  fireEvent.error(document.querySelector('.hig-asset-row-icon img')!);
  expect(document.querySelector('.hig-asset-row-icon')!.textContent).toBe('BTC');
 });
 it('animates a host-formatted action value and reads it (Unreleased)',()=>{
  render(<ManagePositionBlock {...base} actions={[{id:'tp',label:'Take Profit',onSelect:()=>{},value:{value:66000,formattedValue:'66 000 $'}}]}/>);
  const value=document.querySelector('.hig-manage-action-value')!;
  expect(value.querySelector('.hig-sr-only')!.textContent).toBe('66 000 $');
  expect(value.querySelectorAll('.hig-animated-number-visual > span').length).toBeGreaterThan(1);
 });
 it('formats the profit and loss with pnlOptions merged over the default',()=>{
  const view=render(<ManagePositionBlock {...base} position={{name:'Bitcoin',pnl:5.1234}} pnlOptions={{maximumFractionDigits:3}}/>);
  expect(spoken(document.querySelector('.hig-asset-row-amounts strong')!)).toBe('+$5.123');
  view.rerender(<HIGProvider locale='fr-FR' numberFormat={{currencyDisplay:'narrowSymbol'}}><ManagePositionBlock {...base} position={{name:'Bitcoin',pnl:-2}} pnlOptions={{minimumFractionDigits:2}}/></HIGProvider>);
  expect(spoken(document.querySelector('.hig-asset-row-amounts strong')!)).toMatch(/^-2,00\s\$$/);
 });
 it('names the heading for a dialog with headingId',()=>{
  render(<ManagePositionBlock {...base} headingId='manage-title'/>);expect(screen.getByRole('heading',{name:'Manage Position'}).id).toBe('manage-title');
 });
});
