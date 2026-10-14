import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
import {resolve,extname,sep} from 'node:path';
const root=resolve('fixtures/native/dist');
createServer((req,res)=>{
 const path=resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));
 if(path!==root&&!path.startsWith(root+sep)){res.writeHead(403).end();return;}
 try{const file=path===root?resolve(root,'index.html'):path;const bytes=readFileSync(file);res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.ttf':'font/ttf','.json':'application/json','.png':'image/png'})[extname(file)]??'application/octet-stream');res.end(bytes);}catch{res.writeHead(404).end();}
}).listen(Number(process.env.HIG_EXPO_PORT??4176),'127.0.0.1');
