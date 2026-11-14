// @vitest-environment jsdom
import React,{useState} from 'react';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {HIGProvider} from '../packages/hig/react/src/provider';
import {SwapPanel,swapAction,type SwapPanelProps,type SwapToken} from '../packages/hig/react/src/recipes/swap-panel';
import {SwapSheet} from '../packages/hig/react/src/recipes/swap-sheet';
import {readFileSync} from 'node:fs';
import {applyAmountKey,fuzzyMatch,sanitizeAmount,testAmount,unitsToEntry} from '../packages/hig/react/src/recipes/swap/shared';
afterEach(cleanup);
const eth:SwapToken={id:'1-eth',symbol:'ETH',name:'Ether',chain:'Ethereum',chainId:1,balance:2,price:2000};
const usdc:SwapToken={id:'1-usdc',symbol:'USDC',name:'USD Coin',chain:'Ethereum',chainId:1,price:1,keywords:'0xa0b8'};
const baseUsdc:SwapToken={id:'8453-usdc',symbol:'USDC',name:'USD Coin',chain:'Base',chainId:8453,price:1};
const baseEth:SwapToken={id:'8453-eth',symbol:'ETH',name:'Ether',chain:'Base',chainId:8453,price:2000};
const tokens=[eth,usdc,baseUsdc,baseEth];
/** Controlled host: owns the pair like a real app would. */
function Host(props:Partial<SwapPanelProps>&{initialFrom?:SwapToken|null;initialTo?:SwapToken|null}){
 const {initialFrom=null,initialTo=null,...rest}=props;const [from,setFrom]=useState(initialFrom);const [to,setTo]=useState(initialTo);
 return <SwapPanel tokens={tokens} from={from} to={to} onFromChange={setFrom} onToChange={setTo} onSubmit={()=>{}} keypad='never' {...rest}/>;
}
const action=()=>screen.getAllByRole('button').find(button=>button.matches('.hig-swap-actions > .hig-button:not(.hig-icon-button)'))!;
const amount=()=>screen.getByRole('textbox',{name:'From amount'});
const type=(keys:string)=>{for(const key of keys.split(' '))fireEvent.keyDown(amount(),{key});};
const reading=(element:Element)=>element.querySelector('.hig-sr-only')?.textContent;
describe('swap helpers',()=>{
 it('names the action from the pair',()=>{
  expect(swapAction(null,eth)).toBe('send');expect(swapAction(eth,eth)).toBe('send');expect(swapAction(usdc,baseUsdc)).toBe('send');
  expect(swapAction(eth,usdc)).toBe('swap');expect(swapAction(eth,baseUsdc)).toBe('bridge');
 });
 it('edits an amount string one key at a time and caps dollars at two decimals',()=>{
  expect(applyAmountKey('0','5','usd')).toBe('5');expect(applyAmountKey('5','.','usd')).toBe('5.');expect(applyAmountKey('5.','.','usd')).toBe('5.');
  expect(applyAmountKey('5.25','1','usd')).toBe('5.25');expect(applyAmountKey('5.25','1','token')).toBe('5.251');
  expect(applyAmountKey('5','back','usd')).toBe('0');expect(applyAmountKey('51','back','usd')).toBe('5');expect(applyAmountKey('5','x','usd')).toBe('5');
  expect(sanitizeAmount('007.5.1abc')).toBe('7.51');expect(sanitizeAmount('.')).toBe('0');
 });
 it('floors a dollar entry so Max never exceeds the balance, and sizes the test amount',()=>{
  expect(unitsToEntry(0.123456,'token',2000)).toBe('0.123456');expect(unitsToEntry(0.0009999,'usd',2000)).toBe('1.99');expect(unitsToEntry(1,'usd',0)).toBe('0');
  expect(testAmount(eth)).toBe(0.0005);expect(testAmount({...usdc,balance:50})).toBe(0.5);expect(testAmount(usdc)).toBe(0);
  expect(fuzzyMatch('usdc','USD Coin USDC')).toBe(true);expect(fuzzyMatch('ucn','USD Coin')).toBe(true);expect(fuzzyMatch('btc','USD Coin')).toBe(false);
 });
});
describe('SwapPanel',()=>{
 it('starts empty: placeholders, a disabled action that says what is missing, nothing to reset',()=>{
  render(<Host/>);
  expect(screen.getByRole('button',{name:'Select From token'})).toBeTruthy();expect(document.querySelector('.hig-swap-panel')?.getAttribute('data-view')).toBe('main');
  expect(screen.getByText('From…')).toBeTruthy();expect(screen.getByText('To…')).toBeTruthy();
  expect(action().textContent).toBe('Select a token');expect(action()).toHaveProperty('disabled',true);
  expect(screen.getByRole('button',{name:'Reset'})).toHaveProperty('disabled',true);
  expect(screen.getByRole('button',{name:'Swap direction'})).toHaveProperty('disabled',true);
  expect(screen.queryByRole('group',{name:'Keypad'})).toBeNull();
 });
 it('takes rapid keys in order and reports the amount in token units',()=>{
  const changed=vi.fn();render(<Host initialFrom={eth} initialTo={usdc} onAmountChange={changed}/>);
  expect(action().textContent).toBe('Enter an amount');
  type('1 2 . 5');
  expect(reading(amount())).toBe('$12.5');expect(changed).toHaveBeenLastCalledWith('0.00625');
  expect(action().textContent).toBe('Swap');expect(action()).toHaveProperty('disabled',false);
  type('Backspace Backspace');expect(reading(amount())).toBe('$12');
  fireEvent.keyDown(amount(),{key:'5',metaKey:true});expect(reading(amount())).toBe('$12');
 });
 it('drives the amount from the keypad and from a paste',()=>{
  render(<Host initialFrom={eth} initialTo={usdc} keypad='always'/>);
  const pad=within(screen.getByRole('group',{name:'Keypad'}));
  fireEvent.click(pad.getByRole('button',{name:'7'}));fireEvent.click(pad.getByRole('button',{name:'5'}));fireEvent.click(pad.getByRole('button',{name:'Delete'}));
  expect(reading(amount())).toBe('$7');
  fireEvent.paste(amount(),{clipboardData:{getData:()=>'1,234.567'}});expect(reading(amount())).toBe('$1234.57');
  fireEvent.paste(amount(),{clipboardData:{getData:()=>'not a number'}});expect(reading(amount())).toBe('$1234.57');
 });
 it('pushes the token picker as a view: search, chain filter, hot section and keyboard',async()=>{
  const from=vi.fn();
  render(<SwapPanel tokens={tokens} hotTokenIds={['8453-eth','1-usdc']} onFromChange={from} onSubmit={()=>{}} keypad='never'/>);
  await userEvent.click(screen.getByRole('button',{name:'Select From token'}));
  const sheet=screen.getByRole('group',{name:'From'});expect(screen.queryByRole('dialog')).toBeNull();
  // The picker replaces the cards inside the panel; the title takes focus without a hardware pointer to type with.
  expect(document.querySelector('.hig-swap-panel')?.getAttribute('data-view')).toBe('from');expect(screen.queryByRole('textbox',{name:'From amount'})).toBeNull();
  expect(document.activeElement).toBe(screen.getByRole('heading',{name:'From'}));
  expect(within(sheet).getAllByRole('listitem').map(item=>item.textContent)).toEqual(['ETHEtherBase','USDUSD CoinEthereum','ETHEtherEthereum2$4,000.00','USDUSD CoinBase']);
  expect(within(sheet).getByText('Hot')).toBeTruthy();expect(within(sheet).getByText('All tokens')).toBeTruthy();
  // Chains are the standalone Filter: one radio group.
  await userEvent.click(within(within(sheet).getByRole('radiogroup',{name:'Chains'})).getByRole('radio',{name:'Base'}));
  expect(within(sheet).getAllByRole('listitem')).toHaveLength(2);expect(within(sheet).queryByText('Hot')).toBeNull();
  await userEvent.click(within(sheet).getByRole('radio',{name:'All'}));
  const search=within(sheet).getByRole('searchbox',{name:'Search name or paste address'});
  await userEvent.type(search,'0xa0b8');expect(within(sheet).getAllByRole('listitem')).toHaveLength(1);
  await userEvent.clear(search);await userEvent.type(search,'zzz');expect(within(sheet).getByRole('status').textContent).toBe('No tokens found');
  await userEvent.clear(search);await userEvent.type(search,'usd');await userEvent.keyboard('{ArrowDown}{Enter}');
  expect(from).toHaveBeenCalledWith(baseUsdc);expect(screen.queryByRole('group',{name:'From'})).toBeNull();
  // Choosing pops back to the cards and returns focus to the slot that pushed.
  expect(document.activeElement).toBe(screen.getByRole('button',{name:'Select From token'}));
  // Uncontrolled: the panel keeps the pick and shows it.
  expect(screen.getByText('Base')).toBeTruthy();expect(screen.queryByText('From…')).toBeNull();
 });
 it('labels send, swap, bridge and an amount over the balance',()=>{
  const view=render(<Host initialFrom={eth} initialTo={baseEth}/>);type('5');expect(action().textContent).toBe('Send');view.unmount();
  render(<Host initialFrom={eth} initialTo={baseUsdc}/>);type('5');expect(action().textContent).toBe('Bridge');
  type('0 0 0');expect(action().textContent).toBe('Insufficient ETH');expect(action()).toHaveProperty('disabled',true);
 });
 it('flips the pair, enters Max and Test, and converts the entry when the denomination switches',async()=>{
  render(<Host initialFrom={eth} initialTo={usdc}/>);
  await userEvent.click(screen.getByRole('button',{name:'Max'}));expect(reading(amount())).toBe('$4000');
  await userEvent.click(screen.getByRole('button',{name:'Test'}));expect(reading(amount())).toBe('$1');
  const [fromPill,toPill]=screen.getAllByRole('button',{name:'Switch between dollars and token units'});
  expect(reading(fromPill)).toBe('0.0005 ETH');
  await userEvent.click(fromPill);expect(reading(amount())).toBe('0.0005');expect(reading(fromPill)).toBe('$1.00');
  expect(reading(toPill)).toBe('1 USDC');await userEvent.click(toPill);expect(reading(toPill)).toBe('$1.00');
  await userEvent.click(screen.getByRole('button',{name:'Swap direction'}));
  expect(screen.getByRole('button',{name:'Select From token'}).parentElement?.textContent).toContain('USD Coin');
 });
 it('shows the host quote, fee and slippage on the To card',()=>{
  render(<Host initialFrom={eth} initialTo={usdc} received={1987.5} fee={0.27} slippage={0.01}/>);type('1');
  const to=screen.getByRole('button',{name:'Select To token'}).closest('.hig-swap-card')!;
  expect(within(to as HTMLElement).getByText('Fee $0.27')).toBeTruthy();expect(within(to as HTMLElement).getByRole('button',{name:'Slippage 1%'})).toBeTruthy();
  expect(to.querySelector('.hig-swap-amount .hig-sr-only')?.textContent).toBe('To amount: $1987.5');
 });
 it('resets the entry and the pair, and tells the host',async()=>{
  const reset=vi.fn();render(<Host initialFrom={eth} initialTo={usdc} onReset={reset}/>);type('9');
  await userEvent.click(screen.getByRole('button',{name:'Reset'}));
  expect(reading(amount())).toBe('$0');expect(screen.getByText('From…')).toBeTruthy();expect(reset).toHaveBeenCalledTimes(1);
 });
 it('submits the named action once and blocks while submitting',async()=>{
  const submit=vi.fn();const view=render(<Host initialFrom={eth} initialTo={baseUsdc} onSubmit={submit}/>);type('5');
  await userEvent.click(action());expect(submit).toHaveBeenCalledWith('bridge');
  view.rerender(<Host initialFrom={eth} initialTo={baseUsdc} onSubmit={submit} submitting/>);
  expect(action().getAttribute('aria-busy')).toBe('true');await userEvent.click(action());expect(submit).toHaveBeenCalledTimes(1);
 });
 it('swaps the amount for the receive view and copies the address through the host',async()=>{
  const copy=vi.fn(),connect=vi.fn();const address='0x71C7656EC7ab88b098defB751B7401B5f6d8976F';
  render(<Host initialFrom={eth} receive={{address,qr:<svg data-testid='qr'/>,onCopy:copy}} receiving onConnect={connect}/>);
  expect(screen.queryByRole('textbox')).toBeNull();expect(screen.getByTestId('qr')).toBeTruthy();
  const view=screen.getByRole('button',{name:`Copy address: ${address}`});
  expect([...view.querySelectorAll('[data-anchor]')].map(node=>node.textContent).join('')).toBe('0x71C7976F');
  await userEvent.click(view);expect(copy).toHaveBeenCalledTimes(1);
  expect(action().textContent).toBe('Send from your wallet');await userEvent.click(action());expect(connect).toHaveBeenCalledTimes(1);
 });
 it('offers connect and the receive view in the From picker, and the recipient field in the To picker',async()=>{
  const connect=vi.fn(),receiving=vi.fn(),recipient=vi.fn(),scan=vi.fn();
  render(<Host wallet={{connected:false}} onConnect={connect} receive={{address:'0xabc'}} onReceivingChange={receiving} recipient='' onRecipientChange={recipient} onScanRecipient={scan}/>);
  await userEvent.click(screen.getByRole('button',{name:'Select From token'}));
  await userEvent.click(screen.getByRole('button',{name:'Connect wallet'}));expect(connect).toHaveBeenCalled();
  // Generate address is a switch: it reports the change and stays on the picker, so the user can go on to pick a chain and an asset.
  await userEvent.click(screen.getByRole('switch',{name:'Generate address'}));expect(receiving).toHaveBeenCalledWith(true);expect(screen.getByRole('group',{name:'From'})).toBeTruthy();
  await userEvent.click(screen.getByRole('button',{name:'Back'}));
  await userEvent.click(screen.getByRole('button',{name:'Select To token'}));
  await userEvent.type(screen.getByRole('textbox',{name:'Recipient address'}),'0');expect(recipient).toHaveBeenCalledWith('0');
  await userEvent.click(screen.getByRole('button',{name:'Scan QR code'}));expect(scan).toHaveBeenCalled();
 });
 it('pushes settings, then slippage and fees one level deeper, with Back and Escape popping one level',async()=>{
  const slippage=vi.fn(),denomination=vi.fn();
  render(<Host initialFrom={eth} initialTo={usdc} onSlippageChange={slippage} onDenominationChange={denomination} fee={0.27} fees={[{label:'Network',usd:0.19},{label:'Relayer',usd:0.08}]} settings={<p>Host row</p>}/>);
  await userEvent.click(screen.getByRole('button',{name:'Settings'}));
  const sheet=screen.getByRole('group',{name:'Settings'});expect(within(sheet).getByText('Host row')).toBeTruthy();
  await userEvent.click(within(sheet).getByRole('radio',{name:'Units'}));expect(denomination).toHaveBeenCalledWith('token');
  await userEvent.click(within(sheet).getByRole('button',{name:/^Slippage/}));
  expect(screen.getByRole('heading',{name:'Slippage'})).toBeTruthy();await userEvent.click(screen.getByRole('radio',{name:'1%'}));expect(slippage).toHaveBeenLastCalledWith(0.01);
  const custom=screen.getByRole('textbox',{name:'Custom slippage (%)'});await userEvent.clear(custom);await userEvent.type(custom,'2.5');expect(slippage).toHaveBeenLastCalledWith(0.025);
  await userEvent.click(screen.getByRole('button',{name:'Back'}));
  await userEvent.click(within(screen.getByRole('group',{name:'Settings'})).getByRole('button',{name:/^Fees/}));
  expect(screen.getByRole('group',{name:'Fees'}).textContent).toContain('Network$0.19');expect(screen.getByRole('group',{name:'Fees'}).textContent).toContain('Total$0.27');
  expect(document.querySelector('.hig-swap-view')?.getAttribute('data-direction')).toBe('push');
  await userEvent.keyboard('{Escape}');expect(screen.getByRole('group',{name:'Settings'})).toBeTruthy();expect(document.querySelector('.hig-swap-view')?.getAttribute('data-direction')).toBe('pop');
  await userEvent.keyboard('{Escape}');expect(document.querySelector('.hig-swap-panel')?.getAttribute('data-view')).toBe('main');
  expect(document.activeElement).toBe(screen.getByRole('button',{name:'Settings'}));expect(reading(amount())).toBe('0');
 });
 it('opens the pickers from the keyboard shortcuts unless they are turned off',()=>{
  const view=render(<Host/>);
  fireEvent.keyDown(window,{key:'k',ctrlKey:true});expect(screen.getByRole('group',{name:'To'})).toBeTruthy();
  view.unmount();render(<Host shortcuts={false}/>);
  fireEvent.keyDown(window,{key:'f',metaKey:true});expect(screen.queryByRole('group',{name:'From'})).toBeNull();
 });
 it('uses the provider translations for every label it draws',()=>{
  render(<HIGProvider messages={{swapFrom:'De',swapTo:'Vers',swapChooseToken:'Choisir un jeton',swapSelectToken:side=>`Choisir le jeton ${side}`,swapReset:'Réinitialiser',swapSettings:'Réglages',swapFlip:'Inverser'}}><Host/></HIGProvider>);
  expect(screen.getByText('De…')).toBeTruthy();expect(screen.getByRole('button',{name:'Choisir le jeton Vers'})).toBeTruthy();expect(action().textContent).toBe('Choisir un jeton');
 });
 it('keeps the action row at the standard button height',()=>{
  const css=readFileSync('packages/hig/react/src/styles.css','utf8');
  expect(css).not.toMatch(/\.hig-swap-actions[^{]*\{[^}]*min-(height|width)/);
 });
 it('one-way mode replaces the flip button with a decorative down arrow',()=>{
  const changed=vi.fn();render(<Host initialFrom={eth} initialTo={usdc} oneWay onFromChange={changed}/>);
  expect(screen.queryByRole('button',{name:'Swap direction'})).toBeNull();
  const mark=document.querySelector('.hig-swap-flip > span')!;expect(mark.getAttribute('aria-hidden')).toBe('true');expect(mark.querySelector('svg')).toBeTruthy();
  expect(document.querySelector('.hig-swap-flip > button')).toBeNull();
 });
 it('fixes the denomination when the switch is turned off: no conversion capsules and no setting',async()=>{
  render(<Host initialFrom={eth} initialTo={usdc} denominationSwitch={false}/>);type('5');
  expect(screen.queryByRole('button',{name:'Switch between dollars and token units'})).toBeNull();expect(reading(amount())).toBe('$5');
  await userEvent.click(screen.getByRole('button',{name:'Settings'}));
  expect(screen.queryByRole('radio',{name:'Units'})).toBeNull();expect(screen.getByRole('button',{name:/^Fees/})).toBeTruthy();
  cleanup();
  // The fixed denomination follows the `denomination` prop.
  render(<Host initialFrom={eth} initialTo={usdc} denominationSwitch={false} denomination='token'/>);type('2');expect(reading(amount())).toBe('2');
 });
 it('seeds the entry from a mounted amount, in the default denomination',()=>{
  const view=render(<Host initialFrom={eth} initialTo={usdc} amount='0.5'/>);expect(reading(amount())).toBe('$1000');expect(action().textContent).toBe('Swap');view.unmount();
  render(<Host initialFrom={eth} initialTo={usdc} amount='0.5' denomination='token'/>);expect(reading(amount())).toBe('0.5');
 });
 it('shows a fixed destination as a compact card: no To token, no amount, one way, and the action ready from the From side alone',async()=>{
  const submit=vi.fn(),press=vi.fn();
  const view=render(<Host initialFrom={eth} fee={0.19} destination={{title:'Ether staking',subtitle:'Ethereum',detail:'3.1% APR'}} actionLabel='Stake' onSubmit={submit}/>);
  const card=document.querySelector(".hig-swap-card[data-side='to']") as HTMLElement;
  expect(card.getAttribute('data-compact')).toBe('true');expect(card.textContent).toBe('EtEther stakingEthereum3.1% APRFee $0.19');
  expect(card.querySelector('.hig-swap-amount')).toBeNull();expect(card.querySelector('button')).toBeNull();
  expect(screen.queryByRole('button',{name:'Select To token'})).toBeNull();expect(screen.queryByRole('button',{name:'Swap direction'})).toBeNull();expect(document.querySelector('.hig-swap-flip > span')).toBeTruthy();
  // Before an amount the usual prompt shows; the host label names the action only once it is ready.
  expect(action().textContent).toBe('Enter an amount');type('5');expect(action().textContent).toBe('Stake');
  await userEvent.click(action());expect(submit).toHaveBeenCalledWith('send');
  fireEvent.keyDown(window,{key:'k',ctrlKey:true});expect(screen.queryByRole('group',{name:'To'})).toBeNull();
  view.unmount();
  // A wallet destination shows its shortened address and can be a button, for example to change the recipient.
  render(<Host initialFrom={usdc} destination={{title:'Recipient wallet',address:'0x9e0fD0622874ca1cBf79DA087BaF4622Faf77688',onPress:press}}/>);
  const wallet=screen.getByRole('button',{name:'Recipient wallet'});expect(wallet.closest('.hig-swap-card')?.textContent).toBe('Recipient wallet0x9e0f…7688');expect(wallet.closest('.hig-swap-card')?.querySelector('.hig-swap-meta svg')).toBeTruthy();
  await userEvent.click(wallet);expect(press).toHaveBeenCalledTimes(1);type('5');expect(action().textContent).toBe('Send');
 });
 it('keeps a locked side fixed: no picker, no shortcut, and reset leaves its token',async()=>{
  const reset=vi.fn();render(<Host initialFrom={eth} initialTo={usdc} lockFrom lockTo oneWay actionLabel='Unstake' onReset={reset}/>);
  expect(screen.queryByRole('button',{name:'Select From token'})).toBeNull();expect(screen.queryByRole('button',{name:'Select To token'})).toBeNull();
  expect(document.querySelectorAll('.hig-swap-hit')).toHaveLength(0);expect(document.querySelectorAll("[data-locked='true']")).toHaveLength(2);
  fireEvent.keyDown(window,{key:'f',metaKey:true});expect(document.querySelector('.hig-swap-panel')?.getAttribute('data-view')).toBe('main');
  // Only locked tokens and no amount: nothing to reset.
  expect(screen.getByRole('button',{name:'Reset'})).toHaveProperty('disabled',true);
  type('3');expect(action().textContent).toBe('Unstake');await userEvent.click(screen.getByRole('button',{name:'Reset'}));
  expect(reading(amount())).toBe('$0');expect(screen.getByText('Ether')).toBeTruthy();expect(screen.getByText('USD Coin')).toBeTruthy();expect(reset).toHaveBeenCalledTimes(1);
  await userEvent.click(screen.getByRole('button',{name:'Max'}));expect(reading(amount())).toBe('$4000');
 });
 it('presents a token with a caption as an account: name over caption, one disc, Max only, and a chevron while it can be changed',async()=>{
  const account:SwapToken={id:'hl',symbol:'USDC',name:'USDC on Hyperliquid',chain:'Hyperliquid',chainId:'hl',balance:234.68,price:1,caption:'$234.68 available'};
  const view=render(<Host initialFrom={account} destination={{title:'Papertrade'}} denominationSwitch={false}/>);
  const from=document.querySelector(".hig-swap-card[data-side='from']") as HTMLElement;
  expect(from.querySelector('[data-account]')?.textContent).toBe('USDUSDC on Hyperliquid$234.68 availableMax');
  expect(screen.queryByRole('button',{name:'Test'})).toBeNull();expect(from.querySelector('.hig-swap-identity strong svg')).toBeTruthy();
  await userEvent.click(screen.getByRole('button',{name:'Max'}));expect(reading(amount())).toBe('$234.68');
  view.unmount();
  render(<Host initialFrom={account} lockFrom destination={{title:'Papertrade'}}/>);
  expect(document.querySelector(".hig-swap-card[data-side='from'] .hig-swap-identity strong svg")).toBeNull();
 });
 it('keeps the action disabled, asking for a destination, while the destination is pending',async()=>{
  const pick=vi.fn(),submit=vi.fn();
  const view=render(<Host initialFrom={eth} destination={{title:'To',subtitle:'Pick a destination',pending:true,onPress:pick}} onSubmit={submit}/>);type('5');
  expect(action().textContent).toBe('Pick a destination');expect(action()).toHaveProperty('disabled',true);
  expect(document.querySelector("[data-side='to']")?.getAttribute('data-pending')).toBe('true');
  await userEvent.click(screen.getByRole('button',{name:'To'}));expect(pick).toHaveBeenCalledTimes(1);
  view.rerender(<Host initialFrom={eth} destination={{title:'Recipient wallet',address:'0x9e0fD0622874ca1cBf79DA087BaF4622Faf77688'}} onSubmit={submit}/>);
  expect(action().textContent).toBe('Send');await userEvent.click(action());expect(submit).toHaveBeenCalledWith('send');
 });
 it('shows label and value rows as the bottom card, alone or under a destination',async()=>{
  const submit=vi.fn(),rows=[{label:'Staked',value:'11.0735 HYPE'},{label:'Fee tier',value:'Wood'}];
  const view=render(<Host initialFrom={eth} details={rows} actionLabel='Stake' onSubmit={submit}/>);
  const card=document.querySelector(".hig-swap-card[data-side='to']") as HTMLElement;
  expect([...card.querySelectorAll('dl > div')].map(row=>[row.querySelector('dt')?.textContent,row.querySelector('dd')?.textContent])).toEqual([['Staked','11.0735 HYPE'],['Fee tier','Wood']]);
  expect(card.querySelector('.hig-swap-slot')).toBeNull();expect(screen.queryByRole('button',{name:'Swap direction'})).toBeNull();
  type('2');expect(action().textContent).toBe('Stake');await userEvent.click(action());expect(submit).toHaveBeenCalledWith('send');
  view.unmount();
  render(<Host initialFrom={eth} destination={{title:'Pool'}} details={rows}/>);
  const both=document.querySelector(".hig-swap-card[data-side='to']") as HTMLElement;expect(both.querySelector('.hig-swap-slot')).toBeTruthy();expect(both.querySelectorAll('dl > div')).toHaveLength(2);
  cleanup();
  // With a To token the rows are not the bottom card, so the pair still swaps normally.
  render(<Host initialFrom={eth} initialTo={usdc} details={rows}/>);expect(screen.getByRole('button',{name:'Select To token'})).toBeTruthy();
 });
 it('adds a heading with optional Back, a note in a tone, an action icon, and can drop the settings and reset buttons',async()=>{
  const back=vi.fn();
  const view=render(<Host initialFrom={eth} initialTo={usdc} title='Withdraw from Papertrade' onBack={back} note='The minimum withdrawal is $10.00.' controls={false} actionIcon={<i data-testid='icon'/>}/>);
  expect(screen.getByRole('heading',{name:'Withdraw from Papertrade'})).toBeTruthy();await userEvent.click(screen.getByRole('button',{name:'Back'}));expect(back).toHaveBeenCalledTimes(1);
  const note=screen.getByRole('note');expect(note.textContent).toBe('The minimum withdrawal is $10.00.');expect(note.getAttribute('data-tone')).toBe('muted');
  expect(screen.queryByRole('button',{name:'Settings'})).toBeNull();expect(screen.queryByRole('button',{name:'Reset'})).toBeNull();
  expect(document.querySelectorAll('.hig-swap-actions > *')).toHaveLength(1);expect(action().firstElementChild).toBe(screen.getByTestId('icon'));
  view.rerender(<Host initialFrom={eth} initialTo={usdc} title='Unstake' note='Read this first.' noteTone='negative'/>);
  expect(screen.queryByRole('button',{name:'Back'})).toBeNull();expect(screen.getByRole('note').getAttribute('data-tone')).toBe('negative');expect(screen.getByRole('button',{name:'Settings'})).toBeTruthy();
 });
 it('lets the host control the view',async()=>{
  const viewed=vi.fn();const view=render(<Host view='to' onViewChange={viewed}/>);
  expect(screen.getByRole('group',{name:'To'})).toBeTruthy();
  await userEvent.click(screen.getByRole('button',{name:'Back'}));expect(viewed).toHaveBeenCalledWith('main');expect(screen.getByRole('group',{name:'To'})).toBeTruthy();
  view.rerender(<Host view='main' onViewChange={viewed}/>);expect(screen.queryByRole('group',{name:'To'})).toBeNull();
 });
 it('ignores amount keys while a view is pushed',async()=>{
  render(<Host initialFrom={eth} initialTo={usdc} captureKeyboard/>);
  fireEvent.keyDown(window,{key:'7'});expect(reading(amount())).toBe('$7');
  await userEvent.click(screen.getByRole('button',{name:'Settings'}));fireEvent.keyDown(window,{key:'9'});
  await userEvent.click(screen.getByRole('button',{name:'Back'}));expect(reading(amount())).toBe('$7');
 });
});
describe('SwapSheet',()=>{
 // Vaul reads matchMedia and animates with CSS; jsdom has neither. Clicks inside the sheet use fireEvent because Vaul's drag handlers need pointer capture.
 let motion:HTMLStyleElement;
 beforeEach(()=>{vi.stubGlobal('matchMedia',vi.fn(()=>({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()})));motion=document.createElement('style');motion.textContent='[data-vaul-drawer],[data-vaul-overlay]{animation-name:none!important}';document.head.append(motion);});
 afterEach(()=>{motion.remove();vi.unstubAllGlobals();});
 function Sheet(props:Partial<SwapPanelProps>){const [open,setOpen]=useState(false);return <SwapSheet title='Swap' open={open} onOpenChange={setOpen} trigger={<button>Open swap</button>} tokens={tokens} onSubmit={()=>{}} keypad='never' {...props}/>;}
 it('presents the panel in a gesture sheet and pushes views inside that one sheet',async()=>{
  render(<Sheet/>);expect(screen.queryByRole('dialog')).toBeNull();
  await userEvent.click(screen.getByRole('button',{name:'Open swap'}));
  const sheet=screen.getByRole('dialog',{name:'Swap'});expect(sheet.className).toContain('hig-gesture-sheet');expect(sheet.className).toContain('hig-swap-sheet');
  fireEvent.click(within(sheet).getByRole('button',{name:'Select To token'}));
  expect(screen.getAllByRole('dialog')).toHaveLength(1);expect(within(sheet).getByRole('group',{name:'To'})).toBeTruthy();
  // Escape pops the pushed view first and only then closes the sheet.
  await userEvent.keyboard('{Escape}');expect(screen.getByRole('dialog',{name:'Swap'})).toBeTruthy();expect(within(sheet).queryByRole('group',{name:'To'})).toBeNull();
  await userEvent.keyboard('{Escape}');expect(screen.queryByRole('dialog')).toBeNull();
 });
 it('reopens on the cards after closing from a pushed view',async()=>{
  const view=render(<SwapSheet title='Swap' open onOpenChange={()=>{}} tokens={tokens} onSubmit={()=>{}} keypad='never'/>);
  fireEvent.click(screen.getByRole('button',{name:'Settings'}));expect(screen.getByRole('group',{name:'Settings'})).toBeTruthy();
  view.rerender(<SwapSheet title='Swap' open={false} onOpenChange={()=>{}} tokens={tokens} onSubmit={()=>{}} keypad='never'/>);
  view.rerender(<SwapSheet title='Swap' open onOpenChange={()=>{}} tokens={tokens} onSubmit={()=>{}} keypad='never'/>);
  expect(screen.queryByRole('group',{name:'Settings'})).toBeNull();expect(screen.getByRole('button',{name:'Select From token'})).toBeTruthy();
 });
 it('keeps the gesture backend and overlays out of the panel and the recipes aggregate',()=>{
  for(const file of ['recipes/swap-panel.tsx','recipes/swap/picker.tsx','recipes/swap/settings.tsx','recipes/swap/shared.tsx'])expect(readFileSync(`packages/hig/react/src/${file}`,'utf8')).not.toMatch(/gesture-sheet|dialog\.js|radix|vaul/);
  expect(readFileSync('packages/hig/react/src/recipes.tsx','utf8')).not.toMatch(/from '\.\/recipes\/swap-sheet/);
 });
});

describe('SwapAmountCard',()=>{
 it('draws the From card anatomy on its own: asset, actions, balance and the entered amount',async()=>{
  const {SwapAmountCard,SwapPill}=await import('../packages/hig/react/src/recipes/swap-panel');const onMax=vi.fn();
  const {container}=render(<SwapAmountCard name='USD Coin' symbol='USDC' context='Demo' actions={<SwapPill onClick={onMax}>Max</SwapPill>} meta='1,000 USDC' value={12.5} prefix='$' fractionDigits={2} amountLabel='Size'/>);
  const card=container.querySelector('.hig-swap-card')!;expect(card.getAttribute('data-side')).toBe('from');
  expect(card.querySelector('.hig-swap-identity')?.textContent).toBe('DemoUSD Coin');expect(card.querySelector('.hig-swap-initials')?.textContent).toBe('USD');
  expect(card.querySelector('.hig-swap-meta .hig-number')?.textContent).toBe('1,000 USDC');
  expect(screen.getByRole('textbox',{name:'Size'}).textContent).toContain('$12.50');
  // No asset picker without onSelect; the capsule action still works.
  expect(card.querySelector('.hig-swap-hit')).toBeNull();fireEvent.click(screen.getByRole('button',{name:'Max'}));expect(onMax).toHaveBeenCalledTimes(1);
 });
 it('takes host-drawn artwork, keeps a typed trailing point and can choose the asset',async()=>{
  const {SwapAmountCard}=await import('../packages/hig/react/src/recipes/swap-panel');const onSelect=vi.fn();
  const {container}=render(<SwapAmountCard name='USD Coin' symbol='USDC' icon={<svg data-testid='art'/>} value={3} trailingDot amountLabel='Size' onSelect={onSelect} selectLabel='Choose asset'/>);
  expect(screen.getByTestId('art')).toBeTruthy();expect(container.querySelector('.hig-swap-initials')).toBeNull();expect(container.querySelector('.hig-swap-meta')).toBeNull();
  expect(screen.getByRole('textbox',{name:'Size'}).textContent).toContain('3.');
  fireEvent.click(screen.getByRole('button',{name:'Choose asset'}));expect(onSelect).toHaveBeenCalledTimes(1);
  cleanup();render(<SwapAmountCard name='Bitcoin' symbol='BTC' value={12} suffix='%' trailingDot amountLabel='Target'/>);expect(screen.getByRole('textbox',{name:'Target'}).textContent).toContain('12.%');
 });
});
