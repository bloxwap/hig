# Semantic feedback · HIG 0.1.0

Issues #21, #25. Types in `@bloxwap/hig-contracts/feedback` and `@bloxwap/hig-feedback` import without DOM, RN, React, audio, Expo or hardware APIs. Base renderers accept an optional `FeedbackSink`; no provider or feedback backend is required to perform an action.

| Intent | Timing | Sound | Haptic | Cooldown |
| --- | --- | --- | --- | --- |
| press/release | gesture phases; visual response | silent | none | none |
| cancel | discarded gesture/action; clears pending work | silent | cancel where possible | none |
| activate | accepted button click/keyboard/native press, after host handler | tick | selection | 80ms |
| selection/toggle | accepted state commit, never a render/repeated/rejected value | tick/toggle | selection | 80ms |
| disclosure | accepted open/close | silent | none | 120ms |
| success | host operation completion with stable operation id | success | notification success | 400ms |
| warning | host outcome | silent | notification warning | 400ms |
| error | host operation failure with visual recovery text | error | notification error | 400ms |
| notification | nonessential transient acknowledgement | silent | none | 800ms |

The exported `presets` table is authoritative. Each event has id, source, intent and origin. An async outcome uses the host operation id, not the button's interaction id; an accepted click does not imply order success. Optional native impact overrides map light/medium/heavy; browser physical-tap intensity cannot be programmed. Live price ticks and general navigation are silent.

**Do** emit a success event after the host request resolves, alongside visible success text. **Don't** play a success sound on press-in, for a rejected controlled value, or on every market render. Busy/disabled/suppressed/cancelled events are rejected. Buttons compose the host handler before activation, honor default prevention, preserve refs and block nested activation propagation. Choice controls emit on committed changes only. Sliders use semantic steps and controller cooldown; no effect queue accumulates. A host cancellation before activation suppresses the request; a physical cue already delivered by the OS cannot be recalled.

Preference precedence: host policy may forbid a channel; persisted user choices enable sound/haptics independently; component suppression can disable its request; OS/browser/backend capability decides whether output is attempted. Volume is clamped 0–1. Motion is a separate setting and OS reduced motion remains respected. Defaults are both channels off. No-feedback, sound-only, haptics-only, both, and host-injected adapter configurations use the same actions. Root/local `FeedbackProvider`s hold independent preference/controller state; a nested button emits one request.

Deduplication uses source/id/intent; host stable outcome ids suppress repeated notifications. Cooldowns drop excess requests, never delay primary actions or queue a backlog. Seen/cadence maps are bounded. Exceptions thrown/rejected by backends and storage are caught. Disposal is idempotent and late startup/preload completions cannot revive disposed players. Capability `available` is API routing, while `observed` records actual physical evidence and remains false in this candidate.
