// Records tests/test-utils/boring-avatars-beam.json from the real boring-avatars package and compares the HIG model with it on
// many more seeds. boring-avatars is not a dependency of this repository, so point this at any directory that has it installed
// with react and react-dom (build the contracts entry first):
//   node tests/test-utils/record-boring-avatars.mjs /path/to/a/project/with/boring-avatars
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const host=process.argv[2];
if(!host)throw new Error('Usage: node tests/test-utils/record-boring-avatars.mjs <directory with boring-avatars, react and react-dom installed>');
const require=createRequire(resolve(host,'package.json'));
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const {default:Boring}=await import(pathToFileURL(require.resolve('boring-avatars')).href);
const {version}=require('boring-avatars/package.json');
const {beamAvatar}=await import(pathToFileURL(resolve('packages/hig/contracts/dist/avatar.js')).href);
const decode=text=>text.replace(/&quot;/g,'"').replace(/&#x27;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
const attribute=(tag,name)=>{const match=new RegExp(`\\s${name}="([^"]*)"`).exec(tag);return match?decode(match[1]):undefined;};
/** The face boring-avatars renders, in the terms of the HIG description. The mask that rounds its drawing is left out. */
function theirs(seed,colors){
 const svg=renderToStaticMarkup(React.createElement(Boring,{name:seed,variant:'beam',colors,size:40})),body=svg.slice(svg.indexOf('</mask>'));
 const rects=[...body.matchAll(/<rect[^>]*>/g)].map(match=>match[0]),groups=[...body.matchAll(/<g[^>]*>/g)].map(match=>match[0]),path=/<path[^>]*>/.exec(body)[0];
 const face={backgroundColor:attribute(rects[0],'fill'),wrapperColor:attribute(rects[1],'fill'),wrapperTransform:attribute(rects[1],'transform'),wrapperRadius:Number(attribute(rects[1],'rx')),faceTransform:attribute(groups[1],'transform'),mouthPath:attribute(path,'d'),mouthStroked:attribute(path,'fill')==='none',faceColor:attribute(path,'stroke')??attribute(path,'fill'),leftEyeX:Number(attribute(rects[2],'x')),rightEyeX:Number(attribute(rects[3],'x'))};
 if(attribute(rects[2],'fill')!==face.faceColor||attribute(rects[3],'fill')!==face.faceColor)throw new Error(`Eyes and mouth differ for ${JSON.stringify(seed)}`);
 return face;
}
const palettes={boring:['#92A1C6','#146A7C','#F0AB3D','#C271B4','#C20D90'],vivid:['#00FF00','#00BBFF','#FF14A0','#FFFA00','#C300FF']};
const recordedSeeds=['','a','anon','bloxwap','Clara Barton','Demo account','0x1111111111111111111111111111111111111111','0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045','0xD8DA6BF26964AF9D7EED9E03E53415D37AA96045','twitter:joeblau','email:someone@example.com','sim:k3j9x0aa','日本語のなまえ','😀 emoji','Maria Mitchell','Sojourner Truth'];
const faces=recordedSeeds.flatMap(seed=>Object.keys(palettes).map(palette=>({seed,palette,...theirs(seed,palettes[palette])})));
const source=`Recorded from the rendered SVG of boring-avatars ${version}, variant "beam" (MIT). Regenerate only against that package.`;
writeFileSync('tests/test-utils/boring-avatars-beam.json',`{\n "source": ${JSON.stringify(source)},\n "palettes": ${JSON.stringify(palettes)},\n "faces": [\n${faces.map(face=>`  ${JSON.stringify(face)}`).join(',\n')}\n ]\n}\n`);
// A wider comparison than the recording: printable-ASCII seeds, addresses, and palettes of one to seven colours.
let state=1234567;const random=()=>(state=(state*1103515245+12345)&0x7fffffff);
const seeds=[...recordedSeeds];
for(let index=0;index<4000;index++){let seed='';for(let length=1+random()%44;length>0;length--)seed+=String.fromCharCode(32+random()%95);seeds.push(seed);}
for(let index=0;index<1000;index++){let seed='0x';for(let digit=0;digit<40;digit++)seed+='0123456789abcdef'[random()%16];seeds.push(seed);}
const compared=[...Object.values(palettes),['#00ff3f','#35b5ff','#ff479c','#fffb38'],['#000000','#ffffff'],['#123456'],['#0a0a0a','#fafafa','#808080','#7f7f7f','#111111','#eeeeee','#ff0000']];
let count=0;const mismatches=[];
for(const colors of compared)for(const seed of seeds){
 const expected=theirs(seed,colors),actual=beamAvatar(seed,colors);count++;
 const wrong=Object.keys(expected).filter(key=>!Object.is(expected[key],actual[key]));
 if(wrong.length)mismatches.push({seed,colors,wrong});
}
console.log(`boring-avatars ${version}: recorded ${faces.length} faces; compared ${count} faces with the HIG model, ${mismatches.length} mismatches`);
if(mismatches.length){console.error(JSON.stringify(mismatches.slice(0,5),null,1));process.exit(1);}
