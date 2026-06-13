import { describe, expect, it } from "vitest"
import {
    AUTOMIX_PLUGIN_NAME,
    hasAutomixPlugin,
    withInternalAutomix,
} from "../automixIntegration"
import type { AudioPlayerPlugin } from "../../core/plugins/PluginInterface"

function fakePlugin(name: string): AudioPlayerPlugin {
    return { name, init: () => {}, destroy: () => {} }
}

const internalAutomix = fakePlugin(AUTOMIX_PLUGIN_NAME)

describe("withInternalAutomix", () => {
    it("adds the internal automix plugin when none is supplied", () => {
        const external = [fakePlugin("lyrics")]
        const result = withInternalAutomix(external, internalAutomix)
        expect(result).toHaveLength(2)
        expect(result).toContain(internalAutomix)
        expect(hasAutomixPlugin(result)).toBe(true)
    })

    it("omits the internal automix when an external automix plugin exists", () => {
        // QA case 8: external Automix plugin + `automix` prop must not double-run.
        const external = [fakePlugin("lyrics"), fakePlugin(AUTOMIX_PLUGIN_NAME)]
        const result = withInternalAutomix(external, internalAutomix)
        expect(result).toBe(external)
        expect(result).not.toContain(internalAutomix)
        // Exactly one automix controller in the resolved list.
        expect(
            result.filter((p) => p.name === AUTOMIX_PLUGIN_NAME)
        ).toHaveLength(1)
    })

    it("never produces more than one automix controller", () => {
        const withExternal = withInternalAutomix(
            [fakePlugin(AUTOMIX_PLUGIN_NAME)],
            internalAutomix
        )
        const withoutExternal = withInternalAutomix([], internalAutomix)
        for (const list of [withExternal, withoutExternal]) {
            expect(
                list.filter((p) => p.name === AUTOMIX_PLUGIN_NAME)
            ).toHaveLength(1)
        }
    })
})

describe("hasAutomixPlugin", () => {
    it("detects an automix plugin by canonical name", () => {
        expect(hasAutomixPlugin([fakePlugin(AUTOMIX_PLUGIN_NAME)])).toBe(true)
        expect(hasAutomixPlugin([fakePlugin("lyrics")])).toBe(false)
        expect(hasAutomixPlugin([])).toBe(false)
    })
})
