// Metro resolves the platform suffix on extensionless requests. Keeping the
// public import explicit also supports bundlers that require ESM extensions.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const view: typeof import('./backdrop-blur-view.js') = require('./backdrop-blur-view');
export const BackdropBlur = view.BackdropBlur;
