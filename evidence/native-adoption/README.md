# Native host adoption verification

Four XCUITest checks passed on the iOS 26.5 iPhone 16 Pro Simulator with React Native 0.83.10 / Expo 55. This run copied the current workspace's built JS and generated static fonts into the prepared app. `report.json` records the source, installed runtime and font hashes, dependency versions, device and successful XCTest summaries. Packed installation is verified separately.

| Check | Observation |
| --- | --- |
| Typography and busy button | All seven requested faces registered. Korean/Han radio labels and Regular/SemiBold samples rendered under `locale='en-US'`. Positive/negative mono readouts used 20px typography and Text testIDs; the animated label updated. The disabled busy button measured 168.33 × 48dp with a compact “Log out · Working” label. |
| Default notifications | The viewport measured 524.33dp (60% of the 874dp window). Two swipes reached request 8's recovery action; recovery and dismissal succeeded while request 7 remained. |
| AX5 notifications | At font scale 3.57, eight swipes reached request 8's recovery action. Recovery and dismissal succeeded within the same bounded viewport; request 7 remained. |
| Custom GestureSheet | Account's 45% detent changed to Activity's 70% detent while open (title y 513.90 → 319.40). The nested scroll reached its final action. One caller Done action and zero built-in Close actions were exposed; dismissal made the trigger hittable again. |

Captures and accessibility trees are grouped under `default/` and `ax5/`. These are touch, layout and accessibility-tree observations. VoiceOver, physical hardware and Android adoption flows were not exercised. The unit suite separately verifies hidden/caller title focus, removed-detent clamping, focus return, Android Back, backdrop policy and reduced motion.

To repeat against a prepared app with installed native dependencies and pods:

```sh
npm run generate
node scripts/build.mjs
npm run generate:fonts
bash scripts/native-sim/run-adoption-ios.sh <prepared-app> <booted-simulator-udid> <evidence-dir>
```

The optional `fixtures/native/index-adoption.js` entry isolates companion-font assets from the main gallery. Raw builds, logs, test-runner backups and `.xcresult` bundles stay in `.validation-tmp/native-adoption/`; the runner restores the prepared app's gallery entry, Metro configuration and normal content size.
