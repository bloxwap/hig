'use client';
import {useState, type ReactNode} from 'react';
import {Button} from '@bloxwap/hig/react/button';
import {AccountBlock, DepositBlock, type DepositMethod, SwapBlock, TokenActionBlock} from '@bloxwap/hig/react/blocks';
import {GestureSheet, GestureSheetView} from '@bloxwap/hig/react/gesture-sheet';
import {HeaderClose, ScreenHeader} from '@bloxwap/hig/react/blocks/screen-header';
import {SegmentedControl} from '@bloxwap/hig/react/selection';
import {WalletAddress} from '@bloxwap/hig/react/wallet-address-core';
import {Stack, Text} from '@bloxwap/hig/react/surface';

type Wallet = {chain: string; address: string};
const ethereum = {chain: 'Ethereum', address: '0x1234567890abcdef1234567890abcdef12345678'};
const solana = {chain: 'Solana', address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgBNC'};
const hyperliquid = {...ethereum, chain: 'Hyperliquid'};
const hyperEvm = {...ethereum, chain: 'HyperEVM'};
const hyperCore = {...ethereum, chain: 'HyperCore'};

type Allocation = {chain?: string; liquid: number; staked: number};
function demoHolding(id: string, name: string, symbol: string, price: number, wallets: Wallet[], allocations: Allocation[]) {
  const balance = allocations.reduce((sum, part) => sum + part.liquid + part.staked, 0);
  const staked = allocations.reduce((sum, part) => sum + part.staked, 0);
  return {id, name, symbol, price, balance, staked, wallets, allocations};
}

const usdc = demoHolding('usdc', 'USD Coin', 'USDC', 1, [ethereum, solana],
  [ethereum, solana].map(({chain}) => ({chain, liquid: 0, staked: 0})));
const holdings = [
  usdc,
  demoHolding('hype', 'Hyperliquid', 'HYPE', 40, [hyperEvm, hyperCore], [
    {chain: hyperEvm.chain, liquid: 8, staked: 0},
    {chain: hyperCore.chain, liquid: 0, staked: 4},
  ]),
  demoHolding('paper', 'Papertrade', 'PT', 1, [], [{liquid: 20, staked: 5}]),
  demoHolding('sol', 'Solana', 'SOL', 125, [solana], [{chain: solana.chain, liquid: 2, staked: 0}]),
  demoHolding('blox', 'Bloxwap', 'BLOX', 0.5, [solana], [{chain: solana.chain, liquid: 100, staked: 0}]),
];

function ReceiveWallet({verb, wallets, onBack, headerAction}: {verb: 'Deposit' | 'Receive'; wallets: Wallet[]; onBack: () => void; headerAction: ReactNode}) {
  const [chain, setChain] = useState(wallets[0].chain);
  const wallet = wallets.find(option => option.chain === chain) ?? wallets[0];
  return <Stack>
    <ScreenHeader title={`${verb} on ${wallet.chain}`} onBack={onBack} action={headerAction}/>
    <WalletAddress size={144} address={wallet.address} onCopy={() => navigator.clipboard.writeText(wallet.address)}/>
    {wallets.length > 1 && <SegmentedControl label="Receiving network" hideLabel
      options={wallets.map(({chain}) => ({label: chain, value: chain}))}
      value={wallet.chain} onValueChange={setChain}/>}
  </Stack>;
}

const depositMethods: DepositMethod[] = [
  {id: 'apple-pay', label: 'Apple Pay', description: 'Instant card deposit'},
  {id: 'cash-app', label: 'Cash App', description: 'Scan to send Bitcoin'},
  {id: 'exchange', label: 'Exchange', description: 'Coinbase, Binance, and more'},
  {id: 'crypto', label: 'Send crypto', description: 'From any wallet or exchange'},
  {id: 'bank', label: 'Bank transfer', description: 'ACH, SEPA, or Interac'},
  {id: 'blink', label: 'Blink', description: 'Card or one-tap stablecoin deposit'},
];

const actionNames = {send: 'Send', stake: 'Stake', unstake: 'Unstake', withdraw: 'Withdraw', burn: 'Burn'} as const;
type View = keyof typeof actionNames | 'account' | 'holding' | 'receive' | 'deposit' | 'paper-deposit' | 'deposit-method' | 'complete';

export default function TokenActionFlow() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>('account');
  const [holdingId, setHoldingId] = useState(usdc.id);
  const [depositOrigin, setDepositOrigin] = useState<'account' | 'holding'>('account');
  const [method, setMethod] = useState(depositMethods[0]);
  function openDeposit(origin: 'account' | 'holding') {
    setDepositOrigin(origin);
    setView('deposit');
  }
  const holding = holdings.find(asset => asset.id === holdingId) ?? holdings[0];
  const staked = holding.staked;
  const breakdown = (label: string, units: number) => ({
    label, value: units * holding.price,
  });
  const chains = holding.allocations.flatMap(part => part.chain ? [breakdown(part.chain, part.liquid + part.staked)] : []);
  const available = holding.balance - staked;
  function changeOpen(next: boolean) {
    if (next) setView('account');
    setOpen(next);
  }
  function back() {
    if (view === 'deposit-method') setView('deposit');
    else if (view === 'deposit') setView(depositOrigin);
    else setView(view === 'holding' ? 'account' : 'holding');
  }
  const done = () => changeOpen(false);
  const closeButton = <HeaderClose label="Close" onClose={done}/>;
  const action = view === 'send' || view === 'stake' || view === 'unstake' || view === 'withdraw' || view === 'burn' ? actionNames[view] : undefined;
  const isPapertrade = holding.id === 'paper';
  const paperDeposit = view === 'paper-deposit';
  const source = paperDeposit ? usdc : holding;
  const chain = paperDeposit ? hyperliquid.chain : view === 'unstake' && holding.id === 'hype' ? hyperCore.chain : source.wallets[0]?.chain ?? 'Papertrade';
  const token = {...source, chain, chainId: chain, balance: paperDeposit ? usdc.balance : view === 'unstake' ? staked : available};
  const destinations = {
    send: 'Sample recipient',
    withdraw: 'USDC wallet',
    stake: isPapertrade ? 'Staked Papertrade' : 'Sample validator',
    unstake: isPapertrade ? 'Papertrade balance' : 'Sample wallet',
    'paper-deposit': 'Papertrade balance',
  };
  const destination = view in destinations ? destinations[view as keyof typeof destinations] : '';
  const options: Array<keyof typeof actionNames | 'deposit' | 'receive'> = isPapertrade
    ? ['deposit', 'withdraw', 'stake', 'unstake']
    : holding.id === usdc.id ? ['deposit', 'withdraw', 'send', 'receive'] : ['send', 'receive'];
  if (holding.id === 'blox') options.push('burn');
  if (!isPapertrade && staked > 0) options.push('stake', 'unstake');

  function selectAction(id: typeof options[number]) {
    if (id === 'deposit' && isPapertrade) setView('paper-deposit');
    else if (id === 'deposit') openDeposit('holding');
    else setView(id);
  }

  return <section className="example-frame example-canvas" aria-label="Token action flow example">
    <GestureSheet open={open} onOpenChange={changeOpen} title="Account and token actions" titleHidden enableDynamicSizing closeButton={null}
      trigger={<Button>Open account</Button>}
      contentProps={{style: {maxWidth: 390, marginInline: 'auto'}, onEscapeKeyDown(event) {
        if (view !== 'account') {
          event.preventDefault();
          back();
        }
      }}}>
      <GestureSheetView viewKey={view}>
        {view === 'account' && <AccountBlock className="token-flow-account" assets={holdings} pinnedSymbol="USDC" order="given"
          onDeposit={() => openDeposit('account')}
          headerAction={closeButton} onAssetSelect={asset => {
            setHoldingId(asset.id);
            setView('holding');
          }}/>}
        {view === 'holding' && <TokenActionBlock symbol={holding.symbol} name={holding.name} onBack={back} headerAction={closeButton}
          assets={[breakdown('Liquid', available), breakdown('Staked', staked)]}
          chains={chains}
          actions={options.map(id => ({
            id,
            label: id === 'deposit' ? 'Deposit' : id === 'withdraw' || id === 'burn' ? actionNames[id] : undefined,
            intent: id === 'burn' ? 'destructive' : undefined,
            disabled: id === 'unstake' ? staked === 0 : id !== 'receive' && id !== 'deposit' && available === 0,
            onSelect: () => selectAction(id),
          }))}/>}
        {view === 'receive' && <ReceiveWallet verb="Receive" wallets={holding.wallets} onBack={back} headerAction={closeButton}/>}
        {view === 'deposit' && <DepositBlock description="Choose how you’ll add funds to your Wallet." methods={depositMethods}
          onBack={back} headerAction={closeButton} onSelect={selected => {
            setMethod(selected);
            setView('deposit-method');
          }}/>}
        {view === 'deposit-method' && (method.id === 'crypto' || method.id === 'exchange'
          ? <ReceiveWallet verb="Deposit" wallets={usdc.wallets} onBack={back} headerAction={closeButton}/>
          : <Stack>
              <ScreenHeader title={method.label} onBack={back} action={closeButton}/>
              <Text>{method.description}</Text>
              <Text>This demo stops where the app would open the {method.label} deposit flow.</Text>
            </Stack>)}
        {(action || paperDeposit) && <SwapBlock banner={<ScreenHeader title={paperDeposit ? 'Deposit to Papertrade' : `${action} ${holding.symbol}`} onBack={back} action={closeButton}/>} tokens={[token]} from={token} lockFrom lockTo
          controls={false} denomination="token" denominationSwitch={false} keypad="always" amount={paperDeposit || view === 'burn' ? '0' : '2'} limitToBalance
          actionIntent={view === 'burn' ? 'destructive' : 'primary'}
          details={view === 'burn' ? [{label: 'Available to burn', value: available, suffix: ' BLOX'}] : undefined}
          destination={view === 'burn' ? undefined : {title: destination, subtitle: paperDeposit ? 'Papertrade' : view === 'withdraw' && isPapertrade ? hyperliquid.chain : token.chain}}
          actionLabel={`Confirm demo ${paperDeposit ? 'deposit' : view}`} onSubmit={() => setView('complete')}/>}
        {view === 'complete' && <Stack>
          <ScreenHeader title="Demo action confirmed" action={closeButton}/>
          <Button onClick={done}>Done</Button>
        </Stack>}
      </GestureSheetView>
    </GestureSheet>
  </section>;
}
