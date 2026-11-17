import content from '@/src/content.json';

/**
 * A component is new when it was added after the last release: planning/examples.json marks it `"added": "Unreleased"`.
 * At a release, replace "Unreleased" with the version being released; the badge then stays for that version's docs and
 * drops by itself at the next one.
 */
export const isNew = (entry: {added?: string}): boolean => entry.added === 'Unreleased' || entry.added === content.version;

/** Routes of the new components, as page URLs. */
export const newRoutes: ReadonlySet<string> = new Set(content.catalog.filter(isNew).map(entry => `/docs/${entry.route}`));
