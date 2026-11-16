// @vitest-environment jsdom
import React from 'react';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {cleanup,render,screen,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {HIGProvider} from '../packages/hig/react/src/provider';
import {ConfirmBlock} from '../packages/hig/react/src/blocks/confirm-block';
import * as blocks from '../packages/hig/react/src/blocks';
afterEach(cleanup);
const address='0x1111111111111111111111111111111111111111';
const base={amount:2.5,symbol:'HYPE',address,network:'HyperEVM',onConfirm:()=>{}};
const amount=()=>document.querySelector('.hig-confirm-amount')!;
const rows=()=>[...document.querySelectorAll('.hig-confirm-details > div')];
describe('ConfirmBlock',()=>{
 it('shows the heading, the amount with its ticker, the address in full, the network, the warning, then Cancel beside Confirm',async()=>{
  const confirm=vi.fn(),cancel=vi.fn(),back=vi.fn();
  render(<ConfirmBlock {...base} onConfirm={confirm} onCancel={cancel} onBack={back}/>);
  expect(screen.getByRole('heading',{name:'Confirm Send'})).toBeTruthy();
  expect(amount().querySelector('.hig-animated-number-visual')!.textContent).toBe('2.5');expect(amount().querySelector('.hig-confirm-symbol')!.textContent).toBe('HYPE');
  expect(rows()).toHaveLength(2);
  expect(rows()[0].querySelector('dt')!.textContent).toBe('To');expect(rows()[0].querySelector('dd')!.textContent).toBe(address);
  expect(rows()[1].querySelector('dt')!.textContent).toBe('Network');expect(rows()[1].querySelector('dd')!.textContent).toBe('HyperEVM');
  // The details are read-only text: a description list with no row container and nothing to press.
  expect(document.querySelector('.hig-confirm-details')!.tagName).toBe('DL');expect(document.querySelector('.hig-list-group')).toBeNull();expect(document.querySelector('.hig-confirm-details button')).toBeNull();
  const note=screen.getByRole('note');expect(within(note).getByText('Double-check the address.')).toBeTruthy();
  expect(note.querySelector('p')!.textContent).toBe("HYPE moves to this address on HyperEVM instantly — there's no clawback if the address is wrong.");
  const actions=[...document.querySelectorAll<HTMLButtonElement>('.hig-confirm-actions > button')];
  expect(actions.map(button=>button.textContent)).toEqual(['Cancel','Confirm Send']);expect(actions.map(button=>button.dataset.intent)).toEqual(['secondary','primary']);
  await userEvent.click(actions[0]);await userEvent.click(actions[1]);await userEvent.click(screen.getByRole('button',{name:'Back'}));
  expect(confirm).toHaveBeenCalledTimes(1);expect(cancel).toHaveBeenCalledTimes(1);expect(back).toHaveBeenCalledTimes(1);
  // The rows come before the warning, and the warning before the actions.
  expect(document.querySelector('.hig-confirm-details')!.compareDocumentPosition(note)&Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(note.compareDocumentPosition(document.querySelector('.hig-confirm-actions')!)&Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
 });
 it('draws no Back or Cancel without their handlers, formats the amount, and reads an unknown amount as the dash',()=>{
  const view=render(<ConfirmBlock {...base} amount={1234.5678912}/>);
  expect(screen.queryByRole('button',{name:'Back'})).toBeNull();expect(screen.queryByRole('button',{name:'Cancel'})).toBeNull();
  expect(amount().querySelector('.hig-animated-number-visual')!.textContent).toBe('1,234.567891');
  view.rerender(<ConfirmBlock {...base} amount={0.5} amountOptions={{minimumFractionDigits:2}}/>);expect(amount().querySelector('.hig-animated-number-visual')!.textContent).toBe('0.50');
  view.rerender(<ConfirmBlock {...base} amount={null}/>);expect(amount().querySelector('.hig-animated-number-visual')!.textContent).toBe('—');
 });
 it('adds detail rows, takes host titles and labels, and drops the warning on null',()=>{
  const view=render(<ConfirmBlock {...base} title='Review' confirmLabel='Send HYPE' cancelLabel='Not now' onCancel={()=>{}} warningTitle='Check it' warning='This cannot be undone.' details={[{label:'Network fee',value:'0.0001 HYPE'}]} headingId='send-title'/>);
  expect(screen.getByRole('heading',{name:'Review'}).id).toBe('send-title');
  expect(rows()).toHaveLength(3);expect(rows()[2].textContent).toBe('Network fee0.0001 HYPE');
  const note=screen.getByRole('note');expect(note.querySelector('strong')!.textContent).toBe('Check it');expect(note.querySelector('p')!.textContent).toBe('This cannot be undone.');
  expect(screen.getByRole('button',{name:'Send HYPE'})).toBeTruthy();expect(screen.getByRole('button',{name:'Not now'})).toBeTruthy();
  view.rerender(<ConfirmBlock {...base} warning={null}/>);expect(screen.queryByRole('note')).toBeNull();
 });
 it('while busy, blocks Confirm, Cancel and Back; confirmDisabled blocks Confirm alone',async()=>{
  const confirm=vi.fn(),cancel=vi.fn(),back=vi.fn();
  const view=render(<ConfirmBlock {...base} busy onConfirm={confirm} onCancel={cancel} onBack={back}/>);
  const button=(name:RegExp)=>screen.getByRole('button',{name}) as HTMLButtonElement;
  expect(button(/^Confirm Send/).getAttribute('aria-busy')).toBe('true');expect(button(/^Confirm Send/).disabled).toBe(true);expect(button(/^Cancel$/).disabled).toBe(true);expect(button(/^Back$/).disabled).toBe(true);
  await userEvent.click(button(/^Confirm Send/));expect(confirm).not.toHaveBeenCalled();
  view.rerender(<ConfirmBlock {...base} confirmDisabled onConfirm={confirm} onCancel={cancel} onBack={back}/>);
  expect(button(/^Confirm Send$/).disabled).toBe(true);expect(button(/^Cancel$/).disabled).toBe(false);expect(button(/^Back$/).disabled).toBe(false);
 });
 it('takes translated messages from the provider and is exported from the blocks aggregate',()=>{
  expect(blocks.ConfirmBlock).toBe(ConfirmBlock);
  render(<HIGProvider messages={{confirmSend:'Confirmer',sendTo:'À',sendNetwork:'Réseau',sendWarningTitle:'Vérifiez.',sendWarning:(symbol,network)=>`${symbol} sur ${network}`,cancel:'Annuler'}}><ConfirmBlock {...base} onCancel={()=>{}}/></HIGProvider>);
  expect(screen.getByRole('heading',{name:'Confirmer'})).toBeTruthy();expect(rows().map(row=>row.querySelector('dt')!.textContent)).toEqual(['À','Réseau']);
  expect(screen.getByRole('note').textContent).toBe('Vérifiez.HYPE sur HyperEVM');expect(screen.getByRole('button',{name:'Annuler'})).toBeTruthy();
 });
});
