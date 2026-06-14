/**
 * Per-face capability model — the single source of truth for which render zones
 * and surface behaviors a player face supports.
 *
 * Rules are declared here, never inferred from layout/width. Every consumer asks
 * these getters (e.g. `faceSupportsSEICanvas`) so support is a property of the
 * face, not of the current viewport.
 */

/** Every player face the library ships. */
export type PlayerFace =
    | "fullCard" // FullCardPlayer — rich now-playing card (expanded)
    | "miniSidebar" // MiniSidebarPlayer — condensed sidebar widget (compact)
    | "seaCard" // SeaCardPlayer — marketplace/album card
    | "stickyBottom" // StickyBottomPlayer — persistent bottom bar
    | "vaultRow" // VaultRowPlayer — slim list row
    | "portable" // default AudioPlayer — standalone portable player

export type ScrubberDensity = "compact" | "standard" | "expanded"

export type PlayerFaceCapability = {
    /** May host the SEICanvas main visual area. Compact/mini faces are false. */
    supportsSEICanvas: boolean
    /** May host the ScrubberCanvas timeline zone. Available on every face. */
    supportsScrubberCanvas: boolean
    /**
     * Renders the contextual action menu (the bottom-arc SEI Canvas Action Menu /
     * "command wheel") via `PlayerSurfaceButtons`. This is the radial, in-context
     * affordance — distinct from the `SAPController` three-dot deep-action sheet,
     * which faces own separately. Compact faces that rely solely on the three-dot
     * menu (or have no room for a menu at all) declare this `false`.
     */
    supportsContextualActions: boolean
    /** Hero can collapse into a compact identity header when a surface opens. */
    supportsHeroCollapse?: boolean
    /** Where the canvas prefers to live relative to the face. */
    preferredCanvasPlacement?: "main" | "overlay" | "none"
    /** How dense the scrubber renders on this face. */
    scrubberDensity?: ScrubberDensity
}

/**
 * Declared capabilities for all faces — the contract every face renders against.
 *
 * Wiring status (what physically renders today vs. what is a forward-looking
 * declaration for later phases):
 * - `fullCard`     — fully wired: SEICanvas, ScrubberCanvas, contextual menu.
 * - `miniSidebar`  — wired: ScrubberCanvas + contextual menu (no SEICanvas).
 * - `portable`     — self-contained standalone; owns its own SAPController and
 *                    ProgressBar. Canvas/scrubber hosts are declared for a later
 *                    phase, so its host capabilities stay `false` until wired to
 *                    avoid implying zones that don't render.
 * - `seaCard`      — overlay-canvas declaration for a future phase; the card
 *                    itself renders only art + inline progress today.
 * - `stickyBottom` — compact bar; deep actions live in its SAPController, so it
 *                    declares no contextual (radial) menu.
 * - `vaultRow`     — slim list row; transport + inline progress only.
 *
 * `supportsContextualActions` is the source of truth for the radial command-wheel
 * menu (`PlayerSurfaceButtons` → `SEICanvasActionMenu`). It is independent of the
 * three-dot `SAPController`, which any face may host for deep actions.
 */
export const PLAYER_FACE_CAPABILITIES: Record<PlayerFace, PlayerFaceCapability> =
    {
        fullCard: {
            supportsSEICanvas: true,
            supportsScrubberCanvas: true,
            supportsContextualActions: true,
            supportsHeroCollapse: true,
            preferredCanvasPlacement: "main",
            scrubberDensity: "standard",
        },
        portable: {
            supportsSEICanvas: true,
            supportsScrubberCanvas: true,
            // Standalone player draws its own transport/menu; no surface-button
            // contextual menu today.
            supportsContextualActions: false,
            supportsHeroCollapse: true,
            preferredCanvasPlacement: "main",
            scrubberDensity: "expanded",
        },
        seaCard: {
            supportsSEICanvas: true,
            supportsScrubberCanvas: true,
            supportsContextualActions: false,
            supportsHeroCollapse: true,
            preferredCanvasPlacement: "overlay",
            scrubberDensity: "standard",
        },
        miniSidebar: {
            supportsSEICanvas: false,
            supportsScrubberCanvas: true,
            supportsContextualActions: true,
            supportsHeroCollapse: false,
            preferredCanvasPlacement: "none",
            scrubberDensity: "compact",
        },
        stickyBottom: {
            supportsSEICanvas: false,
            supportsScrubberCanvas: true,
            supportsContextualActions: false,
            supportsHeroCollapse: false,
            preferredCanvasPlacement: "none",
            scrubberDensity: "compact",
        },
        vaultRow: {
            supportsSEICanvas: false,
            supportsScrubberCanvas: true,
            supportsContextualActions: false,
            supportsHeroCollapse: false,
            preferredCanvasPlacement: "none",
            scrubberDensity: "compact",
        },
    }

export function getFaceCapability(face: PlayerFace): PlayerFaceCapability {
    return PLAYER_FACE_CAPABILITIES[face]
}

export function faceSupportsSEICanvas(face: PlayerFace): boolean {
    return getFaceCapability(face).supportsSEICanvas
}

export function faceSupportsScrubberCanvas(face: PlayerFace): boolean {
    return getFaceCapability(face).supportsScrubberCanvas
}

export function faceSupportsContextualActions(face: PlayerFace): boolean {
    return getFaceCapability(face).supportsContextualActions
}

export function faceSupportsHeroCollapse(face: PlayerFace): boolean {
    return getFaceCapability(face).supportsHeroCollapse ?? false
}

export function getScrubberDensity(face: PlayerFace): ScrubberDensity {
    return getFaceCapability(face).scrubberDensity ?? "standard"
}

export function getPreferredCanvasPlacement(
    face: PlayerFace
): "main" | "overlay" | "none" {
    return getFaceCapability(face).preferredCanvasPlacement ?? "none"
}
