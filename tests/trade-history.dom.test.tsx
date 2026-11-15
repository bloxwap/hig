// @vitest-environment jsdom
import React from 'react';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {cleanup,render,screen,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {readFileSync} from 'node:fs';
import {HIGProvider} from '../packages/hig/react/src/provider';
import {TradeHistoryListBlock,tradeHistorySide,type TradeHistoryItem} from '../packages/hig/react/src/blocks/trade-history-list-block';
import {TradeHistoryDetailBlock,type TradeHistoryDetailBlockProps} from '../packages/hig/react/src/blocks/trade-history-detail-block';
import * as blocks from '../packages/hig/react/src/blocks';
afterEach(cleanup);
const spoken=(element:Element)=>{const copy=element.cloneNode(true) as Element;for(const visual of copy.querySelectorAll('.hig-animated-number-visual'))visual.remove();return copy.textContent;};
const labels={entry:'Entry',exit:'Exit',long:'Long',short:'Short'};
const list={title:'History',long:'Long',short:'Short',empty:'No closed trades yet'};
const trades:TradeHistoryItem[]=[{id:'1',name:'Amazon',side:'short',leverage:20,pnl:1.412,time:'2d'},{id:'2',name:'NVIDIA',side:'long',leverage:20,pnl:17.9,time:'3d'},{id:'3',name:'Robinhood',side:'long',leverage:10,pnl:-7.762,time:'4d'},{id:'4',name:'Solana',side:'short',pnl:null}];
describe('TradeHistoryListBlock',()=>{
 it('reads a side with the host word and the leverage in the provider locale',()=>{
  expect(tradeHistorySide({side:'short',leverage:20},labels)).toBe('Short 20×');expect(tradeHistorySide({side:'long'},labels)).toBe('Long');
  expect(tradeHistorySide({side:'long',leverage:1000},labels,'de-DE')).toBe('Long 1.000×');
 });
 it('shows the header and one row per trade: name, side and leverage in the direction colour, the result in the result colour, and its age',async()=>{
  const back=vi.fn();render(<TradeHistoryListBlock labels={list} trades={trades} onBack={back}/>);
  expect(screen.getByRole('heading',{name:'History'})).toBeTruthy();await userEvent.click(screen.getByRole('button',{name:'Back'}));expect(back).toHaveBeenCalledTimes(1);
  const rows=within(screen.getByRole('list',{name:'History'})).getAllByRole('listitem');
  expect(rows.map(spoken)).toEqual(['AmaAmazonShort 20×+$1.4122d','NVINVIDIALong 20×+$17.903d','RobRobinhoodLong 10×-$7.7624d','SolSolanaShort —']);
  expect(rows.map(row=>row.querySelector<HTMLElement>('.hig-trade-row-side')!.dataset.side)).toEqual(['short','long','long','short']);
  expect(rows.map(row=>row.querySelector<HTMLElement>('.hig-trade-pnl')!.dataset.tone)).toEqual(['up','up','down',undefined]);
  expect(rows[0].querySelector('.hig-asset-row-icon')?.getAttribute('aria-hidden')).toBe('true');expect(rows[0].querySelector('.hig-trade-row')?.tagName).toBe('DIV');expect(document.querySelector('.hig-trade-row-chevron')).toBeNull();
 });
 it('makes each row a button named with the trade when it can be selected, with a decorative chevron',async()=>{
  const select=vi.fn();render(<TradeHistoryListBlock labels={list} trades={trades} onSelect={select}/>);
  const row=screen.getByRole('button',{name:'Amazon, Short 20×, +$1.412, 2d'});expect(row.querySelector('.hig-trade-row-chevron')?.getAttribute('aria-hidden')).toBe('true');
  await userEvent.click(row);expect(select).toHaveBeenCalledWith(trades[0]);
  expect(screen.getByRole('button',{name:'Solana, Short, —'})).toBeTruthy();
 });
 it('shows the host empty text without trades, draws host artwork, and takes a result format',()=>{
  const view=render(<TradeHistoryListBlock labels={list} trades={[]}/>);
  expect(screen.getByRole('status').textContent).toBe('No closed trades yet');expect(screen.queryByRole('list')).toBeNull();
  view.rerender(<TradeHistoryListBlock labels={list} trades={[{id:'a',name:'Tesla',icon:'/tsla.png',side:'long',pnl:4.675}]} pnlOptions={{style:'currency',currency:'USD',maximumFractionDigits:0}}/>);
  expect(document.querySelector('.hig-asset-row-icon img')?.getAttribute('src')).toBe('/tsla.png');expect(spoken(document.querySelector('.hig-trade-pnl')!)).toBe('$5');
 });
});
const detailLabels={title:'Trade',netPnl:'Net PnL',onMargin:(percent:string)=>`${percent} on margin`,long:'Long',short:'Short'};
const usd={style:'currency',currency:'USD'} as const;
const base:TradeHistoryDetailBlockProps={labels:detailLabels,name:'Amazon',side:'short',leverage:20,pnl:1.418,pnlPercent:0.0284,details:[{label:'Entry',value:267.6,options:usd},{label:'Size',value:3.734,suffix:' AMZN',options:{maximumFractionDigits:4}},{label:'Held',value:'38m 20s'},{label:'Funding',value:0.0063,options:{...usd,maximumFractionDigits:4,signDisplay:'exceptZero'}}]};
describe('TradeHistoryDetailBlock',()=>{
 it('shows the header, the asset with its side and leverage, and the net result with the return on margin',async()=>{
  const back=vi.fn();const view=render(<TradeHistoryDetailBlock {...base} onBack={back}/>);
  expect(screen.getByRole('heading',{name:'Trade'})).toBeTruthy();await userEvent.click(screen.getByRole('button',{name:'Back'}));expect(back).toHaveBeenCalledTimes(1);
  const row=()=>document.querySelector('.hig-trade-identity')!;
  expect(row().textContent).toBe('AmaAmazon↓ Short 20×');expect(row().querySelector('.hig-trade-side')!.getAttribute('data-side')).toBe('short');expect(row().querySelector('.hig-trade-side > span')!.getAttribute('aria-hidden')).toBe('true');
  const result=()=>document.querySelector<HTMLElement>('.hig-trade-result')!;
  expect(result().dataset.tone).toBe('up');expect(result().querySelector('.hig-trade-caption')!.textContent).toBe('Net PnL ');expect(result().querySelector('.hig-trade-caption')!.classList.contains('hig-sr-only')).toBe(true);expect(spoken(result().querySelector('.hig-trade-figure')!)).toBe('Net PnL +$1.418');expect(spoken(result().querySelector('.hig-trade-return')!)).toBe('+2.84% on margin');
  view.rerender(<TradeHistoryDetailBlock {...base} name='Bitcoin' icon='/btc.png' side='long' leverage={undefined} pnl={-1.12} pnlPercent={-0.112}/>);
  expect(row().textContent).toBe('Bitcoin↑ Long');expect(row().querySelector('img')?.getAttribute('src')).toBe('/btc.png');expect(result().dataset.tone).toBe('down');expect(spoken(result())).toBe('Bitcoin↑ LongNet PnL -$1.12-11.20% on margin');
  view.rerender(<TradeHistoryDetailBlock {...base} pnl={null} pnlPercent={null}/>);expect(result().dataset.tone).toBeUndefined();expect(spoken(result())).toBe('AmaAmazon↓ Short 20×Net PnL —— on margin');
  view.rerender(<TradeHistoryDetailBlock {...base} pnl={0} pnlPercent={undefined}/>);expect(result().querySelector('.hig-trade-return')).toBeNull();expect(spoken(result())).toBe('AmaAmazon↓ Short 20×Net PnL $0.00');
 });
 it('draws nothing above the actions as a card, and one bar from entry to exit in place of two rows',()=>{
  const view=render(<TradeHistoryDetailBlock {...base} labels={{...detailLabels,entry:'Entry',exit:'Exit'}} entry={267.6} exit={267.18}/>);
  expect(document.querySelectorAll('.hig-trade-detail .hig-surface')).toHaveLength(0);expect(document.querySelector('.hig-trade-detail .hig-asset-row')).toBeNull();
  // The identity sits inside the result, above the figure.
  expect(document.querySelector('.hig-trade-result > .hig-trade-identity')!.compareDocumentPosition(document.querySelector('.hig-trade-figure')!)&Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  const bar=()=>document.querySelector<HTMLElement>('.hig-trade-bar');expect(bar()!.classList.contains('hig-bar-pnl')).toBe(true);expect(bar()!.dataset.result).toBe('profit');
  expect([...bar()!.querySelectorAll('.hig-bar-pnl-readouts > div')].map(price=>[price.querySelector('dt')!.textContent,spoken(price.querySelector('dd')!)])).toEqual([['Exit','$267.18'],['Entry','$267.60']]);
  view.rerender(<TradeHistoryDetailBlock {...base} side='long' labels={{...detailLabels,entry:'Entry',exit:'Exit'}} entry={64700} exit={64522.5} priceOptions={{style:'currency',currency:'USD',maximumFractionDigits:0}}/>);
  expect(bar()!.dataset.result).toBe('loss');expect([...bar()!.querySelectorAll('dd')].map(spoken)).toEqual(['$64,523','$64,700']);
  // Without both prices there is no bar.
  view.rerender(<TradeHistoryDetailBlock {...base} entry={267.6}/>);expect(bar()).toBeNull();view.rerender(<TradeHistoryDetailBlock {...base}/>);expect(bar()).toBeNull();
  const css=readFileSync('packages/hig/react/src/styles.css','utf8');expect(css).toMatch(/\.hig-trade-details \{ display:grid;grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
 });
 it('lists the trade figures as a grid of labels over values: numbers formatted and live, strings as given',()=>{
  const view=render(<TradeHistoryDetailBlock {...base}/>);const rows=()=>[...document.querySelectorAll('.hig-trade-details > div')];
  expect(rows().map(row=>[row.querySelector('dt')!.textContent,spoken(row.querySelector('dd')!)])).toEqual([['Entry','$267.60'],['Size','3.734 AMZN'],['Held','38m 20s'],['Funding','+$0.0063']]);
  expect(rows().map(row=>row.querySelector('.hig-animated-number-visual')!==null)).toEqual([true,true,false,true]);
  view.rerender(<TradeHistoryDetailBlock {...base} details={[]}/>);expect(document.querySelector('.hig-trade-details')).toBeNull();
 });
 it('draws the host actions in one row in order, with intents, and reports presses only for enabled ones',async()=>{
  const save=vi.fn(),share=vi.fn();
  const view=render(<TradeHistoryDetailBlock {...base} actions={[{id:'save',label:'Save image',onSelect:save},{id:'share',label:'Share',intent:'primary',onSelect:share},{id:'copy',label:'Copy link',onSelect:()=>{},disabled:true}]}/>);
  const buttons=[...document.querySelectorAll<HTMLButtonElement>('.hig-trade-actions > button')];
  expect(buttons.map(button=>[button.textContent,button.dataset.intent,button.disabled])).toEqual([['Save image','secondary',false],['Share','primary',false],['Copy link','secondary',true]]);
  for(const button of buttons)await userEvent.click(button);expect(save).toHaveBeenCalledTimes(1);expect(share).toHaveBeenCalledTimes(1);
  view.rerender(<TradeHistoryDetailBlock {...base}/>);expect(document.querySelector('.hig-trade-actions')).toBeNull();
 });
 it('ships no words of its own, follows the provider locale, and both blocks are in the aggregate',()=>{
  const fr={title:'Transaction',netPnl:'Résultat net',onMargin:(percent:string)=>`${percent} sur la marge`,long:'Achat',short:'Vente'};
  render(<HIGProvider locale='fr-FR'><TradeHistoryDetailBlock {...base} labels={fr}/></HIGProvider>);
  expect(screen.getByRole('heading',{name:'Transaction'})).toBeTruthy();expect(spoken(document.querySelector('.hig-trade-return')!)).toBe('+2,84 % sur la marge');expect(document.querySelector('.hig-trade-side')!.textContent).toBe('↓ Vente');
  for(const file of ['trade-history-list-block','trade-history-detail-block'])expect(readFileSync(`packages/hig/react/src/blocks/${file}.tsx`,'utf8')).not.toMatch(/messages\./);
  expect(blocks.TradeHistoryListBlock).toBe(TradeHistoryListBlock);expect(blocks.TradeHistoryDetailBlock).toBe(TradeHistoryDetailBlock);
  const css=readFileSync('packages/hig/react/src/styles.css','utf8').split('\n').filter(line=>line.startsWith('.hig-trade'));
  expect(css.join('\n')).not.toMatch(/\b(left|right)\b/);expect(css.find(line=>line.startsWith('.hig-trade-actions {'))).toContain('gap:var(--hig-action-gap)');
 });
});
describe('trade history host slots (Unreleased)',()=>{
 it('paints side, leverage and result with the market up/down roles on both blocks, which the provider can override',()=>{
  const css=readFileSync('packages/hig/react/src/styles.css','utf8');
  for(const rule of ['.hig-trade-row-side[data-side=\'long\'] { color:var(--hig-up,var(--hig-buy)); }','.hig-trade-row-side[data-side=\'short\'] { color:var(--hig-down,var(--hig-sell)); }','.hig-trade-side[data-side=\'long\'] { color:var(--hig-up,var(--hig-buy)); }','.hig-trade-side[data-side=\'short\'] { color:var(--hig-down,var(--hig-sell)); }'])expect(css).toContain(rule);
  expect(css).toMatch(/\.hig-trade-pnl\[data-tone='up'\],\.hig-trade-result\[data-tone='up'\] :is\(\.hig-trade-figure,\.hig-trade-return\) \{ color:var\(--hig-up,var\(--hig-buy\)\); \}/);
  expect(css.split('\n').filter(line=>line.startsWith('.hig-trade')&&/data-(side|tone)/.test(line)).join('\n')).not.toMatch(/--hig-(positive|negative)\)/);
  const view=render(<HIGProvider marketColors={{up:'#ff3b30',down:'#0a84ff'}}><HIGProvider primaryColor='#ff0000'><TradeHistoryListBlock labels={list} trades={trades}/></HIGProvider></HIGProvider>);
  const wrappers=[...view.container.querySelectorAll<HTMLElement>('[data-hig-density]')];
  expect(wrappers[0].style.getPropertyValue('--hig-up')).toBe('#ff3b30');expect(wrappers[0].style.getPropertyValue('--hig-down')).toBe('#0a84ff');
  expect(wrappers[1].style.getPropertyValue('--hig-up')).toBe('#ff3b30');expect(wrappers[1].style.getPropertyValue('--hig-action')).not.toBe('');
  view.rerender(<HIGProvider><TradeHistoryListBlock labels={list} trades={trades}/></HIGProvider>);
  expect(view.container.querySelector<HTMLElement>('[data-hig-density]')!.style.getPropertyValue('--hig-up')).toBe('');
  cleanup();const fresh=render(<HIGProvider><TradeHistoryListBlock labels={list} trades={trades}/></HIGProvider>);expect(fresh.container.querySelector('[data-hig-density]')!.hasAttribute('style')).toBe(false);
 });
 it('draws a notice, a footer, a tag before the age, a leverage note and a symbol in the fallback disc',()=>{
  const select=vi.fn();
  render(<TradeHistoryListBlock labels={list} onSelect={select} notice={<p>Some trades are missing</p>} footer={<button type='button'>Next page</button>}
   trades={[{id:'1',name:'Bitcoin',symbol:'BTC',side:'long',leverage:20,leverageNote:'current',pnl:2,time:'2d',tag:'0x22…22'}]}/>);
  const section=document.querySelector('.hig-trade-history-list')!;
  expect([...section.children].map(child=>child.className)).toEqual(['hig-screen-header','hig-trade-notice','hig-trade-rows','hig-trade-footer']);
  expect(document.querySelector('.hig-trade-notice')!.textContent).toBe('Some trades are missing');expect(screen.getByRole('button',{name:'Next page'})).toBeTruthy();
  const row=screen.getByRole('button',{name:'Bitcoin, Long 20× current, +$2.000, 0x22…22, 2d'});
  expect(row.querySelector('.hig-asset-row-icon')!.textContent).toBe('BTC');expect(row.querySelector('.hig-trade-row-note')!.textContent).toBe('current');
  expect(spoken(row.querySelector('.hig-trade-row-meta')!)).toBe('0x22…22·2d');expect(row.querySelector('.hig-trade-row-meta > [aria-hidden]')!.textContent).toBe('·');
 });
 it('shows skeleton rows while loading, an error in place of the rows, and a two-line empty state',()=>{
  const view=render(<TradeHistoryListBlock labels={list} trades={trades} loading/>);
  const busy=document.querySelector<HTMLElement>('.hig-trade-rows')!;expect(busy.getAttribute('aria-busy')).toBe('true');expect(busy.getAttribute('role')).toBeNull();
  expect(busy.querySelectorAll('.hig-skeleton[aria-hidden="true"]')).toHaveLength(4);expect(screen.queryByRole('list')).toBeNull();
  expect(screen.queryByRole('status')).toBeNull();
  // The label is text in its own status region, which is not busy, so it is announced; only the skeletons are busy.
  view.rerender(<TradeHistoryListBlock labels={list} trades={trades} loading loadingLabel='Loading history'/>);
  const loadingStatus=screen.getByRole('status');expect(loadingStatus.textContent).toBe('Loading history');expect(loadingStatus.className).toBe('hig-sr-only');
  expect(loadingStatus.closest('[aria-busy="true"]')).toBeNull();expect(document.querySelector('.hig-trade-rows')!.getAttribute('aria-busy')).toBe('true');
  view.rerender(<TradeHistoryListBlock labels={list} trades={trades} error='History is unavailable'/>);expect(screen.getByRole('alert').textContent).toBe('History is unavailable');expect(screen.queryByRole('list')).toBeNull();
  view.rerender(<TradeHistoryListBlock labels={{...list,emptyDescription:'Closed trades appear here.'}} trades={[]}/>);
  const empty=screen.getByRole('status');expect(empty.querySelector('strong')!.textContent).toBe('No closed trades yet');expect(empty.textContent).toBe('No closed trades yetClosed trades appear here.');
 });
 it('detail: a badge beside the title, a note under the details, a leverage note, and host formats for the headline and return',()=>{
  const ref=React.createRef<HTMLDivElement>();
  render(<HIGProvider locale='fr-FR' numberFormat={{currencyDisplay:'narrowSymbol'}}><TradeHistoryDetailBlock {...base} symbol='AMZN' leverageNote='actuel' badge='Démo' note='Une partie est manquante.' summaryRef={ref}
   pnlOptions={{style:'currency',currency:'USD',signDisplay:'exceptZero',maximumFractionDigits:2}} percentOptions={{style:'percent',maximumFractionDigits:1,signDisplay:'exceptZero'}}
   actions={[{id:'share',label:'Partager',onSelect:()=>{}}]}/></HIGProvider>);
  const heading=screen.getByRole('heading',{name:'Trade Démo'});expect(heading.querySelector('.hig-badge')!.textContent).toBe('Démo');
  expect(document.querySelector('.hig-trade-avatar')!.textContent).toBe('AMZN');expect(document.querySelector('.hig-trade-leverage-note')!.textContent).toBe('actuel');
  const plain=(element:Element)=>spoken(element)!.replace(/\s/g,' ');
  expect(plain(document.querySelector('.hig-trade-figure')!)).toBe('Net PnL +1,42 $');expect(plain(document.querySelector('.hig-trade-return')!)).toBe('+2,8 % on margin');
  expect(ref.current).toBe(document.querySelector('.hig-trade-result'));
  const note=document.querySelector('.hig-trade-note')!;expect(note.textContent).toBe('Une partie est manquante.');expect(note.parentElement!.className).toBe('hig-trade-summary');
  expect(note.compareDocumentPosition(document.querySelector('.hig-trade-actions')!)&Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
 });
});
