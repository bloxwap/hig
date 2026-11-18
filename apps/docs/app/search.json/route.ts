import { createFromSource } from 'fumadocs-core/search/server';
import { source } from '@/lib/source';

export const dynamic = 'force-static';
export const { staticGET: GET } = createFromSource(source, {
  language: 'english',
  // The dialog ranks by relevance and never orders by a document field.
  sort: { enabled: false },
});
