import type { PlaybackVisualState } from "../types"

export function playbackVisualStateShowsSpinner(state: PlaybackVisualState): boolean {
    return state === "loading-source" || state === "preparing-play" || state === "buffering"
}
