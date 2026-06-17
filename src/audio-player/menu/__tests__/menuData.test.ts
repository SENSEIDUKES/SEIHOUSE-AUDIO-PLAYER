import { describe, expect, it } from "vitest"
import { buildMenuTree, isNodeInteractive } from "../menuData"
import type { MenuNode } from "../menuData"

function findNode(items: MenuNode[], id: string): MenuNode | undefined {
    for (const node of items) {
        if (node.id === id) return node
        if (node.children) {
            const hit = findNode(node.children, id)
            if (hit) return hit
        }
    }
    return undefined
}

describe("buildMenuTree — derived plugin branches", () => {
    it("derives the Plugin › Visual branch from the surface catalog", () => {
        const tree = buildMenuTree({ canvasSupported: true })
        const visual = findNode(tree, "visual")!
        const ids = visual.children!.map((n) => n.id)
        // Order follows the catalog menu.order (lyrics 10, auto-theme 50, waveform 60).
        expect(ids).toEqual(["lyrics", "auto-theme", "waveform"])
    })

    it("makes lyrics a canvas-activation node (not a settings route)", () => {
        const tree = buildMenuTree({ canvasSupported: true })
        const lyrics = findNode(tree, "lyrics")!
        expect(lyrics.canvasSurfaceId).toBe("lyrics")
        expect(lyrics.workspaceRoute).toBeUndefined()
    })

    it("disables canvas plugin nodes when the face has no SEI Canvas", () => {
        const tree = buildMenuTree({ canvasSupported: false })
        expect(findNode(tree, "lyrics")?.state).toBe("disabled")
    })

    it("marks a canvas plugin node active when its surface is open", () => {
        const tree = buildMenuTree({
            canvasSupported: true,
            activeCanvasSurfaceId: "lyrics",
        })
        expect(findNode(tree, "lyrics")?.state).toBe("active")
    })

    it("routes settings-only plugins to their registered workspace route", () => {
        const tree = buildMenuTree({ canvasSupported: true })
        expect(findNode(tree, "waveform")?.workspaceRoute).toBe("plugin-settings:waveform")
        expect(findNode(tree, "auto-theme")?.workspaceRoute).toBe(
            "plugin-settings:auto-theme"
        )
        expect(findNode(tree, "analytics")?.workspaceRoute).toBe(
            "plugin-settings:analytics"
        )
    })

    it("puts Sleep Timer (not Automix) under Plugin › Playback", () => {
        const tree = buildMenuTree({ canvasSupported: true })
        const pluginPlayback = findNode(tree, "plugin-playback")!
        const ids = pluginPlayback.children!.map((n) => n.id)
        expect(ids).toContain("sleep-timer")
        expect(ids).not.toContain("automix")
    })

    it("excludes headless plugins from the menu entirely", () => {
        const tree = buildMenuTree({ canvasSupported: true })
        expect(findNode(tree, "keyboard-shortcuts")).toBeUndefined()
    })

    it("keeps the hardcoded transport/playback actions", () => {
        const tree = buildMenuTree({ canvasSupported: true })
        expect(findNode(tree, "up-next")?.actionId).toBe("open-queue")
        expect(findNode(tree, "up-next")?.workspaceRoute).toBe("library:queue")
        // Automix keeps its dedicated spot under the top-level Playback branch.
        const playback = findNode(tree, "playback")!
        expect(playback.children!.map((n) => n.id)).toContain("automix")
        expect(findNode(tree, "automix")?.workspaceRoute).toBe("playback:automix")
        expect(findNode(tree, "repeat")).toBeDefined()
    })

    it("adds transport leaves only when includeTransport is set", () => {
        const without = buildMenuTree({ canvasSupported: true })
        expect(findNode(without, "previous-track")).toBeUndefined()
        const withTransport = buildMenuTree({
            canvasSupported: true,
            includeTransport: true,
            canPrevious: true,
            canNext: false,
        })
        expect(findNode(withTransport, "previous-track")?.state).toBe("available")
        expect(findNode(withTransport, "next-track")?.state).toBe("disabled")
    })

    it("keeps the agent branch coming-soon and non-interactive", () => {
        const tree = buildMenuTree({ canvasSupported: true })
        const agent = findNode(tree, "agent")!
        expect(agent.state).toBe("coming-soon")
        expect(isNodeInteractive(agent)).toBe(false)
        expect(agent.workspaceRoute).toBe("agent:queue-director")
    })

    it("treats derived plugin leaves as interactive", () => {
        const tree = buildMenuTree({ canvasSupported: true })
        expect(isNodeInteractive(findNode(tree, "lyrics")!)).toBe(true)
        expect(isNodeInteractive(findNode(tree, "waveform")!)).toBe(true)
    })
})
