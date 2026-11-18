/** Native LanguageBlock: a header, a search field and each language as a radio row. */
const React=require('react');
const {create:render,act}=require('react-test-renderer');
const {TextInput,View}=require('react-native');
const {HIGProvider}=require('../../packages/hig/native/src/provider');
const {LanguageBlock,filterLanguages}=require('../../packages/hig/native/src/language-block');
const h=React.createElement;
let root;
const languages=[{code:'en',name:'English',description:'English'},{code:'es',name:'Español',description:'Spanish'},{code:'fr',name:'Français',description:'French'}];
function mount(props,provider={}){if(root)act(()=>root.unmount());act(()=>{root=render(h(HIGProvider,provider,h(LanguageBlock,{languages,testID:'lang',onSelect(){},...props})));});return root.root;}
const all=(tree,testID)=>tree.findAll(node=>node.props.testID===testID);
const has=(tree,testID)=>all(tree,testID).length>0;
const text=node=>typeof node==='string'?node:node.children.map(text).join('');
const radios=tree=>tree.findAll(node=>node.props.accessibilityRole==='radio'&&node.props.onPress);
afterEach(()=>{if(root)act(()=>root.unmount());root=undefined;});

it('filters like web: name, description and code, ignoring case and accents',()=>{
 expect(filterLanguages(languages,'FRANCAIS').map(l=>l.code)).toEqual(['fr']);expect(filterLanguages(languages,'').map(l=>l.code)).toEqual(['en','es','fr']);expect(filterLanguages(languages,'x')).toEqual([]);
});
it('shows the heading, Back, and each language as a radio that reads both names, checked on the one in use',()=>{
 const select=jest.fn(),back=jest.fn();const tree=mount({value:'es',onSelect:select,onBack:back});
 expect(text(all(tree,'lang-title').find(node=>typeof node.type==='string'))).toBe('Language');
 act(()=>{all(tree,'lang-back').find(node=>node.props.onPress).props.onPress({});});expect(back).toHaveBeenCalledTimes(1);
 expect(radios(tree).map(radio=>[radio.props.accessibilityLabel,radio.props.accessibilityState.checked])).toEqual([['English, English',false],['Español, Spanish',true],['Français, French',false]]);
 expect(all(tree,'lang-check').filter(node=>typeof node.type==='string')).toHaveLength(1);
 expect(tree.findByType(require('@bloxwap/icons/native/check').Check).props.color).toBe(require('@bloxwap/hig/tokens').nativeSrgb.positive);
 act(()=>{radios(tree)[2].props.onPress({});});expect(select).toHaveBeenCalledWith(languages[2]);
});
it('filters from the search field, shows no results, and leaves the field out with search={false}',()=>{
 let tree=mount({});
 const field=tree.findByType(TextInput);expect(field.props.placeholder).toBe('Search languages');
 act(()=>{field.props.onChangeText('span');});expect(radios(tree).map(radio=>radio.props.accessibilityLabel)).toEqual(['Español, Spanish']);
 act(()=>{field.props.onChangeText('klingon');});expect(radios(tree)).toHaveLength(0);expect(text(all(tree,'lang-empty').find(node=>typeof node.type==='string'))).toBe('No results');
 tree=mount({search:false,title:'Idioma',headerAction:h(View,{testID:'close'})});
 expect(tree.findAllByType(TextInput)).toHaveLength(0);expect(has(tree,'close')).toBe(true);expect(text(all(tree,'lang-title').find(node=>typeof node.type==='string'))).toBe('Idioma');
});
it('draws a description under the header, and while disabled dims the rows, reads them unavailable and ignores presses',()=>{
 const select=jest.fn();
 let tree=mount({value:'en',onSelect:select,disabled:true,description:'Choose the language used throughout the app.'});
 expect(text(all(tree,'lang-description').find(node=>typeof node.type==='string'))).toBe('Choose the language used throughout the app.');
 const rows=radios(tree);expect(rows.every(node=>node.props.disabled===true)).toBe(true);expect(rows[0].props.accessibilityState).toEqual({checked:true,disabled:true});
 const flatRow=node=>Object.assign({},...[].concat(node.props.style({pressed:false})));expect(flatRow(rows[1]).opacity).toBe(0.5);
 tree=mount({value:'en',onSelect:select});const enabled=radios(tree);expect(enabled[0].props.accessibilityState).toEqual({checked:true});expect(enabled[1].props.style({pressed:false}).opacity).toBeUndefined();expect(has(tree,'lang-description')).toBe(false);
});
