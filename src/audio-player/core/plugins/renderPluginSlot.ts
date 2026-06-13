import type { ReactNode } from "react"
import type {
    AudioPlayerPlugin,
    PluginRenderSlot,
    PluginRenderSlotProps,
} from "./PluginInterface"

export function renderPluginSlot<K extends PluginRenderSlot>(
    plugins: readonly AudioPlayerPlugin[],
    slot: K,
    props: PluginRenderSlotProps[K]
): ReactNode | null {
    for (const plugin of plugins) {
        if (typeof plugin.renderSlot !== "function") continue
        try {
            const rendered = plugin.renderSlot(slot, props)
            if (rendered !== null && rendered !== undefined) return rendered
        } catch (error) {
            reportSlotError(`renderSlot:${slot}:${plugin.name}`, error)
        }
    }
    return null
}

function reportSlotError(scope: string, error: unknown) {
    if (typeof console === "undefined") return
    // eslint-disable-next-line no-console
    console.warn(`[AudioPlayer PluginManager] ${scope} failed:`, error)
}
