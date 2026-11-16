/** Native BarPnl: a position's profit or loss as one bar with its prices in price order. */
const React=require('react');
const {create:render,act}=require('react-test-renderer');
const {StyleSheet}=require('react-native');
const {nativeSrgb:colors}=require('@bloxwap/hig/tokens');
const {HIGProvider}=require('../../packages/hig/native/src/provider');
const {BarPnl,barPnlLayout}=require('../../packages/hig/native/src/bar-pnl');
const h=React.createElement;
let root;
const labels={liquidation:'Liquidation',mark:'Mark',entry:'Entry'};
function mount(props){if(root)act(()=>root.unmount());act(()=>{root=render(h(HIGProvider,{},h(BarPnl,{labels,testID:'pnl',...props})));});return root.root;}
const flat=node=>StyleSheet.flatten(node.props.style)??{};
const host=(tree,testID)=>tree.findAll(node=>node.props.testID===testID&&typeof node.type==='string')[0];
const readings=tree=>tree.findAll(node=>typeof node.type==='string'&&/^pnl-(liquidation|mark|entry)$/.test(node.props.testID??'')).map(node=>node.props.accessibilityLabel);
afterEach(()=>{if(root)act(()=>root.unmount());root=undefined;});

it('lays out the same positions, order and result as web',()=>{
 expect(barPnlLayout({entry:100,mark:105,liquidation:80})).toEqual({side:'long',result:'profit',positions:{entry:0.5,mark:0.625,liquidation:0},order:['liquidation','entry','mark']});
 expect(barPnlLayout({entry:100,mark:90,liquidation:120})).toEqual({side:'short',result:'profit',positions:{entry:0.5,mark:0.25,liquidation:1},order:['mark','entry','liquidation']});
 expect(barPnlLayout({entry:100,mark:105})).toEqual({side:'long',result:'profit',positions:{entry:0.5,mark:0.75},order:['entry','mark']});
 expect(barPnlLayout({entry:100,mark:null,liquidation:80}).result).toBe('flat');
});
it('fit scales the bar to the prices themselves, so the move fills it',()=>{
 expect(barPnlLayout({entry:267.6,mark:267.18,side:'short',fit:true})).toEqual({side:'short',result:'profit',positions:{entry:1,mark:0},order:['mark','entry']});
 expect(barPnlLayout({entry:100,mark:110,liquidation:80,fit:true}).positions).toEqual({liquidation:0,entry:2/3,mark:1});
 expect(barPnlLayout({entry:100,mark:100,fit:true}).positions).toEqual({entry:0.5,mark:0.5});
});
it('reads each price with its host label in price order, and swaps mark and entry at a loss',()=>{
 let tree=mount({entry:64700,mark:66000,liquidation:58800});
 expect(readings(tree)).toEqual(['Liquidation, $58,800.00','Entry, $64,700.00','Mark, $66,000.00']);
 tree=mount({entry:64700,mark:64450,liquidation:63000});
 expect(readings(tree)).toEqual(['Liquidation, $63,000.00','Mark, $64,450.00','Entry, $64,700.00']);
 tree=mount({entry:142.96,mark:149.1});expect(readings(tree)).toEqual(['Entry, $142.96','Mark, $149.10']);expect(host(tree,'pnl-liquidation-tick')).toBeUndefined();
});
it('fills the stretch between entry and mark in the result tone at the bar fill strength, with the mark tick in that tone and the entry tick in text',()=>{
 let tree=mount({entry:100,mark:105,liquidation:80});
 expect(flat(host(tree,'pnl-move'))).toMatchObject({flexGrow:0.125,borderStartColor:colors.text,borderEndColor:colors.positive});expect(flat(host(tree,'pnl-fill'))).toMatchObject({backgroundColor:colors.positive,opacity:0.5});
 expect(flat(host(tree,'pnl-liquidation-tick'))).toMatchObject({start:'0%',marginStart:0,backgroundColor:colors.negative});
 tree=mount({entry:100,mark:90,liquidation:80});
 expect(flat(host(tree,'pnl-move'))).toMatchObject({flexGrow:0.25,borderStartColor:colors.negative,borderEndColor:colors.text});expect(flat(host(tree,'pnl-fill'))).toMatchObject({backgroundColor:colors.negative,opacity:0.5});
 tree=mount({entry:100,mark:100,liquidation:120});
 expect(flat(host(tree,'pnl-move'))).toMatchObject({flexGrow:0,minWidth:6});expect(flat(host(tree,'pnl-fill'))).toMatchObject({backgroundColor:colors.muted,opacity:0.5});expect(flat(host(tree,'pnl-liquidation-tick'))).toMatchObject({start:'100%',marginStart:-3});
 expect(host(tree,'pnl-bar').props.importantForAccessibility).toBe('no-hide-descendants');
});
it('draws no card with surface={false}: a plain view with the same gap and no surface fill or padding',()=>{
 let tree=mount({entry:100,mark:105,liquidation:80});
 expect(flat(host(tree,'pnl'))).toMatchObject({backgroundColor:colors.surface,gap:12});
 tree=mount({entry:100,mark:105,liquidation:80,surface:false});
 const bare=flat(host(tree,'pnl'));expect(bare.gap).toBe(12);expect(bare.backgroundColor).toBeUndefined();expect(bare.padding).toBeUndefined();expect(bare.borderRadius).toBeUndefined();
 expect(readings(tree)).toHaveLength(3);expect(flat(host(tree,'pnl-bar').children[0]).backgroundColor).toBe(colors.nested);
});
it('shortens the prices with compact, keeping the host currency',()=>{
 let tree=mount({compact:true,entry:64700,mark:64450.5,liquidation:63000});
 expect(readings(tree)).toEqual(['Liquidation, $63,000','Mark, $64,451','Entry, $64,700']);
 tree=mount({compact:true,entry:0.482137,mark:149.1,priceOptions:{style:'currency',currency:'EUR'}});
 expect(readings(tree)).toEqual(['Entry, €0.4821','Mark, €149.1']);
});
