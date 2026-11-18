const React = require('react');
const {act, create} = require('react-test-renderer');
const {Text, View, StyleSheet} = require('react-native');
const {HIGProvider} = require('../../packages/hig/native/src/provider');
const {AccountBlock} = require('../../packages/hig/native/src/account-block');
const {TradeHistoryDetailBlock} = require('../../packages/hig/native/src/trade-history-detail-block');

const h = React.createElement;
const cases = [
  ['account', AccountBlock, {
    assets: [
      {id:'usdc', name:'USD Coin', symbol:'USDC', balance:100.33, price:1},
      {id:'sol', name:'Solana', symbol:'SOL', balance:1.42, price:142.96},
      {id:'hype', name:'Hyperliquid', symbol:'HYPE', balance:13.2, price:57.5},
      {id:'eth', name:'Ether', symbol:'ETH', balance:0.05, price:3521.12},
    ],
  }],
  ['closed trade', TradeHistoryDetailBlock, {
    labels:{title:'Trade', netPnl:'Net PnL', onMargin:p=>p+' on margin', long:'Long', short:'Short', entry:'Entry', exit:'Exit'},
    name:'Bitcoin', side:'long', leverage:40, pnl:-1.12, pnlPercent:-0.112, entry:64700, exit:64522.5,
    details:[{label:'Size',value:0.006182,suffix:' BTC'}, {label:'Notional',value:399.98}, {label:'Fees',value:0.0721}],
  }],
];

it.each(cases)('opens the %s block with a single visible glyph per stationary place', (_, Block, props) => {
  let root;
  try {
    act(() => { root = create(h(HIGProvider,{reducedMotion:false},h(Block,props))); });
    const probes = root.root.findAllByType(Text).filter(node => typeof node.props.onLayout === 'function');
    act(() => {
      for (const probe of probes) probe.props.onLayout({nativeEvent:{layout:{x:0,y:0,width:12,height:24}}});
    });
    const windows = root.root.findAllByType(View).filter(node => {
      const style = StyleSheet.flatten(node.props.style);
      return node.props.collapsable === false && style?.overflow === 'hidden' && style.width === 12 && style.height === 24;
    });
    expect(windows.length).toBeGreaterThan(10);
    const drawn = windows.reduce((sum, window) => sum + window.findAllByType(Text).length, 0);
    expect(drawn).toBe(windows.length);
  } finally {
    if (root) act(() => root.unmount());
  }
});
