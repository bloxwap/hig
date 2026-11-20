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
  expect(cards()).toHaveLength(4);expect(screen.getAllByRole('switch').map(input=>(input as HTMLInputElement).checked)).toEqual([true,true,false]);
  const steps=within(screen.getByRole('group',{name:'Volume'})).getAllByRole('button');
  expect(steps.map(step=>[step.textContent,step.getAttribute('aria-pressed'),step.dataset.intent])).toEqual([['25%','true','primary'],['50%','false','secondary'],['75%','false','secondary'],['100%','false','secondary']]);
  await userEvent.click(steps[2]);expect(volume).toHaveBeenCalledWith(0.75);
  // The whole row is the target: pressing the label flips the switch.
  await userEvent.click(screen.getByText('Effects'));expect(flip).toHaveBeenCalledWith(false);
  // A channel without extras is a switch alone.
  expect(cards()[3].querySelector('.hig-setting-body')).toBeNull();
 });
 it('shows the device and a live meter for an input channel, and hides the extras while a channel is off',()=>{
  const view=render(<SoundHapticsBlock title='Sound' sections={sections()}/>);
  const mic=cards()[1],input=mic.nextElementSibling!;expect(input.classList.contains('hig-setting-input')).toBe(true);expect(input.querySelector('.hig-setting-caption')!.textContent).toBe('iPhone Microphone');
  expect(input.querySelector('.hig-setting-meter')).toBeNull();
  expect(mic.querySelector('.hig-setting-caption + .hig-setting-meter + .hig-setting-steps')).toBeTruthy();
  expect(mic.querySelector('.hig-setting-meter')!.getAttribute('aria-hidden')).toBe('true');expect(mic.querySelector<HTMLElement>('.hig-setting-meter > span')!.style.transform).toBe('scaleX(0.17)');
  expect(within(mic).getByRole('group',{name:'Mic volume'})).toBeTruthy();expect(within(mic).getByRole('button',{name:'100%'}).getAttribute('aria-pressed')).toBe('true');
  view.rerender(<SoundHapticsBlock title='Sound' sections={sections({checked:false})}/>);expect(cards()[0].querySelector('.hig-setting-body')).toBeNull();expect(screen.queryByRole('group',{name:'Volume'})).toBeNull();
  // Host steps and an unknown level.
  view.rerender(<SoundHapticsBlock title='Sound' sections={[{id:'mic',label:'Mic',checked:true,onCheckedChange:noop,level:null,volume:{label:'Gain',options:[0.5,1],value:1,onValueChange:noop}}]}/>);
  expect(q('.hig-setting-meter > span')!.style.transform).toBe('scaleX(0)');expect(within(screen.getByRole('group',{name:'Gain'})).getAllByRole('button').map(step=>step.textContent)).toEqual(['50%','100%']);
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
describe('settings host slots (Unreleased)',()=>{
 const noop=()=>{};
 it('SoundHapticsBlock: a device choice under the source, a named level meter, an action, and volume kept disabled while off',async()=>{
  const choose=vi.fn(),open=vi.fn(),volume=vi.fn();
  const mic:SoundSection={id:'mic',label:'Mic input',checked:true,onCheckedChange:noop,source:'USB Mic',level:0.426,levelLabel:'Input level',
   choices:{label:'Input',options:[{value:'auto',label:'Automatic'},{value:'usb',label:'USB Mic'}],value:'auto',onValueChange:choose},
   volume:{label:'Mic volume',value:1,onValueChange:volume},action:{label:'Open Settings',onSelect:open}};
  const view=render(<SoundHapticsBlock title='Sound & Haptics' description='How the app sounds and feels.' sections={[mic]}/>);
  expect(q('.hig-settings-block > .hig-settings-description')!.textContent).toBe('How the app sounds and feels.');
  expect(screen.queryByRole('group',{name:'Input'})).toBeNull();
  await userEvent.click(screen.getByRole('button',{name:'USB Mic Automatic'}));
  expect(screen.getByRole('heading',{name:'Input'})).toBeTruthy();
  expect(screen.queryByRole('group',{name:'Mic volume'})).toBeNull();
  await userEvent.click(screen.getByRole('button',{name:'Back'}));
  await userEvent.click(screen.getByRole('button',{name:'USB Mic Automatic'}));
  const group=screen.getByRole('group',{name:'Input'});expect(within(group).getByRole('radio',{name:'Automatic'})).toHaveProperty('checked',true);
  await userEvent.click(within(group).getByRole('radio',{name:'USB Mic'}));expect(choose).toHaveBeenCalledWith('usb');
  const meter=screen.getByRole('meter',{name:'Input level'});expect(meter.getAttribute('aria-valuenow')).toBe('43');expect(meter.getAttribute('aria-valuetext')).toBe('43%');
  const body=q('.hig-setting-body')!;expect([...body.children].map(child=>child.className.split(' ')[0])).toEqual(['hig-setting-volume','hig-button']);
  expect(body.lastElementChild!.classList.contains('hig-setting-action')).toBe(true);await userEvent.click(screen.getByRole('button',{name:'Open Settings'}));expect(open).toHaveBeenCalledTimes(1);
  // Off: source, choices and meter go; the volume stays only with volumeWhenOff 'disabled', unavailable; the action stays.
  view.rerender(<SoundHapticsBlock title='Sound & Haptics' sections={[{...mic,checked:false}]}/>);
  expect([...q('.hig-setting-body')!.children].map(child=>child.className.split(' ')[0])).toEqual(['hig-button']);
  view.rerender(<SoundHapticsBlock title='Sound & Haptics' sections={[{...mic,checked:false,volumeWhenOff:'disabled'}]}/>);
  const steps=within(screen.getByRole('group',{name:'Mic volume'})).getAllByRole('button');expect(steps.every(step=>(step as HTMLButtonElement).disabled)).toBe(true);
  expect(screen.queryByRole('meter')).toBeNull();expect(screen.queryByRole('radiogroup')).toBeNull();
  // Without levelLabel the meter stays decorative.
  view.rerender(<SoundHapticsBlock title='Sound & Haptics' sections={[{...mic,levelLabel:undefined}]}/>);expect(screen.queryByRole('meter')).toBeNull();expect(q('.hig-setting-meter')!.getAttribute('aria-hidden')).toBe('true');
 });
 it('SignalsBlock: a locked switch stays on at full strength, read as unavailable; hints, errors, label accessories, a host verified mark and a help pill ref',async()=>{
  const change=vi.fn(),help=vi.fn();const pill=React.createRef<HTMLButtonElement>();
  render(<SignalsBlock title='Signals' description='Choose what you receive.' verifiedLabel='Genesis' verifiedMark={<svg data-testid='mark'/>} groups={[{id:'trend',title:'Trend',verified:true,help:{label:'How it works',onSelect:help,ref:pill},items:[
   {id:'trend',label:'Trend',checked:false,locked:true,onCheckedChange:change},
   {id:'feed',label:'Feed',checked:true,onCheckedChange:noop,hint:'Needs permission',error:'Request failed',labelAccessory:<span role='img' aria-label='New'>★</span>}]}]}/>);
  const locked=toggle('Trend');expect(locked.checked).toBe(true);expect(locked.disabled).toBe(false);expect(locked.getAttribute('aria-disabled')).toBe('true');
  expect(locked.closest('label')!.hasAttribute('data-disabled')).toBe(false);expect(locked.closest('label')!.hasAttribute('data-locked')).toBe(true);
  await userEvent.click(locked);expect(change).not.toHaveBeenCalled();expect(locked.checked).toBe(true);
  // The accessory reads after the label and a pause, not run into it.
  expect(screen.getByRole('switch',{name:'Feed, New'})).toBeTruthy();expect(q('.hig-setting-switch-accessory')!.textContent).toBe('★');
  expect(screen.getByRole('status').textContent).toBe('Needs permission');expect(screen.getByRole('alert').textContent).toBe('Request failed');
  // Host artwork is drawn inside the mark's image role, named by the verified words.
  const mark=screen.getByTestId('mark').closest('.hig-reward-verified')!;expect(mark.getAttribute('role')).toBe('img');expect(mark.getAttribute('aria-label')).toBe('Genesis');
  expect(screen.getByRole('heading',{level:3,name:/^Trend ?Genesis/})).toBeTruthy();
  expect(pill.current).toBe(screen.getByRole('button',{name:'How it works'}));await userEvent.click(pill.current!);expect(help).toHaveBeenCalledTimes(1);
  expect(q('.hig-settings-description')!.textContent).toBe('Choose what you receive.');
 });
 it('SignalsBlock: verifiedMarkInteractive keeps a control mark outside the image role, after the verified words (Unreleased)',async()=>{
  const explain=vi.fn();
  render(<SignalsBlock title='Signals' verifiedLabel='Genesis' verifiedMarkInteractive verifiedMark={<button type='button' onClick={explain}>Genesis badge</button>} groups={[{id:'trend',title:'Trend',verified:true,items:[]}]}/>);
  const mark=screen.getByRole('button',{name:'Genesis badge'}).closest('.hig-reward-verified')!;expect(mark.getAttribute('role')).toBeNull();expect(mark.querySelector('.hig-sr-only')!.textContent).toBe('Genesis');
  await userEvent.click(screen.getByRole('button',{name:'Genesis badge'}));expect(explain).toHaveBeenCalledTimes(1);
 });
 it('SettingSwitch: labelAccessoryLabel names the accessory in place of its content, as on native (Unreleased)',()=>{
  render(<SignalsBlock title='Signals' groups={[{id:'trend',title:'Trend',items:[{id:'feed',label:'Feed',checked:true,onCheckedChange:noop,labelAccessory:<span>★</span>,labelAccessoryLabel:'New'}]}]}/>);
  expect(screen.getByRole('switch',{name:'Feed, New'})).toBeTruthy();expect(q('.hig-setting-switch-accessory')!.getAttribute('aria-hidden')).toBe('true');
 });
 it('SettingSwitch: with labelAccessoryLabel the name is one text node, so browsers read no space before the comma',()=>{
  // A visually hidden span beside the label is laid out apart, and Chromium and WebKit read `Swing notifications , Genesis`; one hidden text node reads as written.
  render(<NotificationsBlock title='Notifications' items={[{id:'swing',label:'Swing notifications',checked:true,onCheckedChange:noop,labelAccessory:<span>G</span>,labelAccessoryLabel:'Genesis'}]}/>);
  const input=screen.getByRole('switch',{name:'Swing notifications, Genesis'});
  const ids=input.getAttribute('aria-labelledby')!.split(' ');expect(ids).toHaveLength(1);
  const spoken=document.getElementById(ids[0])!;expect(spoken.hidden).toBe(true);expect(spoken.childNodes).toHaveLength(1);expect(spoken.textContent).toBe('Swing notifications, Genesis');
  // Nothing visually hidden is left inside the drawn label, and the drawn label is still the label text and the hidden accessory.
  const row=input.closest('label')!;expect(row.querySelector('.hig-sr-only')).toBeNull();expect(row.querySelector('.hig-setting-switch-accessory')!.getAttribute('aria-hidden')).toBe('true');
 });
 it('SettingSwitch: without labelAccessoryLabel the label and its comma are one hidden text node, then the accessory reads its own content',()=>{
  // The name joins the hidden `Feed,` and the accessory with one space, so no browser reads `Feed , New`.
  render(<NotificationsBlock title='Notifications' items={[{id:'feed',label:'Feed',checked:true,onCheckedChange:noop,labelAccessory:<span className='badge'>New</span>}]}/>);
  const input=screen.getByRole('switch',{name:'Feed, New'});
  const ids=input.getAttribute('aria-labelledby')!.split(' ');expect(ids).toHaveLength(2);
  const spoken=document.getElementById(ids[0])!;expect(spoken.hidden).toBe(true);expect(spoken.childNodes).toHaveLength(1);expect(spoken.textContent).toBe('Feed,');
  const accessory=document.getElementById(ids[1])!;expect(accessory.classList.contains('hig-setting-switch-accessory')).toBe(true);expect(accessory.hasAttribute('aria-hidden')).toBe(false);expect(accessory.textContent).toBe('New');
  const row=input.closest('label')!;expect(row.querySelector('.hig-sr-only')).toBeNull();
 });
 it('SettingSwitch: without an accessory the switch reads the drawn label alone',()=>{
  render(<NotificationsBlock title='Notifications' items={[{id:'feed',label:'Feed',checked:true,onCheckedChange:noop}]}/>);
  const input=screen.getByRole('switch',{name:'Feed'});const ids=input.getAttribute('aria-labelledby')!.split(' ');expect(ids).toHaveLength(1);expect(document.getElementById(ids[0])!.hidden).toBe(false);
 });
 it('keeps provider feedback on section and item actions unless feedback is false (Unreleased)',async()=>{
  const emit=vi.fn(),feedback={emit};
  const view=render(<HIGProvider feedback={feedback}><NotificationsBlock title='Notifications' items={[{id:'push',label:'Push',checked:false,onCheckedChange:noop,action:{label:'Open Settings',onSelect:noop}}]}/></HIGProvider>);
  await userEvent.click(screen.getByRole('button',{name:'Open Settings'}));expect(emit).toHaveBeenCalledTimes(1);
  view.rerender(<HIGProvider feedback={feedback}><NotificationsBlock title='Notifications' items={[{id:'push',label:'Push',checked:false,onCheckedChange:noop,action:{label:'Open Settings',onSelect:noop,feedback:false}}]}/></HIGProvider>);
  await userEvent.click(screen.getByRole('button',{name:'Open Settings'}));expect(emit).toHaveBeenCalledTimes(1);
  view.rerender(<HIGProvider feedback={feedback}><SoundHapticsBlock title='Sound' sections={[{id:'mic',label:'Mic',checked:false,onCheckedChange:noop,action:{label:'Open Settings',onSelect:noop,feedback:false}}]}/></HIGProvider>);
  await userEvent.click(screen.getByRole('button',{name:'Open Settings'}));expect(emit).toHaveBeenCalledTimes(1);
  view.rerender(<HIGProvider feedback={feedback}><SoundHapticsBlock title='Sound' sections={[{id:'mic',label:'Mic',checked:false,onCheckedChange:noop,action:{label:'Open Settings',onSelect:noop}}]}/></HIGProvider>);
  await userEvent.click(screen.getByRole('button',{name:'Open Settings'}));expect(emit).toHaveBeenCalledTimes(2);
 });
 it('NotificationsBlock: hints beside errors, an action under the card, locked items and groups with an optional heading',async()=>{
  const settings=vi.fn();
  render(<NotificationsBlock title='Notifications' items={[{id:'push',label:'Push',checked:false,onCheckedChange:noop,hint:'Registering this device',error:'Permission refused',action:{label:'Open Settings',onSelect:settings}}]}
   groups={[{id:'alerts',title:'Alert types',items:[{id:'price',label:'Price',checked:true,locked:true,onCheckedChange:noop}]},{id:'untitled',items:[{id:'news',label:'News',checked:false,onCheckedChange:noop}]}]}/>);
  const item=q('.hig-notifications-item')!;expect([...item.children].map(child=>child.className.split(' ')[0])).toEqual(['hig-setting-card','hig-setting-hint','hig-setting-error','hig-button']);
  expect(screen.getByRole('status').textContent).toBe('Registering this device');await userEvent.click(screen.getByRole('button',{name:'Open Settings'}));expect(settings).toHaveBeenCalledTimes(1);
  const groups=[...document.querySelectorAll('.hig-notifications-group')];expect(groups).toHaveLength(2);
  expect(within(screen.getByRole('region',{name:'Alert types'})).getByRole('switch',{name:'Price'}).getAttribute('aria-disabled')).toBe('true');
  expect(groups[1].querySelector('h3')).toBeNull();expect(groups[1].hasAttribute('aria-labelledby')).toBe(false);
  const css=readFileSync('packages/hig/react/src/styles.css','utf8');expect(css).toContain('.hig-notifications-group { display:flex;flex-direction:column;gap:8px;margin-block-start:8px; }');
  // Groups alone: items may be left out.
  cleanup();render(<NotificationsBlock title='Notifications' groups={[{id:'a',items:[{id:'x',label:'X',checked:false,onCheckedChange:noop}]}]}/>);expect(toggle('X')).toBeTruthy();
 });
});

it('updates the microphone level without rebuilding unchanged volume steps',()=>{
 let reads=0;
 const options=[0.25,0.5,0.75,1];
 Object.defineProperty(options,0,{get:()=>{reads++;return 0.25;}});
 const onValueChange=vi.fn();
 const mic=(level:number,value:number)=>({id:'mic',label:'Mic',checked:true,onCheckedChange:()=>{},levelLabel:'Input level',level,volume:{label:'Volume',options,value,onValueChange}});
 const view=render(<SoundHapticsBlock title="Audio" sections={[mic(.1,.25)]}/>);
 expect(reads).toBeGreaterThan(0);
 reads=0;
 view.rerender(<SoundHapticsBlock title="Audio" sections={[mic(.8,.25)]}/>);
 expect(screen.getByRole('meter').getAttribute('aria-valuenow')).toBe('80');
 expect(reads).toBe(0);
 view.rerender(<SoundHapticsBlock title="Audio" sections={[mic(.8,.5)]}/>);
 expect(screen.getByRole('button',{name:'50%'}).getAttribute('aria-pressed')).toBe('true');
});
