# Status & feedback · HIG 0.1.0

Visible progress, notifications, and recoverable states that keep people informed.

Includes `Badge`, `Alert`, `Callout`, `Toast`, `Progress`, `Spinner`, `Skeleton`, `EmptyState`, `Avatar`, and `StatusIndicator`.

Issue #18. Entry: `status`. Import platform entries from `@bloxwap/hig-react/status` or `@bloxwap/hig-native/status` according to applicability below. Import `@bloxwap/hig-react/css` once on web; tokens CSS is a separate explicit import.

## API and anatomy

| Component | Key props and behavior |
| --- | --- |
| `Badge` | Quiet label; web adds explicit `tone` (`neutral`, `positive`, `negative`, `warning`, or `info`), standard span props and a forwarded span ref. The neutral default retains its appearance. Tone uses provider token roles and never infers meaning from text or a number's sign. Badge adds no live region; the host owns announcements. |
| `Alert` | `title`, `severity`, and an optional recovery `action`. Severity sets the accent edge from a token role on web and native: info → `info`, success → `positive`, warning → `warning`, error → `negative`. On native, `tone` swaps in another token role for an approved product accent, never a raw colour. |
| `Callout` | Same API as `Alert`, for static guidance. It adds the documentation severities `note` (`info` role) and `tip` (`positive` role), so SDK docs do not need their own edge colours. Pass `announce={false}` for callouts present at page load. `title` accepts a ReactNode, such as text with a `<code>` span; on web it renders inside `<strong>` and should stay inline. On native it renders inside the `Heading`, so pass a string or inline `Text`; its visible text is announced. |
| `Toast` | `notices` with stable `id`, `message`, `severity`, and optional `action`; `onDismiss` handles dismissal. Native notices also accept `description` and `closable` (default true when `onDismiss` is supplied). Native `maxHeight` bounds a scrolling viewport; it defaults to 60% of the window height and accepts dp or a parent percentage. `dismissLabel` overrides visible Dismiss text; its accessible name contains that text. |
| `Progress` | `label`, `value`, and `max`. |
| `EmptyState` | `title`, `description`, and an optional `action`. |

Native `EmptyState` keeps the default `Surface`, `Heading` and body-text anatomy. Its `description` is optional; omitted or empty text leaves no blank description node. Pass decorative `illustration` content before the heading; HIG hides the whole illustration subtree from VoiceOver/TalkBack navigation while keeping the heading and action accessible. The host controls the illustration's dimensions and spacing. Root `ViewProps`, including `style`, `testID` and layout events, pass to the Surface. `titleStyle` and `descriptionStyle` reach the actual text nodes; `maxFontSizeMultiplier` caps both, or inherits the provider policy when omitted. Text keeps the provider palette and heading semantics unless the host explicitly styles it.

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

## When to use and examples

Do: keep critical failure inline with Retry; use toast for copied acknowledgement. Don’t: dismiss critical text on a timer or rely on audio for success.

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
