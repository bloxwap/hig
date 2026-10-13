import React from 'react';
import {SafeAreaView,Text,View} from 'react-native';
import {nativeColors,tokens} from '@bloxwap/hig-tokens';
export default function App(){return <SafeAreaView style={{flex:1,backgroundColor:nativeColors.android.background}}><View style={{padding:tokens.space.xl}}><Text accessibilityRole='header' style={{color:nativeColors.android.text,fontSize:24}}>Bloxwap HIG</Text><Text style={{color:nativeColors.android.muted}}>Native sRGB fallback · font registration pending pinned static assets</Text></View></SafeAreaView>;}
