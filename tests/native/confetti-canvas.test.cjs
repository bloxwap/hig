const mockTimings=[];
jest.mock('react-native-reanimated',()=>({
 __esModule:true,default:{createAnimatedComponent:component=>component},
 Easing:{linear:'linear'},ReduceMotion:{Never:'never'},
 useSharedValue:initial=>require('react').useMemo(()=>({value:initial}),[]),
 useAnimatedProps:updater=>updater(),cancelAnimation:()=>{},runOnJS:callback=>callback,
 withTiming:(_to,_config,done)=>{mockTimings.push(done);return 1;},
}));
it('a linked Android host sends the seeded burst to one canvas and settles overlapping runs independently',async()=>{
  const R=require('react'),{create,act}=require('react-test-renderer'),RN=require('react-native');
  const descriptor=Object.getOwnPropertyDescriptor(RN.Platform,'OS'),original=RN.UIManager.hasViewManagerConfig;
  Object.defineProperty(RN.Platform,'OS',{value:'android',configurable:true});
  RN.UIManager.hasViewManagerConfig=name=>name==='HIGConfettiCanvas';
  let gallery;
  try {
   const {Confetti,confetti}=require('../../packages/hig/native/src/confetti');
   await act(async()=>{gallery=create(R.createElement(Confetti));});
   let first,second;
   act(()=>{first=confetti({particleCount:300,colors:['#ff000080'],shapes:['star']});second=confetti({particleCount:100});});
   const canvases=()=>gallery.root.findAll(node=>node.type==='HIGConfettiCanvas');
   expect(canvases()).toHaveLength(2);
   const {burst,animatedProps}=canvases()[0].props;
   expect(burst.particles).toHaveLength(300);
   expect(burst.particles[0].shape).toBe('star');
   expect(burst.starPoints).toHaveLength(10);
   expect(burst.colors).toEqual([RN.processColor('#ff000080')]);
   expect(animatedProps).toEqual({tick:1});
   expect(mockTimings).toHaveLength(2);
   act(()=>mockTimings[0](true));
   await first;
   expect(canvases()).toHaveLength(1);
   act(()=>confetti.reset());
   await second;
   expect(canvases()).toHaveLength(0);
  } finally {
   if(gallery)act(()=>gallery.unmount());
   Object.defineProperty(RN.Platform,'OS',descriptor);RN.UIManager.hasViewManagerConfig=original;
  }
});
