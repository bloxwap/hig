import {spawn} from 'node:child_process';

export function monitorPreviews(children){
 const failure=new Promise((_,reject)=>{
  for(const child of children){
   const exited=()=>reject(Error(`Preview ${child.pid} exited (${child.signalCode??child.exitCode})`));
   child.once('error',reject);child.once('exit',exited);
   if(child.exitCode!==null||child.signalCode!==null)exited();
  }
 });
 // Shutdown after a successful run also exits previews, when no gate is awaiting it.
 failure.catch(()=>{});
 return failure;
}

export async function runPreviewGate(args,{failure,env=process.env}){
 const child=spawn(process.execPath,args,{stdio:'inherit',env});
 const completed=new Promise((resolve,reject)=>{
  child.once('error',reject);
  child.once('exit',(code,signal)=>code===0?resolve():reject(Error(`Browser gate exited (${signal??code}): ${args.join(' ')}`)));
 });
 // Keep the event loop responsive so a crashed preview cannot be masked by a
 // healthy server belonging to another runner on the same machine.
 try{await Promise.race([completed,failure]);}
 finally{if(child.exitCode===null&&child.signalCode===null)child.kill('SIGTERM');await completed.catch(()=>{});}
}
