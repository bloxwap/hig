import React,{useState,createRef,useLayoutEffect} from 'react';
import {afterEach,describe,it,expect,vi} from 'vitest';
import {render,screen,cleanup,fireEvent} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {Button} from '../packages/react/src/button';
import {HIGProvider} from '../packages/react/src/provider';
import {Field,AmountInput,TextArea} from '../packages/react/src/field';
import {Switch,RadioGroup,SegmentedControl,Slider} from '../packages/react/src/selection';
import {Tabs} from '../packages/react/src/navigation';
import {Dialog} from '../packages/react/src/overlay';
import {Toast,Callout} from '../packages/react/src/status';
import {InstallCommand} from '../packages/react/src/recipes';
import {readFileSync} from 'node:fs';
import {Percent} from '../packages/react/src/data';
afterEach(cleanup);
describe('DOM behavior contracts',()=>{
 it('blocks busy/disabled activation and preserves forwarded focus',async()=>{const onClick=vi.fn();const feedback=vi.fn();const ref=createRef<HTMLButtonElement>();const {rerender}=render(<HIGProvider onAccepted={feedback}><Button ref={ref} busy onClick={onClick}>Review order</Button></HIGProvider>);await userEvent.click(screen.getByRole('button'));expect(onClick).not.toHaveBeenCalled();expect(feedback).not.toHaveBeenCalled();rerender(<HIGProvider onAccepted={feedback}><Button ref={ref} onClick={onClick}>Review order</Button></HIGProvider>);ref.current?.focus();expect(document.activeElement).toBe(ref.current);await userEvent.keyboard('{Enter}');expect(onClick).toHaveBeenCalledTimes(1);expect(feedback).toHaveBeenCalledTimes(1);});
 it('orders action before optional feedback and honors cancellation',async()=>{const order:string[]=[];render(<HIGProvider onAccepted={()=>order.push('feedback')}><Button onClick={e=>{order.push('action');e.preventDefault();}}>Cancel request</Button></HIGProvider>);await userEvent.click(screen.getByRole('button'));expect(order).toEqual(['action']);});
 it('isolates providers and ignores failing optional feedback',async()=>{const action=vi.fn();const unrelated=vi.fn();render(<><HIGProvider onAccepted={()=>{throw Error('missing backend');}}><Button onClick={action}>A</Button></HIGProvider><HIGProvider onAccepted={unrelated}><Button>B</Button></HIGProvider></>);await userEvent.click(screen.getByText('A'));expect(action).toHaveBeenCalledOnce();expect(unrelated).not.toHaveBeenCalled();});
 it('keeps raw financial input and accessible associations',()=>{const changed=vi.fn();render(<Field label='Amount (BTC)' description='Available: 1 BTC' error='Invalid precision'><AmountInput value='0,001' onChange={changed}/></Field>);const input=screen.getByLabelText('Amount (BTC)') as HTMLInputElement;expect(input.value).toBe('0,001');expect(input.getAttribute('aria-invalid')).toBe('true');expect(input.getAttribute('aria-describedby')?.split(' ').every(id=>document.getElementById(id))).toBe(true);fireEvent.change(input,{target:{value:'-0.00001'}});expect(changed).toHaveBeenCalledOnce();});
 it('supports uncontrolled switch and rejected controlled changes',async()=>{const change=vi.fn();const {rerender}=render(<Switch label='Sound' onCheckedChange={change}/>);await userEvent.click(screen.getByRole('switch'));expect((screen.getByRole('switch') as HTMLInputElement).checked).toBe(true);rerender(<Switch label='Sound' checked={false} onCheckedChange={change}/>);await userEvent.click(screen.getByRole('switch'));expect((screen.getByRole('switch') as HTMLInputElement).checked).toBe(false);});
 it('lets native radio keyboard semantics select one value',async()=>{function Example(){const [value,set]=useState('buy');return <RadioGroup label='Side' value={value} onValueChange={set} options={[{value:'buy',label:'Buy'},{value:'sell',label:'Sell'}]}/>;}render(<Example/>);await userEvent.click(screen.getByLabelText('Sell'));expect((screen.getByLabelText('Sell') as HTMLInputElement).checked).toBe(true);expect((screen.getByLabelText('Buy') as HTMLInputElement).checked).toBe(false);});
 it('keeps segmented choices focusable and rejects disabled changes',async()=>{const change=vi.fn();const options=[{value:'app',label:'App'},{value:'pro',label:'Pro',disabled:true},{value:'docs',label:'Docs'}];const {rerender}=render(<SegmentedControl label='Surface preset' options={options} defaultValue='app' onValueChange={change}/>);expect(screen.getByRole('group',{name:'Surface preset'})).toBeTruthy();await userEvent.tab();expect(document.activeElement).toBe(screen.getByRole('radio',{name:'App'}));await userEvent.click(screen.getByRole('radio',{name:'Pro'}));expect(change).not.toHaveBeenCalled();await userEvent.click(screen.getByRole('radio',{name:'Docs'}));expect((screen.getByRole('radio',{name:'Docs'}) as HTMLInputElement).checked).toBe(true);expect(change).toHaveBeenCalledExactlyOnceWith('docs');rerender(<SegmentedControl label='Surface preset' options={options} defaultValue='app' onValueChange={change} disabled/>);await userEvent.click(screen.getByRole('radio',{name:'App'}));expect(change).toHaveBeenCalledTimes(1);});
 it('deduplicates unchanged range values',()=>{const change=vi.fn();render(<Slider label='Volume' value={20} onValueChange={change}/>);fireEvent.change(screen.getByRole('slider'),{target:{value:'20'}});expect(change).not.toHaveBeenCalled();fireEvent.change(screen.getByRole('slider'),{target:{value:'30'}});expect(change).toHaveBeenCalledWith(30);});
 it('gives InstallCommand inside Tabs one tab stop: the panel yields to its focusable first content (#69)',async()=>{
  render(<><Tabs label='Package manager' items={[{value:'npm',label:'npm',content:<InstallCommand command='npm install @bloxwap/chart' onCopy={()=>{}}/>},{value:'text',label:'Notes',content:'Plain notes'}]}/><button type='button'>After</button></>);
  const panel=screen.getByRole('tabpanel');const pre=panel.querySelector('pre')!;
  expect(panel.hasAttribute('tabindex')).toBe(false);
  await userEvent.tab();expect(document.activeElement).toBe(screen.getByRole('tab',{name:'npm'}));
  await userEvent.tab();expect(document.activeElement).toBe(pre);
  await userEvent.tab();expect(document.activeElement).toBe(screen.getByRole('button',{name:'Copy install command'}));
  await userEvent.tab();expect(document.activeElement).toBe(screen.getByRole('button',{name:'After'}));
  await userEvent.tab({shift:true});await userEvent.tab({shift:true});await userEvent.tab({shift:true});expect(document.activeElement).toBe(screen.getByRole('tab',{name:'npm'}));
  // A panel that starts with plain text keeps its own stop so its content is reachable.
  await userEvent.keyboard('{ArrowRight}');const notes=screen.getByRole('tabpanel');expect(notes.textContent).toBe('Plain notes');
  expect(notes.getAttribute('tabindex')).toBe('0');
  await userEvent.tab();expect(document.activeElement).toBe(notes);
 });
 it('corrects the shown panel tab stop in the same commit that shows it, with no extra tick (#97)',()=>{
  // A layout-effect probe rendered after Tabs records what the shown panel exposes during the commit that reveals it, before paint and before passive effects.
  const seen:{label:string|null;tabindex:string|null}[]=[];
  function Probe(){useLayoutEffect(()=>{const shown=document.querySelector<HTMLElement>('[role="tabpanel"]:not([hidden])');seen.push({label:shown?.getAttribute('aria-labelledby')??null,tabindex:shown?.getAttribute('tabindex')??null});});return null;}
  function Harness(){const [value,setValue]=useState('notes');return <><Tabs label='Package manager' value={value} onValueChange={setValue} items={[{value:'notes',label:'Notes',content:'Plain notes'},{value:'npm',label:'npm',content:<InstallCommand command='npm install @bloxwap/chart' onCopy={()=>{}}/>},{value:'more',label:'More',content:<p>Read first <a href='#more'>more</a></p>}]}/><Probe/></>;}
  render(<Harness/>);
  const panel=()=>screen.getByRole('tabpanel');
  expect(panel().textContent).toBe('Plain notes');expect(panel().getAttribute('tabindex')).toBe('0');
  // Panel that starts with a focusable element: never a tab stop, not even for one commit.
  seen.length=0;fireEvent.click(screen.getByRole('tab',{name:'npm'}));
  expect(panel().querySelector('pre')).toBeTruthy();expect(panel().hasAttribute('tabindex')).toBe(false);
  const npmCommits=seen.filter(s=>s.label?.endsWith('-tab-npm'));expect(npmCommits.length).toBeGreaterThan(0);expect(npmCommits.map(s=>s.tabindex)).toEqual(npmCommits.map(()=>null));
  // Panel whose first content is text keeps its own stop in the commit that shows it.
  seen.length=0;fireEvent.click(screen.getByRole('tab',{name:'More'}));
  expect(panel().textContent).toBe('Read first more');expect(panel().getAttribute('tabindex')).toBe('0');
  const moreCommits=seen.filter(s=>s.label?.endsWith('-tab-more'));expect(moreCommits.length).toBeGreaterThan(0);expect(moreCommits.map(s=>s.tabindex)).toEqual(moreCommits.map(()=>'0'));
  // Switching back restores the yielded stop synchronously, and hidden panels keep their rendered tabindex.
  seen.length=0;fireEvent.click(screen.getByRole('tab',{name:'npm'}));
  expect(panel().hasAttribute('tabindex')).toBe(false);expect(seen.filter(s=>s.label?.endsWith('-tab-npm')).every(s=>s.tabindex===null)).toBe(true);
  for(const hidden of document.querySelectorAll('[role="tabpanel"][hidden]'))expect(hidden.getAttribute('tabindex')).toBe('0');
 });
 it('keeps a non-focusable panel a tab stop synchronously after switching tabs (#97)',()=>{
  render(<Tabs label='Docs' items={[{value:'code',label:'Code',content:<InstallCommand command='npm install @bloxwap/hig-react' onCopy={()=>{}}/>},{value:'text',label:'Notes',content:'Plain notes'}]}/>);
  expect(screen.getByRole('tabpanel').hasAttribute('tabindex')).toBe(false);
  fireEvent.click(screen.getByRole('tab',{name:'Notes'}));
  const notes=screen.getByRole('tabpanel');expect(notes.textContent).toBe('Plain notes');expect(notes.getAttribute('tabindex')).toBe('0');
 });
 it('keeps a panel tab stop when text precedes a focusable control',async()=>{render(<Tabs label='Docs' items={[{value:'a',label:'Intro',content:<p>Read first <a href='#more'>more</a></p>}]}/>);const panel=screen.getByRole('tabpanel');expect(panel.getAttribute('tabindex')).toBe('0');});
 it('renders documented Callout note and tip severities with ReactNode titles (#69)',()=>{
  render(<><Callout title={<>Use <code>createChart</code></>} severity='note' announce={false}><p>Body</p></Callout><Callout title='Tip' severity='tip' announce={false}>Shortcut</Callout></>);
  const note=screen.getByText('createChart').closest('section')!;expect(note.getAttribute('data-severity')).toBe('note');expect(note.querySelector('strong')?.textContent).toBe('Use createChart');expect(note.querySelector('strong code')).toBeTruthy();
  expect(screen.getByText('Tip').closest('section')!.getAttribute('data-severity')).toBe('tip');
  const css=readFileSync('packages/react/src/styles.css','utf8');
  for(const [severity,role] of [['note','info'],['info','info'],['tip','positive'],['success','positive'],['warning','warning'],['error','negative']])expect(css).toMatch(new RegExp(`\\[data-severity='${severity}'\\][^{]*\\{[^}]*var\\(--hig-${role}\\)`));
 });
 it('moves tabs with keyboard and exposes only selected panel',async()=>{render(<Tabs label='Examples' items={[{value:'a',label:'Preview',content:'Preview body'},{value:'b',label:'Code',content:'Code body'}]}/>);screen.getByRole('tab',{name:'Preview'}).focus();await userEvent.keyboard('{ArrowRight}');expect(screen.getByRole('tab',{name:'Code'}).getAttribute('aria-selected')).toBe('true');expect(screen.getByRole('tabpanel').textContent).toBe('Code body');});
 it('dismisses modal with Escape and restores trigger focus',async()=>{function Example(){const [open,set]=useState(false);return <Dialog open={open} onOpenChange={set} title='Review' description='Verify amount' trigger={<Button>Open review</Button>}><Button>Confirm</Button></Dialog>;}render(<Example/>);await userEvent.click(screen.getByText('Open review'));expect(screen.getByRole('dialog').getAttribute('aria-describedby')).toBeTruthy();await userEvent.keyboard('{Escape}');expect(screen.queryByRole('dialog')).toBeNull();expect(document.activeElement).toBe(screen.getByText('Open review'));});
 it('deduplicates notifications and keeps dismiss accessible',async()=>{const dismiss=vi.fn();render(<Toast notices={[{id:'1',message:'Copied',severity:'success'},{id:'1',message:'Copied',severity:'success'}]} onDismiss={dismiss}/>);expect(screen.getAllByRole('status')).toHaveLength(1);await userEvent.click(screen.getByRole('button',{name:'Dismiss Copied'}));expect(dismiss).toHaveBeenCalledWith('1');});
 it('does not mistake percent points for a ratio',()=>{render(<Percent value={5}/>);expect(screen.getByText('5%').textContent).toBe('5%');});
});

