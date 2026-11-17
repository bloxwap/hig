import React from 'react';
import {afterEach,beforeEach,it,expect,vi} from 'vitest';
import {act,cleanup,fireEvent,render,screen} from '@testing-library/react';
import {SwapPanelBlock} from '../packages/hig/react/src/blocks/swap-panel-block';
import {swapAction,type SwapToken} from '../packages/hig/react/src/blocks/swap/shared';
import {TargetBlock} from '../packages/hig/react/src/blocks/target-block';
import {HIGProvider,useHIG,useControllable} from '../packages/hig/react/src/provider';
import {Accordion,Tabs} from '../packages/hig/react/src/navigation';
import {Field,Input,SearchInput} from '../packages/hig/react/src/field';
import {formatCountdown,formatZonedTime} from '../packages/hig/contracts/src/index';
import {accountSectionTotal} from '../packages/hig/react/src/blocks/account-block';
import {bitcoinPrice} from '../packages/hig/chart/src/bitcoin-price';
import {SwapSettings} from '../packages/hig/react/src/blocks/swap/settings';
import {WalletAddress} from '../packages/hig/react/src/wallet-address-core';
import {registerNotifier} from '../packages/hig/react/src/notify';
import {FeedbackProvider,useFeedback} from '../packages/hig/feedback/src/react';
import {Select} from '../packages/hig/react/src/select';
import {FeedbackController} from '../packages/hig/feedback/src/contract';
import {validateSnapPoints} from '../packages/hig/native/src/gesture-sheet-model';
const token:SwapToken={id:'eth-usdc',symbol:'USDC',name:'USD Coin',chain:'Ethereum',chainId:1,balance:5,price:1,decimals:2};
beforeEach(()=>vi.stubGlobal('matchMedia',()=>({matches:false,addEventListener(){},removeEventListener(){}})));
afterEach(()=>{cleanup();vi.unstubAllGlobals();vi.restoreAllMocks();});
it('same-symbol assets on different chains bridge',()=>expect(swapAction(token,{...token,id:'sol-usdc',chainId:'solana'})).toBe('bridge'));
it('a known zero balance blocks submit',()=>{const submit=vi.fn();render(<SwapPanelBlock tokens={[token]} from={{...token,balance:0}} destination={{title:'Vault'}} amount='1' denomination='token' onSubmit={submit}/>);fireEvent.click(screen.getByRole('button',{name:'Insufficient USDC'}));expect(submit).not.toHaveBeenCalled();});
it('pasting respects balance cap',()=>{const amount=vi.fn();const {container}=render(<SwapPanelBlock tokens={[token]} from={token} destination={{title:'Vault'}} denomination='token' limitToBalance onAmountChange={amount} onSubmit={()=>{}}/>);fireEvent.paste(container.querySelector('.hig-swap-panel')!,{clipboardData:{getData:()=> '99.1234'}});expect(amount).not.toHaveBeenCalled();});
it('global keyboard listener respects current submitting state',()=>{const amount=vi.fn();const props={tokens:[token],from:token,destination:{title:'Vault'},denomination:'token' as const,captureKeyboard:true,onAmountChange:amount,onSubmit:()=>{}};const view=render(<SwapPanelBlock {...props}/>);view.rerender(<SwapPanelBlock {...props} submitting/>);fireEvent.keyDown(window,{key:'2'});expect(amount).not.toHaveBeenCalled();});
it('token reporting preserves tiny and large exact decimals',()=>{
 const changed=vi.fn();const view=render(<SwapPanelBlock tokens={[token]} from={{...token,balance:null,decimals:18}} denomination='token' amount='0.000000001' onAmountChange={changed} onSubmit={()=>{}}/>);
 expect(changed).not.toHaveBeenCalled();
 view.rerender(<SwapPanelBlock tokens={[token]} from={{...token,balance:null,decimals:18}} denomination='token' amount='9007199254740993' onAmountChange={changed} onSubmit={()=>{}}/>);
 expect(changed).not.toHaveBeenCalled();expect(view.container.textContent).toContain('9007199254740993');
});
it('NaN target cannot submit',()=>{const submit=vi.fn();render(<TargetBlock kind='take-profit' labels={{title:'Target',submit:'Save',entry:'Entry',trigger:'Trigger',unit:'Unit',units:{dollar:'Dollars',price:'Price',percent:'Percent'},custom:'Custom'}} entry={10} unit='price' value={NaN} onSubmit={submit}/>);fireEvent.click(screen.getByRole('button',{name:'Save'}));expect(submit).not.toHaveBeenCalled();});
it('nested provider inherits environment and explicit reduced motion',()=>{function Probe(){const env=useHIG();return <output>{JSON.stringify({locale:env.locale,direction:env.direction,reduced:env.reducedMotion})}</output>;}render(<HIGProvider locale='ar-EG' direction='rtl' reducedMotion><HIGProvider primaryColor='#ffffff'><Probe/></HIGProvider></HIGProvider>);expect(screen.getByRole('status').textContent).toBe(JSON.stringify({locale:'ar-EG',direction:'rtl',reduced:true}));});
it('controlled state retains ownership',()=>{function Probe({value}:{value?:string}){const [current]=useControllable(value,'initial');return <output>{current}</output>;}const view=render(<Probe value='controlled'/>);view.rerender(<Probe/>);expect(screen.getByRole('status').textContent).toBe('controlled');});
it('a vetoed controlled accordion stays closed',()=>{const view=render(<Accordion title='Details' open={false} onOpenChange={()=>{}}>Body</Accordion>);const details=view.container.querySelector('details')!;details.open=true;fireEvent(details,new Event('toggle'));expect(details.open).toBe(false);});
it('field owns its labelled id',()=>{const {container}=render(<Field id='field' label='Amount'><Input id='other'/></Field>);expect(container.querySelector('label')!.control).toBe(container.querySelector('input'));});
it('removing selected tab selects an enabled fallback',()=>{const view=render(<Tabs label='Tabs' items={[{value:'a',label:'A',content:'A body'},{value:'b',label:'B',content:'B body'}]}/>);view.rerender(<Tabs label='Tabs' items={[{value:'b',label:'B',content:'B body'}]}/>);expect(screen.getByRole('tabpanel').textContent).toBe('B body');});
it('SearchInput preserves host ref cleanup',()=>{const close=vi.fn(),ref=vi.fn(()=>close);const view=render(<SearchInput value='x' onChange={()=>{}} onClear={()=>{}} ref={ref}/>);view.unmount();expect(close).toHaveBeenCalledOnce();});
it('invalid dates and countdowns render unknown',()=>{expect(formatCountdown(NaN).visible).toBe('—');expect(formatZonedTime(1e20,'en-US','UTC')).toBe('—');});
it('distinct feedback identities remain distinct',()=>{const play=vi.fn();const controller=new FeedbackController({preferences:{sound:true},sound:{capability:{available:true,mechanism:'web-audio',observed:false},play},now:()=>1000});controller.emit({source:'a/b',id:'c',intent:'success',origin:'programmatic'});controller.emit({source:'a',id:'b/c',intent:'success',origin:'programmatic'});expect(play).toHaveBeenCalledTimes(2);});
it('invalid detents are rejected before reaching a backend',()=>expect(()=>validateSnapPoints([0,-1,NaN])).toThrow());

