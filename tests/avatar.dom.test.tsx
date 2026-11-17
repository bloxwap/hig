// @vitest-environment jsdom
import React,{Profiler} from 'react';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {readFileSync} from 'node:fs';
import {act,cleanup,fireEvent,render,screen} from '@testing-library/react';
import {hydrateRoot} from 'react-dom/client';
import {renderToStaticMarkup} from 'react-dom/server';
import {HIGProvider} from '../packages/hig/react/src/provider';
import {Avatar,avatarColorRoles,type AvatarProps} from '../packages/hig/react/src/avatar';
import * as status from '../packages/hig/react/src/status';
import {beamAvatar} from '../packages/hig/contracts/src/avatar';
import * as model from '@bloxwap/hig/contracts/avatar';
// The renderer's own import of the model, wrapped so a test can count how often a face is computed and how often an Avatar renders:
// every render of Avatar reads its size through `avatarSide` once, and nothing else calls it.
vi.mock('@bloxwap/hig/contracts/avatar',async importOriginal=>{const actual=await importOriginal<typeof import('@bloxwap/hig/contracts/avatar')>();return {...actual,beamAvatar:vi.fn(actual.beamAvatar),avatarSide:vi.fn(actual.avatarSide)};});
const computed=()=>vi.mocked(model.beamAvatar).mock.calls.length;
const rendered=()=>vi.mocked(model.avatarSide).mock.calls.length;
afterEach(cleanup);
const address='0x1111111111111111111111111111111111111111';
const vivid=['#00FF00','#00BBFF','#FF14A0','#FFFA00','#C300FF'];
const avatar=()=>document.querySelector<HTMLElement>('.hig-avatar')!;
/** What the inline SVG paints, read back in the model's own terms. */
function drawn(root:Element=avatar()){
 const svg=root.querySelector('svg')!,[backdrop,wrapper,leftEye,rightEye]=[...svg.querySelectorAll('rect')] as SVGRectElement[],group=svg.querySelector('g')!,mouth=svg.querySelector('path')!;
 return {viewBox:svg.getAttribute('viewBox'),backgroundColor:backdrop!.style.fill,wrapperColor:wrapper!.style.fill,wrapperTransform:wrapper!.getAttribute('transform'),wrapperRadius:Number(wrapper!.getAttribute('rx')),faceTransform:group.getAttribute('transform'),mouthPath:mouth.getAttribute('d'),mouthStroked:mouth.style.fill==='none',mouthInk:mouth.style.fill==='none'?mouth.style.stroke:mouth.style.fill,mouthCap:mouth.style.strokeLinecap,leftEyeX:Number(leftEye!.getAttribute('x')),rightEyeX:Number(rightEye!.getAttribute('x')),eyes:[leftEye!,rightEye!].map(eye=>[eye.getAttribute('y'),eye.getAttribute('width'),eye.getAttribute('height'),eye.getAttribute('rx'),eye.style.fill].join(' '))};
}

describe('Avatar entries',()=>{
 it('is published as react/avatar and native/avatar, with the shared model as contracts/avatar',()=>{
  const exportsMap=JSON.parse(readFileSync('packages/hig/package.json','utf8')).exports as Record<string,{types:string;import:string;default:string}>;
  for(const [key,file] of [['./react/avatar','./react/dist/avatar'],['./native/avatar','./native/dist/avatar'],['./contracts/avatar','./contracts/dist/avatar']] as const)expect(exportsMap[key],key).toEqual({types:`${file}.d.ts`,import:`${file}.js`,default:`${file}.js`});
 });
 it('the status entry still exports the same component',()=>{
  expect(status.Avatar).toBe(Avatar);
 });
});

describe('Avatar without the new props is what it was',()=>{
 it('draws the first two letters as a named image, with no inline style or new attribute',()=>{
  const {container}=render(<Avatar name='Demo account'/>);
  expect(container.innerHTML).toBe('<span role="img" aria-label="Demo account" class="hig-avatar">De</span>');
  expect(screen.getByRole('img',{name:'Demo account'}).textContent).toBe('De');
 });
 it('draws the image under its name, with no inline style or new attribute',()=>{
  const {container}=render(<Avatar name='Demo account' src='/demo.png'/>);
  expect(container.innerHTML).toBe('<img class="hig-avatar" alt="Demo account" src="/demo.png">');
 });
 it('keeps the 40px disc on the well fill in the stylesheet',()=>{
  expect(readFileSync('packages/hig/react/src/styles.css','utf8')).toContain('.hig-avatar { display:inline-grid;place-items:center;width:40px;height:40px;border-radius:9999px;background:var(--hig-fill); }');
 });
});

