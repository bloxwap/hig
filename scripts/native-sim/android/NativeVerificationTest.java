package com.bloxwap.hig.gallery;

import android.accessibilityservice.AccessibilityServiceInfo;
import android.app.Instrumentation;
import android.app.UiAutomation;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Rect;
import android.net.Uri;
import android.os.Bundle;
import android.os.SystemClock;
import android.view.InputDevice;
import android.view.MotionEvent;
import android.view.accessibility.AccessibilityNodeInfo;
import android.view.accessibility.AccessibilityWindowInfo;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;

/**
 * Android emulator verification of the packed HIG native gallery. Uses UiAutomation (an
 * accessibility client) to dump node trees, perform accessibility actions and read focus. Results
 * are emulator observations; they are not TalkBack user-flow or physical-device certification.
 */
@RunWith(AndroidJUnit4.class)
public class NativeVerificationTest {
  private static final String PKG = "com.bloxwap.hig.gallery";
  private Instrumentation inst;
  private UiAutomation ua;
  private Context ctx;
  private File out;
  private float density;

  @Before
  public void setUp() throws Exception {
    inst = InstrumentationRegistry.getInstrumentation();
    ua = inst.getUiAutomation(UiAutomation.FLAG_DONT_SUPPRESS_ACCESSIBILITY_SERVICES);
    AccessibilityServiceInfo info = ua.getServiceInfo();
    info.flags |= AccessibilityServiceInfo.FLAG_RETRIEVE_INTERACTIVE_WINDOWS | AccessibilityServiceInfo.FLAG_INCLUDE_NOT_IMPORTANT_VIEWS | AccessibilityServiceInfo.FLAG_REPORT_VIEW_IDS;
    ua.setServiceInfo(info);
    ctx = inst.getTargetContext();
    density = ctx.getResources().getDisplayMetrics().density;
    out = new File(ctx.getExternalFilesDir(null), "native-sim");
    new File(out, "trees").mkdirs();
    new File(out, "captures").mkdirs();
  }

  private String arg(String key, String fallback) {
    Bundle args = InstrumentationRegistry.getArguments();
    String value = args.getString(key);
    return value == null ? fallback : value;
  }

