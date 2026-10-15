/**
 * Every string HIG renders on its own: visible text and accessible names (#62).
 * English defaults; hosts pass translated `messages` to HIGProvider, and some components take per-instance overrides
 * such as `closeLabel` and `busyLabel`. Functions receive host values so translations can reorder them.
 * Trading vocabulary follows docs/foundations/glossary.json; these keys are interface chrome only.
 */
export interface HIGMessages {
 /** Closes a dialog, sheet or popover. */
 close: string;
 /** Leaves an alert dialog without confirming. */
 cancel: string;
 /** Visible label of a notification's dismiss button. */
 dismiss: string;
 /** Accessible name of a notification's dismiss button; `dismiss` is the visible label in use. */
 dismissNotice: (message: string, dismiss: string) => string;
 /** Appended to a busy button after ` · `. An empty string shows no suffix; busy state is still exposed. */
 busy: string;
 /** Field label for a required field. */
 required: (label: string) => string;
 /** A label paired with its value, e.g. readouts and status indicators. */
 labelledValue: (label: string, value: string) => string;
 /** A value shown while its source is stale. */
 staleValue: (value: string) => string;
 notifications: string;
 breadcrumb: string;
 pagination: string;
 previous: string;
 next: string;
 pageOf: (page: number, total: number) => string;
 search: string;
 searching: string;
 noResults: string;
 resultCount: (count: number) => string;
 back: string;
 loading: string;
 loadingContent: string;
 loadingItems: string;
 loadingChart: string;
 retry: string;
 loadMore: string;
 noItems: string;
 noRows: string;
 /** Native Menu sheet description. */
 availableActions: string;
 /** Native Select trigger before a choice and its sheet description. */
 choose: string;
 chooseOne: string;
 /** Native Progress accessibility value. */
 inProgress: string;
 progressValue: (value: number, max: number) => string;
 statusState: (state: 'online' | 'offline' | 'stale') => string;
 copyInstallCommand: string;
 copied: string;
 copyFailed: string;
 noActivity: string;
 tradeHeading: (asset: string) => string;
 amountLabel: (asset: string) => string;
 availableBalance: (available: string) => string;
 reviewOrder: string;
 confirmOrderTitle: string;
 confirmOrderDescription: (amount: string, asset: string) => string;
 confirmOrder: string;
 orderUnavailable: string;
}
/** English defaults as separate exports so bundles carry only the strings a component renders. */
export const close: HIGMessages['close'] = 'Close';
export const cancel: HIGMessages['cancel'] = 'Cancel';
export const dismiss: HIGMessages['dismiss'] = 'Dismiss';
export const dismissNotice: HIGMessages['dismissNotice'] = (message, dismiss) => `${dismiss} ${message}`;
export const busy: HIGMessages['busy'] = 'Working';
export const required: HIGMessages['required'] = label => `${label} (required)`;
export const labelledValue: HIGMessages['labelledValue'] = (label, value) => `${label}: ${value}`;
export const staleValue: HIGMessages['staleValue'] = value => `${value} (stale)`;
export const notifications: HIGMessages['notifications'] = 'Notifications';
export const breadcrumb: HIGMessages['breadcrumb'] = 'Breadcrumb';
export const pagination: HIGMessages['pagination'] = 'Pagination';
export const previous: HIGMessages['previous'] = 'Previous';
export const next: HIGMessages['next'] = 'Next';
export const pageOf: HIGMessages['pageOf'] = (page, total) => `Page ${page} of ${total}`;
export const search: HIGMessages['search'] = 'Search';
export const searching: HIGMessages['searching'] = 'Searching…';
export const noResults: HIGMessages['noResults'] = 'No results';
export const resultCount: HIGMessages['resultCount'] = count => `${count} ${count === 1 ? 'result' : 'results'}`;
export const back: HIGMessages['back'] = 'Back';
export const loading: HIGMessages['loading'] = 'Loading';
export const loadingContent: HIGMessages['loadingContent'] = 'Loading content';
export const loadingItems: HIGMessages['loadingItems'] = 'Loading items';
export const loadingChart: HIGMessages['loadingChart'] = 'Loading chart…';
export const retry: HIGMessages['retry'] = 'Retry';
export const loadMore: HIGMessages['loadMore'] = 'Load more';
export const noItems: HIGMessages['noItems'] = 'No items';
export const noRows: HIGMessages['noRows'] = 'No rows';
export const availableActions: HIGMessages['availableActions'] = 'Available actions';
export const choose: HIGMessages['choose'] = 'Choose';
export const chooseOne: HIGMessages['chooseOne'] = 'Choose one option.';
export const inProgress: HIGMessages['inProgress'] = 'In progress';
export const progressValue: HIGMessages['progressValue'] = (value, max) => `${value} of ${max}`;
export const statusState: HIGMessages['statusState'] = state => ({online: 'online', offline: 'offline', stale: 'stale'})[state];
export const copyInstallCommand: HIGMessages['copyInstallCommand'] = 'Copy install command';
export const copied: HIGMessages['copied'] = 'Copied';
export const copyFailed: HIGMessages['copyFailed'] = 'Copy failed. Select the command and copy manually.';
export const noActivity: HIGMessages['noActivity'] = 'No activity yet';
export const tradeHeading: HIGMessages['tradeHeading'] = asset => `Review ${asset} order`;
export const amountLabel: HIGMessages['amountLabel'] = asset => `Amount (${asset})`;
export const availableBalance: HIGMessages['availableBalance'] = available => `Available: ${available}`;
export const reviewOrder: HIGMessages['reviewOrder'] = 'Review order';
export const confirmOrderTitle: HIGMessages['confirmOrderTitle'] = 'Confirm order';
export const confirmOrderDescription: HIGMessages['confirmOrderDescription'] = (amount, asset) => `Amount: ${amount} ${asset}. Verify the host-provided terms before submission.`;
export const confirmOrder: HIGMessages['confirmOrder'] = 'Confirm order';
export const orderUnavailable: HIGMessages['orderUnavailable'] = 'Order unavailable';
export const defaultMessages: HIGMessages = {close, cancel, dismiss, dismissNotice, busy, required, labelledValue, staleValue, notifications, breadcrumb, pagination, previous, next, pageOf, search, searching, noResults, resultCount, back, loading, loadingContent, loadingItems, loadingChart, retry, loadMore, noItems, noRows, availableActions, choose, chooseOne, inProgress, progressValue, statusState, copyInstallCommand, copied, copyFailed, noActivity, tradeHeading, amountLabel, availableBalance, reviewOrder, confirmOrderTitle, confirmOrderDescription, confirmOrder, orderUnavailable};
/** English defaults overlaid with each layer. Later layers win; `undefined` keys fall through so a partial translation keeps English for missing keys. */
export function resolveMessages(...layers: ReadonlyArray<Partial<HIGMessages> | undefined>): HIGMessages {
 const resolved = {...defaultMessages} as Record<string, unknown>;
 for (const layer of layers) if (layer) for (const [key, value] of Object.entries(layer)) if (value !== undefined) resolved[key] = value;
 return resolved as unknown as HIGMessages;
}
