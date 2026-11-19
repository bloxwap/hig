# Overlays

Dialogs, sheets, menus, and contextual help with explicit dismissal and focus behavior.

Includes `Dialog`, `AlertDialog`, `Sheet`, and `Menu`. `Popover` and `Tooltip` are web-only; native help uses persistent `HelpText`.

Issue #16. Entry: `overlay`. Import platform entries from `@bloxwap/hig/react/overlay` or `@bloxwap/hig/native/overlay` according to applicability below. Import `@bloxwap/hig/react/css` once on web; tokens CSS is a separate explicit import.

## API and anatomy

| Component | Key props and behavior |
| --- | --- |
| `Dialog` | Controlled `open` and `onOpenChange`, plus `title`, `description`, and `children`. The web `trigger` is one element that accepts a ref. `closeLabel` overrides the Close button (`Sheet`, web `Popover`, native `Menu` and `GestureSheet` too); web `AlertDialog` takes `cancelLabel`. Defaults come from HIGProvider [`messages`](../foundations/localization.md#built-in-component-strings). |
| Web host composition | `title` remains required; `titleHidden` keeps its accessible name when the host renders a visible heading in the card. `description` is optional; `descriptionHidden` keeps supplied supporting text available to assistive technology. `contentRef` reaches the actual modal element. `contentProps` accepts layout classes/styles, DOM attributes and Radix focus/Escape/outside events; HIG retains ownership of the dialog id, role, naming associations, locale, direction, children and mounting behavior. Owned props and `dangerouslySetInnerHTML` are filtered at runtime for JavaScript callers too; the caller's object is left unchanged. |
| Web close control | Omit `closeButton` for the current translated action, pass a ref-capable button element for a custom control, or pass `null` when the host supplies its own explicit dismissal action. Custom controls are composed with Radix Close; disabled buttons and `event.preventDefault()` retain their normal behavior. `closeLabel`/`cancelLabel` label only the default action. |
| Optional web `GestureSheet` | A Radix modal dialog moved by HIG's own drag engine: real drag, optional fixed snap points, scroll handoff and focus scope. The Dialog title/description, trigger, close control and `contentRef` contracts apply. For fixed detents, `backendProps` carries the engine's typed options and snap points. For opt-in content sizing, use top-level `enableDynamicSizing` with optional `maxDynamicContentSize` and omit the snap props. `contentProps` retains host layout, DOM data attributes, focus/Escape/outside events and pointer events. `handleProps`/`handleRef` customize the drag handle; `handle={false}` omits it. `overlayProps` observes outside-pointer actions or retains host overlay styling. `labelledBy` (0.8.0) names the sheet by a heading inside it, such as a block's `headingId`: the sheet takes `aria-labelledby` with that id, and its own `title` stays for the backend but is visually hidden and hidden from assistive technology, so the sheet's name is read once. |
| Native focus targets | `initialFocusRef` and `returnFocusRef` accept live focus targets. Initial focus defaults to the title; the host supplies the trigger ref (Menu and Select pass their own trigger). |
| `Menu` | `label` and items with `label`, optional `disabled`, and `onSelect`. |
| Web `Popover` | `label` is the text of the built-in trigger, a secondary Button, and `children` the content, followed by a Close button (`closeLabel`). 0.8.0, all optional with unchanged defaults: `open` / `onOpenChange` control it (or `defaultOpen` with its own state); `trigger` is the host's own trigger, one element that accepts a ref and spreads its props, such as an `IconButton` or a badge `<button>`, and `label` then names the popover (`aria-label` on its content); `openOnHover` also opens it while a mouse rests on the trigger, without moving focus, and closes it 150ms after the pointer leaves both the trigger and the popover, unless a click on the trigger pinned it open (the click that follows a hover does not toggle it shut; Escape, a press outside or a second trigger click closes a pinned one; touch and pen keep press to open); `hideClose` leaves out the Close button, for information the user dismisses with Escape, a press outside or the trigger; `testID` is the content's `data-testid`; `tone` (`info`, `positive`, `warning` or `negative`, type `PopoverTone`) tints the surface from that token role, a 12% wash over the popover fill, a 40% stroke and a soft 24px glow, as `data-tone` on the content (the role's colour is `--hig-popover-tone`, which the host may set in `style` for a colour outside the roles, such as a gold badge's tint); `className` adds classes after `hig-popover` and `style` adds inline style after the theme's variables, for a host surface treatment. Type `PopoverProps`. |
| Optional native `GestureSheet` | `contentMode='default'` scrolls the title, optional description, children and Close action. `contentMode='custom'` provides a content container with 16 units of horizontal padding. Fixed mode is full-height while dynamic mode reports intrinsic content height. The host owns custom header, back/close actions, safe-area content padding and scrolling. `title` remains required as the accessible name. Pass `titleRef` attached to the caller's accessible heading to focus it on open; without it, the sheet focuses its visually hidden title. `labelledBy` (0.8.0) takes the `nativeID` of a heading inside the sheet, such as a block's `headingId`, and sets `accessibilityLabelledBy` on the sheet's content (Android; iOS keeps `title`). |

Native `Dialog` and its aliases support `contentMode='custom'`: host content/actions, required `title`, one HIG Modal owning Back, accessibility escape and focus. `titleRef` targets the host heading (otherwise hidden); `initialFocusRef` overrides it, `returnFocusRef` targets the trigger. Rejected close retains focus.

`stageComponent` accepts `GestureHandlerRootView`; `stageStyle`/`stageTestID` configure it. `backdrop` supplies the scrim/action; `contentStyle`/`testID` configure the surface. Preserve accessible descendants and close policy; never nest Modals.

`animationType` defaults to `none`; reduced motion forces `none`. Animated iOS focus return waits for [iOS-only `onDismiss`](https://reactnative.dev/docs/modal#ondismiss); Android restores next frame. Keep mounted with `open={false}` through dismissal. Reopen/unmount cancels restoration.

A web card can keep its own visible heading and close geometry without replacing the modal's focus scope:

```tsx
<Dialog
  open={open}
  onOpenChange={(next) => {
    if (!next && pending) return;
    setOpen(next);
  }}
  title={t('reviewTitle')}
  titleHidden
  description={t('reviewDescription')}
  descriptionHidden
  contentRef={panelRef}
  contentProps={{ className: 'host-review-card', style: { maxWidth: 420 } }}
  closeButton={<button type='button' disabled={pending} aria-label={t('close')}>×</button>}
>
  <h2>{t('reviewTitle')}</h2>
  {reviewContent}
</Dialog>
```

Here `t`, `panelRef`, the card content and pending state belong to the host. The visible heading remains a real heading; the hidden Radix title supplies the modal's accessible name. An omitted description removes its ARIA association instead of referencing a missing element. `contentProps.onOpenAutoFocus` and `onCloseAutoFocus` can prevent the default focus choice; the host then supplies the intended focus target. Other content events retain Radix cancellation semantics. Controlled `onOpenChange` can reject a pending wallet close without unmounting the dialog or moving focus back to the trigger. `AlertDialog` continues to prevent outside-pointer dismissal even when a host observes that event.

These web composition props apply to `Dialog`, `AlertDialog` and the static `Sheet` alias. They do not add drag gestures, detents or product keyboard heuristics to the static sheet.

For a native card stack, import `GestureSheet` from `@bloxwap/hig/native/gesture-sheet` and render the caller's cards directly:

```tsx
const titleRef = useRef<Text>(null);

<GestureSheet
  open={open}
  onOpenChange={setOpen}
  title={card.title}
  titleRef={titleRef}
  contentMode='custom'
  snapPoints={card.snapPoints}
  returnFocusRef={triggerRef}
>
  <View style={{ flex: 1 }}>
    <Heading ref={titleRef}>{card.title}</Heading>
    {card.content}
    <Button onPress={() => setOpen(false)}>Done</Button>
  </View>
</GestureSheet>
```

Here `Text` and `View` are React Native types/components, and the host supplies the card state and its own accessible back/close labels. Custom content scrolls in `GestureSheetScrollView`, or in a list drawn through it with `renderScrollComponent`, without an outer scroll view. `snapPoints` may change while open: the current detent index is retained, or clamped to the highest remaining index if its detent was removed. Detent changes keep the sheet mounted and do not repeat open focus. Keep at least one sorted snap point; `initialIndex` applies to the next presentation. Focus return, Android Back, reduced-motion and dismissible backdrop behavior apply in both content modes.

For content-sized native cards, set `enableDynamicSizing` and omit `snapPoints`. The sheet takes one detent as tall as its content, up to `maxDynamicContentSize`, rather than adding a competing fixed point. Choose the sizing mode for the presentation and avoid `flex: 1` or a full-height constraint on content that should determine its own height. Bound a long card's own scroll view, and scroll it with `GestureSheetScrollView` so a pull from the top of the content moves the sheet. When the content changes height it is laid out at once and the sheet moves to the new height.

```tsx
<GestureSheet
  open={open}
  onOpenChange={setOpen}
  title='Size and leverage'
  contentMode='custom'
  enableDynamicSizing
  maxDynamicContentSize={availableHeight}
>
  <View>{contentSizedCard}</View>
</GestureSheet>
```

`maxDynamicContentSize` is an optional finite positive ceiling in native points; the backend container height is the default. The dynamic detent uses index `0`. Content growth, shrinkage and ceiling changes keep the presentation and card state, and height updates do not repeat open focus. Reduced motion applies HIG's no-animation backend policy; compositions that cannot safely report intrinsic height use the fixed-size alternative described above. A fixed sheet still requires a nonempty `snapPoints` list. `enableContentPanningGesture` passes through to the backend, allowing hosts with an independently scrolling list to disable content panning without changing their close/Back actions.

Close, Android Back and iOS accessibility escape use the same controlled close request. If the host rejects the request and controlled `open` remains true, HIG retries presentation after host state settles, retaining the card and its state instead of leaving a backend-dismissed but logically open sheet. Rejected closes and interrupted reopenings do not return focus or call `onDismiss`; hosts may use that settled callback to clear retained state only after an accepted close. `onHardwareBackPress` can consume Android Back (`true`) or defer to the host's nested-card dispatcher (`false`); omitting it keeps the default dismissal behavior. Accessibility escape is a platform contract, not a physical VoiceOver certification.

`topInset` and `bottomInset` default to safe-area values; use `0` for an intentional flush edge. `handleComponent` (including `null` for an overlay handle), `handleStyle`, `handleIndicatorStyle`, `backgroundComponent` and `backgroundStyle` retain host geometry and decoration. Sheet content is raised by default, so wells, list rows and quiet fills step up one shade against HIG's `overlay` fill; a host whose background paints the page `background` passes `raised={false}` so those fills match the page. The backend measures the rendered handle. Use `useColors()` in custom backgrounds. `modalRef` exposes the optional backend's imperative motion methods; hosts must keep controlled `open` in sync with `present()`/`dismiss()`. Focus return and settled `onDismiss` remain controlled by the HIG wrapper. `animateOnMount`, `animationConfigs` and `backdropComponent` retain host entry motion and backdrop styling; the reduced-motion mapping still applies. A custom backdrop must honor the host dismissal policy.

Keyboard handling is not configurable. iOS lifts the sheet over the keyboard, and Android resizes the window, which the sheet reads as new room. The `keyboardBehavior`, `keyboardBlurBehavior` and `android_keyboardInputMode` options of the earlier backend went with it.

For a screen-level drawer that must prepare and retain its native children while closed, choose `presentation='inline'`; the default remains `presentation='modal'`, which draws in the nearest `GestureSheetHost`. Inline content stays mounted while closed, hidden from accessibility and touch, and registers no Back listener while closed. Opening and reopening keep child/controller/list state. Rejected closes restore the last open detent; accepted closes return focus and call `onDismiss` once after settling. The sheet is driven by `open` alone and has no imperative ref. `onChange(index)` reports the detent the sheet settled on. Hosts own screen-level backdrop/container layering for inline presentation, and an inline sheet needs no `GestureSheetHost`.

## Optional web gesture backend

Install `@radix-ui/react-dialog ^1.1.15` and import `GestureSheet` from `@bloxwap/hig/react/gesture-sheet`. The sheet is a Radix modal dialog, which supplies the portal, focus scope, Escape, outside press and naming, moved by HIG's own drag engine. No gesture package is needed and `vaul` is no longer a peer. Core `overlay`, Button and overlay-free blocks do not load the engine. HIG's explicitly imported component CSS supplies the surface, text, geometry and handle rules. The engine writes the motion inline: `transform`, `transition` and `will-change` on the sheet and `opacity`, `transition` and `will-change` on the overlay belong to it, and a host value for them in `contentProps.style` or `overlayProps.style` is not kept. The sheet behaves like [Vaul](https://vaul.emilkowal.ski), and its numbers and release rules are the shared sheet model's, `@bloxwap/hig/contracts/gesture-sheet`, which the native sheet uses too.

```tsx
import {GestureSheet} from '@bloxwap/hig/react/gesture-sheet';

<GestureSheet
  open={open}
  onOpenChange={(next) => { if (next || !pending) setOpen(next); }}
  title={t('markets')}
  titleHidden
  contentMode='custom'
  contentRef={panelRef}
  contentProps={{ className: 'host-market-card', style: { bottom: viewportBottom, maxHeight: availableHeight } }}
  backendProps={{ handleOnly: false, repositionInputs: false, shouldScaleBackground: true, dismissible: !pending }}
  handleProps={{ style: { width: 100 }, preventCycle: true }}
  closeButton={null}
>
  <h2>{t('markets')}</h2>
  {hostHeaderAndScrollableContent}
</GestureSheet>
```

`contentMode='default'` provides padded, scrolling anatomy. `custom` leaves padding and scrolling with the host. The required accessible title remains available when hidden; render a real visible heading when the host card needs one. `closeButton={null}` means the host must retain an explicit accessible close/Back action. `handleOnly=true` requires the actual handle for dragging. Handle styles, classes and capture events are customizable; HIG filters replacements for the handle's own pointer/click handlers, hidden state and the reserved `data-hig-sheet-*` attributes. Frozen caller prop objects remain unchanged.

The engine's defaults are Vaul's: `handleOnly=false`, `repositionInputs=true`, `shouldScaleBackground=false`, `dismissible=true` and `autoFocus=false`. Retain existing host flags explicitly. With `autoFocus=false`, hosts may use `contentProps.onOpenAutoFocus` to focus their heading/search control without requesting a software keyboard automatically. `shouldScaleBackground=true` requires the host's `[data-hig-sheet-wrapper]` around the page. Physical `backendProps.direction` is independent of the provider's text direction. The modal root stays controlled and modal; there is no second nested HIG Dialog root.

#### Motion

- **What moves.** While the sheet moves, only its `transform` and the overlay's `opacity` change, plus the `transform` of the page behind with `shouldScaleBackground`. Nothing is laid out per frame: the sheet is measured once when it opens, closes or is picked up, and when the viewport resizes. `will-change` is set for the length of a drag or a travel and removed when the sheet rests. A sheet resting at its full height carries no inline `transform`.
- **Travel.** Opening, closing, moving between detents and returning after a drag take 500 ms on `cubic-bezier(.32,.72,0,1)` (`SHEET_TRAVEL`), as a CSS transition. The overlay fades over the same time on the same curve. The sheet stays mounted after `open` turns false until its closing travel ends, and focus returns then.
- **Drag.** A drag follows the pointer 1:1 with no transition, and the overlay follows the sheet. Past the tallest detent the sheet resists, following less the further it is pulled (at most 64 px past its full height), and with `dismissible=false` it resists past the lowest detent instead of closing (`dragPosition`). A press becomes a drag after 2 px with a mouse and about 10 px with a finger. A sheet that is still travelling can be picked up: the drag starts from where the sheet is drawn, not from where it was going.
- **Release.** The release velocity is read from the last 100 ms of pointer movement, and `releaseTarget` decides. A slow release takes the nearest detent, or closes once the sheet is past a quarter of the way from the lowest detent to closed (`closeThreshold`). A flick, 400 px/s or faster after at least 24 px of movement, steps one detent in its direction, and from the lowest detent it closes when its momentum carries the sheet past the closing line. A throw, 2000 px/s or faster with several detents, goes to the tallest detent or closes. A close started by a drag continues from where the sheet was let go.
- **Scroll handoff.** At its tallest detent the content comes first: a drag that starts in content scrolled away from its top scrolls the content, a pull down at the top moves the sheet, a move toward open scrolls, and after the content scrolls the sheet does not start moving for `scrollLockTimeout` (100 ms). A drag that began as a scroll is never read as a flick. Below its tallest detent, the sheet moves first. Selected text, text and range `input`s, `textarea`, `select`, editable content and anything inside `data-hig-sheet-no-drag` do not start a drag. The handle always drags. On a touch screen the engine decides on the first touch move and stops the browser scrolling only when the sheet takes the drag. The click that ends a drag is not delivered to what lies under the pointer.
- **Declined close.** The host can keep `open` true after `onOpenChange(false)`. A sheet dragged to a close then waits where it was let go for one frame and returns to its detent on the travel timing; its children are not remounted and its inline styles need no restoring. Use `dismissible=false` as well when pending should prevent dismissal attempts altogether.
- **Reduced motion.** Under `HIGProvider reducedMotion` there is no travel and no resize animation: the sheet and the overlay are placed at once. Drag and detent selection still work.
- **Content sizing.** A content-sized sheet moves to a new height in 270 ms on `cubic-bezier(.26,.08,.25,1)` (`SHEET_RESIZE`), animating `translate`, a property separate from the engine's `transform`.

Where the browser has no `Element.getAnimations` the sheet is placed without travel.

#### Engine options (`backendProps`)

| Option | Default | Behaviour |
| --- | --- | --- |
| `direction` | `'bottom'` | The edge the sheet rests on and closes toward: `'bottom'`, `'top'`, `'left'` or `'right'`. |
| `snapPoints` | none | Fixed detents, from the least visible up. A number is a share of the viewport along the sheet's axis (`0.4` is 40%); a string is CSS pixels (`'320px'`) or a percentage. The sheet's own height must reach the tallest detent, for example `height: 100dvh`. A point that is not positive and finite, or over 100%, throws. |
| `activeSnapPoint`, `setActiveSnapPoint` | first point | The controlled detent, one of `snapPoints`. Omitted, the sheet keeps its own. `null` or a value not in `snapPoints` reads as the first. After a close it is set back to the first. A detent the host declines sends the sheet back a frame later. |
| `fadeFromIndex` | last point | The overlay is drawn from this detent up and fades between it and the detent below, or closed. |
| `snapToSequentialPoint` | `false` | A throw steps one detent like a flick instead of going to the tallest or closing. |
| `handleOnly` | `false` | Only the handle drags. |
| `dismissible` | `true` | `false` stops Escape, an outside press, the close button and a drag from requesting a close. The host can still set `open` false. |
| `closeThreshold` | `0.25` | The share of the way from the lowest detent to closed past which a release closes. It moves the line a flick's momentum must reach as well. |
| `scrollLockTimeout` | `100` | Milliseconds after the content scrolls during which a drag does not move the sheet. |
| `autoFocus` | `false` | `true` lets the dialog focus its first focusable element on open. |
| `shouldScaleBackground` | `false` | Scales `[data-hig-sheet-wrapper]` back by 26 px of width and lowers it 14 px plus the top safe area while the sheet is at a detent, following a drag between the lowest detent and closed. The wrapper gets an 8 px radius and `overflow: hidden` for as long as the sheet is mounted; its inline styles are restored after the close. |
| `setBackgroundColorOnScale` | `true` | With `shouldScaleBackground`, paints the body black behind the scaled page. |
| `noBodyStyles` | `false` | Leaves the body's inline styles alone: no black background and no Safari position pin. |
| `repositionInputs` | `true` | Keeps a bottom sheet above the software keyboard. While a text field in the sheet is focused and the visual viewport is more than 60 px shorter than the layout viewport, the sheet's inline `bottom` rises by the difference, and a sheet too tall for the space left is shortened with an inline `height`: one over 80% of the viewport keeps its top edge, a shorter one keeps 26 px clear. Both are restored when the keyboard goes. With `snapPoints` the sheet only rises; its detents are not recomputed. Top and side sheets are not moved. |
| `fixed` | `false` | With `repositionInputs`: the sheet is shortened by the keyboard and keeps its top edge instead of riding up. |
| `disablePreventScroll` | `true` | With `repositionInputs`, on iOS: a text field is focused while moved off screen, so the page does not scroll to it, and is then scrolled into view inside the sheet. `false` leaves focus to the browser. The name is Vaul's; `true` turns the guard on. |
| `preventScrollRestoration` | `false` | After the Safari position pin, does not restore the page scroll when the URL changed while the sheet was open. |
| `container` | `document.body` | Portal target. Percentage detents and the closed position are measured against it. |
| `onDrag(event, percentageDragged)` | none | Every pointer move of a drag, with the React pointer event. `percentageDragged` is the share of the overlay that has faded: 0 at the fade detent, 1 at closed. |
| `onRelease(event, open)` | none | The end of a drag, with whether the sheet stays open. |
| `onAnimationEnd(open)` | none | An open or close that the sheet requested and the host accepted has finished its travel. A change the host makes on its own, and a request it declines, do not report. |

In Safari outside standalone display mode the body is pinned with `position: fixed` while the sheet is open and released, with the scroll position, when the close starts. A tap on the handle steps up one detent and requests a close from the tallest; `handleProps.preventCycle` turns that off, and a sheet without `snapPoints` ignores the tap. `open`, `onOpenChange`, `modal`, `defaultOpen`, `nested` and `onClose` are not options: HIG owns the controlled modal root.

#### Attributes

| Attribute | On | Meaning |
| --- | --- | --- |
| `data-hig-sheet` | the sheet | Marks the dialog element. |
| `data-hig-sheet-direction` | the sheet | `bottom`, `top`, `left` or `right`. |
| `data-hig-sheet-snap-points` | the sheet | `true` with fixed detents, otherwise `false`. |
| `data-hig-sheet-dragging` | the sheet | Present during a drag. |
| `data-hig-sheet-overshoot` | the sheet | Present while a sheet flush with its edge is pulled past its full height, until it is back; the stylesheet trails its fill behind it. |
| `data-hig-sheet-overlay` | the overlay | Marks the overlay. |
| `data-hig-sheet-handle`, `data-hig-sheet-handle-hitarea` | the handle | The handle and its 44 px press target. |
| `data-hig-sheet-wrapper` | host page wrapper | The element `shouldScaleBackground` scales. Set by the host. |
| `data-hig-sheet-no-drag` | host content | A press inside does not drag the sheet. Set by the host. |

These replace Vaul's `data-vaul-drawer`, `data-vaul-drawer-direction`, `data-vaul-snap-points`, `data-vaul-overlay`, `data-vaul-handle`, `data-vaul-handle-hitarea`, `data-vaul-drawer-wrapper` and `data-vaul-no-drag`, and its `vaul-dragging` class. `data-vaul-animate`, `data-vaul-delayed-snap-points`, `data-vaul-custom-container`, `data-vaul-snap-points-overlay` and `data-vaul-drawer-visible` have no successor, and neither have the `--initial-transform` and `--snap-point-height` custom properties. `data-state` is still Radix's `open` or `closed`.

#### Where it differs from Vaul

- A sheet can be dragged as soon as it appears; Vaul ignores drags for 500 ms after opening.
- With `dismissible=false` and no detents the sheet resists a drag; in Vaul it does not move.
- A flick closes only when its momentum reaches the closing line, and counts only after 24 px of movement; Vaul closes on any release faster than 0.4 px/ms.
- The handle drags the sheet whatever the content has scrolled to, form controls never start a drag, and a top sheet hands off at the end of its content rather than its start.
- A sheet that floats above its edge closes past the gap without a `--initial-transform` value.
- The fill Vaul draws beyond the resting edge of every sheet is drawn for top and bottom sheets with `contentMode='custom'` and fixed sizing, the only ones that do not clip it. The others trail a 64 px strip while they are pulled past their full height.
- The scaled page keeps one radius instead of animating it, and follows a drag only between the lowest detent and closed.
- `onAnimationEnd` reports when the travel ends, at once under reduced motion; Vaul reports on a 500 ms timer.
- A tap on the handle acts at once and does nothing without `snapPoints`; Vaul waits 120 ms and ignores a press longer than 250 ms.
- The click that ends a drag is swallowed, snap points are validated, and the sheet is not `touch-action: none`: only the handle is.

For content-sized sheets, set top-level `enableDynamicSizing` and omit `backendProps.snapPoints`, `snapPoint`, `activeSnapPoint`, `setActiveSnapPoint`, `fadeFromIndex`, and `snapToSequentialPoint`. Dynamic sizing and those snap props are mutually exclusive; fixed snapping remains the other explicit mode. `maxDynamicContentSize` is an optional finite positive content-height ceiling in CSS pixels; the viewport ceiling still applies. Content growth and shrinkage update the open sheet smoothly without remounting its children or repeating open focus. Reduced motion applies the new size without height animation, and unavailable measurement or animation capabilities use a static final size. Dynamic height applies to top/bottom sheets; other physical directions retain their static layout. The controlled dynamic example in the catalog uses real React and React Native content expansion/collapse.

Viewport constraints, editable-input blur policy, safe-area padding and product-specific keyboard accessory reserves stay in the host.

`scripts/gesture-sheet-browser-smoke.mjs` exercises the engine in Chromium and WebKit: drag/scroll handoff, handle-only drag, controlled veto with retained input identity, nondismissible state, snap expansion, dynamic growth/shrink and capped scrolling, rapid resize interruption, focus/node identity, focus trap/Escape/return, viewport resizing, host styles/refs and reduced motion. `tests/gesture-sheet-engine.dom.test.tsx` covers the travel timing, release decisions, catching a moving sheet, the declined close, scroll handoff, `handleOnly`, reduced motion, background scaling and keyboard repositioning against a simulated layout. Desktop browsers and a simulated viewport do not certify finger gestures, the software keyboard or the iOS focus guard on a physical phone; that remains a host/device observation.

### Views that swap (`GestureSheetView`)

A sheet that walks through several views, such as choose, review and done, wraps them in `GestureSheetView` from the same entry and names the current one with `viewKey`:

```tsx
<GestureSheet open={open} onOpenChange={setOpen} title="Buy Bitcoin" titleHidden closeButton={null} enableDynamicSizing>
  <GestureSheetView viewKey={step}>
    {step === 'fees' ? <Fees/> : step === 'review' ? <Review/> : <Choose/>}
  </GestureSheetView>
</GestureSheet>
```

When `viewKey` changes, the old view fades and shrinks slightly out of the way without holding its space, the new view fades in at its own size, and the content-sized sheet moves to the new height at the same time. All three share one curve, `cubic-bezier(.26,.08,.25,1)`, with no spring and no overshoot: the old view and the height take 270ms and the new view 220ms (`SHEET_RESIZE` and `SHEET_VIEW_ENTER` in the shared sheet model, the values of Vaul's Dynamic Drawer). Going deeper and going back look the same: there is no push or pop direction. The first view appears with the sheet. The outgoing view is inert and hidden from assistive technology while it leaves. Under reduced motion, and where the browser cannot animate, the views swap at once. Give every view its own way out, since `closeButton={null}` removes the built-in Close. The native preview engine has no view component: its content is swapped by the host and the sheet moves to the new height.

## Native sheet engine

`@bloxwap/hig/native/gesture-sheet` is HIG's own sheet for iOS and Android, and the only native sheet HIG ships. It needs `react-native-reanimated`, `react-native-gesture-handler` and `react-native-safe-area-context`, and no sheet library. Through 0.9.3 this path wrapped `@gorhom/bottom-sheet` and the engine shipped beside it as `@bloxwap/hig/native/gesture-sheet-next`; that path is removed. Its arithmetic and lifecycle are tested; device measurements are listed with the evidence below.

```tsx
import {GestureSheet, GestureSheetHost, GestureSheetScrollView} from '@bloxwap/hig/native/gesture-sheet';

<GestureSheetHost>{/* once, around the screen */}
  <App/>
  <GestureSheet open={open} onOpenChange={setOpen} title="Markets" contentMode="custom" enableDynamicSizing>
    <GestureSheetScrollView>{rows}</GestureSheetScrollView>
  </GestureSheet>
</GestureSheetHost>
```

- **Why it stays smooth.** While the sheet moves, only its `translateY` and the backdrop's opacity change, both on the UI thread. Nothing is laid out per frame, whatever the content weighs. Opening, closing, moving between detents and returning after a drag travel for 500 ms on `cubic-bezier(.32,.72,0,1)` (`SHEET_TRAVEL`), Vaul's drawer motion; a content-sized sheet follows a new height in 270 ms on `cubic-bezier(.26,.08,.25,1)` (`SHEET_RESIZE`), the height transition of Vaul's Dynamic Drawer. Both values and the release rules come from `@bloxwap/hig/contracts/gesture-sheet`, which the web engine uses too. The surface is rasterised on Android (`renderToHardwareTextureAndroid`), and it rests and travels on whole device pixels, so that texture is never drawn soft.
- **When it starts to move.** A travel the host asks for arrives with a render: opening, the content has only just been mounted; closing, the screen behind is often drawn again. That frame is the costly one, so the sheet holds still for two display frames and then travels, and the travel never opens with a stall. The wait is counted in frames, so a slow frame extends it. A release from a drag is not held.
- **Sizing.** `snapPoints` are points or a percentage of the room under `topInset`, sorted for you, with `initialIndex` counted from the lowest. Fixed content is laid out once at the tallest detent, so at a lower detent its lower part is off screen, as in Vaul. `enableDynamicSizing` gives one detent as tall as the content, up to `maxDynamicContentSize`; when the content changes height the content is laid out at once and the sheet moves to the new height in 270ms.
- **Drag.** The whole sheet drags. A slow release takes the nearest detent, or closes once the sheet is past a quarter of the way from the lowest detent to closed. A flick, 400 points per second or faster after at least 24 points of movement, moves to the next detent in its direction; from the lowest it closes when its momentum would carry the sheet past the same quarter line. With several detents a throw, 2000 points per second or faster, goes straight to the tallest detent or closes. A drag across 40% of the room or more is placed where it is let go. A drag that began by scrolling the content is always a placement. Above the top detent the sheet resists. A drag can be caught mid-motion.
- **Views that swap.** The engine animates the height only. A host that swaps its content gets the sheet moving to the new height in 270ms on the web sheet's curve; the content itself changes at once. A cross-fade and a push and pop by depth were built and measured on a Seeker, and dropped a frame per swap with a 12ms median frame at 120Hz, so they were removed.
- **Scrolling content.** Use `GestureSheetScrollView`: at the top detent it scrolls, a pull down from the top of the content moves the sheet, and below the top detent the drag moves the sheet. Bounce and overscroll are off.
- **Presentation.** `modal` (default) draws in the nearest `GestureSheetHost` and is mounted from opening until its closing motion ends; without a host it draws in place. `inline` draws where it is rendered and keeps its children mounted while closed.
- **Dismissal.** Drag, a backdrop press, Android Back, the accessibility escape and the default Close ask through `onOpenChange(false)`; a host that keeps `open` gets the sheet back at its detent. `dismissible={false}` blocks all of them. `onDismiss` fires once after an accepted dismissal has finished moving; `onChange(index)` fires when the sheet settles on a detent.
- **Keyboard.** iOS lifts the sheet over the keyboard. Android resizes the window, which the sheet reads as new room.
- **Changed from the earlier backend.** Through 0.9.3 `native/gesture-sheet` wrapped `@gorhom/bottom-sheet`. Its backend-typed props are gone: `modalRef`, `sheetRef`, `handleComponent`, `backgroundComponent`, `backdropComponent`, `animationConfigs`, `containerStyle`, `keyboardBehavior` and `enableContentPanningGesture`. `handle`, `backgroundStyle`, `backdropOpacity` and `testID` take their place. Modal sheets need `GestureSheetHost` in place of `BottomSheetModalProvider`, and `@gorhom/bottom-sheet` is no longer a peer. A list inside the sheet scrolls through `GestureSheetScrollView`, which also hands the list its own scroll events. The sheet draws no shadow.

## When to use and examples

Do: repeat the order amount and give an explicit cancel action. Don’t: hide essential terms in hover help or execute confirm on open.

## States, interaction and accessibility

DOM Radix focus scopes restore trigger focus, trap modal focus, handle Escape and scroll locks. AlertDialog blocks outside-click dismissal. Menus use roving keyboard focus. Native Modal owns back and keyboard avoidance with scrollable content. Native overlays follow the host orientation: React Native's iOS Modal defaults `supportedOrientations` to portrait, so HIG passes every orientation and opening a Dialog, AlertDialog, Sheet, Menu or Select never rotates a landscape host back to portrait (observed on the iOS Simulator, `evidence/native-sim/ios/orientation/`). Hosts still decide which orientations the app supports.

State review: rest; keyboard focus/hover (DOM); accepted press and release/cancel; selected/checked where applicable; disabled; busy; inline error/recovery; empty/loading; long translations/large text; reduced motion; sound and haptics disabled. No host action occurs on mere focus. Disabled/busy targets suppress accepted activation. Core has no required feedback backend; the optional provider callback follows the action, honors cancellation and isolates errors.

## Platform mapping and limits

Basic Sheet uses static Modal layout. The separate optional `@bloxwap/hig/native/gesture-sheet` entry provides GestureSheet with sorted snapPoints, initialIndex, dismissible, safe-area and keyboard handling, reduced-motion mapping, native back, scoped listener cleanup and controlled dismissal deduplication. Rejected controlled closes return to their detent. See `fixtures/native/gesture-sheet.tsx` and `index-gesture.js` for the real separate consumer; packed smoke compiles both Android/iOS entry points. Hosts provide GestureHandlerRootView, SafeAreaProvider and GestureSheetHost. Required optional peers are Reanimated 4.1.1, Worklets 0.5.1, Gesture Handler 2.28.0 and Safe Area Context, pinned to Expo 54 bundledNativeModules rather than the newer monorepo native runtime. Mocked wiring and Metro compilation are not gesture-detent or TalkBack certification. With TalkBack on the Android emulator, opening Dialog/AlertDialog/Sheet/Menu moves accessibility focus to the heading and Back closes the overlay; without a `returnFocusRef` TalkBack falls back to the first screen element, so hosts should pass the trigger. VoiceOver does not run in the iOS Simulator, so VoiceOver focus restoration remains a physical-device observation (`evidence/native-sim/`). Native help is persistent text; no hover tooltip or anchored popover claim.

## Validation and citation

See `tests/gesture-sheet.dom.test.tsx`, `tests/native/gesture-sheet.test.cjs`, consumer fixtures and milestone evidence. Real Chromium/WebKit cases cover fixed detents and dynamic growth/shrink; `evidence/web-gesture-sheet/` records the exact inputs. RN 0.88 iOS Simulator checks in `evidence/native-number-flow/ios-inline/` verify short→tall→restored geometry in normal and reduced motion, plus retained inline state and rejected/accepted dismissal. Physical hardware, VoiceOver/TalkBack speech, software-keyboard behavior and baseline product comparisons are unperformed unless linked explicitly. Cite HIG 0.1.0 with this chapter anchor and a commit permalink, not a mutable preview branch. Preserve business behavior behind a host rollback flag during adoption.
