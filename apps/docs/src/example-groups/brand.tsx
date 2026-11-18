// Generated from planning/examples.json.
import React from 'react';
import {BrandMark,CheckIcon} from '@bloxwap/hig/react/brand';
import {IconButton} from '@bloxwap/hig/react/button';
import {Text,Stack} from '@bloxwap/hig/react/surface';
const components={Stack,Text,BrandMark,IconButton,CheckIcon};
export function Example({name}:{name:string;state?:string;previewDialog?:typeof import('@bloxwap/hig/react/overlay').Dialog}){const C=components;
function preview(){switch(name){case "BrandMark":return <C.BrandMark size={48} label='Bloxwap'/>;
case "CheckIcon":return <C.IconButton label='Confirm selection'><C.CheckIcon/></C.IconButton>;
default:return <C.Text>Platform example unavailable.</C.Text>;}}return <C.Stack>{preview()}</C.Stack>;}
