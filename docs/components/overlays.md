# Overlays · HIG 0.1.0

Dialogs, sheets, menus, and contextual help with explicit dismissal and focus behavior.

Includes `Dialog`, `AlertDialog`, `Sheet`, and `Menu`. `Popover` and `Tooltip` are web-only; native help uses persistent `HelpText`.

Issue #16. Entry: `overlay`. Import platform entries from `@bloxwap/hig-react/overlay` or `@bloxwap/hig-native/overlay` according to applicability below. Import `@bloxwap/hig-react/css` once on web; tokens CSS is a separate explicit import.

## API and anatomy

| Component | Key props and behavior |
| --- | --- |
| `Dialog` | Controlled `open` and `onOpenChange`, plus `title`, `description`, and `children`. The web `trigger` is one element that accepts a ref. `closeLabel` overrides the Close button (`Sheet`, web `Popover`, native `Menu` and `GestureSheet` too); web `AlertDialog` takes `cancelLabel`. Defaults come from HIGProvider [`messages`](../foundations/localization.md#built-in-component-strings). |
| Web host composition | `title` remains required; `titleHidden` keeps its accessible name when the host renders a visible heading in the card. `description` is optional; `descriptionHidden` keeps supplied supporting text available to assistive technology. `contentRef` reaches the actual modal element. `contentProps` accepts layout classes/styles, DOM attributes and Radix focus/Escape/outside events; HIG retains ownership of the dialog id, role, naming associations, locale, direction, children and mounting behavior. Owned props and `dangerouslySetInnerHTML` are filtered at runtime for JavaScript callers too; the caller's object is left unchanged. |
| Web close control | Omit `closeButton` for the current translated action, pass a ref-capable button element for a custom control, or pass `null` when the host supplies its own explicit dismissal action. Custom controls are composed with Radix Close; disabled buttons and `event.preventDefault()` retain their normal behavior. `closeLabel`/`cancelLabel` label only the default action. |
| Optional web `GestureSheet` | A separate Vaul modal root owns real drag, snap points, scroll handoff and focus scope. The Dialog title/description, trigger, close control and `contentRef` contracts apply. `backendProps` retains typed Vaul flags and snap-point options; `contentProps` retains host layout, DOM data attributes, focus/Escape/outside events and pointer capture events. `handleProps`/`handleRef` customize the actual backend handle; `handle={false}` omits it. `overlayProps` observes outside-pointer actions or retains host overlay styling. |
| Native focus targets | `initialFocusRef` and `returnFocusRef` accept live focus targets. Initial focus defaults to the title; the host supplies the trigger ref (Menu and Select pass their own trigger). |
| `Menu` | `label` and items with `label`, optional `disabled`, and `onSelect`. |
| Optional native `GestureSheet` | `contentMode='default'` scrolls the title, optional description, children and Close action. `contentMode='custom'` provides an unpadded, full-height content container; the host owns its header, back/close actions, safe-area content padding and scrolling. `title` remains required as the accessible name. Pass `titleRef` attached to the caller's accessible heading to focus it on open; without it, the sheet focuses its visually hidden title. |

Native `Dialog` (and its `AlertDialog`/static `Sheet` aliases) also accepts `contentMode='custom'`. HIG retains the single native `Modal`, required accessible `title`, Android Back, accessibility escape and focus lifecycle. The host supplies visible content and explicit close actions without an extra scroll view, padding, title, description or Close action. Pass `titleRef` on the caller's accessible heading; otherwise HIG renders and focuses a visually hidden heading. `initialFocusRef` overrides either title target, and `returnFocusRef` identifies the live trigger.

`stageComponent` can be `GestureHandlerRootView` to keep Android gesture controls inside the native Modal. `stageStyle` and `stageTestID` reach that stage; `backdrop` accepts the host's scrim/action node; `contentStyle` and `testID` reach the actual modal surface. The surface retains modal accessibility semantics and its title, without grouping its interactive descendants. Hosts keep close rejection in `onOpenChange` and wire the same policy to their custom backdrop/buttons. A rejected close retains native content and does not return focus. A custom stage/backdrop must preserve accessible controls and must not create a second Modal.

`animationType` retains React Native's typed `none`/`fade`/`slide` policy; omitted, it remains `none`. Provider reduced motion overrides it to `none`. For an animated iOS close, focus return waits for native `onDismiss`; Android restores on the next frame after accepted controlled close because [React Native exposes `onDismiss` only on iOS](https://reactnative.dev/docs/modal#ondismiss). Keep the Dialog mounted with `open={false}` through dismissal rather than conditionally removing it. Reopening or unmounting cancels pending return focus. Default native anatomy, scrolling, keyboard avoidance, palette and translated Close action remain unchanged.

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

For a native card stack, import `GestureSheet` from `@bloxwap/hig-native/gesture-sheet` and render the caller's cards directly:

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

Here `Text` and `View` are React Native types/components, and the host supplies the card state and its own accessible back/close labels. Custom content can use its own Gorhom scrollable or list without an outer scroll view. `snapPoints` may change while open: the current detent index is retained, or clamped to the highest remaining index if its detent was removed. Detent changes keep the sheet mounted and do not repeat open focus. Keep at least one sorted snap point; `initialIndex` applies to the next presentation. Focus return, Android Back, reduced-motion and dismissible backdrop behavior apply in both content modes.

For content-sized native cards, set `enableDynamicSizing` and omit `snapPoints`. This chooses one backend-measured detent rather than adding a competing fixed point. In custom mode HIG uses Gorhom's `BottomSheetView` to report intrinsic layout; it keeps a plain full-height `View` in fixed mode so nested scrollable registration stays with the caller. Choose the sizing mode for the presentation and avoid `flex: 1` or a full-height constraint on content that should determine its own height. Bound a long card's own scroll view. Default anatomy continues to use the backend scroll view. Mixed headers/footers and nested registered Gorhom scrollables compete for the backend's content-height measurement: their scroll content can replace the whole card height. Use host-measured fixed snap points for that composition. A content-sized card can instead bound a plain React Native `ScrollView` and set `enableContentPanningGesture={false}`, retaining the handle gesture and its own scroll gesture. This follows [Gorhom dynamic sizing](https://gorhom.dev/react-native-bottom-sheet/dynamic-sizing).

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

`maxDynamicContentSize` is an optional finite positive ceiling in native points; the backend container height is the default. The dynamic detent uses index `0`. Changing content or the ceiling keeps the presentation and card state; height updates do not repeat open focus. A fixed sheet still requires a nonempty `snapPoints` list. `enableContentPanningGesture` passes through to the backend, allowing hosts with an independently scrolling list to disable content panning without changing their close/Back actions.

Host card stacks may also supply `onDismiss` to clear retained card state only after an accepted close settles. Rejected closes and interrupted reopenings do not call it. `onHardwareBackPress` can consume Android Back (`true`) or defer to the host's nested-card dispatcher (`false`); omitting it keeps the default dismissal behavior.

`topInset` and `bottomInset` default to safe-area values; use `0` for an intentional flush edge. `handleComponent` (including `null` for an overlay handle), `handleStyle`, `handleIndicatorStyle`, `backgroundComponent` and `backgroundStyle` retain host geometry and decoration. The backend measures the rendered handle. Use `useColors()` in custom backgrounds. `modalRef` exposes the optional backend's imperative motion methods; hosts must keep controlled `open` in sync with `present()`/`dismiss()`. Focus return and settled `onDismiss` remain controlled by the HIG wrapper. `animateOnMount`, `animationConfigs` and `backdropComponent` retain host entry motion and backdrop styling; the reduced-motion mapping still applies. A custom backdrop must honor the host dismissal policy.

Keyboard policies are typed backend options: `keyboardBehavior`, `keyboardBlurBehavior` and `android_keyboardInputMode`. Defaults remain HIG's `interactive`, `restore` and `adjustResize`. A host retaining an existing Gorhom policy can explicitly pass `none` for blur and `adjustPan` on Android. See [Gorhom keyboard handling](https://gorhom.dev/react-native-bottom-sheet/keyboard-handling).

For a screen-level drawer that must prepare and retain its native children while closed, choose `presentation='inline'`. HIG uses the public persistent `BottomSheet` backend; the default remains `presentation='modal'` with `BottomSheetModal`. Inline content stays mounted at index `-1`, hidden from accessibility and touch, and registers no Back listener while closed. Opening and reopening keep child/controller/list state. Rejected closes restore the last open detent; accepted closes return focus and call `onDismiss` once after settling. Use `sheetRef` for the inline backend's actual `expand`, `close` and `snapToIndex` methods; `modalRef` is only available in modal mode and exposes `present`/`dismiss`. Imperative calls must keep controlled `open` in sync. `onChange` observes backend index/position/type after HIG updates its index, focus and close request; it cannot replace those handlers. This lets a host change its animation policy after the opening detent settles. `containerStyle` retains sibling overlay order. Hosts own screen-level backdrop/container layering for inline presentation. No modal portal provider is required for inline sheets.

## Optional web gesture backend

Install `vaul ^1.1.2` and import `GestureSheet` from `@bloxwap/hig-react/gesture-sheet`. Core `overlay`, Button and overlay-free recipes do not import or install Vaul. The backend supplies its own motion CSS when loaded; HIG's explicitly imported component CSS supplies scoped surface, text, geometry and reduced-motion rules. See the official [Vaul anatomy and API](https://vaul.emilkowal.ski/api) and the verified [1.1.2 source](https://github.com/emilkowalski/vaul/blob/v1.1.2/src/index.tsx).

```tsx
import {GestureSheet} from '@bloxwap/hig-react/gesture-sheet';

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

Backend defaults remain Vaul's: `handleOnly=false`, `repositionInputs=true`, `shouldScaleBackground=false`, `dismissible=true` and `autoFocus=false`. Retain existing host flags explicitly. With `autoFocus=false`, hosts may use `contentProps.onOpenAutoFocus` to focus their heading/search control without requesting a software keyboard automatically. `shouldScaleBackground=true` requires the host's `[data-vaul-drawer-wrapper]` around the page. Physical `backendProps.direction` is independent of the provider's text direction. Snap points retain Vaul's viewport geometry; a full-height snapping panel should supply its own full-height layout. The modal root stays controlled and modal; there is no second nested HIG Dialog root.

The host can reject `onOpenChange(false)` while pending; HIG restores Vaul's last resting motion styles after a rejected drag without remounting card state. Use `dismissible=false` as well when pending should prevent dismissal attempts altogether. Backend `onAnimationEnd` is observed only when its reported state still matches controlled `open`, so rejected closes and stale opposite-state callbacks cannot clear retained card state. Programmatic state changes keep the backend's callback behavior. Reduced motion removes the sheet/overlay animation and transition; drag and snap selection still work. Viewport measurements, editable-input blur policy, animated content-height utilities, safe-area padding and product-specific keyboard accessory reserves stay in the host.

`scripts/gesture-sheet-browser-smoke.mjs` exercises the real Vaul backend in Chromium and WebKit: drag/scroll handoff, handle-only drag, controlled veto with retained input identity, nondismissible state, snap expansion, focus trap/Escape/return, viewport resizing, host styles/refs and reduced motion. Evidence in `evidence/web-gesture-sheet/` records the exact source baseline and dirty state. Desktop viewport resizing does not certify physical mobile software-keyboard behavior; that remains a host/device observation.

## When to use and examples

Do: repeat the order amount and give an explicit cancel action. Don’t: hide essential terms in hover help or execute confirm on open.

## States, interaction and accessibility

DOM Radix focus scopes restore trigger focus, trap modal focus, handle Escape and scroll locks. AlertDialog blocks outside-click dismissal. Menus use roving keyboard focus. Native Modal owns back and keyboard avoidance with scrollable content. Native overlays follow the host orientation: React Native's iOS Modal defaults `supportedOrientations` to portrait, so HIG passes every orientation and opening a Dialog, AlertDialog, Sheet, Menu or Select never rotates a landscape host back to portrait (observed on the iOS Simulator, `evidence/native-sim/ios/orientation/`). Hosts still decide which orientations the app supports.

State review: rest; keyboard focus/hover (DOM); accepted press and release/cancel; selected/checked where applicable; disabled; busy; inline error/recovery; empty/loading; long translations/large text; reduced motion; sound and haptics disabled. No host action occurs on mere focus. Disabled/busy targets suppress accepted activation. Core has no required feedback backend; the optional provider callback follows the action, honors cancellation and isolates errors.

## Platform mapping and limits

Basic Sheet uses static Modal layout. The separate optional `@bloxwap/hig-native/gesture-sheet` entry provides GestureSheet with sorted snapPoints, initialIndex, dismissible, safe-area/keyboard configuration, reduced-motion mapping, native back, scoped listener cleanup and controlled dismissal deduplication. Rejected controlled closes re-present after host state settles. See `fixtures/native/gesture-sheet.tsx` and `index-gesture.js` for the real separate consumer; packed smoke compiles both Android/iOS entry points. Hosts provide GestureHandlerRootView, SafeAreaProvider and BottomSheetModalProvider. Required optional peers are Gorhom 5.2.14, Reanimated 4.1.1, Worklets 0.5.1 and Gesture Handler 2.28.0, pinned to Expo 54 bundledNativeModules rather than the newer monorepo native runtime. Backend configuration follows [Gorhom usage](https://gorhom.dev/react-native-bottom-sheet/modal/usage) and [props](https://gorhom.dev/react-native-bottom-sheet/props). Mocked wiring and Metro compilation are not gesture-detent or TalkBack certification. With TalkBack on the Android emulator, opening Dialog/AlertDialog/Sheet/Menu moves accessibility focus to the heading and Back closes the overlay; without a `returnFocusRef` TalkBack falls back to the first screen element, so hosts should pass the trigger. VoiceOver does not run in the iOS Simulator, so VoiceOver focus restoration remains a physical-device observation (`evidence/native-sim/`). Native help is persistent text; no hover tooltip or anchored popover claim.

## Validation and citation

See `tests/components.dom.test.tsx`, `tests/native/components.test.cjs`, consumer fixtures and milestone evidence. Physical hardware, assistive-technology and baseline product comparisons are unperformed unless linked explicitly. Cite HIG 0.1.0 with this chapter anchor and a commit permalink, not a mutable preview branch. Preserve business behavior behind a host rollback flag during adoption.
