# Foundation and platform rules · HIG 0.1.0

## Color (#6)

Dark is the only audited mode. Source values retain the commit-pinned monorepo authored OKLCH and brand channels; see [source reconciliation](source-reconciliation.md). Use surface/text/action/focus/buy/sell/warning roles, never infer intent from a hue. Web emits sRGB then P3 in `@supports`. RN uses explicit hex values from HIG's own tables, selected once per app by `HIGProvider colorSpace` (#93); see the native colour space table below. Android and third-party images use sRGB. `evidence/contrast.json` records all 33 approved normal-text pairings. Faint text is restricted to background/surface: faint on nested fails normal-text AA, so use muted on nested instead. Border is decorative; meaningful control edges/focus must use tested text or focus tones. **Do** use onAction on green fills; **don't** put white body text on green.

### Primary brand colour

Set `primaryColor` on `HIGProvider` to apply another brand's accent. For example,
Tap Trade TV can use a red primary colour:

```tsx
import {HIGProvider} from '@bloxwap/hig-react/provider';
// Native: import {HIGProvider} from '@bloxwap/hig-native/provider';

<HIGProvider primaryColor='#ff0000'>
  <App />
</HIGProvider>
```

The red above is an example; supply the brand's exact hex. Both providers accept
opaque sRGB `#RGB` or `#RRGGBB` values. Other formats, including transparent
colours and CSS variables, throw a descriptive error. Omit the prop at the root
to retain the existing Bloxwap green and wide-gamut defaults. Nested providers
inherit the primary colour unless they supply another one. Separate roots can
use different brands; changing or removing the prop updates mounted components.

The override sets `action` and `focus`, plus `onAction` to black or white for the
higher text contrast (at least 4.5:1 on the primary fill). Buttons, links,
selection controls, progress indicators, action tones, and chart crosshair
labels follow the accent. Success/error/warning/info and buy/sell roles keep
their existing meanings and colours. Destructive buttons keep their dark label
on the negative fill. The approved Bloxwap mark retains its original colours;
another brand supplies its own logo.

Web applies scoped CSS variables on the provider wrapper and on HIG portalled
overlays, including Dialog, GestureSheet, Menu, Popover, and Tooltip. Import the
normal token and component CSS. `useThemeStyle()` from the web provider entry
returns the primary variables for a host-owned portal's root. Both platforms
export `useColors()` for host-drawn content (web returns sRGB values for canvas).
Native converts the sRGB input when an iOS provider selects `display-p3`; Android
and react-native-web keep sRGB input channels. A nested provider can change colour
space while inheriting the brand accent.

The [default palette contrast report](../../evidence/contrast.json) covers the
default theme. Custom accents also need review against the surfaces where they
appear, particularly link text and focus rings; automatic label selection only
guarantees contrast on the primary fill. Choose an accent with enough contrast
for the dark surfaces your product uses.

Tokens-only hosts can call `resolvePrimaryColor` from `@bloxwap/hig-tokens` and
apply the resulting `action`, `focus`, and `onAction` roles to a scoped element.
Keep these three roles together so primary labels remain readable.

### Native colour space

React Native reads a hex colour's channels in the app's default colour space. That is sRGB unless the iOS host overrides `defaultColorSpace()` in its React Native factory delegate to return Display P3. If it does, `#ff479c` is read as P3 channels and paints a more saturated pink than the token. Set `colorSpace` on the root `HIGProvider` to match the host. Every HIG native component (Text, Surface, Separator, Button, Link, Field, Switch, Slider, Alert, Badge, Spinner, Skeleton, Dialog and GestureSheet) then paints from that table through `useColors()`, with the primary brand override applied if present. The Bloxwap mark uses `useBrandColors()` to retain its approved colours in the same colour space. Hosts choose a table and can configure the primary accent through `primaryColor`. Nested providers inherit both settings, and a test fails if a component imports `nativeSrgb` or paints a raw hex value.

