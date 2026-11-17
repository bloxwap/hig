# Status & feedback

Visible progress, notifications, and recoverable states that keep people informed.

Includes `Badge`, `Alert`, `Callout`, `Toast`, `Progress`, `Spinner`, `Skeleton`, `EmptyState`, `Avatar`, `StatusIndicator`, and `Confetti`.

Issue #18. Entry: `status`. Import platform entries from `@bloxwap/hig/react/status` or `@bloxwap/hig/native/status` according to applicability below. Import `@bloxwap/hig/react/css` once on web; tokens CSS is a separate explicit import. `Confetti` has its own entries, `@bloxwap/hig/react/confetti` and `@bloxwap/hig/native/confetti`; see [Confetti](#confetti).

## API and anatomy

| Component | Key props and behavior |
| --- | --- |
| `Badge` | Quiet label; web adds explicit `tone` (`neutral`, `positive`, `negative`, `warning`, or `info`), standard span props and a forwarded span ref. The neutral default retains its appearance. Tone uses provider token roles and never infers meaning from text or a number's sign. Badge adds no live region; the host owns announcements. |
| `Alert` | `title`, `severity`, and an optional recovery `action`. Severity tints the fill and colours the title from a token role on web and native, with no stroke or glow: the surface mixed with 10% of the tone, at the Surface radius. `default` → neutral (6% of `text`, title in `text`), info → `info`, success → `positive`, warning → `warning`, error → `negative`. On native, `tone` swaps in another token role for an approved product accent, never a raw colour. `announce` (default `true`) speaks the alert when it appears or its words change: web gives it `role='status'` (`'alert'` for `error`), Android a live region, and iOS an explicit announcement. Pass `announce={false}` for an alert that is part of the screen from the start, such as a standing warning. On native a string or number child is drawn in a HIG `Text`, so a plain sentence needs no wrapper. |
| `Callout` | Same API as `Alert`, for static guidance. It adds the documentation severities `note` (`info` role) and `tip` (`positive` role), so SDK docs do not need their own callout colours. Pass `announce={false}` for callouts present at page load. `title` accepts a ReactNode, such as text with a `<code>` span; on web it renders inside `<strong>` and should stay inline. On native it renders inside the `Heading`, so pass a string or inline `Text`; its visible text is announced. |
| `Toast` | `notices` with stable `id`, `message`, `severity`, and optional `action`; `onDismiss` handles dismissal. Each notice is one capsule row with no stroke: a severity symbol on the leading edge, the message, the optional action, and a close symbol on the trailing edge. Native notices also accept `description` and `closable` (default true when `onDismiss` is supplied). Native `maxHeight` bounds a scrolling viewport; it defaults to 60% of the window height and accepts dp or a parent percentage. `dismissLabel` overrides the Dismiss wording inside the close button's accessible name; the button draws a symbol, not text. For transient notices on web, `toast()` and `Toaster` from `@bloxwap/hig/react/toast` raise the same capsule through Sonner. |
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

## Confetti

A burst of confetti for a result worth celebrating, such as a winning close. It is HIG's own on both platforms, with no third-party confetti package, and has its own entries: `@bloxwap/hig/react/confetti` and `@bloxwap/hig/native/confetti`. Both export the same two things: `confetti(options)`, which fires one burst and returns a promise that resolves when it has finished, and `Confetti`, the host mounted once. The options are those of [canvas-confetti](https://www.kirilv.com/canvas-confetti/), so a call written for it maps over.

```tsx
import {Confetti, confetti} from '@bloxwap/hig/react/confetti'; // native: '@bloxwap/hig/native/confetti'

// Once, inside HIGProvider. On native this is the layer the pieces fly in: mount it last in the screen root.
<Confetti />

// From an event handler or an effect.
await confetti({particleCount: 100, spread: 70, origin: {y: 0.7}});

// Or declaratively: fires when `trigger` is truthy, on mount and on each change to another truthy value.
<Confetti trigger={winCount} options={{particleCount: 100, spread: 70, origin: {y: 0.7}}} />
```

