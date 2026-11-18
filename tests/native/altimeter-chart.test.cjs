const React=require('react');
const {create,act}=require('react-test-renderer');
const {AppState,Platform}=require('react-native');
const {Rect,Stop,Circle,Path,Text:SvgText}=require('react-native-svg');
const {nativeSrgb}=require('@bloxwap/hig/tokens');
const {AltimeterChart}=require('../../packages/hig/native/src/chart');
const {HIGProvider}=require('../../packages/hig/native/src/provider');
const h=React.createElement;
let root,callback,appChange;
function tree(props,motion=false){return h(HIGProvider,{reducedMotion:motion},h(AltimeterChart,{summary:'Market',...props}));}
function chartView(){return root.root.findAll(n=>n.props.accessibilityRole==='image'&&n.props.onLayout)[0];}
function mount(props,motion=false){
 act(()=>{root=create(tree(props,motion));});
 act(()=>appChange('active'));
 act(()=>chartView().props.onLayout({nativeEvent:{layout:{width:390}}}));
}
function frame(now){act(()=>callback(now));}
beforeEach(()=>{
 jest.spyOn(global,'requestAnimationFrame').mockImplementation(fn=>{callback=fn;return 1;});
 jest.spyOn(global,'cancelAnimationFrame').mockImplementation(()=>{});
 jest.spyOn(AppState,'addEventListener').mockImplementation((event,fn)=>{if(event==='change')appChange=fn;return {remove:jest.fn()};});
});
afterEach(()=>{if(root)act(()=>root.unmount());root=null;jest.restoreAllMocks();});

it('reads percentage profit and independently paints the short trail and net-loss capsule',()=>{
 mount({price:99,position:{side:'short',breakEvenPrice:100,pnl:-2,capsule:{returnRatio:-.02}},targets:[{id:'entry',price:100,label:'Entry'}]},true);
 frame(1000);
 expect(chartView().props.accessibilityLabel).toMatch(/-2.00%.*Entry.*100/);
 expect(root.root.findAllByType(Stop).some(s=>s.props.stopColor===nativeSrgb.positive)).toBe(true);
 expect(root.root.findByType(Rect).props.stroke).toBe(nativeSrgb.negative);
});
it('bursts only on crossing and drops the effect when reduced motion is enabled',()=>{
 const props={price:100,targets:[{id:'entry',price:100.01}],degen:true};
 mount(props);frame(1000);
 expect(root.root.findAllByType(Circle)).toHaveLength(0);
 act(()=>root.update(tree({...props,price:100.02})));frame(1200);frame(1500);
 expect(root.root.findAllByType(Circle)).toHaveLength(48);
 act(()=>root.update(tree({...props,price:100.02},true)));
 expect(root.root.findAllByType(Circle)).toHaveLength(0);
});
it('shows stale data and disconnects and reconnects the feed with the app lifecycle',()=>{
 const stop=jest.fn();let push,expire;
 const feed=jest.fn((next,stale)=>{push=next;expire=stale;return stop;});
 mount({feed});act(()=>push(123));frame(1000);
 expect(chartView().props.accessibilityLabel).toMatch(/123/);
 act(()=>expire());frame(1300);expect(chartView().props.accessibilityLabel).not.toMatch(/123/);
 act(()=>appChange('background'));expect(stop).toHaveBeenCalledTimes(1);
 act(()=>appChange('active'));expect(feed).toHaveBeenCalledTimes(2);
 act(()=>root.unmount());root=null;expect(stop).toHaveBeenCalledTimes(2);
});

it('parks while empty, wakes on a price and parks again when the price clears',()=>{
 mount({price:null});
 global.requestAnimationFrame.mockClear();frame(1000);
 expect(global.requestAnimationFrame).not.toHaveBeenCalled();
 act(()=>root.update(tree({price:123})));
 expect(global.requestAnimationFrame).toHaveBeenCalledTimes(1);
 frame(1200);
 expect(chartView().props.accessibilityLabel).toMatch(/123/);
 act(()=>root.update(tree({price:null})));
 global.requestAnimationFrame.mockClear();frame(1300);
 expect(chartView().props.accessibilityLabel).not.toMatch(/123/);
 expect(global.requestAnimationFrame).not.toHaveBeenCalled();
});

