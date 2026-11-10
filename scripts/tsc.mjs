// Shared CLI for root and workspace scripts; --tsc belongs to the selector.
import {spawnSync} from 'node:child_process';
import {compilerCommand} from './compiler.mjs';

const result=spawnSync(compilerCommand[0],[
 ...compilerCommand.slice(1),...process.argv.slice(2).filter(arg=>arg!=='--tsc')
],{stdio:'inherit'});
if(result.error)throw result.error;
process.exitCode=result.status??1;
