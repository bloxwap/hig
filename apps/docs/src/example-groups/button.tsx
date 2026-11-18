// Generated from planning/examples.json.
import React from 'react';
import {CheckIcon} from '@bloxwap/hig/react/brand';
import {Button,IconButton,Link} from '@bloxwap/hig/react/button';
import {Text,Stack} from '@bloxwap/hig/react/surface';
const components={Stack,Text,Button,IconButton,CheckIcon,Link};
export function Example({name,state='default'}:{name:string;state?:string;previewDialog?:typeof import('@bloxwap/hig/react/overlay').Dialog}){const C=components;const busy=state==='busy';
const disabled=state==='disabled';
function preview(){switch(name){case "Button":return <C.Button busy={busy} disabled={disabled}>Review order</C.Button>;
case "IconButton":return <C.IconButton label='Confirm selection' busy={busy} disabled={disabled}><C.CheckIcon/></C.IconButton>;
case "Link":return <C.Link href='https://github.com/bloxwap/hig'>Read HIG guidelines</C.Link>;
default:return <C.Text>Platform example unavailable.</C.Text>;}}return <C.Stack>{preview()}</C.Stack>;}
