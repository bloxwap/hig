import {describe,expect,it} from 'vitest';
import {backdropProgress,detentHeight,detentHeights,dragPosition,releaseTarget,rubberBand,SHEET_FLICK} from '../packages/hig/native/src/gesture-sheet-model';
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
  expect(releaseTarget(100,0,positions,800,true)).toBe(0);expect(releaseTarget(300,0,positions,800,true)).toBe(1);expect(releaseTarget(590,0,positions,800,true)).toBe(1);
  expect(releaseTarget(610,0,positions,800,true)).toBe(-1);expect(releaseTarget(790,0,positions,800,false)).toBe(1);
 });
 it('moves one detent in the direction of a flick, closes from the lowest, and never closes when not dismissible',()=>{
  const positions=[80,400,600];
  expect(releaseTarget(90,SHEET_FLICK,positions,800,true)).toBe(1);expect(releaseTarget(410,SHEET_FLICK,positions,800,true)).toBe(2);
  expect(releaseTarget(610,SHEET_FLICK,positions,800,true)).toBe(-1);expect(releaseTarget(610,SHEET_FLICK,positions,800,false)).toBe(2);
  expect(releaseTarget(590,-SHEET_FLICK,positions,800,true)).toBe(1);expect(releaseTarget(390,-SHEET_FLICK,positions,800,true)).toBe(0);expect(releaseTarget(60,-SHEET_FLICK,positions,800,true)).toBe(0);
  expect(releaseTarget(300,0,[],800,true)).toBe(-1);
 });
 it('dims fully at the lowest detent and above, fading out towards closed',()=>{
  expect(backdropProgress(400,400,800)).toBe(1);expect(backdropProgress(80,400,800)).toBe(1);expect(backdropProgress(600,400,800)).toBe(0.5);expect(backdropProgress(800,400,800)).toBe(0);
 });
});
