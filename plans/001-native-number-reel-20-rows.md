# 001 — Cut the native number reel from 30 to 20 rows per digit

- **Status**: DONE
- **Commit**: c67e169
- **Severity**: HIGH
- **Category**: Performance
- **Estimated scope**: 2 files (`packages/hig/native/src/animated-number.tsx`, `tests/native/animated-number.test.cjs`), ~6 changed lines + 1 new test

## Problem

`AnimatedNumberReadout` on React Native renders a vertical "reel" of digit glyphs for every changed numeric place and slides it with a Reanimated `translateY`. Each reel mounts **30** `Text` rows so it can wrap in either direction:

```tsx
// packages/hig/native/src/animated-number.tsx:17-18 — current
 const position=useSharedValue(digit),previousDigit=useRef(digit);
 const animatedStyle=useAnimatedStyle(()=>({transform:[{translateY:-(position.value+10)*height}]}),[height]);
```

```tsx
// packages/hig/native/src/animated-number.tsx:27-32 — current
  const current=position.value;if(!Number.isFinite(current)){position.value=digit;return;}
  const normalized=current>=0&&current<10?current:((current%10)+10)%10;if(normalized!==current)position.value=normalized;
  let destination=digit;
  if(trend>0)while(destination<=normalized)destination+=10;
  else if(trend<0)while(destination>=normalized)destination-=10;
  if(destination===normalized){position.value=digit;return;}
```

```tsx
// packages/hig/native/src/animated-number.tsx:36-37 — current
 const rows=Array.from({length:30},(_,index)=>digits[index%10]);
 return <View collapsable={false} style={{width,height,overflow:'hidden'}}><Reanimated.View style={animatedStyle}>{rows.map(...)}</Reanimated.View></View>;
```

Today the position lives in `[-10, 20)`, so rows cover three full 0–9 cycles. A price like `$12,345.67` mounts 7 reels × 30 = 210 `Text` nodes, plus 10 hidden measurement `Text` nodes. A `FlatList` of 30 prices mounts more than 6,000 `Text` nodes before the first frame. That is real mount latency and scroll cost on mid-range Android hardware, for glyphs that are almost never visible.

Two cycles (20 rows) are enough. If the reel always starts in the cycle that leaves room in the direction of travel, every move fits:
- **Counting up (`trend > 0`):** start in `[0, 10)`. The destination is at most `start + 10`, which is below 20.
- **Counting down (`trend < 0`):** start in `[10, 20)`. The destination is at least `start - 10`, which is 0 or more.
- **Neutral (`trend === 0`):** start in `[0, 10)` and go straight to the digit.

Rows `i` and `i + 10` show the same glyph, so moving the start into the other cycle is invisible.

## Target

- Rows per reel: **20** (`digits[index % 10]` for index 0–19).
- Row 0 sits at the top of the clip: `translateY = -position * height`. The `+10` offset goes away.
- Start normalization: `cycle = trend < 0 ? 10 : 0`. Keep `current` if it is already in `[cycle, cycle + 10)`; otherwise use `((current % 10) + 10) % 10 + cycle`. (Always recomputing turns 9.4 into 9.399999999999999 through floating-point modulo, which breaks the existing retarget test.)
- Destination search starts at `digit + 10` when counting down and at `digit` otherwise. The existing `while` loops stay as they are.
- Duration, easing, reduced-motion snapping, retargeting from the current position, and cleanup cancellation are all **unchanged**.

## Repo conventions to follow

- The source is written in dense one-line style with no spaces around operators. Match it exactly and don't reformat neighbouring code.
- Native tests live in `tests/native/*.test.cjs` and use the Reanimated mock in `tests/native/setup.cjs`. In that mock, `withTiming` returns `{__numberTiming,toValue,config}`, and writing it to a shared value is recorded in `global.__numberReanimated.animations` as `{value,toValue,config}`.
- Exemplar test to imitate: `tests/native/animated-number.test.cjs:87` ("retargets from the current reel position…").

