// Release-only catalog probe. Each sample includes the commit that mounts its example.
// The moving marker requests native frames even for static examples. RAF measures JS
// scheduling; pair the PERF_CASE log with platform frame statistics for presentation.
import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, View, Text } from "react-native";
import { registerRootComponent } from "expo";
import { useFonts } from "expo-font";
import { documentDirectory, writeAsStringAsync } from "expo-file-system/legacy";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { HIGProvider } from "@bloxwap/hig/native/provider";
import { Toaster } from "@bloxwap/hig/native/toast";
import { Example } from "./gallery";
import manifest from "./gallery-manifest.json";
const cases = manifest.examples.flatMap((e) =>
  e.states.map((state) => ({ name: e.name, state, support: e.support })),
);
const renderErrors = new WeakMap();
class Boundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error) {
    renderErrors.set(this.props.item, String(error));
    console.info(
      "PERF_ERROR " +
        JSON.stringify({ ...this.props.item, error: String(error) }),
    );
  }
  render() {
    return this.state.failed ? (
      <Text>Fixture failed</Text>
    ) : (
      this.props.children
    );
  }
}
function Sweep() {
  const [index, setIndex] = useState(-1),
    marker = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const motion = Animated.loop(
      Animated.timing(marker, {
        toValue: 1,
        duration: 800,
        easing: Easing.linear,
        useNativeDriver: true,
        isInteraction: false,
      }),
    );
    motion.start();
    let active = true,
      frame = 0,
      i = -1,
      start = 0,
      previous = 0,
      intervals = [];
    const results = [];
    const tick = () => {
      if (!active) return;
      const now = performance.now();
      if (i >= 0) intervals.push(now - previous);
      if (i < 0 || now - start >= 900) {
        if (i >= 0) {
          intervals.sort((a, b) => a - b);
          const result = {
            ...cases[i],
            error: renderErrors.get(cases[i]),
            endEpochMs: Date.now(),
            elapsedMs: now - start,
            samples: intervals.length,
            fps: (1000 * intervals.length) / (now - start),
            p95Ms: intervals[Math.ceil(intervals.length * 0.95) - 1],
            worstMs: intervals.at(-1),
          };
          results.push(result);
          console.info("PERF_CASE " + JSON.stringify(result));
        }
        if (++i === cases.length) {
          motion.stop();
          setIndex(-1);
          void writeAsStringAsync(
            documentDirectory + "hig-perf.json",
            JSON.stringify(results),
          ).then(() => console.info("PERF_COMPLETE"));
          return;
        }
        setIndex(i);
        start = now;
        intervals = [];
      }
      previous = now;
      frame = requestAnimationFrame(tick);
    };
    // Allow root layout and the native display's refresh policy to settle.
    const timer = setTimeout(() => {
      frame = requestAnimationFrame(tick);
    }, 1000);
    return () => {
      active = false;
      clearTimeout(timer);
      cancelAnimationFrame(frame);
      motion.stop();
    };
  }, [marker]);
  const item = cases[index];
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Animated.View
        style={{
          width: 8,
          height: 8,
          backgroundColor: "lime",
          transform: [
            {
              translateX: marker.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 120],
              }),
            },
          ],
        }}
      />
      {item && (
        <Boundary key={index} item={item}>
          <Text>
            {item.name} / {item.state}
          </Text>
          <View style={{ flex: 1 }}>
            <Example name={item.name} state={item.state} />
          </View>
        </Boundary>
      )}
    </View>
  );
}
function App() {
  const [ready, error] = useFonts({
    BloxwapSansRegular: require("@bloxwap/hig/native-fonts/fonts/BloxwapSans.ttf"),
    BloxwapMonoRegular: require("@bloxwap/hig/native-fonts/fonts/BloxwapMono.ttf"),
  });
  if (error) throw error;
  return ready ? (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <BottomSheetModalProvider>
          <HIGProvider
            reducedMotion={false}
            fontFamily="BloxwapSansRegular"
            monoFontFamily="BloxwapMonoRegular"
          >
            <Sweep />
            <Toaster />
          </HIGProvider>
        </BottomSheetModalProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  ) : null;
}
registerRootComponent(App);
