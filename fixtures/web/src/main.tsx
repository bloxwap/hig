import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import './fonts.css';
import '@bloxwap/hig-tokens/css';
import '@bloxwap/hig-react/css';
import {HIGProvider} from '@bloxwap/hig-react/provider';
import {Button} from '@bloxwap/hig-react/button';
import {BrandMark} from '@bloxwap/hig-react/brand';
import {TradeEntry,BalanceCard,MarketRow,InstallCommand} from '@bloxwap/hig-react/recipes';
import {Switch,Slider,SegmentedControl} from '@bloxwap/hig-react/selection';
import {Alert,EmptyState} from '@bloxwap/hig-react/status';
import {Tabs,Accordion} from '@bloxwap/hig-react/navigation';
function App(){const [amount,setAmount]=useState('0.01');const [density,setDensity]=useState<'comfortable'|'compact'>('comfortable');const [sound,setSound]=useState(false);const [volume,setVolume]=useState(30);const [status,setStatus]=useState('Demo data; no transaction is submitted.');return <HIGProvider density={density}><main style={{maxWidth:920,margin:'auto',padding:24}}><BrandMark label='Bloxwap'/><h1>Built for clear decisions.</h1><p>HIG 0.1.0 · React fixture · host-supplied sample data</p><SegmentedControl label='Density' options={[{value:'comfortable',label:'Touch'},{value:'compact',label:'Pro'}]} value={density} onValueChange={v=>setDensity(v as typeof density)}/><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,300px),1fr))',gap:24}}><TradeEntry asset='BTC' amount={amount} onAmountChange={setAmount} available='0.25 BTC' onConfirm={()=>setStatus('Demo confirmation accepted; no network request.')}/><div><BalanceCard label='Sample balance' balance={1250.45}/><MarketRow symbol='BTC' name='Bitcoin' price={67234.56} change={2.5} onSelect={()=>setStatus('Bitcoin selected')}/><Switch label='Sound preference preview' checked={sound} onCheckedChange={setSound}/><Slider label='Volume preference preview' value={volume} onValueChange={setVolume}/><Alert title='Sample outcome'><p>{status}</p></Alert></div></div><Tabs label='Example' items={[{value:'preview',label:'Preview',content:<EmptyState title='No open positions' description='Positions supplied by the host appear here.'/>},{value:'code',label:'Code',content:<InstallCommand command='npm install @bloxwap/hig-react@0.1.0' onCopy={()=>navigator.clipboard.writeText('npm install @bloxwap/hig-react@0.1.0')}/>} ]}/><Accordion title='Platform notes'><p>Physical font/color/haptic certification pending. Native gallery uses native renderers.</p></Accordion><Button disabled>Unavailable example</Button><Button busy>Busy example</Button></main></HIGProvider>;}
createRoot(document.getElementById('root')!).render(<App/>);
