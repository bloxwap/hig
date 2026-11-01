package com.bloxwap.hig;

import android.content.Context;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;
import android.view.accessibility.AccessibilityNodeProvider;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.UIManagerHelper;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.facebook.react.views.view.ReactViewGroup;

/**
 * React Native maps accessibilityActions names to fixed or synthetic action ids and drops action
 * arguments, so an adjustable View cannot offer AccessibilityNodeInfo.ACTION_SET_PROGRESS (Voice
 * Access, Switch Access). This view wraps whichever delegate React Native installs and adds
 * set-progress while the node is enabled and carries range info (accessibilityValue min/max/now).
 * The requested value reaches JS as onAccessibilityAction({actionName: 'setProgress', value}).
 */
public class HIGAdjustableView extends ReactViewGroup {
  public static final String SET_PROGRESS = "setProgress";

  public HIGAdjustableView(Context context) {
    super(context);
  }

  @Override
  public void setAccessibilityDelegate(@Nullable View.AccessibilityDelegate delegate) {
    // Only wrap a delegate React Native installed: an always-present delegate would stop
    // ReactAccessibilityDelegate.setDelegate from attaching role/state/value semantics.
    super.setAccessibilityDelegate(
        delegate == null || delegate instanceof SetProgressDelegate
            ? delegate
            : new SetProgressDelegate(delegate));
  }

  static boolean acceptsSetProgress(@NonNull AccessibilityNodeInfo info) {
    return info.isEnabled() && info.getRangeInfo() != null;
  }

  private void dispatchSetProgress(float value) {
    Context context = getContext();
    if (!(context instanceof ReactContext)) return;
    int tag = getId();
    EventDispatcher dispatcher =
        UIManagerHelper.getEventDispatcherForReactTag((ReactContext) context, tag);
    if (dispatcher == null) return;
    dispatcher.dispatchEvent(new SetProgressEvent(UIManagerHelper.getSurfaceId(this), tag, value));
  }

  private final class SetProgressDelegate extends View.AccessibilityDelegate {
    private final View.AccessibilityDelegate inner;

    SetProgressDelegate(View.AccessibilityDelegate inner) {
      this.inner = inner;
    }

    @Override
    public void onInitializeAccessibilityNodeInfo(
        @NonNull View host, @NonNull AccessibilityNodeInfo info) {
      inner.onInitializeAccessibilityNodeInfo(host, info);
      if (acceptsSetProgress(info)) {
        info.addAction(AccessibilityNodeInfo.AccessibilityAction.ACTION_SET_PROGRESS);
      }
    }

    @Override
    public boolean performAccessibilityAction(
        @NonNull View host, int action, @Nullable Bundle args) {
      if (action != android.R.id.accessibilityActionSetProgress) {
        return inner.performAccessibilityAction(host, action, args);
      }
      // Re-read the current semantics: disabled sliders and sliders without a range reject it.
      AccessibilityNodeInfo info = host.createAccessibilityNodeInfo();
      boolean accepted = acceptsSetProgress(info);
      if (android.os.Build.VERSION.SDK_INT < 33) info.recycle();
      if (!accepted || args == null
          || !args.containsKey(AccessibilityNodeInfo.ACTION_ARGUMENT_PROGRESS_VALUE)) {
        return false;
      }
      float value = args.getFloat(AccessibilityNodeInfo.ACTION_ARGUMENT_PROGRESS_VALUE);
      if (Float.isNaN(value) || Float.isInfinite(value)) return false;
      dispatchSetProgress(value);
      return true;
    }

    @Override
    public void sendAccessibilityEvent(@NonNull View host, int eventType) {
      inner.sendAccessibilityEvent(host, eventType);
    }

    @Override
    public void sendAccessibilityEventUnchecked(
        @NonNull View host, @NonNull AccessibilityEvent event) {
      inner.sendAccessibilityEventUnchecked(host, event);
    }

    @Override
    public boolean dispatchPopulateAccessibilityEvent(
        @NonNull View host, @NonNull AccessibilityEvent event) {
      return inner.dispatchPopulateAccessibilityEvent(host, event);
    }

    @Override
    public void onPopulateAccessibilityEvent(
        @NonNull View host, @NonNull AccessibilityEvent event) {
      inner.onPopulateAccessibilityEvent(host, event);
    }

    @Override
    public void onInitializeAccessibilityEvent(
        @NonNull View host, @NonNull AccessibilityEvent event) {
      inner.onInitializeAccessibilityEvent(host, event);
    }

    @Override
    public boolean onRequestSendAccessibilityEvent(
        @NonNull ViewGroup host, @NonNull View child, @NonNull AccessibilityEvent event) {
      return inner.onRequestSendAccessibilityEvent(host, child, event);
    }

    @Nullable
    @Override
    public AccessibilityNodeProvider getAccessibilityNodeProvider(@NonNull View host) {
      return inner.getAccessibilityNodeProvider(host);
    }

    @Override
    public void addExtraDataToAccessibilityNodeInfo(
        @NonNull View host,
        @NonNull AccessibilityNodeInfo info,
        @NonNull String extraDataKey,
        @Nullable Bundle arguments) {
      inner.addExtraDataToAccessibilityNodeInfo(host, info, extraDataKey, arguments);
    }
  }

  private static final class SetProgressEvent extends Event<SetProgressEvent> {
    private final float value;

    SetProgressEvent(int surfaceId, int viewTag, float value) {
      super(surfaceId, viewTag);
      this.value = value;
    }

    @NonNull
    @Override
    public String getEventName() {
      return "topAccessibilityAction";
    }

    @Override
    public boolean canCoalesce() {
      return false;
    }

    @Nullable
    @Override
    protected WritableMap getEventData() {
      WritableMap data = Arguments.createMap();
      data.putString("actionName", SET_PROGRESS);
      data.putDouble("value", value);
      return data;
    }
  }
}