describe('Avatar generated face',()=>{
 it('is opted into with variant, seeded by the name, and painted from the token roles',()=>{
  render(<Avatar name='Demo account' variant='beam'/>);
  const root=screen.getByRole('img',{name:'Demo account'});
  expect(root.dataset.variant).toBe('beam');expect(root.textContent).toBe('');expect(root.getAttribute('style')).toBeNull();
  const svg=root.querySelector('svg')!;expect(svg.getAttribute('aria-hidden')).toBe('true');expect(svg.getAttribute('focusable')).toBe('false');
  // The decision is made on the provider's resolved sRGB roles; the paint is the CSS variable, which is Display P3 where supported.
  const face=beamAvatar('Demo account',['#00ff3f','#35b5ff','#ff479c','#fffb38']),paints=avatarColorRoles.map(role=>`var(--hig-${role})`);
  expect(avatarColorRoles).toEqual(['action','info','negative','warning']);
  expect(drawn()).toMatchObject({viewBox:'0 0 36 36',backgroundColor:paints[face.backgroundIndex],wrapperColor:paints[face.wrapperIndex],wrapperTransform:face.wrapperTransform,wrapperRadius:face.wrapperRadius,faceTransform:face.faceTransform,mouthPath:face.mouthPath,mouthStroked:face.mouthStroked,mouthInk:'var(--hig-background)',leftEyeX:face.leftEyeX,rightEyeX:face.rightEyeX});
  expect(drawn().eyes).toEqual(['14 1.5 2 1 var(--hig-background)','14 1.5 2 1 var(--hig-background)']);
 });
 it('is opted into by passing a seed, which the name does not change',()=>{
  const view=render(<Avatar name='Joe' seed={address}/>);
  const first=drawn();expect(avatar().dataset.variant).toBe('beam');expect(screen.getByRole('img',{name:'Joe'})).toBeTruthy();
  view.rerender(<Avatar name='Someone else' seed={address}/>);expect(drawn()).toEqual(first);
  view.rerender(<Avatar name='Joe' seed={address.replace('1','2')}/>);expect(drawn()).not.toEqual(first);
  // `variant` wins over the seed.
  view.rerender(<Avatar name='Joe' seed={address} variant='initials'/>);expect(avatar().textContent).toBe('Jo');expect(avatar().dataset.variant).toBeUndefined();
 });
 it('draws the recorded boring-avatars faces from the host palette',()=>{
  const recorded=JSON.parse(readFileSync('tests/test-utils/boring-avatars-beam.json','utf8')) as {palettes:Record<string,string[]>;faces:Array<Record<string,unknown>&{seed:string;palette:string;faceColor:string}>};
  for(const {seed,palette,faceColor,...theirs} of recorded.faces){
   const view=render(<Avatar name='Face' seed={seed} colors={recorded.palettes[palette]} faceColor={faceColor}/>);
   const ours=drawn(view.container);
   expect({...ours,backgroundColor:hex(ours.backgroundColor),wrapperColor:hex(ours.wrapperColor)},`${JSON.stringify(seed)} in ${palette}`).toMatchObject(theirs);expect(hex(ours.mouthInk)).toBe(faceColor);
   if(ours.mouthStroked)expect(ours.mouthCap).toBe('round');
   view.unmount();
  }
 });
 it('takes host colours as written, Display P3 included, and chooses each ink from them',()=>{
  const p3=['color(display-p3 0 1 0.24)','color(display-p3 0.18 0.72 1)','color(display-p3 1 0.24 0.62)','color(display-p3 1 0.98 0.18)','color(display-p3 0.7 0 1)'];
  const markup=renderToStaticMarkup(<Avatar name='Joe' seed={address} colors={p3}/>),face=beamAvatar(address,p3);
  expect(markup).toContain(`fill:${face.wrapperColor}`);expect(markup).toContain(`fill:${face.backgroundColor}`);expect(markup).not.toContain('var(--hig-action)');
  // Deep colours take the text role, bright ones the background role.
  expect(renderToStaticMarkup(<Avatar name='Joe' seed='a' colors={['#101010']}/>)).toContain('var(--hig-text)');
  expect(renderToStaticMarkup(<Avatar name='Joe' seed='a' colors={['#f0f0f0']}/>)).toContain('var(--hig-background)');
  // One host ink for every face.
  const inked=renderToStaticMarkup(<Avatar name='Joe' seed='a' colors={['#101010']} faceColor='#0A0A0A'/>);expect(inked).toContain('#0A0A0A');expect(inked).not.toContain('var(--hig-text)');
  // An empty palette is the default palette.
  expect(renderToStaticMarkup(<Avatar name='Joe' seed={address} colors={[]}/>)).toBe(renderToStaticMarkup(<Avatar name='Joe' seed={address}/>));
 });
 it('chooses the ink on the provider primary colour when the face lands on the action role',()=>{
  const seed=['a','b','c','d','e','f','g','h'].find(candidate=>beamAvatar(candidate,['','','','']).wrapperIndex===0)!;
  render(<HIGProvider primaryColor='#101080'><Avatar name='Joe' seed={seed}/></HIGProvider>);
  expect(drawn()).toMatchObject({wrapperColor:'var(--hig-action)',mouthInk:'var(--hig-text)'});
 });
 it('renders the same markup on the server, in right-to-left and under reduced motion',()=>{
  const plain=renderToStaticMarkup(<Avatar name='Joe' seed={address}/>);
  expect(plain).toContain('<svg viewBox="0 0 36 36" aria-hidden="true" focusable="false">');
  const inside=(element:React.ReactElement)=>renderToStaticMarkup(element).replace(/^<div[^>]*>|<\/div>$/g,'');
  expect(inside(<HIGProvider direction='rtl' locale='ar'><Avatar name='Joe' seed={address}/></HIGProvider>)).toBe(plain);
  expect(inside(<HIGProvider reducedMotion><Avatar name='Joe' seed={address}/></HIGProvider>)).toBe(plain);
 });
 it('does not render the face again when its parent re-renders with the same seed and colours',()=>{
  const view=render(<Avatar name='Joe' seed={address} colors={[...vivid]}/>);
  const svg=avatar().querySelector('svg')!,wrapper=svg.querySelectorAll('rect')[1]!,before=computed();
  expect(before).toBeGreaterThan(0);
  let writes=0;const observer=new MutationObserver(records=>{writes+=records.length;});observer.observe(svg,{attributes:true,childList:true,subtree:true,characterData:true});
  // A new array with the same colours, a new name and a new size are not a new face.
  view.rerender(<Avatar name='Joe' seed={address} colors={[...vivid]}/>);view.rerender(<Avatar name='Joseph' seed={address} colors={[...vivid]} size={64}/>);
  expect(computed()).toBe(before);expect(avatar().querySelector('svg')).toBe(svg);expect(svg.querySelectorAll('rect')[1]).toBe(wrapper);
  expect(observer.takeRecords().length+writes).toBe(0);expect(avatar().style.width).toBe('64px');expect(avatar().getAttribute('aria-label')).toBe('Joseph');
  view.rerender(<Avatar name='Joseph' seed={address} colors={[...vivid].reverse()} size={64}/>);
  expect(computed()).toBe(before+1);observer.disconnect();
 });
});

