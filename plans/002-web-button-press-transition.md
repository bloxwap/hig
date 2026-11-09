# 002 — Ease the web button press instead of snapping it

- **Status**: DONE
- **Commit**: c67e169
- **Severity**: MEDIUM
- **Category**: Easing & duration / Physicality
- **Estimated scope**: 1 file (`packages/hig/react/src/styles.css`), 1 inserted line

## Problem

`.hig-button` is the most-pressed control in the library. It is also used for tabs (`.hig-tab`), icon buttons, and every recipe action. It scales down on press, but the rule has **no `transition`**, so the scale jumps to 98% instantly and jumps back on release. The hover brightness, gated behind a fine pointer, snaps the same way:

```css
/* packages/hig/react/src/styles.css:6 — current (no transition anywhere in the rule) */
.hig-button { display:inline-flex;align-items:center;justify-content:center;gap:8px;vertical-align:middle;min-height:var(--hig-button);max-width:100%;padding:8px 20px;border:1px solid transparent;border-radius:9999px;font:600 1rem/1.5 var(--hig-font-sans,'Bloxwap Sans',system-ui,sans-serif);background:var(--hig-action);color:var(--hig-onAction);cursor:pointer;overflow-wrap:anywhere; }
```

```css
/* packages/hig/react/src/styles.css:15 — current */
.hig-button:active:not(:disabled) { transform:scale(.98); }
```

```css
/* packages/hig/react/src/styles.css:233 — current, inside @media (hover:hover) and (pointer:fine) */
  .hig-button:hover:not(:disabled) { filter:brightness(.9); }
```

A snapped scale reads as a flicker, not a press. Press feedback should ease on a fast ease-out curve. A CSS transition also retargets from wherever it is, so rapid taps never restart from zero.

## Target

Add one rule directly after line 15:

```css
.hig-button { transition:transform 160ms var(--hig-motion-easing-standard,cubic-bezier(.22,1,.36,1)),filter 150ms ease; }
```

- `transform 160ms`: press feedback budget is 100–160ms. Use the repo's standard ease-out curve, `--hig-motion-easing-standard` = `cubic-bezier(0.22, 1, 0.36, 1)`, with the same literal fallback the file already uses.
- `filter 150ms ease`: hover is a colour-style change, so plain `ease` is correct.
- Keep `scale(.98)`. It is already inside the recommended 0.95–0.98 range.
- Animate only `transform` and `filter`. Do **not** use `transition: all`, which would also animate `background`, `color` and `border-color` when the intent or theme changes.
- Reduced motion needs no change. Lines 124–125 already set `transform:none` on `:active` under `prefers-reduced-motion` and `[data-hig-motion='reduced']`, so the transform never changes and the transition does nothing.
- Do **not** use `var(--hig-motion-duration-fast)` (180ms). It is outside the 160ms press budget.

## Repo conventions to follow

- Every rule in `styles.css` must stay scoped to `.hig-*` selectors. `scripts/packed-boundaries-smoke.mjs` fails on any selector without `hig-`. `.hig-button` satisfies it.
- Motion values use the HIG token with a literal fallback. Exemplar: `packages/hig/react/src/styles.css:174`:
  ```css
  .hig-segment-indicator { … transition:inset-inline-start var(--hig-motion-duration-base,260ms) var(--hig-motion-easing-standard,cubic-bezier(.22,1,.36,1)); }
  ```
- Single-line rules with no spaces after colons inside declarations. Match the surrounding style.

## Steps

1. Open `packages/hig/react/src/styles.css`. Confirm line 15 is exactly `.hig-button:active:not(:disabled) { transform:scale(.98); }`.
2. Insert this new line directly after line 15:
   ```css
   .hig-button { transition:transform 160ms var(--hig-motion-easing-standard,cubic-bezier(.22,1,.36,1)),filter 150ms ease; }
   ```
3. Change nothing else. Do **not** edit the long `.hig-button` rule on line 6. `tests/tokens.test.ts` matches its `font:` string exactly.

## Boundaries

- Do NOT touch any other selector, the hover media block, the reduced-motion rules, or `base.css`.
- Do NOT add `will-change`. A transform transition on a small element doesn't need it.
- Do NOT change markup or TSX files.
- If line 15 doesn't match, STOP and report.

## Verification

- **Mechanical**:
  - `npx vitest run tests/components.dom.test.tsx tests/tokens.test.ts`: both pass. They read `styles.css` directly.
  - `npm run test:web` and `npm run lint`: both exit 0.
  - `node scripts/build.mjs && npm run smoke:packed-boundaries`: still reports every selector scoped to HIG classes.
- **Feel check**:
  - `npm run dev` (Vite serves `fixtures/web` on `0.0.0.0`). In desktop Chrome, open DevTools → Animations, set playback to 10%, and press and hold a primary button. It eases down to 98% on a fast-then-settling curve and eases back on release. There is no single-frame jump.
  - Tap a button rapidly 5–6 times. The scale never restarts from 100% mid-press; it continues from its current size.
  - Hover with a mouse: the brightness change fades over about 150ms instead of popping.
  - DevTools → Rendering → emulate `prefers-reduced-motion: reduce`. Pressing produces no scale at all.
  - **Real phone** (open `http://<LAN-IP>:<port>` on iOS Safari and Android Chrome): tapping a button shows the eased press with no grey flash and no stuck hover brightness after lifting the finger. Emulation can't confirm this.
- **Done when**: `styles.css` has the new `.hig-button { transition:… }` rule directly after the `:active` rule, the tests and the boundaries smoke pass, and the press looks eased at 10% playback.
