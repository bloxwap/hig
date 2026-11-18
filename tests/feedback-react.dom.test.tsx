import React,{useState,StrictMode} from 'react';
import {afterEach,it,expect,vi} from 'vitest';
import {render,screen,cleanup,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {FeedbackProvider,useFeedback} from '../packages/hig/feedback/src/react';
import {FeedbackController,type FeedbackAdapter,type FeedbackPreferences} from '../packages/hig/feedback/src/contract';
import {HIGProvider} from '../packages/hig/react/src/provider';
import {Button} from '../packages/hig/react/src/button';
import {Switch} from '../packages/hig/react/src/selection';
afterEach(cleanup);
function adapter():FeedbackAdapter{return {capability:{available:true,mechanism:'web-audio',observed:false},play:vi.fn(),dispose:vi.fn()};}
it('survives strict lifecycle replay and sends one accepted activation',async()=>{const adapters:FeedbackAdapter[]=[];function Content(){const {sink,update}=useFeedback();return <HIGProvider feedback={sink}><Button onClick={()=>update({sound:true})}>Enable sound</Button></HIGProvider>;}const factory=(prefs:FeedbackPreferences)=>{const a=adapter();adapters.push(a);return new FeedbackController({preferences:prefs,sound:a});};const {unmount}=render(<StrictMode><FeedbackProvider createController={factory}><Content/></FeedbackProvider></StrictMode>);expect(adapters).toHaveLength(2);await userEvent.click(screen.getByText('Enable sound'));expect(adapters[0].play).not.toHaveBeenCalled();expect(adapters[1].play).toHaveBeenCalledOnce();unmount();expect(adapters.every(a=>(a.dispose as ReturnType<typeof vi.fn>).mock.calls.length===1)).toBe(true);});
it('emits selection only on an accepted state commit',async()=>{const emit=vi.fn();function Example(){const [value,set]=useState(false);return <HIGProvider feedback={{emit}}><Switch label='Accepted' checked={value} onCheckedChange={set}/><Switch label='Rejected' checked={false} onCheckedChange={()=>{}}/></HIGProvider>;}render(<Example/>);await userEvent.click(screen.getByRole('switch',{name:'Rejected'}));expect(emit).not.toHaveBeenCalled();await userEvent.click(screen.getByRole('switch',{name:'Accepted'}));expect(emit).toHaveBeenCalledOnce();expect(emit.mock.calls[0][0].intent).toBe('selection');});
it('keeps nested providers and persisted channels separate',async()=>{const a=adapter(),b=adapter();const write=vi.fn();const storage={read:()=>({sound:true,haptics:false,volume:.2,motion:false}),write};function Content({label}: {label:string}){const {sink,preferences,update}=useFeedback();return <HIGProvider feedback={sink}><p>{label}: {preferences.volume}</p><Button onClick={()=>update({volume:.5})}>{label}</Button></HIGProvider>;}const outer=(p:FeedbackPreferences)=>new FeedbackController({sound:a,preferences:p});const inner=(p:FeedbackPreferences)=>new FeedbackController({sound:b,preferences:p});render(<FeedbackProvider createController={outer} storage={storage}><Content label='Outer'/><FeedbackProvider createController={inner}><Content label='Inner'/></FeedbackProvider></FeedbackProvider>);await waitFor(()=>expect(screen.getByText('Outer: 0.2')).toBeTruthy());await userEvent.click(screen.getByRole('button',{name:'Outer'}));expect(a.play).toHaveBeenCalledOnce();expect(b.play).not.toHaveBeenCalled();expect(screen.getByText('Inner: 0.3')).toBeTruthy();expect(write).toHaveBeenCalledWith({version:1,sound:true,haptics:false,volume:.5,motion:false});});
it('initializes copied playground preferences before an accepted action',async()=>{const sound=adapter(),haptics=adapter();function Content(){const {sink,preferences}=useFeedback();return <HIGProvider feedback={sink}><p>{preferences.volume}/{String(preferences.motion)}</p><Button>Review</Button></HIGProvider>;}render(<FeedbackProvider initialPreferences={{sound:true,haptics:false,volume:.42,motion:false}} createController={preferences=>new FeedbackController({preferences,sound,haptics})}><Content/></FeedbackProvider>);expect(screen.getByText('0.42/false')).toBeTruthy();await userEvent.click(screen.getByRole('button',{name:'Review'}));expect(sound.play).toHaveBeenCalledOnce();expect(haptics.play).not.toHaveBeenCalled();});
it('keeps menu disclosure quiet and reports one accepted selection after the host action',async()=>{
 const {Menu}=await import('../packages/hig/react/src/overlay');const order:string[]=[];const emit=vi.fn(()=>order.push('feedback'));
 render(<HIGProvider feedback={{emit}}><Menu label='Actions' items={[{label:'Select',onSelect:()=>order.push('action')},{label:'Cancel',onSelect:event=>event.preventDefault()}]}/></HIGProvider>);
 await userEvent.click(screen.getByRole('button',{name:'Actions'}));expect(emit).not.toHaveBeenCalled();
 await userEvent.click(screen.getByRole('menuitem',{name:'Select'}));expect(order).toEqual(['action','feedback']);expect(emit.mock.calls).toHaveLength(1);
 await userEvent.click(screen.getByRole('button',{name:'Actions'}));await userEvent.click(screen.getByRole('menuitem',{name:'Cancel'}));expect(emit).toHaveBeenCalledOnce();
});

it('keeps consumers stable through equivalent storage hydration and unrelated parent renders',async()=>{
 const draw=vi.fn();
 function Probe(){useFeedback();draw();return null;}
 const content=<Probe/>,read=vi.fn(async()=>({sound:false,haptics:false,volume:.3,motion:true}));
 const storage={read,write:vi.fn()},factory=(preferences:FeedbackPreferences)=>new FeedbackController({preferences});
 const scene=()=> <FeedbackProvider storage={storage} createController={factory}>{content}</FeedbackProvider>;
 const view=render(scene());
 await waitFor(()=>expect(read).toHaveBeenCalledOnce());
 view.rerender(scene());expect(draw).toHaveBeenCalledTimes(1);
});

it('updates runtime and haptic consumers only for the preferences they read',async()=>{
 const {useFeedbackRuntime,useHapticsEnabled}=await import('../packages/hig/feedback/src/react');
 const runtimeDraw=vi.fn(),hapticDraw=vi.fn();
 function Runtime(){const {motion,sink}=useFeedbackRuntime();runtimeDraw(motion);return <button onClick={()=>sink.emit({id:'tick',source:'preview',intent:'selection',origin:'pointer'})}>Emit</button>;}
 function Haptic(){hapticDraw(useHapticsEnabled());return null;}
 function Settings(){const {update}=useFeedback();return <><button onClick={()=>update({volume:.7,sound:true})}>Sound</button><button onClick={()=>update({haptics:true})}>Haptics</button><button onClick={()=>update({motion:false})}>Motion</button></>;}
 const sound=adapter();
 render(<FeedbackProvider createController={preferences=>new FeedbackController({preferences,sound})}><Runtime/><Haptic/><Settings/></FeedbackProvider>);
 await userEvent.click(screen.getByText('Sound'));
 expect(runtimeDraw.mock.calls).toEqual([[true]]);expect(hapticDraw.mock.calls).toEqual([[false]]);
 await userEvent.click(screen.getByText('Emit'));expect(sound.play).toHaveBeenCalledOnce();
 await userEvent.click(screen.getByText('Haptics'));await userEvent.click(screen.getByText('Motion'));
 expect(runtimeDraw.mock.calls).toEqual([[true],[false]]);expect(hapticDraw.mock.calls).toEqual([[false],[true]]);
});
