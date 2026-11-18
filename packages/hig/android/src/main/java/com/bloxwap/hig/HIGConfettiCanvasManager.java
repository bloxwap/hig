package com.bloxwap.hig;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;

/** One drawing surface per burst. Only the clock changes during a flight. */
public final class HIGConfettiCanvasManager extends SimpleViewManager<HIGConfettiCanvasView> {
  @Override @NonNull public String getName() { return "HIGConfettiCanvas"; }
  @Override @NonNull protected HIGConfettiCanvasView createViewInstance(@NonNull ThemedReactContext context) {
    return new HIGConfettiCanvasView(context);
  }
  @ReactProp(name = "burst")
  public void setBurst(HIGConfettiCanvasView view, @Nullable ReadableMap burst) {
    view.setBurst(burst);
  }
  @ReactProp(name = "tick", defaultDouble = 1)
  public void setTick(HIGConfettiCanvasView view, double tick) {
    view.setTick(tick);
  }
}
