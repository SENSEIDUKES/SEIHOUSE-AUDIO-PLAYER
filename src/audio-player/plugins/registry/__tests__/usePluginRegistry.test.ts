import { describe, expect, it } from "vitest"
import { availablePlugins } from "../usePluginRegistry"

describe("plugin registry catalogue", () => {
    it("exposes one unified AutoMix plugin", () => {
        const automixEntries = availablePlugins.filter((entry) =>
            entry.id.includes("automix")
        )

        expect(automixEntries.map((entry) => entry.id)).toEqual(["automix"])
        expect(automixEntries[0]?.label).toBe("AutoMix")
        expect(automixEntries[0]?.factory().name).toBe("registry-automix")
    })

    it("does not expose old Lite/Pro split entries", () => {
        const ids = availablePlugins.map((entry) => entry.id)

        expect(ids).not.toContain("automix-lite")
        expect(ids).not.toContain("automix-pro")
    })
})
