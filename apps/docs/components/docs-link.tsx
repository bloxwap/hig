'use client';

import Link from 'next/link';
import {useState,type ComponentProps} from 'react';

export function DocsLink({onMouseEnter, onFocus, prefetch, href, ...props}: ComponentProps<'a'> & {prefetch?:boolean}) {
  const [intent, setIntent] = useState(false);
  if (href === undefined) return <a {...props} onMouseEnter={onMouseEnter} onFocus={onFocus}/>;
  return <Link {...props} href={href} prefetch={prefetch ?? (intent ? null : false)}
    onMouseEnter={event => { setIntent(true); onMouseEnter?.(event); }}
    onFocus={event => { setIntent(true); onFocus?.(event); }}/>;
}
