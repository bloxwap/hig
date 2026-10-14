import {createServer} from 'node:http';
import {readFileSync,existsSync,statSync} from 'node:fs';
import {resolve,extname} from 'node:path';
const root=resolve('apps/docs/dist');const base=process.env.NEXT_PUBLIC_BASE_PATH??'/hig';
createServer((req,res)=>{const url=new URL(req.url,'http://localhost');if(!url.pathname.startsWith(base+'/')){res.writeHead(404).end();return;}let path=resolve(root,'.'+decodeURIComponent(url.pathname.slice(base.length)));if(path!==root&&!path.startsWith(root+'/')){res.writeHead(404).end();return;}if(existsSync(path)&&statSync(path).isDirectory())path+='/index.html';if(!existsSync(path)){res.writeHead(404).end();return;}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.txt':'text/plain','.svg':'image/svg+xml','.xml':'application/xml'})[extname(path)]??'application/octet-stream');res.end(readFileSync(path));}).listen(4174,'127.0.0.1');
