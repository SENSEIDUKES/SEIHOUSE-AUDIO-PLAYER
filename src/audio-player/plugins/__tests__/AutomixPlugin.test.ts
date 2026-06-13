import { describe, expect, it, vi } from "vitest"
import { createAutomixPlugin } from "../AutomixPlugin"
import type { PluginPlayerContext } from "../../core/plugins/PluginInterface"
import type { AudioPlayerEngine } from "../../types"

function createPluginContext(): PluginPlayerContext {
    const engine = {
        currentTime: 0,
        duration: 180,
        volume: 1,
        isPlaying: false,
        isSeeking: false,
        hasError: false,
        volumeUnsupported: false,
        audioRef: { current: null },
    } as unknown as AudioPlayerEngine

    return {
        getEngine: () => engine,
        getRootElement: () => null,
        getAudioElement: () => null,
        getCurrentTrack: () => null,
        getNextTrack: () => null,
        getSourceKey: () => "test-track",
    }
}

describe("AutomixPlugin track-end contract", () => {
    it("does not suppress the host advance while idle (exactly one advance)", () => {
        // QA case 6: a normal end-of-track must advance the queue once. The
        // plugin only claims the end while it owns an active fade/handoff;
        // idle → returns false so the host runs its single advance.
        const plugin = createAutomixPlugin({ name: "automix" })
        plugin.init(createPluginContext())

        expect(plugin.handleTrackEnded()).toBe(false)
        expect(plugin.onTrackEnded()).toBe(false)

        plugin.destroy()
    })

    it("never claims the track end when disabled", () => {
        const plugin = createAutomixPlugin({ name: "automix", enabled: false })
        plugin.init(createPluginContext())

        expect(plugin.handleTrackEnded()).toBe(false)
        expect(plugin.isTransitioning).toBe(false)

        plugin.destroy()
    })

    it("toggling enabled off cancels cleanly and stays idle", () => {
        const onTransitionChange = vi.fn()
        const plugin = createAutomixPlugin({
            name: "automix",
            onTransitionChange,
        })
        plugin.init(createPluginContext())

        // QA case 7 (controller level): disabling must not leave a transition armed.
        plugin.updateConfig({ enabled: false })
        expect(plugin.isTransitioning).toBe(false)
        expect(plugin.handleTrackEnded()).toBe(false)

        plugin.destroy()
    })
})
