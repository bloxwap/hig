// @vitest-environment jsdom
import React from 'react';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {cleanup,render,screen,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {readFileSync} from 'node:fs';
import {HIGProvider} from '../packages/hig/react/src/provider';
import {ManagePositionCard,positionCorridor,type ManagePositionCardProps} from '../packages/hig/react/src/blocks/manage-position-card';
import * as en from '../packages/hig/contracts/src/messages';
afterEach(cleanup);
const spoken=(element:Element)=>{const copy=element.cloneNode(true) as Element;for(const visual of copy.querySelectorAll('.hig-animated-number-visual'))visual.remove();return copy.textContent;};
const labels={title:'Manage Position',margin:'Margin',notional:'Notional',liquidation:'Liquidation',toLiquidation:(percent:string)=>`${percent} to liquidation`,mark:'Mark',entry:'Entry',long:'Long',short:'Short'};
const base:ManagePositionCardProps={labels,mode:'Demo',side:'long',entry:64700,mark:64696,liquidation:63082,margin:10,notional:399.98,actions:[]};
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
describe('ManagePositionCard',()=>{
 it('titles the first card with the mode, reads the share to liquidation, and draws margin against notional',()=>{
  const view=render(<ManagePositionCard {...base}/>);
  expect(screen.getByRole('heading',{name:'Manage Position'})).toBeTruthy();
  // 1618 of price between liquidation and entry; the mark has given up 4 of it.
  expect(description('Demo')).toBe('99.8% to liquidation');expect(bar('Demo').classList.contains('hig-surface')).toBe(false);
  expect(within(bar('Demo')).getAllByRole('listitem').map(item=>item.textContent)).toEqual(['Margin$10.002.5%','Notional$399.9897.5%']);
  expect(grow('Demo')).toEqual([['segment','info',0.025],['segment','positive',0.975]]);
  // Without a mode the title is the margin label; unknown prices read as the unknown dash in the same sentence.
  view.rerender(<ManagePositionCard {...base} mode={undefined} mark={null}/>);expect(description('Margin')).toBe('— to liquidation');
 });
 it('draws the prices as a BarPnl under the margin bar, compact, with the host labels, and neither bar in a card',()=>{
  const view=render(<ManagePositionCard {...base}/>);
  const bars=document.querySelector('.hig-token-bars')!;expect([...bars.children].map(child=>child.className)).toEqual(['hig-bar-mark','hig-bar-pnl']);
  // Read-only data sits on the screen: no surface on either bar, while the things to press keep theirs.
  expect([...bars.children].map(child=>(child as HTMLElement).dataset.surface)).toEqual(['false','false']);expect(bars.querySelector('.hig-surface')).toBeNull();
  const prices=()=>[...document.querySelectorAll('.hig-bar-pnl-readouts > div')].map(item=>[item.querySelector('dt')!.textContent,spoken(item.querySelector('dd')!)]);
  expect(prices()).toEqual([['Liquidation','$63,082'],['Mark','$64,696'],['Entry','$64,700']]);expect(document.querySelector('.hig-bar-pnl')!.getAttribute('data-result')).toBe('loss');
  expect(document.querySelector('.hig-bar-pnl-header,.hig-bar-pnl-title')).toBeNull();
  // A short in loss reads the other way round; compact keeps cents where they matter and the host can change the currency.
  view.rerender(<ManagePositionCard {...base} side='short' entry={3500} mark={3710.5} liquidation={3780} priceOptions={{style:'currency',currency:'EUR'}}/>);
  expect(description('Demo')).toBe('24.8% to liquidation');expect(prices()).toEqual([['Entry','€3,500'],['Mark','€3,711'],['Liquidation','€3,780']]);
  view.rerender(<ManagePositionCard {...base} entry={0.5} mark={0.4821} liquidation={0.3}/>);expect(prices().map(([,price])=>price)).toEqual(['$0.3','$0.4821','$0.5']);
  // Unknown prices read as the unknown dash in both elements.
  view.rerender(<ManagePositionCard {...base} mark={null} liquidation={null}/>);expect(description('Demo')).toBe('— to liquidation');expect(prices().find(([label])=>label==='Entry')![1]).toBe('$64,700');
 });
 it('lists the host actions as rows in order, and reports presses only for enabled ones',async()=>{
  const stop=vi.fn(),take=vi.fn(),close=vi.fn(),back=vi.fn();
  render(<ManagePositionCard {...base} onBack={back} actions={[{id:'stop-loss',label:'Stop Loss',onSelect:stop},{id:'take-profit',label:'Take Profit',onSelect:take,disabled:true},{id:'close',label:'Close',onSelect:close}]}/>);
  const rows=[...document.querySelectorAll<HTMLButtonElement>('.hig-token-actions > button')];expect(rows.map(row=>row.textContent)).toEqual(['Stop Loss','Take Profit','Close']);
  for(const row of rows)await userEvent.click(row);await userEvent.click(screen.getByRole('button',{name:'Back'}));
  expect(stop).toHaveBeenCalledTimes(1);expect(take).not.toHaveBeenCalled();expect(close).toHaveBeenCalledTimes(1);expect(back).toHaveBeenCalledTimes(1);
  expect(rows.every(row=>row.querySelector('svg')!==null)).toBe(true);
 });
 it('shows the position row with the side read out, leverage, size, and toned profit and loss',()=>{
  const view=render(<ManagePositionCard {...base} position={{name:'Bitcoin',leverage:40,size:0.006182,pnl:-0.0247,pnlPercent:-0.0025}}/>);
  const row=()=>document.querySelector('.hig-position-row')!;
  expect(spoken(row())).toBe('BitBitcoin↑Long 40× · 0.006182-$0.0247-0.25%');expect(row().querySelector('.hig-position-side')!.getAttribute('aria-hidden')).toBe('true');
  expect(row().querySelector('.hig-position-side')!.getAttribute('data-side')).toBe('long');expect(row().querySelector('.hig-asset-row-amounts strong')!.getAttribute('data-tone')).toBe('down');
  view.rerender(<ManagePositionCard {...base} side='short' position={{name:'Ether',icon:'/eth.png',pnl:12.5,pnlPercent:0.05}}/>);
  expect(spoken(row())).toBe('Ether↓Short+$12.50+5.00%');expect(row().querySelector('img')?.getAttribute('src')).toBe('/eth.png');expect(row().querySelector('.hig-asset-row-amounts strong')!.getAttribute('data-tone')).toBe('up');
  view.rerender(<ManagePositionCard {...base}/>);expect(document.querySelector('.hig-position-row')).toBeNull();expect(document.querySelector('.hig-token-actions')).toBeNull();
 });
 it('ships no trading words of its own: every label is the host\'s, in any language',()=>{
  const fr={title:'Gérer la position',margin:'Marge',notional:'Notionnel',liquidation:'Liquidation',toLiquidation:(percent:string)=>`${percent} avant liquidation`,mark:'Marque',entry:'Entrée',long:'Achat',short:'Vente'};
  render(<HIGProvider locale='fr-FR'><ManagePositionCard {...base} labels={fr} position={{name:'Bitcoin',pnl:1,pnlPercent:0.01}}/></HIGProvider>);
  expect(screen.getByRole('heading',{name:'Gérer la position'})).toBeTruthy();expect(description('Demo')).toBe('99,8% avant liquidation');expect([...bar('Demo').querySelectorAll('li > span:nth-child(2)')].map(label=>label.textContent)).toEqual(['Marge','Notionnel']);
  expect(document.querySelector('.hig-position-row .hig-sr-only')!.textContent).toBe('Achat');
  const source=readFileSync('packages/hig/react/src/blocks/manage-position-card.tsx','utf8');expect(source).not.toMatch(/messages\./);
  for(const key of ['margin','notional','liquidation','mark','entry','stopLoss','takeProfit','managePosition'])expect(key in en,key).toBe(false);
 });
});
