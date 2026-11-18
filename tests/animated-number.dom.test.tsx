import React from 'react';
import {afterEach,expect,it,vi} from 'vitest';
import {act,cleanup,render,screen} from '@testing-library/react';
import {renderToString} from 'react-dom/server';
import {AnimatedNumberReadout} from '../packages/hig/react/src/animated-number';
import {HIGProvider} from '../packages/hig/react/src/provider';
const originalAnimate=HTMLElement.prototype.animate;
afterEach(()=>{cleanup();if(originalAnimate)Object.defineProperty(HTMLElement.prototype,'animate',{value:originalAnimate,configurable:true});else delete (HTMLElement.prototype as {animate?:unknown}).animate;});
function mockAnimate(){const animations:{cancel:ReturnType<typeof vi.fn>;onfinish?:()=>void}[]=[];const animate=vi.fn(function(this:HTMLElement,...args:[Keyframe[],KeyframeAnimationOptions]){void args;const animation={cancel:vi.fn()};animations.push(animation);return animation as unknown as Animation;});Object.defineProperty(HTMLElement.prototype,'animate',{value:animate,configurable:true});return {animate,animations};}
it('animates per place without an initial animation, bypass delay or live region, and latest value wins',()=>{
 const {animate,animations}=mockAnimate();const {rerender,unmount}=render(<AnimatedNumberReadout value={1} label='Price'/>);expect(animate).not.toHaveBeenCalled();expect(screen.getByLabelText('Price: 1')).toBeTruthy();
 rerender(<AnimatedNumberReadout value={2} label='Price'/>);expect(animate.mock.calls[0][1]).toMatchObject({easing:'cubic-bezier(0.22,1,0.36,1)',duration:180,fill:'forwards'});expect(animate).toHaveBeenCalledTimes(2);expect(screen.getByLabelText('Price: 2')).toBeTruthy();expect(animate.mock.instances.every(instance=>instance.classList.contains('hig-animated-number-old')||instance.classList.contains('hig-animated-number-new'))).toBe(true);
 rerender(<AnimatedNumberReadout value={3} label='Price' duration={900}/>);expect(animate.mock.calls[2][1].duration).toBe(500);expect(animate).toHaveBeenCalledTimes(4);expect(animations[0].cancel).toHaveBeenCalledOnce();expect(animations[1].cancel).toHaveBeenCalledOnce();expect(screen.getByLabelText('Price: 3')).toBeTruthy();expect(document.querySelectorAll('.hig-sr-only')).toHaveLength(1);expect(document.querySelector('.hig-animated-number-visual')?.getAttribute('aria-hidden')).toBe('true');expect(document.querySelector('[aria-live]')).toBeNull();
 unmount();expect(animations[2].cancel).toHaveBeenCalledOnce();expect(animations[3].cancel).toHaveBeenCalledOnce();
});
it('animates only the available layer when a digit enters or leaves',()=>{
 const {animate}=mockAnimate();
 const {rerender}=render(<AnimatedNumberReadout value={9}/>);
 rerender(<AnimatedNumberReadout value={19}/>);
 expect(animate.mock.instances.map(node=>[node.className,node.textContent])).toEqual([['hig-animated-number-new','1']]);
 animate.mockClear();
 rerender(<AnimatedNumberReadout value={9}/>);
 expect(animate.mock.instances.map(node=>[node.className,node.textContent])).toEqual([['hig-animated-number-old','1']]);
});
it('finishes an interrupted sequence at exact canonical visual text with no superseded layers',()=>{
 const {animations}=mockAnimate();const options={minimumFractionDigits:2,maximumFractionDigits:2};const view=(value:number)=><HIGProvider locale='de-DE'><AnimatedNumberReadout value={value} label='Price' options={options} prefix='$' suffix=' USD'/></HIGProvider>;const {rerender}=render(view(999.99));
 rerender(view(1000.01));rerender(view(1111.11));rerender(view(88.88));expect(document.querySelector('.hig-animated-number-old')).not.toBeNull();act(()=>{for(const animation of animations)animation.onfinish?.();});
 expect(document.querySelector('.hig-animated-number-visual')?.textContent).toBe('$88,88 USD');expect(document.querySelector('.hig-animated-number-old')).toBeNull();expect(document.querySelector('.hig-animated-number-place')).toBeNull();expect(screen.getByLabelText('Price: $88,88 USD')).toBeTruthy();
});
it('uses signed or callback trend directions and each digit’s direction for zero trend',()=>{
 const {animate}=mockAnimate(),trend=vi.fn(()=>-1 as const);const {rerender}=render(<AnimatedNumberReadout value={1} trend={trend}/>);rerender(<AnimatedNumberReadout value={2} trend={trend}/>);expect(trend).toHaveBeenCalledWith(1,2);expect(animate.mock.calls[0][0]).toEqual([{opacity:1,transform:'translateY(0%)'},{opacity:0,transform:'translateY(100%)'}]);expect(animate.mock.calls[1][0]).toEqual([{opacity:0,transform:'translateY(-100%)'},{opacity:1,transform:'translateY(0%)'}]);
 rerender(<AnimatedNumberReadout value={1} trend={0}/>);expect(animate.mock.calls.at(-1)?.[0]).toEqual([{opacity:0,transform:'translateY(-100%)'},{opacity:1,transform:'translateY(0%)'}]);
 rerender(<AnimatedNumberReadout value={2} trend={0}/>);expect(animate.mock.calls.at(-1)?.[0]).toEqual([{opacity:0,transform:'translateY(100%)'},{opacity:1,transform:'translateY(0%)'}]);
});
it('snaps locale, options and direction changes and cancels for reduced motion',()=>{
 const {animate}=mockAnimate();const view=(value:number,locale='en-US',direction:'ltr'|'rtl'='ltr',reducedMotion=false,options?:Intl.NumberFormatOptions)=><HIGProvider locale={locale} direction={direction} reducedMotion={reducedMotion}><AnimatedNumberReadout value={value} label='Price' options={options}/></HIGProvider>;const {rerender}=render(view(1));
 rerender(view(2,'de-DE'));expect(animate).not.toHaveBeenCalled();rerender(view(3,'de-DE'));expect(animate).toHaveBeenCalledTimes(2);rerender(view(4,'de-DE','rtl'));expect(animate).toHaveBeenCalledTimes(2);rerender(view(5,'de-DE','rtl',false,{minimumFractionDigits:2}));expect(animate).toHaveBeenCalledTimes(2);rerender(view(6,'de-DE','rtl',true,{minimumFractionDigits:2}));rerender(view(7,'de-DE','rtl',true,{minimumFractionDigits:2}));expect(animate).toHaveBeenCalledTimes(2);expect(screen.getByLabelText('Price: 7,00')).toBeTruthy();expect(document.querySelector('.hig-animated-number-visual')?.textContent).toBe('7,00');expect(document.querySelector('.hig-animated-number-old')).toBeNull();
});
it('shares affixes and stale state with one semantic reading and suppresses affixes for unknown',()=>{
 mockAnimate();const {rerender}=render(<AnimatedNumberReadout value={12} prefix='$' suffix=' USD' label='Total' stale/>);expect(screen.getByLabelText('Total: $12 USD (stale)')).toBeTruthy();expect(document.querySelector('.hig-animated-number-visual')?.textContent).toBe('$12 USD (stale)');
 rerender(<AnimatedNumberReadout value={null} prefix='$' suffix=' USD' label='Total' stale/>);expect(screen.getByLabelText('Total: — (stale)')).toBeTruthy();expect(document.querySelector('.hig-animated-number-visual')?.textContent).toBe('— (stale)');
});
it('has deterministic SSR markup with a hidden semantic reading and static final visual',()=>{
 const html=renderToString(<AnimatedNumberReadout value={1234.5}/>);expect(html).toContain('hig-sr-only');expect(html).toContain('aria-hidden="true"');expect(html).toContain('1,234.5');expect(html).not.toContain('hig-animated-number-old');
});

