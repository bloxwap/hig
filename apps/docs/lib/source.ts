import {createElement, Fragment} from 'react';
import {loader} from 'fumadocs-core/source';
import type {Folder} from 'fumadocs-core/page-tree';
import {docs} from '../.source/server';
import groups from '@/src/component-groups.json';
import content from '@/src/content.json';
import {newRoutes} from './fresh';

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
          children: node.children.filter(child => child.type === 'page' && families.get(child.url) === group.family)
            // A component added since the last release carries a badge after its name.
            .map(child => child.type === 'page' && newRoutes.has(child.url) ? {...child, name: createElement(Fragment, null, child.name, createElement('span', {className: 'docs-new'}, 'New'))} : child),
        }));
        return {...node, children: children.filter(group => group.children.length > 0)};
      },
    }],
  },
});
