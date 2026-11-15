// @vitest-environment jsdom
import React from 'react';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {cleanup,render,screen,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {readFileSync} from 'node:fs';
import {HIGProvider} from '../packages/hig/react/src/provider';
import {SoundHapticsBlock,soundLevel,type SoundSection} from '../packages/hig/react/src/blocks/sound-haptics-block';
import {SignalsBlock,type SignalsGroup} from '../packages/hig/react/src/blocks/signals-block';
import {NotificationsBlock} from '../packages/hig/react/src/blocks/notifications-block';
import * as blocks from '../packages/hig/react/src/blocks';
afterEach(cleanup);
const q=(selector:string)=>document.querySelector<HTMLElement>(selector);
const cards=()=>[...document.querySelectorAll<HTMLElement>('.hig-setting-card')];
const toggle=(name:string)=>screen.getByRole('switch',{name}) as HTMLInputElement;
describe('SoundHapticsBlock',()=>{
 const noop=()=>{};
 const sections=(over:Partial<SoundSection>={}):SoundSection[]=>[
  {id:'effects',label:'Effects',checked:true,onCheckedChange:noop,volume:{label:'Volume',value:0.25,onValueChange:noop},...over},
  {id:'mic',label:'Mic input',checked:true,onCheckedChange:noop,source:'iPhone Microphone',level:0.17,volume:{label:'Mic volume',value:1,onValueChange:noop}},
  {id:'haptics',label:'Haptics',checked:false,onCheckedChange:noop},
 ];
 it('clamps the meter level and reads unknown as empty',()=>{
  expect([0.17,0,1,1.4,-2,null,undefined,Number.NaN].map(soundLevel)).toEqual([0.17,0,1,1,0,0,0,0]);
 });
 it('draws one card per channel with a switch, and the volume steps of a channel that is on',async()=>{
  const back=vi.fn(),flip=vi.fn(),volume=vi.fn();
  render(<SoundHapticsBlock title='Sound & Haptics' onBack={back} sections={sections({onCheckedChange:flip,volume:{label:'Volume',value:0.25,onValueChange:volume}})}/>);
  expect(screen.getByRole('heading',{name:'Sound & Haptics'})).toBeTruthy();await userEvent.click(screen.getByRole('button',{name:'Back'}));expect(back).toHaveBeenCalledTimes(1);
  expect(cards()).toHaveLength(3);expect(screen.getAllByRole('switch').map(input=>(input as HTMLInputElement).checked)).toEqual([true,true,false]);
  const steps=within(screen.getByRole('group',{name:'Volume'})).getAllByRole('button');
  expect(steps.map(step=>[step.textContent,step.getAttribute('aria-pressed'),step.dataset.intent])).toEqual([['25%','true','primary'],['50%','false','secondary'],['75%','false','secondary'],['100%','false','secondary']]);
  await userEvent.click(steps[2]);expect(volume).toHaveBeenCalledWith(0.75);
  // The whole row is the target: pressing the label flips the switch.
  await userEvent.click(screen.getByText('Effects'));expect(flip).toHaveBeenCalledWith(false);
  // A channel without extras is a switch alone.
  expect(cards()[2].querySelector('.hig-setting-body')).toBeNull();
 });
 it('shows the device and a live meter for an input channel, and hides the extras while a channel is off',()=>{
  const view=render(<SoundHapticsBlock title='Sound' sections={sections()}/>);
  const mic=cards()[1];expect(mic.querySelector('.hig-setting-caption')!.textContent).toBe('iPhone Microphone');
  expect(mic.querySelector('.hig-setting-meter')!.getAttribute('aria-hidden')).toBe('true');expect(mic.querySelector<HTMLElement>('.hig-setting-meter > span')!.style.width).toBe('17%');
  expect(within(mic).getByRole('group',{name:'Mic volume'})).toBeTruthy();expect(within(mic).getByRole('button',{name:'100%'}).getAttribute('aria-pressed')).toBe('true');
  view.rerender(<SoundHapticsBlock title='Sound' sections={sections({checked:false})}/>);expect(cards()[0].querySelector('.hig-setting-body')).toBeNull();expect(screen.queryByRole('group',{name:'Volume'})).toBeNull();
  // Host steps and an unknown level.
  view.rerender(<SoundHapticsBlock title='Sound' sections={[{id:'mic',label:'Mic',checked:true,onCheckedChange:noop,level:null,volume:{label:'Gain',options:[0.5,1],value:1,onValueChange:noop}}]}/>);
  expect(q('.hig-setting-meter > span')!.style.width).toBe('0%');expect(within(screen.getByRole('group',{name:'Gain'})).getAllByRole('button').map(step=>step.textContent)).toEqual(['50%','100%']);
  view.rerender(<SoundHapticsBlock title='Sound' sections={[]}/>);expect(q('.hig-setting-cards')).toBeNull();
 });
 it('dims and blocks a disabled channel, and formats steps in the provider locale',async()=>{
  const flip=vi.fn(),volume=vi.fn();
  render(<HIGProvider locale='fr-FR'><SoundHapticsBlock title='Son' sections={sections({disabled:true,onCheckedChange:flip,volume:{label:'Volume',value:0.5,onValueChange:volume}})}/></HIGProvider>);
  expect(toggle('Effects').disabled).toBe(true);expect(q('.hig-setting-switch')!.getAttribute('data-disabled')).toBe('true');
  const steps=within(screen.getByRole('group',{name:'Volume'})).getAllByRole('button') as HTMLButtonElement[];expect(steps.every(step=>step.disabled)).toBe(true);expect(steps[0].textContent).toMatch(/^25\s%$/);
  await userEvent.click(steps[0]);expect(volume).not.toHaveBeenCalled();expect(flip).not.toHaveBeenCalled();
 });
});
describe('SignalsBlock',()=>{
 const groups=(flip=()=>{},help=()=>{}):SignalsGroup[]=>[
  {id:'trend',title:'Trend',help:{label:'How it works',onSelect:help},items:[{id:'trend',label:'Trend',description:'Direction marks on markets that just moved hard.',checked:true,onCheckedChange:flip},{id:'feed',label:'Live Activity Feed',description:'A rolling feed of signal fires.',checked:true,onCheckedChange:flip}]},
  {id:'swing',title:'Swing',verified:true,items:[{id:'swing',label:'Swing',checked:false,onCheckedChange:flip,disabled:true}]},
 ];
 it('draws each group as a headed region whose switches share one container, described by their line of explanation',async()=>{
  const flip=vi.fn(),help=vi.fn();render(<SignalsBlock title='Signals' verifiedLabel='Verified' groups={groups(flip,help)}/>);
  expect(screen.getByRole('heading',{name:'Signals'})).toBeTruthy();
  const trend=screen.getByRole('region',{name:'Trend'}),swing=screen.getByRole('region',{name:/^Swing/});
  expect(trend.querySelectorAll('.hig-setting-list > .hig-setting-card')).toHaveLength(2);expect(swing.querySelectorAll('.hig-setting-list > .hig-setting-card')).toHaveLength(1);
  const first=within(trend).getByRole('switch',{name:'Trend'}) as HTMLInputElement;expect(first.checked).toBe(true);
  expect(document.getElementById(first.getAttribute('aria-describedby')!)!.textContent).toBe('Direction marks on markets that just moved hard.');
  await userEvent.click(first);expect(flip).toHaveBeenCalledWith(false);
  await userEvent.click(within(trend).getByRole('button',{name:'How it works'}));expect(help).toHaveBeenCalledTimes(1);// It is the small pill, not a full-size button.
  expect(within(trend).getByRole('button',{name:'How it works'}).className).toBe('hig-swap-pill');expect(trend.querySelector('.hig-button')).toBeNull();
  // Only the verified group carries the mark and it has no help capsule; its switch is off, blocked and has no description.
  expect(within(swing).getByRole('img',{name:'Verified'})).toBeTruthy();expect(within(trend).queryByRole('img')).toBeNull();expect(within(swing).queryByRole('button')).toBeNull();
  const last=within(swing).getByRole('switch',{name:'Swing'}) as HTMLInputElement;expect([last.checked,last.disabled,last.hasAttribute('aria-describedby')]).toEqual([false,true,false]);
 });
 it('keeps the verified mark decorative without a name, and draws a group without items as a heading alone',()=>{
  render(<SignalsBlock title='Signals' groups={[{id:'swing',title:'Swing',verified:true,items:[]}]}/>);
  expect(screen.queryByRole('img')).toBeNull();expect(q('.hig-reward-verified svg')!.getAttribute('aria-hidden')).toBe('true');expect(q('.hig-setting-list')).toBeNull();expect(screen.getByRole('heading',{name:'Swing'})).toBeTruthy();
 });
});
describe('NotificationsBlock',()=>{
 it('draws one card per kind with a switch, and a failure under its card as an alert',async()=>{
  const push=vi.fn(),back=vi.fn();
  const items=(error?:string)=>[{id:'push',label:'Push notifications',description:'Delivered to your device.',checked:false,onCheckedChange:push,error},{id:'swing',label:'Swing notifications',checked:true,onCheckedChange:()=>{}}];
  const view=render(<NotificationsBlock title='Notifications' onBack={back} items={items()}/>);
  expect(screen.getByRole('heading',{name:'Notifications'})).toBeTruthy();await userEvent.click(screen.getByRole('button',{name:'Back'}));expect(back).toHaveBeenCalledTimes(1);
  expect(cards()).toHaveLength(2);expect([toggle('Push notifications').checked,toggle('Swing notifications').checked]).toEqual([false,true]);expect(screen.queryByRole('alert')).toBeNull();
  await userEvent.click(toggle('Push notifications'));expect(push).toHaveBeenCalledWith(true);
  // The host keeps the switch off and reports why.
  view.rerender(<NotificationsBlock title='Notifications' items={items('Push request timed out')}/>);
  const alert=screen.getByRole('alert');expect(alert.textContent).toBe('Push request timed out');expect(alert.previousElementSibling).toBe(cards()[0]);expect(toggle('Push notifications').checked).toBe(false);
  view.rerender(<NotificationsBlock title='Notifications' items={[]}/>);expect(q('.hig-setting-cards')).toBeNull();
 });
});
describe('settings blocks',()=>{
 it('are in the aggregate, ship no words of their own, and share the switch row',()=>{
  expect(blocks.SoundHapticsBlock).toBe(SoundHapticsBlock);expect(blocks.SignalsBlock).toBe(SignalsBlock);expect(blocks.NotificationsBlock).toBe(NotificationsBlock);expect(blocks.soundLevel).toBe(soundLevel);
  for(const file of ['sound-haptics-block','signals-block','notifications-block','setting-switch']){const source=readFileSync(`packages/hig/react/src/blocks/${file}.tsx`,'utf8');expect(source,file).not.toMatch(/messages\./);if(file!=='setting-switch')expect(source,file).toContain("from './setting-switch.js'");}
  const css=readFileSync('packages/hig/react/src/styles.css','utf8');expect(css).toMatch(/\.hig-setting-switch \{[^}]*min-height:var\(--hig-control\)/);
  // The row is the label the target size gate measures (scripts/target-size.mjs), not the 40x24 track inside it.
  expect(readFileSync('packages/hig/react/src/blocks/setting-switch.tsx','utf8')).toContain("<label className='hig-choice hig-setting-switch'");
 });
});

it('switch rows keep the track flush with the trailing edge and level with the first line of the label',()=>{
 const css=readFileSync('packages/hig/react/src/styles.css','utf8').split('\n');const rule=(start:string)=>css.find(line=>line.startsWith(start))??'';
 // Top-aligned row; the text is padded so its first line is centred on the control height, where the track is centred too.
 expect(rule('.hig-setting-switch {')).toContain('align-items:flex-start');
 expect(rule('.hig-setting-switch-text {')).toContain('padding-block:calc((var(--hig-control) - 1.5em)/2)');
 const track=rule('.hig-setting-switch > .hig-switch {');expect(track).toContain('justify-content:flex-end');expect(track).toContain('height:var(--hig-control)');expect(track).not.toMatch(/min-width/);
 // A list row that holds a switch aligns to the first line as well.
 expect(rule('.hig-list-row:has(> .hig-list-row-trailing .hig-switch) {')).toContain('align-items:flex-start');
 // The switch keeps its 44-unit target; the track is flush right inside it.
 const inRow=rule('.hig-list-row-trailing .hig-switch {');expect(inRow).toMatch(/padding-inline:0;justify-content:flex-end/);expect(inRow).not.toMatch(/min-width/);
});
