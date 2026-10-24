import {workspaceVersion} from './workspace-version.mjs';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import sharp from 'sharp';
import {createHash} from 'node:crypto';
const source='packages/tokens/assets/bloxwap-icon.svg';const svg=readFileSync(source,'utf8');
const geometry=svg.replace(/<metadata>[\s\S]*?<\/metadata>/,'').replace(/^<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'');
for(const directory of ['apps/docs/public','fixtures/next/public']){mkdirSync(directory,{recursive:true});writeFileSync(`${directory}/favicon.svg`,svg);}
const og=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><title>Bloxwap Human Interface Guidelines ${workspaceVersion}</title><desc>Generated from the approved Bloxwap mark; source SHA256 ${createHash('sha256').update(svg).digest('hex')}. Original credential metadata is retained only on the unchanged source and favicon.</desc><rect width="1200" height="630" fill="#0a0a0a"/><g transform="translate(80 80) scale(1.2)">${geometry}</g><text x="80" y="320" fill="#ffffff" font-family="sans-serif" font-size="64">Human Interface Guidelines</text><text x="84" y="400" fill="#b7b7b7" font-family="sans-serif" font-size="28">Clear decisions across web and native.</text><text x="84" y="540" fill="#00ff3f" font-family="monospace" font-size="24">BLOXWAP · ${workspaceVersion}</text></svg>\n`;
writeFileSync('apps/docs/public/og.svg',og);
// Raster social preview is derived from the same vector, never independently redrawn.
await sharp(Buffer.from(og)).png().toFile('apps/docs/public/og.png');
writeFileSync('planning/brand-artifacts.json',JSON.stringify({version:workspaceVersion,source,sourceSha256:createHash('sha256').update(svg).digest('hex'),derivatives:['apps/docs/public/favicon.svg','fixtures/next/public/favicon.svg','apps/docs/public/og.svg','apps/docs/public/og.png'],geometry:'Copied from approved source; no independently redrawn logo',socialFormat:'1200×630 PNG and SVG generated from the same approved source; no physical display certification'},null,2)+'\n');
console.log('Brand favicon/OG derivatives generated from approved SVG');