| Option | Default | Meaning |
| --- | --- | --- |
| `particleCount` | `50` | How many pieces the burst launches. |
| `angle` | `90` | Launch direction in degrees: 90 is straight up, 0 towards the right edge, 180 towards the left. |
| `spread` | `45` | How far, in degrees, pieces may stray from `angle` in total. |
| `startVelocity` | `45` | Launch speed in pixels per tick. Each piece starts between half and one and a half times this. |
| `decay` | `0.9` | The share of its launch speed a piece keeps each tick. |
| `gravity` | `1` | Pull downwards: 1 falls at full speed, 0 floats, a negative value rises. |
| `drift` | `0` | Sideways push in pixels per tick; positive is towards the right edge. |
| `ticks` | `200` | How long the burst lasts, in ticks of 1/60 s (200 is about 3.3 seconds). Pieces fade out over it. |
| `origin` | `{x: 0.5, y: 0.5}` | Where the burst starts, as a share of the viewport (web) or of the `Confetti` layer (native). |
| `colors` | token roles | Colours dealt to the pieces in turn. See Colour below. |
| `shapes` | `['square', 'circle']` | Shapes picked at random for each piece: `'square'`, `'circle'` or `'star'`. |
| `scalar` | `1` | Scales every piece. |
| `flat` | `false` | Pieces neither tumble nor wobble. |
| `disableForReducedMotion` | `true` | Draws nothing when reduced motion is on. |
| `zIndex` | `100` | Web only: stacking order of the canvas, read from the burst that creates it. |

`Confetti` takes `trigger` and `options` (one burst, or an array fired together); native adds `style` and `testID` for the layer. `confetti.reset()` stops every burst at once and resolves their promises. `mirrorConfetti(options)` returns the same burst seen in a mirror.

Several calls in a row make one celebration. A fireworks call written for canvas-confetti maps over call for call:

```tsx
const base = {origin: {y: 0.7}};
confetti({...base, particleCount: 50, spread: 26, startVelocity: 55});
confetti({...base, particleCount: 40, spread: 60});
confetti({...base, particleCount: 70, spread: 100, decay: 0.91, scalar: 0.8});
confetti({...base, particleCount: 20, spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2});
confetti({...base, particleCount: 20, spread: 120, startVelocity: 45});
```

### Confetti colour

Without `colors`, pieces take the provider's `action`, `info`, `down`, `warning` and `up` roles in turn, so a custom `primaryColor` or `marketColors` shows in the burst. On web these are read from the `--hig-*` variables at the host, which hold `color(display-p3 …)` values where the browser supports them, and the canvas itself is a Display P3 canvas on a screen that can show it; elsewhere both fall back to sRGB. On native they come from `useColors()`: the Display P3 table on an iOS host that paints P3 (`HIGProvider colorSpace='display-p3'`), sRGB otherwise, as for every native component.

A colour passed in `colors` is painted as given. On web that is any CSS colour: a hex colour is sRGB and stays inside sRGB on a P3 screen, so pass `color(display-p3 …)` for a colour outside it. On native it is any React Native colour, read in the host's colour space.

### Confetti motion and performance

The flight is one set of pure functions in `@bloxwap/hig/contracts/confetti`, used by both platforms. It restates canvas-confetti's frame-by-frame update as a function of time, so a piece is where canvas-confetti puts it at every whole tick, and a burst takes the same time on a 60 Hz and a 120 Hz display and after a dropped frame.

- Web: every burst shares one full-viewport canvas and one `requestAnimationFrame` loop. The canvas is created by the first burst, sized for the device pixel ratio, takes no pointer events, and is removed when the last piece has gone. All pieces of one colour in a burst are one path filled once. React renders nothing while a burst flies.
- Native: React renders once when a burst starts and once when it ends. In between one Reanimated clock per burst runs on the UI thread, and each piece, a plain view, reads its transform and opacity from it. Nothing is laid out per frame. A burst of about 100 pieces is the intended size; larger bursts mount one view a piece.

### Confetti accessibility and direction

