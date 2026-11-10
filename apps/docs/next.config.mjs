import {basePath,origin} from './site-config.mjs';
import {createMDX} from 'fumadocs-mdx/next';
// Type errors are checked by `tsrs --noEmit` in the `build`/`check` scripts before `next build` runs,
// so Next's built-in (TypeScript 5.x) type-check pass is skipped instead of running twice.
export default createMDX()({output:'export',trailingSlash:true,basePath,env:{NEXT_PUBLIC_BASE_PATH:basePath,HIG_DOCS_ORIGIN:origin},images:{unoptimized:true},typescript:{ignoreBuildErrors:true}});
