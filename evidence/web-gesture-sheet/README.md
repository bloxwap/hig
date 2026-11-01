# Optional web GestureSheet runtime evidence

Observed with Node 24.22.1. `browser.json` records the exact web input SHA-256 values, backend/browser versions and `sourceDirty: true`; this is not a clean-release claim.

`@bloxwap/hig-react/gesture-sheet` uses the real Vaul 1.1.2 Root, Portal, Content and Handle. Nine cases passed in each of Chromium 156 and WebKit 27.2: scroll/drag handoff, handle-only drag, controlled pending veto, locked dismissal, fixed snap expansion, reduced motion, dynamic content growth/shrink, capped dynamic scrolling, and a reduced-motion top sheet. Dynamic cases also interrupt growth with shrinkage, retain the same input/focus/DOM node, cancel resize motion on close, and reopen without stale geometry.

Every case checks accessible naming, content refs, host data/layout, keyboard trapping, Escape/accepted close, focus return and reopening. The pending-veto case retains the `BTC` input and restores open drag geometry and body scroll state after an eventual accepted close. Dynamic sizing is opt-in and mutually exclusive with Vaul snap props; unavailable measurement/animation capabilities and reduced motion settle on the final intrinsic size without overriding Vaul keyboard-owned inline height.

Each engine/case has open, changed where applicable, and closed captures. `npm run check` passed the complete build, docs, lint, typecheck and 236 web plus 197 native tests. Packed boundaries verify that ordinary overlays stay Vaul-free and the optional gesture entry resolves after its peer is installed. The full browser gate also passed 65 components and 105 states.

Commands:

```sh
npm run check
node scripts/gesture-sheet-browser-smoke.mjs
node scripts/run-browser-gates.mjs
npm run smoke:packed-boundaries
```

Physical mobile finger gestures, software-keyboard behavior and screen-reader speech remain host/device acceptance. Desktop Chromium/WebKit and viewport resizing do not certify them. No publication or deployment occurred.