describe('Avatar does no work when nothing changed',()=>{
 it('keeps the drawing when its provider renders again, with a host palette written inline',()=>{
  // HIGProvider hands every consumer a new context value on each of its renders; the face must not be computed or diffed again for that.
  const tree=(tick:number)=><HIGProvider><span data-tick={tick}/><Avatar name='Joe' seed={address} colors={[...vivid]}/><Avatar name='Ann' variant='beam'/></HIGProvider>;
  const view=render(tree(1)),svgs=[...document.querySelectorAll('svg')],before=computed();
  expect(svgs).toHaveLength(2);expect(before).toBeGreaterThan(0);
  let writes=0;const observer=new MutationObserver(records=>{writes+=records.length;});for(const svg of svgs)observer.observe(svg,{attributes:true,childList:true,subtree:true,characterData:true});
  for(let tick=2;tick<12;tick++)view.rerender(tree(tick));
  expect(computed()).toBe(before);expect([...document.querySelectorAll('svg')]).toEqual(svgs);expect(observer.takeRecords().length+writes).toBe(0);
  // A provider colour that changes the ink is still seen.
  view.rerender(<HIGProvider primaryColor='#101080'><span/><Avatar name='Joe' seed={address} colors={[...vivid]}/><Avatar name='Ann' variant='beam'/></HIGProvider>);
  expect(computed()).toBe(before+2);observer.disconnect();
 });
 it('draws a new face for a new seed, palette or ink, and only then',()=>{
  const view=render(<Avatar name='Joe' seed='a' colors={['#101010','#f0f0f0']}/>);const first=drawn(),before=computed();
  view.rerender(<Avatar name='Joe' seed='a' colors={['#101010','#f0f0f0']} square decorative size={12}/>);expect(computed()).toBe(before);
  view.rerender(<Avatar name='Joe' seed='b' colors={['#101010','#f0f0f0']}/>);expect(computed()).toBe(before+1);expect(drawn()).not.toEqual(first);
  view.rerender(<Avatar name='Joe' seed='b' colors={['#f0f0f0','#101010']}/>);expect(computed()).toBe(before+2);
  view.rerender(<Avatar name='Joe' seed='b' colors={['#f0f0f0','#101010']} faceColor='#ff0000'/>);expect(computed()).toBe(before+3);expect(hex(drawn().mouthInk).toUpperCase()).toBe('#FF0000');
  // Colours that only differ in where one ends and the next begins are different palettes.
  view.rerender(<Avatar name='Joe' seed='b' colors={['#f0f0f0']}/>);expect(computed()).toBe(before+4);
 });
});

