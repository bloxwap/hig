import {readFileSync,readdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
export function driftViolations(source,path,exceptions=[]){const rules=[{id:'obsolete-import',pattern:/from\s*['"](?:@workspace\/(?:tokens|ui(?:-native)?)|@\/components\/ui\/)/},{id:'copied-palette',pattern:/#(?:00ff3f|ff5c5c|171717|262626)\b/i}];return rules.filter(rule=>rule.pattern.test(source)&&!exceptions.some(e=>e.path===path&&e.rule===rule.id&&e.reason&&e.owner&&new Date(e.expires)>new Date())).map(rule=>({path,rule:rule.id}));}
function files(path){return readdirSync(path,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(`${path}/${e.name}`):/\.(tsx?|css)$/.test(e.name)?[`${path}/${e.name}`]:[]);}
export function checkDrift(){const config=JSON.parse(readFileSync('planning/drift-exceptions.json','utf8'));const paths=['packages/react/src','packages/native/src','fixtures/web/src','apps/docs/src'];const violations=paths.flatMap(root=>files(root)).flatMap(path=>driftViolations(readFileSync(path,'utf8'),path,config.exceptions));if(violations.length)throw Error(`Design drift: ${JSON.stringify(violations)}`);console.log('Scoped anti-drift: passed');}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))checkDrift();
