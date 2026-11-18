import type {toJsxRuntime as convert} from 'hast-util-to-jsx-runtime';

let renderer: typeof convert | undefined;

export async function loadSearchMarkup() {
  renderer ??= (await import('hast-util-to-jsx-runtime')).toJsxRuntime;
}

export const toJsxRuntime: typeof convert = (tree, options) => {
  // Search resolves the renderer alongside the worker request before publishing results.
  if (!renderer) throw loadSearchMarkup();
  return renderer(tree, options);
};
