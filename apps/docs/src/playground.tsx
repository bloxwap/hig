'use client';
import React,{lazy,Suspense,useEffect,useMemo,useState} from 'react';
import {HIGProvider} from '@bloxwap/hig/react/provider';
import {Button} from '@bloxwap/hig/react/button';
import {Select,SegmentedControl,Switch,Slider} from '@bloxwap/hig/react/selection';
import {Badge} from '@bloxwap/hig/react/status';
import {useFeedback} from '@bloxwap/hig/feedback/react';
import {DemoFeedback,useDemoFeedback} from './demo-feedback';
import content from './demo-content.json';
import {basePath} from '../lib/site';
import {Code,ExampleCode,Example} from './example-code';
import {PreviewToaster,toastExamples} from './toast-examples';
type PortfolioComponent=typeof import('./playground-portfolio').default;
function Portfolio(props:React.ComponentProps<PortfolioComponent>){
 const host=React.useRef<HTMLDivElement>(null);
 const trigger=React.useRef<HTMLButtonElement>(null);
 const [entered,setEntered]=useState(false);
 const focusEdge=React.useRef<'first'|'last'|null>(null);
 const [requested,setRequested]=useState(false);
 const [Content,setContent]=useState<PortfolioComponent|null>(null);
 const [error,setError]=useState<Error|null>(null);
 useEffect(()=>{
  if(requested)return;
  if(!window.IntersectionObserver){setRequested(true);return;}
  const observer=new IntersectionObserver(entries=>{
   if(entries.some(entry=>entry.isIntersecting))setRequested(true);
  },{rootMargin:'300px'});
  if(host.current)observer.observe(host.current);
  return ()=>observer.disconnect();
 },[requested]);
 useEffect(()=>{
  if(!requested)return;
  let active=true;
  import('./playground-portfolio').then(module=>{
   if(active)setContent(()=>module.default);
  },reason=>{if(active)setError(reason);});
  return ()=>{active=false;};
 },[requested]);
 React.useLayoutEffect(()=>{
  if(!Content)return;
  if(trigger.current&&document.activeElement===trigger.current){
   const controls=host.current?.querySelector('.product-preview')?.querySelectorAll<HTMLElement>('button:enabled,input:enabled,a[href],[tabindex="0"]');
   controls?.[focusEdge.current==='last'?controls.length-1:0]?.focus();
  }
  setEntered(true);
 },[Content]);
 if(error)throw error;
 return <div ref={host}>{Content&&<Content {...props}/>}
  {!entered&&<div className='portfolio-placeholder'>
  <button ref={trigger} type='button' className='hig-button' onFocus={event=>{
   const previous=event.relatedTarget;
   focusEdge.current=previous instanceof Node&&(event.currentTarget.compareDocumentPosition(previous)&Node.DOCUMENT_POSITION_FOLLOWING)?'last':'first';
   setRequested(true);
  }} onClick={()=>setRequested(true)}>Load sample portfolio</button>
 </div>}</div>;
}
const DocsPreset=lazy(()=>import('./playground-docs-preset'));
const base=basePath+'/';
const sourceRef='main';
const url=(route='')=>base+(route?'docs/'+route+'/':'');
const presets=[{value:'app',label:'App'},{value:'pro',label:'Pro'},{value:'docs',label:'Docs'}];
const platforms=[{value:'react',label:'React web'},{value:'native',label:'React Native'}];
const components=content.catalog.map(entry=>({value:entry.name,label:entry.name}));
export default function Playground(){return <DemoFeedback><PlaygroundControls/></DemoFeedback>;}
function FeedbackSettings(){
 const {preferences,update}=useFeedback();
 return <>
  <Switch label='Sound' checked={preferences.sound} onCheckedChange={v=>update({sound:v})}/>
  <Switch label='Haptics' checked={preferences.haptics} onCheckedChange={v=>update({haptics:v})}/>
  <Slider label='Volume' value={Math.round(preferences.volume*100)} onValueChange={v=>update({volume:v/100})}/>
  <Switch label='Motion' checked={preferences.motion} onCheckedChange={v=>update({motion:v})}/>
 </>;
}
function PlaygroundCode(props:Omit<React.ComponentProps<typeof ExampleCode>,'preferences'>){
 const {preferences}=useFeedback();
 return <ExampleCode {...props} preferences={preferences}/>;
}
function PlaygroundControls(){
 const [codeOpen,setCodeOpen]=useState(false);
 const parameters=useMemo(()=>new URLSearchParams(typeof window==='undefined'?'':location.search),[]);
 const requestedPreset=parameters.get('preset');
 const presetFromUrl=requestedPreset&&['app','pro','docs'].includes(requestedPreset)?requestedPreset:'app';
 const [preset,setPreset]=useState(presetFromUrl);
 const [platform,setPlatform]=useState<'react'|'native'>(parameters.get('platform')==='native'?'native':'react');
 const [component,setComponent]=useState(content.catalog.some(e=>e.name===parameters.get('component'))?parameters.get('component')!:'Button');
 const [state,setState]=useState(parameters.get('state')??'default');const amountDraft=React.useRef('0.01');const [outcome,setOutcome]=useState('Demo data. No order is submitted.');
 const {motion,sink}=useDemoFeedback();const density=preset==='pro'?'compact':'comfortable';
 const entry=content.catalog.find(e=>e.name===component)??content.catalog[0];const selectedState=entry.states.includes(state)?state:'default';
 useEffect(()=>{document.title='Bloxwap HIG · clear decisions';},[]);
 const stateOptions=useMemo(()=>entry.states.map(value=>({value,label:value[0].toUpperCase()+value.slice(1)})),[entry.states]);
 useEffect(()=>{
  const link=document.getElementById('explore-components');
  const activate=(event:MouseEvent)=>sink.emit({id:`explore-components/${event.timeStamp}`,source:'explore-components',intent:'activate',origin:event.detail===0?'keyboard':'pointer'});
  link?.addEventListener('click',activate);
  return ()=>link?.removeEventListener('click',activate);
 },[sink]);
 const needsToaster=platform==='react'&&(preset==='docs'||toastExamples.has(component));
 const [keepToaster,setKeepToaster]=useState(needsToaster);
 useEffect(()=>{if(needsToaster)setKeepToaster(true);},[needsToaster]);
 const toastState=component==='Toaster'?selectedState:'default';
 function share(){const params=new URLSearchParams({preset,platform,component:entry.name,state:selectedState});history.replaceState(null,'',url()+'?'+params);navigator.clipboard.writeText(location.href).then(()=>setOutcome('Configuration link copied')).catch(()=>setOutcome('Copy unavailable. Share the address bar URL.'));}
 return <HIGProvider density={density} feedback={sink} reducedMotion={!motion?true:undefined}><Suspense fallback={<p role='status'>Loading interactive examples…</p>}>
 <section className='playground' aria-label='HIG playground'><aside className='configuration'><div className='panel-heading'><h2>Make it yours.</h2><Badge>Approved presets</Badge></div><SegmentedControl label='Surface preset' options={presets} value={preset} onValueChange={setPreset}/><Select label='Platform' options={platforms} value={platform} onValueChange={v=>setPlatform(v as typeof platform)}/><Select label='Component' options={components} value={entry.name} onValueChange={v=>{setComponent(v);setState('default');}}/><Select label='Component state' options={stateOptions} value={selectedState} onValueChange={setState}/><div className='panel-rule'/><div className='feedback-heading'><h3>Feedback</h3><span>Always optional</span></div><FeedbackSettings/><p className='small muted'>Browser haptics depend on hardware. Native gallery links use actual native renderers; device certification is pending.</p><Button intent='secondary' onClick={share}>Share configuration</Button></aside>
 <div className='preview-area'><div className='preview-toolbar'><span><span className='status-dot'/> Live preview</span><span>{platform==='native'?'Comfortable native':preset==='pro'?'Compact Pro':preset==='docs'?'Documentation':'Comfortable touch'} · Dark</span></div>{platform==='react'?<><Suspense fallback={<p role='status'>Loading preview…</p>}>{preset==='docs'?<DocsPreset/>:<Portfolio amountDraft={amountDraft} outcome={outcome} setOutcome={setOutcome} onConfirm={()=>{setOutcome('Demo review confirmed. No transaction submitted.');sink.emit({id:`preview-${Date.now()}`,source:'trade-preview',intent:'success',origin:'programmatic'});}}/>}</Suspense><div className='component-stage'><div><h3>{entry.name}</h3><span className='muted'>{selectedState} state</span></div><Suspense fallback={<p role='status'>Loading component example…</p>}><Example key={`${entry.name}:${selectedState}`} name={entry.name} state={selectedState}/></Suspense><a href={url(entry.route)}>Usage & accessibility ↗</a></div></>:<div className='native-panel'><span className='eyebrow'>ACTUAL REACT NATIVE EXAMPLES</span><h2>Take the preview to your device.</h2><p>{entry.name}: {entry.nativeSupport==='alternative'?'documented native alternative':'native renderer'}.</p><p>Run the Expo gallery for iOS or Android. Native screenshots, VoiceOver/TalkBack and physical feedback observations are pending.</p><Code code={'npm ci\nnpm run build\nnpm run start -w hig-native-fixture'}/><a href={`https://github.com/bloxwap/hig/tree/${sourceRef}/fixtures/native`}>Open native gallery source ↗</a></div>}<details className='get-code' onToggle={e=>setCodeOpen(e.currentTarget.open)}><summary>Get code · {entry.name}</summary>{codeOpen&&<PlaygroundCode key={entry.name} entry={entry} platform={platform} density={density} state={selectedState}/>}</details></div></section>
 <section className='principle-grid'><article><span>01 / INTENT</span><h2>Clear before clever.</h2><p>One primary action. Visible progress. Honest values and recoverable errors.</p></article><article><span>02 / PLATFORM</span><h2>Share the language.</h2><p>Keep the contracts consistent. Let keyboard, touch and native behavior feel familiar.</p></article><article><span>03 / FEEDBACK</span><h2>Quiet by default.</h2><p>Optional sound and haptics add confidence. Essential information stays on screen.</p></article></section>{(needsToaster||keepToaster)&&<PreviewToaster state={toastState}/>}</Suspense></HIGProvider>;
}
