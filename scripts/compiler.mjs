// Picks the TypeScript compiler for builds and typechecks.
// tsrs (Rust port of the TypeScript 7 compiler) ships native binaries for macOS arm64 and Linux x64/arm64 only.
// On other platforms (Windows, Intel Macs), or when `--tsc` is passed, fall back to TypeScript 7's tsc
// (`typescript-7`, an alias of typescript@7.0.2), whose output is byte-identical to tsrs.
// The root `typescript` package stays on 6.0.3 for typescript-eslint and the scripts that use its JS API.
import {fileURLToPath} from 'node:url';
export const tsrsSupported=(process.platform==='darwin'&&process.arch==='arm64')||(process.platform==='linux'&&['x64','arm64'].includes(process.arch));
export const useTsc=process.argv.includes('--tsc')||!tsrsSupported;
const tsc7=fileURLToPath(new URL('../node_modules/typescript-7/bin/tsc',import.meta.url));
/** [command, ...args] that runs the selected compiler. */
export const compilerCommand=useTsc?[process.execPath,tsc7]:['npx','tsrs'];
