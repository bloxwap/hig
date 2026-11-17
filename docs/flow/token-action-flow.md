# TokenActionFlow

Open the account to see USDC pinned first even with a zero balance, followed by HYPE, Papertrade, Solana, and BLOX. Select a holding to see its actions, or choose Deposit beside the total balance to choose a funding method. USDC offers Deposit, Withdraw, Send, and Receive. Withdraw and Send are disabled while its available balance is zero. Papertrade offers Deposit, Withdraw, Stake, and Unstake. Its demo balance is 20 PT available and 5 PT staked. Bloxwap offers Send, Receive, and Burn. Burn starts at zero and requires an amount within the available BLOX balance before confirmation. Each available action opens a new view inside the same gesture sheet. Amounts and accounts in this example are sample data.

## Moving through the sheet

Deposit opens [DepositBlock](/docs/components/deposit-block/) from Account or USDC. Send crypto and Exchange show the USDC wallet. The other methods preview the handoff to the payment provider.

Papertrade Deposit opens an amount entry from USDC to the Papertrade balance. The sample USDC balance is zero, so confirmation stays disabled.

Send, Withdraw, Stake, and Unstake push [SwapBlock](/docs/components/swap-block/) into the sheet to enter and confirm an amount. Receive shows the recipient wallet’s QR code and copyable address for the selected chain. A network selector appears below the copy hint only when the holding supports receiving on multiple chains. Back or Escape returns from an action to the holding, then from the holding to the account. Dismiss the sheet with the close control or a downward drag. Reopening it starts at the account.

The [AccountBlock](/docs/components/account-block/) opens the selected holding. The [TokenActionBlock](/docs/components/token-action-block/) shows the total holding value and a bar for its liquid and staked shares. Only USDC and HYPE show a Chains breakdown and network selector in this demo. USDC supports Ethereum and Solana. HYPE supports HyperEVM and HyperCore. SOL and BLOX are Solana-only, and Papertrade uses an internal ledger. The host chooses the next view and passes its key to GestureSheetView so the [GestureSheet](/docs/components/gesture-sheet/) can resize as the content changes.
