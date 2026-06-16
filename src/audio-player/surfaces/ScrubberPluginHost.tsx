import type { ReactNode } from "react"
import type { PlayerFace, ScrubberDensity } from "./faceCapabilities"
import type { WaveformAvailability } from "../types"

export interface ScrubberVisualPluginRenderProps {
    face: PlayerFace
    density: ScrubberDensity
    currentTime: number
    duration: number
    buffered: number
    disabled: boolean
    isSeeking: boolean
    onSeek: (time: number) => void
    onSeekStart: () => void
    onSeekEnd: () => void
    peaks?: number[][]
    peaksDuration?: number
    getDecodedData?: () => AudioBuffer | null
    url?: string
    sourceKey?: string
    onAvailabilityChange?: (availability: WaveformAvailability) => void
}

/**
 * A Scrubber Visual Plugin renders visual scrubber content inside ScrubberCanvas.
 * It is intentionally separate from lifecycle audio plugins such as Automix,
 * Lyrics, Analytics, and Sleep Timer: it receives UI/seek props only, never owns
 * playback, never creates audio, and never participates in audio lifecycle hooks.
 */
export interface ScrubberVisualPlugin<Config = unknown> {
    readonly id: string
    readonly name: string
    readonly kind: "scrubber-visual"
    readonly description?: string
    readonly config?: Config
    render(props: ScrubberVisualPluginRenderProps): ReactNode
}

export interface ScrubberPluginHostProps extends ScrubberVisualPluginRenderProps {
    /** Scrubber Visual Plugin mounted in this ScrubberCanvas slot. */
    plugin?: ScrubberVisualPlugin | null
    /** Plain scrubber fallback when no visual plugin is mounted. */
    fallback: ReactNode
}

/**
 * Mount point for Scrubber Visual Plugins. This host only renders inside a
 * ScrubberCanvas/ScrubberCanvasHost child tree and forwards seek events back to
 * the engine-owned scrubber contract. It does not create audio or control
 * playback directly.
 */
export function ScrubberPluginHost({ plugin, fallback, ...props }: ScrubberPluginHostProps) {
    if (!plugin) return <>{fallback}</>
    return <>{plugin.render(props)}</>
}

export default ScrubberPluginHost
