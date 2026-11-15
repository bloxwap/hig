// @vitest-environment jsdom
import React from 'react';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {cleanup,render,screen,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {readFileSync} from 'node:fs';
import {HIGProvider} from '../packages/hig/react/src/provider';
import {ManagePosition,positionCorridor,type ManagePositionProps} from '../packages/hig/react/src/blocks/manage-position';
import * as en from '../packages/hig/contracts/src/messages';
afterEach(cleanup);
const spoken=(element:Element)=>{const copy=element.cloneNode(true) as Element;for(const visual of copy.querySelectorAll('.hig-animated-number-visual'))visual.remove();return copy.textContent;};
const labels={title:'Manage Position',margin:'Margin',notional:'Notional',liquidation:'Liquidation',toLiquidation:(percent:string)=>`${percent} to liquidation`,mark:'Mark',entry:'Entry',long:'Long',short:'Short'};
const base:ManagePositionProps={labels,mode:'Demo',side:'long',entry:64700,mark:64696,liquidation:63082,margin:10,notional:399.98,actions:[]};
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
describe('ManagePosition',()=>{
 it('titles the first card with the mode, reads the share to liquidation, and draws margin against notional',()=>{
  const view=render(<ManagePosition {...base}/>);
  expect(screen.getByRole('heading',{name:'Manage Position'})).toBeTruthy();
  // 1618 of price between liquidation and entry; the mark has given up 4 of it.
  expect(description('Demo')).toBe('99.8% to liquidation');
  expect(within(bar('Demo')).getAllByRole('listitem').map(item=>item.textContent)).toEqual(['Margin$10.002.5%','Notional$399.9897.5%']);
  expect(grow('Demo')).toEqual([['segment','info',0.025],['segment','positive',0.975]]);
  // Without a mode the title is the margin label; unknown prices read as the unknown dash in the same sentence.
  view.rerender(<ManagePosition {...base} mode={undefined} mark={null}/>);expect(description('Margin')).toBe('— to liquidation');
 });
 it('draws the liquidation bar from liquidation to entry, filled with what remains, with the three prices and no trailing text',()=>{
  const view=render(<ManagePosition {...base}/>);
  expect(bar('Liquidation').querySelector('.hig-bar-mark-description')).toBeNull();
  expect(within(bar('Liquidation')).getAllByRole('listitem').map(item=>item.textContent)).toEqual(['Liquidation$63,0820%','Mark$64,69699.8%','Entry$64,7000.2%']);
  expect(grow('Liquidation')).toEqual([['segment','positive',0.9975],['segment','muted',0.0025]]);
  // Under a quarter left the remaining part turns negative; prices take the host format.
  view.rerender(<ManagePosition {...base} side='short' entry={3500} mark={3710} liquidation={3780} priceOptions={{style:'currency',currency:'USD'}}/>);
  expect(description('Demo')).toBe('25% to liquidation');expect(grow('Liquidation')).toEqual([['segment','positive',0.25],['segment','muted',0.75]]);
  view.rerender(<ManagePosition {...base} side='short' entry={3500} mark={3711} liquidation={3780} priceOptions={{style:'currency',currency:'USD'}}/>);
  expect(grow('Liquidation')[0][1]).toBe('negative');expect(within(bar('Liquidation')).getAllByRole('listitem')[1].textContent).toBe('Mark$3,711.0024.6%');
  // Unknown prices: an empty track.
  view.rerender(<ManagePosition {...base} mark={null} liquidation={null}/>);
  expect(description('Demo')).toBe('— to liquidation');expect(grow('Liquidation')).toEqual([['rest',undefined,1]]);expect(within(bar('Liquidation')).getAllByRole('listitem').map(item=>item.textContent)).toEqual(['Liquidation—0%','Mark—0%','Entry$64,7000%']);
 });
 it('lists the host actions as rows in order, and reports presses only for enabled ones',async()=>{
  const stop=vi.fn(),take=vi.fn(),close=vi.fn(),back=vi.fn();
  render(<ManagePosition {...base} onBack={back} actions={[{id:'stop-loss',label:'Stop Loss',onSelect:stop},{id:'take-profit',label:'Take Profit',onSelect:take,disabled:true},{id:'close',label:'Close',onSelect:close}]}/>);
  const rows=[...document.querySelectorAll<HTMLButtonElement>('.hig-token-actions > button')];expect(rows.map(row=>row.textContent)).toEqual(['Stop Loss','Take Profit','Close']);
  for(const row of rows)await userEvent.click(row);await userEvent.click(screen.getByRole('button',{name:'Back'}));
  expect(stop).toHaveBeenCalledTimes(1);expect(take).not.toHaveBeenCalled();expect(close).toHaveBeenCalledTimes(1);expect(back).toHaveBeenCalledTimes(1);
  expect(rows.every(row=>row.querySelector('svg')!==null)).toBe(true);
 });
 it('shows the position row with the side read out, leverage, size, and toned profit and loss',()=>{
  const view=render(<ManagePosition {...base} position={{name:'Bitcoin',leverage:40,size:0.006182,pnl:-0.0247,pnlPercent:-0.0025}}/>);
  const row=()=>document.querySelector('.hig-position-row')!;
  expect(spoken(row())).toBe('BitBitcoin↑Long 40× · 0.006182-$0.0247-0.25%');expect(row().querySelector('.hig-position-side')!.getAttribute('aria-hidden')).toBe('true');
  expect(row().querySelector('.hig-position-side')!.getAttribute('data-side')).toBe('long');expect(row().querySelector('.hig-asset-row-amounts strong')!.getAttribute('data-tone')).toBe('down');
  view.rerender(<ManagePosition {...base} side='short' position={{name:'Ether',icon:'/eth.png',pnl:12.5,pnlPercent:0.05}}/>);
  expect(spoken(row())).toBe('Ether↓Short+$12.50+5.00%');expect(row().querySelector('img')?.getAttribute('src')).toBe('/eth.png');expect(row().querySelector('.hig-asset-row-amounts strong')!.getAttribute('data-tone')).toBe('up');
  view.rerender(<ManagePosition {...base}/>);expect(document.querySelector('.hig-position-row')).toBeNull();expect(document.querySelector('.hig-token-actions')).toBeNull();
 });
 it('ships no trading words of its own: every label is the host\'s, in any language',()=>{
  const fr={title:'Gérer la position',margin:'Marge',notional:'Notionnel',liquidation:'Liquidation',toLiquidation:(percent:string)=>`${percent} avant liquidation`,mark:'Marque',entry:'Entrée',long:'Achat',short:'Vente'};
  render(<HIGProvider locale='fr-FR'><ManagePosition {...base} labels={fr} position={{name:'Bitcoin',pnl:1,pnlPercent:0.01}}/></HIGProvider>);
  expect(screen.getByRole('heading',{name:'Gérer la position'})).toBeTruthy();expect(description('Demo')).toBe('99,8% avant liquidation');expect([...bar('Demo').querySelectorAll('li > span:nth-child(2)')].map(label=>label.textContent)).toEqual(['Marge','Notionnel']);
  expect(document.querySelector('.hig-position-row .hig-sr-only')!.textContent).toBe('Achat');
  const source=readFileSync('packages/hig/react/src/blocks/manage-position.tsx','utf8');expect(source).not.toMatch(/messages\./);
  for(const key of ['margin','notional','liquidation','mark','entry','stopLoss','takeProfit','managePosition'])expect(key in en,key).toBe(false);
 });
});
