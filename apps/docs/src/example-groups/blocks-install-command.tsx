// Generated from planning/examples.json.
import React from 'react';
import {InstallCommand} from '@bloxwap/hig/react/blocks';
import {Text,Stack} from '@bloxwap/hig/react/surface';
const components={Stack,Text,InstallCommand};
export function Example({name}:{name:string;state?:string;previewDialog?:typeof import('@bloxwap/hig/react/overlay').Dialog}){const C=components;
function preview(){switch(name){case "InstallCommand":return <C.InstallCommand command='npm install @bloxwap/hig@0.9.2' onCopy={()=>navigator.clipboard.writeText('npm install @bloxwap/hig@0.9.2')}/>;
default:return <C.Text>Platform example unavailable.</C.Text>;}}return <C.Stack>{preview()}</C.Stack>;}
