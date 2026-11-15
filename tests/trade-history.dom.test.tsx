// @vitest-environment jsdom
import React from 'react';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {readFileSync} from 'node:fs';
import {HIGProvider} from '../packages/hig/react/src/provider';
import {TradeHistoryCard,tradeHistoryTitle} from '../packages/hig/react/src/blocks/trade-history-card';
import {TradeHistoryDetailCard,type TradeHistoryDetailCardProps} from '../packages/hig/react/src/blocks/trade-history-detail-card';
import * as blocks from '../packages/hig/react/src/blocks';
afterEach(cleanup);
const spoken=(element:Element)=>{const copy=element.cloneNode(true) as Element;for(const visual of copy.querySelectorAll('.hig-animated-number-visual'))visual.remove();return copy.textContent;};
const labels={entry:'Entry',exit:'Exit',long:'Long',short:'Short'};
const prices=()=>[...document.querySelectorAll('.hig-bar-pnl-readouts > div')].map(item=>[item.querySelector('dt')!.textContent,spoken(item.querySelector('dd')!)]);
describe('TradeHistoryCard',()=>{
 it('titles the trade with the ticker, side and leverage in the provider locale',()=>{
  expect(tradeHistoryTitle({symbol:'AMZN',side:'short',leverage:20,labels})).toBe('AMZN · Short 20×');expect(tradeHistoryTitle({symbol:'BTC',side:'long',labels})).toBe('BTC · Long');
  expect(tradeHistoryTitle({symbol:'BTC',side:'long',leverage:1000,labels},'de-DE')).toBe('BTC · Long 1.000×');
 });
 it('draws a closed trade as a bar from entry to exit with the net result, tinted by how the price moved',()=>{
  const view=render(<TradeHistoryCard labels={labels} symbol='AMZN' side='short' leverage={20} entry={267.6} exit={267.18} pnl={1.418}/>);
  const card=()=>screen.getByRole('region',{name:'AMZN · Short 20×'});
  expect(card().classList.contains('hig-surface')).toBe(true);expect(card().dataset.result).toBe('profit');
  expect(spoken(card().querySelector('.hig-trade-pnl')!)).toBe('+$1.418');expect(card().querySelector('.hig-trade-pnl')!.getAttribute('data-tone')).toBe('up');
  // Two prices in price order; no liquidation readout for a finished trade.
  expect(prices()).toEqual([['Exit','$267.18'],['Entry','$267.60']]);
  // The move fills the bar: no empty track on either side of it.
  expect([...card().querySelectorAll<HTMLElement>('.hig-bar-pnl-bar > span')].filter(part=>Number(part.style.flexGrow)>0).map(part=>[part.className.replace('hig-bar-pnl-',''),Number(part.style.flexGrow)])).toEqual([['move',1]]);expect(document.querySelector('.hig-bar-pnl-liquidation')).toBeNull();expect(screen.queryByRole('button')).toBeNull();
  view.rerender(<TradeHistoryCard labels={labels} symbol='BTC' side='long' leverage={40} entry={64700} exit={64522.5} pnl={-1.12}/>);
  expect(screen.getByRole('region',{name:'BTC · Long 40×'}).dataset.result).toBe('loss');expect(prices()).toEqual([['Exit','$64,522.50'],['Entry','$64,700.00']]);expect(document.querySelector('.hig-trade-pnl')!.getAttribute('data-tone')).toBe('down');
  // The bar follows the prices and the side; the figure follows the net result.
  view.rerender(<TradeHistoryCard labels={labels} symbol='BTC' side='long' entry={100} exit={101} pnl={-0.2}/>);
  expect(screen.getByRole('region',{name:'BTC · Long'}).dataset.result).toBe('profit');expect(document.querySelector('.hig-trade-pnl')!.getAttribute('data-tone')).toBe('down');
  view.rerender(<TradeHistoryCard labels={labels} symbol='BTC' side='long' entry={100} exit={101}/>);expect(document.querySelector('.hig-trade-pnl')).toBeNull();expect(document.querySelector('.hig-bar-pnl-description,.hig-bar-pnl .hig-trade-pnl')).toBeNull();
 });
 it('is one button named with the trade and its result only when it can be selected, and can drop its card',async()=>{
  const select=vi.fn();const view=render(<TradeHistoryCard labels={labels} symbol='AMZN' side='short' leverage={20} entry={267.6} exit={267.18} pnl={1.418} onSelect={select} className='wide' data-testid='trade'/>);
  const wrapper=screen.getByTestId('trade');expect(wrapper.className).toBe('hig-trade-history-card wide');
  await userEvent.click(screen.getByRole('button',{name:'AMZN · Short 20×, +$1.418'}));expect(select).toHaveBeenCalledTimes(1);
  view.rerender(<TradeHistoryCard labels={labels} symbol='AMZN' side='short' entry={267.6} exit={267.18} pnl={null} onSelect={select}/>);expect(screen.getByRole('button',{name:'AMZN · Short'})).toBeTruthy();
  view.rerender(<TradeHistoryCard labels={labels} symbol='AMZN' side='short' entry={267.6} exit={267.18} surface={false} className='wide' data-testid='plain'/>);
  const plain=screen.getByTestId('plain');expect(plain.classList.contains('hig-surface')).toBe(false);expect(plain.dataset.surface).toBe('false');expect(plain.classList.contains('wide')).toBe(true);
 });
});
const detailLabels={title:'Trade',netPnl:'Net PnL',onMargin:(percent:string)=>`${percent} on margin`,long:'Long',short:'Short'};
const usd={style:'currency',currency:'USD'} as const;
const base:TradeHistoryDetailCardProps={labels:detailLabels,name:'Amazon',side:'short',leverage:20,pnl:1.418,pnlPercent:0.0284,details:[{label:'Entry',value:267.6,options:usd},{label:'Size',value:3.734,suffix:' AMZN',options:{maximumFractionDigits:4}},{label:'Held',value:'38m 20s'},{label:'Funding',value:0.0063,options:{...usd,maximumFractionDigits:4,signDisplay:'exceptZero'}}]};
describe('TradeHistoryDetailCard',()=>{
 it('shows the header, the asset with its side and leverage, and the net result with the return on margin',async()=>{
  const back=vi.fn();const view=render(<TradeHistoryDetailCard {...base} onBack={back}/>);
  expect(screen.getByRole('heading',{name:'Trade'})).toBeTruthy();await userEvent.click(screen.getByRole('button',{name:'Back'}));expect(back).toHaveBeenCalledTimes(1);
  const row=()=>document.querySelector('.hig-trade-identity')!;
  expect(row().textContent).toBe('AmaAmazon↓ Short 20×');expect(row().querySelector('.hig-trade-side')!.getAttribute('data-side')).toBe('short');expect(row().querySelector('.hig-trade-side > span')!.getAttribute('aria-hidden')).toBe('true');
  const result=()=>document.querySelector<HTMLElement>('.hig-trade-result')!;
  expect(result().dataset.tone).toBe('up');expect(result().querySelector('.hig-trade-caption')!.textContent).toBe('Net PnL ');expect(result().querySelector('.hig-trade-caption')!.classList.contains('hig-sr-only')).toBe(true);expect(spoken(result().querySelector('.hig-trade-figure')!)).toBe('Net PnL +$1.418');expect(spoken(result().querySelector('.hig-trade-return')!)).toBe('+2.84% on margin');
  view.rerender(<TradeHistoryDetailCard {...base} name='Bitcoin' icon='/btc.png' side='long' leverage={undefined} pnl={-1.12} pnlPercent={-0.112}/>);
  expect(row().textContent).toBe('Bitcoin↑ Long');expect(row().querySelector('img')?.getAttribute('src')).toBe('/btc.png');expect(result().dataset.tone).toBe('down');expect(spoken(result())).toBe('Bitcoin↑ LongNet PnL -$1.12-11.20% on margin');
  view.rerender(<TradeHistoryDetailCard {...base} pnl={null} pnlPercent={null}/>);expect(result().dataset.tone).toBeUndefined();expect(spoken(result())).toBe('AmaAmazon↓ Short 20×Net PnL —— on margin');
  view.rerender(<TradeHistoryDetailCard {...base} pnl={0} pnlPercent={undefined}/>);expect(result().querySelector('.hig-trade-return')).toBeNull();expect(spoken(result())).toBe('AmaAmazon↓ Short 20×Net PnL $0.00');
 });
 it('draws nothing above the actions as a card, and one bar from entry to exit in place of two rows',()=>{
  const view=render(<TradeHistoryDetailCard {...base} labels={{...detailLabels,entry:'Entry',exit:'Exit'}} entry={267.6} exit={267.18}/>);
  expect(document.querySelectorAll('.hig-trade-detail .hig-surface')).toHaveLength(0);expect(document.querySelector('.hig-trade-detail .hig-asset-row')).toBeNull();
  // The identity sits inside the result, above the figure.
  expect(document.querySelector('.hig-trade-result > .hig-trade-identity')!.compareDocumentPosition(document.querySelector('.hig-trade-figure')!)&Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  const bar=()=>document.querySelector<HTMLElement>('.hig-trade-bar');expect(bar()!.classList.contains('hig-bar-pnl')).toBe(true);expect(bar()!.dataset.result).toBe('profit');
  expect([...bar()!.querySelectorAll('.hig-bar-pnl-readouts > div')].map(price=>[price.querySelector('dt')!.textContent,spoken(price.querySelector('dd')!)])).toEqual([['Exit','$267.18'],['Entry','$267.60']]);
  view.rerender(<TradeHistoryDetailCard {...base} side='long' labels={{...detailLabels,entry:'Entry',exit:'Exit'}} entry={64700} exit={64522.5} priceOptions={{style:'currency',currency:'USD',maximumFractionDigits:0}}/>);
  expect(bar()!.dataset.result).toBe('loss');expect([...bar()!.querySelectorAll('dd')].map(spoken)).toEqual(['$64,523','$64,700']);
  // Without both prices there is no bar.
  view.rerender(<TradeHistoryDetailCard {...base} entry={267.6}/>);expect(bar()).toBeNull();view.rerender(<TradeHistoryDetailCard {...base}/>);expect(bar()).toBeNull();
  const css=readFileSync('packages/hig/react/src/styles.css','utf8');expect(css).toMatch(/\.hig-trade-details \{ display:grid;grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
 });
 it('lists the trade figures as a grid of labels over values: numbers formatted and live, strings as given',()=>{
  const view=render(<TradeHistoryDetailCard {...base}/>);const rows=()=>[...document.querySelectorAll('.hig-trade-details > div')];
  expect(rows().map(row=>[row.querySelector('dt')!.textContent,spoken(row.querySelector('dd')!)])).toEqual([['Entry','$267.60'],['Size','3.734 AMZN'],['Held','38m 20s'],['Funding','+$0.0063']]);
  expect(rows().map(row=>row.querySelector('.hig-animated-number-visual')!==null)).toEqual([true,true,false,true]);
  view.rerender(<TradeHistoryDetailCard {...base} details={[]}/>);expect(document.querySelector('.hig-trade-details')).toBeNull();
 });
 it('draws the host actions in one row in order, with intents, and reports presses only for enabled ones',async()=>{
  const save=vi.fn(),share=vi.fn();
  const view=render(<TradeHistoryDetailCard {...base} actions={[{id:'save',label:'Save image',onSelect:save},{id:'share',label:'Share',intent:'primary',onSelect:share},{id:'copy',label:'Copy link',onSelect:()=>{},disabled:true}]}/>);
  const buttons=[...document.querySelectorAll<HTMLButtonElement>('.hig-trade-actions > button')];
  expect(buttons.map(button=>[button.textContent,button.dataset.intent,button.disabled])).toEqual([['Save image','secondary',false],['Share','primary',false],['Copy link','secondary',true]]);
  for(const button of buttons)await userEvent.click(button);expect(save).toHaveBeenCalledTimes(1);expect(share).toHaveBeenCalledTimes(1);
  view.rerender(<TradeHistoryDetailCard {...base}/>);expect(document.querySelector('.hig-trade-actions')).toBeNull();
 });
 it('ships no words of its own, follows the provider locale, and both blocks are in the aggregate',()=>{
  const fr={title:'Transaction',netPnl:'Résultat net',onMargin:(percent:string)=>`${percent} sur la marge`,long:'Achat',short:'Vente'};
  render(<HIGProvider locale='fr-FR'><TradeHistoryDetailCard {...base} labels={fr}/></HIGProvider>);
  expect(screen.getByRole('heading',{name:'Transaction'})).toBeTruthy();expect(spoken(document.querySelector('.hig-trade-return')!)).toBe('+2,84 % sur la marge');expect(document.querySelector('.hig-trade-side')!.textContent).toBe('↓ Vente');
  for(const file of ['trade-history-card','trade-history-detail-card'])expect(readFileSync(`packages/hig/react/src/blocks/${file}.tsx`,'utf8')).not.toMatch(/messages\./);
  expect(blocks.TradeHistoryCard).toBe(TradeHistoryCard);expect(blocks.TradeHistoryDetailCard).toBe(TradeHistoryDetailCard);
  const css=readFileSync('packages/hig/react/src/styles.css','utf8').split('\n').filter(line=>line.startsWith('.hig-trade'));
  expect(css.join('\n')).not.toMatch(/\b(left|right)\b/);expect(css.find(line=>line.startsWith('.hig-trade-actions {'))).toContain('gap:var(--hig-action-gap)');
 });
});
