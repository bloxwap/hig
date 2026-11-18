# Overlays

Dialogs, sheets, menus, and contextual help with explicit dismissal and focus behavior.

Includes `Dialog`, `AlertDialog`, `Sheet`, and `Menu`. `Popover` and `Tooltip` are web-only; native help uses persistent `HelpText`.

Issue #16. Entry: `overlay`. Import platform entries from `@bloxwap/hig/react/overlay` or `@bloxwap/hig/native/overlay` according to applicability below. Import `@bloxwap/hig/react/css` once on web; tokens CSS is a separate explicit import.

## API and anatomy

| Component | Key props and behavior |
| --- | --- |
| `Dialog` | Controlled `open` and `onOpenChange`, plus `title`, `description`, and `children`. The web `trigger` is one element that accepts a ref. `closeLabel` overrides the Close button (`Sheet`, web `Popover`, native `Menu` and `GestureSheet` too); web `AlertDialog` takes `cancelLabel`. Defaults come from HIGProvider [`messages`](https://bloxwap.github.io/hig/docs/guides/foundations/localization/#built-in-component-strings). |
| Web host composition | `title` remains required; `titleHidden` keeps its accessible name when the host renders a visible heading in the card. `description` is optional; `descriptionHidden` keeps supplied supporting text available to assistive technology. `contentRef` reaches the actual modal element. `contentProps` accepts layout classes/styles, DOM attributes and Radix focus/Escape/outside events; HIG retains ownership of the dialog id, role, naming associations, locale, direction, children and mounting behavior. Owned props and `dangerouslySetInnerHTML` are filtered at runtime for JavaScript callers too; the caller's object is left unchanged. |
| Web close control | Omit `closeButton` for the current translated action, pass a ref-capable button element for a custom control, or pass `null` when the host supplies its own explicit dismissal action. Custom controls are composed with Radix Close; disabled buttons and `event.preventDefault()` retain their normal behavior. `closeLabel`/`cancelLabel` label only the default action. |
| Optional web `GestureSheet` | A separate Vaul modal root owns real drag, optional fixed snap points, scroll handoff and focus scope. The Dialog title/description, trigger, close control and `contentRef` contracts apply. For fixed detents, `backendProps` retains typed Vaul flags and snap-point options. For opt-in content sizing, use top-level `enableDynamicSizing` with optional `maxDynamicContentSize` and omit Vaul snap props. `contentProps` retains host layout, DOM data attributes, focus/Escape/outside events and pointer capture events. `handleProps`/`handleRef` customize the actual backend handle; `handle={false}` omits it. `overlayProps` observes outside-pointer actions or retains host overlay styling. `labelledBy` (0.8.0) names the sheet by a heading inside it, such as a block's `headingId`: the sheet takes `aria-labelledby` with that id, and its own `title` stays for the backend but is visually hidden and hidden from assistive technology, so the sheet's name is read once. |
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

Install `vaul ^1.1.2` and import `GestureSheet` from `@bloxwap/hig/react/gesture-sheet`. Core `overlay`, Button and overlay-free blocks do not import or install Vaul. The backend supplies its own motion CSS when loaded; HIG's explicitly imported component CSS supplies scoped surface, text, geometry and reduced-motion rules. See the official [Vaul anatomy and API](https://vaul.emilkowal.ski/api) and the verified [1.1.2 source](https://github.com/emilkowalski/vaul/blob/v1.1.2/src/index.tsx).

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

`contentMode='default'` provides padded, scrolling anatomy. `custom` leaves padding and scrolling with the host. The required accessible title remains available when hidden; render a real visible heading when the host card needs one. `closeButton={null}` means the host must retain an explicit accessible close/Back action. `handleOnly=true` requires the actual handle for dragging. Handle styles, classes and capture events are customizable; HIG filters replacements for the backend's handle pointer/click handlers, hidden state and reserved `data-vaul-*` attributes. Frozen caller prop objects remain unchanged.

Backend defaults remain Vaul's: `handleOnly=false`, `repositionInputs=true`, `shouldScaleBackground=false`, `dismissible=true` and `autoFocus=false`. Retain existing host flags explicitly. With `autoFocus=false`, hosts may use `contentProps.onOpenAutoFocus` to focus their heading/search control without requesting a software keyboard automatically. `shouldScaleBackground=true` requires the host's `[data-vaul-drawer-wrapper]` around the page. Physical `backendProps.direction` is independent of the provider's text direction. Fixed snap points retain Vaul's viewport geometry. The modal root stays controlled and modal; there is no second nested HIG Dialog root.

For content-sized sheets, set top-level `enableDynamicSizing` and omit `backendProps.snapPoints`, `snapPoint`, `activeSnapPoint`, `setActiveSnapPoint`, `fadeFromIndex`, and `snapToSequentialPoint`. Dynamic sizing and those Vaul snap props are mutually exclusive; fixed snapping remains the other explicit mode. `maxDynamicContentSize` is an optional finite positive content-height ceiling in CSS pixels; the viewport ceiling still applies. Content growth and shrinkage update the open sheet smoothly without remounting its children or repeating open focus. Reduced motion applies the new size without height animation, and unavailable measurement or animation capabilities use a static final size. Dynamic height applies to top/bottom sheets; other physical directions retain their static layout. The controlled dynamic example in the catalog uses real React and React Native content expansion/collapse.

The host can reject `onOpenChange(false)` while pending; HIG restores Vaul's last resting motion styles after a rejected drag without remounting card state. Use `dismissible=false` as well when pending should prevent dismissal attempts altogether. Backend `onAnimationEnd` is observed only when its reported state still matches controlled `open`, so rejected closes and stale opposite-state callbacks cannot clear retained card state. Programmatic state changes keep the backend's callback behavior. Reduced motion removes the sheet/overlay animation and transition; drag and fixed snap selection still work. Viewport constraints, editable-input blur policy, safe-area padding and product-specific keyboard accessory reserves stay in the host.

`scripts/gesture-sheet-browser-smoke.mjs` exercises the real Vaul backend in Chromium and WebKit: drag/scroll handoff, handle-only drag, controlled veto with retained input identity, nondismissible state, snap expansion, dynamic growth/shrink and capped scrolling, rapid resize interruption, focus/node identity, focus trap/Escape/return, viewport resizing, host styles/refs and reduced motion. Evidence in `evidence/web-gesture-sheet/` records the exact source baseline and dirty state. Desktop viewport resizing does not certify physical mobile software-keyboard behavior; that remains a host/device observation.

### Views that swap (`GestureSheetView`)

A sheet that walks through several views, such as choose, review and done, wraps them in `GestureSheetView` from the same entry and names the current one with `viewKey`:

```tsx
<GestureSheet open={open} onOpenChange={setOpen} title="Buy Bitcoin" titleHidden closeButton={null} enableDynamicSizing>
  <GestureSheetView viewKey={step}>
    {step === 'fees' ? <Fees/> : step === 'review' ? <Review/> : <Choose/>}
  </GestureSheetView>
</GestureSheet>
```

When `viewKey` changes, the old view fades and shrinks slightly out of the way without holding its space, the new view fades in at its own size, and the content-sized sheet moves to the new height at the same time. All three share one curve, `cubic-bezier(.26,.08,.25,1)`, with no spring and no overshoot: the old view and the height take 270ms and the new view 220ms, the values of Vaul's Dynamic Drawer. Going deeper and going back look the same, as in Vaul: there is no push or pop direction. The first view appears with the sheet. The outgoing view is inert and hidden from assistive technology while it leaves. Under reduced motion, and where the browser cannot animate, the views swap at once. Give every view its own way out, since `closeButton={null}` removes the built-in Close. The native preview engine has no view component: its content is swapped by the host and the sheet moves to the new height.

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

- **Why it stays smooth.** While the sheet moves, only its `translateY` and the backdrop's opacity change, both on the UI thread. Nothing is laid out per frame, whatever the content weighs. Opening, closing, snapping and resizing use the measured Vaul Dynamic Drawer curve, `cubic-bezier(.26,.08,.25,1)`, over 270 ms. The surface is rasterised on Android (`renderToHardwareTextureAndroid`).
- **Sizing.** `snapPoints` are points or a percentage of the room under `topInset`, sorted for you, with `initialIndex` counted from the lowest. Fixed content is laid out once at the tallest detent, so at a lower detent its lower part is off screen, as in Vaul. `enableDynamicSizing` gives one detent as tall as the content, up to `maxDynamicContentSize`; when the content changes height the content is laid out at once and the sheet moves to the new height in 270ms.
- **Drag.** The whole sheet drags. A slow release takes the nearest detent, or closes past half way below the lowest. A flick (500 points per second or faster, after the sheet has moved 24 points) moves one detent in its direction; from the lowest it closes when its momentum would carry the sheet a quarter of the way to closed, so a nudge does not dismiss it. A drag that began by scrolling the content is always a placement: flinging a list back to its top does not throw the sheet away. Above the top detent the sheet resists. A drag can be caught mid-motion.
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
