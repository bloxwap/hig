import Link from 'next/link';
import {ArrowUpRight} from 'lucide-react';
import content from '@/src/content.json';

export function ComponentGroup({family}: {family: string}) {
  return <div className="component-grid not-prose">
    {content.catalog.filter(entry => entry.family === family).map(entry => (
      <Link key={entry.route} href={`/docs/${entry.route}`} className="component-card">
        <span>{entry.name}</span>
        <ArrowUpRight size={16} aria-hidden="true" />
      </Link>
    ))}
  </div>;
}
