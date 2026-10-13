import React from 'react';
import {createRoot} from 'react-dom/client';
import './fonts.css';
import '@bloxwap/hig-tokens/css';
import {tokens} from '@bloxwap/hig-tokens';
createRoot(document.getElementById('root')!).render(<main style={{background:tokens.colors.background.srgb,color:tokens.colors.text.srgb,padding:tokens.space.xl,fontFamily:'Bloxwap Sans'}}><h1>Bloxwap HIG 0.1.0</h1><p>Touch first. Clear outcomes. Quiet feedback.</p><button style={{background:tokens.colors.action.srgb,minHeight:48}}>Review order</button></main>);