describe('Avatar in a list whose parent renders again',()=>{
 /** Rows written inline, the way a leaderboard is: every render of the parent makes new elements and a new palette array, and nothing else is new. */
 function Board({seeds}:{seeds:readonly string[]}){
  return <ul>{seeds.map((seed,index)=><li key={index}>{[
   <Avatar name={`Trader ${index}`} seed={seed} decorative/>,
   <Avatar name={`Trader ${index}`} seed={seed} size={32} colors={[...vivid]} faceColor='#0A0A0A' square/>,
   <Avatar name={`Trader ${index}`} src='/joe.png'/>,
   <Avatar name={`Trader ${index}`}/>,
  ][index%4]}</li>)}</ul>;
 }
 it('renders no Avatar, computes no face and writes nothing to the page while every prop is the same',()=>{
  const seeds=Array.from({length:20},(_,index)=>`0x${String(index).padStart(40,'0')}`);let commits=0;
  const board=(list:readonly string[])=><Profiler id='board' onRender={()=>{commits++;}}><Board seeds={list}/></Profiler>;
  const start={renders:rendered(),faces:computed()},view=render(board(seeds));
  // The counters count what they say: one render for each Avatar, one face for each generated one.
  expect(commits).toBe(1);expect(rendered()-start.renders).toBe(20);expect(computed()-start.faces).toBe(10);
  const mounted={renders:rendered(),faces:computed()},records:MutationRecord[]=[];
  const observer=new MutationObserver(found=>{records.push(...found);});observer.observe(view.container,{attributes:true,childList:true,subtree:true,characterData:true});
  for(let tick=0;tick<10;tick++)view.rerender(board([...seeds]));
  // The Profiler saw the parent render ten times; no Avatar under it did.
  expect(commits).toBe(11);expect(rendered()-mounted.renders).toBe(0);expect(computed()-mounted.faces).toBe(0);expect(records.concat(observer.takeRecords())).toEqual([]);
  // One row gets a new seed: that Avatar renders and draws one face, and the page is written inside that row only.
  view.rerender(board(seeds.map((seed,index)=>index===4?address:seed)));
  expect(commits).toBe(12);expect(rendered()-mounted.renders).toBe(1);expect(computed()-mounted.faces).toBe(1);
  const written=new Set(records.concat(observer.takeRecords()).map(record=>(record.target as Element).closest('li')));
  expect([...written]).toEqual([view.container.querySelectorAll('li')[4]]);observer.disconnect();
 });
 it('renders again for each prop that changes, and for a palette only when its colours change',()=>{
  const base={name:'Joe',seed:address,size:40,colors:vivid,faceColor:'#0A0A0A',square:false,decorative:false} as const;
  const view=render(<Avatar {...base}/>);
  // Other values for every prop of AvatarProps. The type makes a new prop a compile error here until it has a row, and the row fails until the comparison in avatar.tsx reads that prop.
  const others:{[Prop in keyof Required<AvatarProps>]:AvatarProps[Prop][]}={name:['Ann'],src:['/joe.png'],seed:['other'],variant:['initials'],size:[41],colors:[[...vivid].reverse(),vivid.slice(1),undefined,[]],faceColor:['#ffffff',undefined],square:[true],decorative:[true]};
  for(const [prop,values] of Object.entries(others))for(const value of values){
   view.rerender(<Avatar {...base}/>);const before=rendered();
   // The same props again, with the palette in a new array: nothing renders.
   view.rerender(<Avatar {...base} colors={[...vivid]}/>);expect(rendered()-before,'same props').toBe(0);
   view.rerender(<Avatar {...base} {...{[prop]:value}}/>);expect(rendered()-before,`${prop}: ${JSON.stringify(value)}`).toBe(1);
  }
  // A prop that is passed as undefined and one that is left out are the same props.
  view.rerender(<Avatar name='Joe' seed={address}/>);const before=rendered();
  view.rerender(<Avatar name='Joe' seed={address} src={undefined} colors={undefined} variant={undefined}/>);expect(rendered()-before).toBe(0);
 });
 it('still shows the fallback of an image that fails, and tries a new address',()=>{
  // The failure is state inside the Avatar: it must render for it although its props are the same.
  const view=render(<Avatar name='Joe' seed={address} src='/joe.png'/>);
  fireEvent.error(avatar());expect(avatar().tagName).toBe('SPAN');expect(avatar().dataset.variant).toBe('beam');
  view.rerender(<Avatar name='Joe' seed={address} src='/joe.png'/>);expect(avatar().tagName).toBe('SPAN');
  view.rerender(<Avatar name='Joe' seed={address} src='/joe-2.png'/>);expect(avatar().tagName).toBe('IMG');
 });
});

