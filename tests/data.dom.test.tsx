import React,{useState} from 'react';
import {afterEach,it,expect,vi} from 'vitest';
import {render,screen,cleanup} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {HIGProvider} from '../packages/hig/react/src/provider';
import {List,NumberReadout,Percent,Table} from '../packages/hig/react/src/data';
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
 expect(screen.getByText('(stale)')).toBeTruthy();expect(document.querySelector('[aria-live]')).toBeNull();
});
it('sorts host-owned rows from a keyboard header while preserving table semantics',async()=>{
 function Example(){const [descending,set]=useState(false);const rows=[{id:'a',value:1},{id:'b',value:2}].sort((a,b)=>descending?b.value-a.value:a.value-b.value);return <Table caption='Positions' rows={rows} keyFor={r=>r.id} columns={[{key:'value',label:'Balance',sort:descending?'descending':'ascending',onSort:()=>set(!descending),render:r=>r.value}]}/>;}
 render(<Example/>);const button=screen.getByRole('button',{name:'Balance'});button.focus();await userEvent.keyboard('{Enter}');expect(screen.getByRole('columnheader').getAttribute('aria-sort')).toBe('descending');expect(screen.getAllByRole('cell').map(n=>n.textContent)).toEqual(['2','1']);expect(screen.getByRole('region',{name:'Positions'}).tabIndex).toBe(0);
});
it('retains list identity during live updates and exposes quiet loading/retry/pagination',async()=>{
 const {List}=await import('../packages/hig/react/src/data');let retries=0,pages=0;const items=[{id:'a',value:'1'}];
 const props={keyFor:(r:{id:string;value:string})=>r.id,render:(r:{id:string;value:string})=><input aria-label={r.id} defaultValue={r.value}/>,onRetry:()=>retries++,onLoadMore:()=>pages++};
 const {rerender}=render(<List {...props} label='Balances' items={items}/>);const input=screen.getByRole('textbox');input.focus();
 rerender(<List {...props} items={[{id:'a',value:'2'}]} error='Offline'/>);expect(screen.getByRole('textbox')).toBe(input);expect(document.activeElement).toBe(input);
 await userEvent.click(screen.getByRole('button',{name:'Retry'}));await userEvent.click(screen.getByRole('button',{name:'Load more'}));expect([retries,pages]).toEqual([1,1]);
 rerender(<List {...props} items={[]} loading/>);expect(screen.queryByText('No items')).toBeNull();expect(screen.getByRole('status').textContent).toBe('Loading items');expect((screen.getByRole('button',{name:'Load more'}) as HTMLButtonElement).disabled).toBe(true);
});
it('includes the current numeric reading and stale state in an explicit accessible label',()=>{
 render(<NumberReadout label='Balance' value={0} stale/>);expect(screen.getByLabelText('Balance: 0 (stale)')).toBeTruthy();
});
it('includes optional affixes once for known static readings and suppresses them for unknown',()=>{
 const {rerender}=render(<NumberReadout label='Total' value={0} prefix='$' suffix=' USD' stale/>);expect(screen.getByLabelText('Total: $0 USD (stale)')).toBeTruthy();expect(document.querySelector('.hig-number')?.textContent).toBe('$0 USD (stale)');
 rerender(<NumberReadout label='Total' value={null} prefix='$' suffix=' USD' stale/>);expect(screen.getByLabelText('Total: — (stale)')).toBeTruthy();expect(document.querySelector('.hig-number')?.textContent).toBe('— (stale)');
 rerender(<NumberReadout value={12} prefix='≈' suffix=' coins'/>);expect(document.querySelector('.hig-number')?.textContent).toBe('≈12 coins');
});

it('updates list pagination without revisiting unchanged rows',()=>{
 const items=Array.from({length:1000},(_,index)=>String(index));
 const keyFor=vi.fn((id:string)=>id);
 const draw=vi.fn((id:string)=>id);
 const {rerender}=render(<List items={items} keyFor={keyFor} render={draw}/>);
 expect(keyFor).toHaveBeenCalledTimes(items.length);
 expect(draw.mock.calls.length).toBeGreaterThan(0);
 expect(draw.mock.calls.length).toBeLessThan(50);
 keyFor.mockClear();
 draw.mockClear();
 rerender(<List items={items} keyFor={keyFor} render={draw} loading/>);
 expect(screen.getByRole('status').textContent).toBe('Loading items');
 expect(keyFor).not.toHaveBeenCalled();
 expect(draw).not.toHaveBeenCalled();
});