| `HIGProvider colorSpace` | iOS | Android | react-native-web |
| --- | --- | --- | --- |
| `srgb` (default) | `nativeSrgb` | `nativeSrgb` | `nativeSrgb` |
| `display-p3` | `nativeDisplayP3` (= `nativeColors.iosDisplayP3`) | `nativeSrgb` (HIG publishes no Android P3 table) | `nativeSrgb` |

| Role | `nativeSrgb` | `iosDisplayP3` |
| --- | --- | --- |
| action / positive / buy / focus | `#00ff3f` | `#00ff3d` |
| warning | `#fffb38` | `#fffa2e` |
| negative / sell | `#ff479c` | `#ff3d9e` |
| info | `#35b5ff` | `#2eb8ff` |

Neutral roles (background, surface, nested, text, muted, faint, border, onAction) have the same hex in both tables. Use `useColors()` to read the resolved table for host-drawn views next to HIG components. Evidence is native Jest (#93) and iOS Simulator captures of the gallery built as a Display P3 host (`evidence/native-sim/issue-93/`). Those captures predate the pink/neon-yellow tone adoption: in them, `display-p3` paints warning and negative as exactly the then-current sRGB tokens (`#f5b300`, `#ff5c5c`), while `srgb` on the same host paints them oversaturated (`#ffaf00`, `#ff4a54`); the mechanism is unchanged. Action and info are wider than sRGB, so the screenshot clips them. Physical display comparison is tracked in #55.

## Typography (#7)

Pin @bloxwap/font 0.1.2. Vite: import `@bloxwap/font/css`; Next: upstream Sans/Mono loaders own loading and script fallback. Sans for prose/controls; Mono for code and tabular readouts; Pixel for a short nonessential accent. Body 16/24, label 14/20, caption 12/18, title 24/30, display 48/52 are candidate role mappings based on SDK scale. Web CSS exposes the roles as `--hig-type-<role>-size`, `-line-height`, `-weight` and a `--hig-type-<role>` font shorthand, and the families as `--hig-font-sans`/`--hig-font-mono`. Those resolve the `@bloxwap/font` Next loader variables first and fall back to the literal `'Bloxwap Sans'`/`'Bloxwap Mono'` families, so HIG controls render the loaded face in both Next and plain `@font-face` hosts. Web rem uses 16px root; RN sizes are explicit dp and allow font scaling. Do not disable Dynamic Type or fixed-height clip translated labels. Run the pinned native font generator and register its static TTF faces from `@bloxwap/hig-native-fonts`; its typed manifest records weight/family/source hashes. Web hosts never install that package. Published WOFF2/Next loaders are not directly native assets. **Do** wait for registration before applying a custom native family; **don't** invent a family string and claim the font rendered. Arabic/Hebrew/CJK companions are owned upstream; load required scripts, test mixed-script punctuation and RTL. Large-text and device font evidence is pending.

## Geometry and layout (#8)

Spaces 4/8/12/16/20/24/32/48; radius 6/8/10/14 and pill (`--hig-radius-sm`…`--hig-radius-xl`, `--hig-radius-pill`). Comfortable control/target 48 and gap 12; compact 36 and gap 8, reserved for pointer/keyboard dense layouts. CSS exposes each mode as `--hig-density-<mode>-<control|target|gap>`, and `--hig-density-control`, `--hig-density-target` and `--hig-density-gap` follow the nearest `[data-hig-density]`, which the React provider sets. Painted icons can be 16/20/24 while targets stay 48 on touch. Never expand adjacent invisible hit areas so they overlap. Use logical inline spacing, wrapping labels, safe-area insets, keyboard avoidance and a scrollable native sheet; preserve portrait/tablet rotation without locking orientation. Pro tables may scroll with column headers; app amount entry reflows. Elevation uses nested fills rather than unverified shadows. Layer order: document, sticky nav, contextual popover, modal, notification. Browser top layer handles modal stacking; native Modal remains platform-owned.

## Motion and gestures (#9)

Fast 180ms, base 260ms, slow 320ms; web easing `cubic-bezier(.22,1,.36,1)`. CSS exposes `--hig-motion-duration-<fast|base|slow>` and `--hig-motion-easing-standard`. The durations become 0ms under `prefers-reduced-motion: reduce` and inside `[data-hig-motion='reduced']`, which the React provider sets when the host or OS asks for reduced motion. Press response ends on release/cancel; action executes on accepted activation, never press-in. Drag/scroll cancellation clears visual and feedback state. Interrupt transitions from current state instead of queuing. Reduced motion uses immediate state changes, static skeletons and unanimated numeric readouts. Outcome messages remain explicit. **Do** animate deliberate disclosure once; **don't** animate or play sound for every live-data update. Native candidate uses static transitions until cancellation/device animation evidence exists; motion preference is independent from sound/haptics.

## Accessibility and localization (#10)

Baseline: [WCAG 2.2 AA, Recommendation 12 December 2024](https://www.w3.org/TR/2024/REC-WCAG22-20241212/). Normal text 4.5:1; large text and meaningful non-text UI 3:1. Touch baseline 48 logical units exceeds the web minimum. Provide visible focus, semantic labels/descriptions, logical keyboard order and non-drag alternatives. Native roles/state/value map to VoiceOver/TalkBack. No tooltip-only critical text. Restore trigger focus on modal dismissal; Escape/native back closes topmost cancellable overlay. Host owns safe-area, locale, parsing, route and keyboard adapters. Intl display is not money arithmetic. Vocabulary is locked in the [trading glossary](glossary.md) (`docs/foundations/glossary.json`) before any locale translation. Number, currency, date, leverage, percent and RTL formatting is in the [localization guide](localization.md).

Component review checklist: keyboard completion; labeled controls/errors; busy/disabled; focus restoration; narrow viewport; 200% text; long translations; Arabic/Hebrew RTL; mixed scripts; reduced motion; sound off; haptics off; unknown/stale/error values; VoiceOver/TalkBack on physical devices. Automated results and physical observations must be separate. Exception requires owner, affected surface, reason, alternative and expiry. No observed device evidence means pending, never pass.

## Brand and icons (#11)

Approved mark is copied verbatim from the pinned Font docs SVG, including embedded provenance. Import `@bloxwap/hig-tokens/mark.svg` on web; both web and RN geometry renderers are available from their brand entries. Keep aspect ratio and clear space of one quarter mark width. Decorative marks/icons are hidden from accessibility; icon-only actions require an explicit accessible name and 48-unit target. Use currentColor for utility icons, never tint the approved brand mark arbitrarily. Directional arrows mirror in RTL; brand, check and financial direction do not. Icons repository contains a large catalog; do not import it wholesale. Only reviewed single glyphs belong in runtime exports. Favicon/OG derivatives have source provenance and drift checks. Physical device visual comparison remains unperformed.

Font-loading note: `@bloxwap/font/css` references all supported families/scripts, which may increase deployed asset bytes even with on-demand browser loading. The Latin web fixture instead uses two explicit @font-face rules with package asset URLs (Sans and Mono). Add only the scripts/italics used by each consumer. Do not assume a Latin-only fixture certifies mixed-script rendering.


## Native text in multiple scripts

Register each required companion face with the host font loader, then pass its registration name through `HIGProvider fontFamiliesByScript`, for example `{latin: {400: 'BloxwapSansRegular'}, ko: {400: 'BloxwapSansKRRegular', 600: 'BloxwapSansKRSemiBold'}, zh: {400: 'BloxwapSansSCRegular'}}`. The provider's `fontFamilies` remains the fallback. Nested providers inherit the script map when it is omitted.

HIG Text detects Hangul or Han in each run even when the provider locale is English. Shared CJK punctuation follows the run's `accessibilityLanguage`, then the provider locale; `script` can select a face explicitly. If a script map has fewer weights, Text chooses its nearest registered weight. Explicit `style.fontFamily` wins. Hosts load these optional faces themselves; declaring a map does not load a font. Native RadioGroup options accept `lang` for the spoken label and `description` for its translated second line.
