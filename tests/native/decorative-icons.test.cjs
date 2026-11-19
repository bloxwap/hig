const React = require('react');
const {act, create} = require('react-test-renderer');
const RN = require('react-native');
const {Alert, InlineNotice} = require('../../packages/hig/native/src/status');

it("hides a notice's decorative severity icon from assistive technology on every platform", () => {
  const notices = [
    React.createElement(Alert, {title: 'Result', announce: false}, 'Saved'),
    React.createElement(InlineNotice, {title: 'Transfer timing', description: 'Bank transfers usually arrive within three business days.'}),
  ];
  for (const notice of notices) {
    let tree;
    act(() => { tree = create(notice); });
    try {
      const hidden = tree.root.findAll(node => node.type === RN.View && node.props.accessibilityElementsHidden === true);
      expect(hidden.length).toBeGreaterThan(0);
      for (const wrapper of hidden) {
        // iOS reads the first prop and Android the second. react-native-web reads neither, only aria-hidden; without it the
        // icon's <img> has no text alternative and fails WCAG 1.1.1 in a browser.
        expect(wrapper.props.importantForAccessibility).toBe('no-hide-descendants');
        expect(wrapper.props['aria-hidden']).toBe(true);
      }
    } finally { act(() => tree.unmount()); }
  }
});
