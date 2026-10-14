# Principles and content · HIG 0.1.0

Issues #2, #3. Rules are candidate guidance anchored to SDK source and the public marketing surface; the pinned monorepo audit and live-origin snapshots are in `evidence/issue-1-18/`. Do not represent example trading actions as live product behavior.

## Clear action hierarchy

Offer one primary action per decision. In an amount-entry recipe, **do** label the next step “Review order” and show the asset and amount before host submission; **don't** say “Go” or execute a trade when a field receives focus. Secondary actions navigate or cancel. Destructive intent means irreversible removal/cancellation; buy/sell colors mean market direction and never imply safety. Bind pending state to the host request, block duplicate activation, retain a progress label. Disabled means unavailable; busy means an action is running. Give the reason nearby.

## Touch before density

Use comfortable 48-unit controls for mobile trade forms. **Do** stack amount, available balance, validation and primary action at narrow widths; **don't** squeeze a desktop order panel into a phone. Pro can use compact 36-unit controls with keyboard focus and separated targets. SDK code windows scroll horizontally; surrounding prose reflows. Marketing CTA and SDK install controls retain explicit labels, as observed in `bloxwap.com` and `font/apps/docs/app/global.css`.

## State tells the truth

Resting, hover, focus, pressed, selected, busy, disabled, empty, error, success, offline and stale are distinct states. **Do** retain the last value with a timestamp and “Data unavailable — retry”; **don't** display unknown as zero, silently imply a completed order, or announce every price tick. Errors name the failed action and recovery. Confirmations repeat host-provided consequences and offer cancel before commit. Essential information remains visible and accessible with feedback muted.

## Content and precision

Use sentence case and concrete verbs (“Copy install command”). **Do** display currency, precision and units supplied by the host; **don't** use a rounded display number as transaction input. Keep raw decimal strings in business logic. A percent component expects percent points, not an implicit ratio. Use localized display with explicit parsing policy; do not strip unfamiliar separators and submit a changed amount. Code uses Mono, body Sans, Pixel only as a decorative brand accent.

## Composition and progressive disclosure

Show common actions first, advanced options on deliberate disclosure. **Do** give a native sheet a visible close action and let Android back dismiss; **don't** rely on hover tooltips on touch. Navigation remains host-owned: HIG does not choose routes, wallets, order types, or trading outcomes. Use status/callout for persistent critical errors; toast only for nonessential acknowledgements.

## Concrete source and pattern references

The preceding rules map to Bloxwap-owned examples, without treating host demo outcomes as submitted trades:

- Clear action hierarchy: [pinned Bloxwap source](https://github.com/bloxwap/monorepo/blob/d47cef4c40363184bdfda8d8c263ead108ef9ff6/packages/ui-native/src/components/button.tsx), [HIG pattern](../components/actions-surfaces.md). Source primary/secondary/destructive variants, busy activation policy and semibold labels.
- Touch before density: [pinned Bloxwap source](https://github.com/bloxwap/monorepo/blob/d47cef4c40363184bdfda8d8c263ead108ef9ff6/packages/tokens/src/spacing.ts), [HIG pattern](../components/recipes.md). Source spacing aliases and 16-unit root; marketing CTA before-capture is before-bloxwap.com.png.
- State tells the truth: [pinned Bloxwap source](https://github.com/bloxwap/monorepo/blob/d47cef4c40363184bdfda8d8c263ead108ef9ff6/packages/ui-native/src/components/toast.tsx), [HIG pattern](../components/status.md). Source notification severity and persistent readable outcomes; HIG preserves undismissed bursts.
- Content and precision: [pinned Bloxwap source](https://github.com/bloxwap/monorepo/blob/d47cef4c40363184bdfda8d8c263ead108ef9ff6/packages/ui-native/src/components/number-format.ts), [HIG pattern](../components/fields.md). Source display formatting stays separate from raw amount input and host arithmetic.
- Composition and progressive disclosure: [pinned Bloxwap source](https://github.com/bloxwap/monorepo/blob/d47cef4c40363184bdfda8d8c263ead108ef9ff6/packages/ui-native/src/components/sheet.tsx), [HIG pattern](../components/overlays.md). Source back/dismissal and safe-area behavior; basic HIG Modal alternative has an explicit close action.
