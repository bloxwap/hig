// Generated from planning/examples.json.
import React from 'react';
import {Popover} from '@bloxwap/hig/react/overlay';
import {Text,Stack} from '@bloxwap/hig/react/surface';
const components={Stack,Text,Popover};
export function Example({name}:{name:string;state?:string;previewDialog?:typeof import('@bloxwap/hig/react/overlay').Dialog}){const C=components;
function preview(){switch(name){case "Popover":return <C.Popover label='Precision help'><C.Text>Display rounding never changes order quantity.</C.Text></C.Popover>;
default:return <C.Text>Platform example unavailable.</C.Text>;}}return <C.Stack>{preview()}</C.Stack>;}
