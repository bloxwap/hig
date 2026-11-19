import sitePackage from '../package.json';
import type {BaseLayoutProps} from 'fumadocs-ui/layouts/shared';
import {basePath} from '../site-config.mjs';
export {basePath};
export const asset=(path:string)=>`${basePath}${path}`;
export const navigationLinks=[{text:'Docs',url:'/docs',active:'nested-url' as const},{text:'Components',url:'/docs/catalog'},{text:'Blocks',url:'/#blocks'}];
export const githubUrl='https://github.com/bloxwap/hig';
export function SiteBrand(){return <span className='brand'><img src={asset('/favicon.svg')} alt='' width={28} height={28}/><span className='brand-name'>Bloxwap / HIG<small>{sitePackage.version}</small></span></span>;}
export function layoutOptions():BaseLayoutProps{return {nav:{title:<SiteBrand/>,url:'/'},githubUrl,themeSwitch:{enabled:false},links:navigationLinks};}