it('samples a steady price on its heartbeat while accepting feed changes immediately',()=>{
 jest.useFakeTimers({doNotFake:['requestAnimationFrame','cancelAnimationFrame']});
 try{
  let push;
  mount({feed:next=>{push=next;return ()=>{};}});
  act(()=>push(100));frame(1000);global.requestAnimationFrame.mockClear();
  act(()=>jest.advanceTimersByTime(199));
  expect(global.requestAnimationFrame).not.toHaveBeenCalled();
  act(()=>jest.advanceTimersByTime(1));
  expect(global.requestAnimationFrame).toHaveBeenCalledTimes(1);
  frame(1200);global.requestAnimationFrame.mockClear();
  act(()=>push(101));
  expect(global.requestAnimationFrame).toHaveBeenCalledTimes(1);
  frame(1240);
  expect(chartView().props.accessibilityLabel).toMatch(/101/);
 }finally{
  if(root){act(()=>root.unmount());root=null;}
  jest.useRealTimers();
 }
});

it('reuses Android ladder text and sampled history between changing price frames',()=>{
 jest.replaceProperty(Platform,'OS','android');
 mount({price:100});
 frame(1000);
 const axes=()=>root.root.findAllByType(SvgText).filter(text=>text.props.fontSize===13);
 const curve=()=>root.root.findAllByType(Path).find(path=>path.props.strokeWidth===2.5);
 const axisRows=axes();
 expect(axisRows.length).toBeGreaterThan(0);
 act(()=>root.update(tree({price:100.03})));
 frame(1100);
 const history=curve(),commands=history.props.d;
 frame(1150);
 expect(axes()).toEqual(axisRows);
 expect(curve()).toBe(history);
 expect(curve().props.d).toBe(commands);
 const labels=axes().map(text=>text.props.children);
 frame(1500);
 expect(axes()).toEqual(axisRows);
 expect(axes().map(text=>text.props.children)).not.toEqual(labels);
});

it('keeps one continuous historical and live stroke on iOS',()=>{
 jest.replaceProperty(Platform,'OS','ios');
 mount({price:100});
 frame(1000);
 const strokes=root.root.findAllByType(Path).filter(path=>path.props.strokeWidth===2.5);
 expect(strokes).toHaveLength(1);
 expect(strokes[0].props.d).toMatch(/^M.*C.*h/);
});

it('keeps the capsule reading across steady chart samples and formats a changed price',()=>{
 const NativeFormat=Intl.NumberFormat;
 const reads=jest.fn();
 const formats=jest.spyOn(Intl,'NumberFormat').mockImplementation((locale,options)=>{
  const formatter=new NativeFormat(locale,options);
  return new Proxy(formatter,{get(target,key){
   if(key==='format')return value=>{reads(value);return target.format(value);};
   return Reflect.get(target,key,target);
  }});
 });
 mount({price:100});frame(1000);
 expect(formats.mock.calls.some(([,options])=>options?.signDisplay==='exceptZero')).toBe(false);
 reads.mockClear();
 for(let i=1;i<=5;i++)frame(1000+i*200);
 expect(reads).not.toHaveBeenCalled();
 act(()=>root.update(tree({price:101})));frame(2200);
 expect(reads).toHaveBeenCalledWith(101);
 expect(chartView().props.accessibilityLabel).toMatch(/101/);
});
it('reports a DEGEN crossing with its target and the direction the price moved',()=>{
 const onTargetCross=jest.fn(),props={price:100,targets:[{id:'entry',price:100.01}],degen:true,onTargetCross};
 mount(props);frame(1000);expect(onTargetCross).not.toHaveBeenCalled();
 act(()=>root.update(tree({...props,price:100.02})));frame(1200);frame(1500);
 expect(root.root.findAllByType(Circle)).toHaveLength(48);
 expect(onTargetCross).toHaveBeenCalledTimes(1);expect(onTargetCross).toHaveBeenLastCalledWith(expect.objectContaining({id:'entry'}),'up');
});
