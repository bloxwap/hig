import React from 'react';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import {TradeEntry} from '../packages/hig/react/src/blocks/trade-entry';
import {HIGProvider} from '../packages/hig/react/src/provider';

afterEach(cleanup);

it('formats the current trade only when review opens and keeps open reviews up to date',async()=>{
 const description=vi.fn((amount:string,asset:string)=>amount+' '+asset);
 const messages={confirmOrderDescription:description};
 const onConfirm=vi.fn();
 const scene=(amount:string)=><HIGProvider messages={messages}><TradeEntry amount={amount} asset="BTC" available="1 BTC" onAmountChange={()=>{}} onConfirm={onConfirm}/></HIGProvider>;
 const view=render(scene('0.1'));
 view.rerender(scene('0.2'));
 expect(description).not.toHaveBeenCalled();
 fireEvent.click(screen.getByRole('button',{name:'Review order'}));
 expect((await screen.findByRole('dialog')).textContent).toContain('0.2 BTC');
 view.rerender(scene('0.3'));
 expect(screen.getByRole('dialog').textContent).toContain('0.3 BTC');
 fireEvent.click(screen.getByRole('button',{name:'Confirm order'}));
 expect(onConfirm).toHaveBeenCalledOnce();
 fireEvent.click(screen.getByRole('button',{name:'Close'}));
 await waitFor(()=>expect(document.activeElement).toBe(screen.getByRole('button',{name:'Review order'})));
 description.mockClear();
 view.rerender(scene('0.4'));
 expect(description).not.toHaveBeenCalled();
 fireEvent.click(screen.getByRole('button',{name:'Review order'}));
 expect(screen.getByRole('dialog').textContent).toContain('0.4 BTC');
});
