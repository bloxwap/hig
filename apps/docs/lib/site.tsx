import type {BaseLayoutProps} from 'fumadocs-ui/layouts/shared';
export const basePath=process.env.NEXT_PUBLIC_BASE_PATH??(process.env.NODE_ENV==='development'?'':'/hig');
export const asset=(path:string)=>`${basePath}${path}`;
export function layoutOptions():BaseLayoutProps{return {nav:{title:<span className='brand'><img src={asset('/favicon.svg')} alt='' width={28} height={28}/>Bloxwap / HIG <small>0.1.0 candidate</small></span>,url:'/'},githubUrl:'https://github.com/bloxwap/hig',themeSwitch:{enabled:false},links:[{text:'Docs',url:'/docs',active:'nested-url'},{text:'Components',url:'/docs/catalog'},{text:'Playground',url:'/'}]};}
