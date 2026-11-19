const React = require('react');
const {act, create} = require('react-test-renderer');
const {ReceiveBlock} = require('../../packages/hig/native/src/receive-block');
const {SegmentedControl} = require('../../packages/hig/native/src/radio-group');
const {WalletAddress} = require('../../packages/hig/native/src/wallet-address');

it('pairs each visible network with its receiving address across mode changes', () => {
  const props = {solanaAddress: 'SolanaExample', ethereumAddress: '0x1234', onCopy: jest.fn()};
  let root;
  act(() => { root = create(React.createElement(ReceiveBlock, props)); });
  try {
    // Ethereum is the first segment and the network shown first; Solana follows it.
    expect(root.root.findByType(SegmentedControl).props.options.map(option => option.value)).toEqual(['ethereum', 'solana']);
    expect(root.root.findByType(WalletAddress).props.kind).toBe('ethereum');
    expect(root.root.findByType(WalletAddress).props.address).toBe(props.ethereumAddress);
    act(() => root.root.findByType(SegmentedControl).props.onValueChange('solana'));
    expect(root.root.findByType(WalletAddress).props.address).toBe(props.solanaAddress);
    for (const network of ['ethereum', 'solana']) {
      act(() => root.update(React.createElement(ReceiveBlock, {...props, mode: network})));
      expect(root.root.findAllByType(SegmentedControl)).toHaveLength(0);
      const wallet = root.root.findByType(WalletAddress);
      expect(wallet.props.address).toBe(props[network + 'Address']);
      wallet.props.onCopy();
      expect(props.onCopy).toHaveBeenLastCalledWith(network, props[network + 'Address']);
    }
  } finally { act(() => root.unmount()); }
});
