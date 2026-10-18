import React,{useState} from 'react';
import {afterEach,it,expect,vi} from 'vitest';
import {render,screen,within,cleanup} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {HIGProvider} from '../packages/react/src/provider';
import {Table,NumberReadout,type TableRowProps} from '../packages/react/src/data';
import {MarketRow} from '../packages/react/src/recipes/market-row';
afterEach(cleanup);

it('keeps sortable table semantics, logical numeric alignment and host row highlights in a named scroll region (#110)',async()=>{
 function Example(){const [descending,setDescending]=useState(false);const rows=[{id:'BTC',amount:2},{id:'ETH',amount:1}].sort((a,b)=>descending?b.amount-a.amount:a.amount-b.amount);return <Table caption='Positions' captionHidden stickyHeader className='host-scroll' tableClassName='host-table' style={{maxHeight:300}} rows={rows} keyFor={row=>row.id} rowProps={(row,index)=>({className:row.id==='BTC'?'current-market':undefined,'data-market':row.id,'data-index':index,'aria-current':row.id==='BTC'?'true':undefined})} columns={[{key:'market',label:'Market',render:row=>row.id},{key:'amount',label:'Amount',align:'end',sort:descending?'descending':'ascending',onSort:()=>setDescending(!descending),render:row=><NumberReadout value={row.amount}/>}]}/>;}
 render(<HIGProvider direction='rtl'><Example/></HIGProvider>);
 const region=screen.getByRole('region',{name:'Positions'});const table=screen.getByRole('table',{name:'Positions'});
 expect(region.classList.contains('hig-table-scroll')).toBe(true);expect(region.classList.contains('host-scroll')).toBe(true);expect(region.style.maxHeight).toBe('300px');
 expect(table.classList.contains('host-table')).toBe(true);expect(table.getAttribute('data-sticky-header')).toBe('true');expect(table.querySelector('caption')?.classList.contains('hig-sr-only')).toBe(true);
 const header=screen.getByRole('columnheader',{name:'Amount'});expect(header.style.textAlign).toBe('end');
 const marketRow=screen.getByText('BTC').closest('tr')!;expect(marketRow.getAttribute('aria-current')).toBe('true');expect(marketRow.classList.contains('current-market')).toBe(true);expect(marketRow.getAttribute('data-market')).toBe('BTC');expect(marketRow.cells[1].style.textAlign).toBe('end');
 await userEvent.tab();expect(document.activeElement).toBe(region);await userEvent.tab();expect(document.activeElement).toBe(screen.getByRole('button',{name:'Amount'}));
 await userEvent.keyboard('{Enter}');expect(header.getAttribute('aria-sort')).toBe('descending');
 expect(screen.getAllByRole('cell').map(cell=>cell.textContent)).toEqual(['BTC','2','ETH','1']);expect(screen.getByText('BTC').closest('tr')).toBe(marketRow);expect(marketRow.getAttribute('data-index')).toBe('0');
});

it('forwards row event and ARIA props without allowing host props to replace table-row semantics or HIG cells (#110)',async()=>{
 const action=vi.fn();const original={role:'button',children:'Injected',dangerouslySetInnerHTML:{__html:'<td>Injected HTML</td>'},onClick:action,'aria-label':'Bitcoin position','data-selected':true};const unsafe=original as unknown as TableRowProps;
 render(<Table caption='Balances' rows={[{id:'BTC'}]} keyFor={row=>row.id} rowProps={()=>unsafe} columns={[{key:'market',label:'Market',render:row=>row.id}]}/>);
 const row=screen.getByRole('row',{name:'Bitcoin position'});expect(row.tagName).toBe('TR');expect(row.hasAttribute('role')).toBe(false);expect(row.getAttribute('data-selected')).toBe('true');
 expect(within(row).getByRole('cell').textContent).toBe('BTC');expect(screen.queryByText(/Injected/)).toBeNull();await userEvent.click(row);expect(action).toHaveBeenCalledOnce();expect(original.role).toBe('button');
});

