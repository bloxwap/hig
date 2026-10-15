import {loader} from 'fumadocs-core/source';
import type {Folder} from 'fumadocs-core/page-tree';
import {docs} from '../.source/server';
import groups from '@/src/component-groups.json';
import content from '@/src/content.json';

const families = new Map(content.catalog.map(entry => [`/docs/${entry.route}`, entry.family]));

export const source = loader({
  baseUrl: '/docs',
  source: docs.toFumadocsSource(),
  pageTree: {
    transformers: [{
      folder(node) {
        if (node.$ref?.folder !== 'components') return node;
        const children: Folder[] = groups.map(group => ({
          type: 'folder',
          $id: `component-family:${group.family}`,
          name: group.title,
          description: group.description,
          children: node.children.filter(child => child.type === 'page' && families.get(child.url) === group.family),
        }));
        return {...node, children: children.filter(group => group.children.length > 0)};
      },
    }],
  },
});
