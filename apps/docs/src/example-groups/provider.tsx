// Generated from planning/examples.json.
import React from 'react';
import {Text,Stack,Surface} from '@bloxwap/hig/react/surface';
const components={Stack,Text,Surface};
export function Example({name}:{name:string;state?:string;previewDialog?:typeof import('@bloxwap/hig/react/overlay').Dialog}){const C=components;
function preview(){switch(name){case "HIGProvider":return <C.Surface><C.Text>Density, locale and motion are scoped to this provider.</C.Text></C.Surface>;
default:return <C.Text>Platform example unavailable.</C.Text>;}}return <C.Stack>{preview()}</C.Stack>;}
