# @bloxwap/hig/react

Version 0.2.0, an entry of `@bloxwap/hig`. Import individual entries; see docs/components for platform and accessibility contracts.

Set a brand accent with `<HIGProvider primaryColor='#ff0000'>` from
`@bloxwap/hig/react/provider`. It accepts opaque sRGB hex (`#RGB` or `#RRGGBB`),
sets action/focus colours, and selects black or white text on primary fills.
Omit it to keep Bloxwap green. Nested providers inherit the accent.
Status and buy/sell colours stay independent. See [the colour guide](../../../docs/foundations/platform.md#primary-brand-colour).

## Mobile hosts

`@bloxwap/hig/react/css` handles the component layer on touch devices: hover styles apply only to a precise
pointer (`hover: hover` and `pointer: fine`), controls fire click without the double-tap-zoom wait and draw their
own press state instead of the browser's tap flash, control labels can't be selected by a long press, text
fields use at least 16px on touch so iOS doesn't zoom into them, and edge sheets and dialogs leave room for
`env(safe-area-inset-*)`. It never styles `html`, `body` or the viewport. Set those in the host:

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<meta name="theme-color" content="#0a0a0a" />
```

Hosts don't need their own sticky-hover overrides for HIG components, and should remove any they have. An
override keyed to HIG class names stops matching silently when a release renames a class or changes a rule's
specificity. HIG keeps every `:hover` rule behind `(hover: hover) and (pointer: fine)`, and `tests/touch-css.test.ts`
fails the build if one escapes.

`viewport-fit=cover` is what makes the safe-area insets non-zero. Don't add `maximum-scale` or `user-scalable=no`.
Add `overscroll-behavior: none` to `html, body` only if the app owns its own scrolling and you don't want pull-to-refresh.
