import { describe, expect, it } from "vitest"
import {
    PLAYER_FACE_CAPABILITIES,
    faceSupportsContextualActions,
    faceSupportsHeroCollapse,
    faceSupportsSEICanvas,
    faceSupportsScrubberCanvas,
    getPreferredCanvasPlacement,
    getScrubberDensity,
} from "../faceCapabilities"
import type { PlayerFace } from "../faceCapabilities"

const ALL_FACES: PlayerFace[] = [
    "fullCard",
    "miniSidebar",
    "seaCard",
    "stickyBottom",
    "vaultRow",
    "portable",
]

describe("PLAYER_FACE_CAPABILITIES", () => {
    it("declares an entry for every face", () => {
        for (const face of ALL_FACES) {
            expect(PLAYER_FACE_CAPABILITIES[face]).toBeDefined()
        }
    })

    it("supports SEICanvas only on large faces (fullCard, seaCard, portable)", () => {
        expect(faceSupportsSEICanvas("fullCard")).toBe(true)
        expect(faceSupportsSEICanvas("seaCard")).toBe(true)
        expect(faceSupportsSEICanvas("portable")).toBe(true)
        expect(faceSupportsSEICanvas("miniSidebar")).toBe(false)
        expect(faceSupportsSEICanvas("stickyBottom")).toBe(false)
        expect(faceSupportsSEICanvas("vaultRow")).toBe(false)
    })

    it("makes ScrubberCanvas available on every face", () => {
        for (const face of ALL_FACES) {
            expect(faceSupportsScrubberCanvas(face)).toBe(true)
        }
    })

    it("enables the contextual radial menu only on faces that render it", () => {
        // fullCard + miniSidebar host PlayerSurfaceButtons; the rest rely on the
        // SAPController three-dot sheet (or have no menu room) and must opt out.
        expect(faceSupportsContextualActions("fullCard")).toBe(true)
        expect(faceSupportsContextualActions("miniSidebar")).toBe(true)
        expect(faceSupportsContextualActions("portable")).toBe(false)
        expect(faceSupportsContextualActions("seaCard")).toBe(false)
        expect(faceSupportsContextualActions("stickyBottom")).toBe(false)
        expect(faceSupportsContextualActions("vaultRow")).toBe(false)
    })

    it("declares supportsContextualActions for every face", () => {
        for (const face of ALL_FACES) {
            expect(
                typeof PLAYER_FACE_CAPABILITIES[face].supportsContextualActions
            ).toBe("boolean")
        }
    })

    it("reports hero collapse from declared capability", () => {
        expect(faceSupportsHeroCollapse("fullCard")).toBe(true)
        expect(faceSupportsHeroCollapse("miniSidebar")).toBe(false)
    })

    it("returns the declared scrubber density per face", () => {
        expect(getScrubberDensity("fullCard")).toBe("standard")
        expect(getScrubberDensity("portable")).toBe("expanded")
        expect(getScrubberDensity("miniSidebar")).toBe("compact")
    })

    it("returns 'none' canvas placement for non-canvas faces", () => {
        expect(getPreferredCanvasPlacement("miniSidebar")).toBe("none")
        expect(getPreferredCanvasPlacement("stickyBottom")).toBe("none")
        expect(getPreferredCanvasPlacement("vaultRow")).toBe("none")
        expect(getPreferredCanvasPlacement("fullCard")).toBe("main")
        expect(getPreferredCanvasPlacement("seaCard")).toBe("overlay")
    })
})
