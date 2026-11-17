import type {Outcome,OutcomeFeed} from './outcome-model.js';

const INFO='https://api.hyperliquid.xyz/info',STREAM='wss://api.hyperliquid.xyz/ws';
/** How often the feed checks for the next season's market. */
const REFRESH_MS=15*60_000;
/** The feed reports live prices at most this often. */
const REPORT_MS=500;
// Club names on the venue, mapped to the reference codes; `other` is every club the venue does not list.
const names:Record<string,string>={Barcelona:'BAR','Paris Saint-Germain':'PSG','Real Madrid':'RMA','Bayern Munich':'BAY',Arsenal:'ARS','Manchester City':'MCI',other:'Other'};
const OTHER='other';
interface Question {question:number;name:string;description:string;namedOutcomes:number[]}
interface Listing {outcome:number;name:string;description:string}
const field=(description:string,key:string)=>description.split('|').find(part=>part.startsWith(`${key}:`))?.slice(key.length+1)??'';
/** The open UEFA Champions League winner market with the earliest resolution date. */
export function nextChampionsLeagueQuestion(questions:readonly Question[]):Question|undefined{
 return questions.filter(q=>q.name==='template:sportsTournamentWinner'&&field(q.description,'competition')==='UEFA Champions League'&&q.namedOutcomes?.length)
  .sort((a,b)=>field(a.description,'resolutionDeadline').localeCompare(field(b.description,'resolutionDeadline')))[0];
}
/** What is left for every unlisted club once each listed club has a price: one minus their sum, never below zero. */
export function remainder(prices:readonly (number|null)[]):number|null{
 return prices.every(price=>price!=null)?Math.max(0,1-prices.reduce<number>((sum,price)=>sum+(price??0),0)):null;
}
/**
 * OutcomeChart's default feed: the winner of the UEFA Champions League on Hyperliquid's outcome markets, the
 * venue's most traded market. Each listed club is priced at the live midpoint of its order book; `Other` is what
 * remains. It finds the market by name, so once a season settles it moves to the next one by itself. It needs no
 * key. Products pass their own `outcomes` or `feed`.
 */
export const championsLeagueWinner:OutcomeFeed=(onOutcomes,onStale)=>{
 if(typeof fetch==='undefined'||typeof WebSocket==='undefined')return ()=>{};
 let stopped=false,socket:WebSocket|undefined,timer:ReturnType<typeof setTimeout>|undefined,reported=0,pending:ReturnType<typeof setTimeout>|undefined,current=-1,outcomes:Outcome[]=[],failures=0;
 const abort=new AbortController();
 const info=(body:object)=>fetch(INFO,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body),signal:abort.signal}).then(response=>{if(!response.ok)throw new Error(String(response.status));return response.json();});
 const snapshot=()=>{const listed=outcomes.filter(outcome=>outcome.id!==OTHER);return outcomes.map(outcome=>outcome.id===OTHER?{...outcome,price:remainder(listed.map(o=>o.price))}:{...outcome});};
 const report=()=>{
  if(stopped||pending)return;
  pending=setTimeout(()=>{pending=undefined;reported=Date.now();if(!stopped)onOutcomes(snapshot());},Math.max(0,reported+REPORT_MS-Date.now()));
 };
 let deadline:ReturnType<typeof setTimeout>|undefined,reconnect:ReturnType<typeof setTimeout>|undefined;
 const listen=()=>{
  if(stopped)return;
  socket?.close();
  const live=socket=new WebSocket(STREAM);
  const arm=()=>{clearTimeout(deadline);deadline=setTimeout(()=>{if(!stopped&&socket===live)live.close();},30_000);};arm();
  live.onopen=()=>{for(const outcome of outcomes)if(outcome.id!==OTHER)live.send(JSON.stringify({method:'subscribe',subscription:{type:'l2Book',coin:outcome.id}}));};
  live.onmessage=event=>{
   if(stopped||socket!==live)return;
   try{
    const message=JSON.parse(String(event.data));
    // The order book sends a snapshot on subscribing and again as it changes; best-quote streams stay silent on a quiet market.
    if(message?.channel!=='l2Book')return;
    const [bid,ask]=(message.data?.levels??[]).map((side:{px?:string}[])=>Number(side?.[0]?.px)),outcome=outcomes.find(o=>o.id===message.data?.coin);
    // A one-sided book says little about the price; keep the last one.
    if(!outcome||!(bid>0)||!(ask>0))return;
    outcome.price=(bid+ask)/2;arm();report();
   }catch{/* A malformed frame is skipped. */}
  };
  live.onclose=()=>{if(stopped||socket!==live)return;clearTimeout(deadline);onStale?.();reconnect=setTimeout(()=>{if(!stopped&&socket===live)listen();},5000);};
 };
 const refresh=async()=>{
  try{
   const meta:{questions?:Question[];outcomes?:Listing[]}=await info({type:'outcomeMeta'}),question=nextChampionsLeagueQuestion(meta.questions??[]);
   if(stopped)return;
   if(question&&question.question!==current){
    // Starting prices put the favorite first; the order then stays fixed so capsules keep their colors.
    const mids:Record<string,string>=await info({type:'allMids'});
    if(stopped)return;
    const listed=question.namedOutcomes.map(id=>{
     const coin=`#${id*10}`,club=field((meta.outcomes??[]).find(o=>o.outcome===id)?.description??'','participant')||coin,price=Number(mids[coin]);
     return {id:coin,label:names[club]??club,price:price>0?price:null};
    }).sort((a,b)=>(b.price??0)-(a.price??0));
    current=question.question;outcomes=[...listed,{id:OTHER,label:names.other,price:null}];report();listen();
   }
   failures=0;
  }catch{if(!stopped)onStale?.();failures++;/* Offline or rate limited: try again below. */}
  if(!stopped)timer=setTimeout(refresh,failures?Math.min(REFRESH_MS,2000*2**failures):REFRESH_MS);
 };
 refresh();
 return ()=>{stopped=true;abort.abort();clearTimeout(timer);clearTimeout(pending);clearTimeout(deadline);clearTimeout(reconnect);socket?.close();};
};
