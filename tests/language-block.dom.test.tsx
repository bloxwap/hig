// @vitest-environment jsdom
import React from 'react';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {act,cleanup,fireEvent,render,screen,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {readFileSync} from 'node:fs';
import {HIGProvider} from '../packages/hig/react/src/provider';
import {LanguageBlock,filterLanguages,type LanguageOption} from '../packages/hig/react/src/blocks/language-block';
afterEach(cleanup);
const languages:LanguageOption[]=[{code:'en',name:'English',description:'English'},{code:'es',name:'Español',description:'Spanish'},{code:'zh-Hans',name:'简体中文',description:'Chinese'},{code:'fr',name:'Français',description:'French',flag:'/fr.svg'}];
describe('filterLanguages',()=>{
 it('matches name, description and code, ignoring case and accents, and keeps the host order',()=>{
  expect(filterLanguages(languages,'').map(l=>l.code)).toEqual(['en','es','zh-Hans','fr']);
  expect(filterLanguages(languages,'  FRANCAIS ').map(l=>l.code)).toEqual(['fr']);
  expect(filterLanguages(languages,'chinese').map(l=>l.code)).toEqual(['zh-Hans']);expect(filterLanguages(languages,'中文').map(l=>l.code)).toEqual(['zh-Hans']);
  expect(filterLanguages(languages,'hans').map(l=>l.code)).toEqual(['zh-Hans']);expect(filterLanguages(languages,'sh').map(l=>l.code)).toEqual(['en','es']);
  expect(filterLanguages(languages,'klingon')).toEqual([]);
 });
});
describe('LanguageBlock',()=>{
 it('shows the header, a search field and each language as a radio with a check on the one in use',async()=>{
  const select=vi.fn(),back=vi.fn();render(<LanguageBlock languages={languages} value='en' onSelect={select} onBack={back}/>);
  expect(screen.getByRole('heading',{name:'Language'})).toBeTruthy();await userEvent.click(screen.getByRole('button',{name:'Back'}));expect(back).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('searchbox',{name:'Search languages'}).getAttribute('placeholder')).toBe('Search languages');
  const group=screen.getByRole('radiogroup',{name:'Language'});const radios=within(group).getAllByRole('radio');
  expect(radios.map(radio=>radio.textContent)).toEqual(['ENEnglishEnglish','ESEspañolSpanish','ZH简体中文Chinese','FrançaisFrench']);
  expect(radios.map(radio=>radio.getAttribute('aria-checked'))).toEqual(['true','false','false','false']);
  expect(radios[0].querySelector('.hig-language-check')).toBeTruthy();expect(radios[1].querySelector('.hig-language-check')).toBeNull();
  expect(radios[3].querySelector('.hig-language-flag img')?.getAttribute('src')).toBe('/fr.svg');expect(radios[3].querySelector('.hig-language-flag')?.getAttribute('aria-hidden')).toBe('true');expect(radios[3].getAttribute('lang')).toBe('fr');
  await userEvent.click(radios[1]);expect(select).toHaveBeenCalledWith(languages[1]);
 });
 it('filters as the user types, announces no results, and chooses with the keyboard from the field',async()=>{
  const select=vi.fn();render(<LanguageBlock languages={languages} onSelect={select}/>);
  const field=screen.getByRole('searchbox');
  await userEvent.type(field,'sh');expect(screen.getAllByRole('radio').map(radio=>radio.getAttribute('lang'))).toEqual(['en','es']);
  await userEvent.keyboard('{Enter}');expect(select).not.toHaveBeenCalled();
  await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}');expect(select).toHaveBeenLastCalledWith(languages[1]);
  await userEvent.clear(field);await userEvent.type(field,'fran{Enter}');expect(select).toHaveBeenLastCalledWith(languages[3]);
  await userEvent.clear(field);await userEvent.type(field,'klingon');expect(screen.queryByRole('radiogroup')).toBeNull();expect(screen.getByRole('status').textContent).toBe('No results');
 });
 it('leaves out the search field with search={false}, takes a title and a header action, and localizes its built-in text',()=>{
  const view=render(<LanguageBlock search={false} title='Idioma' headerAction={<button type='button'>Close</button>} languages={languages} onSelect={()=>{}}/>);
  expect(screen.queryByRole('searchbox')).toBeNull();expect(screen.getByRole('radiogroup',{name:'Idioma'})).toBeTruthy();expect(screen.getByRole('button',{name:'Close'})).toBeTruthy();
  view.rerender(<HIGProvider messages={{language:'Langue',searchLanguages:'Rechercher une langue'}}><LanguageBlock languages={languages} onSelect={()=>{}}/></HIGProvider>);
  expect(screen.getByRole('heading',{name:'Langue'})).toBeTruthy();expect(screen.getByRole('searchbox',{name:'Rechercher une langue'})).toBeTruthy();
 });
 it('draws a description under the header, and while disabled dims the rows and ignores presses and Enter',async()=>{
  const select=vi.fn();
  const view=render(<LanguageBlock languages={languages} value='en' onSelect={select} description='Choose the language used throughout the app.' disabled/>);
  const description=document.querySelector('.hig-language-block > .hig-settings-description')!;expect(description.textContent).toBe('Choose the language used throughout the app.');
  expect(description.previousElementSibling!.className).toBe('hig-screen-header');
  const group=screen.getByRole('radiogroup',{name:'Language'});expect(group.getAttribute('aria-disabled')).toBe('true');
  const rows=within(group).getAllByRole('radio') as HTMLButtonElement[];expect(rows.every(row=>row.disabled)).toBe(true);
  await userEvent.click(rows[1]);expect(select).not.toHaveBeenCalled();
  await userEvent.type(screen.getByRole('searchbox'),'fran{Enter}');expect(select).not.toHaveBeenCalled();
  view.rerender(<LanguageBlock languages={languages} value='en' onSelect={select}/>);expect(document.querySelector('.hig-settings-description')).toBeNull();
  expect(screen.getByRole('radiogroup').hasAttribute('aria-disabled')).toBe(false);
  expect(readFileSync('packages/hig/react/src/styles.css','utf8')).toContain('.hig-language-row:disabled,.hig-assets-row:disabled { opacity:.5;cursor:not-allowed; }');
 });
});

