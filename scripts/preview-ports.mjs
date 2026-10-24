import {createServer} from 'node:net';

// Jobs on the same self-hosted machine share its network namespace. Reserve all
// requested ephemeral ports together so one suite cannot select a port twice.
export async function availablePorts(count){
 const reservations=[];
 try{
  for(let i=0;i<count;i++){
   const server=createServer();reservations.push(server);
   await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  }
  return reservations.map(server=>server.address().port);
 }finally{
  await Promise.all(reservations.map(server=>new Promise(resolve=>server.close(resolve))));
 }
}
