// HIG's stylesheet subpath exports resolve to .css files that Next bundles. TypeScript 6+ checks
// side-effect imports by default (noUncheckedSideEffectImports), so a consumer declares them.
declare module '@bloxwap/hig-tokens/css';
declare module '@bloxwap/hig-react/css';
declare module '@bloxwap/hig-react/css/base';
