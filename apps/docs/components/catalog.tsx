import {DocsLink} from './docs-link';
import content from '@/src/content.json';
import {isNew} from '@/lib/fresh';

export function ComponentGroup({family}: {family: string}) {
  return <ul className="component-list not-prose">
    {content.catalog.filter(entry => entry.family === family).map(entry => (
      <li key={entry.route}><DocsLink href={`/docs/${entry.route}`} className="component-link">{entry.name}</DocsLink>{isNew(entry) && <span className="docs-new">New</span>}</li>
    ))}
  </ul>;
}
