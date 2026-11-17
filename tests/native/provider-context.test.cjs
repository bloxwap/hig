/** Native HIGProvider: one context value for as long as nothing in it changes, so a provider that renders again re-renders no reader. */
const React=require('react');
const {create,act}=require('react-test-renderer');
const {HIGProvider,useHIG,useColors}=require('../../packages/hig/native/src/provider');
const {Text}=require('../../packages/hig/native/src/surface');
const h=React.createElement;
let root;
afterEach(()=>{if(root)act(()=>root.unmount());root=null;});
it('a provider that renders again with the same props re-renders no reader of the context or the colours',()=>{
 let reads=0,bump,setLocale;const seen=[];
 const Reader=React.memo(function Reader(){const value=useHIG();useColors();reads++;seen.push(value);return h(Text,null,value.locale);});
 const families={400:'Sans',600:'SansBold'},messages={close:'Fermer'};
 function Host(){const [,setTick]=React.useState(0),[locale,set]=React.useState('en-US');bump=()=>setTick(tick=>tick+1);setLocale=set;return h(HIGProvider,{locale,reducedMotion:true,fontFamily:'Sans',fontFamilies:families,messages},h(Reader));}
 act(()=>{root=create(h(Host));});
 const settled=reads;
 for(let turn=0;turn<5;turn++)act(()=>bump());
 expect(reads).toBe(settled);expect(new Set(seen.slice(settled-1)).size).toBe(1);
 act(()=>setLocale('fr-FR'));expect(reads).toBe(settled+1);expect(seen.at(-1).locale).toBe('fr-FR');
});
