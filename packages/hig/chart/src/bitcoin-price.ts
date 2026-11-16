/** A live price source: call `onPrice` with each new price, and return a function that stops it. */
export type AltimeterFeed=(onPrice:(price:number)=>void)=>()=>void;

const HYPERLIQUID_WS='wss://api.hyperliquid.xyz/ws';
/**
 * AltimeterChart's default feed: the Bitcoin mid price from Hyperliquid's public best-bid/offer stream, a market
 * that is always moving. It needs no key and sends nothing but the subscription. Products pass their own `price`
 * or `feed`.
 */
export const bitcoinPrice:AltimeterFeed=onPrice=>{
 if(typeof WebSocket==='undefined')return ()=>{};
 let socket:WebSocket|undefined,retry:ReturnType<typeof setTimeout>|undefined,stopped=false,attempts=0;
 const open=()=>{
  const current=socket=new WebSocket(HYPERLIQUID_WS);
  current.onopen=()=>current.send(JSON.stringify({method:'subscribe',subscription:{type:'bbo',coin:'BTC'}}));
  current.onmessage=event=>{
   try{
    const message=JSON.parse(String(event.data));
    if(message?.channel!=='bbo')return;
    const sides=(message.data?.bbo??[]).map((level:{px?:string}|null)=>Number(level?.px)).filter((px:number)=>Number.isFinite(px)&&px>0);
    if(sides.length===0)return;
    attempts=0;
    onPrice(sides.reduce((sum:number,px:number)=>sum+px,0)/sides.length);
   }catch{/* A malformed frame is skipped; the next one carries the price. */}
  };
  current.onclose=()=>{if(!stopped)retry=setTimeout(open,Math.min(30_000,1000*2**attempts++));};
 };
 open();
 return ()=>{stopped=true;clearTimeout(retry);socket?.close();};
};
