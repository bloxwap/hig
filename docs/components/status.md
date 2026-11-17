# Status & feedback

Visible progress, notifications, and recoverable states that keep people informed.

Includes `Badge`, `Alert`, `Callout`, `Toast`, `Toaster` with `toast()`, `Progress`, `Spinner`, `Skeleton`, `EmptyState`, `Avatar`, and `StatusIndicator`.

Issue #18. Entry: `status`. Import platform entries from `@bloxwap/hig/react/status` or `@bloxwap/hig/native/status` according to applicability below. Import `@bloxwap/hig/react/css` once on web; tokens CSS is a separate explicit import.

## API and anatomy

| Component | Key props and behavior |
| --- | --- |
| `Badge` | Quiet label; web adds explicit `tone` (`neutral`, `positive`, `negative`, `warning`, or `info`), standard span props and a forwarded span ref. The neutral default retains its appearance. Tone uses provider token roles and never infers meaning from text or a number's sign. Badge adds no live region; the host owns announcements. |
| `Alert` | `title`, `severity`, and an optional recovery `action`. Severity tints the fill and colours the title from a token role on web and native, with no stroke or glow: the surface mixed with 10% of the tone, at the Surface radius. `default` → neutral (6% of `text`, title in `text`), info → `info`, success → `positive`, warning → `warning`, error → `negative`. On native, `tone` swaps in another token role for an approved product accent, never a raw colour. `announce` (default `true`) speaks the alert when it appears or its words change: web gives it `role='status'` (`'alert'` for `error`), Android a live region, and iOS an explicit announcement. Pass `announce={false}` for an alert that is part of the screen from the start, such as a standing warning. On native a string or number child is drawn in a HIG `Text`, so a plain sentence needs no wrapper. |
| `Callout` | Same API as `Alert`, for static guidance. It adds the documentation severities `note` (`info` role) and `tip` (`positive` role), so SDK docs do not need their own callout colours. Pass `announce={false}` for callouts present at page load. `title` accepts a ReactNode, such as text with a `<code>` span; on web it renders inside `<strong>` and should stay inline. On native it renders inside the `Heading`, so pass a string or inline `Text`; its visible text is announced. |
| `Toast` | `notices` with stable `id`, `message`, `severity`, and optional `action`; `onDismiss` handles dismissal. Each notice is one capsule row with no stroke: a severity symbol on the leading edge, the message, the optional action, and a close symbol on the trailing edge. Native notices also accept `description` and `closable` (default true when `onDismiss` is supplied). Native `maxHeight` bounds a scrolling viewport; it defaults to 60% of the window height and accepts dp or a parent percentage. `dismissLabel` overrides the Dismiss wording inside the close button's accessible name; the button draws a symbol, not text. The capsule itself is `ToastNotice` on both platforms. For transient notices use `Toaster` and `toast()`, below. |
| `Toaster`, `toast()` | The transient host, from `@bloxwap/hig/react/toast` and `@bloxwap/hig/native/toast`: mount `Toaster` once, then call `toast(message, options)` from anywhere. Same names, options and stack on both platforms; see [Transient toasts](#transient-toasts-toaster-and-toast). |
| `Progress` | `label`, `value`, and `max`. Native draws the label with a ` value/max` suffix (`…` while indeterminate); `hideValue` leaves the suffix out for a host that shows the figure itself, and the value is still read. |
| `EmptyState` | `title`, optional `description`, optional `action`, and decorative `illustration`. A centred stack: symbol, title, description, action. `illustration` replaces the default symbol; `null` omits it. |

Native `EmptyState` keeps the default `Surface`, `Heading` and body-text anatomy, centred. Its `description` is optional; omitted or empty text leaves no blank description node. Decorative `illustration` content replaces the default symbol above the heading (`null` omits it); HIG hides the whole illustration subtree from VoiceOver/TalkBack navigation while keeping the heading and action accessible. The host controls the illustration's dimensions and spacing. Root `ViewProps`, including `style`, `testID` and layout events, pass to the Surface. `titleStyle` and `descriptionStyle` reach the actual text nodes; `maxFontSizeMultiplier` caps both, or inherits the provider policy when omitted. Text keeps the provider palette and heading semantics unless the host explicitly styles it.

```tsx
<EmptyState
  title={t('noMarkets')}
  illustration={<BrandMark width={64} height={64} />}
  style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', padding: 0, gap: 12 }}
  titleStyle={{ fontSize: 20, lineHeight: 28, textAlign: 'center' }}
  maxFontSizeMultiplier={2}
  action={<Button onPress={clearFilters}>{t('browseAll')}</Button>}
/>
```

The mark and clear-filter action remain host-owned. `tests/native/empty-state.test.cjs` verifies default anatomy, omitted descriptions, decorative accessibility metadata, real text/root props and accepted action delivery; these wiring checks are not physical-device accessibility certification.

## Transient toasts: `Toaster` and `toast()`

One API raises a notice that leaves by itself, on web and on native. Mount `Toaster` once; call `toast()` from anywhere, in or out of a component. Both draw the `ToastNotice` capsule and stack it the way [Sonner](https://sonner.emilkowal.ski/) does: the newest in front, three visible, the older ones collapsed behind it.

```tsx
// Web: Sonner is the engine (optional peer `sonner ^2.0.0`).
import {Toaster, toast, dismissToast} from '@bloxwap/hig/react/toast';

<HIGProvider>
  <App/>
  <Toaster position="top-center"/>
</HIGProvider>
```

```tsx
// Native: HIG's own host on Reanimated and Gesture Handler. Mount it last, so it draws over the screens.
import {Toaster, toast, dismissToast} from '@bloxwap/hig/native/toast';

<GestureHandlerRootView style={{flex: 1}}>
  <SafeAreaProvider>
    <HIGProvider>
      <App/>
      <Toaster position="top-center"/>
    </HIGProvider>
  </SafeAreaProvider>
</GestureHandlerRootView>
```

```tsx
// Either platform.
toast('Address copied');
toast.success('Withdrawal sent', {description: 'It arrives in about a minute.'});
toast.error('Transfer failed', {
  id: 'transfer',                 // raising 'transfer' again replaces this notice where it stands
  duration: Infinity,             // stays until dismissed
  action: <Button intent="ghost" onPress={retry}>Retry</Button>, // onClick on web
  onDismiss: () => log('closed by the person or by dismissToast'),
});
dismissToast('transfer');         // or dismissToast() for every notice
```

| `toast(message, options)` | Behavior |
| --- | --- |
| `severity` | `info` (default), `success`, `warning` or `error`. Picks the symbol and its token role. `toast.success`, `toast.error`, `toast.warning` and `toast.info` set it. |
| `description` | A second line under the message, in regular weight. With one the capsule keeps a 22-point corner radius instead of a full pill. |
| `action` | A control drawn before the close control, such as a `Button`. It does not dismiss by itself; call `dismissToast(id)` in its handler. |
| `duration` | Milliseconds before the notice leaves; the Toaster's `duration` (4000) when omitted. `Infinity` keeps it. Only a positive number is a time: zero, a negative number or `NaN` takes the default, and a time longer than a timer can count (2^31 − 1 ms, about 24 days) keeps the notice instead of ending it at once. |
| `id` | Raising a notice with the id of one that is showing replaces it in place and starts its time over. `toast()` returns the id. An empty string is not an id: the notice gets the next number. |
| `dismissName` | Accessible name of the close control. Defaults to the provider's `dismissNotice` wording around the message, so it is translated. |
| `onDismiss`, `onAutoClose` | Called once: `onDismiss` when the close control, a swipe or `dismissToast` ends the notice, `onAutoClose` when its time runs out. |

| `Toaster` prop | Behavior |
| --- | --- |
| `position` | `top-left`, `top-center`, `top-right`, `bottom-left`, `bottom-center` (default) or `bottom-right`. Notices enter from that edge and leave towards it. `left` and `right` are the physical sides on both platforms, as in Sonner: under right-to-left the capsule's content mirrors and the stack stays where it is. To mirror the stack, choose the position by direction. |
| `expand` | Lists the visible notices one after another instead of collapsing them behind the front. Default `false`. |
| `visibleToasts`, `gap`, `duration` | 3 notices, 14 points, 4000ms. At least one notice is always shown. |
| `offset` | Distance from the screen edges, added to the safe-area inset: one number for every edge, or `{top, right, bottom, left}` with the other edges keeping the default (24 points; 16 under a 600-point window). `left` and `right` are physical, like `position`. `offset` places the stack at every window width on both platforms; on web, Sonner's `mobileOffset` replaces it under 600px when it is given. The app's top placement is `offset={{top: nativeMetrics.safeArea.toastOffset}}`; see [safe area](../foundations/safe-area.md). |
| `swipeDirections` | `top`, `right`, `bottom`, `left`. Default: towards the edges the stack sits against, so `bottom-center` swipes down and `top-right` up or right. |

The web `Toaster` also takes every other Sonner prop. The native one takes the props above and `testID`.

### How the native host moves

- **Nothing is laid out per frame.** A notice is rendered when it is raised, replaced or dismissed, and never while it moves. Entering, leaving, restacking and the swipe change only `transform` and `opacity`, in Reanimated worklets on the UI thread. Each notice reads its place from one shared stack, so an arrival, a departure or a notice that changed height moves every notice in the same frame. With no notice showing the host renders nothing and runs no timer.
- **Stack.** 400ms on the CSS `ease` curve, Sonner's values. A new notice joins the stack once it has been measured, then slides in from its own height while the others make room. Behind the front of a collapsed stack each notice is 5% smaller, one gap further out and drawn at the front's height with its content hidden, so only its edge shows. One notice past the visible ones stays mounted and transparent, so the notice that is pushed out fades where it is.
- **Leaving.** 200ms on `ease-out`: the front goes back out by its own height while it fades, and the others close the gap in the same frame.
- **Swipe.** The notice follows the finger 1:1 towards an allowed edge and resists the other way, never passing 20 points. A release 45 points out, or faster than 500 points per second that way, dismisses: the notice goes on by its own size and fades, in 200ms or less so it leaves at the finger's speed. Anything else, and any swipe the system takes away before the finger lifts, returns on a critically damped spring that carries the release velocity. The swipe is recognised after 8 points, so a press on the action or the close control stays a press.
- **Time.** A finger on any notice holds every notice's time at once, and after 200ms expands the stack until it lifts, so a tap or a quick swipe does not stir the stack. The time also stops while the app is not in front. A notice behind the visible ones does not count down until it is shown. Only a notice that can be touched holds the time, so one that is pushed out of reach under the finger lets it run again.
- **Reduced motion.** Nothing slides or scales: notices take their place at once and fade over 150ms, and a swipe out fades where it was released. The provider's `reducedMotion` decides, which follows the OS setting by default.
- **Limits.** The store keeps 16 notices; past that the oldest timed ones are dropped, without `onDismiss` or `onAutoClose`. The last `Toaster` mounted draws. The host is an ordinary view, so a React Native `Modal` (the native `Dialog`, `Sheet`, `Menu` and `Select`) draws above it; a bottom stack does not move for the keyboard.

### Where the platforms differ

| | Web (Sonner) | Native |
| --- | --- | --- |
| Expanding a collapsed stack | Pointer over the stack, or a tap | A finger resting on a notice for 200ms; always expanded while a screen reader runs |
| Time of a notice behind the visible ones | Runs | Waits until it is shown |
| Fast swipe | Distance over the time since the pointer went down, above 0.11px/ms | Release velocity above 500 points/s, so a hold before the flick still dismisses |
| Reduced motion | Cuts to the end state | Fades over 150ms |
| Announcement | Sonner's polite live region for every severity | One announcement per burst: an error if there is one, otherwise the newest notice, the one in front. On iOS an error interrupts and anything else queues. Android's announcement cannot interrupt |
| `offset` as a string | CSS, passed to Sonner | Not accepted |
| Store limit | None | 16 notices |
| `toast.loading`, `toast.promise` | Not wrapped; raise a persistent notice and replace it by `id` | Same |

Severity colours come from the provider on both platforms: `--hig-info`, `--hig-positive`, `--hig-warning` and `--hig-negative` on web, which are Display P3 where the browser supports it, and the `useColors()` roles on native, which are the Display P3 table on an iOS host with `colorSpace="display-p3"`.

The host emits no sound or haptic. Play the outcome's feedback where the notice is raised.

## When to use and examples

Do: keep critical failure inline with Retry; use toast for copied acknowledgement; give a toast that carries an action `duration: Infinity`, so it is still there when a screen reader or a slow reader gets to it. Don’t: dismiss critical text on a timer or rely on audio for success.

## States, interaction and accessibility

Notifications deduplicate ids and preserve every message until explicit dismissal, including bursts larger than three. Host delivery queues may limit arrivals, but the renderer never silently removes an undismissed message. A single coalesced announcement reports each changed burst, prioritizing errors; unchanged rerenders do not repeat it. DOM and Expo web use one live region while every notification remains visible. Native Android uses explicit announcement delivery, and inline Android status uses live-region metadata; iOS announces changed inline content explicitly. Actual VoiceOver/TalkBack timing remains unobserved. Skeleton and spinner are static under candidate motion policy.

State review: rest; keyboard focus/hover (DOM); accepted press and release/cancel; selected/checked where applicable; disabled; busy; inline error/recovery; empty/loading; long translations/large text; reduced motion; sound and haptics disabled. No host action occurs on mere focus. Disabled/busy targets suppress accepted activation. Core has no required feedback backend; the optional provider callback follows the action, honors cancellation and isolates errors.

## Platform mapping and limits

`Toast` is an inline notification stack, no mandatory portal/timer backend. Host owns delivery ordering/persistence. `Toaster` is the transient host: Sonner on web and HIG's own on native, which needs `react-native-reanimated`, `react-native-gesture-handler` and `react-native-safe-area-context`. The native host's arithmetic, lifecycle and gesture wiring are tested, but it has not run on a device. On native, messages use body-size semibold text and descriptions use a separate body-size line; neither truncates or disables text scaling. The stack scrolls within `maxHeight`, including nested host scroll views. A notice with `closable={false}` has no Dismiss action; host recovery actions remain available. Without `onDismiss`, notices have no Dismiss buttons. No notice expires automatically: remove it from the controlled `notices` array when its host lifetime ends; keep failures with recovery actions until explicitly resolved. VoiceOver/TalkBack observations are pending, automated role/state tests are not device evidence.

```tsx
// Native: compact notices with large-text scrolling and a persistent failure.
<Toast
  maxHeight={320}
  notices={[
    { id: 'saved', message: 'Saved', description: 'Your changes are ready.', severity: 'success' },
    { id: 'retry', message: 'Transfer failed', description: 'Check your balance and retry.', severity: 'error', closable: false },
  ]}
  onDismiss={removeNotice}
/>
```

## Validation and citation

See `tests/components.dom.test.tsx`, `tests/native/components.test.cjs`, consumer fixtures and milestone evidence. Transient toasts: `tests/toast-model.test.ts` (the shared arithmetic and the Sonner figures it mirrors), `tests/toast.dom.test.tsx` and `tests/native/toaster.test.cjs`. Physical hardware, assistive-technology and baseline product comparisons are unperformed unless linked explicitly. Cite HIG 0.1.0 with this chapter anchor and a commit permalink, not a mutable preview branch. Preserve business behavior behind a host rollback flag during adoption.
