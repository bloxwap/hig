# Navigation

Tabs, disclosure, search, and navigation that keep the current location clear.

Includes `Tabs`, `Accordion`, `Pagination`, `Navigation`, `Search`, `ListGroup`, and `ListRow`. `Breadcrumb` is web-only; native alternatives include `BackButton` and `BottomNavigation`.

Issue #17. Entry: `navigation`. Import platform entries from `@bloxwap/hig/react/navigation` or `@bloxwap/hig/native/navigation` according to applicability below. Import `@bloxwap/hig/react/css` once on web; tokens CSS is a separate explicit import.

## API and anatomy

| Component | Key props and behavior |
| --- | --- |
| `Tabs` | `label`, `items`, `value`, `defaultValue`, and `onValueChange`. Items include panel content and optional `disabled`. The selected tab is a raised neutral capsule with `text`; the others are bare `muted` labels. Tabs never use the action colour, which stays with the primary action. |
| `Navigation` | Web links use `href`; native destinations use host callbacks. |
| `Search` | `query`, `results`, `loading`, and `error`. The host supplies the search index and router. |
| `ListGroup`, `ListRow` | A grouped list for menus and settings: an optional `title` over rows in one rounded container. Details below. |

### ListGroup and ListRow

`ListGroup` is a section of a menu or settings screen: an optional `title` above rows that share one rounded container, 2 units apart. `ListRow` is one row: the `label` leads, and a `value`, icons, a badge or a control trail. They are available from `@bloxwap/hig/react/list-group` and `@bloxwap/hig/native/list-group`.

```tsx
import {ListGroup, ListRow} from '@bloxwap/hig/react/list-group';

<ListGroup title="Settings">
  <ListRow label="Live Mode" trailing={<Switch label="Live Mode" checked={live} onCheckedChange={setLive}/>}/>
  <ListRow label="Notifications" value="Off" onSelect={openNotifications}/>
  <ListRow label="Language" value="English" onSelect={openLanguage}/>
</ListGroup>
```

- **Rows that open a view.** `onSelect` makes the whole row one button and shows the disclosure chevron on the trailing edge. On web `href` makes it a link instead. The chevron mirrors in right-to-left layouts.
- **Rows that hold a control.** A row without `onSelect` or `href` is static, so a control in `trailing`, such as a `Switch`, is its only target. On web a `Switch` in `trailing` keeps its label for assistive technology and hides it visually, because the row already shows it.
- **Trailing content.** `value` is short muted text such as `Off`, `English` or a balance. `trailing` takes anything richer: icons, a `Badge`, or a control. Both can be used together; the value comes first. A `value` can also be an element, such as a live `AnimatedNumberReadout`; on native give it `valueLabel`, the text it reads as, so a selectable row still reads its label and value.
- **Leading content.** `leading` is decorative artwork before the label, such as an icon.
- **Disabled.** `disabled` dims the row and blocks `onSelect` and `href`.
- **Anatomy.** Rows are 56 units high with 20 units of inline padding. The group has a 20-unit radius; the first and last rows take its corners. A group without a `title` is the container alone. Stack groups 24 units apart: that gap is what separates one group from the next, where rows inside a group are 2 apart.
- **Accessibility.** With a `title` the group is a region named by it, and its rows are a list. A selectable row is one button named by its label and value. The chevron and `leading` are decorative.

## When to use and examples

Do: expose current location and keep deep-link ownership with host. Don’t: replace native back with a browser history dependency.

## States, interaction and accessibility

Tabs use selected states and one active panel; DOM Arrow/Home/End keys, RTL-aware arrow mapping. Only the selected tab is in the Tab order. The active DOM panel is a tab stop only when its first content is not focusable. When the panel starts with a focusable element, such as the `InstallCommand` `pre`, that element is the single stop after the tab list. Panels that start with text keep `tabIndex=0` so their content stays reachable. Server and hydration markup render every panel with `tabIndex=0`; on the client a layout effect corrects the shown panel before paint, in the same commit that shows it, so a panel that starts with a focusable element is never an extra stop after a tab switch. Accordion uses details/summary on DOM and expanded Pressable on RN. Search results are visible action lists; keyboard shortcuts belong to host.

State review: rest; keyboard focus/hover (DOM); accepted press and release/cancel; selected/checked where applicable; disabled; busy; inline error/recovery; empty/loading; long translations/large text; reduced motion; sound and haptics disabled. No host action occurs on mere focus. Disabled/busy targets suppress accepted activation. Core has no required feedback backend; the optional provider callback follows the action, honors cancellation and isolates errors.

## Platform mapping and limits

Breadcrumb is DOM-specific; native host routes plus BackButton are supported alternatives. No fuzzy-search engine, command palette shortcut hijacking or native hardware-keyboard certification.

## Validation and citation

See `tests/components.dom.test.tsx`, `tests/native/components.test.cjs`, consumer fixtures and milestone evidence. Physical hardware, assistive-technology and baseline product comparisons are unperformed unless linked explicitly. Cite HIG 0.1.0 with this chapter anchor and a commit permalink, not a mutable preview branch. Preserve business behavior behind a host rollback flag during adoption.
