# AutoMix Pro Compatibility

AutoMix Pro is now `mode: "pro"` on the unified AutoMix plugin:

```tsx
import { createAutomixPlugin } from "@seihouse/audio-player"

<AudioPlayer tracks={tracks} plugins={[createAutomixPlugin({ mode: "pro" })]} />
```

`createAutomixProPlugin()` remains exported as a compatibility wrapper, but new
code should prefer `createAutomixPlugin({ mode: "pro" })`.

Pro mode keeps the same two-deck crossfade and handoff lifecycle as Lite mode,
then adds BPM, beat, energy, and transition-point analysis. Low-confidence or
failed analysis falls back to Lite behavior for that track pair.

See [`automix.md`](./automix.md) for the current AutoMix API, fallback behavior,
and compatibility notes.
