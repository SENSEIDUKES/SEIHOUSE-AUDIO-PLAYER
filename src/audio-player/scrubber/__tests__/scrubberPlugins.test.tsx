import React from "react"
import { describe, expect, it } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import {
    AudioSessionProvider,
    FullCardPlayer,
    MiniSidebarPlayer,
    VaultRowPlayer,
} from "../../index"
import {
    getScrubberFallbackLabel,
    resolveWaveformScrubberConfig,
} from "../ScrubberPluginHost"
import type { Track } from "../../types"

const track: Track = {
    id: "one",
    title: "Test Track",
    artist: "SEIHouse",
    audioFile: "https://example.com/test.mp3",
    peaks: [[0, 0.3, 0.8, 0.2, 1, 0.4, 0.1, 0.7]],
    waveformDuration: 32,
}

function renderSession(children: React.ReactNode) {
    return renderToStaticMarkup(
        <AudioSessionProvider initialQueue={[track]}>{children}</AudioSessionProvider>
    )
}

describe("scrubber visual plugins", () => {
    it("routes FullCard scrubber through the waveform plugin host by default", () => {
        const html = renderSession(<FullCardPlayer />)

        expect(html).toContain('data-scrubber-plugin="waveform"')
        expect(html).toContain('data-scrubber-fallback="progress"')
    })

    it("keeps compact faces free of waveform and per-row scrubbers", () => {
        const html = renderSession(
            <>
                <MiniSidebarPlayer />
                <VaultRowPlayer track={track} />
            </>
        )

        expect(html).not.toContain('data-scrubber-plugin="waveform"')
        expect(html).not.toContain('role="slider"')
    })

    it("accepts waveform preset config and keeps progress as the fallback", () => {
        const config = resolveWaveformScrubberConfig({
            preset: "blocks",
            playedColor: "#ffffff",
        })

        expect(config.resolution).toBe(10)
        expect(config.barWidth).toBeGreaterThan(2)
        expect(config.playedColor).toBe("#ffffff")
        expect(getScrubberFallbackLabel(undefined)).toBe("Progress")
    })
})
