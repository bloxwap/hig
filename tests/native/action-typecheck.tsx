import React,{useRef} from 'react';
import {Text,View} from 'react-native';
import {Button,Link} from '../../packages/native/src/button.js';
export function HostActions(){const link=useRef<React.ComponentRef<typeof View>>(null);return <><Button contentMode='custom' busy busyLabel='' style={{flexDirection:'row',justifyContent:'space-between'}} onPress={()=>{}}><Text>Saving</Text><View/></Button><Link ref={link} href='https://example.test/terms' contentMode='custom' onPress={()=>{}} style={({pressed})=>({opacity:pressed?0.7:1})} testID='terms' hitSlop={8} disabled><Text>Terms</Text></Link></>;}
// @ts-expect-error link anatomy retains link semantics
const wrongRole=<Link href='https://example.test' accessibilityRole='button'>Terms</Link>;
// @ts-expect-error even custom native links retain their destination
const missingDestination=<Link contentMode='custom'><Text>Terms</Text></Link>;
// @ts-expect-error content mode is a closed anatomy choice
const wrongMode=<Button contentMode='raw'>Account</Button>;
void wrongRole;void missingDestination;void wrongMode;
