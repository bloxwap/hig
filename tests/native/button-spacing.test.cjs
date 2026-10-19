const React=require('react');
const {create,act}=require('react-test-renderer');
const {Text:RNText,Platform}=require('react-native');
const {Button,busyAccessibilityLabel}=require('../../packages/native/src/button');
const h=React.createElement;
let root;
afterEach(()=>{if(root)act(()=>root.unmount());root=null;});
it('uses the row gap alone before the busy suffix while keeping a spaced accessible name (#121)',()=>{
 act(()=>{root=create(h(Button,{busy:true},'Log ','out'));});
 const runs=root.root.findAllByType(RNText);
 expect(runs.map(node=>React.Children.toArray(node.props.children).join(''))).toEqual(['Log out','· Working']);
 expect(busyAccessibilityLabel('Log out','Working','ios')).toBe('Log out · Working');
 expect(busyAccessibilityLabel('로그아웃','처리 중','android')).toBe('로그아웃');
 const control=root.root.findAll(node=>node.props.accessibilityRole==='button')[0];
 expect(control.props.accessibilityLabel).toBe(Platform.OS==='android'?'Log out':'Log out · Working');
 act(()=>root.update(h(Button,{busy:true,busyLabel:'',accessibilityLabel:'Host name'},'Log out')));
 expect(root.root.findAllByType(RNText)).toHaveLength(1);
 expect(root.root.findAll(node=>node.props.accessibilityRole==='button')[0].props.accessibilityLabel).toBe('Host name');
});
