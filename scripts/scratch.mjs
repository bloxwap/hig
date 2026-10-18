import {mkdtempSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
/** Prefer GitHub Actions `$RUNNER_TEMP`; never assume GNU `/tmp` layout. */
export function scratchRoot(){
 const root=process.env.RUNNER_TEMP||process.env.TMPDIR||tmpdir();
 mkdirSync(root,{recursive:true});
 return root;
}
export function scratchDir(prefix){return mkdtempSync(join(scratchRoot(),prefix));}
