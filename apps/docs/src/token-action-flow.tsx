'use client';

import {useState} from 'react';
import {Button} from '@bloxwap/hig/react/button';

function loadAccount() {
  return Promise.all([import('./token-action-sheet'), import('@bloxwap/hig/react/blocks/account-block')]);
}
function warmAccount() {
  void loadAccount().catch(() => {});
}

export default function TokenActionFlow() {
  const [modules, setModules] = useState<Awaited<ReturnType<typeof loadAccount>>>();
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');

  async function openAccount() {
    setStatus('loading');
    try {
      setModules(await loadAccount());
    } catch {
      setStatus('error');
    }
  }

  const Sheet = modules?.[0].default;
  return <section className="example-frame example-canvas" aria-label="Token action flow example">
    {Sheet && modules ? <Sheet AccountBlock={modules[1].AccountBlock}/> :
      <Button aria-haspopup="dialog" aria-expanded={false} aria-busy={status === 'loading'}
        onFocus={warmAccount} onPointerEnter={warmAccount} onPointerDown={warmAccount} onClick={openAccount}>
        {status === 'loading' ? 'Opening account…' : status === 'error' ? 'Retry opening account' : 'Open account'}
      </Button>}
  </section>;
}
