import {it,expect} from 'vitest';
import {capsuleCenters,fullScale,outcomeChance,outcomeColors,outcomeScale,outcomeTicks,outcomeY,OUTCOME_LIMIT} from '../packages/hig/chart/src/outcome-model';
import {nextChampionsLeagueQuestion,remainder} from '../packages/hig/chart/src/champions-league';

it('a price reads as a chance from 0 to 1, unknown while it is missing',()=>{
 expect(outcomeChance(.24)).toBe(.24);expect(outcomeChance(1.4)).toBe(1);expect(outcomeChance(-1)).toBe(0);expect(outcomeChance(null)).toBeNull();expect(outcomeChance(NaN)).toBeNull();
});

it('the whole ladder has a tick every ten percent, 100% at the top inset and 0% at the bottom inset',()=>{
 expect(outcomeTicks()).toEqual([1,.9,.8,.7,.6,.5,.4,.3,.2,.1,0]);
 expect(outcomeY(1,360,24)).toBe(24);expect(outcomeY(0,360,24)).toBe(336);expect(outcomeY(.5,360,24)).toBe(180);
 expect(outcomeTicks().map(tick=>outcomeY(tick,360,24)).every((y,index,all)=>index===0||Math.abs(y-all[index-1]-31.2)<1e-9)).toBe(true);
});

it('the ladder zooms to the range the chances occupy, on 1, 2, 5 or 10 percent steps',()=>{
 // Champions League: 5.4% to 22.1% fits a 2% ladder from 2% to 24%.
 const clubs=outcomeScale([.22143,.18467,.13954,.13614,.13575,.12853,.05396]);
 expect(clubs).toEqual({low:.02,high:.24,step:.02});expect(outcomeTicks(clubs)).toEqual([.24,.22,.2,.18,.16,.14,.12,.1,.08,.06,.04,.02]);
 expect(outcomeY(.24,360,24,clubs)).toBe(24);expect(outcomeY(.02,360,24,clubs)).toBe(336);expect(outcomeY(.13,360,24,clubs)).toBeCloseTo(180);
 // Chances outside the scale stay on its edge.
 expect(outcomeY(.9,360,24,clubs)).toBe(24);expect(outcomeY(0,360,24,clubs)).toBe(336);
 // Far apart chances keep the whole ladder; one chance, or none, still gets a usable one.
 expect(outcomeScale([.04,.004,.95])).toEqual(fullScale);expect(outcomeScale([.5,.25])).toEqual({low:.2,high:.55,step:.05});
 expect(outcomeScale([.5])).toEqual({low:.48,high:.52,step:.01});expect(outcomeScale([.999])).toEqual({low:.96,high:1,step:.01});expect(outcomeScale([null,null])).toEqual(fullScale);
});

it('the ladder holds still while chances move inside it, and changes when one leaves or they close in',()=>{
 const first=outcomeScale([.22,.05]);
 expect(first).toEqual({low:.02,high:.24,step:.02});expect(outcomeScale([.225,.06],first)).toBe(first);expect(outcomeScale([.2,.1],first)).toBe(first);
 expect(outcomeScale([.3,.05],first)).not.toBe(first);expect(outcomeScale([.21,.2],first)).toEqual({low:.18,high:.22,step:.01});
 expect(outcomeScale([null],first)).toBe(first);
});

it('capsules sit at their prices until they would overlap or leave the chart, then move apart in order',()=>{
 expect(capsuleCenters([40,200,300],360)).toEqual([40,200,300]);
 // 4¢ and 1¢ are 9px apart: the lower one is held inside the chart and the upper one is pushed above it.
 expect(capsuleCenters([39.6,323.5,332.9],360)).toEqual([39.6,300,342]);
 expect(capsuleCenters([5,5],360)).toEqual([18,60]);expect(capsuleCenters([350,10],360)).toEqual([342,18]);
 const ten=capsuleCenters(Array.from({length:10},()=>180),420);expect(ten[0]).toBe(24);expect(ten[9]).toBe(402);
 // Ten in the default height: the gap closes so the first and last still fit.
 const tight=capsuleCenters(Array.from({length:10},()=>180),360);expect(tight[0]).toBe(18);expect(tight[9]).toBe(342);expect(tight[1]-tight[0]).toBe(36);
 expect(capsuleCenters([],360)).toEqual([]);expect(OUTCOME_LIMIT).toBe(10);expect(outcomeColors).toHaveLength(10);expect(new Set(outcomeColors).size).toBe(10);
});

it('the Champions League feed follows the open winner market that resolves first, and prices Other as the remainder',()=>{
 const winner=(question:number,competition:string,deadline:string)=>({question,name:'template:sportsTournamentWinner',description:`competition:${competition}|officialSource:UEFA|resolutionDeadline:${deadline}|season:x`,namedOutcomes:[1,2,3]});
 const questions=[{question:1,name:'Recurring',description:'class:priceBucket',namedOutcomes:[9]},winner(7,'UEFA Champions League','20280612-1200'),winner(5,'UEFA Champions League','20270612-1200'),winner(3,'English Premier League','20270605-1200')];
 expect(nextChampionsLeagueQuestion(questions)?.question).toBe(5);
 // Once this season settles and leaves the listing, the next season's market is next.
 expect(nextChampionsLeagueQuestion(questions.filter(q=>q.question!==5))?.question).toBe(7);expect(nextChampionsLeagueQuestion([])).toBeUndefined();
 expect(remainder([.22,.18,.14])).toBeCloseTo(.46);expect(remainder([.7,.6])).toBe(0);expect(remainder([.22,null])).toBeNull();
});
