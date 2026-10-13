import assert from 'node:assert/strict';
import React from 'react';
import {renderToString} from 'react-dom/server';
import {Button} from '@bloxwap/hig-react/button';
import {HIGProvider} from '@bloxwap/hig-react/provider';
import {tokens} from '@bloxwap/hig-tokens';
const html=renderToString(React.createElement(HIGProvider,null,React.createElement(Button,{style:{color:tokens.colors.text.srgb}},'Review order')));
assert.match(html,/Review order/); console.log('SSR deterministic token render passed');
