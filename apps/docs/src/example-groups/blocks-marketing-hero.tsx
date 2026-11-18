// Generated from planning/examples.json.
import React from 'react';
import {MarketingHero} from '@bloxwap/hig/react/blocks';
import {Text,Stack} from '@bloxwap/hig/react/surface';
const components={Stack,Text,MarketingHero};
export function Example({name}:{name:string;state?:string;previewDialog?:typeof import('@bloxwap/hig/react/overlay').Dialog}){const C=components;
function preview(){switch(name){case "MarketingHero":return <C.MarketingHero title='Clear decisions, every screen.' description='Compose Bloxwap primitives with host-owned product behavior.' href='https://github.com/bloxwap/hig' cta='Read the guidelines'/>;
default:return <C.Text>Platform example unavailable.</C.Text>;}}return <C.Stack>{preview()}</C.Stack>;}