  private void open(String query) {
    Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse("bloxwaphig://gallery?" + query));
    intent.setPackage(PKG);
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    ctx.startActivity(intent);
    settle(900);
  }

  /** Injects a real touch tap (as a finger would) so the IME opens like a user tap. */
  private void tap(int x, int y) {
    long now = SystemClock.uptimeMillis();
    MotionEvent down = MotionEvent.obtain(now, now, MotionEvent.ACTION_DOWN, x, y, 0);
    down.setSource(InputDevice.SOURCE_TOUCHSCREEN);
    ua.injectInputEvent(down, true);
    MotionEvent up = MotionEvent.obtain(now, now + 60, MotionEvent.ACTION_UP, x, y, 0);
    up.setSource(InputDevice.SOURCE_TOUCHSCREEN);
    ua.injectInputEvent(up, true);
  }

  private void settle(long ms) {
    inst.waitForIdleSync();
    SystemClock.sleep(ms);
  }

  private List<AccessibilityNodeInfo> roots() {
    List<AccessibilityNodeInfo> list = new ArrayList<>();
    for (AccessibilityWindowInfo w : ua.getWindows()) {
      AccessibilityNodeInfo root = w.getRoot();
      if (root != null && root.getPackageName() != null && PKG.contentEquals(root.getPackageName())) list.add(root);
    }
    if (list.isEmpty() && ua.getRootInActiveWindow() != null) list.add(ua.getRootInActiveWindow());
    return list;
  }

  private static String label(AccessibilityNodeInfo n) {
    CharSequence d = n.getContentDescription();
    if (d != null && d.length() > 0) return d.toString();
    CharSequence t = n.getText();
    return t == null ? "" : t.toString();
  }

  private interface Match { boolean test(AccessibilityNodeInfo n); }

  private AccessibilityNodeInfo find(Match match) {
    for (AccessibilityNodeInfo root : roots()) {
      AccessibilityNodeInfo hit = find(root, match);
      if (hit != null) return hit;
    }
    return null;
  }

  private AccessibilityNodeInfo find(AccessibilityNodeInfo node, Match match) {
    if (node == null) return null;
    if (match.test(node)) return node;
    for (int i = 0; i < node.getChildCount(); i++) {
      AccessibilityNodeInfo hit = find(node.getChild(i), match);
      if (hit != null) return hit;
    }
    return null;
  }

  private AccessibilityNodeInfo waitFor(Match match, long timeoutMs) {
    long end = SystemClock.uptimeMillis() + timeoutMs;
    while (SystemClock.uptimeMillis() < end) {
      AccessibilityNodeInfo hit = find(match);
      if (hit != null) return hit;
      SystemClock.sleep(150);
    }
    return null;
  }

  private AccessibilityNodeInfo byLabel(String text) { return waitFor(n -> label(n).equals(text), 5000); }
  private AccessibilityNodeInfo byLabelPrefix(String text) { return waitFor(n -> label(n).startsWith(text), 5000); }

  private JSONObject node(AccessibilityNodeInfo n) throws Exception {
    JSONObject o = new JSONObject();
    Rect r = new Rect();
    n.getBoundsInScreen(r);
    o.put("class", String.valueOf(n.getClassName()));
    if (n.getText() != null) o.put("text", n.getText().toString());
    if (n.getContentDescription() != null) o.put("contentDescription", n.getContentDescription().toString());
    if (n.getStateDescription() != null) o.put("stateDescription", n.getStateDescription().toString());
    if (n.getHintText() != null) o.put("hint", n.getHintText().toString());
    if (n.getError() != null) o.put("error", n.getError().toString());
    if (n.getViewIdResourceName() != null) o.put("id", n.getViewIdResourceName());
    o.put("bounds", r.flattenToString());
    o.put("dp", Math.round(r.width() / density) + "x" + Math.round(r.height() / density));
    if (n.isClickable()) o.put("clickable", true);
    if (n.isFocusable()) o.put("focusable", true);
    if (n.isScreenReaderFocusable()) o.put("screenReaderFocusable", true);
    if (n.isAccessibilityFocused()) o.put("accessibilityFocused", true);
    if (n.isFocused()) o.put("inputFocused", true);
    if (!n.isEnabled()) o.put("enabled", false);
    if (n.isCheckable()) o.put("checked", n.isChecked());
    if (n.isSelected()) o.put("selected", true);
    if (n.isHeading()) o.put("heading", true);
    if (n.isEditable()) o.put("editable", true);
    if (n.isPassword()) o.put("password", true);
    if (!n.isVisibleToUser()) o.put("visible", false);
    if (!n.isImportantForAccessibility()) o.put("important", false);
    if (n.getInputType() != 0) o.put("inputType", n.getInputType());
    if (n.getRangeInfo() != null) o.put("range", n.getRangeInfo().getMin() + ".." + n.getRangeInfo().getMax() + " now " + n.getRangeInfo().getCurrent());
    if (n.getCollectionInfo() != null) o.put("collection", n.getCollectionInfo().getRowCount() + "x" + n.getCollectionInfo().getColumnCount());
    JSONArray actions = new JSONArray();
    for (AccessibilityNodeInfo.AccessibilityAction a : n.getActionList()) {
      String name = a.getLabel() != null ? a.getLabel().toString() : actionName(a.getId());
      if (name != null) actions.put(name);
    }
    if (actions.length() > 0) o.put("actions", actions);
    JSONArray children = new JSONArray();
    for (int i = 0; i < n.getChildCount(); i++) {
      AccessibilityNodeInfo c = n.getChild(i);
      if (c != null) children.put(node(c));
    }
    if (children.length() > 0) o.put("children", children);
    return o;
  }

  private static String actionName(int id) {
    if (id == AccessibilityNodeInfo.ACTION_CLICK) return "click";
    if (id == AccessibilityNodeInfo.ACTION_LONG_CLICK) return "longClick";
    if (id == AccessibilityNodeInfo.ACTION_SCROLL_FORWARD) return "scrollForward";
    if (id == AccessibilityNodeInfo.ACTION_SCROLL_BACKWARD) return "scrollBackward";
    if (id == AccessibilityNodeInfo.ACTION_SET_TEXT) return "setText";
    if (id == AccessibilityNodeInfo.ACTION_EXPAND) return "expand";
    if (id == AccessibilityNodeInfo.ACTION_COLLAPSE) return "collapse";
    if (id == AccessibilityNodeInfo.AccessibilityAction.ACTION_SET_PROGRESS.getId()) return "setProgress";
    return null;
  }

  /** Automated scanner-style checks: unlabeled actionable nodes and touch targets below 48dp. */
  private void audit(AccessibilityNodeInfo n, JSONArray issues, String component) throws Exception {
    if (n == null) return;
    Rect r = new Rect();
    n.getBoundsInScreen(r);
    boolean actionable = n.isClickable() || n.isCheckable() || n.isEditable() || n.getRangeInfo() != null;
    // Skip nodes hidden from screen readers and nodes cut by the viewport edge (their visible bounds are partial).
    Rect window = new Rect();
    if (n.getWindow() != null) n.getWindow().getBoundsInScreen(window);
    boolean clipped = !window.isEmpty() && (r.bottom >= window.bottom - 2 || r.top <= window.top + 2);
    if (actionable && n.isVisibleToUser() && n.isEnabled() && n.isImportantForAccessibility() && !clipped) {
      String l = label(n);
      if (l.isEmpty() && n.getHintText() == null && !hasLabelledDescendant(n)) issues.put(new JSONObject().put("component", component).put("issue", "unlabeled actionable node").put("class", String.valueOf(n.getClassName())).put("bounds", r.flattenToString()));
      int w = Math.round(r.width() / density), h = Math.round(r.height() / density);
      if (w < 48 || h < 48) issues.put(new JSONObject().put("component", component).put("issue", "touch target below 48dp").put("label", l).put("class", String.valueOf(n.getClassName())).put("dp", w + "x" + h));
    }
    for (int i = 0; i < n.getChildCount(); i++) audit(n.getChild(i), issues, component);
  }

  private boolean hasLabelledDescendant(AccessibilityNodeInfo n) {
    for (int i = 0; i < n.getChildCount(); i++) {
      AccessibilityNodeInfo c = n.getChild(i);
      if (c == null) continue;
      if (!label(c).isEmpty() || hasLabelledDescendant(c)) return true;
    }
    return false;
  }

  private JSONArray tree() throws Exception {
    JSONArray windows = new JSONArray();
    for (AccessibilityNodeInfo root : roots()) windows.put(node(root));
    return windows;
  }

  private void write(String name, String text) throws Exception {
    File f = new File(out, name);
    f.getParentFile().mkdirs();
    try (FileOutputStream s = new FileOutputStream(f)) { s.write(text.getBytes(StandardCharsets.UTF_8)); }
  }

  private void capture(String name) throws Exception {
    Bitmap b = ua.takeScreenshot();
    if (b == null) return;
    try (FileOutputStream s = new FileOutputStream(new File(out, "captures/" + name + ".png"))) { b.compress(Bitmap.CompressFormat.PNG, 100, s); }
  }

  private JSONObject focusInfo() throws Exception {
    AccessibilityNodeInfo f = ua.findFocus(AccessibilityNodeInfo.FOCUS_ACCESSIBILITY);
    return f == null ? new JSONObject().put("accessibilityFocus", JSONObject.NULL) : new JSONObject().put("accessibilityFocus", label(f)).put("class", String.valueOf(f.getClassName())).put("heading", f.isHeading());
  }

  private String diagnostics() {
    AccessibilityNodeInfo n = waitFor(x -> label(x).startsWith("Feedback calls:"), 3000);
    return n == null ? null : label(n);
  }

  @Test
  public void galleryCaptures() throws Exception {
    String prefix = arg("prefix", "android");
    String extra = arg("query", "");
    JSONArray results = new JSONArray(), issues = new JSONArray();
    for (String component : arg("components", "Button").split(",")) {
      open("component=" + Uri.encode(component) + "&state=default" + extra);
      byLabel(component);
      settle(400);
      JSONArray t = tree();
      write("trees/" + prefix + "-" + component + ".json", t.toString(1));
      capture(prefix + "-" + component);
      int before = issues.length();
      for (AccessibilityNodeInfo root : roots()) audit(root, issues, component);
      results.put(new JSONObject().put("component", component).put("windows", t.length()).put("auditIssues", issues.length() - before));
    }
    write(prefix + "-gallery.json", new JSONObject().put("results", results).put("auditIssues", issues).toString(1));
  }

  @Test
  public void sliderAccessibilityActions() throws Exception {
    open("component=Slider&state=default");
    JSONObject r = new JSONObject();
    AccessibilityNodeInfo slider = waitFor(n -> "Volume preview".contentEquals(label(n)) && n.getRangeInfo() != null, 6000);
    r.put("found", slider != null);
    if (slider != null) {
      r.put("initial", node(slider));
      r.put("initialLabel", label(byLabelPrefix("Volume preview: ")));
      JSONArray steps = new JSONArray();
      int[] actions = {AccessibilityNodeInfo.ACTION_SCROLL_FORWARD, AccessibilityNodeInfo.ACTION_SCROLL_FORWARD, AccessibilityNodeInfo.ACTION_SCROLL_BACKWARD};
      String[] names = {"scrollForward(increment)", "scrollForward(increment)", "scrollBackward(decrement)"};
      for (int i = 0; i < actions.length; i++) {
        boolean ok = slider.performAction(actions[i]);
        settle(500);
        slider.refresh();
        steps.put(new JSONObject().put("action", names[i]).put("performed", ok).put("range", slider.getRangeInfo() == null ? JSONObject.NULL : slider.getRangeInfo().getCurrent()).put("visibleLabel", label(byLabelPrefix("Volume preview: "))));
      }
      Bundle args = new Bundle();
      args.putFloat(AccessibilityNodeInfo.ACTION_ARGUMENT_PROGRESS_VALUE, 80f);
      boolean set = slider.performAction(AccessibilityNodeInfo.AccessibilityAction.ACTION_SET_PROGRESS.getId(), args);
      settle(500);
      slider.refresh();
      steps.put(new JSONObject().put("action", "setProgress(80)").put("performed", set).put("range", slider.getRangeInfo() == null ? JSONObject.NULL : slider.getRangeInfo().getCurrent()).put("visibleLabel", label(byLabelPrefix("Volume preview: "))));
      r.put("steps", steps);
      capture("android-slider-after-actions");
    }
    open("component=Slider&state=disabled");
    AccessibilityNodeInfo disabled = waitFor(n -> "Volume preview".contentEquals(label(n)) && n.getRangeInfo() != null, 6000);
    if (disabled != null) {
      String before = label(byLabelPrefix("Volume preview: "));
      boolean ok = disabled.performAction(AccessibilityNodeInfo.ACTION_SCROLL_FORWARD);
      settle(500);
      r.put("disabled", new JSONObject().put("enabled", disabled.isEnabled()).put("performed", ok).put("labelBefore", before).put("labelAfter", label(byLabelPrefix("Volume preview: "))));
    }
    write("android-slider.json", r.toString(1));
  }

  @Test
  public void overlayFocusAndBack() throws Exception {
    String prefix = arg("prefix", "android");
    JSONArray results = new JSONArray();
    String[][] cases = {{"Dialog", "Open review order", "Review order"}, {"AlertDialog", "Open confirm cancellation", "Confirm cancellation"}, {"Sheet", "Open order details", "Order details"}, {"Menu", "Market actions", "Market actions"}};
    for (String[] c : cases) {
      open("component=" + c[0] + "&state=default");
      JSONObject r = new JSONObject().put("component", c[0]);
      AccessibilityNodeInfo trigger = byLabel(c[1]);
      r.put("triggerFound", trigger != null);
      if (trigger == null) { results.put(r); continue; }
      r.put("triggerClick", trigger.performAction(AccessibilityNodeInfo.ACTION_CLICK));
      AccessibilityNodeInfo close = byLabel("Close");
      settle(700);
      r.put("openedCloseVisible", close != null);
      r.put("windowsWhileOpen", roots().size());
      r.put("focusAfterOpen", focusInfo());
      write("trees/" + prefix + "-overlay-" + c[0] + ".json", tree().toString(1));
      capture(prefix + "-overlay-" + c[0] + "-open");
      ua.performGlobalAction(android.accessibilityservice.AccessibilityService.GLOBAL_ACTION_BACK);
      settle(900);
      r.put("closedByBack", find(n -> "Close".contentEquals(label(n))) == null);
      r.put("appStillForeground", find(n -> label(n).equals("Native HIG gallery")) != null);
      r.put("focusAfterBack", focusInfo());
      capture(prefix + "-overlay-" + c[0] + "-after-back");
      results.put(r);
    }
    write(prefix + "-overlays.json", results.toString(1));
  }

  @Test
  public void listScrolling() throws Exception {
    open("component=List&state=default&rows=2000");
    JSONObject r = new JSONObject();
    AccessibilityNodeInfo first = waitFor(n -> label(n).equals("Verification row 1"), 6000);
    r.put("firstRowVisible", first != null);
    AccessibilityNodeInfo scroller = waitFor(n -> n.isScrollable() && find(n, x -> label(x).startsWith("Verification row ")) != null, 4000);
    r.put("scrollableFound", scroller != null);
    JSONArray samples = new JSONArray();
    long start = SystemClock.uptimeMillis();
    for (int i = 0; scroller != null && i < 40; i++) {
      boolean ok = scroller.performAction(AccessibilityNodeInfo.ACTION_SCROLL_FORWARD);
      SystemClock.sleep(120);
      if (i % 8 == 7) {
        AccessibilityNodeInfo visible = find(n -> label(n).startsWith("Verification row ") && n.isVisibleToUser());
        samples.put(new JSONObject().put("afterScrolls", i + 1).put("performed", ok).put("firstVisible", visible == null ? JSONObject.NULL : label(visible)));
      }
    }
    r.put("elapsedMs", SystemClock.uptimeMillis() - start).put("samples", samples);
    capture("android-list-scrolled");
    write("android-list.json", r.toString(1));
  }

  @Test
  public void feedbackCalls() throws Exception {
    open("component=Button&state=default&diag=1");
    JSONObject r = new JSONObject();
    r.put("diagnosticsBefore", diagnostics());
    // Preferences persist between launches: turn Sound and Haptics on explicitly, then toggle Motion twice.
    String[] names = {"Sound", "Haptics", "Motion", "Motion"};
    Boolean[] targets = {true, true, null, null};
    for (int k = 0; k < names.length; k++) {
      String name = names[k];
      AccessibilityNodeInfo sw = waitFor(n -> name.contentEquals(label(n)) && n.isCheckable() && n.isImportantForAccessibility(), 5000);
      if (sw == null) { r.put("missing-" + name, true); continue; }
      r.put(name + "-checked-before-" + k, sw.isChecked());
      if (targets[k] != null && sw.isChecked() == targets[k]) continue;
      AccessibilityNodeInfo scroller = waitFor(AccessibilityNodeInfo::isScrollable, 1000);
      for (int i = 0; i < 6 && !sw.isVisibleToUser() && scroller != null; i++) { scroller.performAction(AccessibilityNodeInfo.ACTION_SCROLL_FORWARD); settle(200); sw.refresh(); }
      sw.performAction(AccessibilityNodeInfo.ACTION_CLICK);
      settle(1200);
    }
    AccessibilityNodeInfo scroller = waitFor(AccessibilityNodeInfo::isScrollable, 1000);
    for (int i = 0; i < 10 && scroller != null; i++) { if (!scroller.performAction(AccessibilityNodeInfo.ACTION_SCROLL_BACKWARD)) break; settle(150); }
    settle(1500);
    r.put("diagnosticsAfter", diagnostics());
    capture("android-feedback-diagnostics");
    write("android-feedback.json", r.toString(1));
  }

  @Test
  public void keyboardAvoidance() throws Exception {
    JSONArray results = new JSONArray();
    for (String component : new String[] {"Field", "TradeEntry"}) {
      open("component=" + component + "&state=default");
      // Use the lowest visible amount field (TradeEntry in the scroll view) so the keyboard would cover it.
      waitFor(AccessibilityNodeInfo::isEditable, 5000);
      AccessibilityNodeInfo input = null;
      for (AccessibilityNodeInfo root : roots()) input = lowestEditable(root, input);
      JSONObject r = new JSONObject().put("component", component).put("inputFound", input != null);
      if (input != null) {
        Rect before = new Rect();
        input.getBoundsInScreen(before);
        r.put("inputBoundsBeforeTap", before.flattenToString());
        tap(before.centerX(), before.centerY());
        settle(2000);
        input.refresh();
        Rect ime = null;
        for (AccessibilityWindowInfo w : ua.getWindows()) if (w.getType() == AccessibilityWindowInfo.TYPE_INPUT_METHOD) { ime = new Rect(); w.getBoundsInScreen(ime); }
        Rect field = new Rect();
        input.getBoundsInScreen(field);
        r.put("inputFocused", input.isFocused()).put("inputType", input.getInputType()).put("inputBounds", field.flattenToString()).put("imeBounds", ime == null ? JSONObject.NULL : ime.flattenToString());
        r.put("inputAboveKeyboard", ime == null ? JSONObject.NULL : field.bottom <= ime.top);
        capture("android-keyboard-" + component);
        ua.performGlobalAction(android.accessibilityservice.AccessibilityService.GLOBAL_ACTION_BACK);
        settle(600);
      }
      results.put(r);
    }
    write("android-keyboard.json", results.toString(1));
  }

  private AccessibilityNodeInfo lowestEditable(AccessibilityNodeInfo n, AccessibilityNodeInfo best) {
    if (n == null) return best;
    if (n.isEditable() && n.isVisibleToUser()) {
      Rect a = new Rect(), b = new Rect();
      n.getBoundsInScreen(a);
      if (best != null) best.getBoundsInScreen(b);
      if (best == null || a.top > b.top) best = n;
    }
    for (int i = 0; i < n.getChildCount(); i++) best = lowestEditable(n.getChild(i), best);
    return best;
  }

  @Test
  public void snapshot() throws Exception {
    String name = arg("name", "snapshot");
    open(arg("query", "component=Button&state=default&diag=1"));
    settle(600);
    JSONObject r = new JSONObject().put("name", name).put("diagnostics", diagnostics());
    AccessibilityNodeInfo runtime = waitFor(n -> label(n).startsWith("Runtime:"), 2000);
    AccessibilityNodeInfo scale = waitFor(n -> label(n).startsWith("Font scale:"), 2000);
    AccessibilityNodeInfo rtl = waitFor(n -> label(n).startsWith("OS RTL:"), 2000);
    AccessibilityNodeInfo motion = waitFor(n -> label(n).startsWith("OS reduce motion:"), 2000);
    r.put("runtime", runtime == null ? JSONObject.NULL : label(runtime)).put("fontScale", scale == null ? JSONObject.NULL : label(scale)).put("rtl", rtl == null ? JSONObject.NULL : label(rtl)).put("motion", motion == null ? JSONObject.NULL : label(motion));
    write("trees/android-" + name + ".json", tree().toString(1));
    capture("android-" + name);
    write("android-" + name + ".json", r.toString(1));
  }
}
