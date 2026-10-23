import React from 'react';
import {afterEach,it,expect,vi} from 'vitest';
import {render,screen,cleanup} from '@testing-library/react';
// The adapter reads messages through the published @bloxwap/hig-react/provider entry, so the test uses the same one.
import {HIGProvider} from '@bloxwap/hig-react/provider';
import {tokens} from '@bloxwap/hig-tokens';
import {PriceChart,chartTheme} from '../packages/chart/src/index';

// The canvas engine itself is @bloxwap/chart's responsibility; a stand-in records what the adapter passes it.
vi.mock('@bloxwap/chart/react',()=>({Chart:(props:{preset:unknown;height?:number})=><div data-testid='engine' data-preset={JSON.stringify(props.preset)} data-height={props.height}/>}));
afterEach(cleanup);

it('PriceChart keeps the text summary, shows the host-localized fallback, then mounts the engine with the token theme (#96)',async()=>{
 render(<HIGProvider messages={{loadingChart:'Diagramm wird geladen'}}><PriceChart summary='BTC up 1% today' data={[]} height={240}/></HIGProvider>);
 const figure=screen.getByRole('figure');
 expect(figure.querySelector('figcaption')?.textContent).toBe('BTC up 1% today');
 expect(screen.getByRole('status').textContent).toBe('Diagramm wird geladen');
 const engine=await screen.findByTestId('engine');
 expect(JSON.parse(engine.dataset.preset!)).toEqual(chartTheme);expect(engine.dataset.height).toBe('240');
 expect(chartTheme.series?.upColor).toBe(tokens.colors.buy.srgb);expect(chartTheme.series?.downColor).toBe(tokens.colors.sell.srgb);
});

it('PriceChart follows the primary accent and leaves trading direction colours intact',async()=>{
 render(<HIGProvider primaryColor='#f00'><PriceChart summary='Tap Trade TV' data={[]}/></HIGProvider>);
 const engine=await screen.findByTestId('engine');const preset=JSON.parse(engine.dataset.preset!);
 expect(preset.crosshair.labelBackground).toBe('#ff0000');expect(preset.crosshair.labelColor).toBe('#000000');
 expect(preset.series).toEqual(chartTheme.series);
});
