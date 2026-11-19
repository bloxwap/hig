import {createRequire} from 'node:module';
import {hintRuntimeCompilation} from './runtime-compile-hints.mjs';
import {shareRadixResolution} from './radix-resolution.mjs';
import {fileURLToPath} from 'node:url';
import {dirname,relative,sep} from 'node:path';
import {build as buildClassTables} from 'cn/build';
import {PHASE_PRODUCTION_BUILD} from 'next/constants.js';
import {basePath,origin} from './site-config.mjs';
import {createMDX} from 'fumadocs-mdx/next';

const docsDir=dirname(fileURLToPath(import.meta.url));
const docsUi=dirname(createRequire(import.meta.url).resolve('fumadocs-ui/mdx'));
const config=createMDX()({
 output:'export',trailingSlash:true,basePath,
 env:{NEXT_PUBLIC_BASE_PATH:basePath,HIG_DOCS_ORIGIN:origin},
 images:{unoptimized:true},
 // The build and check scripts type-check before invoking Next.
 typescript:{ignoreBuildErrors:true},
 webpack(config,{dev,isServer,webpack}){
  config.plugins.push(new webpack.NormalModuleReplacementPlugin(/^@radix-ui\/react-scroll-area$/,request=>{
   if(request.context.split(sep).join('/').endsWith('/fumadocs-ui/dist/components/sidebar'))request.request=fileURLToPath(new URL('./components/sidebar-scroll-area.tsx',import.meta.url));
  }));
  if(!dev){
   // Fumadocs uses cn only through its utility module. Its table is fitted to the classes this site can supply.
   config.plugins.push(new webpack.NormalModuleReplacementPlugin(/^cn$/,request=>{
    if(request.context.split(sep).join('/').endsWith('/fumadocs-ui/dist/utils'))request.request=fileURLToPath(new URL('./lib/docs-classes.mjs',import.meta.url));
   }));
   // Ordinary highlighted snippets use the same module as tabbed examples.
   config.plugins.push(new webpack.NormalModuleReplacementPlugin(/^\.\/ui\/tabs\.js$/,request=>{
    if(request.context.split(sep).join('/').endsWith('/fumadocs-ui/dist/components'))request.request=fileURLToPath(new URL('./components/code-tabs.tsx',import.meta.url));
   }));
   // The default shell imports optional popovers for language, sidebar tabs and page actions.
   config.plugins.push(new webpack.NormalModuleReplacementPlugin(/^(?:\.\.\/)+(?:components\/)?ui\/popover\.js$/,request=>{
    if(request.context.split(sep).join('/').includes('/fumadocs-ui/dist/'))request.request=fileURLToPath(new URL('./components/docs-popover.tsx',import.meta.url));
   }));
  }
  if(!dev && !isServer){
   config.plugins.push(shareRadixResolution(webpack),hintRuntimeCompilation(webpack));
   // Defer the result renderer until the first query, keeping it off the dialog-open path.
   config.plugins.push(new webpack.NormalModuleReplacementPlugin(/^hast-util-to-jsx-runtime$/,request=>{
    if(request.context.split(sep).join('/').endsWith('/fumadocs-ui/dist/components/dialog'))request.request=fileURLToPath(new URL('./components/search-result-markup.ts',import.meta.url));
   }));
   // Let the browser finish evaluating the runtime before starting hydration.
   config.plugins.push(new webpack.NormalModuleReplacementPlugin(/^\.\/app-bootstrap$/,request=>{
    if(request.context.split(sep).join('/').endsWith('/next/dist/client'))request.request=fileURLToPath(new URL('./lib/app-bootstrap.mjs',import.meta.url));
   }));
   // Page, layout and async panels use the same fitted table.
   config.optimization.splitChunks.cacheGroups.docsClasses={
    test:/[\\/](?:cn[\\/]dist[\\/]engine\.js|docs[\\/](?:lib[\\/]docs-classes|\.source[\\/]cn-tables)\.mjs)$/,
    name:'docs-classes',chunks:'all',minChunks:2,minSize:0,priority:45,reuseExistingChunk:true,
   };
   // Share small modules used across independently loaded gallery previews.
   config.optimization.splitChunks.cacheGroups.sharedPreviews={
    test:/[\\/](?:packages[\\/]hig|node_modules)[\\/]/,
    minChunks:2,minSize:4000,reuseExistingChunk:true,priority:10,
   };
  }
  config.resolve.alias['react-native$']='react-native-web';
  // Metro picks the backdrop by platform. This browser build can import the web implementation directly.
  config.module.rules.push({
   test:/[\\/]native[\\/]dist[\\/](?:overlay|gesture-sheet)\.js$/,
   resolve:{alias:{'./backdrop-blur.js$':fileURLToPath(new URL('../../packages/hig/native/dist/backdrop-blur-view.web.js',import.meta.url))}},
  });
  // LoginBlock and its sheet header draw SVG shapes. Resolve them directly to the SVG
  // library's browser shapes so its XML, URI loader and Buffer stay out.
  config.module.rules.push({
   test:/[\\/]native[\\/]dist[\\/](?:login-block|sheet-header-glow)\.js$/,
   resolve:{alias:{'react-native-svg$':createRequire(import.meta.url).resolve('react-native-svg/lib/module/elements.web.js')}},
  });
  // Native previews use the shared icons' browser renderer.
  config.resolve.alias['@bloxwap/icons/native']=dirname(createRequire(import.meta.url).resolve('@bloxwap/icons/react/info'));
  config.resolve.extensions.unshift('.web.js');
  return config;
 },
});

export default async function nextConfig(phase){
 if(phase===PHASE_PRODUCTION_BUILD){
  await buildClassTables({
   cwd:docsDir,out:'.source/cn-tables.mjs',
   // Keep the content utility group for Fumadocs pseudo-elements with quoted arbitrary values.
   safelist:'lib/cn-safelist.txt',
   content:['app/**/*.{tsx,ts,css}','components/**/*.{tsx,ts}','lib/**/*.{tsx,ts}','src/**/*.{tsx,ts}',
    'content/**/*.{md,mdx}','mdx-components.tsx',relative(docsDir,docsUi).split(sep).join('/')+'/**/*.js'],
  });
 }
 return config;
}
