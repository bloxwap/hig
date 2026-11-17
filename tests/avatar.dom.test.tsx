// @vitest-environment jsdom
import React from 'react';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {readFileSync} from 'node:fs';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {renderToStaticMarkup} from 'react-dom/server';
import {HIGProvider} from '../packages/hig/react/src/provider';
import {Avatar,avatarColorRoles} from '../packages/hig/react/src/avatar';
import * as status from '../packages/hig/react/src/status';
import {beamAvatar} from '../packages/hig/contracts/src/avatar';
import * as model from '@bloxwap/hig/contracts/avatar';
// The renderer's own import of the model, wrapped so a test can count how often a face is computed.
vi.mock('@bloxwap/hig/contracts/avatar',async importOriginal=>{const actual=await importOriginal<typeof import('@bloxwap/hig/contracts/avatar')>();return {...actual,beamAvatar:vi.fn(actual.beamAvatar)};});
const computed=()=>vi.mocked(model.beamAvatar).mock.calls.length;
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

describe('Avatar size, shape, image and accessibility',()=>{
 it('size sets the box of every content, and scales the initials',()=>{
  const view=render(<Avatar name='Joe' size={20}/>);
  expect(avatar().style.width).toBe('20px');expect(avatar().style.height).toBe('20px');expect(avatar().style.fontSize).toBe('8px');expect(avatar().style.lineHeight).toBe('1');
  view.rerender(<Avatar name='Joe' seed={address} size={144}/>);expect(avatar().style.width).toBe('144px');expect(avatar().style.height).toBe('144px');expect(avatar().style.fontSize).toBe('');
  view.rerender(<Avatar name='Joe' src='/joe.png' size={64}/>);expect(avatar().tagName).toBe('IMG');expect(avatar().style.width).toBe('64px');expect(avatar().style.height).toBe('64px');
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
 it('decorative hides every content from assistive technology',()=>{
  const view=render(<Avatar name='Joe' seed={address} decorative/>);
  expect(screen.queryByRole('img')).toBeNull();expect(avatar().getAttribute('aria-hidden')).toBe('true');expect(avatar().hasAttribute('aria-label')).toBe(false);expect(avatar().hasAttribute('role')).toBe(false);
  view.rerender(<Avatar name='Joe' decorative/>);expect(screen.queryByRole('img')).toBeNull();expect(avatar().getAttribute('aria-hidden')).toBe('true');expect(avatar().textContent).toBe('Jo');
  view.rerender(<Avatar name='Joe' src='/joe.png' decorative/>);expect(avatar().getAttribute('alt')).toBe('');expect(screen.queryByRole('img')).toBeNull();
 });
});
/** jsdom reports an inline hex fill as `rgb(r, g, b)`; put it back so it compares with the recording. */
function hex(color:string){const parts=/^rgb\((\d+), (\d+), (\d+)\)$/.exec(color);return parts?`#${parts.slice(1).map(part=>Number(part).toString(16).padStart(2,'0')).join('').toUpperCase()}`:color;}
