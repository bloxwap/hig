interface LanguageText {code:string;name:string;description?:string}
const foldedText=new WeakMap<LanguageText,{code:string;name:string;description?:string;text:string}>();
const fold=(text:string)=>text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();

/** Match names, descriptions and codes in host order, ignoring case and accents. */
export function filterLanguages<T extends LanguageText>(languages:readonly T[],query:string):T[]{
 const needle=fold(query.trim());
 if(!needle)return [...languages];
 return languages.filter(language=>{
  const {name,description,code}=language;
  let cached=foldedText.get(language);
  if(!cached||cached.name!==name||cached.description!==description||cached.code!==code){
   cached={name,description,code,text:fold(`${name} ${description??''} ${code}`)};
   foldedText.set(language,cached);
  }
  return cached.text.includes(needle);
 });
}
