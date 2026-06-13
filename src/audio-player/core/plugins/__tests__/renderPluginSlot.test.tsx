import { isValidElement } from "react"
import { describe, expect, it, vi } from "vitest"
import type {
    AudioPlayerPlugin,
    PluginProgressSlotProps,
} from "../PluginInterface"
import { renderPluginSlot } from "../renderPluginSlot"

function createProgressProps(): PluginProgressSlotProps {
    return {
        hostId: "test-host",
        currentTime: 12,
        duration: 60,
        buffered: 30,
        disabled: false,
        isSeeking: false,
        onSeek: vi.fn(),
        onSeekStart: vi.fn(),
        onSeekEnd: vi.fn(),
        currentTrack: {
            title: "Test Track",
            artist: "SEIHouse",
            audioFile: "/test.mp3",
        },
        sourceKey: "test-source",
        height: 48,
        waveColor: "rgba(255,255,255,0.25)",
        progressColor: "#ffffff",
        cursorColor: "#22d3a6",
    }
}

function createPlugin(
    name: string,
    renderSlot?: AudioPlayerPlugin["renderSlot"]
): AudioPlayerPlugin {
    return {
        name,
        init: () => {},
        destroy: () => {},
        renderSlot,
    }
}

describe("renderPluginSlot", () => {
    it("returns the first non-null slot result", () => {
        const first = createPlugin("first", () => null)
        const second = createPlugin("second", () => <div data-plugin="second" />)
        const third = createPlugin("third", () => <div data-plugin="third" />)

        const rendered = renderPluginSlot(
            [first, second, third],
            "progress",
            createProgressProps()
        )

        expect(isValidElement(rendered)).toBe(true)
        expect((rendered as React.ReactElement).props["data-plugin"]).toBe("second")
    })

    it("isolates throwing slot renderers and keeps searching", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
        const broken = createPlugin("broken", () => {
            throw new Error("slot failed")
        })
        const fallback = createPlugin("fallback", () => <div data-plugin="fallback" />)

        const rendered = renderPluginSlot(
            [broken, fallback],
            "progress",
            createProgressProps()
        )

        expect(isValidElement(rendered)).toBe(true)
        expect((rendered as React.ReactElement).props["data-plugin"]).toBe("fallback")
        expect(warn).toHaveBeenCalledWith(
            "[AudioPlayer PluginManager] renderSlot:progress:broken failed:",
            expect.any(Error)
        )

        warn.mockRestore()
    })

    it("returns null when no plugin handles the slot", () => {
        const rendered = renderPluginSlot(
            [createPlugin("empty")],
            "progress",
            createProgressProps()
        )

        expect(rendered).toBeNull()
    })
})
