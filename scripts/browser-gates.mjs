// One suite per CI job. Local runs without a selector still execute every suite.
export const browserGates = [
  ...['chromium','webkit'].map(engine => ({name: engine, server: 'web', args: ['scripts/browser-smoke.mjs','m5'], env: {HIG_BROWSER: engine}})),
  {name: 'expo', server: 'expo', args: ['scripts/expo-web-browser-smoke.mjs']},
  {name: 'acceptance', server: 'web', args: ['scripts/acceptance-browser-smoke.mjs']},
  ...['native-action','native-switch','segmented-control','qr-code','select','css-isolation','pro-data','number-flow','gesture-sheet','confetti','feedback','docs','catalog','next'].map(name => ({
    name,
    server: {confetti: 'expo', feedback: 'web', docs: 'docs', catalog: 'docs', next: 'next'}[name],
    args: [`scripts/${name}-browser-smoke.mjs`,'m5'],
  })),
];

export function selectBrowserGates(name, visualOnly = false) {
  if (visualOnly) {
    if (name && name !== 'catalog') throw Error('Visual-only runs require the catalog gate');
    name = 'catalog';
  }
  if (!name) return browserGates;
  const gate = browserGates.find(gate => gate.name === name);
  if (!gate) throw Error(`Unknown browser gate: ${name}`);
  return [gate];
}