it('async preference writes preserve update order',async()=>{
 let update:ReturnType<typeof useFeedback>['update'];let persisted:unknown;const finish:(()=>void)[]=[];
 const storage={read:()=>undefined,write:(value:unknown)=>new Promise<void>(resolve=>finish.push(()=>{persisted=value;resolve();}))};
 const createController=()=>new FeedbackController();
 function Probe(){update=useFeedback().update;return null;}
 render(<FeedbackProvider createController={createController} storage={storage}><Probe/></FeedbackProvider>);
 await act(async()=>{});
 act(()=>{update({sound:true});update({sound:false});});
 await act(async()=>{});expect(finish).toHaveLength(1);await act(async()=>{finish[0]();});expect(finish).toHaveLength(2);await act(async()=>{finish[1]();});
 expect(persisted).toMatchObject({sound:false});
});
it('controlled Select does not invent a fallback',()=>{
 const change=vi.fn();render(<Select label='Asset' value='removed' options={[{value:'a',label:'Alpha'}]} onValueChange={change}/>);
 expect(screen.getByRole('combobox').textContent).not.toContain('Alpha');expect(change).not.toHaveBeenCalled();
});

it('unknown account holdings make aggregate unknown',()=>{
 expect(accountSectionTotal({id:'wallet',title:'Wallet',assets:[{id:'known',symbol:'USDC',name:'USD',value:5},{id:'unknown',symbol:'ETH',name:'Ether',balance:2,price:null}]})).toBeNull();
});
it('a late price frame is ignored after unsubscribing',()=>{
 const socket={onmessage:(_event:{data:string})=>{void _event;},close(){},send(){}};vi.stubGlobal('WebSocket',function(){return socket;});
 const price=vi.fn(),stop=bitcoinPrice(price);stop();
 socket.onmessage({data:JSON.stringify({channel:'bbo',data:{bbo:[{px:'100'},{px:'102'}]}})});
 expect(price).not.toHaveBeenCalled();
});
it('slippage input rejects an invalid draft',()=>{
 const change=vi.fn();render(<SwapSettings view='slippage' onViewChange={()=>{}} onBack={()=>{}} denomination='token' slippage={0.005} onSlippageChange={change}/>);
 const input=screen.getByRole('textbox');fireEvent.change(input,{target:{value:'99'}});
 expect((input as HTMLInputElement).value).toBe('0.5');expect(change).not.toHaveBeenCalled();expect(screen.queryByRole('alert')).toBeNull();
});
it('copy completion cannot notify after owner unmounts',async()=>{
 let resolve!:()=>void;const pending=new Promise<void>(done=>resolve=done),notice=vi.fn(),unregister=registerNotifier(notice);
 try{const view=render(<WalletAddress address='0x1234567890' qr={<span/>} onCopy={()=>pending}/>);fireEvent.click(screen.getByRole('button'));await act(async()=>{});view.unmount();await act(async()=>resolve());expect(notice).not.toHaveBeenCalled();}finally{unregister();}
});
it('a submitting swap cannot change the pair',()=>{
 const from=vi.fn();render(<SwapPanelBlock tokens={[token]} from={token} to={{...token,id:'eth-other',symbol:'OTHER'}} onFromChange={from} amount='1' denomination='token' submitting onSubmit={()=>{}}/>);
 const flip=document.querySelector('.hig-swap-flip button')!;fireEvent.click(flip);expect(from).not.toHaveBeenCalled();
});

