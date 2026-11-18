import {createRequire} from 'node:module';
import {dirname} from 'node:path';
import {basePath,origin} from './site-config.mjs';
import {createMDX} from 'fumadocs-mdx/next';

export default createMDX()({
 output:'export',trailingSlash:true,basePath,
 env:{NEXT_PUBLIC_BASE_PATH:basePath,HIG_DOCS_ORIGIN:origin},
 images:{unoptimized:true},
 // The build and check scripts type-check before invoking Next.
 typescript:{ignoreBuildErrors:true},
 webpack(config){
  config.resolve.alias['react-native$']='react-native-web';
  // Native previews use the shared icons' browser renderer.
  config.resolve.alias['@bloxwap/icons/native']=dirname(createRequire(import.meta.url).resolve('@bloxwap/icons/react/info'));
  config.resolve.extensions.unshift('.web.js');
  return config;
 },
});
