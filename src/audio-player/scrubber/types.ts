import type { ReactNode } from "react"
import type { AudioBackendInfo, AudioBackendKind } from "../core/audio/AudioBackend"
import type { PlayerFace, PlayerFamily, ScrubberDensity } from "../surfaces/faceCapabilities"
import type { Track } from "../types"

export type WaveformColorMode = "solid" | "palette" | "gradient" | "per-bar"
export type WaveformScrubberPreset = "classic" | "blocks" | "minimal" | "gradient"

export interface WaveformGradientStop {
    offset: number
    color: string
}

export interface WaveformScrubberConfig {
    preset?: WaveformScrubberPreset
    barCount?: number
    resolution?: number
    barWidth?: number
    barGap?: number
    barRadius?: number
    height?: number
    amplitudeScale?: number
    smoothing?: number
    mirrored?: boolean
    playedColor?: string
    unplayedColor?: string
    bufferedColor?: string
    colorMode?: WaveformColorMode
    palette?: string[]
    perBarColors?: string[]
    gradient?: WaveformGradientStop[]
    showCursor?: boolean
    cursorColor?: string
}

export interface ScrubberPluginSelection {
    id: string
    config?: WaveformScrubberConfig
}

export interface ScrubberPluginRenderProps {
    face: PlayerFace
    family: PlayerFamily
    density: ScrubberDensity
    currentTime: number
    duration: number
    buffered: number
    disabled: boolean
    isSeeking: boolean
    onSeek: (time: number) => void
    onSeekStart: () => void
    onSeekEnd: () => void
    track: Track | null
    sourceKey: string
    getDecodedData?: () => AudioBuffer | null
    getBackendInfo?: () => AudioBackendInfo
    audioBackend?: AudioBackendKind
    config?: WaveformScrubberConfig
}

export interface ScrubberVisualPlugin {
    id: string
    name: string
    supportedFamilies: readonly PlayerFamily[]
    render: (props: ScrubberPluginRenderProps) => ReactNode
}
