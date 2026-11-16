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
| `ListGroup`, `ListRow` | A grouped list for menus and settings: an optional `title` (with `titleAccessory`, `action` and `intro`) over rows in one rounded container. Rows take `description`, `tone`, `selected`, `busy`, `disclosure`, a whole-row switch (`checked` / `onCheckedChange`) and a ref. Details below. |

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
- **Rows that hold a control.** A row without `onSelect` or `href` is static, so a control in `trailing`, such as a `Switch`, is its only target. On web a `Switch` in `trailing` keeps its label for assistive technology and hides it visually, because the row already shows it; on native pass the `Switch` `hideLabel` so its label is not drawn twice. For a switch the whole row toggles, use the switch row below.
- **Trailing content.** `value` is short muted text such as `Off`, `English` or a balance. `trailing` takes anything richer: icons, a `Badge`, or a control. Both can be used together; the value comes first. `valueTone` (`positive`, `warning`, `negative` or `muted`) colours a text `value` instead of the muted default, keeping its layout and reading.
- **Live values.** A `value` can also be an element, such as a live `AnimatedNumberReadout`. Give it `valueLabel`, the text it reads as, so assistive technology reads the settled figure rather than its moving digits: a selectable row on native is read as its label and `valueLabel`, a static row on native reads the element as one node named by `valueLabel`, and on web the element is hidden from assistive technology and `valueLabel` is read in its place.
- **Leading content.** `leading` is decorative artwork before the label, such as an icon.
- **Description.** `description` draws a muted second line under the label (14/20), such as `Instant card deposit` or an address, and the row grows to fit it. It is read with the label: in a selectable row's name, and as the hint (web: `aria-describedby`) of a switch row.
- **Label tone.** `tone='destructive'` paints the label in the negative role, for a row such as Delete account; `tone='muted'` paints it muted, for a task that is done. The words still carry the meaning.
- **Choices.** `selected` turns a row into one choice of a list that selects and closes, such as a signing account or an avatar: `true` draws a check on the trailing edge in place of the chevron and marks the row (`aria-current` on web, `accessibilityState.selected` on native). With `selected` set, true or false, the row draws no chevron unless `disclosure` asks for one, so the unselected rows of the list stay bare.
- **Busy.** `busy` puts a spinner where the disclosure was, marks the row busy (`aria-busy`, `accessibilityState.busy`), adds HIGProvider `messages.busy` (or `busyLabel`; `''` omits it) to a selectable row's name as `Button` does, and ignores presses. The row is not dimmed and keeps its focus.
- **Disclosure.** `disclosure` picks the glyph of a row with `onSelect` or `href`: `chevron` (the default), `external` (an arrow pointing up and away, for something that opens outside the app; it mirrors in right-to-left layouts like the chevron) or `none`. The glyph is decorative, so a row that leaves the app says so in its label when that matters.
- **Switch rows.** `checked` (or `defaultChecked`) with `onCheckedChange`, and no `onSelect` or `href`, makes the whole row a switch: a press anywhere on it toggles the switch drawn on the trailing edge, the switch is named by `label`, and `disabled` or `busy` stop it. On web the switch input stays the one named control for keyboard and assistive technology, named by the row's visible label through `aria-labelledby`, so the name is drawn and read once (Unreleased: the switch's own label no longer carries a second, visually hidden copy, which screen readers read as text after the switch); the host's press decoration covers the row as one `'switch'` layer. On native the row is one 48dp switch element. A static row with a `Switch` in `trailing` still works as before.
- **Numbers in a value.** A number readout in `value` (`Usd`, `NumberReadout`, `AnimatedNumberReadout`) is drawn in the row's interface face with tabular digits, not the mono face, so it matches the row's text values (web: `.hig-list-row-value .hig-number` inherits the face; native readouts already use the provider face unless the host passes a mono `style`).
- **Ref and pass-through.** The ref reaches the row's element (the button, link or `div` on web; the Pressable or View on native). On web every other attribute, such as `data-*` and `aria-*`, reaches that element. On native the row takes the other Pressable props, such as `android_disableSound`, `hitSlop`, `onLongPress` and `accessibilityHint`, beside `testID`.
- **Disabled.** `disabled` dims the row and blocks `onSelect`, `href` and the switch.
- **Group heading.** `title` may be host text or an element, such as a live count. `titleAccessory` puts host content after it, such as `2/3` or an aggregate figure: it is read with the heading while the group stays named by the title alone (inside the `<h3>` on web; on native the title and accessory are one header element named by both). `action={{label, onSelect, disabled}}` draws a text action, such as Cancel all, on the trailing edge of the heading; it is a button named by its label, 44 units tall on web without growing the heading and at least 48dp each way on native through `minWidth` and `hitSlop`, outside the header element, and takes the `'button'` press decoration on web. `intro` holds host content between the heading and the rows, such as a note or a field; a group with `intro` and no rows draws no row container.
- **Anatomy.** Rows are 56 units high with 20 units of inline padding. The group has a 20-unit radius; the first and last rows take its corners. A group without a `title` is the container alone. Stack groups 24 units apart: that gap is what separates one group from the next, where rows inside a group are 2 apart.
- **Accessibility.** With a `title` the group is a region named by it, and its rows are a list. A selectable row is one button named by its label, description and value. The chevron, check, spinner, external arrow and `leading` are decorative; selected and busy are exposed as states. A static native row with `selected` or `busy` is one element named by its label and value so the state is read, unless it has `trailing` content, which stays its own target (the state is then not announced on the row). A busy linked row on web stays the same `<a>` (`aria-disabled`, not navigating), so focus stays on it.

## When to use and examples

Do: expose current location and keep deep-link ownership with host. Don’t: replace native back with a browser history dependency.

## States, interaction and accessibility

Tabs use selected states and one active panel; DOM Arrow/Home/End keys, RTL-aware arrow mapping. Only the selected tab is in the Tab order. The active DOM panel is a tab stop only when its first content is not focusable. When the panel starts with a focusable element, such as the `InstallCommand` `pre`, that element is the single stop after the tab list. Panels that start with text keep `tabIndex=0` so their content stays reachable. Server and hydration markup render every panel with `tabIndex=0`; on the client a layout effect corrects the shown panel before paint, in the same commit that shows it, so a panel that starts with a focusable element is never an extra stop after a tab switch. Accordion uses details/summary on DOM and expanded Pressable on RN. Search results are visible action lists; keyboard shortcuts belong to host.

State review: rest; keyboard focus/hover (DOM); accepted press and release/cancel; selected/checked where applicable; disabled; busy; inline error/recovery; empty/loading; long translations/large text; reduced motion; sound and haptics disabled. No host action occurs on mere focus. Disabled/busy targets suppress accepted activation. Core has no required feedback backend; the optional provider callback follows the action, honors cancellation and isolates errors.

## Platform mapping and limits

Breadcrumb is DOM-specific; native host routes plus BackButton are supported alternatives. No fuzzy-search engine, command palette shortcut hijacking or native hardware-keyboard certification.

## Validation and citation

See `tests/components.dom.test.tsx`, `tests/native/components.test.cjs`, consumer fixtures and milestone evidence. Physical hardware, assistive-technology and baseline product comparisons are unperformed unless linked explicitly. Cite HIG 0.1.0 with this chapter anchor and a commit permalink, not a mutable preview branch. Preserve business behavior behind a host rollback flag during adoption.
