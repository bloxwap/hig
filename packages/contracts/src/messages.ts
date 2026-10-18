/**
 * Built-in copy rendered by HIG React and React Native components (visible text and accessible names).
 * English (`en-US`) defaults only: HIG ships no translations. Hosts pass their own catalog through
 * `HIGProvider messages`; components with a `closeLabel`/`cancelLabel`/`dismissLabel`/`busyLabel` prop take a
 * per-instance override. Keys and wording are documented in docs/foundations/localization.md.
 *
 * Each English default is also a named export so a component bundles only the copy it renders
 * (`import * as en from '@bloxwap/hig-contracts/messages'; messages.close ?? en.close`).
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
 /** Visible and announced Button busy suffix (` · Working`). An empty string hides the suffix; busy state is still exposed. */
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
 /** Native Slider accessibility action to increase its value. */
 increment: string;
 /** Native Slider accessibility action to decrease its value. */
 decrement: string;
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
 /** ActivityList empty text. */
 noActivity: string;
 /** StatusIndicator `online` state. */
 statusOnline: string;
 /** StatusIndicator `offline` state. */
 statusOffline: string;
 /** StatusIndicator `stale` state. */
 statusStale: string;
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
export const increment = 'Increase';
export const decrement = 'Decrease';
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
export const noActivity = 'No activity yet';
export const statusOnline = 'online';
export const statusOffline = 'offline';
export const statusStale = 'stale';
/** The complete English catalog. */
export const defaultMessages: Readonly<HIGMessages> = {close, cancel, dismiss, dismissNotice, busy, notifications, loading, loadingContent, loadingItems, loadingChart, noItems, noRows, retry, loadMore, stale, required, breadcrumb, pagination, previous, next, pageOf, search, searching, noResults, resultCount, increment, decrement, back, menuDescription, choose, chooseOne, inProgress, progressValue, copied, copyFailed, copyInstallCommand, reviewAssetOrder, amountInAsset, availableAmount, reviewOrder, confirmOrder, confirmOrderDescription, orderUnavailable, noActivity, statusOnline, statusOffline, statusStale};
/** Every message key, in documentation order. */
export const messageKeys = /* @__PURE__ */ Object.keys(defaultMessages) as readonly (keyof HIGMessages)[];
/**
 * Overlays host overrides on a base catalog (both may be partial). `undefined` entries keep the base copy, and a
 * value of the wrong kind (a string for a formatter key, or the reverse) is ignored, so a partial or untyped catalog
 * never blanks a label or throws while rendering.
 */
export function resolveMessages<T extends Partial<HIGMessages>>(base: T, overrides?: Partial<HIGMessages>): T {
 if (!overrides) return base;
 const formatters = ['dismissNotice', 'pageOf', 'resultCount', 'progressValue', 'reviewAssetOrder', 'amountInAsset', 'availableAmount', 'confirmOrderDescription'];
 const resolved: Record<string, unknown> = {...base};
 for (const [key, value] of Object.entries(overrides)) {
  if (value !== undefined && typeof value === (formatters.includes(key) ? 'function' : 'string')) resolved[key] = value;
 }
 return resolved as T;
}
