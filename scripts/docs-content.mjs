import {readdirSync} from 'node:fs';
import {unified} from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import {remarkHeading} from 'fumadocs-core/mdx-plugins';
import GithubSlugger from 'github-slugger';

export const markdownFiles=(dir='docs')=>readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?markdownFiles(`${dir}/${e.name}`):e.name.endsWith('.md')?[`${dir}/${e.name}`]:[]).sort();
export const guideRoute=file=>`/docs/guides/${file.slice(5,-3)}/`;
export const chapterBody=markdown=>markdown.replace(/^# .+\r?\n/,'');
const parse=markdown=>unified().use(remarkParse).use(remarkGfm).parse(markdown);
function walk(node,fn){fn(node);for(const child of node.children??[])walk(child,fn);}
export function headings(markdown){
 const tree=parse(chapterBody(markdown));const file={data:{}};const slugger=new GithubSlugger();
 remarkHeading({slug:(_root,_heading,text)=>slugger.slug(text)})(tree,file);
 return file.data.toc.map(h=>({label:h.title,id:h.url.slice(1),depth:h.depth}));
}
// Preserve authored Markdown bytes except link destinations (including reference definitions).
export function rewriteLinks(markdown,source,base=''){
 const edits=[];
 walk(parse(markdown),node=>{
  if(['link','definition'].includes(node.type)&&node.url.startsWith('/')&&!node.url.startsWith('//')){
   const start=node.position.start.offset,end=node.position.end.offset;const offset=markdown.slice(start,end).lastIndexOf(node.url);
   edits.push({start:start+offset,end:start+offset+node.url.length,destination:base+node.url});return;
  }
  if(!['link','definition'].includes(node.type)||/^(?:[a-z][\w+.-]*:|\/|#)/i.test(node.url))return;
  const url=new URL(node.url,`https://docs.invalid/${source}`);
  const target=decodeURIComponent(url.pathname.slice(1));let destination;
  if(target.startsWith('docs/')&&target.endsWith('.md'))destination=`${base}${guideRoute(target)}${url.search}${url.hash}`;
  else throw new Error(`${source}: relative link has no docs route: ${node.url}; use an explicit site or repository URL`);
  const start=node.position.start.offset,end=node.position.end.offset;
  const offset=markdown.slice(start,end).lastIndexOf(node.url);
  if(offset<0)throw new Error(`${source}: cannot rewrite ${node.url}`);
  edits.push({start:start+offset,end:start+offset+node.url.length,destination});
 });
 for(const edit of edits.sort((a,b)=>b.start-a.start))markdown=markdown.slice(0,edit.start)+edit.destination+markdown.slice(edit.end);
 return markdown;
}
