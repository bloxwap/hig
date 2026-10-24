import {it,expect} from 'vitest';
import {createServer} from 'node:net';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
// @ts-expect-error Executable JavaScript port allocator.
import {availablePorts} from '../scripts/preview-ports.mjs';
// @ts-expect-error Executable JavaScript process supervisor.
import {monitorPreviews,runPreviewGate} from '../scripts/preview-process.mjs';

it('allocates distinct preview ports without taking an already occupied port',async()=>{
 const occupied=createServer();occupied.listen(0,'127.0.0.1');await once(occupied,'listening');
 const port=(occupied.address() as {port:number}).port;
 try{
  const ports:number[]=await availablePorts(4);
  expect(new Set(ports).size).toBe(4);
  expect(ports).not.toContain(port);
  for(const candidate of ports){
   const server=createServer();server.listen(candidate,'127.0.0.1');await once(server,'listening');
   await new Promise<void>(resolve=>server.close(()=>resolve()));
  }
 }finally{await new Promise<void>(resolve=>occupied.close(()=>resolve()));}
});

it('fails an active browser gate when its own preview exits',async()=>{
 const preview=spawn(process.execPath,['-e','setTimeout(()=>process.exit(7),100)']);
 const failure=monitorPreviews([preview]);
 await expect(runPreviewGate(['-e','setTimeout(()=>{},10000)'],{failure})).rejects.toThrow(/Preview .* exited \(7\)/);
 expect(preview.exitCode).toBe(7);
});

it('rejects a failing browser gate while its preview is still healthy',async()=>{
 const preview=spawn(process.execPath,['-e','setTimeout(()=>{},10000)']);
 try{
  await expect(runPreviewGate(['-e','process.exit(3)'],{failure:monitorPreviews([preview])})).rejects.toThrow('Browser gate exited (3)');
  expect(preview.exitCode).toBe(null);
 }finally{preview.kill('SIGTERM');await once(preview,'exit');}
});
