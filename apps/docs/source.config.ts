import {defineConfig,defineDocs} from 'fumadocs-mdx/config';
import {rehypeCodeDefaultOptions} from 'fumadocs-core/mdx-plugins/rehype-code';

import type {Element,Root} from 'hast';
import {toHtml} from 'hast-util-to-html';
import {visit} from 'unist-util-visit';

export const docs=defineDocs({dir:'content/docs'});

function normalizeStyle(style:string){
  return style.replace(/\s/g,'').replace(/;$/,'').toLowerCase();
}

// Share the common light/dark pairs across examples. Custom token styles stay inline.
const tokenClasses=new Map([
  ['--shiki-light:#d73a49;--shiki-dark:#f97583','syntax-keyword'],
  ['--shiki-light:#6f42c1;--shiki-dark:#b392f0','syntax-property'],
  ['--shiki-light:#e36209;--shiki-dark:#ffab70','syntax-symbol'],
  ['--shiki-light:#005cc5;--shiki-dark:#79b8ff','syntax-value'],
  ['--shiki-light:#032f62;--shiki-dark:#9ecbff','syntax-string'],
]);

// Only serialize code created by the highlighter. The HTML serializer escapes example text.
const highlightedBlocks=new WeakSet<Element>();
const codeLineCounts=new WeakMap<Element,number>();
function staticElement(name:string,children:Element['children']):Element['children'][number]{
  const html=toHtml(children);
  return {
    type:'mdxJsxFlowElement',name,children:[],
    attributes:[{
      type:'mdxJsxAttribute',name:'dangerouslySetInnerHTML',
      value:{
        type:'mdxJsxAttributeValueExpression',value:`({__html:${JSON.stringify(html)}})`,
        data:{estree:{type:'Program',sourceType:'module',body:[{
          type:'ExpressionStatement',expression:{type:'ObjectExpression',properties:[{
            type:'Property',kind:'init',computed:false,method:false,shorthand:false,
            key:{type:'Identifier',name:'__html'},value:{type:'Literal',value:html},
          }]},
        }]}},
      },
    }],
  };
}

const staticTableTags=new Set(['tr','th','td','code','strong','em','del','br']);
function staticTableChild(child:Element['children'][number]):boolean{
  return child.type==='text'||(child.type==='element'&&staticTableTags.has(child.tagName)
    &&Object.keys(child.properties).length===0&&child.children.every(staticTableChild));
}

function staticGuideMarkup(){
  return (tree:Root,file:{path?:string})=>{
    const guide=/(?:^|[/\\])guides[/\\]/.test(file.path??'');
    visit(tree,'element',block=>{
      if(block.tagName==='table'){
        for(const [index,section] of block.children.entries()){
          if(section.type!=='element'||section.tagName!=='tbody'||Object.keys(section.properties).length)continue;
          const rows=section.children.filter((row):row is Element=>row.type==='element'&&row.tagName==='tr');
          // Small tables compress well as Flight records. Keep the compact markup for long reference tables.
          if(rows.length<20||!section.children.every(child=>child.type==='text'?child.value.trim()==='':child.type==='element'&&child.tagName==='tr'&&staticTableChild(child)))continue;
          const compact=rows.map(row=>({...row,children:row.children.filter(child=>child.type!=='text'||child.value.trim()!=='')}));
          block.children[index]=staticElement('tbody',compact);
        }
      }
      if(!highlightedBlocks.has(block))return;
      const lines=guide&&codeLineCounts.get(block);
      if(lines)block.properties.style+=`;--guide-code-lines:${lines}`;
      const code=block.children[0];
      if(code?.type==='element'&&code.tagName==='code'&&Object.keys(code.properties).length===0){
        block.children[0]=staticElement('code',code.children);
      }
    });
  };
}

export default defineConfig({mdxOptions:{rehypePlugins:[staticGuideMarkup],rehypeCodeOptions:{
  ...rehypeCodeDefaultOptions,
  transformers:[...rehypeCodeDefaultOptions.transformers??[],{
    name:'inherit-default-token-colors',
    pre(block){
      highlightedBlocks.add(block);
      if(typeof block.properties.style!=='string')return;
      const colors=block.properties.style.match(/--shiki-(?:light|dark):\s*#[\da-f]+(?=\s*(?:;|$))/gi);
      if(colors?.length!==2)return;
      const inherited=normalizeStyle(colors.join(';'));
      // Plain, unwrapped Shiki lines each occupy one line box, including empty lines.
      if(this.lines.length&&this.lines.every(line=>Object.keys(line.properties).length===1
        &&line.properties.class==='line')){
        codeLineCounts.set(block,this.lines.length);
      }
      for(const line of this.lines){
        if(line.properties.style)continue;
        // Keep annotations and styled tokens. Ordinary text inherits both theme colors from the line.
        line.children=line.children.flatMap(token=>{
          if(token.type!=='element'||token.tagName!=='span'||Object.keys(token.properties).length!==1)return [token];
          const style=token.properties.style;
          if(typeof style!=='string')return [token];
          const normalized=normalizeStyle(style);
          if(normalized===inherited&&token.children.every(child=>child.type==='text'))return token.children;
          const className=tokenClasses.get(normalized);
          if(className)token.properties={className:[className]};
          return [token];
        });
      }
    },
  }],
}}});
