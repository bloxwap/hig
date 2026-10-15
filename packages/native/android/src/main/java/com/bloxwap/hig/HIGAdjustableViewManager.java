package com.bloxwap.hig;

import androidx.annotation.NonNull;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.views.view.ReactViewGroup;
import com.facebook.react.views.view.ReactViewManager;

/** A React Native View whose adjustable semantics also expose Android set-progress. */
public class HIGAdjustableViewManager extends ReactViewManager {
  public static final String NAME = "HIGAdjustableView";

  @NonNull
  @Override
  public String getName() {
    return NAME;
  }

  @NonNull
  @Override
  public ReactViewGroup createViewInstance(@NonNull ThemedReactContext context) {
    return new HIGAdjustableView(context);
  }
}
