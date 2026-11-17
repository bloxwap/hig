// Looping animations (Skeleton pulse, StatusIndicator ring) run on the native driver, which this renderer cannot attach. Tests keep them inert and assert on the loop request instead.
beforeEach(()=>{const {Animated}=require('react-native');global.__loops=[];jest.spyOn(Animated,'loop').mockImplementation(animation=>{const loop={animation,start:jest.fn(),stop:jest.fn(),reset:jest.fn()};global.__loops.push(loop);return loop;});});
afterEach(()=>{require('react-native').Animated.loop.mockRestore?.();});
jest.mock('react-native-safe-area-context',()=>require('react-native-safe-area-context/jest/mock').default);

const mockNumberReanimated={values:[],animations:[],cancel:jest.fn(),timing:jest.fn((toValue,config)=>({__numberTiming:true,toValue,config}))};
global.__numberReanimated=mockNumberReanimated;
jest.mock('react-native-reanimated',()=>{
 const React=require('react'),RN=require('react-native');
 return {
  __esModule:true,
  default:{View:RN.View,Text:RN.Text},
  cancelAnimation:mockNumberReanimated.cancel,
  withTiming:mockNumberReanimated.timing,
  useSharedValue(initial){
   const ref=React.useRef(null);
   if(ref.current===null){
    let current=initial;
    ref.current={get value(){return current;},set value(next){if(next&&next.__numberTiming)mockNumberReanimated.animations.push({value:this,toValue:next.toValue,config:next.config});else current=next;}};
    mockNumberReanimated.values.push(ref.current);
   }
   return ref.current;
  },
  useAnimatedStyle:updater=>updater(),
  Easing:{cubic:value=>value,out:easing=>easing,bezier:(...points)=>({bezier:points})},
  ReduceMotion:{Never:'never',System:'system',Always:'always'},
 };
});

// Native image decoding is exercised in the simulator fixture; Jest checks view props.
jest.mock('expo-image',()=>({Image:'ExpoImage'}));
