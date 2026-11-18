// Generated from planning/examples.json.
import React from 'react';
import {Avatar} from '@bloxwap/hig/react/avatar';
import {Text,Stack,Inline} from '@bloxwap/hig/react/surface';
const components={Stack,Text,Inline,Avatar};
export function Example({name,state='default'}:{name:string;state?:string;previewDialog?:typeof import('@bloxwap/hig/react/overlay').Dialog}){const C=components;
function preview(){switch(name){case "Avatar":return state==="generated"?<C.Inline><C.Avatar name='Joe' seed='0x1111111111111111111111111111111111111111'/><C.Avatar name='Maria Mitchell' seed='0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'/><C.Avatar name='Clara Barton' variant='beam'/><C.Avatar name='Signed out' seed='bloxwap' size={64}/><C.Avatar name='Small' seed='anon' size={24}/><C.Avatar name='Square' seed='sim:k3j9x0aa' square/></C.Inline>:state==="palette"?<C.Inline><C.Avatar name='Joe' seed='0x1111111111111111111111111111111111111111' colors={['#7c5cff','#ffb020','#1f2a44']}/><C.Avatar name='Maria Mitchell' seed='0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' colors={['#7c5cff','#ffb020','#1f2a44']}/><C.Avatar name='Clara Barton' variant='beam' colors={['#7c5cff','#ffb020','#1f2a44']}/><C.Avatar name='Sojourner Truth' variant='beam' colors={['#7c5cff','#ffb020','#1f2a44']} faceColor='#ffffff'/></C.Inline>:<C.Avatar name='Demo account'/>;
default:return <C.Text>Platform example unavailable.</C.Text>;}}return <C.Stack>{preview()}</C.Stack>;}
