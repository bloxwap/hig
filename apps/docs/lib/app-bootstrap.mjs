import {appBootstrap as bootstrap} from 'next/dist/client/app-bootstrap.js';

export function appBootstrap(hydrate) {
  bootstrap(() => {
    if (globalThis.scheduler?.yield) {
      globalThis.scheduler.yield().then(hydrate);
    } else {
      setTimeout(hydrate, 0);
    }
  });
}
