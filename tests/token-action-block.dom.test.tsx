// @vitest-environment jsdom
import React from 'react';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {cleanup,render,screen,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {readFileSync} from 'node:fs';
import {HIGProvider} from '../packages/hig/react/src/provider';
import {BarMark} from '../packages/hig/react/src/bar-mark';
import {TokenActionBlock,tokenActionLabel,type TokenAction} from '../packages/hig/react/src/blocks/token-action-block';
afterEach(cleanup);
const spoken=(element:Element)=>{const copy=element.cloneNode(true) as Element;for(const visual of copy.querySelectorAll('.hig-animated-number-visual'))visual.remove();return copy.textContent;};
const assets=[{label:'Staked',value:320},{label:'Core',value:239},{label:'Paper',value:200}],chains=[{label:'Base',value:120},{label:'Hyperliquid',value:639},{label:'Arbitrum',value:0}];
const four=(fn=()=>{}):TokenAction[]=>[{id:'send',onSelect:fn},{id:'receive',onSelect:fn},{id:'stake',onSelect:fn},{id:'unstake',onSelect:fn}];
const description=(card:HTMLElement)=>spoken(card.querySelector('.hig-bar-mark-description')!);
describe('TokenActionBlock',()=>{
 it('shows the ticker heading, the assets bar with the total, a chains bar of the same size with its count, then the actions in order',async()=>{
  const back=vi.fn();render(<TokenActionBlock symbol='HYPE' name='Hyperliquid' assets={assets} chains={chains} actions={four()} onBack={back}/>);
  expect(screen.getByRole('heading',{name:'HYPE'})).toBeTruthy();await userEvent.click(screen.getByRole('button',{name:'Back'}));expect(back).toHaveBeenCalledTimes(1);
  const held=screen.getByRole('region',{name:'Hyperliquid'}),on=screen.getByRole('region',{name:'Chains'});
  expect(description(held)).toBe('$759.00');expect(within(held).getAllByRole('listitem').map(item=>item.textContent)).toEqual(['Staked42.2%','Core31.5%','Paper26.4%']);expect(held.hasAttribute('data-size')).toBe(false);
  // Both bars sit on the screen without a card.
  expect(held.classList.contains('hig-surface')).toBe(false);expect(on.classList.contains('hig-surface')).toBe(false);
  // Two of the three chains hold a balance.
  expect(description(on)).toBe('2');expect(on.hasAttribute('data-size')).toBe(false);expect(within(on).getAllByRole('listitem').map(item=>item.textContent)).toEqual(['Base15.8%','Hyperliquid84.2%','Arbitrum0%']);
  expect([...document.querySelectorAll('.hig-token-actions > button')].map(button=>button.textContent)).toEqual(['Send','Receive','Stake','Unstake']);
  // Bars come before the actions.
  expect(document.querySelector('.hig-token-bars')!.compareDocumentPosition(document.querySelector('.hig-token-actions')!)&Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
 });
 it('takes a host total, an unknown total and a chains title',()=>{
  const view=render(<TokenActionBlock symbol='HYPE' name='Hyperliquid' value={800.5} assets={assets} chains={chains} chainsTitle='Networks' actions={[]}/>);
  expect(description(screen.getByRole('region',{name:'Hyperliquid'}))).toBe('$800.50');expect(screen.getByRole('region',{name:'Networks'})).toBeTruthy();expect(document.querySelector('.hig-token-actions')).toBeNull();
  view.rerender(<TokenActionBlock symbol='HYPE' name='Hyperliquid' value={null} assets={assets} chains={chains} actions={[]}/>);expect(description(screen.getByRole('region',{name:'Hyperliquid'}))).toBe('—');
 });
 it('labels known actions, takes host labels and intents, and reports presses only for enabled actions',async()=>{
  const send=vi.fn(),burn=vi.fn(),stake=vi.fn();
  render(<TokenActionBlock symbol='HYPE' name='Hyperliquid' assets={assets} chains={chains} actions={[{id:'send',onSelect:send,intent:'primary'},{id:'burn',label:'Burn',onSelect:burn,intent:'destructive'},{id:'stake',onSelect:stake,disabled:true},{id:'wrap',onSelect:()=>{}}]}/>);
  const buttons=[...document.querySelectorAll<HTMLButtonElement>('.hig-token-actions > button')];
  expect(buttons.map(button=>[button.textContent,button.dataset.intent])).toEqual([['Send','primary'],['Burn','destructive'],['Stake','secondary'],['wrap','secondary']]);
  for(const button of buttons)await userEvent.click(button);
  expect(send).toHaveBeenCalledTimes(1);expect(burn).toHaveBeenCalledTimes(1);expect(stake).not.toHaveBeenCalled();expect(buttons[2].disabled).toBe(true);
 });
 it('translates the built-in labels through the provider',()=>{
  render(<HIGProvider messages={{swapActionSend:'Envoyer',receive:'Recevoir',stake:'Staker',unstake:'Retirer',swapChains:'Chaînes'}}><TokenActionBlock symbol='HYPE' name='Hyperliquid' assets={assets} chains={chains} actions={four()}/></HIGProvider>);
  expect([...document.querySelectorAll('.hig-token-actions > button')].map(button=>button.textContent)).toEqual(['Envoyer','Recevoir','Staker','Retirer']);expect(screen.getByRole('region',{name:'Chaînes'})).toBeTruthy();
  expect(tokenActionLabel({id:'stake',onSelect:()=>{}})).toBe('Stake');expect(tokenActionLabel({id:'stake',label:'Delegate',onSelect:()=>{}})).toBe('Delegate');
 });
 it('BarMark small is a 12px bar the card does not use; the card spaces bars 8 apart and actions 16 below',()=>{
  render(<BarMark title='Chains' size='small' elements={chains}/>);expect(screen.getByRole('region',{name:'Chains'}).getAttribute('data-size')).toBe('small');
  const css=readFileSync('packages/hig/react/src/styles.css','utf8').split('\n');const rule=(start:string)=>css.find(line=>line.startsWith(start))??'';
  expect(rule(".hig-bar-mark[data-size='small']")).toMatch(/height:12px;border-radius:6px/);expect(rule('.hig-token-card {')).toContain('gap:16px');expect(rule('.hig-token-bars,.hig-token-actions {')).toContain('gap:8px');
 });
 it('draws a note under the actions with an optional tone, 8 below the actions',()=>{
  const view=render(<TokenActionBlock symbol='SOL' name='Solana' assets={assets} chains={chains} actions={four()} note='View-only account'/>);
  const note=screen.getByRole('note');expect(note.textContent).toBe('View-only account');expect(note.dataset.tone).toBe('muted');expect(note.classList.contains('hig-token-note')).toBe(true);
  expect(document.querySelector('.hig-token-actions')!.nextElementSibling).toBe(note);
  view.rerender(<TokenActionBlock symbol='SOL' name='Solana' assets={assets} chains={chains} actions={[]} note='View-only account' noteTone='warning'/>);expect(screen.getByRole('note').dataset.tone).toBe('warning');
  view.rerender(<TokenActionBlock symbol='SOL' name='Solana' assets={assets} chains={chains} actions={four()}/>);expect(screen.queryByRole('note')).toBeNull();
  const css=readFileSync('packages/hig/react/src/styles.css','utf8').split('\n');
  expect(css).toContain('.hig-token-card > .hig-token-actions + .hig-token-note { margin-block-start:-8px; }');
 });
 it('draws actions only when the host leaves out both bars, or one bar when it leaves out the other',()=>{
  const view=render(<TokenActionBlock symbol='USDC' actions={four()}/>);
  expect(document.querySelector('.hig-token-bars')).toBeNull();expect(screen.queryByRole('region')).toBeNull();expect(document.querySelectorAll('.hig-token-actions > button')).toHaveLength(4);
  view.rerender(<TokenActionBlock symbol='USDC' chains={chains} actions={four()}/>);expect(screen.getAllByRole('region').map(region=>region.getAttribute('aria-labelledby')&&document.getElementById(region.getAttribute('aria-labelledby')!)!.textContent)).toEqual(['Chains']);
  view.rerender(<TokenActionBlock symbol='USDC' assets={assets} actions={[]}/>);expect(description(screen.getByRole('region',{name:'USDC'}))).toBe('$759.00');expect(screen.queryByRole('region',{name:'Chains'})).toBeNull();
 });
 it('passes live legend figures through to the bars',()=>{
  render(<TokenActionBlock symbol='HYPE' name='Hyperliquid' assets={[{label:'Staked',value:320,detail:{value:320,options:{style:'currency',currency:'USD'}}}]} chains={chains} actions={[]}/>);
  const detail=screen.getByRole('region',{name:'Hyperliquid'}).querySelector('.hig-bar-mark-detail')!;expect(detail.querySelector('.hig-animated-number-visual')).toBeTruthy();expect(spoken(detail)).toBe('$320.00');
 });
});