it('only the active visible swap panel handles global input',()=>{
 const a=vi.fn(),b=vi.fn();
 const props={tokens:[token],from:token,denomination:'token' as const,captureKeyboard:true,onSubmit:()=>{}};
 const view=render(<><SwapPanelBlock {...props} onAmountChange={a}/><SwapPanelBlock {...props} onAmountChange={b}/></>);
 fireEvent.keyDown(window,{key:'2'});expect(a).not.toHaveBeenCalled();expect(b).toHaveBeenLastCalledWith('2');
 view.rerender(<><SwapPanelBlock {...props} onAmountChange={a}/><div hidden><SwapPanelBlock {...props} onAmountChange={b}/></div></>);
 b.mockClear();fireEvent.keyDown(window,{key:'1'});expect(a).toHaveBeenLastCalledWith('1');expect(b).not.toHaveBeenCalled();
});
it('token input retains fractional zeroes and all supported places',()=>{
 const change=vi.fn();const view=render(<SwapPanelBlock tokens={[token]} from={{...token,decimals:18}} denomination='token' captureKeyboard onAmountChange={change} onSubmit={()=>{}}/>);
 for(const key of '0.000000001')fireEvent.keyDown(window,{key});
 expect(change).toHaveBeenLastCalledWith('0.000000001');
 fireEvent.paste(view.container.querySelector('.hig-swap-panel')!,{clipboardData:{getData:()=>'.25'}});
 expect(change).toHaveBeenLastCalledWith('0.25');
});
it('paste truncates precision and external amounts honor the balance cap',()=>{
 const change=vi.fn();const props={tokens:[token],from:token,denomination:'token' as const,limitToBalance:true,onAmountChange:change,onSubmit:()=>{}};
 const view=render(<SwapPanelBlock {...props}/>);
 fireEvent.paste(view.container.querySelector('.hig-swap-panel')!,{clipboardData:{getData:()=> '4.129'}});
 expect(change).toHaveBeenLastCalledWith('4.12');
 view.rerender(<SwapPanelBlock {...props} amount='99.999'/>);
 expect(view.container.querySelector('.hig-swap-amount')?.textContent).toContain('5');expect(change).toHaveBeenLastCalledWith('5');
});
it('two controls cannot silently share a Field id',()=>{
 const error=vi.spyOn(console,'error').mockImplementation(()=>{});
 expect(()=>render(<Field label='Shared'><Input/><Input/></Field>)).toThrow('exactly one control');error.mockRestore();
});
it('duplicate tab identities are rejected',()=>{
 expect(()=>render(<Tabs label='Duplicates' items={[{value:'same',label:'One',content:'1'},{value:'same',label:'Two',content:'2'}]}/>)).toThrow('unique keys');
});
it('a rejected extra decimal does not invalidate a precise converted amount',()=>{
 const change=vi.fn();const props={tokens:[token],from:{...token,balance:1,price:2000,decimals:6},amount:'0.123456',denomination:'usd' as const,captureKeyboard:true,onAmountChange:change,onSubmit:()=>{}};
 const view=render(<SwapPanelBlock {...props}/>);
 fireEvent.keyDown(window,{key:'1'});
 view.rerender(<SwapPanelBlock {...props} title='Updated'/>);
 expect(change).not.toHaveBeenCalled();
});