it('propagates required form semantics while allowing explicit overrides',()=>{const {rerender}=render(<Field label='Amount' required><AmountInput/></Field>);const input=screen.getByRole('textbox') as HTMLInputElement;expect(input.required).toBe(true);expect(input.checkValidity()).toBe(false);rerender(<Field label='Note' required><TextArea required={false}/></Field>);expect((screen.getByRole('textbox') as HTMLTextAreaElement).required).toBe(false);});
it('preserves every undismissed notification through a burst and retry',async()=>{const retry=vi.fn(),dismiss=vi.fn();const notices=Array.from({length:5},(_,i)=>({id:String(i),message:`Outcome ${i}`,severity:'error' as const,action:i===0?<Button onClick={retry}>Retry</Button>:undefined}));render(<Toast notices={notices} onDismiss={dismiss}/>);expect(screen.getAllByRole('alert')).toHaveLength(1);for(const n of notices)expect(screen.getAllByText(n.message).length).toBeGreaterThan(0);await userEvent.click(screen.getByRole('button',{name:'Retry'}));expect(retry).toHaveBeenCalledOnce();expect(screen.getAllByText('Outcome 0').length).toBeGreaterThan(0);});

it('disabled fields cannot be re-enabled by a child and amount input keeps host keyboard mode',()=>{render(<Field label='Amount' disabled><AmountInput disabled={false} inputMode='text'/></Field>);const input=screen.getByRole('textbox') as HTMLInputElement;expect(input.disabled).toBe(true);expect(input.inputMode).toBe('text');});
it('announces a burst once and preserves pending critical text through rapid dismissal',async()=>{const notices=[{id:'critical',message:'Failed operation',severity:'error' as const},{id:'info',message:'Copied',severity:'info' as const}];const {rerender}=render(<Toast notices={notices} onDismiss={()=>{}}/>);rerender(<Toast notices={notices.slice(0,1)} onDismiss={()=>{}}/>);await new Promise(resolve=>setTimeout(resolve,40));expect(screen.getByRole('alert').textContent).toBe('Failed operation');rerender(<Toast notices={notices.slice(0,1)} onDismiss={()=>{}}/>);expect(screen.getAllByRole('alert')).toHaveLength(1);});
