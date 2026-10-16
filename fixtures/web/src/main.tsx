import React,{useState,useCallback,useMemo,useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import './fonts.css';
import '@bloxwap/hig-tokens/css';
// Page-wide element defaults (box-sizing, focus ring, table, range) are opt-in since #95; import them before the component CSS.
import '@bloxwap/hig-react/css/base';
import '@bloxwap/hig-react/css';
import {FeedbackProvider,useFeedback} from '@bloxwap/hig-feedback/react';
import {FeedbackController} from '@bloxwap/hig-feedback';
import {createWebSoundAdapter} from '@bloxwap/hig-feedback/web-sound';
import {HapticFeedbackTarget} from '@bloxwap/hig-feedback/web-haptic';
import {createBrowserHapticAdapter} from '@bloxwap/hig-feedback/browser-haptic';
import {jsonStorage} from '@bloxwap/hig-feedback/preferences';
import {Menu} from '@bloxwap/hig-react/overlay';
import {HIGProvider} from '@bloxwap/hig-react/provider';
import {Button} from '@bloxwap/hig-react/button';
import {BrandMark} from '@bloxwap/hig-react/brand';
import {TradeEntry,BalanceCard,MarketRow,InstallCommand} from '@bloxwap/hig-react/recipes';
import {Switch,Slider,SegmentedControl} from '@bloxwap/hig-react/selection';
import {Alert,EmptyState} from '@bloxwap/hig-react/status';
import {Tabs,Accordion} from '@bloxwap/hig-react/navigation';
function App(){const [amount,setAmount]=useState('0.01');const [density,setDensity]=useState<'comfortable'|'compact'>('comfortable');const {preferences,update,sink,controller}=useFeedback();useEffect(()=>{const update=()=>controller()?.setBackground(document.hidden);update();document.addEventListener('visibilitychange',update);return()=>document.removeEventListener('visibilitychange',update);},[controller]);const [status,setStatus]=useState('Demo data; no transaction is submitted.');return <HIGProvider density={density} feedback={sink} reducedMotion={!preferences.motion?true:undefined}><main style={{maxWidth:920,margin:'auto',padding:24}}><BrandMark label='Bloxwap'/><h1>Built for clear decisions.</h1><p>HIG 0.1.0 · React fixture · host-supplied sample data</p><SegmentedControl label='Density' options={[{value:'comfortable',label:'Touch'},{value:'compact',label:'Pro'}]} value={density} onValueChange={v=>setDensity(v as typeof density)}/><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,300px),1fr))',gap:24}}><TradeEntry asset='BTC' amount={amount} onAmountChange={setAmount} available='0.25 BTC' onConfirm={()=>{setStatus('Demo confirmation accepted; no network request.');sink.emit({id:`demo-${Date.now()}`,source:'trade-demo',intent:'success',origin:'programmatic'});}}/><div><BalanceCard label='Sample balance' balance={1250.45}/><MarketRow symbol='BTC' name='Bitcoin' price={67234.56} change={2.5} onSelect={()=>setStatus('Bitcoin selected')}/><Switch label='Sound' checked={preferences.sound} onCheckedChange={v=>update({sound:v})}/><Switch label='Haptics' checked={preferences.haptics} onCheckedChange={v=>update({haptics:v})}/><Slider label='Volume' value={Math.round(preferences.volume*100)} onValueChange={v=>update({volume:v/100})}/><Switch label='Motion' checked={preferences.motion} onCheckedChange={v=>update({motion:v})}/><HapticFeedbackTarget eligible><Button intent='secondary' suppressFeedback onClick={()=>setStatus('Physical target activated; hardware observation pending.')}>Preview iOS physical tap</Button></HapticFeedbackTarget><p>Browser vibration varies by hardware; iOS async outcomes are silent.</p><Alert title='Sample outcome'><p>{status}</p></Alert></div></div><Tabs label='Example' items={[{value:'preview',label:'Preview',content:<EmptyState title='No open positions' description='Positions supplied by the host appear here.'/>},{value:'code',label:'Code',content:<InstallCommand command='npm install @bloxwap/hig-react@0.1.0' onCopy={()=>navigator.clipboard.writeText('npm install @bloxwap/hig-react@0.1.0')}/>} ]}/><Accordion title='Platform notes'><p>Physical font/color/haptic certification pending. Native gallery uses native renderers.</p></Accordion><section aria-label='Feedback interaction examples'><h2>Accepted selection samples</h2><Switch label='Preview selection'/><Slider label='Preview selection range' defaultValue={10}/><Menu label='Selection menu' items={[{label:'Select sample',onSelect:()=>setStatus('Sample selected')},{label:'Cancel sample',onSelect:event=>event.preventDefault()},{label:'Unavailable sample',disabled:true,onSelect:()=>setStatus('Unexpected unavailable selection')}]}/></section><Button disabled>Unavailable example</Button><Button busy>Busy example</Button></main></HIGProvider>;}
// Test host supplies adapters through the same public contract; no hardware claims.
const simulation=new URLSearchParams(location.search).has('simulateFeedback');
const requests:{channel:string;intent:string;source:string}[]=[];
if(simulation)Object.assign(window,{higSimulation:{requests}});
function Root(){const createController=useCallback((prefs:import('@bloxwap/hig-feedback').FeedbackPreferences)=>new FeedbackController({preferences:prefs,
 sound:simulation?{capability:{available:true,mechanism:'web-audio',observed:false},play:event=>{requests.push({channel:'sound',intent:event.intent,source:event.source});}}:createWebSoundAdapter(),
 haptics:simulation?{capability:{available:true,mechanism:'browser-vibration',observed:false},play:event=>{requests.push({channel:'haptics',intent:event.intent,source:event.source});}}:createBrowserHapticAdapter()}),[]);const storage=useMemo(()=>jsonStorage(window.localStorage),[]);return <FeedbackProvider createController={createController} storage={storage}><App/></FeedbackProvider>;}
createRoot(document.getElementById('root')!).render(<Root/>);
