import { Component } from "react"
import type { ReactNode } from "react"
import { ProgressBar } from "../components/ProgressBar"
import {
    faceSupportsScrubberCanvas,
    getFaceFamily,
} from "../surfaces/faceCapabilities"
import {
    WaveformScrubberPlugin,
    resolveWaveformScrubberConfig,
} from "./WaveformScrubberPlugin"
import type {
    ScrubberPluginRenderProps,
    ScrubberPluginSelection,
    ScrubberVisualPlugin,
    WaveformScrubberConfig,
} from "./types"

const SCRUBBER_PLUGINS: readonly ScrubberVisualPlugin[] = [
    WaveformScrubberPlugin,
]

export interface ScrubberPluginHostProps
    extends Omit<ScrubberPluginRenderProps, "family"> {
    plugin?: ScrubberPluginSelection | string | false | null
}

class ScrubberPluginBoundary extends Component<
    { fallback: ReactNode; children: ReactNode },
    { failed: boolean }
> {
    state = { failed: false }

    static getDerivedStateFromError() {
        return { failed: true }
    }

    render() {
        return this.state.failed ? this.props.fallback : this.props.children
    }
}

function normalizeSelection(
    selection: ScrubberPluginHostProps["plugin"]
): ScrubberPluginSelection | null {
    if (!selection) return null
    if (typeof selection === "string") return { id: selection }
    return selection
}

function findScrubberPlugin(id: string): ScrubberVisualPlugin | null {
    return SCRUBBER_PLUGINS.find((plugin) => plugin.id === id) ?? null
}

export function getScrubberFallbackLabel(
    _plugin: ScrubberPluginHostProps["plugin"]
) {
    return "Progress"
}

function ProgressFallback(props: ScrubberPluginRenderProps) {
    return (
        <div data-scrubber-fallback="progress">
            <ProgressBar
                currentTime={props.currentTime}
                duration={props.duration}
                buffered={props.buffered}
                disabled={props.disabled}
                isSeeking={props.isSeeking}
                onSeek={props.onSeek}
                onSeekStart={props.onSeekStart}
                onSeekEnd={props.onSeekEnd}
            />
        </div>
    )
}

export function ScrubberPluginHost({
    plugin,
    ...props
}: ScrubberPluginHostProps) {
    const selection = normalizeSelection(plugin)
    const resolved = selection ? findScrubberPlugin(selection.id) : null
    const family = getFaceFamily(props.face)
    const hostProps = { ...props, family }
    const fallback = <ProgressFallback {...hostProps} />

    if (
        !selection ||
        !resolved ||
        !faceSupportsScrubberCanvas(props.face) ||
        !resolved.supportedFamilies.includes(family)
    ) {
        return fallback
    }

    return (
        <div
            data-scrubber-plugin={resolved.id}
            data-scrubber-plugin-name={resolved.name}
            data-scrubber-fallback="progress"
        >
            <ScrubberPluginBoundary fallback={fallback}>
                {resolved.render({ ...hostProps, config: selection.config })}
            </ScrubberPluginBoundary>
        </div>
    )
}

export {
    WaveformScrubberPlugin,
    resolveWaveformScrubberConfig,
}

export type {
    ScrubberPluginRenderProps,
    ScrubberPluginSelection,
    ScrubberVisualPlugin,
    WaveformScrubberConfig,
}
