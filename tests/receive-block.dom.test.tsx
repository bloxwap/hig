import React from 'react';
import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {expect, it, vi} from 'vitest';
import {ReceiveBlock} from '../packages/hig/react/src/blocks/receive-block';

it('shows only the enabled networks and copies the address for the selected network', async () => {
  const props = {solanaAddress: 'SolanaExample', ethereumAddress: '0x1234', onCopy: vi.fn()};
  const {rerender} = render(<ReceiveBlock {...props}/>);
  expect(screen.getAllByRole('img')).toHaveLength(1);
  // Ethereum is the first segment and the one selected at first; Solana follows it.
  expect(screen.getAllByRole('radio')).toEqual([screen.getByRole('radio', {name: 'Ethereum'}), screen.getByRole('radio', {name: 'Solana'})]);
  expect((screen.getByRole('radio', {name: 'Ethereum'}) as HTMLInputElement).checked).toBe(true);
  fireEvent.click(screen.getByRole('button', {name: 'Copy address: 0x1234'}));
  await waitFor(() => expect(props.onCopy).toHaveBeenCalledWith('ethereum', props.ethereumAddress));
  fireEvent.click(screen.getByRole('radio', {name: 'Solana'}));
  fireEvent.click(screen.getByRole('button', {name: 'Copy address: SolanaExample'}));
  await waitFor(() => expect(props.onCopy).toHaveBeenLastCalledWith('solana', props.solanaAddress));
  for (const network of ['solana', 'ethereum'] as const) {
    rerender(<ReceiveBlock {...props} mode={network}/>);
    expect(screen.getAllByRole('img')).toHaveLength(1);
    expect(screen.queryByRole('radio')).toBeNull();
    const address = props[`${network}Address`];
    const button = screen.getByRole('button', {name: `Copy address: ${address}`});
    fireEvent.click(button);
    await waitFor(() => expect(props.onCopy).toHaveBeenLastCalledWith(network, address));
  }
});
