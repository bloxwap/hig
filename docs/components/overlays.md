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
| Native focus targets | `initialFocusRef` and `returnFocusRef` accept live focus targets. Initial focus defaults to the title; the host supplies the trigger ref (Menu and Select pass their own trigger). |
| `Menu` | `label` and items with `label`, optional `disabled`, and `onSelect`. |
| Optional native `GestureSheet` | `contentMode='default'` scrolls the title, optional description, children and Close action. `contentMode='custom'` provides an unpadded, full-height content container; the host owns its header, back/close actions, safe-area content padding and scrolling. `title` remains required as the accessible name. Pass `titleRef` attached to the caller's accessible heading to focus it on open; without it, the sheet focuses its visually hidden title. |

Native return focus is scheduled after the static Modal closes and canceled on reopen or unmount.

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

Host card stacks may also supply `onDismiss` to clear retained card state only after an accepted close settles. Rejected closes and interrupted reopenings do not call it. `onHardwareBackPress` can consume Android Back (`true`) or defer to the host's nested-card dispatcher (`false`); omitting it keeps the default dismissal behavior.

`topInset` and `bottomInset` default to safe-area values; use `0` for an intentional flush edge. `handleComponent` (including `null` for an overlay handle), `handleStyle`, `handleIndicatorStyle`, `backgroundComponent` and `backgroundStyle` retain host geometry and decoration. The backend measures the rendered handle. Use `useColors()` in custom backgrounds. `modalRef` exposes the optional backend's imperative motion methods; hosts must keep controlled `open` in sync with `present()`/`dismiss()`. Focus return and settled `onDismiss` remain controlled by the HIG wrapper. `animateOnMount`, `animationConfigs` and `backdropComponent` retain host entry motion and backdrop styling; the reduced-motion mapping still applies. A custom backdrop must honor the host dismissal policy.

## When to use and examples

Do: repeat the order amount and give an explicit cancel action. Don’t: hide essential terms in hover help or execute confirm on open.

## States, interaction and accessibility

DOM Radix focus scopes restore trigger focus, trap modal focus, handle Escape and scroll locks. AlertDialog blocks outside-click dismissal. Menus use roving keyboard focus. Native Modal owns back and keyboard avoidance with scrollable content. Native overlays follow the host orientation: React Native's iOS Modal defaults `supportedOrientations` to portrait, so HIG passes every orientation and opening a Dialog, AlertDialog, Sheet, Menu or Select never rotates a landscape host back to portrait (observed on the iOS Simulator, `evidence/native-sim/ios/orientation/`). Hosts still decide which orientations the app supports.

State review: rest; keyboard focus/hover (DOM); accepted press and release/cancel; selected/checked where applicable; disabled; busy; inline error/recovery; empty/loading; long translations/large text; reduced motion; sound and haptics disabled. No host action occurs on mere focus. Disabled/busy targets suppress accepted activation. Core has no required feedback backend; the optional provider callback follows the action, honors cancellation and isolates errors.

## Platform mapping and limits

Basic Sheet uses static Modal layout. The separate optional `@bloxwap/hig-native/gesture-sheet` entry provides GestureSheet with sorted snapPoints, initialIndex, dismissible, safe-area/keyboard configuration, reduced-motion mapping, native back, scoped listener cleanup and controlled dismissal deduplication. Rejected controlled closes re-present after host state settles. See `fixtures/native/gesture-sheet.tsx` and `index-gesture.js` for the real separate consumer; packed smoke compiles both Android/iOS entry points. Hosts provide GestureHandlerRootView, SafeAreaProvider and BottomSheetModalProvider. Required optional peers are Gorhom 5.2.14, Reanimated 4.1.1, Worklets 0.5.1 and Gesture Handler 2.28.0, pinned to Expo 54 bundledNativeModules rather than the newer monorepo native runtime. Backend configuration follows [Gorhom usage](https://gorhom.dev/react-native-bottom-sheet/modal/usage) and [props](https://gorhom.dev/react-native-bottom-sheet/props). Mocked wiring and Metro compilation are not gesture-detent or TalkBack certification. With TalkBack on the Android emulator, opening Dialog/AlertDialog/Sheet/Menu moves accessibility focus to the heading and Back closes the overlay; without a `returnFocusRef` TalkBack falls back to the first screen element, so hosts should pass the trigger. VoiceOver does not run in the iOS Simulator, so VoiceOver focus restoration remains a physical-device observation (`evidence/native-sim/`). Native help is persistent text; no hover tooltip or anchored popover claim.

## Validation and citation

See `tests/components.dom.test.tsx`, `tests/native/components.test.cjs`, consumer fixtures and milestone evidence. Physical hardware, assistive-technology and baseline product comparisons are unperformed unless linked explicitly. Cite HIG 0.1.0 with this chapter anchor and a commit permalink, not a mutable preview branch. Preserve business behavior behind a host rollback flag during adoption.
