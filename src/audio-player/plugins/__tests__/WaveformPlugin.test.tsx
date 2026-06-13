import { isValidElement } from "react"
import { describe, expect, it, vi } from "vitest"
import type { PluginProgressSlotProps } from "../../core/plugins/PluginInterface"
import { WaveformProgress } from "../../components/WaveformProgress"
import { createWaveformPlugin, WaveformPlugin } from "../WaveformPlugin"

function createProgressProps(): PluginProgressSlotProps {
    return {
        hostId: "standalone",
        currentTime: 5,
        duration: 120,
        buffered: 20,
        disabled: false,
        isSeeking: false,
        onSeek: vi.fn(),
        onSeekStart: vi.fn(),
        onSeekEnd: vi.fn(),
        currentTrack: {
            title: "Wave",
            artist: "SEIHouse",
            audioFile: "/wave.mp3",
            peaks: [[0, 0.5, 1]],
            waveformDuration: 120,
        },
        sourceKey: "wave-source",
        peaks: [[0, 0.5, 1]],
        peaksDuration: 120,
        getDecodedData: () => null,
        url: "/wave.mp3",
        height: 36,
        waveColor: "#111111",
        progressColor: "#eeeeee",
        cursorColor: "#22d3a6",
    }
}

describe("WaveformPlugin", () => {
    it("renders WaveformProgress into the progress slot", () => {
        const plugin = createWaveformPlugin({ height: 52 })
        const rendered = plugin.renderSlot?.("progress", createProgressProps())

        expect(isValidElement(rendered)).toBe(true)
        expect((rendered as React.ReactElement).type).toBe(WaveformProgress)
        expect((rendered as React.ReactElement).props.height).toBe(52)
        expect((rendered as React.ReactElement).props.sourceKey).toBe("wave-source")
    })

    it("returns null when disabled", () => {
        const plugin = createWaveformPlugin({ enabled: false })

        expect(plugin.renderSlot?.("progress", createProgressProps())).toBeNull()
    })

    it("uses the expected default plugin name", () => {
        expect(new WaveformPlugin().name).toBe("waveform")
    })
})
