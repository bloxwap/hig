# 003 — Give AnimatedNumberReadout the standard HIG curve on web and native

- **Status**: DONE
- **Commit**: c67e169
- **Severity**: MEDIUM
- **Category**: Easing & duration / Cohesion & tokens
- **Estimated scope**: 4 files (2 sources, 1 test, 1 test mock), ~6 changed lines
- **Depends on**: run after `001-native-number-reel-20-rows.md` if both are scheduled. Both edit `packages/hig/native/src/animated-number.tsx` and `tests/native/animated-number.test.cjs`. Locate lines by the quoted code, not by line number.

## Problem

The same component moves its digits on a different curve on each platform, and neither is the HIG's standard motion curve:

```tsx
// packages/hig/react/src/animated-number.tsx:22 — current (excerpt)
timing:KeyframeAnimationOptions={duration:Math.min(duration,600),easing:'ease-out',fill:'forwards'};
```

```tsx
// packages/hig/native/src/animated-number.tsx:33 — current
  position.value=withTiming(destination,{duration:motionDuration,easing:Easing.out(Easing.cubic),reduceMotion:ReduceMotion.Never});
```

- Web uses the built-in `ease-out`, which is `cubic-bezier(0, 0, 0.58, 1)`. It is a weak curve: the digit drifts into place instead of landing.
- Native uses `Easing.out(Easing.cubic)`, roughly `cubic-bezier(0.215, 0.61, 0.355, 1)`. It is stronger, but still not the same curve.
- The HIG standard is `tokens.easing.standard` = `[0.22, 1, 0.36, 1]`, exposed in CSS as `--hig-motion-easing-standard: cubic-bezier(0.22, 1, 0.36, 1)`. It is documented in `docs/foundations/platform.md:83`, and every other HIG motion already uses it.

A price readout that settles differently on web and in the app makes the two renderers feel like different products.

## Target

- **Web:** `easing: cubic-bezier(0.22,1,0.36,1)`, built from `tokens.easing.standard` so it can't drift from the token.
- **Native:** `easing: Easing.bezier(...tokens.easing.standard)`, which resolves to `Easing.bezier(0.22, 1, 0.36, 1)`.
- Duration (default 180ms, capped at 600ms), keyframes, `fill:'forwards'`, `ReduceMotion.Never` and every reduced-motion branch stay **unchanged**.

## Repo conventions to follow

- Tokens come from the package's own subpath: `import {tokens} from '@bloxwap/hig/tokens';`. In `jest.native.config.cjs`, `moduleNameMapper` already resolves `@bloxwap/hig/tokens` to `packages/hig/tokens/dist/index.js`, so run `npm run generate && node scripts/build.mjs` first if `dist` is missing.
- Native exemplar that already does exactly this, at `packages/hig/native/src/radio-group.tsx:3` and `:32`:
  ```tsx
  import {tokens} from '@bloxwap/hig/tokens';
  …Animated.timing(translateX,{toValue:target,duration:tokens.motion.base,easing:Easing.bezier(...tokens.easing.standard),useNativeDriver:Platform.OS!=='web',isInteraction:false});
  ```
- The web provider already imports from `@bloxwap/hig/tokens` (`packages/hig/react/src/provider.tsx:6`). Adding the import to the web animated-number entry adds nothing new to its dependency graph.
- Dense one-line source style. Don't reformat.

## Steps

1. **Web source:** in `packages/hig/react/src/animated-number.tsx`, add this import after the line `import {useHIG} from './provider.js';`. It **must** be aliased, because the component declares its own local `const tokens=` (the digit list), which would hide an unaliased import inside the effect:
   ```tsx
   import {tokens as higTokens} from '@bloxwap/hig/tokens';
   ```
2. In the same file, find `easing:'ease-out'` (it appears once, in the `timing:KeyframeAnimationOptions` object) and replace it with:
   ```tsx
   easing:`cubic-bezier(${higTokens.easing.standard.join(',')})`
   ```
   This produces the exact string `cubic-bezier(0.22,1,0.36,1)`.
3. **Native source:** in `packages/hig/native/src/animated-number.tsx`, add this import after the line `import * as en from '@bloxwap/hig/contracts/messages';`:
   ```tsx
   import {tokens} from '@bloxwap/hig/tokens';
   ```
4. In the same file, replace `easing:Easing.out(Easing.cubic)` (once, inside `withTiming(...)`) with:
   ```tsx
   easing:Easing.bezier(...tokens.easing.standard)
   ```
   Keep `Easing` in the existing `react-native-reanimated` import. Reanimated's `Easing.bezier(x1,y1,x2,y2)` is accepted directly by `withTiming`.
5. **Native test mock:** in `tests/native/setup.cjs`, the Reanimated mock has `Easing:{cubic:value=>value,out:easing=>easing},`. Replace it with:
   ```js
   Easing:{cubic:value=>value,out:easing=>easing,bezier:(...points)=>({bezier:points})},
   ```
6. **Native test:** in `tests/native/animated-number.test.cjs`, find this assertion in the "retargets from the current reel position…" test:
   ```js
   expect(state.animations[0].config).toMatchObject({duration:600,reduceMotion:'never'});
   ```
   and change it to:
   ```js
   expect(state.animations[0].config).toMatchObject({duration:600,reduceMotion:'never',easing:{bezier:[0.22,1,0.36,1]}});
   ```
7. **Web test:** in `tests/animated-number.dom.test.tsx`, in the first test ("animates per place without an initial animation…"), right after `rerender(<AnimatedNumberReadout value={2} label='Price'/>);`, add:
   ```tsx
   expect(animate.mock.calls[0][1]).toMatchObject({easing:'cubic-bezier(0.22,1,0.36,1)',duration:180,fill:'forwards'});
   ```

## Boundaries

- Do NOT change durations, the 600ms clamp, keyframes, `fill`, `ReduceMotion.Never`, or any reduced-motion logic.
- Do NOT touch the segmented control, the gesture sheets, `styles.css`, or the token source and generated token files.
- Do NOT hard-code the curve in either source file. Both must read `tokens.easing.standard`.
- Do NOT add dependencies.
- If `easing:'ease-out'` or `easing:Easing.out(Easing.cubic)` isn't found exactly once, STOP and report.

## Verification

- **Mechanical**:
  - `npx vitest run tests/animated-number.dom.test.tsx`: passes, including the new easing assertion.
  - `npx jest --config jest.native.config.cjs tests/native/animated-number.test.cjs`: passes.
  - `npm run test:web`, `npm run test:native`, `npm run typecheck` and `npm run lint`: all exit 0.
  - `node scripts/build.mjs && npm run smoke:packed-boundaries`: still passes. The web animated-number entry must not pull in native or animation-engine code.
- **Feel check**:
  - **Web:** `node scripts/pro-data-browser-smoke.mjs` should still pass. To watch it, run `npm run dev`, render an `AnimatedNumberReadout` with `duration={600}`, set DevTools → Animations to 10%, and change the value. Each digit should travel most of the way in the first third, then land softly with no long drift at the end.
  - **Native:** on an iOS simulator or device (`npm run start -w hig-native-fixture`), put a web build and the native build side by side and change the same value. The digit roll should settle with the same timing and the same landing on both.
  - Turn on Reduce Motion on each platform: digits still change instantly.
- **Done when**: both sources import `tokens` and derive the curve from `tokens.easing.standard`, no `'ease-out'` or `Easing.out(Easing.cubic)` remains in either animated-number file, and the web and native suites are green with the new easing assertions.
