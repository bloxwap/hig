import React from 'react';
import {cleanup,render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {afterEach,expect,it,vi} from 'vitest';
import {Breadcrumb,Tabs} from '../packages/react/src/navigation';
import {HIGProvider} from '../packages/react/src/provider';

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
