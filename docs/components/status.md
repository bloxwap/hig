# Status & feedback

Visible progress, notifications, and recoverable states that keep people informed.

Includes `Badge`, `Alert`, `Callout`, `Toast`, `Progress`, `Spinner`, `Skeleton`, `EmptyState`, `Avatar`, and `StatusIndicator`.

Issue #18. Entry: `status`. Import platform entries from `@bloxwap/hig/react/status` or `@bloxwap/hig/native/status` according to applicability below. Import `@bloxwap/hig/react/css` once on web; tokens CSS is a separate explicit import.

## API and anatomy

| Component | Key props and behavior |
| --- | --- |
| `Badge` | Quiet label; web adds explicit `tone` (`neutral`, `positive`, `negative`, `warning`, or `info`), standard span props and a forwarded span ref. The neutral default retains its appearance. Tone uses provider token roles and never infers meaning from text or a number's sign. Badge adds no live region; the host owns announcements. |
| `Alert` | `title`, `severity`, and an optional recovery `action`. Severity tints the fill and colours the title from a token role on web and native, with no stroke or glow: the surface mixed with 10% of the tone, at the Surface radius. `default` → neutral (6% of `text`, title in `text`), info → `info`, success → `positive`, warning → `warning`, error → `negative`. On native, `tone` swaps in another token role for an approved product accent, never a raw colour. `announce` (default `true`) speaks the alert when it appears or its words change: web gives it `role='status'` (`'alert'` for `error`), Android a live region, and iOS an explicit announcement. Pass `announce={false}` for an alert that is part of the screen from the start, such as a standing warning. On native a string or number child is drawn in a HIG `Text`, so a plain sentence needs no wrapper. |
| `Callout` | Same API as `Alert`, for static guidance. It adds the documentation severities `note` (`info` role) and `tip` (`positive` role), so SDK docs do not need their own callout colours. Pass `announce={false}` for callouts present at page load. `title` accepts a ReactNode, such as text with a `<code>` span; on web it renders inside `<strong>` and should stay inline. On native it renders inside the `Heading`, so pass a string or inline `Text`; its visible text is announced. |
| `Toast` | `notices` with stable `id`, `message`, `severity`, and optional `action`; `onDismiss` handles dismissal. Each notice is one capsule row with no stroke: a severity symbol on the leading edge, the message, the optional action, and a close symbol on the trailing edge. Native notices also accept `description` and `closable` (default true when `onDismiss` is supplied). Native `maxHeight` bounds a scrolling viewport; it defaults to 60% of the window height and accepts dp or a parent percentage. `dismissLabel` overrides the Dismiss wording inside the close button's accessible name; the button draws a symbol, not text. For transient notices on web, `toast()` and `Toaster` from `@bloxwap/hig/react/toast` raise the same capsule through Sonner. |
| `Progress` | `label`, `value`, and `max`. Native draws the label with a ` value/max` suffix (`…` while indeterminate); `hideValue` leaves the suffix out for a host that shows the figure itself, and the value is still read. |
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
| `src` (web), `source` (native) | An image to show instead: a URL on web, a React Native image source on native. If it fails to load, the face or the initials show in its place. |
| `seed` | What the face is drawn from, such as a wallet address. Passing it selects the generated face. It is case-sensitive, so pass an address in one casing everywhere. |
| `variant` | `'initials'` or `'beam'`: what shows without an image. Defaults to `'initials'`, or to `'beam'` when `seed` is given. |
| `size` | Width and height, in CSS pixels on web and dp on native. Defaults to 40. With `size`, the initials are drawn at 40% of it. |
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

The arithmetic is in `@bloxwap/hig/contracts/avatar`, with no React in it: `beamAvatar(seed, colors, inks?)` returns the colours, the two transforms, the mouth path and the eye positions in a 36-unit square, and `beamHash`, `beamInk`, `beamSize` and `beamEye` are exported beside it. A host that draws the same face somewhere else, such as on a canvas or in a share image, calls it directly.

## When to use and examples

Do: keep critical failure inline with Retry; use toast for copied acknowledgement. Don’t: dismiss critical text on a timer or rely on audio for success.

Do: seed a generated `Avatar` with something that stays the same for a person, such as the wallet address, and use one palette across a product so a person has one face everywhere. Don’t: seed it with a display name that people can change, or treat the face as proof of who someone is; two seeds can draw the same face.

## States, interaction and accessibility

Notifications deduplicate ids and preserve every message until explicit dismissal, including bursts larger than three. Host delivery queues may limit arrivals, but the renderer never silently removes an undismissed message. A single coalesced announcement reports each changed burst, prioritizing errors; unchanged rerenders do not repeat it. DOM and Expo web use one live region while every notification remains visible. Native Android uses explicit announcement delivery, and inline Android status uses live-region metadata; iOS announces changed inline content explicitly. Actual VoiceOver/TalkBack timing remains unobserved. Skeleton and spinner are static under candidate motion policy.

`Avatar` is a named image: `role='img'` with `name` as its label on web (the image's `alt` when there is one), and `accessibilityRole='image'` with `accessibilityLabel` on native. `decorative` removes it from the accessibility tree on both. The generated face is still: nothing animates, so reduced motion changes nothing. It is an identity picture, so it is not mirrored in right-to-left layouts. The initials are text: on native they follow the system text size and the provider's `maxFontSizeMultiplier` like other HIG text, while the disc keeps its size.

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

`Avatar` takes `src` (a URL) on web and `source` (a React Native image source) on native; every other prop is the same. Web draws the face as inline SVG and native with `react-native-svg`, from one description, so the shapes are the same numbers on both. The face re-renders only when its seed, colours or (on native) size change. Three differences remain. The native face needs the `react-native-svg` peer, so it is in `@bloxwap/hig/native/avatar` only; `Avatar` from `@bloxwap/hig/native/status` draws the image or the initials. A web image is stretched to the box when it is not square, as before, while native crops it to fill; give web a square image. An image that fails before a server-rendered page hydrates is not seen on web, so the fallback does not replace it. How the face and its Display P3 colours look in a browser, on a phone and through VoiceOver or TalkBack has not been observed; the tests check the drawn values, roles and names.

## Validation and citation

See `tests/components.dom.test.tsx`, `tests/native/components.test.cjs`, consumer fixtures and milestone evidence. For `Avatar`: `tests/avatar-model.test.ts` holds the model to faces recorded from boring-avatars 2.0.4 (`tests/test-utils/boring-avatars-beam.json`), and `tests/avatar.dom.test.tsx` and `tests/native/avatar.test.cjs` hold each renderer to the same recording; the native file also renders the status entry with `react-native-svg` absent. Physical hardware, assistive-technology and baseline product comparisons are unperformed unless linked explicitly. Cite HIG 0.1.0 with this chapter anchor and a commit permalink, not a mutable preview branch. Preserve business behavior behind a host rollback flag during adoption.