Confetti is decoration. The canvas (`aria-hidden`) and the native layer are hidden from assistive technology and take no pointer events or touches; show and announce the result itself with the content it belongs to. Under reduced motion (`HIGProvider reducedMotion`, else the system setting) a call draws nothing and resolves at once, unless it passes `disableForReducedMotion: false`. canvas-confetti defaults the other way.

Confetti is physical: `origin.x` 0 is the left edge and a positive `drift` goes right in both text directions, on both platforms. For a cannon that should fire from the leading edge, pass the options through `mirrorConfetti` when the direction is right-to-left. No text is drawn, so large text does not apply.

### Confetti platform differences

- Web needs no host: without a mounted `Confetti`, `confetti()` reads colours from the document root and reduced motion from the system. Native needs one: without it a call resolves and draws nothing.
- The web canvas covers the viewport and sits in the document body. The native layer fills the parent of `Confetti`, and `origin` is a share of that layer.
- Web draws canvas-confetti's shapes exactly: a square is a slanted, fluttering parallelogram. React Native cannot slant a view on Android, so native draws the rectangle with the same centre, area and long and short axes; circles are exact. Native draws a `'star'` as a square.
- A burst left running when its web host unmounts finishes; on native it stops with the layer and its promise resolves.
- The native entry needs the Reanimated and Worklets peers. The web entry needs no peer and no stylesheet.
- Not supported: canvas-confetti's `useWorker`, `confetti.create`, `shapeFromPath` and `shapeFromText`.

`tests/confetti-model.test.ts` checks the flight against canvas-confetti's update with a seeded random source; `tests/confetti.dom.test.tsx` and `tests/native/confetti.test.cjs` check each renderer against stand-ins for the canvas and for Reanimated. How a burst looks in a browser and its frame rate on iOS and Android devices have not been observed.

## When to use and examples

Do: keep critical failure inline with Retry; use toast for copied acknowledgement; keep confetti for a rare, real win and show the result itself in content. Don’t: dismiss critical text on a timer, rely on audio for success, or let confetti be the only sign that something happened.

## States, interaction and accessibility

Notifications deduplicate ids and preserve every message until explicit dismissal, including bursts larger than three. Host delivery queues may limit arrivals, but the renderer never silently removes an undismissed message. A single coalesced announcement reports each changed burst, prioritizing errors; unchanged rerenders do not repeat it. DOM and Expo web use one live region while every notification remains visible. Native Android uses explicit announcement delivery, and inline Android status uses live-region metadata; iOS announces changed inline content explicitly. Actual VoiceOver/TalkBack timing remains unobserved. Skeleton and spinner are static under candidate motion policy.

State review: rest; keyboard focus/hover (DOM); accepted press and release/cancel; selected/checked where applicable; disabled; busy; inline error/recovery; empty/loading; long translations/large text; reduced motion; sound and haptics disabled. No host action occurs on mere focus. Disabled/busy targets suppress accepted activation. Core has no required feedback backend; the optional provider callback follows the action, honors cancellation and isolates errors.

## Platform mapping and limits

Toast is an inline notification stack, no mandatory portal/timer backend. Host owns delivery ordering/persistence. On native, messages use body-size semibold text and descriptions use a separate body-size line; neither truncates or disables text scaling. The stack scrolls within `maxHeight`, including nested host scroll views. A notice with `closable={false}` has no Dismiss action; host recovery actions remain available. Without `onDismiss`, notices have no Dismiss buttons. No notice expires automatically: remove it from the controlled `notices` array when its host lifetime ends; keep failures with recovery actions until explicitly resolved. VoiceOver/TalkBack observations are pending, automated role/state tests are not device evidence.

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

See `tests/components.dom.test.tsx`, `tests/native/components.test.cjs`, consumer fixtures and milestone evidence. Physical hardware, assistive-technology and baseline product comparisons are unperformed unless linked explicitly. Cite HIG 0.1.0 with this chapter anchor and a commit permalink, not a mutable preview branch. Preserve business behavior behind a host rollback flag during adoption.
