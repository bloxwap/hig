import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const source='docs/foundations/glossary.json';
const glossary=JSON.parse(readFileSync(source,'utf8'));
const untranslated={never:'no — translate in approved locales', 'short-form':'keep the listed short form in every locale','always':'yes — keep English'};
function bullets(label,items){return `**${label}:** ${items.join(' ')}`;}
const locales=[
  '| Locale | Status | Role |',
  '| --- | --- | --- |',
  ...glossary.locales.map(l=>`| \`${l.id}\` | ${l.status} | ${l.role} |`),
  ...glossary.pendingLocales.map(l=>`| \`${l.id}\` | ${l.status} | ${l.note} Observed: ${l.observedIn}. |`),
  ...glossary.notTranslationLocales.map(l=>`| \`${l.id}\` | not a translation locale | ${l.role} |`)
].join('\n');
const terms=glossary.terms.map(term=>{
  const translation=term.translations['en-US'];
  const aliases=term.aliases.length?`Aliases: ${term.aliases.map(a=>`\`${a}\``).join(', ')}. `: '';
  const keep=term.untranslatedForms.length?` Untranslated forms: ${term.untranslatedForms.map(a=>`\`${a}\``).join(', ')}.`:'';
  const related=term.seeAlso.length?`\n\nSee also: ${term.seeAlso.map(id=>`\`${id}\``).join(', ')}.`:'';
  const title=translation.term.replace(/^./,c=>c.toUpperCase());
  return `### ${title}${term.short&&term.short!==term.term?` (${term.short})`:''}

Term id: \`${term.id}\`. ${aliases}**Untranslated:** ${untranslated[term.untranslated]}.${keep}

**Definition:** ${term.definition}

**Usage:** ${term.usageNotes}

${bullets('Do',term.do)}

${bullets("Don't",term.dont)}${related}`;
}).join('\n\n');
const markdown=`# Trading glossary · HIG 0.1.0

Issue #46. Locked before any locale translation. Machine-readable source: \`docs/foundations/glossary.json\` (also exported as \`/hig/glossary.json\`). Formatting rules: [localization guide](localization.md).

Translation agents **must** consume the JSON. The rendered page is a view of that source. Do not invent terms, back-port product UI copy, or fill pending locales.

## Locales

${locales}

\`en-US\` is the only approved HIG glossary locale (\`defaultEnvironment.locale\`). Product message catalogs and store screenshots listed above are inventory observations, not approvals.

## Change process

1. Edit English fields in \`docs/foundations/glossary.json\` only. Do not hand-edit this Markdown.
2. Run \`node scripts/generate-glossary.mjs\` (also invoked by docs generation) and commit the JSON and Markdown together.
3. A term is locked when its English definition, usage notes, do/don't examples and \`untranslated\` flag are reviewed in this repository. Do not start translations before that lock.
4. Promote a pending locale only by setting \`status: approved\` and supplying \`translations[locale]\` for **every** term. Incomplete locales stay \`todo\`.
5. Never guess a translation. Product/marketing strings are not an approved glossary source.
6. Changing a locked definition is a breaking content change for translation agents. Call out term ids in the PR. Tickers, brand names and \`untranslatedForms\` never enter translation files.
7. \`de-DE\` and \`ar-EG\` remain Intl fixtures, not glossary locales.

This chapter blocks locale translation work until the JSON lock is adopted.

## Terms

${terms}
`;
writeFileSync('docs/foundations/glossary.md',markdown);
mkdirSync('apps/docs/public',{recursive:true});
writeFileSync('apps/docs/public/glossary.json',readFileSync(source));
console.log(`Glossary: ${glossary.terms.length} terms; ${glossary.locales.length} approved locale(s)`);
