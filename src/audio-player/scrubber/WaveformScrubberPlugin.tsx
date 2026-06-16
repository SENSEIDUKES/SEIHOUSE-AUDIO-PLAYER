import { WaveformAdapter } from "../components/WaveformAdapter"
import type {
    ScrubberPluginRenderProps,
    ScrubberVisualPlugin,
    WaveformScrubberConfig,
} from "./types"

const CLASSIC_CONFIG: WaveformScrubberConfig = {
    preset: "classic",
    barWidth: 2,
    barGap: 1,
    barRadius: 2,
    height: 48,
    amplitudeScale: 1,
    mirrored: true,
    showCursor: true,
}

const PRESETS: Record<string, WaveformScrubberConfig> = {
    classic: CLASSIC_CONFIG,
    blocks: {
        ...CLASSIC_CONFIG,
        preset: "blocks",
        resolution: 10,
        barWidth: 9,
        barGap: 4,
        barRadius: 3,
        height: 44,
    },
    minimal: {
        ...CLASSIC_CONFIG,
        preset: "minimal",
        barWidth: 1,
        barGap: 2,
        barRadius: 1,
        height: 34,
        showCursor: false,
    },
    gradient: {
        ...CLASSIC_CONFIG,
        preset: "gradient",
        colorMode: "palette",
        palette: ["#22D3A6", "#7C5CFF", "#F59E0B"],
    },
}

export function resolveWaveformScrubberConfig(
    config: WaveformScrubberConfig = {}
): WaveformScrubberConfig {
    const preset = PRESETS[config.preset ?? "classic"] ?? CLASSIC_CONFIG
    const merged = { ...preset, ...config }
    return {
        ...merged,
        resolution: merged.resolution ?? merged.barCount,
        height: merged.height ?? CLASSIC_CONFIG.height,
    }
}

export function withHexAlpha(color: string, alpha: string) {
    return color.startsWith("#") && color.length === 7 ? `${color}${alpha}` : color
}

function colorFromConfig(
    config: WaveformScrubberConfig,
    key: "playedColor" | "unplayedColor",
    fallback: string | undefined
) {
    if (config.colorMode === "palette" && config.palette?.length) {
        return key === "playedColor"
            ? config.palette
            : config.palette.map((color) => withHexAlpha(color, "66"))
    }
    if (config.colorMode === "per-bar" && config.perBarColors?.length) {
        return config.perBarColors
    }
    return config[key] ?? fallback
}

function renderWaveformScrubberPlugin(props: ScrubberPluginRenderProps) {
    const config = resolveWaveformScrubberConfig(props.config)
    const activeBackend = props.getBackendInfo?.().active ?? props.audioBackend

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
            peaks={props.track?.peaks}
            peaksDuration={props.track?.waveformDuration}
            getDecodedData={props.getDecodedData}
            url={activeBackend === "html5" ? props.track?.audioFile : undefined}
            sourceKey={props.sourceKey}
            height={config.height}
            barCount={config.barCount}
            resolution={config.resolution}
            barWidth={config.barWidth}
            barGap={config.barGap}
            barRadius={config.barRadius}
            amplitudeScale={config.amplitudeScale}
            mirrored={config.mirrored}
            waveColor={colorFromConfig(config, "unplayedColor", undefined)}
            progressColor={colorFromConfig(config, "playedColor", undefined)}
            bufferedColor={config.bufferedColor}
            cursorColor={config.showCursor === false ? "transparent" : config.cursorColor}
            showCursor={config.showCursor}
        />
    )
}

export const WaveformScrubberPlugin: ScrubberVisualPlugin = {
    id: "waveform",
    name: "Waveform",
    supportedFamilies: ["primary"],
    render: renderWaveformScrubberPlugin,
}
