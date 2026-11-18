import {describe,expect,it} from 'vitest';
import {backdropProgress,detentHeight,detentHeights,dragPosition,releaseTarget,rubberBand,SHEET_FLICK,SHEET_FLICK_TRAVEL,SHEET_TRANSITION} from '../packages/hig/native/src/gesture-sheet-model';
describe('native sheet arithmetic',()=>{
 it('reads detents as points or a share of the room, clamped, sorted and without duplicates',()=>{
  expect(detentHeight(300,800)).toBe(300);expect(detentHeight('50%',800)).toBe(400);expect(detentHeight(2000,800)).toBe(800);expect(detentHeight(-5,800)).toBe(0);expect(detentHeight('x%' as `${number}%`,800)).toBe(0);
  expect(detentHeights(['90%',300,'50%',300,0],800)).toEqual([300,400,720]);expect(detentHeights([],800)).toEqual([]);
 });
 it('resists past a limit without ever passing it',()=>{
  expect(rubberBand(0,100)).toBe(0);expect(rubberBand(-10,100)).toBe(0);
  const near=rubberBand(10,100),far=rubberBand(1000,100);expect(near).toBeGreaterThan(0);expect(near).toBeLessThan(10);expect(far).toBeGreaterThan(near);expect(far).toBeLessThan(100);
 });
 it('follows the finger between the top detent and closed, and resists outside',()=>{
  // top 80, lowest detent 400, closed 800
  expect(dragPosition(300,80,400,800,true)).toBe(300);expect(dragPosition(700,80,400,800,true)).toBe(700);expect(dragPosition(900,80,400,800,true)).toBe(800);
  const above=dragPosition(20,80,400,800,true);expect(above).toBeLessThan(80);expect(above).toBeGreaterThan(20);
  // Not dismissible: below the lowest detent the sheet resists instead of following.
  const below=dragPosition(600,80,400,800,false);expect(below).toBeGreaterThan(400);expect(below).toBeLessThan(600);
 });
 it('settles a slow release on the nearest detent, or closes past half way down from the lowest',()=>{
  const positions=[80,400];
  expect(releaseTarget(100,0,positions,800,true,80)).toBe(0);expect(releaseTarget(300,0,positions,800,true,80)).toBe(1);expect(releaseTarget(590,0,positions,800,true,400)).toBe(1);
  expect(releaseTarget(610,0,positions,800,true,400)).toBe(-1);expect(releaseTarget(790,0,positions,800,false,400)).toBe(1);
 });
 it('moves one detent in the direction of a flick and never closes when not dismissible',()=>{
  const positions=[80,400,600];
  expect(releaseTarget(120,SHEET_FLICK,positions,800,true,80)).toBe(1);expect(releaseTarget(440,SHEET_FLICK,positions,800,true,400)).toBe(2);
  expect(releaseTarget(640,SHEET_FLICK,positions,800,true,600)).toBe(-1);expect(releaseTarget(640,SHEET_FLICK,positions,800,false,600)).toBe(2);
  expect(releaseTarget(560,-SHEET_FLICK,positions,800,true,600)).toBe(1);expect(releaseTarget(360,-SHEET_FLICK,positions,800,true,400)).toBe(0);expect(releaseTarget(40,-SHEET_FLICK,positions,800,true,80)).toBe(0);
  // A drag carried down and flicked back up returns to the detent above it.
  expect(releaseTarget(500,-SHEET_FLICK,positions,800,true,400)).toBe(1);
  expect(releaseTarget(300,0,[],800,true,300)).toBe(-1);
 });
 it('closes on a flick only when the sheet was carried and its momentum reaches a quarter of the way to closed',()=>{
  // One detent at the full height of an 800 point sheet: the closing line of a flick is 200 points down, of a placement 400.
  const positions=[0],release=(position:number,velocity:number,start=0,scrolled=false)=>releaseTarget(position,velocity,positions,800,true,start,scrolled);
  // A nudge, however fast, is a placement: the sheet stays.
  expect(release(SHEET_FLICK_TRAVEL-1,3000)).toBe(0);expect(release(0,3000)).toBe(0);
  // Carried far enough to be a flick, but too slowly for the momentum to reach the line: 40 + 600 × 0.18 = 148.
  expect(release(40,600)).toBe(0);
  // The same carry with a deliberate flick closes: 40 + 1000 × 0.18 = 220.
  expect(release(40,1000)).toBe(-1);expect(release(120,SHEET_FLICK)).toBe(-1);
  // Past half way a release closes at any speed, as before.
  expect(release(410,0)).toBe(-1);
 });
 it('places the sheet when the drag began as a scroll of its content: a list flung back to its top does not throw the sheet',()=>{
  const positions=[0],release=(position:number,velocity:number)=>releaseTarget(position,velocity,positions,800,true,0,true);
  // The content reached its top and the sheet followed the finger for 60 points before a fast release.
  expect(release(60,2400)).toBe(0);expect(release(0,2400)).toBe(0);
  // Carried past half way it still closes.
  expect(release(420,2400)).toBe(-1);
  // With detents, the flick does not skip one either: the nearest wins.
  expect(releaseTarget(120,2400,[80,400],800,true,80,true)).toBe(0);
 });
 it('uses the measured Vaul drawer curve for sheet travel',()=>{
  expect(SHEET_TRANSITION).toEqual({duration:270,curve:[0.26,0.08,0.25,1]});
 });
 it('dims fully at the lowest detent and above, fading out towards closed',()=>{
  expect(backdropProgress(400,400,800)).toBe(1);expect(backdropProgress(80,400,800)).toBe(1);expect(backdropProgress(600,400,800)).toBe(0.5);expect(backdropProgress(800,400,800)).toBe(0);
 });
});
