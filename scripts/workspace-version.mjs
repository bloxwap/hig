import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

// Read this checkout's coordinated version even when a consumer runs from another cwd.
export const workspaceVersion=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8')).version;
export const packedTarball=(name,directory='artifacts')=>resolve(directory,`bloxwap-hig-${name}-${workspaceVersion}.tgz`);
