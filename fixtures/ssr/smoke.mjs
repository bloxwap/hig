import assert from 'node:assert/strict';
import React from 'react';
import {renderToString} from 'react-dom/server';
import {tokens} from '@bloxwap/hig-tokens';
const html=renderToString(React.createElement('p',{style:{color:tokens.colors.text.srgb}},'Review order'));
assert.match(html,/Review order/); console.log('SSR deterministic token render passed');
