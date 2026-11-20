'use client';

import {lazy, Suspense, useEffect, useRef, useState} from 'react';
import {Example} from '../src/examples';

const LazyModalPreview = lazy(() => import('../src/modal-preview'));
function ModalPreview(props: React.ComponentProps<typeof LazyModalPreview>) {
  return <LazyModalPreview {...props}/>;
}
const FeedbackBlock = lazy(() => import('../src/feedback-block'));

const previewStates: Record<string, string> = {SwapBlock: 'swap', QRCode: 'dark-on-light'};

export function HomeBlockPreview({name, eager}: {name: string; eager: boolean}) {
  const host = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(eager);

  useEffect(() => {
    if (visible || !host.current) return;
    if (!window.IntersectionObserver) { setVisible(true); return; }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, {rootMargin: '240px'});
    observer.observe(host.current);
    return () => observer.disconnect();
  }, [visible]);

  const placeholder = <div className="home-preview-placeholder" aria-hidden="true"/>;
  return <div ref={host} className="home-preview">
    {visible ? <Suspense fallback={placeholder}>
      {name === 'FeedbackBlock' ? <FeedbackBlock/> :
        <Example name={name} state={previewStates[name]} previewDialog={name === 'ModalBlock' ? ModalPreview : undefined}/>}
    </Suspense> : placeholder}
  </div>;
}
