import React,{useLayoutEffect,useState} from 'react';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {afterEach,it,expect} from 'vitest';
import {HIGProvider} from '../packages/hig/react/src/provider';
import {Tabs} from '../packages/hig/react/src/navigation';

afterEach(cleanup);
it('sets a newly visible panel tab stop before a parent layout effect can observe it (#97)',()=>{
 const observations:(string|null)[]=[];
 function Host(){
  const [value,setValue]=useState('notes');
  useLayoutEffect(()=>{observations.push(document.querySelector('[role="tabpanel"]:not([hidden])')?.getAttribute('tabindex')??null);},[value]);
  return <Tabs label='Example' value={value} onValueChange={setValue} items={[{value:'notes',label:'Notes',content:'Read the introduction'},{value:'code',label:'Code',content:<pre tabIndex={0}>npm install example</pre>}]}/>;
 }
 render(<Host/>);
 fireEvent.click(screen.getByRole('tab',{name:'Code'}));
 expect(observations).toEqual(['0',null]);
 expect(screen.getByRole('tabpanel').hasAttribute('tabindex')).toBe(false);
 fireEvent.click(screen.getByRole('tab',{name:'Notes'}));
 expect(screen.getByRole('tabpanel').tabIndex).toBe(0);
});

it('keeps tab navigation idle across density changes and updates RTL arrow keys',()=>{
 let reads=0;
 const items=[{get value(){reads++;return 'a';},label:'A',content:'A'},{value:'b',label:'B',content:'B'},{value:'c',label:'C',content:'C'}];
 const tabs=<Tabs label="Sections" items={items}/>;
 const view=render(<HIGProvider density="comfortable" direction="ltr">{tabs}</HIGProvider>);
 expect(reads).toBeGreaterThan(0);
 reads=0;
 view.rerender(<HIGProvider density="compact" direction="ltr">{tabs}</HIGProvider>);
 expect(reads).toBe(0);
 view.rerender(<HIGProvider density="compact" direction="rtl">{tabs}</HIGProvider>);
 fireEvent.keyDown(screen.getByRole('tab',{name:'A'}),{key:'ArrowLeft'});
 expect(screen.getByRole('tab',{name:'B'}).getAttribute('aria-selected')).toBe('true');
});
