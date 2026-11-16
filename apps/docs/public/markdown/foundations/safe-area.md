# Safe area

Device insets come from the device at runtime (`useSafeAreaInsets()`, `SafeAreaView`, or `env(safe-area-inset-*)` on the web). The `safeArea` tokens are only the offsets added on top of those insets. They do not include, replace, or approximate the inset values themselves. Do not put raw device inset values in `packages/hig/tokens/source.json`.

The tokens record the offsets the native mobile app uses today. They are not a single standardized gutter. Compose them with the live insets:

```ts
import {nativeMetrics} from '@bloxwap/hig/tokens';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

const insets = useSafeAreaInsets();
const toastTop = insets.top + nativeMetrics.safeArea.toastOffset;
```

```css
padding-top: calc(env(safe-area-inset-top) + var(--hig-safe-area-toastOffset));
```

`toastOffset` is 44 + 16, to match the website's Sonner toaster: the website adds `env(safe-area-inset-top) + 44px` on top of Sonner's 16px `--mobile-offset-top`, so toast cards land at safe-area + 60.

## Trade screens stay full-bleed

Trade screens stay full-bleed. Their chrome adds the insets itself: the top bar, tap controls, toasts, share overlay, and chart axis reserves all compose `insets.*` with a `safeArea` offset. Do not wrap a trade screen in `SafeAreaView`, and do not also pad the chart canvas by the same insets.

```ts
const {safeArea} = nativeMetrics;

// Trade chrome gutters (8).
const paddingTop = insets.top + safeArea.chromeGutter;
const paddingLeft = insets.left + safeArea.chromeGutter;
const paddingRight = insets.right + safeArea.chromeGutter;
const paddingBottom = insets.bottom + safeArea.chromeGutter;

// Chart axis chrome reserved by the trade screen (8 + 48 pill; 80 + 8 tap controls).
const axisTop = insets.top + safeArea.axisChromeTop;
const axisBottom = insets.bottom + safeArea.axisChromeBottom;

// Sheet card content (16), when the sheet does not already apply insets.
const sheetPaddingBottom = insets.bottom + safeArea.sheetContentGutter;
```

## `SafeAreaView` for non-trade screens

Use `SafeAreaView` on non-trade screens such as settings, 404, bootstrap, and fullscreen modals. A trade route-gate may apply left and right safe-area edges only, so a blocked trade view is not full-bleed into the system insets.

`fullscreenMin` (20) comes from the QR scanner's fullscreen modal chrome: `Math.max(insets.top|bottom, 20)` and `insets.left|right + 20`. It is not the settings screen, which uses a Tailwind `px-5` gutter.

## Side gutters

The app currently uses side gutters of 8, 16, and 20 in different places. Document and keep that as-is; do not collapse them to one token.

- `chromeGutter` (8): trade top bar and tap controls (`paddingLeft` / `paddingRight` / `paddingTop` or `paddingBottom` of `insets.* + 8`).
- `sheetContentGutter` (16): sheet card and similar content padding, and the trade share overlay (`insets.* + 16`).
- `fullscreenMin` (20): the QR scanner's fullscreen modal chrome (`Math.max(insets.top|bottom, 20)` and `insets.left|right + 20`). Not the settings screen's Tailwind `px-5` gutter.

## Fixture and store-capture exceptions

Fixture and store-capture exceptions stay in the app. Snapshot and fixture builds may zero chrome insets so layout is stable; store-capture builds keep the device insets. Do not encode those exceptions in HIG tokens.

## Do not pad `GestureSheet` twice

`GestureSheet` already applies safe-area insets to its content padding (`tokens.space.xl` plus the bottom inset). Do not add `sheetContentGutter` or another inset on top of that default padding, or the sheet will be padded twice. Pass an explicit inset only when you intend to replace the default, including `0` for a flush edge.

## Source references

These values come from the private `bloxwap/monorepo` native app. Paths, not public links:

- `apps/mobile/src/components/tap-controls.tsx` — trade chrome gutter of 8; fixture and store-capture inset exceptions.
- `packages/ui-native/src/components/toast.tsx` — `TOAST_TOP_OFFSET = 44 + 16`.
- `apps/mobile/src/profile/lib/sheet-card-padding.ts` — sheet content gutter of 16.
- `apps/mobile/src/components/live-chart.tsx` — `AXIS_CHROME_TOP` 56 and `AXIS_CHROME_BOTTOM` 88; fixture and store-capture exceptions.
- `apps/mobile/app/trade/[asset].tsx` — full-bleed trade screen whose chrome adds insets itself; chrome gutter 8, share overlay gutter 16, toast offset, and the same fixture exceptions.
- `apps/mobile/src/components/qr-scanner.tsx` — fullscreen modal chrome: `Math.max(insets.top|bottom, 20)` and `insets.left|right + 20` (`fullscreenMin`).