## Steps

1. In `packages/hig/native/src/animated-number.tsx` line 18, change the transform:
   ```tsx
   const animatedStyle=useAnimatedStyle(()=>({transform:[{translateY:-position.value*height}]}),[height]);
   ```
2. In the same file, replace lines 28–29 (the `normalized` line and the `let destination` line) with:
   ```tsx
     const cycle=trend<0?10:0,normalized=current>=cycle&&current<cycle+10?current:((current%10)+10)%10+cycle;if(normalized!==current)position.value=normalized;
     let destination=trend<0?digit+10:digit;
   ```
   Leave lines 30–32 (the two `while` loops and the `destination===normalized` early return) exactly as they are.
3. In the same file, line 36, change `length:30` to `length:20`:
   ```tsx
    const rows=Array.from({length:20},(_,index)=>digits[index%10]);
   ```
4. In `tests/native/animated-number.test.cjs`, add this test directly after the test that starts on line 87 ("retargets from the current reel position…"):
   ```js
   it('wraps a downward reel inside two glyph cycles',()=>{
    jest.spyOn(PixelRatio,'getFontScale').mockReturnValue(1);
    mount(example({value:10,trend:-1},{reducedMotion:false}));measure();const state=global.__numberReanimated;
    const reelRows=()=>root.root.findAllByType(RNText).filter(node=>{const style=StyleSheet.flatten(node.props.style);return style?.textAlign==='center'&&style?.height===56;});
    expect(reelRows()).toHaveLength(40);
    update(example({value:9,trend:-1},{reducedMotion:false}));
    const down=state.animations.find(animation=>animation.toValue===9);
    expect(down).toBeTruthy();expect(down.value.value).toBe(10);
   });
   ```
   Why these values: `10` has two digit reels × 20 rows = 40. `measure()` reports a glyph height of 56. The ones place goes from 0 to 9 counting down, so it moves to the second cycle (position 10) and animates to 9.

## Boundaries

- Do NOT change `clampedDuration`, the easing, `ReduceMotion.Never`, the reduced-motion branches, or the cleanup `useEffect`.
- Do NOT touch `packages/hig/native/src/animated-number-model.ts`, the web `packages/hig/react/src/animated-number.tsx`, or the measurement/overlay markup in `AnimatedNumberReadout`.
- Do NOT add dependencies or change the Reanimated mock in `tests/native/setup.cjs`.
- Do NOT change existing test expectations. The current assertions (`toValue` 10, 11, 2 and 0) are all upward or neutral moves and must still pass unchanged. If one fails, stop and report.
- If any quoted line doesn't match the file (it has changed since `c67e169`), STOP and report instead of improvising.

## Verification

- **Mechanical**:
  - `npx jest --config jest.native.config.cjs tests/native/animated-number.test.cjs`: all tests pass, including the new one.
  - `npm run test:native`: all suites pass.
  - `npm run typecheck` and `npm run lint`: both exit 0.
- **Feel check** (needs a simulator or a real device; jsdom can't show it):
  - Run the native fixture (`npm run start -w hig-native-fixture`). Drive an `AnimatedNumberReadout` up across a carry (999.99 → 1000.01), then down across a borrow (1000.01 → 999.99), then burst-tap updates.
  - Counting up, digits roll up. Counting down, digits roll down. 9→0 going up and 0→9 going down each move exactly one row and never spin a full cycle.
  - Interrupting mid-roll continues from where the reel is. It never snaps back to the start.
  - At no point does an empty slot (blank row) show inside the clip window, including on the final frame of a 9→0 wrap.
  - Turn on the OS Reduce Motion setting: digits change instantly with no roll.
  - Optional: with React DevTools, count the `Text` hosts under one reel. Expect 20, down from 30.
- **Done when**: `rows` has length 20, the transform has no `+10`, the new downward test passes, and the whole native suite is green.
