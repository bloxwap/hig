import React from 'react';
import {cleanup,render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {afterEach,expect,it,vi} from 'vitest';
import {Breadcrumb,Tabs,Search,Navigation} from '../packages/hig/react/src/navigation';
import {HIGProvider} from '../packages/hig/react/src/provider';

afterEach(cleanup);

const items=[
 {value:'unavailable',label:'Unavailable',content:'Unavailable panel',disabled:true},
 {value:'overview',label:'Overview',content:'Overview panel'},
 {value:'activity',label:'Activity',content:'Activity panel'},
 {value:'details',label:'Details',content:'Details panel'},
];

it('starts at an enabled tab and keeps disabled tabs out of keyboard navigation',async()=>{
 render(<HIGProvider direction='rtl'><Tabs label='Account' items={items}/></HIGProvider>);
 await userEvent.tab();
 expect(document.activeElement).toBe(screen.getByRole('tab',{name:'Overview'}));
 expect(screen.getByRole('tabpanel').textContent).toBe('Overview panel');
 await userEvent.keyboard('{ArrowLeft}');
 expect(document.activeElement).toBe(screen.getByRole('tab',{name:'Activity'}));
 await userEvent.keyboard('{End}');
 expect(document.activeElement).toBe(screen.getByRole('tab',{name:'Details'}));
 await userEvent.keyboard('{Home}');
 expect(document.activeElement).toBe(screen.getByRole('tab',{name:'Overview'}));
 await userEvent.keyboard('{ArrowRight}');
 expect(document.activeElement).toBe(screen.getByRole('tab',{name:'Details'}));
});

it('moves from the focused tab when a controlled selection is not accepted',async()=>{
 const change=vi.fn();
 render(<Tabs label='Account' items={items} value='overview' onValueChange={change}/>);
 await userEvent.tab();
 await userEvent.keyboard('{ArrowRight}{ArrowRight}');
 expect(document.activeElement).toBe(screen.getByRole('tab',{name:'Details'}));
 expect(change.mock.calls.map(([value])=>value)).toEqual(['activity','details']);
 expect(screen.getByRole('tabpanel').textContent).toBe('Overview panel');
});

it('keeps an enabled tab reachable if the controlled value becomes disabled',async()=>{
 render(<Tabs label='Account' items={items} value='unavailable'/>);
 await userEvent.tab();
 expect(document.activeElement).toBe(screen.getByRole('tab',{name:'Overview'}));
});

it('marks only the final breadcrumb as the current page, including when linked',()=>{
 render(<Breadcrumb items={[{label:'Account'},{label:'Markets',href:'/markets'},{label:'Bitcoin',href:'/markets/btc'}]}/>);
 expect(document.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
 expect(screen.getByRole('link',{name:'Bitcoin'}).getAttribute('aria-current')).toBe('page');
 expect(screen.getByRole('link',{name:'Markets'}).hasAttribute('aria-current')).toBe(false);
 expect(screen.getByText('Account').hasAttribute('aria-current')).toBe(false);
});

it.each([40,1000])('preserves %i search results across input edits and reverse tab navigation',async count=>{
 let reads=0;
 const select=vi.fn();
 const results=Array.from({length:count},(_,i)=>({id:String(i),get label(){reads++;return 'Result '+i;},onSelect:()=>select(i)}));
 const tree=(query:string)=><HIGProvider><Search results={results} query={query} onQueryChange={()=>{}}/><button>After results</button></HIGProvider>;
 const {rerender}=render(tree(''));
 const rows=screen.getAllByRole('listitem');
 if(count>50){expect(rows.length).toBeLessThan(30);expect(rows[0].getAttribute('aria-setsize')).toBe(String(count));}
 else expect(rows).toHaveLength(count);
 reads=0;rerender(tree('a'));expect(reads).toBe(0);
 screen.getByRole('button',{name:'After results'}).focus();
 const user=userEvent.setup();
 await user.tab({shift:true});expect(document.activeElement?.textContent).toBe('Result '+(count-1));
 await user.tab({shift:true});await user.keyboard('{Enter}');expect(select).toHaveBeenCalledWith(count-2);
});

it.each([40,1000])('refreshes one changed search result among %i while retaining focus',async count=>{
 const reads=vi.fn(),oldAction=vi.fn(),newAction=vi.fn();
 const results=Array.from({length:count},(_,i)=>({id:String(i),get label(){reads(i);return 'Result '+i;},onSelect:oldAction}));
 const tree=(items:typeof results)=><Search query='result' onQueryChange={()=>{}} results={items}/>;
 const {rerender}=render(tree(results));
 const initial=screen.getByRole('button',{name:'Result 0'});initial.focus();
 reads.mockClear();
 rerender(tree([{id:'0',get label(){reads(0);return 'Updated result';},onSelect:newAction},...results.slice(1)]));
 expect(reads.mock.calls).toEqual([[0]]);
 expect(screen.getByRole('button',{name:'Updated result'})).toBe(document.activeElement);
 await userEvent.keyboard('{Enter}');
 expect(newAction).toHaveBeenCalledOnce();expect(oldAction).not.toHaveBeenCalled();
});

it('leaves search results alone when provider feedback changes and updates translated labels',()=>{
 const lengthReads=vi.fn();
 const results=new Proxy([] as {id:string;label:string;onSelect:()=>void}[],{
  get(target,property,receiver){
   if(property==='length') lengthReads();
   return Reflect.get(target,property,receiver);
  },
 });
 const search=<Search query='' onQueryChange={()=>{}} results={results}/>;
 const first=vi.fn(),second=vi.fn();
 const {rerender}=render(<HIGProvider onAccepted={first}>{search}</HIGProvider>);
 expect(lengthReads).toHaveBeenCalled();
 lengthReads.mockClear();
 rerender(<HIGProvider onAccepted={second}>{search}</HIGProvider>);
 expect(lengthReads).not.toHaveBeenCalled();
 rerender(<HIGProvider onAccepted={second} messages={{noResults:'No matching entries'}}>{search}</HIGProvider>);
 expect(screen.getByRole('status').textContent).toBe('No matching entries');
});

it('windows long navigation and keeps the active destination and tab boundaries mounted',()=>{
 const items=Array.from({length:1000},(_,i)=>({href:'/page/'+i,label:'Page '+i,active:i===800}));
 const view=(count:number)=><Navigation label='Pages' items={items.slice(0,count)}/>;
 const {rerender}=render(view(50));
 expect(screen.getAllByRole('link')).toHaveLength(50);
 rerender(view(51));expect(screen.getAllByRole('link').length).toBeLessThan(30);
 rerender(view(1000));
 expect(screen.getByRole('navigation',{name:'Pages'})).toBeTruthy();
 expect(screen.getByRole('link',{name:'Page 800'}).getAttribute('aria-current')).toBe('page');
 expect(screen.getByRole('link',{name:'Page 999'}).getAttribute('href')).toBe('/page/999');
 expect(screen.queryByRole('link',{name:'Page 500'})).toBeNull();
});
