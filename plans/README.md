# Animation plans

These came from the `improve-animations` audit at commit `c67e169`. Each plan stands on its own: hand one file to any agent and it has everything it needs.

| # | Plan | Severity | Status |
|---|---|---|---|
| 001 | [Cut the native number reel from 30 to 20 rows per digit](001-native-number-reel-20-rows.md) | HIGH | DONE |
| 002 | [Ease the web button press instead of snapping it](002-web-button-press-transition.md) | MEDIUM | DONE |
| 003 | [Give AnimatedNumberReadout the standard HIG curve on web and native](003-animated-number-standard-easing.md) | MEDIUM | DONE |

## Recommended order

1. **002**: one CSS line with no dependencies. The quickest win, and it improves the most-pressed control.
2. **001**: the only real performance item. It cuts native mount cost by a third for every animated price.
3. **003**: after 001. Both edit `packages/hig/native/src/animated-number.tsx` and `tests/native/animated-number.test.cjs`, so run them one after the other, not in parallel. 003 finds its edit points by the quoted code, so line shifts from 001 don't matter.

002 can run in parallel with either of the others. It only touches `packages/hig/react/src/styles.css`.

## Audited but not planned

These were left out on purpose; see the audit for why:
- web switch thumb animates `inset-inline-start` (LOW)
- indeterminate progress repaints `background-position` (LOW)
- the web segmented indicator uses `inset-inline-start` (a documented WebKit rounding trade-off)
- the dynamic web sheet animates `height` (a `transform` would conflict with Vaul's drag transform)
- missed opportunities: web Dialog/Popover/Menu entrance motion, and native Dialog `animationType='fade'`
