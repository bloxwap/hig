import React,{useState} from 'react';
import {afterEach,it,expect} from 'vitest';
import {render,screen,cleanup} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {HIGProvider} from '../packages/react/src/provider';
import {NumberReadout,Percent,Table} from '../packages/react/src/data';
afterEach(cleanup);
it('formats percent points with locale placement, precision and unknown states',()=>{
 const {rerender}=render(<HIGProvider locale='de-DE'><Percent value={-5.25} options={{minimumFractionDigits:2}}/></HIGProvider>);
 expect(document.querySelector('.hig-number')?.textContent).toBe(new Intl.NumberFormat('de-DE',{style:'percent',minimumFractionDigits:2}).format(-.0525));
 rerender(<HIGProvider locale='ar-EG'><Percent value={5}/></HIGProvider>);
 expect(document.querySelector('.hig-number')?.textContent).toBe(new Intl.NumberFormat('ar-EG',{style:'percent',maximumFractionDigits:3}).format(.05));
 rerender(<Percent value={.001} options={{minimumFractionDigits:5}}/>);expect(screen.getByText('0.00100%')).toBeTruthy();
 rerender(<Percent value={NaN}/>);expect(screen.getByText('—')).toBeTruthy();
});
it('retains zero, negative, tiny, large, trailing zeros and stale display without live announcements',()=>{
 const values=[0,-1234.5,1e-8,1e20];render(<>{values.map(value=><NumberReadout key={value} value={value} options={{minimumFractionDigits:8,maximumFractionDigits:8}}/>)}<NumberReadout value={null} stale/></>);
 for(const value of values)expect(screen.getByText(new Intl.NumberFormat('en-US',{minimumFractionDigits:8,maximumFractionDigits:8}).format(value))).toBeTruthy();
 expect(screen.getByText('— (stale)')).toBeTruthy();expect(document.querySelector('[aria-live]')).toBeNull();
});
it('sorts host-owned rows from a keyboard header while preserving table semantics',async()=>{
 function Example(){const [descending,set]=useState(false);const rows=[{id:'a',value:1},{id:'b',value:2}].sort((a,b)=>descending?b.value-a.value:a.value-b.value);return <Table caption='Positions' rows={rows} keyFor={r=>r.id} columns={[{key:'value',label:'Balance',sort:descending?'descending':'ascending',onSort:()=>set(!descending),render:r=>r.value}]}/>;}
 render(<Example/>);const button=screen.getByRole('button',{name:'Balance'});button.focus();await userEvent.keyboard('{Enter}');expect(screen.getByRole('columnheader').getAttribute('aria-sort')).toBe('descending');expect(screen.getAllByRole('cell').map(n=>n.textContent)).toEqual(['2','1']);expect(screen.getByRole('region',{name:'Positions'}).tabIndex).toBe(0);
});
it('retains list identity during live updates and exposes quiet loading/retry/pagination',async()=>{
 const {List}=await import('../packages/react/src/data');let retries=0,pages=0;const items=[{id:'a',value:'1'}];
 const props={keyFor:(r:{id:string;value:string})=>r.id,render:(r:{id:string;value:string})=><input aria-label={r.id} defaultValue={r.value}/>,onRetry:()=>retries++,onLoadMore:()=>pages++};
 const {rerender}=render(<List {...props} label='Balances' items={items}/>);const input=screen.getByRole('textbox');input.focus();
 rerender(<List {...props} items={[{id:'a',value:'2'}]} error='Offline'/>);expect(screen.getByRole('textbox')).toBe(input);expect(document.activeElement).toBe(input);
 await userEvent.click(screen.getByRole('button',{name:'Retry'}));await userEvent.click(screen.getByRole('button',{name:'Load more'}));expect([retries,pages]).toEqual([1,1]);
 rerender(<List {...props} items={[]} loading/>);expect(screen.queryByText('No items')).toBeNull();expect(screen.getByRole('status').textContent).toBe('Loading items');expect((screen.getByRole('button',{name:'Load more'}) as HTMLButtonElement).disabled).toBe(true);
});
it('includes the current numeric reading and stale state in an explicit accessible label',()=>{
 render(<NumberReadout label='Balance' value={0} stale/>);expect(screen.getByLabelText('Balance: 0 (stale)')).toBeTruthy();
});
it('optional number motion preserves the final reading, cancels old motion and stays quiet for rapid updates/reduced motion',async()=>{
 const {AnimatedNumberReadout}=await import('../packages/react/src/animated-number');const {vi}=await import('vitest');
 const cancel=vi.fn(),animate=vi.fn(()=>({cancel}));Object.defineProperty(HTMLElement.prototype,'animate',{value:animate,configurable:true});const clock=vi.spyOn(Date,'now').mockReturnValue(1000);
 try{const {rerender,unmount}=render(<AnimatedNumberReadout value={1} label='Price'/>);expect(animate).not.toHaveBeenCalled();
  rerender(<AnimatedNumberReadout value={2} label='Price'/>);expect(screen.getByLabelText('Price: 2')).toBeTruthy();expect(animate).toHaveBeenCalledOnce();
  clock.mockReturnValue(1010);rerender(<AnimatedNumberReadout value={3} label='Price'/>);expect(cancel).toHaveBeenCalledOnce();expect(animate).toHaveBeenCalledOnce();
  clock.mockReturnValue(2000);rerender(<HIGProvider reducedMotion><AnimatedNumberReadout value={4} label='Price'/></HIGProvider>);rerender(<HIGProvider reducedMotion><AnimatedNumberReadout value={5} label='Price'/></HIGProvider>);expect(animate).toHaveBeenCalledOnce();expect(screen.getByLabelText('Price: 5')).toBeTruthy();unmount();
 }finally{clock.mockRestore();delete (HTMLElement.prototype as {animate?:unknown}).animate;}
});