it('windows a long language list and keeps filtered choices selectable',async()=>{
 const options=Array.from({length:250},(_,i)=>({code:'en-x-'+i,name:'Language '+i}));
 const choose=vi.fn();
 render(<HIGProvider><LanguageBlock languages={options} onSelect={choose}/></HIGProvider>);
 expect(screen.getAllByRole('radio').length).toBeLessThan(30);
 const last=screen.getByRole('radio',{name:/Language 249/});
 expect(last.getAttribute('aria-posinset')).toBe('250');expect(last.getAttribute('aria-setsize')).toBe('250');
 const input=screen.getByRole('searchbox');await userEvent.type(input,'249{Enter}');
 expect(choose.mock.calls[0][0]).toBe(options[249]);
});

it('refreshes cached search text when a host edits language names, descriptions or codes',()=>{
 const option={code:'fr',name:'Français',description:'French'};
 expect(filterLanguages([option],'francais')).toEqual([option]);
 Object.assign(option,{code:'es',name:'Español',description:'Spanish'});
 for(const query of ['fr','french','francais'])expect(filterLanguages([option],query)).toHaveLength(0);
 for(const query of ['es','espanol','spanish'])expect(filterLanguages([option],query)).toEqual([option]);
});

it('opens an unfiltered large picker without copying the host array',()=>{
 const options=Array.from({length:10000},(_,i)=>({code:String(i),name:'Language '+i}));
 const iterate=vi.spyOn(options,Symbol.iterator);
 render(<LanguageBlock languages={options} onSelect={()=>{}}/>);
 expect(iterate).not.toHaveBeenCalled();
 expect(screen.getAllByRole('radio').length).toBeLessThan(50);
});


