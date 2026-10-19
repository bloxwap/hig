import React from 'react';
import {StyleSheet} from 'react-native';
import {NumberReadout,Percent,Usd,type NumberProps,type NumberReadoutStyle} from '../../packages/native/src/data.js';
import {AnimatedNumberReadout} from '../../packages/native/src/animated-number.js';

const registered=StyleSheet.create({equity:{fontFamily:'HostMonoSemiBold',fontWeight:'normal',fontSize:20,lineHeight:28}});
const typography:NumberReadoutStyle={fontSize:24,textAlign:'right',letterSpacing:.2};

/** Compiled with the workspace: real native consumer styles must work on every readout entry. */
export const nativeReadoutTypecheck=<>
 <NumberReadout value={1} tone='positive' testID='equity' style={[registered.equity,false,[typography]]}/>
 <Usd value={1} tone='muted' testID='usd' style={registered.equity}/>
 <Percent value={5} tone='negative' testID='percent' style={typography}/>
 <AnimatedNumberReadout value={1} tone='text' testID='price' duration={180} style={registered.equity}/>
</>;

// @ts-expect-error Readouts use semantic tone roles rather than raw colours.
const rawTone:NumberProps={value:1,tone:'#00ff00'};
// @ts-expect-error The typography style excludes colour overrides.
const rawColour:NumberProps={value:1,style:{color:'#00ff00'}};
// @ts-expect-error Numeric glyph layout remains tabular.
const glyphOverride:NumberProps={value:1,style:{fontVariant:['proportional-nums']}};
// @ts-expect-error Layout belongs on the host container.
const wrapperStyle:NumberProps={value:1,style:{padding:20}};
void [rawTone,rawColour,glyphOverride,wrapperStyle];
