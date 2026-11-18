/** Native LanguageBlock: a header, a search field and each language as a radio row. */

const React=require('react');
const {create:render,act}=require('react-test-renderer');
const {TextInput,View,ScrollView}=require('react-native');
// The Jest scroll-view stub omits the orientation context published by the native component.
const NativeScrollView=jest.requireActual('react-native/Libraries/Components/ScrollView/ScrollView').default;
ScrollView.Context=NativeScrollView.Context;
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

it.each(['standalone','sticky','host'])('windows long %s language lists and selects the filtered original option',mode=>{
 const {FlatList,VirtualizedList,TextInput}=require('react-native');
 const options=Array.from({length:250},(_,i)=>({code:'en-x-'+i,name:'Language '+i}));
 const choose=jest.fn(),tree=mount({languages:options,stickyHeader:mode==='sticky',listComponent:mode==='host'?FlatList:undefined,onSelect:choose});
 if(mode!=='host'){
  const list=tree.findByType(VirtualizedList);
  expect(list.props.data).toBe(options);
  expect(radios(tree)).toHaveLength(list.props.initialNumToRender-1);
  expect(list.props.getItem(options,0)).toBeNull();
  expect(list.props.getItem(options,250)).toBe(options[249]);
 }else expect(tree.findByType(FlatList).props.data[0]).toBeNull();
 expect(has(tree,'lang-en-x-0')).toBe(true);expect(has(tree,'lang-en-x-249')).toBe(false);
 const mounted=tree.findAll(node=>typeof node.type==='string'&&/^lang-en-x-\d+$/.test(node.props.testID??''));
 expect(mounted.length).toBeLessThan(30);expect(mounted.length).toBeGreaterThan(0);
 jest.useFakeTimers();
 try{
  act(()=>tree.findByType(TextInput).props.onChangeText('Language 2'));
  act(()=>tree.findByType(TextInput).props.onChangeText('Language 249'));
  expect(tree.findByType(TextInput).props.value).toBe('Language 249');
  act(()=>jest.advanceTimersByTime(149));
  expect(has(tree,'lang-en-x-249')).toBe(false);
  act(()=>jest.advanceTimersByTime(1));
 }finally{jest.useRealTimers();}
 const last=radios(tree).find(node=>node.props.testID==='lang-en-x-249');act(()=>last.props.onPress());
 expect(choose.mock.calls[0][0]).toBe(options[249]);
});

it('updates only the two selection marks and keeps the original option for presses',()=>{
 const select=jest.fn(),options=languages;
 const picker=value=>h(LanguageBlock,{languages:options,value,onSelect:select});
 act(()=>{root=render(picker('en'));});
 const before=radios(root.root).map(row=>row.props.onPress);
 act(()=>root.update(picker('es')));
 expect(radios(root.root).map((row,i)=>row.props.onPress!==before[i])).toEqual([true,true,false]);
 const choices=radios(root.root);
 expect(choices.map(item=>item.props.accessibilityState.checked)).toEqual([false,true,false]);
 act(()=>choices[2].props.onPress());
 expect(select.mock.calls[0][0]).toBe(options[2]);
});

it('updates only the visible selection marks in a windowed language list',()=>{
 const options=Array.from({length:250},(_,i)=>({code:'en-x-'+i,name:'Language '+i}));
 const select=jest.fn();
 const scene=value=>h(LanguageBlock,{languages:options,onSelect:select,value,stickyHeader:true});
 act(()=>{root=render(scene(options[0].code));});
 const before=radios(root.root).map(row=>row.props.onPress);
 expect(before.length).toBeLessThan(30);
 act(()=>root.update(scene(options[1].code)));
 expect(radios(root.root).filter((row,i)=>row.props.onPress!==before[i])).toHaveLength(2);
});

it('refreshes the artwork and spoken name of a reused language option',()=>{
 const option={code:'fr',name:'French',description:'Language of France',flag:'/old.svg'},select=jest.fn();
 const scene=()=>h(LanguageBlock,{languages:[option],onSelect:select});
 act(()=>{root=render(scene());});
 Object.assign(option,{name:'Français',description:'French',flag:'/fr.svg'});
 act(()=>root.update(scene()));
 const radio=radios(root.root)[0];
 expect(radio.props.accessibilityLabel).toBe('Français, French');
 expect(root.root.findByType(require('react-native').Image).props.source.uri).toBe('/fr.svg');
 act(()=>radio.props.onPress());expect(select.mock.calls[0][0]).toBe(option);
});

it('keeps the first 50 languages inline and windows the 51st',()=>{
 const {VirtualizedList}=require('react-native');
 const options=Array.from({length:51},(_,i)=>({code:'en-x-'+i,name:'Language '+i}));
 expect(radios(mount({languages:options.slice(0,50)}))).toHaveLength(50);
 const tree=mount({languages:options});
 expect(tree.findByType(VirtualizedList).props.data).toBe(options);
 expect(radios(tree).length).toBeLessThan(30);
});

it('keeps scrolling with the parent when a vertical ScrollView owns a long list',()=>{
 const {VirtualizedList}=require('react-native');
 const options=Array.from({length:51},(_,i)=>({code:'en-x-'+i,name:'Language '+i}));
 act(()=>{root=render(h(HIGProvider,{},h(NativeScrollView,{},h(LanguageBlock,{languages:options,onSelect(){}}))));});
 expect(root.root.findAllByType(VirtualizedList)).toHaveLength(0);
 expect(radios(root.root)).toHaveLength(51);
});

it('sizes the virtual picker from its own layout without a dimension listener',()=>{
 const {Dimensions,VirtualizedList}=require('react-native');
 const subscription=jest.spyOn(Dimensions,'addEventListener');
 try{
  const options=Array.from({length:100},(_,i)=>({code:String(i),name:String(i)}));
  const tree=mount({languages:options,stickyHeader:true,search:false});
  const list=()=>tree.findByType(VirtualizedList).props;
  act(()=>list().onLayout({nativeEvent:{layout:{height:360}}}));
  expect(list().windowSize).toBeCloseTo(1+8*60/360);
  expect(subscription.mock.calls.filter(([event])=>event==='change')).toHaveLength(0);
 }finally{subscription.mockRestore();}
});