it('retains existing table rows during loading/error states and spans custom empty/retry content across the columns (#110)',async()=>{
 const retry=vi.fn();const columns=[{key:'id',label:'Market',render:(row:{id:string})=>row.id},{key:'value',label:'Balance',render:()=>1}];
 const {rerender}=render(<HIGProvider messages={{loading:'Chargement'}}><Table caption='Balances' rows={[]} keyFor={row=>row.id} columns={columns} loading/></HIGProvider>);
 expect(screen.getByRole('region').getAttribute('aria-busy')).toBe('true');expect(screen.getByRole('status').textContent).toBe('Chargement');expect(screen.queryByText('No rows')).toBeNull();expect(screen.getByRole('status').closest('td')?.colSpan).toBe(2);
 rerender(<Table caption='Balances' rows={[{id:'BTC'}]} keyFor={row=>row.id} columns={columns} loading/>);const row=screen.getByText('BTC').closest('tr');expect(screen.getByRole('status')).toBeTruthy();
 rerender(<Table caption='Balances' rows={[{id:'BTC'}]} keyFor={row=>row.id} columns={columns} state={<div role='alert'>Offline <button type='button' onClick={retry}>Retry</button></div>}/>);
 // The provider wrapper changed above, but the data row remains intact across state-only updates.
 const currentRow=screen.getByText('BTC').closest('tr');expect(currentRow).toBe(row);expect(screen.queryByRole('status')).toBeNull();expect(screen.getByRole('alert').closest('td')?.colSpan).toBe(2);
 await userEvent.click(screen.getByRole('button',{name:'Retry'}));expect(retry).toHaveBeenCalledOnce();expect(screen.getByText('BTC').closest('tr')).toBe(currentRow);
 rerender(<Table caption='Balances' rows={[]} keyFor={row=>row.id} columns={columns} state={<p>No open positions</p>}/>);expect(screen.getByText('No open positions').closest('td')?.colSpan).toBe(2);expect(screen.queryByText('No rows')).toBeNull();
 rerender(<Table caption='Balances' rows={[]} keyFor={row=>row.id} columns={columns} state={null}/>);expect(screen.queryByText('No rows')).toBeNull();
 rerender(<Table caption='Balances' rows={[]} keyFor={row=>row.id} columns={columns}/>);expect(screen.getByRole('cell').textContent).toBe('No rows');
});

it('keeps MarketRow default action ownership and currency formatting (#110)',async()=>{
 const select=vi.fn(),accepted=vi.fn();render(<HIGProvider onAccepted={accepted}><MarketRow symbol='BTC' name='Bitcoin' price={81741.25} change={2.5} onSelect={select}/></HIGProvider>);
 expect(screen.getByText('$81,741.25')).toBeTruthy();expect(screen.getByText('2.5%')).toBeTruthy();const button=screen.getByRole('button',{name:'Bitcoin (BTC)'});
 button.focus();await userEvent.keyboard('{Enter}');expect(select).toHaveBeenCalledOnce();expect(accepted).toHaveBeenCalledOnce();expect(button.closest('.hig-market-row')?.getAttribute('data-mode')).toBe('action');
});

it('lets a host option own keyboard selection while presentation rows expose slots with no extra tab stop or cue (#110)',async()=>{
 const select=vi.fn(),accepted=vi.fn();render(<HIGProvider onAccepted={accepted}><div role='listbox' aria-label='Markets'><div role='option' aria-selected='false' tabIndex={0} onKeyDown={event=>{if(event.key==='Enter')select();}}><MarketRow mode='presentation' symbol='BTC' name='Bitcoin' price={81741.25} priceOptions={{style:'decimal',maximumFractionDigits:1}} change={2.5} icon={<span aria-hidden='true'>₿</span>} favorite={<span aria-hidden='true'>☆</span>} volume={<NumberReadout value={1200000} options={{notation:'compact'}}/>} className='host-market' style={{gridTemplateColumns:'1fr 8ch 6ch 8ch'}}/></div></div><button type='button'>After</button></HIGProvider>);
 const option=screen.getByRole('option');expect(within(option).queryByRole('button')).toBeNull();expect(option.querySelector('[tabindex]')).toBeNull();expect(within(option).getByText('81,741.3')).toBeTruthy();expect(within(option).getByText('1.2M')).toBeTruthy();
 expect(option.querySelector('.hig-market-icon')?.textContent).toBe('₿');expect(option.querySelector('.hig-market-favorite')?.textContent).toBe('☆');expect(option.querySelector('.hig-market-row')?.classList.contains('host-market')).toBe(true);
 await userEvent.tab();expect(document.activeElement).toBe(option);await userEvent.keyboard('{Enter}');expect(select).toHaveBeenCalledOnce();expect(accepted).not.toHaveBeenCalled();await userEvent.tab();expect(document.activeElement).toBe(screen.getByRole('button',{name:'After'}));
});

it('keeps tiny prices, locale precision, zero and unknown values distinct in MarketRow (#110)',()=>{
 render(<HIGProvider locale='de-DE'><MarketRow mode='presentation' symbol='PEPE' name='Pepe' price={.00001234} change={null} priceOptions={{style:'decimal',maximumFractionDigits:8}}/><MarketRow mode='presentation' symbol='ZERO' name='Zero' price={0} change={0} priceOptions={{style:'decimal',minimumFractionDigits:1}}/><MarketRow mode='presentation' symbol='UNKNOWN' name='Unknown' price={null} change={null}/></HIGProvider>);
 expect([...document.querySelectorAll('.hig-market-price')].map(node=>node.textContent)).toEqual(['0,00001234','0,0','—']);
 expect(document.querySelector('[aria-live]')).toBeNull();
});
