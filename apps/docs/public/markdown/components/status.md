# Status & feedback

Visible progress, notifications, and recoverable states that keep people informed.

Includes `Badge`, `Alert`, `Callout`, `Toast`, `Toaster` with `toast()`, `Progress`, `Spinner`, `Skeleton`, `EmptyState`, `Avatar`, `StatusIndicator`, and `Confetti`.

Issue #18. Entry: `status`. Import platform entries from `@bloxwap/hig/react/status` or `@bloxwap/hig/native/status` according to applicability below. Import `@bloxwap/hig/react/css` once on web; tokens CSS is a separate explicit import. `Confetti` has its own entries, `@bloxwap/hig/react/confetti` and `@bloxwap/hig/native/confetti`; see [Confetti](#confetti).

## API and anatomy

| Component | Key props and behavior |
| --- | --- |
| `Badge` | Quiet label; web adds explicit `tone` (`neutral`, `positive`, `negative`, `warning`, or `info`), standard span props and a forwarded span ref. The neutral default retains its appearance. Tone uses provider token roles and never infers meaning from text or a number's sign. Badge adds no live region; the host owns announcements. |
| `Alert` | `title`, `severity`, and an optional recovery `action`. Severity tints the fill and colours the title from a token role on web and native, with no stroke or glow: the surface mixed with 10% of the tone, at the Surface radius. `default` → neutral (6% of `text`, title in `text`), info → `info`, success → `positive`, warning → `warning`, error → `negative`. On native, `tone` swaps in another token role for an approved product accent, never a raw colour. `announce` (default `true`) speaks the alert when it appears or its words change: web gives it `role='status'` (`'alert'` for `error`), Android a live region, and iOS an explicit announcement. Pass `announce={false}` for an alert that is part of the screen from the start, such as a standing warning. On native a string or number child is drawn in a HIG `Text`, so a plain sentence needs no wrapper. |
| `Callout` | Same API as `Alert`, for static guidance. It adds the documentation severities `note` (`info` role) and `tip` (`positive` role), so SDK docs do not need their own callout colours. Pass `announce={false}` for callouts present at page load. `title` accepts a ReactNode, such as text with a `<code>` span; on web it renders inside `<strong>` and should stay inline. On native it renders inside the `Heading`, so pass a string or inline `Text`; its visible text is announced. |
| `Toast` | `notices` with stable `id`, `message`, `severity`, and optional `action`; `onDismiss` handles dismissal. Each notice is one capsule row with no stroke: a severity symbol on the leading edge, the message, the optional action, and a close symbol on the trailing edge. Native notices also accept `description` and `closable` (default true when `onDismiss` is supplied). Native `maxHeight` bounds a scrolling viewport; it defaults to 60% of the window height and accepts dp or a parent percentage. `dismissLabel` overrides the Dismiss wording inside the close button's accessible name; the button draws a symbol, not text. The capsule itself is `ToastNotice` on both platforms. For transient notices use `Toaster` and `toast()`, below. |
| `Toaster`, `toast()` | The transient host, from `@bloxwap/hig/react/toast` and `@bloxwap/hig/native/toast`: mount `Toaster` once, then call `toast(message, options)` from anywhere. Same names, options and stack on both platforms; see [Transient toasts](#transient-toasts-toaster-and-toast). |
| `Progress` | `label`, `value`, and `max`. Native draws the label with a ` value/max` suffix (`…` while indeterminate); `hideValue` leaves the suffix out for a host that shows the figure itself, and the value is still read. |
| `Spinner` | `label` (defaults to HIGProvider `messages.loading`) beside a spinning ring: web a `role='status'` span drawing `label…`; native one accessible element named by `label` (native also takes `testID`). `hideLabel` draws the ring alone for a tight spot, such as a row or a button-sized slot, while the label stays the accessible name (web: a visually hidden `label…` inside the status; native: the element keeps `accessibilityLabel` and draws no text). Type `SpinnerProps`. |
| `EmptyState` | `title`, optional `description`, optional `action`, and decorative `illustration`. A centred stack: symbol, title, description, action. `illustration` replaces the default symbol; `null` omits it. |
| `Avatar` | `name`, an optional image (`src` on web, `source` on native) and, when the host asks for it, a face generated from a `seed`. `variant`, `size`, `colors`, `faceColor`, `square` and `decorative` are the same on web and native. Its own entries are `@bloxwap/hig/react/avatar` and `@bloxwap/hig/native/avatar`. See [Avatar](#avatar). |

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

### Avatar

A person or an account as a 40-unit disc. It shows the first of these that it has:

1. The image, when one is given and it loads.
2. A generated face, when the host asks for one.
3. The first two letters of `name` on the well fill.

The generated face is the "beam" face of [Boring Avatars](https://boringavatars.com): a backdrop, a tilted shape, two eyes and a mouth, all decided by a hash of the seed. The same seed and the same colours draw the same face on web and native, on every device, with nothing stored. It is off until the host asks for it, with `variant='beam'` or by passing a `seed`. An `Avatar` with neither looks as it always did.

Import `Avatar` from `@bloxwap/hig/react/avatar` or `@bloxwap/hig/native/avatar`. The native entry draws the face with `react-native-svg`, an optional peer that this entry needs. The status entries keep exporting `Avatar` for the imports that predate these: `@bloxwap/hig/react/status` exports the same component, and `@bloxwap/hig/native/status` exports it without the generated face (no `seed`, `variant`, `colors` or `faceColor`), so that entry still loads no SVG peer.

| Prop | Behaviour |
| --- | --- |
| `name` | Required. The accessible name, the letters of the initials, and the seed when `seed` is left out. |
| `src` (web), `source` (native) | An image to show instead: a URL on web, a React Native image source on native. A photo that is not square is cropped to fill the box. If it fails to load, or it names no image (an empty `src`; on native `{uri: undefined}`, an empty address or an empty list), the face or the initials show in its place. |
| `seed` | What the face is drawn from, such as a wallet address. Passing it selects the generated face. It is case-sensitive, so pass an address in one casing everywhere. |
| `variant` | `'initials'` or `'beam'`: what shows without an image. Defaults to `'initials'`, or to `'beam'` when `seed` is given. |
| `size` | Width and height, in CSS pixels on web and dp on native. Defaults to 40. With `size`, the initials are drawn at 40% of it. A size that is not a finite number of zero or more (`NaN`, a negative, `Infinity`) is ignored. |
| `colors` | The palette of the face. Defaults to the `action`, `info`, `negative` and `warning` token roles, in that order (exported as `avatarColorRoles`). |
| `faceColor` | One colour for the eyes and mouth of every face. Left out, each face takes the `background` role on a bright colour and the `text` role on a deep one. |
| `square` | A square with no rounded corners instead of a disc, for a host that clips the avatar to its own shape. |
| `decorative` | Hides the avatar from assistive technology, for an avatar beside the name it stands for. |

```tsx
// A wallet: the address draws the face and the short address names it.
<Avatar name={shortAddress(address)} seed={address} size={20} />
// Beside the visible name, so it is not read twice.
<Avatar name={trader.name} seed={trader.address} decorative />
// A photo when there is one; the face when there is none or it fails to load.
<Avatar name={name} seed={address} src={photoUrl} size={64} />   // native: source={{ uri: photoUrl }}
```

**Colour.** The default palette is token roles, so it is Display P3 wherever HIG is. Web paints the `--hig-action`, `--hig-info`, `--hig-negative` and `--hig-warning` variables, which the tokens stylesheet defines in Display P3 where the browser supports it. Native paints the provider's colour table: the Display P3 table on an iOS host with `HIGProvider colorSpace='display-p3'`, and sRGB everywhere else. `colors` replaces the palette with the host's own: any CSS colour on web, `color(display-p3 …)` included, and any React Native colour on native, where a hex value is painted in the host's colour space like every other HIG colour. A seed picks its colours by position, so the number of colours and their order are part of a face. Change the palette and the same people get other colours; the shapes stay. For a signed-out placeholder, pass one fixed seed and a grey palette.

**Moving from boring-avatars.** For the same seed and the same `colors`, the shapes and the colour of each shape are those of boring-avatars 2.0.4 with `variant="beam"`, so people keep their faces. `<Avatar name={address} variant="beam" size={20} colors={palette} />` becomes `<Avatar name={label} seed={address} size={20} colors={palette} />`: boring-avatars' `name` is HIG's `seed`. These differ:

- The eyes and mouth are black or white in boring-avatars. HIG draws the `background` or the `text` role in their place, chosen by the same brightness rule, and `faceColor` sets one ink for every face.
- boring-avatars reads only six-digit hex colours when it chooses that ink and draws white for anything else. HIG also reads short hex, `rgb()` and `color()`, and draws the dark ink on a colour it cannot read, such as a CSS variable.
- The disc is the box's own rounding, not an SVG mask, so the drawing has no mask and no element id. `square` gives the unrounded square.
- `size` is a number. Only the beam face is drawn; the other boring-avatars variants are not.

The arithmetic is in `@bloxwap/hig/contracts/avatar`, with no React in it: `beamAvatar(seed, colors, inks?)` returns the colours, the two transforms, the mouth path and the eye positions in a 36-unit square, and `beamHash`, `beamInk`, `beamSize` and `beamEye` are exported beside it. The same entry holds what both renderers share outside the face: `avatarColorRoles` (the default palette roles), `avatarSide` (which sizes are drawn) and `avatarInitials` (the letters, never half of a character such as an emoji). A host that draws the same face somewhere else, such as on a canvas or in a share image, calls it directly.

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
| `offset` | Distance from the screen edges, added to the safe-area inset: one number for every edge, or `{top, right, bottom, left}` with the other edges keeping the default (24 points; 16 under a 600-point window). `left` and `right` are physical, like `position`. `offset` places the stack at every window width on both platforms; on web, Sonner's `mobileOffset` replaces it under 600px when it is given. The app's top placement is `offset={{top: nativeMetrics.safeArea.toastOffset}}`; see [safe area](https://bloxwap.github.io/hig/docs/guides/foundations/safe-area/). |
| `swipeDirections` | `top`, `right`, `bottom`, `left`. Default: towards the edges the stack sits against, so `bottom-center` swipes down and `top-right` up or right. |

The web `Toaster` also takes every other Sonner prop. The native one takes the props above and `testID`.

### How the native host moves

- **Nothing is laid out per frame.** A notice is rendered when it is raised, replaced or dismissed, and never while it moves. Raising or replacing one commits the host once and draws that notice's capsule alone; the screens beside the host do not render. Entering, leaving, restacking and the swipe change only `transform` and `opacity`, in Reanimated worklets on the UI thread. Each notice reads its place from one shared stack, so an arrival, a departure or a notice that changed height moves every notice in the same frame. With no notice showing the host renders nothing and runs no timer.
- **Stack.** 400ms on the CSS `ease` curve, Sonner's values. A new notice joins the stack once it has been measured, then slides in from its own height while the others make room. Behind the front of a collapsed stack each notice is 5% smaller, one gap further out and drawn at the front's height with its content hidden, so only its edge shows. One notice past the visible ones stays mounted and transparent, so the notice that is pushed out fades where it is.
- **Leaving.** 200ms on `ease-out`: the front goes back out by its own height while it fades, and the others close the gap in the same frame. A notice dismissed while it waits behind the drawn ones has nothing on screen to take away: it leaves the store at once and no view is mounted for it.
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
| `decay` | `0.9` | The share of its launch speed a piece keeps each tick, from 0 to 1; above 1 a piece gains speed. |
| `gravity` | `1` | Pull downwards: 1 falls at full speed, 0 floats, a negative value rises. |
| `drift` | `0` | Sideways push in pixels per tick; positive is towards the right edge. |
| `ticks` | `200` | How long the burst lasts, in ticks of 1/60 s (200 is about 3.3 seconds). Pieces fade out over it. |
| `origin` | `{x: 0.5, y: 0.5}` | Where the burst starts, as a share of the viewport (web) or of the `Confetti` layer (native). |
| `colors` | token roles | Colours dealt to the pieces in turn. See Colour below. |
| `shapes` | `['square', 'circle']` | Shapes picked at random for each piece: `'square'`, `'circle'` or `'star'`. |
| `scalar` | `1` | Scales every piece; below 0 reads as 0. |
| `flat` | `false` | Pieces neither tumble nor wobble. |
| `disableForReducedMotion` | `true` | Draws nothing when reduced motion is on. |
| `zIndex` | `100` | Web only: stacking order of the canvas, read from the burst that creates it. |

`Confetti` takes `trigger` and `options` (one burst, or an array fired together); native adds `style` and `testID` for the layer. `confetti.reset()` stops every burst at once and resolves their promises. `mirrorConfetti(options)` returns the same burst seen in a mirror.

A number that is not finite reads as the default, and `startVelocity`, `gravity`, `drift`, `scalar` and `ticks` are kept within a million either way, so no input places a piece at infinity. Nothing caps `particleCount`.

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

- Web: every burst shares one full-viewport canvas and one `requestAnimationFrame` loop. The canvas is created by the first burst, sized for the device pixel ratio, takes no pointer events, and is removed when the last piece has gone. Each piece is one small path, as in canvas-confetti; the opacity is set once a burst and the fill colour once for each of its colours, with no colour string built per piece. React renders nothing while a burst flies.
- Native: React renders once when a burst starts and once when it ends. In between one Reanimated clock per burst runs on the UI thread, and each piece, a plain view, reads its transform and opacity from it. Nothing is laid out per frame. A burst of about 100 pieces is the intended size; larger bursts mount one view a piece. A star is that one moving view holding five triangles that never change, so it mounts six views.

### Confetti accessibility and direction

Confetti is decoration. The canvas (`aria-hidden`) and the native layer are hidden from assistive technology and take no pointer events or touches; show and announce the result itself with the content it belongs to. Under reduced motion (`HIGProvider reducedMotion`, else the system setting) a call draws nothing and resolves at once, unless it passes `disableForReducedMotion: false`. canvas-confetti defaults the other way.

`HIGProvider` learns the system setting just after it mounts: in an effect on web, from an asynchronous question on native. A burst asked for in that moment, by a `trigger` that is truthy when `Confetti` mounts or by `confetti()` in a mount effect, is therefore held by the host until the provider can answer, and is then drawn or dropped like any other. On web the wait is one render and happens only where the system asks for reduced motion; on native it is the one question `Confetti` asks the system when it mounts. A held burst resolves without being drawn if the host unmounts or `confetti.reset()` is called first.

Confetti is physical: `origin.x` 0 is the left edge and a positive `drift` goes right in both text directions, on both platforms. For a cannon that should fire from the leading edge, pass the options through `mirrorConfetti` when the direction is right-to-left. No text is drawn, so large text does not apply.

### Confetti platform differences

- Web needs no host: without a mounted `Confetti`, `confetti()` reads colours from the document root and reduced motion from the system. Native needs one: without it a call resolves and draws nothing.
- The web canvas covers the viewport and sits in the document body. The native layer fills the parent of `Confetti`, and `origin` is a share of that layer.
- Web draws canvas-confetti's shapes exactly: a square is a slanted, fluttering parallelogram. React Native cannot slant a view on Android, so native draws the rectangle with the same centre, area and long and short axes; circles are exact. A `'star'` is the same ten-point star on both: web fills its outline, and native, which has no paths without an SVG package, covers exactly that outline with five triangles made of view borders.
- Before the native layer has been laid out, `origin` is a share of the window.
- A burst left running when its web host unmounts finishes; on native it stops with the layer and its promise resolves.
- The native entry needs the Reanimated and Worklets peers. The web entry needs no peer and no stylesheet.
- Not supported: canvas-confetti's `useWorker`, `confetti.create`, `shapeFromPath` and `shapeFromText`.

`tests/confetti-model.test.ts` checks the flight against canvas-confetti's update with a seeded random source, that the five triangles cover the star's outline and nothing else, and that extreme options still give finite places; `tests/confetti.dom.test.tsx` and `tests/native/confetti.test.cjs` check each renderer against stand-ins for the canvas and for Reanimated. `scripts/confetti-browser-smoke.mjs` runs the web renderer in headless Chromium and WebKit: one canvas over the viewport at the device pixel ratio, painted pixels in each default colour, a Display P3 canvas with the P3 green on a wide-gamut screen, the length of a burst, presses passing through, a resize in flight, reduced motion, `reset`, and a burst asked for as the page mounts, which adds no canvas under the system's reduced motion setting and one canvas of stars without it. In the browser gates the same script runs the native renderer through react-native-web and Reanimated's web implementation (the native fixture's Expo web export): one view a piece, the table's colours, transform and opacity only, presses passing through the layer, and the views removed at the end. Neither run is a device: the web renderer has not been watched on a display with a GPU, and the native renderer's look and frame rate on iOS and Android have not been observed, the border-built star included (it was looked at once through react-native-web, which the gate does not repeat). For a device run, `fixtures/native/confetti-check.tsx` (entry `fixtures/native/index-confetti.js`) fires bursts of 50 to 200 pieces, and one of stars, by button or deep link and logs UI-thread frame times as `[confetti-check]`.

Cost is measured, not assumed. `node scripts/perf/confetti-web.mjs` flies bursts of 100, 300 and 1000 pieces, five overlapping bursts and twenty in a row in headless Chromium, also with the CPU throttled four times (`--gpu` rasterises on a Mac's GPU), and prints frame intervals, script and task time, canvas calls and heap growth a frame, what is left a second after the last piece (no frame request, timer, canvas or listener) and a fingerprint of the pixels, which a faster renderer must not change. `node scripts/perf/confetti-model.mjs` steps the shared flight in Node and in the Hermes interpreter React Native ships, as time and bytes allocated a piece: the web path allocates nothing a piece, and `confettiPose`, which each native piece runs every frame, works the flight out without a flight object. `tests/native/confetti-perf.test.cjs` counts what a native burst asks for: one view and one animated style a piece (six views for a star), one clock a burst, one React commit when it starts and one when it ends, none while it flies, and no piece of another burst rendered again. `fixtures/native/perf/confetti.tsx` flies 100, 300 and five times 100 pieces on mount and logs the UI thread's frames between `[perf] confetti start` and `[perf] confetti done`; it has not been run on a device.

## When to use and examples

Do: keep critical failure inline with Retry; use toast for copied acknowledgement; give a toast that carries an action `duration: Infinity`, so it is still there when a screen reader or a slow reader gets to it; keep confetti for a rare, real win and show the result itself in content. Don’t: dismiss critical text on a timer, rely on audio for success, or let confetti be the only sign that something happened.

Do: seed a generated `Avatar` with something that stays the same for a person, such as the wallet address, and use one palette across a product so a person has one face everywhere. Don’t: seed it with a display name that people can change, or treat the face as proof of who someone is; two seeds can draw the same face.

## States, interaction and accessibility

Notifications deduplicate ids and preserve every message until explicit dismissal, including bursts larger than three. Host delivery queues may limit arrivals, but the renderer never silently removes an undismissed message. A single coalesced announcement reports each changed burst, prioritizing errors; unchanged rerenders do not repeat it. DOM and Expo web use one live region while every notification remains visible. Native Android uses explicit announcement delivery, and inline Android status uses live-region metadata; iOS announces changed inline content explicitly. Actual VoiceOver/TalkBack timing remains unobserved. Skeleton and spinner are static under candidate motion policy.

`Avatar` is a named image: `role='img'` with `name` as its label on web (the image's `alt` when there is one), and an accessibility element with `accessibilityRole='image'` and `accessibilityLabel` on native, for the photo, the face and the initials alike. `decorative` removes it from the accessibility tree on both. The generated face is still: nothing animates, so reduced motion changes nothing. It is an identity picture, so it is not mirrored in right-to-left layouts. The initials are text. On native, without `size` they follow the system text size and the provider's `maxFontSizeMultiplier` as they always have, while the disc keeps its size; with `size` they are 40% of the box and keep that size at every system text size, like the letters in HIG's other fixed discs, so they stay inside it. On web they take the surrounding font size without `size` and 40% of the box in CSS pixels with it.

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

`Avatar` takes `src` (a URL) on web and `source` (a React Native image source) on native; every other prop is the same. Web draws the face as inline SVG and native with `react-native-svg`, from one description, so the shapes are the same numbers on both. The face is drawn again only when its seed, colours, ink or (on native) size change: a parent or a provider that renders again with the same face computes nothing and writes nothing. An `Avatar` whose props are the same does not render at all when its parent renders again, so a long list that updates one row renders one avatar. A palette written inline (`colors={[…]}`) and, on native, a source written inline (`source={{ uri }}`) are the same props while they hold the same colours and the same fields. Both platforms crop a photo that is not square to fill the box, and both show the fallback when the image fails. On web that includes an image that failed before a server-rendered page hydrated: when the component mounts, an image that is complete with no width is checked with `decode()`, and a broken one gives way to the fallback. One difference remains. The native face needs the `react-native-svg` peer, so it is in `@bloxwap/hig/native/avatar` only; `Avatar` from `@bloxwap/hig/native/status` draws the image or the initials. How the face and its Display P3 colours look in a browser, on a phone and through VoiceOver or TalkBack has not been observed, and neither has the check for an image that failed before hydration, which is tested against a stubbed image; the tests check the drawn values, roles and names.

## Validation and citation

See `tests/components.dom.test.tsx`, `tests/native/components.test.cjs`, consumer fixtures and milestone evidence. Transient toasts: `tests/toast-model.test.ts` (the shared arithmetic and the Sonner figures it mirrors), `tests/toast.dom.test.tsx`, `tests/native/toaster.test.cjs` and `tests/native/toaster-perf.test.cjs` (the React work one call costs the native host: commits, capsules drawn, cards mounted). Their benchmarks are `scripts/perf/toast-web.mjs` (headless Chromium, HIG's `Toaster` beside a hand-written Sonner host), `scripts/perf/toast-model.mjs` (the shared store and stack arithmetic) and `fixtures/native/perf/toast.tsx` (a run for a device, which logs its own frames); none of them has been run on a physical device. For `Avatar`: `tests/avatar-model.test.ts` holds the model to faces recorded from boring-avatars 2.0.4 (`tests/test-utils/boring-avatars-beam.json`, written by `tests/test-utils/record-boring-avatars.mjs`, which also compares 30,096 faces with that package when run against an install of it), and `tests/avatar.dom.test.tsx` and `tests/native/avatar.test.cjs` hold each renderer to the same recording and to the edge inputs (sizes that cannot be drawn, sources that name no image, an image that failed before hydration, a provider that renders again) and to a list whose parent renders again (no avatar renders, no face is computed, nothing is written, and each changed prop is seen); the native file also renders the status entry with `react-native-svg` absent and counts the native views of each kind (nine for a generated face, one for a photo, two for initials), and `tests/avatar-typecheck.tsx` and `tests/native/avatar-typecheck.tsx` hold the prop types. Speed is measured, not tested: `scripts/perf/avatar-model.mjs` times the shared model in Node, `scripts/perf/avatar-web.mjs` mounts, re-renders and scrolls a list of 500 avatars in headless Chromium (and, with `HIG_PERF_RENDERER=native`, runs the native component through react-native-web), and `fixtures/native/perf/avatar.tsx` is a screen that scrolls 300 generated avatars on a device and logs when it starts and ends; that device run has not been made. Physical hardware, assistive-technology and baseline product comparisons are unperformed unless linked explicitly. Cite HIG 0.1.0 with this chapter anchor and a commit permalink, not a mutable preview branch. Preserve business behavior behind a host rollback flag during adoption.
