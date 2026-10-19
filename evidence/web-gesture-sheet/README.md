# Optional web GestureSheet runtime evidence

Observed on Node 22.22.0 against baseline `4f6f777bad583055840ae28c2d738989cd89e6e4` with uncommitted coordinated web/native API work. `browser.json` records the exact web input SHA-256 values and `sourceDirty: true`; this is not a clean release candidate report.

`@bloxwap/hig-react/gesture-sheet` uses the real Vaul 1.1.2 Root, Portal, Content and Handle. Six cases passed in each of Chromium 141.0.7390.37 and WebKit 26.0: scroll/drag handoff, handle-only drag, controlled pending veto, locked dismissal, snap expansion and reduced motion. Every case checks accessible naming, content refs, a 100px backend handle, host data/layout, keyboard trapping, Escape/accepted close, focus return and reopening. Focused viewport resizing checks the host's max-height and bottom offset. There are no wallet/network mocks or external requests; the fixture makes no product actions.

The pending-veto case retains the input node and `BTC` value, restores open drag geometry, preserves a host corner-radius update made during the rejected close, and releases Safari's body position lock after the eventual accepted close. The initial direct composition failed the real rejected-drag geometry assertion. Inspection of the pinned Vaul source also showed it clearing its saved Safari body position on a rejected request; the final runtime case verifies the eventual accepted close leaves the body unlocked. The adapter restores only backend motion/lock state; viewport accessory heuristics and input blur policy remain in the host. DOM tests also cover frozen unsafe JavaScript props, translated custom/default close controls, focus events, nondismissible state and balanced React callback-ref cleanup through Vaul's legacy ref composer.

Each engine/case has an `-open.png` and `-closed.png` capture. `focused-dom.log`, `packed-boundaries.log` and `full-check.log` record actual local gates. The complete check passed 163 web tests and 151 native tests plus build, production docs build, lint and types before the subsequent additive Badge and native EmptyState APIs. The browser report was then refreshed against the frozen Badge CSS; the parent owns the final coordinated full check before packing. Packed boundaries use a fresh temporary consumer: Button/ordinary Dialog/overlay-free recipes exclude Vaul, the optional entry fails before its peer install, then bundles with the actual peer after installation. These local unsuffixed archives are smoke-test inputs, not consumer adoption artifacts.

Commands (with the repository's `node_modules/node/bin` prepended to PATH):

```sh
npm run check
node_modules/.bin/vitest run tests/gesture-sheet.dom.test.tsx tests/dialog-custom.dom.test.tsx
node scripts/gesture-sheet-browser-smoke.mjs
npm pack ./packages/react --json --ignore-scripts --pack-destination artifacts
node scripts/packed-boundaries-smoke.mjs
```

The browser check is included in `scripts/run-browser-gates.mjs`. Physical mobile finger gestures and software-keyboard behavior remain host/device acceptance. Desktop WebKit and viewport resizing do not certify them. The coordinated release candidate also waits for the independent native inline-sheet runtime audit. No package publication or manual deployment occurred.
