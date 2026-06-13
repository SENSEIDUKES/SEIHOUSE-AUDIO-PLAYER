import type {
    AudioPlayerPlugin,
    PluginPlayerContext,
    PluginProgressSlotProps,
    PluginRenderSlot,
    PluginRenderSlotProps,
} from "../core/plugins/PluginInterface"
import { WaveformProgress } from "../components/WaveformProgress"

export interface WaveformPluginConfig {
    name?: string
    enabled?: boolean
    height?: number
    waveColor?: string
    progressColor?: string
    cursorColor?: string
}

/** Renders the wavesurfer-backed scrubber through the plugin progress slot. */
export class WaveformPlugin implements AudioPlayerPlugin {
    readonly name: string
    private readonly enabled: boolean
    private readonly height?: number
    private readonly waveColor?: string
    private readonly progressColor?: string
    private readonly cursorColor?: string

    constructor(config: WaveformPluginConfig = {}) {
        this.name = config.name ?? "waveform"
        this.enabled = config.enabled ?? true
        this.height = config.height
        this.waveColor = config.waveColor
        this.progressColor = config.progressColor
        this.cursorColor = config.cursorColor
    }

    init(_playerInstance: PluginPlayerContext) {}

    destroy() {}

    renderSlot<K extends PluginRenderSlot>(
        slot: K,
        props: PluginRenderSlotProps[K]
    ) {
        if (!this.enabled || slot !== "progress") return null
        const progressProps = props as PluginProgressSlotProps
        return (
            <WaveformProgress
                currentTime={progressProps.currentTime}
                duration={progressProps.duration}
                buffered={progressProps.buffered}
                disabled={progressProps.disabled}
                isSeeking={progressProps.isSeeking}
                onSeek={progressProps.onSeek}
                onSeekStart={progressProps.onSeekStart}
                onSeekEnd={progressProps.onSeekEnd}
                peaks={progressProps.peaks}
                peaksDuration={progressProps.peaksDuration}
                getDecodedData={progressProps.getDecodedData}
                url={progressProps.url}
                sourceKey={progressProps.sourceKey}
                height={this.height ?? progressProps.height}
                waveColor={this.waveColor ?? progressProps.waveColor}
                progressColor={this.progressColor ?? progressProps.progressColor}
                cursorColor={this.cursorColor ?? progressProps.cursorColor}
            />
        )
    }
}

export function createWaveformPlugin(config?: WaveformPluginConfig) {
    return new WaveformPlugin(config)
}
