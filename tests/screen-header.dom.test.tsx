// @vitest-environment jsdom
import React from 'react';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {readFileSync} from 'node:fs';
import {HIGProvider} from '../packages/hig/react/src/provider';
import {ScreenHeader} from '../packages/hig/react/src/blocks/screen-header';
import {AccountBlock} from '../packages/hig/react/src/blocks/account-block';
afterEach(cleanup);
describe('ScreenHeader',()=>{
 it('is published on its own entry for host panes that have no block, on web and native',()=>{
  const exportsMap=JSON.parse(readFileSync('packages/hig/package.json','utf8')).exports as Record<string,{import:string}>;
  expect(exportsMap['./react/blocks/screen-header'].import).toBe('./react/dist/blocks/screen-header.js');
  expect(exportsMap['./native/screen-header'].import).toBe('./native/dist/screen-header.js');
 });
 it('draws the same header as the blocks: Back leading, the title centred, the host control trailing',async()=>{
  const back=vi.fn();
  const {container}=render(<HIGProvider><ScreenHeader title='Edit target' onBack={back} action={<button type='button'>Done</button>}/></HIGProvider>);
  const header=container.querySelector('.hig-screen-header') as HTMLElement;
  expect([...header.children].map(child=>child.className)).toEqual(['hig-screen-header-side','hig-screen-title','hig-screen-header-side']);
  expect(screen.getByRole('heading',{level:2,name:'Edit target'})).toBeTruthy();
  await userEvent.click(screen.getByRole('button',{name:'Back'}));expect(back).toHaveBeenCalledTimes(1);
  // A block draws the very same markup.
  const block=render(<HIGProvider><AccountBlock assets={[]} onBack={()=>{}}/></HIGProvider>).container.querySelector('.hig-screen-header') as HTMLElement;
  expect(block.firstElementChild?.outerHTML).toBe(header.firstElementChild?.outerHTML);
 });
 it('gives the heading an id only when the host asks, so a dialog can be named by it',()=>{
  const {container,rerender}=render(<ScreenHeader title='Position'/>);
  expect(container.querySelector('h2')?.hasAttribute('id')).toBe(false);
  expect(container.innerHTML).toBe('<div class="hig-screen-header"><span class="hig-screen-header-side"></span><h2 class="hig-screen-title">Position</h2><span class="hig-screen-header-side"></span></div>');
  rerender(<div role='dialog' aria-labelledby='position-title'><ScreenHeader title='Position' headingId='position-title'/></div>);
  expect(screen.getByRole('dialog',{name:'Position'})).toBeTruthy();expect(container.querySelector('h2')?.id).toBe('position-title');
 });
 it('draws a host badge beside the title, inside the heading (Unreleased)',()=>{
  const {container}=render(<ScreenHeader title='Trade' badge='Demo' headingId='trade-title'/>);
  expect(container.querySelector('h2')!.innerHTML).toBe('Trade <span class="hig-badge hig-screen-badge">Demo</span>');
  expect(screen.getByRole('heading',{name:'Trade Demo'}).id).toBe('trade-title');
 });
});
