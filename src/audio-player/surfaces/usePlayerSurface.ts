import { useCallback, useMemo, useReducer } from "react"
import {
    faceSupportsContextualActions,
    faceSupportsSEICanvas,
} from "./faceCapabilities"
import type { PlayerFace } from "./faceCapabilities"
import {
    INITIAL_SURFACE_STATE,
    deriveHeroCollapsed,
    surfaceReducer,
} from "./surfaceReducer"
import type { PlayerSurfaceMode, SurfaceAction, SurfaceState } from "./surfaceReducer"

export interface UsePlayerSurfaceResult {
    mode: PlayerSurfaceMode
    isCanvasOpen: boolean
    isQueueOpen: boolean
    /**
     * Id of the plugin canvas surface currently open (e.g. "lyrics"), or `null`
     * for the generic empty canvas / non-canvas modes.
     */
    activeCanvasSurfaceId: string | null
    /** Derived: canvas open on a hero-collapse-capable face. */
    isHeroCollapsed: boolean
    /** Whether this face can host the SEICanvas at all. */
    canvasSupported: boolean
    /** Whether this face renders the contextual (radial) action menu. */
    contextualSupported: boolean
    toggleCanvas: () => void
    toggleQueue: () => void
    /** Open the SEI Canvas hosting a specific plugin surface (e.g. "lyrics"). */
    openCanvasSurface: (surfaceId: string) => void
    closeSurface: () => void
}

/**
 * React layer over the pure {@link surfaceReducer}. No effects or subscriptions,
 * so it is StrictMode-safe and the reducer stays the single source of truth.
 */
export function usePlayerSurface(face: PlayerFace): UsePlayerSurfaceResult {
    const [state, dispatch] = useReducer(
        (s: SurfaceState, action: SurfaceAction) => surfaceReducer(s, action, face),
        INITIAL_SURFACE_STATE
    )

    const toggleCanvas = useCallback(() => dispatch({ type: "toggleCanvas" }), [])
    const toggleQueue = useCallback(() => dispatch({ type: "toggleQueue" }), [])
    const openCanvasSurface = useCallback(
        (surfaceId: string) => dispatch({ type: "openCanvasSurface", surfaceId }),
        []
    )
    const closeSurface = useCallback(() => dispatch({ type: "close" }), [])

    return useMemo<UsePlayerSurfaceResult>(
        () => ({
            mode: state.mode,
            isCanvasOpen: state.mode === "canvas",
            isQueueOpen: state.mode === "queue",
            activeCanvasSurfaceId: state.activeCanvasSurfaceId,
            isHeroCollapsed: deriveHeroCollapsed(state.mode, face),
            canvasSupported: faceSupportsSEICanvas(face),
            contextualSupported: faceSupportsContextualActions(face),
            toggleCanvas,
            toggleQueue,
            openCanvasSurface,
            closeSurface,
        }),
        [
            state.mode,
            state.activeCanvasSurfaceId,
            face,
            toggleCanvas,
            toggleQueue,
            openCanvasSurface,
            closeSurface,
        ]
    )
}
