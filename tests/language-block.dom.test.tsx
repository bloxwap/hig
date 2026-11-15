// @vitest-environment jsdom
import React from 'react';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {cleanup,render,screen,within} from '@testing-library/react';
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
  expect(readFileSync('packages/hig/react/src/styles.css','utf8')).toContain('.hig-language-row:disabled { opacity:.5;cursor:not-allowed; }');
 });
});