it('renders only new or changed items when a list page arrives',()=>{
 const items=Array.from({length:40},(_,id)=>({id,value:id}));
 const keyFor=(item:typeof items[number])=>String(item.id);
 const draw=vi.fn((item:typeof items[number])=><input aria-label={keyFor(item)} defaultValue={item.value}/>);
 const list=(rows:typeof items)=><List items={rows} keyFor={keyFor} render={draw}/>;
 const {rerender}=render(list(items));
 const focused=screen.getByRole('textbox',{name:'3'});
 focused.focus();
 draw.mockClear();
 const appended=[...items,{id:40,value:40}];
 rerender(list(appended));
 expect(draw.mock.calls.map(([item])=>item.id)).toEqual([40]);
 draw.mockClear();
 rerender(list(appended.map(item=>item.id===7?{...item,value:77}:item)));
 expect(draw.mock.calls.map(([item])=>item.value)).toEqual([77]);
 expect(document.activeElement).toBe(focused);
});

it('preserves a focused row when crossing the virtualization threshold in either direction',async()=>{
 const items=Array.from({length:51},(_,index)=>String(index));
 const props={keyFor:(id:string)=>id,render:(id:string)=><button>{id}</button>};
 const {rerender}=render(<List {...props} items={items.slice(0,50)}/>);
 expect(screen.getAllByRole('listitem')).toHaveLength(50);
 const focused=screen.getByRole('button',{name:'36'});
 await userEvent.click(focused);
 rerender(<List {...props} items={items}/>);
 expect(screen.getAllByRole('listitem').length).toBeLessThan(50);
 expect(document.activeElement).toBe(focused);
 expect(focused.closest('li')?.getAttribute('aria-posinset')).toBe('37');
 rerender(<List {...props} items={items.slice(0,50)}/>);
 expect(document.activeElement).toBe(focused);
 expect(screen.getAllByRole('listitem')).toHaveLength(50);
});

it('keeps a focused virtual row mounted when it moves outside the visible range',async()=>{
 const items=Array.from({length:1000},(_,index)=>String(index));
 const props={keyFor:(id:string)=>id,render:(id:string)=><button>{id}</button>};
 const {rerender}=render(<List {...props} items={items}/>);
 const focused=screen.getByRole('button',{name:'999'});
 await userEvent.click(focused);
 rerender(<List {...props} items={[...items.slice(0,500),'999',...items.slice(500,-1)]}/>);
 expect(document.activeElement).toBe(focused);
 expect(focused.closest('li')?.getAttribute('aria-posinset')).toBe('501');
});

it('updates translated list status without revisiting the collection',()=>{
 let lengthReads=0;
 const items=new Proxy(Array.from({length:1000},(_,index)=>String(index)),{
  get(target,key,receiver){if(key==='length')lengthReads++;return Reflect.get(target,key,receiver);},
 });
 const list=<List items={items} keyFor={id=>id} render={id=>id} loading/>;
 const view=render(<HIGProvider>{list}</HIGProvider>);
 expect(lengthReads).toBeGreaterThan(0);
 lengthReads=0;
 view.rerender(<HIGProvider messages={{loadingItems:'Fetching balances'}}>{list}</HIGProvider>);
 expect(screen.getByRole('status').textContent).toBe('Fetching balances');
 expect(lengthReads).toBe(0);
});

it('measures only lists inside scrollers that moved during the frame',async()=>{
 const {act}=await import('@testing-library/react');
 vi.useFakeTimers({toFake:['requestAnimationFrame','cancelAnimationFrame']});
 try{
  const items=Array.from({length:80},(_,i)=>String(i));
  const panel=(label:string)=><div data-testid={label} style={{overflowY:'auto'}}><List items={items} label={label} keyFor={String} render={String}/></div>;
  render(<div data-testid="outer" style={{overflowY:'auto'}}>{panel('left')}{panel('right')}</div>);
  const reads=screen.getAllByRole('list').map(list=>vi.spyOn(list,'getBoundingClientRect'));
  function scroll(...targets:EventTarget[]){
   reads.forEach(spy=>spy.mockClear());
   act(()=>{for(const target of targets)target.dispatchEvent(new Event('scroll'));vi.advanceTimersByTime(32);});
   return reads.map(spy=>spy.mock.calls.length);
  }
  const left=screen.getByTestId('left'),right=screen.getByTestId('right');
  expect(scroll(left,left)).toEqual([1,0]);
  expect(scroll(right)).toEqual([0,1]);
  expect(scroll(left,right)).toEqual([1,1]);
  expect(scroll(screen.getByTestId('outer'))).toEqual([1,1]);
  expect(scroll(document)).toEqual([1,1]);
 }finally{cleanup();vi.useRealTimers();}
});
