import { describe, expect, it } from "vitest"
import {
    AutomixPlugin,
    createAutomixPlugin,
    createAutomixProPlugin,
} from "../AutomixPlugin"

describe("AutomixPlugin factories", () => {
    it("defaults to lite mode", () => {
        const plugin = createAutomixPlugin()

        expect(plugin).toBeInstanceOf(AutomixPlugin)
        expect(plugin.getMode()).toBe("lite")
    })

    it("accepts pro mode through the unified factory", () => {
        const plugin = createAutomixPlugin({ mode: "pro" })

        expect(plugin.getMode()).toBe("pro")
    })

    it("keeps deprecated pro boolean compatibility", () => {
        const plugin = createAutomixPlugin({ pro: true })

        expect(plugin.getMode()).toBe("pro")
    })

    it("keeps createAutomixProPlugin as a pro-mode wrapper", () => {
        const plugin = createAutomixProPlugin()

        expect(plugin.getMode()).toBe("pro")
    })
})
