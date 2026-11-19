/** Native LoginBlock: the provider rows, the optional analytics row, the legal links and the hooks a host sheet needs. */
const React=require('react');
const {create,act}=require('react-test-renderer');
const {Linking}=require('react-native');
const {HIGProvider}=require('../../packages/hig/native/src/provider');
const {LoginBlock}=require('../../packages/hig/native/src/login-block');
const h=React.createElement;
let root;
const base={onLogin:()=>{},onClose:()=>{},testID:'login'};
function mount(props){if(root)act(()=>root.unmount());act(()=>{root=create(h(HIGProvider,null,h(LoginBlock,{...base,...props})));});return root.root;}
const host=(tree,testID)=>tree.findAll(node=>node.props.testID===testID&&typeof node.type==='string')[0];
const has=(tree,testID)=>tree.findAll(node=>node.props.testID===testID).length>0;
const off=node=>!!node.props.accessibilityState?.disabled;
afterEach(()=>{if(root)act(()=>root.unmount());root=undefined;jest.restoreAllMocks();});

it('names its parts from one test ID prefix and sets none without it',()=>{
 let tree=mount({analyticsEnabled:true,onAnalyticsChange:()=>{}});
 for(const id of ['login-header','login-title','login-close','login-twitter','login-apple','login-google','login-analytics-row','login-analytics','login-analytics-info','login-terms','login-privacy'])expect([id,has(tree,id)]).toEqual([id,true]);
 tree=mount({testID:undefined,analyticsEnabled:true,onAnalyticsChange:()=>{}});
 expect(tree.findAll(node=>typeof node.props.testID==='string'&&node.props.testID.startsWith('login'))).toHaveLength(0);
});

it('disables only the providers whose sign-in is in flight, and every row while the host is not ready',()=>{
 const onLogin=jest.fn();let tree=mount({onLogin,pending:['apple']});
 expect(['twitter','apple','google'].map(provider=>off(host(tree,`login-${provider}`)))).toEqual([false,true,false]);
 act(()=>host(tree,'login-apple').props.onClick?.());act(()=>host(tree,'login-google').props.onClick());
 expect(onLogin.mock.calls).toEqual([['google']]);
 tree=mount({disabled:true});
 expect(['twitter','apple','google'].map(provider=>off(host(tree,`login-${provider}`)))).toEqual([true,true,true]);
});

it('leaves the analytics row out for a host with nothing to consent to, and draws it unavailable while consent loads',()=>{
 let tree=mount({});
 expect(has(tree,'login-analytics-row')).toBe(false);expect(has(tree,'login-analytics')).toBe(false);expect(has(tree,'login-terms')).toBe(true);
 const onAnalyticsChange=jest.fn();tree=mount({analyticsEnabled:false,onAnalyticsChange,analyticsDisabled:true});
 expect(off(host(tree,'login-analytics'))).toBe(true);
 tree=mount({analyticsEnabled:false,onAnalyticsChange});
 expect(off(host(tree,'login-analytics'))).toBe(false);
 act(()=>host(tree,'login-analytics').props.onClick());expect(onAnalyticsChange).toHaveBeenCalledWith(true);
});

it('hands Terms and Privacy to the host when it opens links its own way, and opens the URL otherwise',()=>{
 const open=jest.spyOn(Linking,'openURL').mockResolvedValue(undefined),onOpenLink=jest.fn();
 let tree=mount({onOpenLink,termsUrl:'https://example.test/terms',privacyUrl:'https://example.test/privacy'});
 act(()=>host(tree,'login-terms').props.onClick());act(()=>host(tree,'login-privacy').props.onClick());
 expect(onOpenLink.mock.calls).toEqual([['https://example.test/terms','terms'],['https://example.test/privacy','privacy']]);expect(open).not.toHaveBeenCalled();
 tree=mount({termsUrl:'https://example.test/terms'});
 act(()=>host(tree,'login-terms').props.onClick());expect(open).toHaveBeenCalledWith('https://example.test/terms');
});

it('gives a host sheet the heading to focus and reads its hint after the title',()=>{
 const titleRef=React.createRef();const tree=mount({titleRef,headingHint:'Choose how to sign in'});
 expect(titleRef.current).not.toBeNull();
 expect(tree.findAll(node=>node.props.accessibilityRole==='header'&&node.props.accessibilityHint==='Choose how to sign in').length).toBeGreaterThan(0);
});