it('filters a large catalog once after a burst of edits and clears immediately',()=>{
 vi.useFakeTimers();
 try{
  const options=Array.from({length:1000},(_,i)=>({code:String(i),name:'Language '+i}));
  const scans=vi.spyOn(options,'filter');
  render(<LanguageBlock languages={options} onSelect={()=>{}}/>);
  const input=screen.getByRole('searchbox');
  for(const text of ['9','99','999'])fireEvent.change(input,{target:{value:text}});
  expect((input as HTMLInputElement).value).toBe('999');
  act(()=>vi.advanceTimersByTime(149));expect(scans).not.toHaveBeenCalled();
  act(()=>vi.advanceTimersByTime(1));expect(scans).toHaveBeenCalledTimes(1);
  expect(screen.getAllByRole('radio')).toHaveLength(1);
  fireEvent.change(input,{target:{value:''}});
  expect(screen.getAllByRole('radio').length).toBeGreaterThan(1);
 }finally{vi.useRealTimers();}
});

it.each(['Enter','ArrowDown'])('scans once when %s applies a pending query before the debounce timer',key=>{
 vi.useFakeTimers();
 try{
  const options=Array.from({length:1000},(_,i)=>({code:String(i),name:'Language '+i}));
  const scans=vi.spyOn(options,'filter'),select=vi.fn();
  const view=render(<LanguageBlock languages={options} onSelect={select}/>);
  const input=screen.getByRole('searchbox');
  fireEvent.change(input,{target:{value:'999'}});
  fireEvent.keyDown(input,{key});
  if(key==='ArrowDown')fireEvent.keyDown(input,{key:'Enter'});
  expect(select).toHaveBeenCalledWith(options[999]);
  act(()=>vi.advanceTimersByTime(150));
  expect(scans).toHaveBeenCalledTimes(1);
  view.rerender(<LanguageBlock languages={[{code:'new',name:'Replacement 999'}]} onSelect={select}/>);
  expect(screen.getByRole('radio').textContent).toContain('Replacement 999');
 }finally{vi.useRealTimers();}
});

it('updates the two selection marks and preserves focus on an unchanged language',()=>{
 const draw=vi.fn(()=>null),select=vi.fn();
 const picker=(value:string)=><HIGProvider pressDecoration={draw}><LanguageBlock languages={languages} value={value} onSelect={select}/></HIGProvider>;
 const {rerender}=render(picker('en'));
 const french=screen.getByRole('radio',{name:/Français/});french.focus();
 draw.mockClear();rerender(picker('es'));
 expect(draw).toHaveBeenCalledTimes(2);
 expect(screen.getByRole('radio',{name:/Español/}).getAttribute('aria-checked')).toBe('true');
 expect(document.activeElement).toBe(french);
});

it('updates only the selected virtual rows and retains their logical positions',()=>{
 const draw=vi.fn(()=>null);
 const options=Array.from({length:250},(_,i)=>({code:'en-x-'+i,name:'Language '+i}));
 const select=vi.fn();
 const scene=(value:string)=><HIGProvider pressDecoration={draw}><LanguageBlock languages={options} value={value} onSelect={select}/></HIGProvider>;
 const {rerender}=render(scene(options[0].code));
 draw.mockClear();rerender(scene(options[1].code));
 expect(draw).toHaveBeenCalledTimes(2);
 expect(screen.getByRole('radio',{name:'Language 1'}).getAttribute('aria-posinset')).toBe('2');
});

it('refreshes the visible and accessible names of a reused language option',async()=>{
 const option={code:'fr',name:'French',description:'Language of France',flag:'/old.svg'};
 const select=vi.fn();
 const scene=()=><LanguageBlock languages={[option]} onSelect={select}/>;
 const {rerender}=render(scene());
 Object.assign(option,{name:'Français',description:'French',flag:'/fr.svg'});
 rerender(scene());
 const radio=screen.getByRole('radio',{name:'Français French'});
 expect(radio.querySelector('img')?.getAttribute('src')).toBe('/fr.svg');
 await userEvent.click(radio);expect(select.mock.calls[0][0]).toBe(option);
});