describe('Avatar size, shape, image and accessibility',()=>{
 it('size sets the box of every content, and scales the initials',()=>{
  const view=render(<Avatar name='Joe' size={20}/>);
  expect(avatar().style.width).toBe('20px');expect(avatar().style.height).toBe('20px');expect(avatar().style.fontSize).toBe('8px');expect(avatar().style.lineHeight).toBe('1');
  view.rerender(<Avatar name='Joe' seed={address} size={144}/>);expect(avatar().style.width).toBe('144px');expect(avatar().style.height).toBe('144px');expect(avatar().style.fontSize).toBe('');
  view.rerender(<Avatar name='Joe' src='/joe.png' size={64}/>);expect(avatar().tagName).toBe('IMG');expect(avatar().style.width).toBe('64px');expect(avatar().style.height).toBe('64px');
 });
 it('ignores a size that cannot be drawn and keeps the default box',()=>{
  const errors=vi.spyOn(console,'error').mockImplementation(()=>{});
  for(const size of [NaN,Infinity,-Infinity,-5,'20' as unknown as number,null as unknown as number]){
   for(const props of [{},{seed:address},{src:'/joe.png'}]){const view=render(<Avatar name='Joe' size={size} {...props}/>);expect(avatar().getAttribute('style'),`${String(size)} ${JSON.stringify(props)}`).toBeNull();view.unmount();}
   expect(renderToStaticMarkup(<Avatar name='Joe' size={size}/>)).toBe(renderToStaticMarkup(<Avatar name='Joe'/>));
  }
  // React reports an invalid style value through console.error; none was written.
  expect(errors).not.toHaveBeenCalled();errors.mockRestore();
  // Zero and very large sizes are sizes.
  const view=render(<Avatar name='Joe' seed={address} size={0}/>);expect(avatar().style.width).toBe('0px');expect(avatar().querySelector('svg')).not.toBeNull();
  view.rerender(<Avatar name='Joe' seed={address} size={100000}/>);expect(avatar().style.width).toBe('100000px');expect(drawn().viewBox).toBe('0 0 36 36');
 });
 it('draws whole characters as initials',()=>{
  const view=render(<Avatar name='A😀 x'/>);expect(avatar().textContent).toBe('A😀');
  view.rerender(<Avatar name='日本語のなまえ'/>);expect(avatar().textContent).toBe('日本');
  view.rerender(<Avatar name=''/>);expect(avatar().textContent).toBe('');
 });
 it('treats a missing seed from untyped code as no seed',()=>{
  render(<Avatar name='Joe' seed={null as unknown as string}/>);expect(avatar().textContent).toBe('Jo');expect(avatar().dataset.variant).toBeUndefined();
 });
 it('draws a face for an empty seed and for a very long one',()=>{
  const view=render(<Avatar name='Joe' seed=''/>);expect(avatar().dataset.variant).toBe('beam');expect(drawn().wrapperTransform).toBe('translate(4 4) rotate(0 18 18) scale(1)');
  view.rerender(<Avatar name='Joe' seed={'x'.repeat(200000)}/>);expect(drawn().wrapperTransform).toMatch(/^translate\(-?[\d.]+ -?[\d.]+\) rotate\(-?\d+ 18 18\) scale\([\d.]+\)$/);
 });
 it('crops a photo that is not square instead of stretching it',()=>{
  expect(readFileSync('packages/hig/react/src/styles.css','utf8')).toContain('img.hig-avatar { object-fit:cover; }');
 });
 it('square removes the rounding of every content',()=>{
  const css=readFileSync('packages/hig/react/src/styles.css','utf8');
  expect(css).toContain('.hig-avatar[data-square] { border-radius:0; }');expect(css).toContain(".hig-avatar[data-variant='beam'] { overflow:hidden;background:none; }");expect(css).toContain('.hig-avatar > svg { display:block;width:100%;height:100%; }');
  const view=render(<Avatar name='Joe' square/>);expect(avatar().dataset.square).toBe('true');
  view.rerender(<Avatar name='Joe' seed={address} square/>);expect(avatar().dataset.square).toBe('true');
  view.rerender(<Avatar name='Joe' src='/joe.png' square/>);expect(avatar().dataset.square).toBe('true');
  view.rerender(<Avatar name='Joe' seed={address} square={false}/>);expect(avatar().dataset.square).toBeUndefined();
 });
 it('shows the image when given one, and the fallback when it fails to load',()=>{
  const view=render(<Avatar name='Joe' seed={address} src='/joe.png'/>);
  expect(avatar().tagName).toBe('IMG');expect(screen.getByRole('img',{name:'Joe'}).getAttribute('src')).toBe('/joe.png');expect(document.querySelector('svg')).toBeNull();
  fireEvent.error(avatar());
  expect(avatar().tagName).toBe('SPAN');expect(avatar().dataset.variant).toBe('beam');expect(screen.getByRole('img',{name:'Joe'})).toBe(avatar());
  // A new address is tried again; the failed one is not.
  view.rerender(<Avatar name='Joe' seed={address} src='/joe.png'/>);expect(avatar().tagName).toBe('SPAN');
  view.rerender(<Avatar name='Joe' seed={address} src='/joe-2.png'/>);expect(avatar().tagName).toBe('IMG');
  view.rerender(<Avatar name='Joe' src='/gone.png'/>);fireEvent.error(avatar());expect(avatar().textContent).toBe('Jo');
 });
 it('replaces an image that failed before the page hydrated',async()=>{
  // The server sent the image; the browser tried it and fired `error` before React was listening.
  const element=<Avatar name='Joe' seed={address} src='/gone.png'/>;
  const container=document.createElement('div');container.innerHTML=renderToStaticMarkup(element);document.body.append(container);
  const broken=container.querySelector('img')!;
  Object.defineProperties(broken,{complete:{value:true},naturalWidth:{value:0},decode:{value:()=>Promise.reject(new DOMException('The source image cannot be decoded.','EncodingError'))}});
  let root:ReturnType<typeof hydrateRoot>;
  await act(async()=>{root=hydrateRoot(container,element);});
  expect(container.querySelector('img')).toBeNull();expect(container.querySelector<HTMLElement>('.hig-avatar')!.dataset.variant).toBe('beam');expect(container.querySelector('[role=img]')!.getAttribute('aria-label')).toBe('Joe');
  act(()=>root.unmount());container.remove();
 });
 it('keeps an image that is complete and sound, with or without a size of its own, and one that is still loading',async()=>{
  const cases:Array<Record<string,PropertyDescriptor>>=[
   // Loaded, with a width.
   {complete:{value:true},naturalWidth:{value:64},decode:{value:()=>Promise.reject(new Error('never asked'))}},
   // Loaded, no intrinsic size (an SVG without one): `decode()` resolves.
   {complete:{value:true},naturalWidth:{value:0},decode:{value:()=>Promise.resolve()}},
   // Still loading.
   {complete:{value:false},naturalWidth:{value:0},decode:{value:()=>Promise.reject(new Error('never asked'))}},
   // A browser without `decode()`.
   {complete:{value:true},naturalWidth:{value:0}},
  ];
  for(const stub of cases){
   const element=<Avatar name='Joe' seed={address} src='/joe.png'/>;
   const container=document.createElement('div');container.innerHTML=renderToStaticMarkup(element);document.body.append(container);
   Object.defineProperties(container.querySelector('img')!,stub);
   let root:ReturnType<typeof hydrateRoot>;
   await act(async()=>{root=hydrateRoot(container,element);});
   expect(container.querySelector('img'),JSON.stringify(Object.keys(stub))).not.toBeNull();
   act(()=>root.unmount());container.remove();
  }
 });
 it('does not act on a failed check after the image is gone or has changed',async()=>{
  let reject!:(reason:unknown)=>void;const pending=new Promise<void>((_,no)=>{reject=no;});
  const container=document.createElement('div');container.innerHTML=renderToStaticMarkup(<Avatar name='Joe' src='/a.png'/>);document.body.append(container);
  // The element is reused for the next address, whose own check finds a sound image.
  const answers=[pending,Promise.resolve()];
  Object.defineProperties(container.querySelector('img')!,{complete:{value:true},naturalWidth:{value:0},decode:{value:()=>answers.shift()??Promise.resolve()}});
  let root:ReturnType<typeof hydrateRoot>;
  await act(async()=>{root=hydrateRoot(container,<Avatar name='Joe' src='/a.png'/>);});
  // The host swaps the address before the check answers: the old answer must not hide the new image.
  await act(async()=>{root.render(<Avatar name='Joe' src='/b.png'/>);});
  await act(async()=>{reject(new Error('broken'));await pending.catch(()=>{});});
  expect(answers).toHaveLength(0);expect(container.querySelector('img')?.getAttribute('src')).toBe('/b.png');
  const errors=vi.spyOn(console,'error').mockImplementation(()=>{});
  act(()=>root.unmount());expect(errors).not.toHaveBeenCalled();errors.mockRestore();container.remove();
 });
 it('decorative hides every content from assistive technology',()=>{
  const view=render(<Avatar name='Joe' seed={address} decorative/>);
  expect(screen.queryByRole('img')).toBeNull();expect(avatar().getAttribute('aria-hidden')).toBe('true');expect(avatar().hasAttribute('aria-label')).toBe(false);expect(avatar().hasAttribute('role')).toBe(false);
  view.rerender(<Avatar name='Joe' decorative/>);expect(screen.queryByRole('img')).toBeNull();expect(avatar().getAttribute('aria-hidden')).toBe('true');expect(avatar().textContent).toBe('Jo');
  view.rerender(<Avatar name='Joe' src='/joe.png' decorative/>);expect(avatar().getAttribute('alt')).toBe('');expect(screen.queryByRole('img')).toBeNull();
 });
});
/** jsdom reports an inline hex fill as `rgb(r, g, b)`; put it back so it compares with the recording. */
function hex(color:string){const parts=/^rgb\((\d+), (\d+), (\d+)\)$/.exec(color);return parts?`#${parts.slice(1).map(part=>Number(part).toString(16).padStart(2,'0')).join('').toUpperCase()}`:color;}
