# @bloxwap/hig-native-fonts

Version 0.1.1. Static Bloxwap Sans/Mono (and Korean/Simplified Chinese Sans) TTF faces for React Native and Expo hosts, derived reproducibly from pinned `@bloxwap/font` 0.1.2 by `npm run generate:fonts`.

Web hosts never need this package: load fonts through `@bloxwap/font` and use `@bloxwap/hig-tokens/css`. Open Graph card renderers (Satori, `next/og`) install the much smaller `@bloxwap/hig-og-fonts` instead (#99).

```tsx
import {useFonts} from 'expo-font';
import {fontManifest} from '@bloxwap/hig-native-fonts';

const [loaded] = useFonts({
  BloxwapSansRegular: require('@bloxwap/hig-native-fonts/fonts/BloxwapSans.ttf'),
  BloxwapSansSemiBold: require('@bloxwap/hig-native-fonts/fonts/BloxwapSans-SemiBold.ttf'),
});
```

`fontManifest` (also `@bloxwap/hig-native-fonts/manifest`) lists every face with its registration key, PostScript name, weight, script, byte count and SHA-256, plus the hashes of the `@bloxwap/font` sources. It satisfies the `FontManifest` contract in `@bloxwap/hig-contracts`, so `nativeFont(fontManifest, 'BloxwapSans', 600)` resolves a registered family. OFL attribution ships in `fonts/OFL.txt`.
