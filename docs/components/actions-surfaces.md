# Actions & surfaces

Buttons, typography, and layout primitives for clear actions and related content.

Includes `Button`, `IconButton`, `Link`, `Text`, `Heading`, `Stack`, `Inline`, `Surface`, `Card`, `Separator`, `InstallCommand`, and `MarketingHero`.

Issue #13. Entry: `button / surface`. Import platform entries from `@bloxwap/hig/react/button` or `@bloxwap/hig/native/button` according to applicability below. Import `@bloxwap/hig/react/css` once on web; tokens CSS is a separate explicit import.

## API and anatomy

| Component | Key props and behavior |
| --- | --- |
| `Button`, `IconButton` | `children`, `intent`, `busy`, `busyLabel`, `disabled`, `fullWidth`, `suppressFeedback`, and forwarded ref. Web uses `onClick`; native uses `onPress`. A busy Button shows a spinner on the leading side of its label; a busy IconButton shows the spinner in place of its icon. The busy text (` · Working`) is not drawn: it is appended to the accessible name from HIGProvider `messages.busy` or `busyLabel`; `''` omits it while busy state stays exposed. Native: the label renders through HIG `Text` (HIGProvider or `maxFontSizeMultiplier` prop font-scale cap, registered family for the weight, per-script letter spacing), and a busy Button with text children sets its accessible name ([localization rule](../foundations/localization.md#built-in-component-strings)); an explicit `accessibilityLabel` wins. On web, HIGProvider `pressDecoration` draws a host element inside every Button (`kind: 'button'`) and IconButton (`'icon-button'`) without changing its layout, for example the native switch input iOS Safari needs for a haptic ([blocks](blocks.md#shared-host-hooks)). A native IconButton is drawn at 44dp and reaches 48dp on every side through `hitSlop`; a host `hitSlop` wins. `intent` also takes the market-direction fills `up` (buy, long) and `down` (sell, short), on both platforms (0.8.0): the fill follows HIGProvider `marketColors` (web `--hig-up`/`--hig-down`, native `useColors().up`/`.down`), which default to the buy and sell colours, with the dark label `destructive` uses, so a host's Long/Short or confirm-close actions keep the market convention (red for up in KRX or A-share hosts) without drawing their own button. `intent='warning'` fills with the warning role (web `--hig-warning`, native `useColors().warning`) with the same dark label, for an action that goes ahead despite a caution, such as `ConfirmBlock confirmIntent='warning'`. Unavailable stays neutral like every intent. Type `ButtonIntent`. `href` (Button, web and native, 0.8.0) makes a filled pill a real link, described [below](#button-as-a-link). `glow` (Button, web and native, 0.8.0) draws a soft halo in the fill colour around a filled intent (`primary`, `destructive`, `up`, `down`, `warning`): two spread shadows at 45% and 20% of the fill (web `.hig-button[data-glow]`, the colour from `--hig-glow`; native `boxShadow`, which needs React Native's new architecture). Use it for the one hero action of a brand or marketing surface, such as a 404 page's Trade BTC; `secondary` and `ghost` ignore it, and an unavailable button has no halo. |
| `Link` | Platform link behavior; host applications own routing. |
| `Text`, `Heading` | Platform text props. `Text` takes `tone='muted'` (secondary text, such as a note under a group, in the muted role) and `size='caption'` (12/18 instead of the 16/24 body), on both platforms; a native `style` colour or size still wins. Native adds `maxFontSizeMultiplier` (font-scale cap for dense numeric readouts, also on `NumberReadout`; HIGProvider sets a default) and `script` (`latin`, `ko`, `zh`; detected from string children). Korean and Chinese runs use the companion face's own spacing (`scriptLetterSpacing`, 0em) instead of Latin tracking; HIGProvider `letterSpacingByScript` overrides it per script in em. |
| `Stack`, `Inline`, `Surface`, `Card` | Platform layout props. |
| `InstallCommand` | `command` and `onCopy`; accepts an asynchronous host clipboard adapter. The copy result is raised as a toast: on web when `Toaster` from `@bloxwap/hig/react/toast` is mounted, and inline otherwise. The block itself does not load Sonner. Native renders the command in the provider's `monoFontFamily` and keeps it left-to-right inside RTL roots; a copy failure leaves a manual-selection recovery message. Imported from the blocks entry (`@bloxwap/hig/react/blocks`, `@bloxwap/hig/native/blocks`). |
| `MarketingHero` | `title`, `description`, `href`, and `cta`: a heading, one sentence and a link for a landing section. Imported from the blocks entry (`@bloxwap/hig/react/blocks`, `@bloxwap/hig/native/blocks`). |

## When to use and examples

Actions that sit side by side are 8 units apart at every density: buttons in an Alert, tabs, Pagination, Filter capsules and the SwapBlock action row. On web that is the `--hig-action-gap` variable (the `sm` space token); set it on a container to change it. Content inside `Stack` and `Inline` keeps the density gap (12 on touch, 8 compact), so put a row of buttons in a container that uses `--hig-action-gap`, not a bare `Inline`.

The primary and secondary call-to-action buttons that close a form sit a double step below the rest of it: 16 units (`--hig-action-offset`, twice the action gap), and 8 units from each other. TradeEntry, the SwapBlock action row, and the buttons that end a Dialog or a default sheet follow this already. In a host form laid out with `Stack`, add `className='hig-form-action'` to each closing button on web, or a 4dp top margin on native, where the `Stack` gap is 12.

Use one primary review action. Do: busy protects host requests, shows the leading spinner and announces the translated busy label (`Working` in English). Don’t: use destructive red for every sell button.

### Button as a link

Give `Button` an `href` when the action goes somewhere instead of doing something, such as a pill that opens docs or a route, so it keeps the button's look and gets link behaviour (open in a new tab, copy link, the link role).

- **Web** renders `<a class="hig-button" href>` with the same `data-intent`, `data-full`, density, `glow`, busy spinner and busy text, and the same `onClick` and accepted feedback (a host `preventDefault()` cancels both the navigation and the feedback). `target` and `rel` pass through as given (browsers already treat `target="_blank"` as `noopener`; pass `rel` for `noreferrer`). Disabled or busy, the anchor drops its `href`, so it leaves the tab order like a disabled button, and keeps `role="link"` with `aria-disabled="true"` (and `aria-busy` while busy); a click does nothing. The forwarded ref then holds the `HTMLAnchorElement` (the ref type stays `HTMLButtonElement` so existing refs keep compiling). `IconButton` takes no `href`.
- **Native** sets `accessibilityRole="link"`. Without `onPress`, a press opens `href` through `Linking.openURL` and a failure goes to `onError`, as `Link` does; a host `onPress` (an Expo Router push or an in-app browser) replaces that navigation, so one press never opens both. Disabled or busy blocks both. On React Native Web the root renders the `href` and the press stops the anchor navigating on its own.

Label wrapping (web): a label breaks between words first. `.hig-button` uses `overflow-wrap: break-word`, so a word that is a little wider than the space beside a trailing icon in a narrow two-button row (`ConfirmBlock` and `TargetBlock` action rows at 320px) runs into the button's own padding instead of splitting mid-word (“Get my disco/unt” before). A single word wider than the whole button still overflows it, so keep action labels, and their translations, short.

## States, interaction and accessibility

DOM semantic button/anchor, forwarded focus, target minimum width and height tied to density (web: 44px comfortable, 36px compact); RN target always at least 48. Multiline labels wrap at word boundaries; RN custom children render in a View with text nodes styled individually.

State review: rest; keyboard focus/hover (DOM); accepted press and release/cancel; selected/checked where applicable; disabled; busy; inline error/recovery; empty/loading; long translations/large text; reduced motion; sound and haptics disabled. No host action occurs on mere focus. Disabled/busy targets suppress accepted activation. Core has no required feedback backend; the optional provider callback follows the action, honors cancellation and isolates errors.

## Platform mapping and limits

RN external Link uses Linking; routes belong to host. Native fontFamily only after registration. Decorative SVG hidden; IconButton label is mandatory.

## Validation and citation

See `tests/components.dom.test.tsx`, `tests/native/components.test.cjs`, consumer fixtures and milestone evidence. Physical hardware, assistive-technology and baseline product comparisons are unperformed unless linked explicitly. Cite HIG 0.1.0 with this chapter anchor and a commit permalink, not a mutable preview branch. Preserve business behavior behind a host rollback flag during adoption.

Native `Button contentMode="custom"` renders host Text/View children directly, preserving layouts with separate identity and trailing nodes. The root retains minimum target, disabled/busy, propagation, ref and accepted-feedback behavior. Hosts own visible busy content in this mode; `busyLabel` still controls the accessible busy suffix. Keep child content noninteractive and give icon-only actions an accessible label.

Native `Link` accepts a forwarded View ref, root Pressable props and `contentMode="custom"` for host label/icon nodes. Required `href` retains its destination. Without `onPress`, it opens through Linking and reports failures to `onError`; a supplied `onPress` replaces that navigation so host WebBrowser/route handlers run exactly once. Disabled links reject activation. The root always has link semantics.

The catalog browser gate measures controls at both densities, including their clickable wrapping labels for checkbox, radio and switch inputs. Only inline prose links matching `p .hig-link` are exempt from the target minimum (WCAG 2.5.8 inline-text exception); standalone and breadcrumb links retain the full target. Hidden controls are not targets.
