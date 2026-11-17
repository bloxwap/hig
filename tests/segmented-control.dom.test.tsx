import React from 'react';
import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {renderToString} from 'react-dom/server';
import {SegmentedControl} from '../packages/hig/react/src/selection';
const options=[{value:'all',label:'All'},{value:'open',label:'Open'},{value:'trend',label:'Trend'}];
afterEach(cleanup);

it('moves one decorative indicator only after the host accepts a controlled selection',async()=>{
 const change=vi.fn();const {container,rerender}=render(<SegmentedControl label='Markets' options={options} value='all' onValueChange={change}/>);
 const pill=container.querySelector('.hig-segment-indicator'),track=container.querySelector<HTMLElement>('.hig-segments')!;
 expect(pill?.getAttribute('aria-hidden')).toBe('true');
 await userEvent.click(screen.getByRole('radio',{name:'Trend'}));expect(change).toHaveBeenCalledExactlyOnceWith('trend');
 expect(track.style.getPropertyValue('--hig-segment-index')).toBe('0');expect((screen.getByRole('radio',{name:'All'}) as HTMLInputElement).checked).toBe(true);
 rerender(<SegmentedControl label='Markets' options={options} value='trend' onValueChange={change}/>);
 expect(track.style.getPropertyValue('--hig-segment-index')).toBe('2');expect(container.querySelector('.hig-segment-indicator')).toBe(pill);
 rerender(<SegmentedControl label='Markets' options={[options[2],options[0]]} value='trend'/>);
 expect(track.style.getPropertyValue('--hig-segment-index')).toBe('0');expect(track.style.getPropertyValue('--hig-segment-count')).toBe('2');
 rerender(<SegmentedControl label='Markets' options={options} value='missing'/>);expect(container.querySelector('.hig-segment-indicator')).toBeNull();
 rerender(<SegmentedControl label='Markets' options={[]} value='trend'/>);expect(container.querySelector('.hig-segment-indicator')).toBeNull();
});

it('renders the initial selection in server HTML without waiting for measurements',()=>{
 const html=renderToString(<SegmentedControl label='Markets' options={options} defaultValue='open'/>);
 expect(html).toContain('--hig-segment-index:1');expect(html).toContain('hig-segment-indicator');expect(html).toContain('checked=""');
});

it('sets the group data-testid, <testID>-<value> on each radio, and an option testID in its place',async()=>{
 const change=vi.fn();
 render(<SegmentedControl label='Markets' testID='markets' options={[options[0],{...options[1],testID:'open-custom'},options[2]]} defaultValue='all' onValueChange={change}/>);
 expect(screen.getByTestId('markets').tagName).toBe('FIELDSET');
 expect(screen.getAllByRole('radio').map(radio=>radio.getAttribute('data-testid'))).toEqual(['markets-all','open-custom','markets-trend']);
 await userEvent.click(screen.getByTestId('markets-trend'));expect(change).toHaveBeenCalledExactlyOnceWith('trend');expect(screen.getByTestId('markets-trend')).toHaveProperty('checked',true);
 cleanup();
 render(<SegmentedControl label='Markets' options={[options[0],{...options[1],testID:'open-only'}]}/>);
 expect(screen.getAllByRole('radio').map(radio=>radio.getAttribute('data-testid'))).toEqual([null,'open-only']);
});
