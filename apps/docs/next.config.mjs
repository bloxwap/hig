import {createMDX} from 'fumadocs-mdx/next';
// Type errors are checked by `tsrs --noEmit` in the `build`/`check` scripts before `next build` runs,
// so Next's built-in (TypeScript 5.x) type-check pass is skipped instead of running twice.
export default createMDX()({output:'export',trailingSlash:true,basePath:process.env.NEXT_PUBLIC_BASE_PATH??(process.env.NODE_ENV==='development'?'':'/hig'),images:{unoptimized:true},typescript:{ignoreBuildErrors:true}});