it('builds digit places only when a slide actually moves',()=>{
 const parts=vi.spyOn(Intl.NumberFormat.prototype,'formatToParts');
 try{
  mockAnimate();
  const view=(value:number,animated=true)=><AnimatedNumberReadout value={value} animated={animated}/>;
  const {rerender}=render(view(123456.75));
  const visual=document.querySelector('.hig-animated-number-visual')!;
  expect(visual.textContent).toBe('123,456.75');expect(visual.childElementCount).toBe(0);expect(parts).not.toHaveBeenCalled();
  rerender(view(123456.76,false));
  expect(visual.childElementCount).toBe(0);expect(parts).not.toHaveBeenCalled();
  rerender(view(123456.77));
  expect(visual.childElementCount).toBe(1);
  expect(visual.firstChild?.nodeType).toBe(Node.TEXT_NODE);
  expect(visual.firstChild?.textContent).toBe('123,456.7');
  expect(visual.querySelector('.hig-animated-number-old')?.textContent).toBe('6');
  expect(visual.querySelector('.hig-animated-number-new')?.textContent).toBe('7');
 }finally{parts.mockRestore();}
});

it('keeps a slide running through raw ticks that leave host-formatted digits unchanged',()=>{
 const {animate,animations}=mockAnimate(),trend=vi.fn(()=>1 as const);
 const figure=(value:number,formattedValue:string)=><AnimatedNumberReadout value={value} formattedValue={formattedValue} animateFormatted trend={trend}/>;
 const {rerender}=render(figure(1,'1.0'));
 rerender(figure(1.1,'1.1'));expect(animate).toHaveBeenCalledTimes(2);
 rerender(figure(1.11,'1.1'));expect(animations[0].cancel).not.toHaveBeenCalled();expect(animate).toHaveBeenCalledTimes(2);
 rerender(figure(1.2,'1.2'));expect(trend).toHaveBeenLastCalledWith(1.11,1.2);expect(animations[0].cancel).toHaveBeenCalledOnce();
});
