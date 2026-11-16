/**
 * Built-in copy rendered by HIG React and React Native components (visible text and accessible names).
 * English (`en-US`) defaults only: HIG ships no translations. Hosts pass their own catalog through
 * `HIGProvider messages`; components with a `closeLabel`/`cancelLabel`/`dismissLabel`/`busyLabel` prop take a
 * per-instance override. Keys and wording are documented in docs/foundations/localization.md.
 *
 * Each English default is also a named export so a component bundles only the copy it renders
 * (`import * as en from '@bloxwap/hig/contracts/messages'; messages.close ?? en.close`).
 */
export interface HIGMessages {
 /** Button that closes Dialog, Sheet, Popover, native Menu and GestureSheet. UI dismissal, not the glossary “close” of a position. */
 close: string;
 /** Web AlertDialog's explicit decline button. */
 cancel: string;
 /** Visible Toast dismiss button. */
 dismiss: string;
 /** Toast dismiss accessible name. Must contain `dismiss` (the visible label) so voice control still matches. */
 dismissNotice: (message: string, dismiss: string) => string;
 /** Visible and announced Button busy suffix (` · Working`). An empty string hides the suffix; busy state is still exposed. On Android the platform's busy state description replaces the suffix in the accessible name. */
 busy: string;
 /** Web Toast landmark name. */
 notifications: string;
 /** Spinner default label (an ellipsis is appended on web). */
 loading: string;
 /** Skeleton default label. */
 loadingContent: string;
 /** List loading row. */
 loadingItems: string;
 /** Web PriceChart fallback while the chart engine loads. */
 loadingChart: string;
 /** List default empty text. */
 noItems: string;
 /** Web Table empty text. */
 noRows: string;
 /** List retry button. */
 retry: string;
 /** List load-more button. */
 loadMore: string;
 /** Stale marker appended to a NumberReadout reading and its accessible name. */
 stale: string;
 /** Marker appended to a required Field label and its accessible name. */
 required: string;
 /** Web Breadcrumb landmark name. */
 breadcrumb: string;
 /** Web Pagination landmark name. */
 pagination: string;
 /** Pagination previous-page button. */
 previous: string;
 /** Pagination next-page button. */
 next: string;
 /** Pagination position; `page` and `total` arrive already formatted for the provider locale. */
 pageOf: (page: string, total: string) => string;
 /** Search field label. */
 search: string;
 /** Search in-progress status. */
 searching: string;
 /** Search empty status. */
 noResults: string;
 /** Native Search result count status. Use Intl.PluralRules for locales with more plural forms. */
 resultCount: (count: number, locale: string) => string;
 /** Native BackButton. */
 back: string;
 /** Native Menu sheet description. */
 menuDescription: string;
 /** Native Select trigger value before a choice. */
 choose: string;
 /** Native Select sheet description. */
 chooseOne: string;
 /** Native indeterminate Progress value text. */
 inProgress: string;
 /** Native determinate Progress value text; numbers arrive formatted for the provider locale. */
 progressValue: (value: string, max: string) => string;
 /** InstallCommand success status. */
 copied: string;
 /** InstallCommand failure status. */
 copyFailed: string;
 /** InstallCommand copy button. */
 copyInstallCommand: string;
 /** TradeEntry heading. */
 reviewAssetOrder: (asset: string) => string;
 /** TradeEntry amount field label. */
 amountInAsset: (asset: string) => string;
 /** TradeEntry amount field description. */
 availableAmount: (available: string) => string;
 /** TradeEntry review button. */
 reviewOrder: string;
 /** TradeEntry confirmation dialog title and confirm button. */
 confirmOrder: string;
 /** TradeEntry confirmation dialog description. */
 confirmOrderDescription: (amount: string, asset: string) => string;
 /** TradeEntry error alert title (web). */
 orderUnavailable: string;
 /** StatusIndicator `online` state. */
 statusOnline: string;
 /** StatusIndicator `offline` state. */
 statusOffline: string;
 /** StatusIndicator `stale` state. */
 statusStale: string;
 /** Native Slider increment accessibility action label (Android action list; RN 0.83 otherwise exposes an empty label). */
 increase: string;
 /** Native Slider decrement accessibility action label. */
 decrease: string;
 /** Swap panel source side: card placeholder (with an ellipsis) and picker title. */
 swapFrom: string;
 /** Swap panel destination side: card placeholder (with an ellipsis) and picker title. */
 swapTo: string;
 /** Accessible name of a swap card's token slot; receives `swapFrom` or `swapTo`. */
 swapSelectToken: (side: string) => string;
 /** Accessible name of a swap card's amount; receives `swapFrom` or `swapTo`. */
 swapAmount: (side: string) => string;
 /** Accessible name of the conversion capsule that switches an amount between dollars and token units. */
 swapSwitchDenomination: string;
 /** Accessible name of the button that exchanges the two tokens. */
 swapFlip: string;
 /** Swap panel action when both sides are the same asset. */
 swapActionSend: string;
 /** Swap panel action for different assets on one chain. */
 swapActionSwap: string;
 /** Swap panel action for different assets across chains. */
 swapActionBridge: string;
 /** Swap panel action text while a side has no token. */
 swapChooseToken: string;
 /** Swap panel action text while its destination is still to be chosen. */
 swapChooseDestination: string;
 /** Swap panel action text while the amount is zero. */
 swapEnterAmount: string;
 /** Swap panel action text when the amount exceeds the known balance. */
 swapInsufficient: (symbol: string) => string;
 /** Swap panel action text in the receive view. */
 swapSendFromWallet: string;
 /** Accessible name of the swap panel reset button. */
 swapReset: string;
 /** Swap panel settings button and sheet title. */
 swapSettings: string;
 /** Capsule that enters the whole balance. */
 swapMax: string;
 /** Capsule that enters a small trial amount. */
 swapTest: string;
 /** Slippage capsule on the destination card; receives a percent such as `0.5%`. */
 swapSlippage: (percent: string) => string;
 /** Slippage setting row, view title and preset group. */
 swapSlippageTitle: string;
 /** Label of the custom slippage field. */
 swapSlippageCustom: string;
 /** Fee line on the destination card; receives a formatted amount, an ellipsis while loading, or a dash. */
 swapFee: (amount: string) => string;
 /** Fee breakdown setting row and view title. */
 swapFees: string;
 /** Total row of the fee breakdown. */
 swapFeeTotal: string;
 /** Label of the default amount denomination setting. */
 swapDenomination: string;
 /** Dollar denomination option. */
 swapDollars: string;
 /** Token unit denomination option. */
 swapUnits: string;
 /** Token picker search placeholder and accessible name. */
 swapSearchTokens: string;
 /** Accessible name of the token picker chain filter. */
 swapChains: string;
 /** Chain filter option that clears the filter. */
 swapAllChains: string;
 /** Token picker section of host-ranked tokens. */
 swapHot: string;
 /** Token picker section after the hot tokens. */
 swapAllTokens: string;
 /** Token picker empty state. */
 swapNoTokens: string;
 /** Marks the token picker row that is already selected. */
 swapSelected: string;
 /** Token picker button that asks the host to connect a wallet. */
 swapConnectWallet: string;
 /** Accessible name of the token picker disconnect button. */
 swapDisconnect: string;
 /** Switch in the From picker that asks for a deposit address in place of a connected wallet. */
 swapGenerateAddress: string;
 /** Recipient address field placeholder and accessible name. */
 swapRecipient: string;
 /** Accessible name of the recipient QR scan button. */
 swapScan: string;
 /** Accessible name of a wallet address that copies on press (WalletAddress, the SwapPanelBlock receive view); the address follows it. */
 copyAddress: string;
 /** Notice after a wallet address is copied. */
 addressCopied: string;
 /** Visible hint under a wallet address that copies on press. */
 tapToCopy: string;
 /** Accessible name of a wallet address QR code. */
 qrCode: string;
 /** Control key legend in the swap panel's shortcut hint on non-Apple keyboards (`Ctrl K`). Apple keyboards show ⌘. */
 swapControlKey: string;
 /** Accessible name of the swap panel keypad. */
 swapKeypad: string;
 /** Accessible name of the keypad delete key. */
 swapDelete: string;
 /** AccountBlock: the default heading. */
 account: string;
 /** AccountBlock: the default label of the deposit action. */
 deposit: string;
 /** AccountBlock: accessible label of the total balance. */
 accountBalance: string;
 /** LanguageBlock: the default heading. */
 language: string;
 /** LanguageBlock: search placeholder and accessible name. */
 searchLanguages: string;
 /** AccountBlock: accessible name of the header button that shows the account address. */
 showAddress: string;
 /** ProfileBlock: accessible name of the control that edits the profile name. */
 editName: string;
 /** ProfileBlock: accessible name of the avatar button when the host gives neither `avatarLabel` nor `name`. */
 changeProfilePicture: string;
 /** TokenActionBlock: built-in label of the `receive` action. */
 receive: string;
 /** TokenActionBlock: built-in label of the `stake` action. */
 stake: string;
 /** TokenActionBlock: built-in label of the `unstake` action. */
 unstake: string;
 /** SearchInput: accessible name of the clear button when the host gives no `clearLabel`. */
 clearSearch: string;
 /** AssetsBlock: the default heading. */
 assets: string;
 /** AssetsBlock: search placeholder (with a trailing ellipsis) and accessible name. */
 searchMarkets: string;
 /** AssetsBlock: accessible name of the category filter. */
 marketCategories: string;
 /** AssetsBlock: accessible name of the All / Positions / Trend control. */
 assetsView: string;
 /** AssetsBlock: the unfiltered category capsule and view. */
 assetsAll: string;
 /** AssetsBlock: the view of markets with an open position. */
 assetsPositions: string;
 /** AssetsBlock: the view of markets with a signal. */
 assetsTrend: string;
 /** AssetsBlock: a row's watch signal, read after the market. */
 signalWatch: string;
 /** AssetsBlock: a row's upward signal, read after the market. */
 signalUp: string;
 /** AssetsBlock: a row's downward signal, read after the market. */
 signalDown: string;
 /** AssetsBlock: empty Positions view. */
 noPositions: string;
 /** AssetsBlock: empty Trend view. */
 noTrend: string;
 /** AssetsBlock: before the countdown to when a closed legacy market opens, as in “Opens in 2:14:33”. */
 opensIn: string;
}
// Canonical English copy, one export per key. Hosts translate these; they do not edit them.
export const close = 'Close';
export const cancel = 'Cancel';
export const dismiss = 'Dismiss';
export const dismissNotice = (message: string, dismiss: string) => `${dismiss} ${message}`;
export const busy = 'Working';
export const notifications = 'Notifications';
export const loading = 'Loading';
export const loadingContent = 'Loading content';
export const loadingItems = 'Loading items';
export const loadingChart = 'Loading chart…';
export const noItems = 'No items';
export const noRows = 'No rows';
export const retry = 'Retry';
export const loadMore = 'Load more';
export const stale = '(stale)';
export const required = '(required)';
export const breadcrumb = 'Breadcrumb';
export const pagination = 'Pagination';
export const previous = 'Previous';
export const next = 'Next';
export const pageOf = (page: string, total: string) => `Page ${page} of ${total}`;
export const search = 'Search';
export const searching = 'Searching…';
export const noResults = 'No results';
export const resultCount = (count: number, locale: string) => `${new Intl.NumberFormat(locale).format(count)} ${count === 1 ? 'result' : 'results'}`;
export const back = 'Back';
export const menuDescription = 'Available actions';
export const choose = 'Choose';
export const chooseOne = 'Choose one option.';
export const inProgress = 'In progress';
export const progressValue = (value: string, max: string) => `${value} of ${max}`;
export const copied = 'Copied';
export const copyFailed = 'Copy failed. Select the command and copy manually.';
export const copyInstallCommand = 'Copy install command';
export const reviewAssetOrder = (asset: string) => `Review ${asset} order`;
export const amountInAsset = (asset: string) => `Amount (${asset})`;
export const availableAmount = (available: string) => `Available: ${available}`;
export const reviewOrder = 'Review order';
export const confirmOrder = 'Confirm order';
export const confirmOrderDescription = (amount: string, asset: string) => `Amount: ${amount} ${asset}. Verify the host-provided terms before submission.`;
export const orderUnavailable = 'Order unavailable';
export const statusOnline = 'online';
export const statusOffline = 'offline';
export const statusStale = 'stale';
export const increase = 'Increase';
export const decrease = 'Decrease';
export const swapFrom = 'From';
export const swapTo = 'To';
export const swapSelectToken = (side: string) => `Select ${side} token`;
export const swapAmount = (side: string) => `${side} amount`;
export const swapSwitchDenomination = 'Switch between dollars and token units';
export const swapFlip = 'Swap direction';
export const swapActionSend = 'Send';
export const swapActionSwap = 'Swap';
export const swapActionBridge = 'Bridge';
export const swapChooseToken = 'Select a token';
export const swapChooseDestination = 'Pick a destination';
export const swapEnterAmount = 'Enter an amount';
export const swapInsufficient = (symbol: string) => `Insufficient ${symbol}`;
export const swapSendFromWallet = 'Send from your wallet';
export const swapReset = 'Reset';
export const swapSettings = 'Settings';
export const swapMax = 'Max';
export const swapTest = 'Test';
export const swapSlippage = (percent: string) => `Slippage ${percent}`;
export const swapSlippageTitle = 'Slippage';
export const swapSlippageCustom = 'Custom slippage (%)';
export const swapFee = (amount: string) => `Fee ${amount}`;
export const swapFees = 'Fees';
export const swapFeeTotal = 'Total';
export const swapDenomination = 'Show amounts in';
export const swapDollars = 'Dollars';
export const swapUnits = 'Units';
export const swapSearchTokens = 'Search name or paste address';
export const swapChains = 'Chains';
export const swapAllChains = 'All';
export const swapHot = 'Hot';
export const swapAllTokens = 'All tokens';
export const swapNoTokens = 'No tokens found';
export const swapSelected = 'Selected';
export const swapConnectWallet = 'Connect wallet';
export const swapDisconnect = 'Disconnect wallet';
export const swapGenerateAddress = 'Generate address';
export const swapRecipient = 'Recipient address';
export const swapScan = 'Scan QR code';
export const copyAddress = 'Copy address';
export const addressCopied = 'Address copied';
export const tapToCopy = 'Tap to copy';
export const qrCode = 'QR code';
export const swapControlKey = 'Ctrl';
export const swapKeypad = 'Keypad';
export const swapDelete = 'Delete';
export const account = 'Account';
export const deposit = 'Deposit';
export const accountBalance = 'Total balance';
export const showAddress = 'Show account address';
export const editName = 'Edit name';
export const changeProfilePicture = 'Change profile picture';
export const language = 'Language';
export const searchLanguages = 'Search languages';
export const receive = 'Receive';
export const stake = 'Stake';
export const unstake = 'Unstake';
export const clearSearch = 'Clear search';
export const assets = 'Assets';
export const searchMarkets = 'Search markets';
export const marketCategories = 'Market categories';
export const assetsView = 'View';
export const assetsAll = 'All';
export const assetsPositions = 'Positions';
export const assetsTrend = 'Trend';
export const signalWatch = 'Watch';
export const signalUp = 'Rising';
export const signalDown = 'Falling';
export const noPositions = 'No open positions';
export const noTrend = 'No trending markets';
export const opensIn = 'Opens in';
/** The complete English catalog. */
export const defaultMessages: Readonly<HIGMessages> = {close, cancel, dismiss, dismissNotice, busy, notifications, loading, loadingContent, loadingItems, loadingChart, noItems, noRows, retry, loadMore, stale, required, breadcrumb, pagination, previous, next, pageOf, search, searching, noResults, resultCount, back, menuDescription, choose, chooseOne, inProgress, progressValue, copied, copyFailed, copyInstallCommand, reviewAssetOrder, amountInAsset, availableAmount, reviewOrder, confirmOrder, confirmOrderDescription, orderUnavailable, statusOnline, statusOffline, statusStale, increase, decrease, swapFrom, swapTo, swapSelectToken, swapAmount, swapSwitchDenomination, swapFlip, swapActionSend, swapActionSwap, swapActionBridge, swapChooseToken, swapChooseDestination, swapEnterAmount, swapInsufficient, swapSendFromWallet, swapReset, swapSettings, swapMax, swapTest, swapSlippage, swapSlippageTitle, swapSlippageCustom, swapFee, swapFees, swapFeeTotal, swapDenomination, swapDollars, swapUnits, swapSearchTokens, swapChains, swapAllChains, swapHot, swapAllTokens, swapNoTokens, swapSelected, swapConnectWallet, swapDisconnect, swapGenerateAddress, swapRecipient, swapScan, copyAddress, addressCopied, tapToCopy, qrCode, swapControlKey, swapKeypad, swapDelete, account, deposit, accountBalance, showAddress, editName, changeProfilePicture, language, searchLanguages, receive, stake, unstake, clearSearch, assets, searchMarkets, marketCategories, assetsView, assetsAll, assetsPositions, assetsTrend, signalWatch, signalUp, signalDown, noPositions, noTrend, opensIn};
/** Every message key, in documentation order. */
export const messageKeys = /* @__PURE__ */ Object.keys(defaultMessages) as readonly (keyof HIGMessages)[];
/**
 * Overlays host overrides on a base catalog (both may be partial). `undefined` entries keep the base copy, and a
 * value of the wrong kind (a string for a formatter key, or the reverse) is ignored, so a partial or untyped catalog
 * never blanks a label or throws while rendering.
 */
export function resolveMessages<T extends Partial<HIGMessages>>(base: T, overrides?: Partial<HIGMessages>): T {
 if (!overrides) return base;
 const formatters = ['dismissNotice', 'pageOf', 'resultCount', 'progressValue', 'reviewAssetOrder', 'amountInAsset', 'availableAmount', 'confirmOrderDescription', 'swapSelectToken', 'swapAmount', 'swapInsufficient', 'swapSlippage', 'swapFee'];
 const resolved: Record<string, unknown> = {...base};
 for (const [key, value] of Object.entries(overrides)) {
  if (value !== undefined && typeof value === (formatters.includes(key) ? 'function' : 'string')) resolved[key] = value;
 }
 return resolved as T;
}
