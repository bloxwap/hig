'use client';

import type {DemoProps} from '../src/demo';
import dynamic from 'next/dynamic';

const loadComponent=()=>import('../src/component-preview').then(module=>module.ComponentPreview);
const loadBlock=()=>import('../src/block-preview').then(module=>module.BlockPreview);

// Fetch the shell, the controls this route uses and any known example in parallel.
async function loadDemo(renderer:ReturnType<typeof loadComponent>,group?:Promise<typeof import('../src/example-groups/button')>){
 const [shell,Renderer,preview]=await Promise.all([import('../src/demo'),renderer,group]);
 return function RouteDemo(props:DemoProps){return <shell.Demo {...props} Renderer={Renderer} Preview={preview?.Example}/>;};
}
const ComponentDemo=dynamic<DemoProps>(()=>loadDemo(loadComponent()));
const BlockDemo=dynamic<DemoProps>(()=>loadDemo(loadBlock()));
const ButtonDemo=dynamic<DemoProps>(()=>loadDemo(loadComponent(),import('../src/example-groups/button')));
const LoginDemo=dynamic<DemoProps>(()=>loadDemo(import('../src/tabbed-block-preview').then(module=>module.LoginPlatformPreview),import('../src/web-login-preview')));
const ModalDemo=dynamic<DemoProps>(()=>loadDemo(import('../src/tabbed-block-preview').then(module=>module.ModalBlockPreview),import('../src/example-groups/blocks-modal-block')));
const DepositDemo=dynamic<DemoProps>(()=>loadDemo(loadBlock(),import('../src/example-groups/blocks-deposit-block')));
const SwapDemo=dynamic<DemoProps>(()=>loadDemo(loadBlock(),import('../src/example-groups/blocks-swap-block')));
const ClaimRewardDemo=dynamic<DemoProps>(()=>loadDemo(loadBlock(),import('../src/example-groups/blocks-claim-reward-block')));
const FlowDemo=dynamic<DemoProps>(async()=>{
 const [shell,flow]=await Promise.all([import('../src/demo'),import('../src/token-action-flow')]);
 return function FlowDemo(props:DemoProps){return <shell.Demo {...props} Flow={flow.default}/>;};
});
const routeDemos:Readonly<Record<string,typeof ComponentDemo>>={
 Button:ButtonDemo,IconButton:ButtonDemo,Link:ButtonDemo,
 LoginBlock:LoginDemo,ModalBlock:ModalDemo,DepositBlock:DepositDemo,SwapBlock:SwapDemo,ClaimRewardBlock:ClaimRewardDemo,
};
export function Demo(props:DemoProps){
 if(props.route==='flow/token-action-flow')return <FlowDemo {...props}/>;
 const entry=props.catalogEntry;
 const Preview=routeDemos[entry?.name??'']??(entry?.family==='blocks'||entry?.family==='recipes'?BlockDemo:ComponentDemo);
 return <Preview {...props}/>;
}
