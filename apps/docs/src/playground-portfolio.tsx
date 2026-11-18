import {useState,type RefObject} from 'react';
import {TradeEntry} from '@bloxwap/hig/react/blocks/trade-entry';
import {MarketRow} from '@bloxwap/hig/react/blocks/market-row';
import {Surface,Text} from '@bloxwap/hig/react/surface';
import {Usd} from '@bloxwap/hig/react/data';
import {Badge} from '@bloxwap/hig/react/status';

interface PortfolioProps {
 amountDraft:RefObject<string>;
 outcome:string;
 setOutcome:(value:string)=>void;
 onConfirm:()=>void;
}

function PortfolioTrade({amountDraft,onConfirm}:Pick<PortfolioProps,'amountDraft'|'onConfirm'>){
 const [amount,setAmount]=useState(()=>amountDraft.current);
 function edit(value:string){
  amountDraft.current=value;
  setAmount(value);
 }
 return <TradeEntry asset='BTC' amount={amount} onAmountChange={edit} available='0.25 BTC' onConfirm={onConfirm}/>;
}

export default function Portfolio({amountDraft,outcome,setOutcome,onConfirm}:PortfolioProps){
 return <div className='product-preview'>
  <div className='preview-intro'><span className='eyebrow'>SAMPLE PORTFOLIO</span><Badge>Demo data</Badge></div>
  <div className='portfolio-grid'>
   <Surface className='sample-balance'><Text>Total sample balance</Text><Usd value={1250.45}/></Surface>
   <div className='market-panel'>
    <MarketRow name='Bitcoin' symbol='BTC' price={67234.56} change={2.5} onSelect={()=>setOutcome('Bitcoin selected')}/>
    <MarketRow name='Ethereum' symbol='ETH' price={3521.12} change={-0.8} onSelect={()=>setOutcome('Ethereum selected')}/>
   </div>
  </div>
  <div className='preview-bottom'>
   <PortfolioTrade amountDraft={amountDraft} onConfirm={onConfirm}/>
   <div className='decision-note'>
    <p className='eyebrow'>CLARITY BEFORE COMMITMENT</p>
    <h3>The action stays yours.</h3>
    <p>Review the amount. See the outcome. Keep wallet, trading and network logic with the host.</p>
    <p className='quiet-outcome' role='status'>{outcome}</p>
   </div>
  </div>
 </div>;
}
