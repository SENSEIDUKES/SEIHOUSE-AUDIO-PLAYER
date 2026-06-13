# AutoMix Plugin

AutoMix is one plugin with two modes:

```tsx
import { createAutomixPlugin } from "@seihouse/audio-player"

const plugins = [
  createAutomixPlugin({ mode: "lite" }), // default
  createAutomixPlugin({ mode: "pro" }),
]
```

`mode: "lite"` uses the two-deck crossfade with conservative silence trimming.
It preloads the resolved next track into a detached deck, runs an equal-power
fade near the trimmed end of the current track, then advances through the host's
normal queue path.

`mode: "pro"` uses the same deck and handoff lifecycle, but adds BPM, beat,
energy, and transition-point analysis. If either side lacks confident rhythm
metadata, that transition falls back to Lite behavior.

Legacy compatibility remains:

- `<AudioPlayer automix>` and `<AudioSessionProvider automix>` create an
  internal Lite-mode plugin.
- `useAutomix()` remains exported for older code, but delegates to
  `AutomixPlugin` and emits a deprecation warning.
- `createAutomixProPlugin()` remains exported as
  `createAutomixPlugin({ mode: "pro" })`.

Known constraints are unchanged: crossfades require an HTML media element and
programmatic volume support, CORS-readable audio is needed for analysis, and
repeat-one or end-of-queue with repeat off do not AutoMix.
