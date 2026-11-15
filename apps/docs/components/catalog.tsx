import Link from 'next/link';
import content from '@/src/content.json';

export function ComponentGroup({family}: {family: string}) {
  return <ul className="component-list not-prose">
    {content.catalog.filter(entry => entry.family === family).map(entry => (
      <li key={entry.route}><Link href={`/docs/${entry.route}`} className="component-link">{entry.name}</Link></li>
    ))}
  </ul>;
}
