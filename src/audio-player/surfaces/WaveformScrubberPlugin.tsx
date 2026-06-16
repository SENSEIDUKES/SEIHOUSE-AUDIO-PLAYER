import { WaveformAdapter } from "../components/WaveformAdapter"
import type { ScrubberVisualPlugin } from "./ScrubberPluginHost"

export interface WaveformScrubberConfig {
    /** Implemented: override waveform canvas height in px. */
    height?: number
    /** Implemented: concrete waveform background color. */
    waveColor?: string
    /** Implemented: concrete waveform played-progress color. */
    progressColor?: string
    /** Implemented: concrete cursor color. */
    cursorColor?: string
    /** Future-only: reserved for a later smoothing pass; currently ignored. */
    smoothing?: number
    /** Future-only: reserved for multi-stop waveform fills; currently ignored. */
    gradient?: readonly string[]
}

/**
 * Waveform Scrubber Visual Plugin.
 *
 * This is not an AudioPlayerPlugin lifecycle plugin. It only renders inside
 * ScrubberCanvas/ScrubberPluginHost, never owns playback, never creates audio,
 * and forwards click/drag/keyboard seek intent back through the engine's seek
 * callbacks. Audio decoding, playback, buffering, and timing remain engine-owned.
 */
export const WaveformScrubberPlugin: ScrubberVisualPlugin<WaveformScrubberConfig> = {
    id: "waveform-scrubber",
    name: "Waveform Scrubber",
    kind: "scrubber-visual",
    description:
        "Visual waveform scrubber for ScrubberCanvas. Forwards seek events; does not own playback.",
    render(props) {
        const config = this.config
        return (
            <WaveformAdapter
                face={props.face}
                density={props.density}
                waveform
                currentTime={props.currentTime}
                duration={props.duration}
                buffered={props.buffered}
                disabled={props.disabled}
                isSeeking={props.isSeeking}
                onSeek={props.onSeek}
                onSeekStart={props.onSeekStart}
                onSeekEnd={props.onSeekEnd}
                peaks={props.peaks}
                peaksDuration={props.peaksDuration}
                getDecodedData={props.getDecodedData}
                url={props.url}
                sourceKey={props.sourceKey}
                height={config?.height}
                waveColor={config?.waveColor}
                progressColor={config?.progressColor}
                cursorColor={config?.cursorColor}
                onAvailabilityChange={props.onAvailabilityChange}
            />
        )
    },
}

export function createWaveformScrubberPlugin(
    config: WaveformScrubberConfig = {}
): ScrubberVisualPlugin<WaveformScrubberConfig> {
    return { ...WaveformScrubberPlugin, config }
}
